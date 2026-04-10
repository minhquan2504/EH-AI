import { TelePrescriptionRepository } from '../../repository/Remote Consultation/tele-prescription.repository';
import {
    AddDrugInput, SendPrescriptionInput, LabOrderInput,
    ReferralInput86, TeleRxFilter,
} from '../../models/Remote Consultation/tele-prescription.model';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import {
    TELE_RX_ERRORS, DRUG_RESTRICTION_TYPE, REMOTE_CONSULTATION_CONFIG,
} from '../../constants/remote-consultation.constant';
import { v4 as uuidv4 } from 'uuid';

/**
 * Business Logic Layer cho kê đơn & chỉ định từ xa
 * Tạo tele_prescriptions → tự tạo prescriptions (EMR). Thêm thuốc → tạo prescription_details (EMR).
 */
export class TelePrescriptionService {

    // ═══════════════════════════════════════════════════
    // NHÓM 1: KÊ ĐƠN
    // ═══════════════════════════════════════════════════

    /**
     * Tạo đơn thuốc từ xa (DRAFT)
     * Tự động tạo prescriptions header qua encounter
     */
    static async createPrescription(consultationId: string, userId: string, body: any): Promise<any> {
        const consultation = await this.getConsultationOrThrow(consultationId);

        // Kiểm tra đã có đơn chưa
        const existing = await TelePrescriptionRepository.findByConsultationId(consultationId);
        if (existing) {
            throw new AppError(HTTP_STATUS.CONFLICT, TELE_RX_ERRORS.PRESCRIPTION_EXISTS.code, TELE_RX_ERRORS.PRESCRIPTION_EXISTS.message);
        }

        // Tạo prescription header (EMR)
        const prescriptionId = `RX_${uuidv4().substring(0, 12)}`;
        const prescriptionCode = `TELE-RX-${Date.now().toString(36).toUpperCase()}`;
        await TelePrescriptionRepository.createPrescription({
            prescriptions_id: prescriptionId,
            prescription_code: prescriptionCode,
            encounter_id: consultation.encounter_id,
            doctor_id: userId,
            patient_id: consultation.patient_id,
            clinical_diagnosis: body.clinical_diagnosis || null,
            doctor_notes: body.doctor_notes || null,
        });

        // Tạo tele_prescriptions
        const teleRxId = `TRX_${uuidv4().substring(0, 12)}`;
        await TelePrescriptionRepository.create({
            tele_prescription_id: teleRxId,
            prescription_id: prescriptionId,
            tele_consultation_id: consultationId,
            encounter_id: consultation.encounter_id,
        });

        return await TelePrescriptionRepository.findByConsultationId(consultationId);
    }

    /**
     * Thêm thuốc vào đơn
     * Kiểm tra: thuốc tồn tại, thuốc không bị restrict (BANNED/REQUIRES_IN_PERSON), SL hợp lệ
     */
    static async addItem(consultationId: string, input: AddDrugInput): Promise<any> {
        const teleRx = await this.getTeleRxOrThrow(consultationId);
        this.assertDraft(teleRx);

        // Kiểm tra thuốc
        const drug = await TelePrescriptionRepository.getDrug(input.drug_id);
        if (!drug) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_RX_ERRORS.DRUG_NOT_FOUND.code, TELE_RX_ERRORS.DRUG_NOT_FOUND.message);
        }

        // Kiểm tra restriction
        const restriction = await TelePrescriptionRepository.getDrugRestriction(input.drug_id);
        if (restriction) {
            if (restriction.restriction_type === DRUG_RESTRICTION_TYPE.BANNED ||
                restriction.restriction_type === DRUG_RESTRICTION_TYPE.REQUIRES_IN_PERSON) {
                throw new AppError(HTTP_STATUS.FORBIDDEN, TELE_RX_ERRORS.DRUG_RESTRICTED.code,
                    `${TELE_RX_ERRORS.DRUG_RESTRICTED.message} Lý do: ${restriction.reason}`);
            }
            if (restriction.restriction_type === DRUG_RESTRICTION_TYPE.QUANTITY_LIMITED &&
                restriction.max_quantity && input.quantity > restriction.max_quantity) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_RX_ERRORS.DRUG_QUANTITY_LIMITED.code,
                    `${TELE_RX_ERRORS.DRUG_QUANTITY_LIMITED.message} Tối đa: ${restriction.max_quantity}`);
            }
        }

        const detailId = `PD_${uuidv4().substring(0, 12)}`;
        const item = await TelePrescriptionRepository.addItem({
            id: detailId,
            prescription_id: teleRx.prescription_id,
            drug_id: input.drug_id,
            quantity: input.quantity,
            dosage: input.dosage,
            frequency: input.frequency,
            duration_days: input.duration_days || null,
            usage_instruction: input.usage_instruction || null,
        });

        return item;
    }

    /** Xóa thuốc */
    static async removeItem(consultationId: string, detailId: string): Promise<void> {
        const teleRx = await this.getTeleRxOrThrow(consultationId);
        this.assertDraft(teleRx);

        const ok = await TelePrescriptionRepository.removeItem(detailId, teleRx.prescription_id);
        if (!ok) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_RX_ERRORS.DETAIL_NOT_FOUND.code, TELE_RX_ERRORS.DETAIL_NOT_FOUND.message);
        }
    }

    /**
     * Chuyển DRAFT → PRESCRIBED
     * Validate: restrictions_checked, có thuốc trong đơn
     */
    static async prescribe(consultationId: string): Promise<void> {
        const teleRx = await this.getTeleRxOrThrow(consultationId);
        this.assertDraft(teleRx);

        if (!teleRx.remote_restrictions_checked) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_RX_ERRORS.RESTRICTIONS_NOT_CHECKED.code, TELE_RX_ERRORS.RESTRICTIONS_NOT_CHECKED.message);
        }

        // Kiểm tra có thuốc
        const items = await TelePrescriptionRepository.getItems(teleRx.prescription_id);
        if (items.length === 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_RX_ERRORS.MISSING_REQUIRED.code, 'Đơn thuốc chưa có thuốc nào.');
        }

        await TelePrescriptionRepository.updatePrescriptionStatus(teleRx.prescription_id, 'PRESCRIBED');
    }

    /** Chi tiết đơn + danh sách thuốc */
    static async getDetail(consultationId: string): Promise<any> {
        const teleRx = await this.getTeleRxOrThrow(consultationId);
        const items = await TelePrescriptionRepository.getItems(teleRx.prescription_id);
        return { ...teleRx, items };
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 2: GỬI ĐƠN & KIỂM SOÁT
    // ═══════════════════════════════════════════════════

    /**
     * Gửi đơn cho BN
     * Bắt buộc: doctor_confirmed_identity, remote_restrictions_checked
     */
    static async sendToPatient(consultationId: string, input: SendPrescriptionInput): Promise<void> {
        const teleRx = await this.getTeleRxOrThrow(consultationId);

        if (!input.doctor_confirmed_identity) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_RX_ERRORS.IDENTITY_NOT_CONFIRMED.code, TELE_RX_ERRORS.IDENTITY_NOT_CONFIRMED.message);
        }
        if (!input.remote_restrictions_checked) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_RX_ERRORS.RESTRICTIONS_NOT_CHECKED.code, TELE_RX_ERRORS.RESTRICTIONS_NOT_CHECKED.message);
        }

        await TelePrescriptionRepository.update(teleRx.tele_prescription_id, {
            delivery_method: input.delivery_method,
            delivery_address: input.delivery_address || null,
            delivery_phone: input.delivery_phone || null,
            delivery_notes: input.delivery_notes || null,
            doctor_confirmed_identity: true,
            remote_restrictions_checked: true,
            legal_disclaimer: input.legal_disclaimer || null,
            sent_to_patient: true,
            sent_at: new Date(),
        });
    }

    /** Kiểm tra tồn kho cho toàn bộ đơn */
    static async checkStock(consultationId: string): Promise<any[]> {
        const teleRx = await this.getTeleRxOrThrow(consultationId);
        const items = await TelePrescriptionRepository.getItems(teleRx.prescription_id);

        const stockResults: any[] = [];
        for (const item of items) {
            const available = await TelePrescriptionRepository.checkStock(item.drug_id);
            stockResults.push({
                drug_id: item.drug_id,
                brand_name: item.brand_name,
                requested: item.quantity,
                available,
                sufficient: available >= item.quantity,
            });
        }

        // Lưu kết quả
        await TelePrescriptionRepository.update(teleRx.tele_prescription_id, {
            stock_checked: true,
            stock_check_result: JSON.stringify(stockResults),
        });

        return stockResults;
    }

    /** DS thuốc bị hạn chế */
    static async getDrugRestrictions(): Promise<any[]> {
        return await TelePrescriptionRepository.getAllRestrictions();
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 3: CHỈ ĐỊNH XN & TÁI KHÁM
    // ═══════════════════════════════════════════════════

    /** Tạo chỉ định XN */
    static async createLabOrder(consultationId: string, input: LabOrderInput, userId: string): Promise<any> {
        const teleRx = await this.getTeleRxOrThrow(consultationId);

        if (!teleRx.encounter_id) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_RX_ERRORS.MISSING_REQUIRED.code, 'Phiên chưa liên kết encounter.');
        }

        const orderId = `MO_${uuidv4().substring(0, 12)}`;
        const order = await TelePrescriptionRepository.createLabOrder({
            id: orderId,
            encounter_id: teleRx.encounter_id,
            service_code: input.service_code,
            service_name: input.service_name,
            clinical_indicator: input.clinical_indicator || null,
            priority: input.priority,
            ordered_by: userId,
        });

        // Cập nhật flag
        await TelePrescriptionRepository.update(teleRx.tele_prescription_id, { has_lab_orders: true });

        return order;
    }

    /** DS chỉ định XN */
    static async getLabOrders(consultationId: string): Promise<any[]> {
        const teleRx = await this.getTeleRxOrThrow(consultationId);
        if (!teleRx.encounter_id) return [];
        return await TelePrescriptionRepository.getLabOrders(teleRx.encounter_id);
    }

    /** Cập nhật chỉ định tái khám */
    static async updateReferral(consultationId: string, input: ReferralInput86): Promise<void> {
        const teleRx = await this.getTeleRxOrThrow(consultationId);
        await TelePrescriptionRepository.update(teleRx.tele_prescription_id, {
            has_referral: input.has_referral,
            referral_notes: input.referral_notes || null,
        });
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 4: TRA CỨU
    // ═══════════════════════════════════════════════════

    static async listPrescriptions(filters: TeleRxFilter): Promise<any> {
        return await TelePrescriptionRepository.findAll(filters);
    }

    static async getPatientPrescriptions(patientId: string, page: number, limit: number): Promise<any> {
        return await TelePrescriptionRepository.findByPatient(patientId, page, limit);
    }

    /** Tổng kết: đơn + thuốc + XN + referral */
    static async getSummary(consultationId: string): Promise<any> {
        const teleRx = await this.getTeleRxOrThrow(consultationId);
        const items = await TelePrescriptionRepository.getItems(teleRx.prescription_id);
        let labOrders: any[] = [];
        if (teleRx.encounter_id) {
            labOrders = await TelePrescriptionRepository.getLabOrders(teleRx.encounter_id);
        }
        return { prescription: { ...teleRx, items }, lab_orders: labOrders };
    }

    // ═══════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════

    private static async getConsultationOrThrow(consultationId: string): Promise<any> {
        const c = await TelePrescriptionRepository.getConsultation(consultationId);
        if (!c) throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_RX_ERRORS.CONSULTATION_NOT_FOUND.code, TELE_RX_ERRORS.CONSULTATION_NOT_FOUND.message);
        return c;
    }

    private static async getTeleRxOrThrow(consultationId: string): Promise<any> {
        const r = await TelePrescriptionRepository.findByConsultationId(consultationId);
        if (!r) throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_RX_ERRORS.PRESCRIPTION_NOT_FOUND.code, TELE_RX_ERRORS.PRESCRIPTION_NOT_FOUND.message);
        return r;
    }

    /** Kiểm tra đơn ở trạng thái DRAFT */
    private static assertDraft(teleRx: any): void {
        if (teleRx.prescription_status !== 'DRAFT') {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_RX_ERRORS.PRESCRIPTION_NOT_DRAFT.code, TELE_RX_ERRORS.PRESCRIPTION_NOT_DRAFT.message);
        }
    }
}
