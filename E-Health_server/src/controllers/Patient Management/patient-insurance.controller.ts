import { Request, Response, NextFunction } from 'express';
import { PatientInsuranceService } from '../../services/Patient Management/patient-insurance.service';
import {
    CreatePatientInsuranceInput,
    UpdatePatientInsuranceInput
} from '../../models/Patient Management/patient-insurance.model';
import { PATIENT_INSURANCE_CONFIG } from '../../constants/patient-insurance.constant';
import { AuditLogRepository } from '../../repository/Core/audit-log.repository';

export class PatientInsuranceController {
    /**
     * Lấy danh sách thẻ bảo hiểm
     */
    static async getInsurances(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { patient_id, page, limit } = req.query as Record<string, string>;

            const data = await PatientInsuranceService.getInsurances(
                patient_id,
                page ? parseInt(page) : PATIENT_INSURANCE_CONFIG.DEFAULT_PAGE,
                limit ? parseInt(limit) : PATIENT_INSURANCE_CONFIG.DEFAULT_LIMIT
            );

            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Chi tiết thẻ bảo hiểm
     */
    static async getInsuranceById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const data = await PatientInsuranceService.getInsuranceById(id);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Thêm thẻ bảo hiểm mới
     */
    static async createInsurance(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: CreatePatientInsuranceInput = req.body;
            const data = await PatientInsuranceService.createInsurance(input);
            res.status(201).json({
                success: true,
                message: 'Thêm thẻ bảo hiểm thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật thẻ bảo hiểm.
     */
    static async updateInsurance(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const input: UpdatePatientInsuranceInput = req.body;

            const oldData = await PatientInsuranceService.getInsuranceById(id);
            (req as any).auditOldValue = oldData;

            const data = await PatientInsuranceService.updateInsurance(id, input);
            res.status(200).json({
                success: true,
                message: 'Cập nhật thẻ bảo hiểm thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa thẻ bảo hiểm.
     */
    static async deleteInsurance(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };

            const oldData = await PatientInsuranceService.getInsuranceById(id);
            (req as any).auditOldValue = oldData;

            await PatientInsuranceService.deleteInsurance(id);
            res.status(200).json({
                success: true,
                message: 'Đã xóa thẻ bảo hiểm thành công.'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Danh sách thẻ bảo hiểm còn hiệu lực
     */
    static async getActiveInsurances(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { patient_id, page, limit } = req.query as Record<string, string>;

            const data = await PatientInsuranceService.getActiveInsurances(
                patient_id,
                page ? parseInt(page) : PATIENT_INSURANCE_CONFIG.DEFAULT_PAGE,
                limit ? parseInt(limit) : PATIENT_INSURANCE_CONFIG.DEFAULT_LIMIT
            );

            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Danh sách thẻ bảo hiểm đã hết hạn
     */
    static async getExpiredInsurances(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { patient_id, page, limit } = req.query as Record<string, string>;

            const data = await PatientInsuranceService.getExpiredInsurances(
                patient_id,
                page ? parseInt(page) : PATIENT_INSURANCE_CONFIG.DEFAULT_PAGE,
                limit ? parseInt(limit) : PATIENT_INSURANCE_CONFIG.DEFAULT_LIMIT
            );

            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lịch sử thay đổi thẻ bảo hiểm (từ bảng audit_logs)
     */
    static async getInsuranceHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };

            // Đảm bảo thẻ tồn tại
            await PatientInsuranceService.getInsuranceById(id);

            const page = req.query.page ? parseInt(req.query.page as string) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

            const data = await AuditLogRepository.getLogs({
                module_name: 'INSURANCE',
                target_id: id,
                page,
                limit
            });

            res.status(200).json({
                success: true,
                message: 'Lấy lịch sử thay đổi thẻ bảo hiểm thành công.',
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
}
