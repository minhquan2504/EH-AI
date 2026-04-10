import { DiagnosisRepository } from '../../repository/EMR/diagnosis.repository';
import { pool } from '../../config/postgresdb';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import {
    DIAGNOSIS_TYPE,
    DIAGNOSIS_ERRORS,
    DIAGNOSIS_CONFIG,
    VALID_TYPE_TRANSITIONS,
} from '../../constants/diagnosis.constant';
import { ENCOUNTER_EDITABLE_STATUSES } from '../../constants/encounter.constant';
import {
    DiagnosisRecord,
    CreateDiagnosisInput,
    UpdateDiagnosisInput,
    ICDSearchResult,
    EncounterConclusion,
} from '../../models/EMR/diagnosis.model';

/** Danh sách giá trị diagnosis_type hợp lệ */
const VALID_TYPES = Object.values(DIAGNOSIS_TYPE);

export class DiagnosisService {

    /**
     * Thêm chẩn đoán mới cho encounter.
     * Transaction: kiểm tra PRIMARY + INSERT — tránh race condition.
     */
    static async create(encounterId: string, data: CreateDiagnosisInput, userId: string): Promise<DiagnosisRecord> {
        await this.validateEncounterEditable(encounterId);

        /** Validate input bắt buộc */
        if (!data.icd10_code?.trim()) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_ICD_CODE', DIAGNOSIS_ERRORS.MISSING_ICD_CODE);
        }
        if (!data.diagnosis_name?.trim()) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DIAGNOSIS_NAME', DIAGNOSIS_ERRORS.MISSING_DIAGNOSIS_NAME);
        }

        /** Validate diagnosis_type nếu có */
        const diagType = data.diagnosis_type || DIAGNOSIS_TYPE.PRELIMINARY;
        if (!VALID_TYPES.includes(diagType as any)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_DIAGNOSIS_TYPE', DIAGNOSIS_ERRORS.INVALID_DIAGNOSIS_TYPE);
        }

        /** Transaction: check PRIMARY + INSERT */
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            if (diagType === DIAGNOSIS_TYPE.PRIMARY) {
                const existingPrimary = await DiagnosisRepository.findPrimaryByEncounterId(encounterId, client);
                if (existingPrimary) {
                    throw new AppError(HTTP_STATUS.CONFLICT, 'PRIMARY_ALREADY_EXISTS', DIAGNOSIS_ERRORS.PRIMARY_ALREADY_EXISTS);
                }
            }

            const record = await DiagnosisRepository.create(encounterId, { ...data, diagnosis_type: diagType }, userId, client);

            await client.query('COMMIT');
            return (await DiagnosisRepository.findById(record.encounter_diagnoses_id))!;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Lấy tất cả chẩn đoán active của encounter
     */
    static async getByEncounterId(encounterId: string): Promise<DiagnosisRecord[]> {
        const encounter = await DiagnosisRepository.getEncounterStatus(encounterId);
        if (!encounter.exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'ENCOUNTER_NOT_FOUND', DIAGNOSIS_ERRORS.ENCOUNTER_NOT_FOUND);
        }
        return DiagnosisRepository.findByEncounterId(encounterId);
    }

    /**
     * Cập nhật nội dung chẩn đoán (không cho sửa diagnosis_type — dùng API riêng)
     */
    static async update(diagnosisId: string, data: UpdateDiagnosisInput): Promise<DiagnosisRecord> {
        const record = await this.getActiveDiagnosis(diagnosisId);
        await this.validateEncounterEditable(record.encounter_id);

        const updated = await DiagnosisRepository.update(diagnosisId, data);
        return (await DiagnosisRepository.findById(diagnosisId))!;
    }

    /**
     * Soft delete chẩn đoán
     */
    static async delete(diagnosisId: string): Promise<void> {
        const record = await this.getActiveDiagnosis(diagnosisId);
        await this.validateEncounterEditable(record.encounter_id);

        await DiagnosisRepository.softDelete(diagnosisId);
    }

    /**
     * Chuyển loại chẩn đoán (ví dụ: PRELIMINARY → PRIMARY / FINAL).
     */
    static async changeType(diagnosisId: string, newType: string): Promise<DiagnosisRecord> {
        if (!newType?.trim()) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_NEW_TYPE', DIAGNOSIS_ERRORS.MISSING_NEW_TYPE);
        }
        if (!VALID_TYPES.includes(newType as any)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_DIAGNOSIS_TYPE', DIAGNOSIS_ERRORS.INVALID_DIAGNOSIS_TYPE);
        }

        const record = await this.getActiveDiagnosis(diagnosisId);
        await this.validateEncounterEditable(record.encounter_id);

        /** Kiểm tra chuyển loại hợp lệ */
        const allowedTransitions = VALID_TYPE_TRANSITIONS[record.diagnosis_type];
        if (!allowedTransitions || !allowedTransitions.includes(newType)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_TYPE_TRANSITION', DIAGNOSIS_ERRORS.INVALID_TYPE_TRANSITION);
        }

        /** Transaction: check PRIMARY + UPDATE */
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            if (newType === DIAGNOSIS_TYPE.PRIMARY) {
                const existingPrimary = await DiagnosisRepository.findPrimaryByEncounterId(record.encounter_id, client);
                if (existingPrimary && existingPrimary.encounter_diagnoses_id !== diagnosisId) {
                    throw new AppError(HTTP_STATUS.CONFLICT, 'PRIMARY_ALREADY_EXISTS', DIAGNOSIS_ERRORS.PRIMARY_ALREADY_EXISTS);
                }
            }

            await DiagnosisRepository.updateType(diagnosisId, newType, client);

            await client.query('COMMIT');
            return (await DiagnosisRepository.findById(diagnosisId))!;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Ghi / cập nhật kết luận khám
     */
    static async setConclusion(encounterId: string, conclusion: string): Promise<EncounterConclusion> {
        if (!conclusion?.trim()) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_CONCLUSION', DIAGNOSIS_ERRORS.MISSING_CONCLUSION);
        }
        await this.validateEncounterEditable(encounterId);

        await DiagnosisRepository.updateConclusion(encounterId, conclusion);
        return (await DiagnosisRepository.getConclusion(encounterId))!;
    }

    /**
     * Lấy kết luận khám
     */
    static async getConclusion(encounterId: string): Promise<EncounterConclusion> {
        const encounter = await DiagnosisRepository.getEncounterStatus(encounterId);
        if (!encounter.exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'ENCOUNTER_NOT_FOUND', DIAGNOSIS_ERRORS.ENCOUNTER_NOT_FOUND);
        }
        return (await DiagnosisRepository.getConclusion(encounterId))!;
    }

    /**
     * Lịch sử chẩn đoán theo bệnh nhân
     */
    static async getByPatientId(
        patientId: string,
        page: number,
        limit: number,
        icd10Code?: string,
        fromDate?: string,
        toDate?: string
    ): Promise<{ data: DiagnosisRecord[]; total: number; page: number; limit: number; totalPages: number }> {
        const patientExists = await DiagnosisRepository.patientExists(patientId);
        if (!patientExists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'PATIENT_NOT_FOUND', DIAGNOSIS_ERRORS.PATIENT_NOT_FOUND);
        }

        const safeLimit = Math.min(limit || DIAGNOSIS_CONFIG.DEFAULT_LIMIT, DIAGNOSIS_CONFIG.MAX_LIMIT);
        const result = await DiagnosisRepository.findByPatientId(patientId, page, safeLimit, icd10Code, fromDate, toDate);

        return {
            ...result,
            page,
            limit: safeLimit,
            totalPages: Math.ceil(result.total / safeLimit),
        };
    }

    /**
     * Tìm kiếm mã ICD-10
     */
    static async searchICD(query: string): Promise<ICDSearchResult[]> {
        if (!query?.trim()) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_SEARCH_QUERY', DIAGNOSIS_ERRORS.MISSING_SEARCH_QUERY);
        }
        return DiagnosisRepository.searchICD(query.trim());
    }

    // ─── Helpers ───────────────────────────────────────────────

    /**
     * Kiểm tra encounter tồn tại và ở trạng thái cho phép
     */
    private static async validateEncounterEditable(encounterId: string): Promise<void> {
        const encounter = await DiagnosisRepository.getEncounterStatus(encounterId);
        if (!encounter.exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'ENCOUNTER_NOT_FOUND', DIAGNOSIS_ERRORS.ENCOUNTER_NOT_FOUND);
        }
        if (!(ENCOUNTER_EDITABLE_STATUSES as readonly string[]).includes(encounter.status!)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'ENCOUNTER_NOT_EDITABLE', DIAGNOSIS_ERRORS.ENCOUNTER_NOT_EDITABLE);
        }
    }

    /**
     * Lấy chẩn đoán active hoặc throw lỗi
     */
    private static async getActiveDiagnosis(diagnosisId: string): Promise<DiagnosisRecord> {
        const record = await DiagnosisRepository.findById(diagnosisId);
        if (!record || !record.is_active) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', DIAGNOSIS_ERRORS.NOT_FOUND);
        }
        return record;
    }
}
