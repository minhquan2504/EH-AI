import { Request, Response, NextFunction } from 'express';
import { PatientContactService } from '../../services/Patient Management/patient-contact.service';
import {
    CreatePatientContactInput,
    UpdatePatientContactInput
} from '../../models/Patient Management/patient-contact.model';
import { PATIENT_CONTACT_CONFIG, PATIENT_CONTACT_MESSAGES } from '../../constants/patient-relation.constant';

export class PatientContactController {
    /**
     * Lấy danh sách người thân (hỗ trợ lọc theo patientId qua query param)
     */
    static async getContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { patient_id, page, limit } = req.query as Record<string, string>;

            const data = await PatientContactService.getContacts(
                patient_id,
                page ? parseInt(page) : PATIENT_CONTACT_CONFIG.DEFAULT_PAGE,
                limit ? parseInt(limit) : PATIENT_CONTACT_CONFIG.DEFAULT_LIMIT
            );

            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy chi tiết người thân theo ID
     */
    static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const data = await PatientContactService.getById(id);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Thêm người thân cho bệnh nhân
     */
    static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: CreatePatientContactInput = req.body;
            const data = await PatientContactService.create(input);
            res.status(201).json({
                success: true,
                message: 'Thêm người thân cho bệnh nhân thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật thông tin người thân
     */
    static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const input: UpdatePatientContactInput = req.body;
            const data = await PatientContactService.update(id, input);
            res.status(200).json({
                success: true,
                message: 'Cập nhật thông tin người thân thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa người thân (soft delete)
     */
    static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            await PatientContactService.delete(id);
            res.status(200).json({
                success: true,
                message: 'Đã xóa thông tin người thân thành công.'
            });
        } catch (error) {
            next(error);
        }
    }

    // ==================== MODULE 2.4.3: Liên hệ khẩn cấp ====================

    /**
     * Đặt/hủy liên hệ khẩn cấp cho người thân
     */
    static async setEmergencyContact(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const { is_emergency_contact } = req.body as { is_emergency_contact: boolean };

            // Snapshot dữ liệu cũ để Audit Middleware ghi nhận
            const oldData = await PatientContactService.getById(id);
            (req as any).auditOldValue = oldData;

            const data = await PatientContactService.setEmergencyContact(id, is_emergency_contact);
            res.status(200).json({
                success: true,
                message: PATIENT_CONTACT_MESSAGES.SET_EMERGENCY_SUCCESS,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    // ==================== MODULE 2.4.4: Người đại diện pháp lý ====================

    /**
     * Chỉ định/hủy người đại diện pháp lý
     */
    static async setLegalRepresentative(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const { is_legal_representative } = req.body as { is_legal_representative: boolean };

            // Snapshot dữ liệu cũ để Audit Middleware ghi nhận
            const oldData = await PatientContactService.getById(id);
            (req as any).auditOldValue = oldData;

            const data = await PatientContactService.setLegalRepresentative(id, is_legal_representative);
            const message = is_legal_representative
                ? PATIENT_CONTACT_MESSAGES.SET_LEGAL_REP_SUCCESS
                : PATIENT_CONTACT_MESSAGES.UNSET_LEGAL_REP_SUCCESS;

            res.status(200).json({ success: true, message, data });
        } catch (error) {
            next(error);
        }
    }

    // ==================== MODULE 2.4.5: Ghi chú quyền quyết định y tế ====================

    /**
     * Cập nhật ghi chú quyền quyết định y tế
     */
    static async updateMedicalDecisionNote(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const { medical_decision_note } = req.body as { medical_decision_note: string };

            // Snapshot dữ liệu cũ để Audit Middleware ghi nhận
            const oldData = await PatientContactService.getById(id);
            (req as any).auditOldValue = oldData;

            const data = await PatientContactService.updateMedicalDecisionNote(id, medical_decision_note);
            res.status(200).json({
                success: true,
                message: PATIENT_CONTACT_MESSAGES.UPDATE_MEDICAL_NOTE_SUCCESS,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy ghi chú quyền quyết định y tế
     */
    static async getMedicalDecisionNote(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const data = await PatientContactService.getMedicalDecisionNote(id);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }
}

