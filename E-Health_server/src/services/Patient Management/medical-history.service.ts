import { MedicalHistoryRepository } from '../../repository/Patient Management/medical-history.repository';
import {
    EncounterDetail,
    EncounterListItem,
    PaginatedEncounters,
    TimelineEvent,
    PatientMedicalSummary
} from '../../models/Patient Management/medical-history.model';
import {
    MEDICAL_HISTORY_ERRORS,
    MEDICAL_HISTORY_CONFIG
} from '../../constants/medical-history.constant';

export class MedicalHistoryService {
    /**
     * Lấy danh sách lượt khám có phân trang và filter
     */
    static async getEncounters(
        patientId?: string,
        doctorId?: string,
        encounterType?: string,
        status?: string,
        from?: string,
        to?: string,
        page: number = MEDICAL_HISTORY_CONFIG.DEFAULT_PAGE,
        limit: number = MEDICAL_HISTORY_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedEncounters> {
        if (from && to && new Date(from) > new Date(to)) {
            throw MEDICAL_HISTORY_ERRORS.INVALID_DATE_RANGE;
        }
        const safeLimit = Math.min(limit, MEDICAL_HISTORY_CONFIG.MAX_LIMIT);
        return await MedicalHistoryRepository.getEncounters(
            patientId, doctorId, encounterType, status, from, to, page, safeLimit
        );
    }

    /**
     * Lấy chi tiết đầy đủ lượt khám — bao gồm sinh hiệu, chẩn đoán, đơn thuốc, chỉ định CLS
     */
    static async getEncounterDetail(encounterId: string): Promise<EncounterDetail> {
        const encounter = await MedicalHistoryRepository.getEncounterBasic(encounterId);
        if (!encounter) {
            throw MEDICAL_HISTORY_ERRORS.ENCOUNTER_NOT_FOUND;
        }

        /** Truy vấn song song các bảng con để tối ưu hiệu suất */
        const [clinicalExam, diagnoses, prescription, medicalOrders] = await Promise.all([
            MedicalHistoryRepository.getClinicalExamination(encounterId),
            MedicalHistoryRepository.getDiagnoses(encounterId),
            MedicalHistoryRepository.getPrescription(encounterId),
            MedicalHistoryRepository.getMedicalOrders(encounterId),
        ]);

        return {
            ...encounter,
            clinical_examination: clinicalExam,
            diagnoses,
            prescription,
            medical_orders: medicalOrders,
        };
    }

    /**
     * Tra cứu nhanh lần khám gần nhất của bệnh nhân
     */
    static async getLatestEncounter(patientId: string): Promise<EncounterListItem> {
        const exists = await MedicalHistoryRepository.checkPatientExists(patientId);
        if (!exists) {
            throw MEDICAL_HISTORY_ERRORS.PATIENT_NOT_FOUND;
        }

        const encounter = await MedicalHistoryRepository.getLatestEncounter(patientId);
        if (!encounter) {
            throw MEDICAL_HISTORY_ERRORS.ENCOUNTER_NOT_FOUND;
        }
        return encounter;
    }

    /**
     * Xem dòng thời gian sức khỏe của bệnh nhân theo khoảng thời gian
     */
    static async getTimeline(
        patientId: string,
        from?: string,
        to?: string,
        limit: number = MEDICAL_HISTORY_CONFIG.TIMELINE_DEFAULT_LIMIT
    ): Promise<TimelineEvent[]> {
        const exists = await MedicalHistoryRepository.checkPatientExists(patientId);
        if (!exists) {
            throw MEDICAL_HISTORY_ERRORS.PATIENT_NOT_FOUND;
        }

        if (from && to && new Date(from) > new Date(to)) {
            throw MEDICAL_HISTORY_ERRORS.INVALID_DATE_RANGE;
        }

        return await MedicalHistoryRepository.getTimeline(patientId, from, to, limit);
    }

    /**
     * Tổng hợp lịch sử khám bệnh nhân (số lần khám, chẩn đoán gần nhất, đơn thuốc gần nhất…)
     */
    static async getPatientSummary(patientId: string): Promise<PatientMedicalSummary> {
        const exists = await MedicalHistoryRepository.checkPatientExists(patientId);
        if (!exists) {
            throw MEDICAL_HISTORY_ERRORS.PATIENT_NOT_FOUND;
        }
        return await MedicalHistoryRepository.getPatientSummary(patientId);
    }
}
