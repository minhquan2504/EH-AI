import { Request, Response, NextFunction } from 'express';
import { SystemSettingsService } from '../../services/Core/system-settings.service';
import { UpdateWorkingHoursInput, UpdateSlotConfigInput } from '../../models/Core/system-settings.model';
import { AuthenticatedRequest } from '../../middleware/authorizeRoles.middleware';

export class SystemSettingsController {
    /**
     * Lấy cấu hình giờ làm việc 7 ngày trong tuần
     */
    static async getWorkingHours(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await SystemSettingsService.getWorkingHours();
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật cấu hình giờ làm việc (Admin only)
     */
    static async updateWorkingHours(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: UpdateWorkingHoursInput = req.body;
            const data = await SystemSettingsService.updateWorkingHours(input);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy cấu hình slot khám bệnh
     */
    static async getSlotConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await SystemSettingsService.getSlotConfig();
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật cấu hình slot khám bệnh (Admin only)
     */
    static async updateSlotConfig(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: UpdateSlotConfigInput = req.body;
            const updatedBy = req.auth?.user_id ?? 'SYSTEM';
            const data = await SystemSettingsService.updateSlotConfig(input, updatedBy);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }
}
