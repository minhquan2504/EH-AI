import { Request, Response, NextFunction } from 'express';
import { PatientService } from '../../services/Patient Management/patient.service';
import { PatientInsuranceService } from '../../services/Patient Management/patient-insurance.service';
import { PatientContactService } from '../../services/Patient Management/patient-contact.service';
import {
    CreatePatientInput,
    UpdatePatientInput
} from '../../models/Patient Management/patient.model';
import { PATIENT_CONFIG } from '../../constants/patient.constant';
import { AuditLogRepository } from '../../repository/Core/audit-log.repository';

export class PatientController {
    /**
     * Lấy danh sách hồ sơ bệnh nhân
     */
    static async getPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { search, status, gender, page, limit } = req.query as Record<string, string>;

            const data = await PatientService.getPatients(
                search,
                status,
                gender,
                page ? parseInt(page) : PATIENT_CONFIG.DEFAULT_PAGE,
                limit ? parseInt(limit) : PATIENT_CONFIG.DEFAULT_LIMIT
            );

            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy chi tiết hồ sơ bệnh nhân
     */
    static async getPatientById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const data = await PatientService.getPatientById(id);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tạo mới hồ sơ bệnh nhân
     */
    static async createPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: CreatePatientInput = req.body;
            const data = await PatientService.createPatient(input);
            res.status(201).json({
                success: true,
                message: 'Tạo hồ sơ bệnh nhân thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật thông tin hành chính bệnh nhân.
     */
    static async updatePatient(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const input: UpdatePatientInput = req.body;

            // Lưu dữ liệu cũ trước khi cập nhật để Audit Middleware ghi nhận
            const oldPatient = await PatientService.getPatientById(id);
            (req as any).auditOldValue = oldPatient;

            const data = await PatientService.updatePatient(id, input);
            res.status(200).json({
                success: true,
                message: 'Cập nhật hồ sơ bệnh nhân thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật trạng thái hồ sơ bệnh nhân (ACTIVE / INACTIVE).
     * Lưu snapshot dữ liệu cũ trước khi cập nhật để phục vụ audit trail y tế.
     */
    static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const { status } = req.body as { status: string };

            // Lưu dữ liệu cũ trước khi cập nhật để Audit Middleware ghi nhận
            const oldPatient = await PatientService.getPatientById(id);
            (req as any).auditOldValue = oldPatient;

            const data = await PatientService.updateStatus(id, status);
            res.status(200).json({
                success: true,
                message: `Đã cập nhật trạng thái hồ sơ bệnh nhân thành: ${status}.`,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Liên kết hồ sơ bệnh nhân với tài khoản Mobile App.
     * Lưu snapshot dữ liệu cũ trước khi cập nhật để phục vụ audit trail y tế.
     */
    static async linkAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const { account_id } = req.body as { account_id: string };

            // Lưu dữ liệu cũ trước khi cập nhật để Audit Middleware ghi nhận
            const oldPatient = await PatientService.getPatientById(id);
            (req as any).auditOldValue = oldPatient;

            const data = await PatientService.linkAccount(id, account_id);
            res.status(200).json({
                success: true,
                message: 'Liên kết tài khoản thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Hủy liên kết tài khoản khỏi hồ sơ bệnh nhân.
     * Lưu snapshot dữ liệu cũ trước khi cập nhật để phục vụ audit trail y tế.
     */
    static async unlinkAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };

            // Lưu dữ liệu cũ trước khi cập nhật để Audit Middleware ghi nhận
            const oldPatient = await PatientService.getPatientById(id);
            (req as any).auditOldValue = oldPatient;

            const data = await PatientService.unlinkAccount(id);
            res.status(200).json({
                success: true,
                message: 'Đã hủy liên kết tài khoản.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa mềm hồ sơ bệnh nhân.
     * Lưu snapshot dữ liệu cũ trước khi xóa để phục vụ audit trail y tế.
     */
    static async deletePatient(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };

            // Lưu dữ liệu cũ trước khi xóa để Audit Middleware ghi nhận
            const oldPatient = await PatientService.getPatientById(id);
            (req as any).auditOldValue = oldPatient;

            await PatientService.deletePatient(id);
            res.status(200).json({
                success: true,
                message: 'Đã xóa hồ sơ bệnh nhân thành công.'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tra cứu lịch sử thay đổi hồ sơ của 1 bệnh nhân cụ thể.
     * Phục vụ kiểm tra nội bộ & tuân thủ quy định y tế.
     */
    static async getPatientAuditTrail(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };

            // Đảm bảo bệnh nhân tồn tại trước khi truy vấn audit trail
            await PatientService.getPatientById(id);

            const page = req.query.page ? parseInt(req.query.page as string) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
            const actionType = req.query.action_type as string | undefined;
            const startDate = req.query.start_date as string | undefined;
            const endDate = req.query.end_date as string | undefined;

            const data = await AuditLogRepository.getLogs({
                module_name: 'PATIENTS',
                target_id: id,
                action_type: actionType,
                start_date: startDate,
                end_date: endDate,
                page,
                limit
            });

            res.status(200).json({
                success: true,
                message: 'Lấy lịch sử thay đổi hồ sơ bệnh nhân thành công.',
                data: data.logs,
                pagination: {
                    total: data.total,
                    page,
                    limit,
                    total_pages: Math.ceil(data.total / limit)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy danh sách thẻ bảo hiểm của 1 bệnh nhân (nested route)
     */
    static async getPatientInsurances(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { patientId } = req.params as { patientId: string };
            const { page, limit } = req.query as Record<string, string>;

            const data = await PatientInsuranceService.getInsurances(
                patientId,
                page ? parseInt(page) : 1,
                limit ? parseInt(limit) : 20
            );

            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Thêm thẻ bảo hiểm cho bệnh nhân (nested route, patientId từ params)
     */
    static async addPatientInsurance(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { patientId } = req.params as { patientId: string };
            const input = { ...req.body, patient_id: patientId };

            const data = await PatientInsuranceService.createInsurance(input);
            res.status(201).json({
                success: true,
                message: 'Thêm thẻ bảo hiểm cho bệnh nhân thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật cờ has_insurance cho bệnh nhân
     */
    static async updateInsuranceStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const { has_insurance } = req.body as { has_insurance: boolean };

            await PatientService.updateInsuranceStatus(id, has_insurance);
            res.status(200).json({
                success: true,
                message: `Đã cập nhật trạng thái bảo hiểm bệnh nhân thành: ${has_insurance ? 'CÓ' : 'KHÔNG CÓ'} bảo hiểm.`
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Danh sách bệnh nhân CÓ bảo hiểm
     */
    static async getPatientsWithInsurance(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { page, limit } = req.query as Record<string, string>;

            const data = await PatientService.getPatientsWithInsurance(
                page ? parseInt(page) : PATIENT_CONFIG.DEFAULT_PAGE,
                limit ? parseInt(limit) : PATIENT_CONFIG.DEFAULT_LIMIT
            );

            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Danh sách bệnh nhân KHÔNG CÓ bảo hiểm
     */
    static async getPatientsWithoutInsurance(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { page, limit } = req.query as Record<string, string>;

            const data = await PatientService.getPatientsWithoutInsurance(
                page ? parseInt(page) : PATIENT_CONFIG.DEFAULT_PAGE,
                limit ? parseInt(limit) : PATIENT_CONFIG.DEFAULT_LIMIT
            );

            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    // ==================== MODULE 2.4.3 & 2.4.4: Liên hệ khẩn cấp & Đại diện pháp lý ====================

    /**
     * Lấy danh sách liên hệ khẩn cấp của bệnh nhân
     */
    static async getEmergencyContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { patientId } = req.params as { patientId: string };
            const data = await PatientContactService.getEmergencyContacts(patientId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy người đại diện pháp lý hiện tại của bệnh nhân
     */
    static async getLegalRepresentative(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { patientId } = req.params as { patientId: string };
            const data = await PatientContactService.getLegalRepresentative(patientId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    // 2.4.6: Phân biệt người thân – liên hệ khẩn cấp

    /**
     * Lấy tất cả người liên hệ của bệnh nhân
     */
    static async getAllRelations(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { patientId } = req.params as { patientId: string };
            const data = await PatientContactService.getAllRelations(patientId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy danh sách người thân thông thường (không khẩn cấp, không đại diện pháp lý)
     */
    static async getNormalRelatives(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { patientId } = req.params as { patientId: string };
            const data = await PatientContactService.getNormalRelatives(patientId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy danh sách người giám hộ
     */
    static async getGuardians(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { patientId } = req.params as { patientId: string };
            const data = await PatientContactService.getGuardians(patientId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lọc bệnh nhân theo tag(s)
     */
    static async filterByTags(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tagIdsRaw = req.query.tagIds as string;
            const matchAll = req.query.matchAll === 'true';
            const page = parseInt(req.query.page as string, 10) || PATIENT_CONFIG.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string, 10) || PATIENT_CONFIG.DEFAULT_LIMIT;

            const tagIds = tagIdsRaw ? tagIdsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
            const data = await PatientService.filterByTags(tagIds, matchAll, page, limit);
            res.status(200).json({ success: true, ...data });
        } catch (error) {
            next(error);
        }
    }


    /** Tìm kiếm nâng cao bệnh nhân */
    static async advancedSearch(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { keyword, status, gender, page, limit } = req.query as Record<string, string>;
            const ageMin = req.query.ageMin ? parseInt(req.query.ageMin as string, 10) : undefined;
            const ageMax = req.query.ageMax ? parseInt(req.query.ageMax as string, 10) : undefined;

            const data = await PatientService.advancedSearch(
                keyword, status, gender, ageMin, ageMax,
                page ? parseInt(page) : PATIENT_CONFIG.DEFAULT_PAGE,
                limit ? parseInt(limit) : PATIENT_CONFIG.DEFAULT_LIMIT
            );
            res.status(200).json({ success: true, ...data });
        } catch (error) {
            next(error);
        }
    }

    /** Tìm kiếm nhanh (Autocomplete) */
    static async quickSearch(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const q = (req.query.q as string) || '';
            const data = await PatientService.quickSearch(q);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /** Tra cứu tóm tắt hồ sơ bệnh nhân */
    static async getPatientSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const data = await PatientService.getPatientSummary(id);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }
}
