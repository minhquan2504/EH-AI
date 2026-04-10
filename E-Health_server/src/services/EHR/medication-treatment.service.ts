import { MedicationTreatmentRepository } from '../../repository/EHR/medication-treatment.repository';
import {
    MedicationRecordItem, MedicationDetailItem, CurrentMedicationItem,
    TreatmentRecordItem, TreatmentDetailItem, InteractionWarning,
    AdherenceRecord, MedicationTimelineItem, MedicationFilters, CreateAdherenceInput,
} from '../../models/EHR/medication-treatment.model';
import { MT_ERRORS, MT_CONFIG } from '../../constants/medication-treatment.constant';

export class MedicationTreatmentService {

    private static async validatePatient(patientId: string): Promise<void> {
        const exists = await MedicationTreatmentRepository.patientExists(patientId);
        if (!exists) throw new Error(MT_ERRORS.PATIENT_NOT_FOUND);
    }

    /** API 1: Lịch sử đơn thuốc */
    static async getMedicationRecords(patientId: string, filters: MedicationFilters): Promise<{ data: MedicationRecordItem[]; total: number; page: number; limit: number }> {
        await this.validatePatient(patientId);
        const page = Math.max(filters.page || MT_CONFIG.DEFAULT_PAGE, 1);
        const limit = Math.min(Math.max(filters.limit || MT_CONFIG.DEFAULT_LIMIT, 1), MT_CONFIG.MAX_LIMIT);
        const result = await MedicationTreatmentRepository.getMedicationRecords(patientId, { ...filters, page, limit });
        return { ...result, page, limit };
    }

    /** API 2: Chi tiết đơn thuốc */
    static async getMedicationDetail(patientId: string, prescriptionId: string): Promise<MedicationDetailItem> {
        await this.validatePatient(patientId);
        const header = await MedicationTreatmentRepository.getPrescriptionHeader(prescriptionId);
        if (!header) throw new Error(MT_ERRORS.PRESCRIPTION_NOT_FOUND);
        if (header.patient_id !== patientId) throw new Error(MT_ERRORS.PRESCRIPTION_NOT_BELONG);

        const drugs = await MedicationTreatmentRepository.getPrescriptionDrugs(prescriptionId);
        return { ...header, drugs };
    }

    /** API 3: Thuốc đang sử dụng */
    static async getCurrentMedications(patientId: string): Promise<CurrentMedicationItem[]> {
        await this.validatePatient(patientId);
        return MedicationTreatmentRepository.getCurrentMedications(patientId);
    }

    /** API 4: Lịch sử điều trị */
    static async getTreatmentRecords(patientId: string, filters: MedicationFilters): Promise<{ data: TreatmentRecordItem[]; total: number; page: number; limit: number }> {
        await this.validatePatient(patientId);
        const page = Math.max(filters.page || MT_CONFIG.DEFAULT_PAGE, 1);
        const limit = Math.min(Math.max(filters.limit || MT_CONFIG.DEFAULT_LIMIT, 1), MT_CONFIG.MAX_LIMIT);
        const result = await MedicationTreatmentRepository.getTreatmentRecords(patientId, { ...filters, page, limit });
        return { ...result, page, limit };
    }

    /** API 5: Chi tiết kế hoạch điều trị */
    static async getTreatmentDetail(patientId: string, planId: string): Promise<TreatmentDetailItem> {
        await this.validatePatient(patientId);
        const header = await MedicationTreatmentRepository.getTreatmentPlanHeader(planId);
        if (!header) throw new Error(MT_ERRORS.PLAN_NOT_FOUND);
        if (header.patient_id !== patientId) throw new Error(MT_ERRORS.PLAN_NOT_BELONG);

        const notes = await MedicationTreatmentRepository.getTreatmentNotes(planId);
        const follow_ups = await MedicationTreatmentRepository.getFollowUps(planId);
        return { ...header, notes, follow_ups };
    }

    /** API 6: Cảnh báo tương tác */
    static async checkInteractions(patientId: string): Promise<{ warnings: InteractionWarning[]; total_warnings: number }> {
        await this.validatePatient(patientId);
        const warnings = await MedicationTreatmentRepository.checkInteractions(patientId);
        return { warnings, total_warnings: warnings.length };
    }

    /** API 7: Ghi nhận tuân thủ */
    static async createAdherence(patientId: string, userId: string, data: CreateAdherenceInput): Promise<AdherenceRecord> {
        await this.validatePatient(patientId);

        if (!data.prescription_detail_id) throw new Error(MT_ERRORS.DETAIL_ID_REQUIRED);
        if (!data.adherence_date) throw new Error(MT_ERRORS.ADHERENCE_DATE_REQUIRED);

        const belongs = await MedicationTreatmentRepository.prescriptionDetailBelongsToPatient(data.prescription_detail_id, patientId);
        if (!belongs) throw new Error(MT_ERRORS.DETAIL_NOT_FOUND);

        return MedicationTreatmentRepository.createAdherence(patientId, data, userId);
    }

    /** API 8: Lịch sử tuân thủ */
    static async getAdherenceRecords(patientId: string, fromDate?: string, toDate?: string): Promise<{ records: AdherenceRecord[]; stats: { total: number; taken: number; skipped: number; adherence_rate: number } }> {
        await this.validatePatient(patientId);
        const records = await MedicationTreatmentRepository.getAdherenceRecords(patientId, fromDate, toDate);

        const total = records.length;
        const taken = records.filter(r => r.taken).length;
        const skipped = total - taken;
        const adherence_rate = total > 0 ? Math.round((taken / total) * 100) : 0;

        return { records, stats: { total, taken, skipped, adherence_rate } };
    }

    /** API 9: Timeline */
    static async getTimeline(patientId: string): Promise<MedicationTimelineItem[]> {
        await this.validatePatient(patientId);
        return MedicationTreatmentRepository.getTimeline(patientId);
    }
}
