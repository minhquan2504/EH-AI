import { Request, Response, NextFunction } from 'express';
import { InsuranceCoverageService } from '../../services/Patient Management/insurance-coverage.service';
import {
    CreateInsuranceCoverageInput,
    UpdateInsuranceCoverageInput
} from '../../models/Patient Management/insurance-coverage.model';
import { INSURANCE_COVERAGE_CONFIG } from '../../constants/insurance-coverage.constant';

export class InsuranceCoverageController {
    /**
     * Lấy danh sách tỷ lệ chi trả
     */
    static async getCoverages(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { provider_id, page, limit } = req.query as Record<string, string>;

            const data = await InsuranceCoverageService.getCoverages(
                provider_id,
                page ? parseInt(page) : INSURANCE_COVERAGE_CONFIG.DEFAULT_PAGE,
                limit ? parseInt(limit) : INSURANCE_COVERAGE_CONFIG.DEFAULT_LIMIT
            );

            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tạo mới tỷ lệ chi trả
     */
    static async createCoverage(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: CreateInsuranceCoverageInput = req.body;
            const data = await InsuranceCoverageService.createCoverage(input);
            res.status(201).json({
                success: true,
                message: 'Tạo tỷ lệ chi trả bảo hiểm thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật tỷ lệ chi trả
     */
    static async updateCoverage(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const input: UpdateInsuranceCoverageInput = req.body;

            const oldData = await InsuranceCoverageService.getCoverageById(id);
            (req as any).auditOldValue = oldData;

            const data = await InsuranceCoverageService.updateCoverage(id, input);
            res.status(200).json({
                success: true,
                message: 'Cập nhật tỷ lệ chi trả thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa tỷ lệ chi trả
     */
    static async deleteCoverage(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };

            const oldData = await InsuranceCoverageService.getCoverageById(id);
            (req as any).auditOldValue = oldData;

            await InsuranceCoverageService.deleteCoverage(id);
            res.status(200).json({
                success: true,
                message: 'Đã xóa tỷ lệ chi trả thành công.'
            });
        } catch (error) {
            next(error);
        }
    }
}
