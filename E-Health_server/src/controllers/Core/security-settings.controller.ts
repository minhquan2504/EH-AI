import { Response, NextFunction } from 'express';
import { SecuritySettingsService } from '../../services/Core/security-settings.service';
import { UpdateSecurityConfigInput } from '../../models/Core/system-settings.model';
import { AuthenticatedRequest } from '../../middleware/authorizeRoles.middleware';

export class SecuritySettingsController {
    /**
     * Lấy cấu hình bảo mật hiện tại
     */
    static async getSecurityConfig(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await SecuritySettingsService.getSecurityConfig();
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật cấu hình bảo mật (partial update)
     */
    static async updateSecurityConfig(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: UpdateSecurityConfigInput = req.body;
            const updatedBy = req.auth?.user_id ?? 'SYSTEM';
            const data = await SecuritySettingsService.updateSecurityConfig(input, updatedBy);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }
}
