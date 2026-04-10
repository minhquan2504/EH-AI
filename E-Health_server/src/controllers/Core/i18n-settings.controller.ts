import { Request, Response, NextFunction } from 'express';
import { I18nSettingsService } from '../../services/Core/i18n-settings.service';
import { UpdateI18nConfigInput } from '../../models/Core/system-settings.model';
import { AuthenticatedRequest } from '../../middleware/authorizeRoles.middleware';

export class I18nSettingsController {
    /**
     * GET /api/system/i18n/supported – toàn bộ ngôn ngữ có sẵn kèm is_active
     */
    static async getSupportedLanguages(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await I18nSettingsService.getSupportedLanguages();
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/system/i18n – cấu hình ngôn ngữ hiện tại
     */
    static async getI18nConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await I18nSettingsService.getI18nConfig();
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/system/i18n – cập nhật cấu hình ngôn ngữ (Admin only)
     */
    static async updateI18nConfig(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: UpdateI18nConfigInput = req.body;
            const updatedBy = req.auth?.user_id ?? 'SYSTEM';
            const data = await I18nSettingsService.updateI18nConfig(input, updatedBy);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }
}
