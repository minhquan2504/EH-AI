import { TeleResultRepository } from '../../repository/Remote Consultation/tele-result.repository';
import {
    TeleResultInput, SymptomsInput, SelfReportedVitalsInput,
    ReferralInput, FollowUpInput, ResultFilter,
} from '../../models/Remote Consultation/tele-result.model';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import {
    TELE_RESULT_STATUS, TELE_RESULT_ERRORS, TELE_RESULT_SUCCESS,
    REMOTE_CONSULTATION_CONFIG,
} from '../../constants/remote-consultation.constant';
import { v4 as uuidv4 } from 'uuid';

/**
 * Business Logic Layer cho ghi nhận kết quả khám từ xa
 * Lifecycle: DRAFT → COMPLETED → SIGNED (immutable)
 */
export class TeleResultService {

    // ═══════════════════════════════════════════════════
    // NHÓM 1: GHI NHẬN KẾT QUẢ
    // ═══════════════════════════════════════════════════

    /**
     * Tạo kết quả DRAFT cho phiên tư vấn
     * 1 phiên = 1 kết quả (UNIQUE)
     */
    static async createResult(consultationId: string, input: TeleResultInput, userId: string): Promise<any> {
        const consultation = await this.getConsultationOrThrow(consultationId);

        // Kiểm tra đã có kết quả chưa
        const existing = await TeleResultRepository.findByConsultationId(consultationId);
        if (existing) {
            throw new AppError(HTTP_STATUS.CONFLICT, TELE_RESULT_ERRORS.RESULT_ALREADY_EXISTS.code, TELE_RESULT_ERRORS.RESULT_ALREADY_EXISTS.message);
        }

        const resultId = `TRES_${uuidv4().substring(0, 12)}`;
        await TeleResultRepository.createResult({
            result_id: resultId,
            tele_consultation_id: consultationId,
            encounter_id: consultation.encounter_id,
            chief_complaint: input.chief_complaint,
            symptom_description: input.symptom_description,
            symptom_duration: input.symptom_duration,
            symptom_severity: input.symptom_severity,
            created_by: userId,
        });

        // Cập nhật flag trên tele_consultations
        await TeleResultRepository.updateConsultationResultFlag(consultationId, true, TELE_RESULT_STATUS.DRAFT);

        return await TeleResultRepository.findByConsultationId(consultationId);
    }

    /**
     * Cập nhật kết quả (chỉ khi DRAFT hoặc COMPLETED chưa ký)
     */
    static async updateResult(consultationId: string, input: TeleResultInput): Promise<any> {
        const result = await this.getResultOrThrow(consultationId);
        this.assertNotSigned(result);

        const updateData: Record<string, any> = {};
        const fields: (keyof TeleResultInput)[] = [
            'chief_complaint', 'symptom_description', 'symptom_duration', 'symptom_severity',
            'remote_examination_notes', 'examination_limitations', 'clinical_impression',
            'medical_conclusion', 'conclusion_type',
            'treatment_plan', 'treatment_advice', 'lifestyle_recommendations', 'medication_notes',
        ];
        for (const f of fields) {
            if (input[f] !== undefined) updateData[f] = input[f];
        }

        if (Object.keys(updateData).length > 0) {
            await TeleResultRepository.updateResult(result.result_id, updateData);
        }

        return await TeleResultRepository.findByConsultationId(consultationId);
    }

    /** Chi tiết kết quả */
    static async getResult(consultationId: string): Promise<any> {
        return await this.getResultOrThrow(consultationId);
    }

    /**
     * Chuyển DRAFT → COMPLETED
     * Yêu cầu: medical_conclusion + examination_limitations bắt buộc
     */
    static async completeResult(consultationId: string): Promise<void> {
        const result = await this.getResultOrThrow(consultationId);

        if (result.status === TELE_RESULT_STATUS.COMPLETED || result.status === TELE_RESULT_STATUS.SIGNED) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_RESULT_ERRORS.RESULT_ALREADY_COMPLETED.code, TELE_RESULT_ERRORS.RESULT_ALREADY_COMPLETED.message);
        }

        if (!result.medical_conclusion) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_RESULT_ERRORS.MISSING_CONCLUSION.code, TELE_RESULT_ERRORS.MISSING_CONCLUSION.message);
        }
        if (!result.examination_limitations) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_RESULT_ERRORS.MISSING_EXAMINATION_LIMITS.code, TELE_RESULT_ERRORS.MISSING_EXAMINATION_LIMITS.message);
        }

        await TeleResultRepository.updateResult(result.result_id, { status: TELE_RESULT_STATUS.COMPLETED });
        await TeleResultRepository.updateConsultationResultFlag(consultationId, true, TELE_RESULT_STATUS.COMPLETED);
    }

    /**
     * Ký xác nhận BS → SIGNED (immutable)
     */
    static async signResult(consultationId: string, userId: string, signatureNotes?: string): Promise<void> {
        const result = await this.getResultOrThrow(consultationId);

        if (result.is_signed) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_RESULT_ERRORS.RESULT_ALREADY_SIGNED.code, TELE_RESULT_ERRORS.RESULT_ALREADY_SIGNED.message);
        }
        if (result.status !== TELE_RESULT_STATUS.COMPLETED) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_RESULT_ERRORS.RESULT_NOT_COMPLETED.code, TELE_RESULT_ERRORS.RESULT_NOT_COMPLETED.message);
        }

        await TeleResultRepository.updateResult(result.result_id, {
            status: TELE_RESULT_STATUS.SIGNED,
            is_signed: true,
            signed_at: new Date(),
            signed_by: userId,
            signature_notes: signatureNotes || null,
        });

        await TeleResultRepository.updateConsultationResultFlag(consultationId, true, TELE_RESULT_STATUS.SIGNED);
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 2: TRIỆU CHỨNG & SINH HIỆU
    // ═══════════════════════════════════════════════════

    /** Cập nhật triệu chứng */
    static async updateSymptoms(consultationId: string, input: SymptomsInput): Promise<void> {
        const result = await this.getResultOrThrow(consultationId);
        this.assertNotSigned(result);

        await TeleResultRepository.updateResult(result.result_id, {
            chief_complaint: input.chief_complaint ?? result.chief_complaint,
            symptom_description: input.symptom_description ?? result.symptom_description,
            symptom_duration: input.symptom_duration ?? result.symptom_duration,
            symptom_severity: input.symptom_severity ?? result.symptom_severity,
        });
    }

    /** BN tự báo sinh hiệu */
    static async updateVitals(consultationId: string, input: SelfReportedVitalsInput): Promise<void> {
        const result = await this.getResultOrThrow(consultationId);
        this.assertNotSigned(result);

        await TeleResultRepository.updateResult(result.result_id, {
            self_reported_vitals: JSON.stringify(input),
        });
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 3: CHUYỂN TUYẾN & TÁI KHÁM
    // ═══════════════════════════════════════════════════

    /** Ghi nhận chuyển tuyến */
    static async updateReferral(consultationId: string, input: ReferralInput): Promise<void> {
        const result = await this.getResultOrThrow(consultationId);
        this.assertNotSigned(result);

        await TeleResultRepository.updateResult(result.result_id, {
            referral_needed: input.referral_needed,
            referral_reason: input.referral_reason || null,
            referral_specialty: input.referral_specialty || null,
        });
    }

    /** Ghi nhận tái khám */
    static async updateFollowUp(consultationId: string, input: FollowUpInput): Promise<void> {
        const result = await this.getResultOrThrow(consultationId);
        this.assertNotSigned(result);

        if (input.follow_up_date) {
            const fuDate = new Date(input.follow_up_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (fuDate < today) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_RESULT_ERRORS.INVALID_FOLLOW_UP_DATE.code, TELE_RESULT_ERRORS.INVALID_FOLLOW_UP_DATE.message);
            }
        }

        await TeleResultRepository.updateResult(result.result_id, {
            follow_up_needed: input.follow_up_needed,
            follow_up_date: input.follow_up_date || null,
            follow_up_notes: input.follow_up_notes || null,
            follow_up_type: input.follow_up_type || null,
        });
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 4: TRA CỨU & THỐNG KÊ
    // ═══════════════════════════════════════════════════

    /** DS kết quả (phân trang) */
    static async listResults(filters: ResultFilter): Promise<any> {
        return await TeleResultRepository.findAll(filters);
    }

    /** Lịch sử kết quả BN */
    static async getPatientResults(patientId: string, page: number, limit: number): Promise<any> {
        return await TeleResultRepository.findByPatient(patientId, page, limit);
    }

    /** DS chờ ký */
    static async getUnsigned(userId: string, page: number, limit: number): Promise<any> {
        return await TeleResultRepository.findUnsigned(userId, page, limit);
    }

    /** DS cần tái khám */
    static async getFollowUps(userId: string, page: number, limit: number): Promise<any> {
        return await TeleResultRepository.findFollowUps(userId, page, limit);
    }

    /**
     * Tổng kết đầy đủ: kết quả + diagnoses + prescriptions + emr_signature
     */
    static async getSummary(consultationId: string): Promise<any> {
        const result = await this.getResultOrThrow(consultationId);
        let emrData = null;
        if (result.encounter_id) {
            emrData = await TeleResultRepository.getRelatedEMRData(result.encounter_id);
        }
        return { result, emr: emrData };
    }

    // ═══════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════

    private static async getConsultationOrThrow(consultationId: string): Promise<any> {
        const c = await TeleResultRepository.getConsultation(consultationId);
        if (!c) throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_RESULT_ERRORS.CONSULTATION_NOT_FOUND.code, TELE_RESULT_ERRORS.CONSULTATION_NOT_FOUND.message);
        return c;
    }

    private static async getResultOrThrow(consultationId: string): Promise<any> {
        const r = await TeleResultRepository.findByConsultationId(consultationId);
        if (!r) throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_RESULT_ERRORS.RESULT_NOT_FOUND.code, TELE_RESULT_ERRORS.RESULT_NOT_FOUND.message);
        return r;
    }

    /** Kiểm tra kết quả đã ký → immutable */
    private static assertNotSigned(result: any): void {
        if (result.is_signed || result.status === TELE_RESULT_STATUS.SIGNED) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_RESULT_ERRORS.RESULT_SIGNED.code, TELE_RESULT_ERRORS.RESULT_SIGNED.message);
        }
    }
}
