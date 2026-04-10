import { ClinicalResultsRepository } from '../../repository/EHR/clinical-results.repository';
import {
    ClinicalResultItem, ClinicalResultDetail, TrendDataPoint,
    ClinicalResultsSummary, AttachmentItem, AbnormalResultItem,
    ClinicalResultFilters,
} from '../../models/EHR/clinical-results.model';
import { CR_ERRORS, CR_CONFIG } from '../../constants/clinical-results.constant';

/**
 * Service cho module Clinical Results EHR (6.4)
 * Validation + delegation cho 7 API read-only
 */
export class ClinicalResultsService {

    /** Validate bệnh nhân tồn tại */
    private static async validatePatient(patientId: string): Promise<void> {
        const exists = await ClinicalResultsRepository.patientExists(patientId);
        if (!exists) throw new Error(CR_ERRORS.PATIENT_NOT_FOUND);
    }

    /** API 1: Danh sách kết quả */
    static async getResults(patientId: string, filters: ClinicalResultFilters): Promise<{ data: ClinicalResultItem[]; total: number; page: number; limit: number }> {
        await this.validatePatient(patientId);

        const page = Math.max(filters.page || CR_CONFIG.DEFAULT_PAGE, 1);
        const limit = Math.min(Math.max(filters.limit || CR_CONFIG.DEFAULT_LIMIT, 1), CR_CONFIG.MAX_LIMIT);

        const result = await ClinicalResultsRepository.getResults(patientId, { ...filters, page, limit });
        return { ...result, page, limit };
    }

    /** API 2: Chi tiết kết quả */
    static async getResultDetail(patientId: string, orderId: string): Promise<ClinicalResultDetail> {
        await this.validatePatient(patientId);

        const detail = await ClinicalResultsRepository.getResultDetail(orderId);
        if (!detail) throw new Error(CR_ERRORS.ORDER_NOT_FOUND);
        if (detail.patient_id !== patientId) throw new Error(CR_ERRORS.ORDER_NOT_BELONG);

        return detail;
    }

    /** API 3: Kết quả theo encounter */
    static async getResultsByEncounter(patientId: string, encounterId: string): Promise<ClinicalResultItem[]> {
        await this.validatePatient(patientId);

        const belongs = await ClinicalResultsRepository.encounterBelongsToPatient(encounterId, patientId);
        if (!belongs) throw new Error(CR_ERRORS.ENCOUNTER_NOT_BELONG);

        return ClinicalResultsRepository.getResultsByEncounter(encounterId);
    }

    /** API 4: Xu hướng theo service_code */
    static async getTrends(patientId: string, serviceCode: string): Promise<{ service_code: string; data_points: TrendDataPoint[] }> {
        await this.validatePatient(patientId);

        if (!serviceCode?.trim()) throw new Error(CR_ERRORS.SERVICE_CODE_REQUIRED);

        const dataPoints = await ClinicalResultsRepository.getTrends(patientId, serviceCode);
        return { service_code: serviceCode, data_points: dataPoints };
    }

    /** API 5: Thống kê tổng quan */
    static async getSummary(patientId: string): Promise<ClinicalResultsSummary> {
        await this.validatePatient(patientId);
        return ClinicalResultsRepository.getSummary(patientId);
    }

    /** API 6: Danh sách file đính kèm */
    static async getAttachments(patientId: string): Promise<AttachmentItem[]> {
        await this.validatePatient(patientId);
        return ClinicalResultsRepository.getAttachments(patientId);
    }

    /** API 7: Kết quả bất thường */
    static async getAbnormalResults(patientId: string): Promise<AbnormalResultItem[]> {
        await this.validatePatient(patientId);
        return ClinicalResultsRepository.getAbnormalResults(patientId);
    }
}
