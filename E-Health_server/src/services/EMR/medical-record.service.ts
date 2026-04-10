import { MedicalRecordRepository } from '../../repository/EMR/medical-record.repository';
import { pool } from '../../config/postgresdb';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import {
    COMPLETENESS_WEIGHTS,
    MIN_COMPLETENESS_SCORE,
    COMPLETENESS_STATUS,
    TIMELINE_EVENT_TYPE,
    MEDICAL_RECORD_CONFIG,
    MEDICAL_RECORD_ERRORS,
} from '../../constants/medical-record.constant';
import {
    FullMedicalRecord,
    CompletenessResult,
    CompletenessItem,
    PatientStatistics,
    SnapshotFull,
    FinalizeInput,
    SignInput,
    PatientRecordItem,
    TimelineEvent,
    SearchRecordItem,
} from '../../models/EMR/medical-record.model';


export class MedicalRecordService {

    //  Bệnh án đầy đủ
    /**
     * Tổng hợp toàn bộ dữ liệu encounter thành 1 bệnh án hoàn chỉnh.
     * Query song song 7 bảng con để tối ưu hiệu suất.
     */
    static async getFullRecord(encounterId: string): Promise<FullMedicalRecord> {
        const encounter = await MedicalRecordRepository.getEncounterInfo(encounterId);
        if (!encounter) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', MEDICAL_RECORD_ERRORS.ENCOUNTER_NOT_FOUND);
        }

        const [clinicalExam, diagnoses, medicalOrders, prescription, signature, snapshot] = await Promise.all([
            MedicalRecordRepository.getClinicalExamination(encounterId),
            MedicalRecordRepository.getDiagnoses(encounterId),
            MedicalRecordRepository.getMedicalOrders(encounterId),
            MedicalRecordRepository.getPrescription(encounterId),
            MedicalRecordRepository.getSignature(encounterId),
            MedicalRecordRepository.getSnapshotMeta(encounterId),
        ]);

        const completeness = this.calculateCompleteness(clinicalExam, diagnoses, medicalOrders, prescription, encounter.notes);

        return {
            encounter,
            clinical_examination: clinicalExam,
            diagnoses,
            medical_orders: medicalOrders,
            prescription,
            signature,
            snapshot,
            is_finalized: encounter.is_finalized || false,
            completeness,
        };
    }

    //Kiểm tra tính đầy đủ
    static async getCompleteness(encounterId: string): Promise<CompletenessResult> {
        const encounter = await MedicalRecordRepository.getEncounterInfo(encounterId);
        if (!encounter) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', MEDICAL_RECORD_ERRORS.ENCOUNTER_NOT_FOUND);
        }

        const [clinicalExam, diagnoses, medicalOrders, prescription] = await Promise.all([
            MedicalRecordRepository.getClinicalExamination(encounterId),
            MedicalRecordRepository.getDiagnoses(encounterId),
            MedicalRecordRepository.getMedicalOrders(encounterId),
            MedicalRecordRepository.getPrescription(encounterId),
        ]);

        return this.calculateCompleteness(clinicalExam, diagnoses, medicalOrders, prescription, encounter.notes);
    }

    // Hoàn tất bệnh án (Finalize)
    /**
     * Khóa bệnh án: tạo snapshot JSONB, đánh dấu finalized, ghi timeline event.
     * Transaction: snapshot + mark finalized + timeline.
     */
    static async finalize(encounterId: string, userId: string, data: FinalizeInput): Promise<FullMedicalRecord> {
        const encounter = await MedicalRecordRepository.getEncounterInfo(encounterId);
        if (!encounter) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', MEDICAL_RECORD_ERRORS.ENCOUNTER_NOT_FOUND);
        }

        /** Phải ở trạng thái COMPLETED */
        if (encounter.status !== 'COMPLETED') {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'NOT_COMPLETED', MEDICAL_RECORD_ERRORS.NOT_COMPLETED);
        }

        /** Chưa finalize trước đó */
        if (encounter.is_finalized) {
            throw new AppError(HTTP_STATUS.CONFLICT, 'ALREADY_FINALIZED', MEDICAL_RECORD_ERRORS.ALREADY_FINALIZED);
        }

        /** Thu thập data để tính completeness */
        const [clinicalExam, diagnoses, medicalOrders, prescription] = await Promise.all([
            MedicalRecordRepository.getClinicalExamination(encounterId),
            MedicalRecordRepository.getDiagnoses(encounterId),
            MedicalRecordRepository.getMedicalOrders(encounterId),
            MedicalRecordRepository.getPrescription(encounterId),
        ]);

        const completeness = this.calculateCompleteness(clinicalExam, diagnoses, medicalOrders, prescription, encounter.notes);

        /** Kiểm tra completeness tối thiểu */
        if (completeness.score < MIN_COMPLETENESS_SCORE) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'COMPLETENESS_TOO_LOW', MEDICAL_RECORD_ERRORS.COMPLETENESS_TOO_LOW);
        }

        /** Tạo snapshot data */
        const snapshotData = {
            encounter,
            clinical_examination: clinicalExam,
            diagnoses,
            medical_orders: medicalOrders,
            prescription,
            completeness,
            finalized_at: new Date().toISOString(),
        };

        /** Transaction: snapshot + mark + timeline */
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await MedicalRecordRepository.createSnapshot(
                encounterId, encounter.patient_id, encounter.encounter_type,
                snapshotData, userId, data.notes || null, client
            );

            await MedicalRecordRepository.markFinalized(encounterId, client);

            await MedicalRecordRepository.addTimelineEvent(
                encounter.patient_id,
                new Date().toISOString(),
                TIMELINE_EVENT_TYPE.EMR_FINALIZED,
                `Hoàn tất bệnh án — ${encounter.encounter_type}`,
                `BS: ${encounter.doctor_name || 'N/A'}, Score: ${completeness.score}%`,
                encounterId,
                'encounters',
                client
            );

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

        return this.getFullRecord(encounterId);
    }

    // Ký số bệnh án
    /**
     * Ký xác nhận bệnh án đã finalize.
     * Tạo SHA-256 hash từ snapshot, ghi emr_signatures + timeline event.
     */
    static async sign(encounterId: string, userId: string, data: SignInput, clientIp: string | null): Promise<FullMedicalRecord> {
        const encounter = await MedicalRecordRepository.getEncounterInfo(encounterId);
        if (!encounter) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', MEDICAL_RECORD_ERRORS.ENCOUNTER_NOT_FOUND);
        }

        /** Phải đã finalize */
        if (!encounter.is_finalized) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'NOT_FINALIZED', MEDICAL_RECORD_ERRORS.NOT_FINALIZED);
        }

        /** Chưa ký trước đó */
        const existingSig = await MedicalRecordRepository.getSignature(encounterId);
        if (existingSig) {
            throw new AppError(HTTP_STATUS.CONFLICT, 'ALREADY_SIGNED', MEDICAL_RECORD_ERRORS.ALREADY_SIGNED);
        }

        /** Lấy snapshot để tạo hash */
        const snapshot = await MedicalRecordRepository.getSnapshotFull(encounterId);
        if (!snapshot) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SNAPSHOT_NOT_FOUND', MEDICAL_RECORD_ERRORS.SNAPSHOT_NOT_FOUND);
        }

        const signatureHash = MedicalRecordRepository.generateSignatureHash(snapshot.snapshot_data);

        /** Transaction: signature + timeline */
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await MedicalRecordRepository.createSignature(
                encounterId, userId, signatureHash,
                data.certificate_serial || null, clientIp, client
            );

            await MedicalRecordRepository.addTimelineEvent(
                encounter.patient_id,
                new Date().toISOString(),
                TIMELINE_EVENT_TYPE.EMR_SIGNED,
                `Ký số bệnh án — ${encounter.encounter_type}`,
                `Hash: ${signatureHash.substring(0, 16)}...`,
                encounterId,
                'emr_signatures',
                client
            );

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

        return this.getFullRecord(encounterId);
    }

    //DS bệnh án theo bệnh nhân
    static async getPatientRecords(
        patientId: string,
        page: number, limit: number,
        recordType?: string, isFinalized?: boolean,
        fromDate?: string, toDate?: string
    ): Promise<{ data: PatientRecordItem[]; total: number; page: number; limit: number; totalPages: number }> {
        const exists = await MedicalRecordRepository.patientExists(patientId);
        if (!exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'PATIENT_NOT_FOUND', MEDICAL_RECORD_ERRORS.PATIENT_NOT_FOUND);
        }

        const safeLimit = Math.min(limit || MEDICAL_RECORD_CONFIG.DEFAULT_LIMIT, MEDICAL_RECORD_CONFIG.MAX_LIMIT);
        const safePage = page || MEDICAL_RECORD_CONFIG.DEFAULT_PAGE;
        const result = await MedicalRecordRepository.getPatientRecords(patientId, safePage, safeLimit, recordType, isFinalized, fromDate, toDate);

        return {
            ...result,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.ceil(result.total / safeLimit),
        };
    }

    // Dòng thời gian y tế
    static async getTimeline(
        patientId: string,
        fromDate?: string, toDate?: string,
        eventType?: string, limit?: number
    ): Promise<TimelineEvent[]> {
        const exists = await MedicalRecordRepository.patientExists(patientId);
        if (!exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'PATIENT_NOT_FOUND', MEDICAL_RECORD_ERRORS.PATIENT_NOT_FOUND);
        }

        return MedicalRecordRepository.getTimeline(
            patientId, fromDate, toDate, eventType,
            limit || MEDICAL_RECORD_CONFIG.TIMELINE_DEFAULT_LIMIT
        );
    }

    // Thống kê xuyên encounter
    static async getStatistics(patientId: string): Promise<PatientStatistics> {
        const exists = await MedicalRecordRepository.patientExists(patientId);
        if (!exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'PATIENT_NOT_FOUND', MEDICAL_RECORD_ERRORS.PATIENT_NOT_FOUND);
        }

        const [counts, byType, byYear, topDiagnoses, topDrugs, lastEnc, vitalsTrend] = await Promise.all([
            MedicalRecordRepository.getEncounterCounts(patientId),
            MedicalRecordRepository.getEncountersByType(patientId),
            MedicalRecordRepository.getEncountersByYear(patientId),
            MedicalRecordRepository.getTopDiagnoses(patientId, MEDICAL_RECORD_CONFIG.TOP_DIAGNOSES_LIMIT),
            MedicalRecordRepository.getTopDrugs(patientId, MEDICAL_RECORD_CONFIG.TOP_DRUGS_LIMIT),
            MedicalRecordRepository.getLastEncounter(patientId),
            MedicalRecordRepository.getVitalSignsTrend(patientId),
        ]);

        return {
            total_encounters: counts.total,
            total_finalized: counts.finalized,
            encounters_by_type: byType,
            encounters_by_year: byYear,
            top_diagnoses: topDiagnoses,
            top_drugs: topDrugs,
            last_encounter: lastEnc,
            vital_signs_trend: vitalsTrend,
        };
    }

    // Xem snapshot
    static async getSnapshot(encounterId: string): Promise<SnapshotFull> {
        const snapshot = await MedicalRecordRepository.getSnapshotFull(encounterId);
        if (!snapshot) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SNAPSHOT_NOT_FOUND', MEDICAL_RECORD_ERRORS.SNAPSHOT_NOT_FOUND);
        }
        return snapshot;
    }

    // Xuất bệnh án
    /**
     * Nếu đã finalize → trả snapshot. Nếu chưa → tổng hợp real-time.
     */
    static async exportRecord(encounterId: string): Promise<any> {
        const encounter = await MedicalRecordRepository.getEncounterInfo(encounterId);
        if (!encounter) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', MEDICAL_RECORD_ERRORS.ENCOUNTER_NOT_FOUND);
        }

        if (encounter.is_finalized) {
            const snapshot = await MedicalRecordRepository.getSnapshotFull(encounterId);
            if (snapshot) {
                return {
                    source: 'SNAPSHOT',
                    record_type: snapshot.record_type,
                    finalized_at: snapshot.finalized_at,
                    finalized_by: snapshot.finalizer_name,
                    data: snapshot.snapshot_data,
                };
            }
        }

        /** Chưa finalize → real-time */
        const fullRecord = await this.getFullRecord(encounterId);
        return {
            source: 'REALTIME',
            record_type: encounter.encounter_type,
            data: fullRecord,
        };
    }

    // Tìm kiếm bệnh án nâng cao
    static async searchRecords(
        keyword?: string, icd10Code?: string, doctorId?: string,
        recordType?: string, isFinalized?: boolean,
        fromDate?: string, toDate?: string,
        page?: number, limit?: number
    ): Promise<{ data: SearchRecordItem[]; total: number; page: number; limit: number; totalPages: number }> {
        const safeLimit = Math.min(limit || MEDICAL_RECORD_CONFIG.DEFAULT_LIMIT, MEDICAL_RECORD_CONFIG.MAX_LIMIT);
        const safePage = page || MEDICAL_RECORD_CONFIG.DEFAULT_PAGE;

        const result = await MedicalRecordRepository.searchRecords(
            keyword, icd10Code, doctorId, recordType, isFinalized,
            fromDate, toDate, safePage, safeLimit
        );

        return {
            ...result,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.ceil(result.total / safeLimit),
        };
    }

    //  PRIVATE HELPERS 
    /**
     * Tính điểm completeness theo trọng số, trả về score + chi tiết từng mục.
     */
    private static calculateCompleteness(
        clinicalExam: any,
        diagnoses: any[],
        medicalOrders: any[],
        prescription: any,
        notes: string | null
    ): CompletenessResult {
        const details: CompletenessItem[] = [];
        let earnedScore = 0;

        /** 1. Sinh hiệu + Khám lâm sàng (25%) */
        if (clinicalExam) {
            details.push({ item: 'clinical_examination', status: COMPLETENESS_STATUS.COMPLETED, weight: COMPLETENESS_WEIGHTS.CLINICAL_EXAMINATION });
            earnedScore += COMPLETENESS_WEIGHTS.CLINICAL_EXAMINATION;
        } else {
            details.push({ item: 'clinical_examination', status: COMPLETENESS_STATUS.MISSING, weight: COMPLETENESS_WEIGHTS.CLINICAL_EXAMINATION });
        }

        /** 2. Chẩn đoán chính (25%) */
        const hasPrimary = diagnoses.some((d: any) => d.diagnosis_type === 'PRIMARY');
        if (hasPrimary) {
            details.push({ item: 'diagnosis_primary', status: COMPLETENESS_STATUS.COMPLETED, weight: COMPLETENESS_WEIGHTS.DIAGNOSIS_PRIMARY });
            earnedScore += COMPLETENESS_WEIGHTS.DIAGNOSIS_PRIMARY;
        } else if (diagnoses.length > 0) {
            details.push({ item: 'diagnosis_primary', status: COMPLETENESS_STATUS.PARTIAL, weight: COMPLETENESS_WEIGHTS.DIAGNOSIS_PRIMARY, note: 'Có chẩn đoán nhưng thiếu PRIMARY' });
            earnedScore += Math.floor(COMPLETENESS_WEIGHTS.DIAGNOSIS_PRIMARY / 2);
        } else {
            details.push({ item: 'diagnosis_primary', status: COMPLETENESS_STATUS.MISSING, weight: COMPLETENESS_WEIGHTS.DIAGNOSIS_PRIMARY });
        }

        /** 3. Đơn thuốc (20%) */
        if (prescription && prescription.status === 'PRESCRIBED') {
            details.push({ item: 'prescription', status: COMPLETENESS_STATUS.COMPLETED, weight: COMPLETENESS_WEIGHTS.PRESCRIPTION });
            earnedScore += COMPLETENESS_WEIGHTS.PRESCRIPTION;
        } else if (prescription) {
            details.push({ item: 'prescription', status: COMPLETENESS_STATUS.PARTIAL, weight: COMPLETENESS_WEIGHTS.PRESCRIPTION, note: `Đơn ở trạng thái ${prescription.status}` });
            earnedScore += Math.floor(COMPLETENESS_WEIGHTS.PRESCRIPTION / 2);
        } else {
            details.push({ item: 'prescription', status: COMPLETENESS_STATUS.MISSING, weight: COMPLETENESS_WEIGHTS.PRESCRIPTION });
        }

        /** 4. Chỉ định CLS + Kết quả (15%) */
        if (medicalOrders.length === 0) {
            details.push({ item: 'medical_orders_results', status: COMPLETENESS_STATUS.NOT_APPLICABLE, weight: COMPLETENESS_WEIGHTS.MEDICAL_ORDERS_RESULTS, note: 'Không có chỉ định CLS' });
            earnedScore += COMPLETENESS_WEIGHTS.MEDICAL_ORDERS_RESULTS;
        } else {
            const completed = medicalOrders.filter((o: any) => o.result_summary !== null).length;
            if (completed === medicalOrders.length) {
                details.push({ item: 'medical_orders_results', status: COMPLETENESS_STATUS.COMPLETED, weight: COMPLETENESS_WEIGHTS.MEDICAL_ORDERS_RESULTS });
                earnedScore += COMPLETENESS_WEIGHTS.MEDICAL_ORDERS_RESULTS;
            } else {
                const ratio = completed / medicalOrders.length;
                details.push({
                    item: 'medical_orders_results', status: COMPLETENESS_STATUS.PARTIAL,
                    weight: COMPLETENESS_WEIGHTS.MEDICAL_ORDERS_RESULTS,
                    note: `${completed}/${medicalOrders.length} có kết quả`
                });
                earnedScore += Math.floor(COMPLETENESS_WEIGHTS.MEDICAL_ORDERS_RESULTS * ratio);
            }
        }

        /** 5. Ghi chú BS (15%) */
        if (notes && notes.trim().length > 0) {
            details.push({ item: 'doctor_notes', status: COMPLETENESS_STATUS.COMPLETED, weight: COMPLETENESS_WEIGHTS.DOCTOR_NOTES });
            earnedScore += COMPLETENESS_WEIGHTS.DOCTOR_NOTES;
        } else {
            details.push({ item: 'doctor_notes', status: COMPLETENESS_STATUS.MISSING, weight: COMPLETENESS_WEIGHTS.DOCTOR_NOTES });
        }

        const completedItems = details.filter(d => d.status === COMPLETENESS_STATUS.COMPLETED || d.status === COMPLETENESS_STATUS.NOT_APPLICABLE).length;

        return {
            score: earnedScore,
            total_items: details.length,
            completed_items: completedItems,
            details,
        };
    }
}
