import { Request, Response, NextFunction } from 'express';
import { UiSettingsService } from '../../services/Core/ui-settings.service';
import { UpdateUiSettingsInput } from '../../models/Core/system-settings.model';
import { AuthenticatedRequest } from '../../middleware/authorizeRoles.middleware';

export class UiSettingsController {
    /**
     * GET /api/system/ui-settings
     */
    static async getUiSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await UiSettingsService.getUiSettings();
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/system/ui-settings (Admin only)
     */
    static async updateUiSettings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: UpdateUiSettingsInput = req.body;
            const updatedBy = req.auth?.user_id ?? 'SYSTEM';
            const data = await UiSettingsService.updateUiSettings(input, updatedBy);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }
}
