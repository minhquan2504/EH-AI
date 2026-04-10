import { Request, Response, NextFunction } from 'express';
import { InsuranceProviderService } from '../../services/Patient Management/insurance-provider.service';
import {
    CreateInsuranceProviderInput,
    UpdateInsuranceProviderInput
} from '../../models/Patient Management/insurance-provider.model';
import { INSURANCE_PROVIDER_CONFIG } from '../../constants/insurance-provider.constant';

export class InsuranceProviderController {
    /**
     * Lấy danh sách đơn vị bảo hiểm
     */
    static async getProviders(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { search, insurance_type, is_active, page, limit } = req.query as Record<string, string>;

            const data = await InsuranceProviderService.getProviders(
                search,
                insurance_type,
                is_active,
                page ? parseInt(page) : INSURANCE_PROVIDER_CONFIG.DEFAULT_PAGE,
                limit ? parseInt(limit) : INSURANCE_PROVIDER_CONFIG.DEFAULT_LIMIT
            );

            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Chi tiết 1 đơn vị bảo hiểm
     */
    static async getProviderById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const data = await InsuranceProviderService.getProviderById(id);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tạo mới đơn vị bảo hiểm
     */
    static async createProvider(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: CreateInsuranceProviderInput = req.body;
            const data = await InsuranceProviderService.createProvider(input);
            res.status(201).json({
                success: true,
                message: 'Tạo đơn vị bảo hiểm thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật thông tin đơn vị bảo hiểm
     */
    static async updateProvider(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const input: UpdateInsuranceProviderInput = req.body;

            // Gắn snapshot dữ liệu cũ cho Audit Middleware
            const oldData = await InsuranceProviderService.getProviderById(id);
            (req as any).auditOldValue = oldData;

            const data = await InsuranceProviderService.updateProvider(id, input);
            res.status(200).json({
                success: true,
                message: 'Cập nhật đơn vị bảo hiểm thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Vô hiệu hóa đơn vị bảo hiểm (Soft Disable)
     */
    static async disableProvider(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };

            // Gắn snapshot dữ liệu cũ cho Audit Middleware
            const oldData = await InsuranceProviderService.getProviderById(id);
            (req as any).auditOldValue = oldData;

            const data = await InsuranceProviderService.disableProvider(id);
            res.status(200).json({
                success: true,
                message: 'Đã vô hiệu hóa đơn vị bảo hiểm.',
                data
            });
        } catch (error) {
            next(error);
        }
    }
}
