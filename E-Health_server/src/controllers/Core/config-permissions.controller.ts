import { Request, Response, NextFunction } from 'express';
import { ConfigPermissionsService } from '../../services/Core/config-permissions.service';
import { UpdateConfigPermissionsInput } from '../../models/Core/system-settings.model';
import { AuthenticatedRequest } from '../../middleware/authorizeRoles.middleware';

export class ConfigPermissionsController {
    /** GET /api/system/config-permissions */
    static async getConfigPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await ConfigPermissionsService.getConfigPermissions();
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /** PUT /api/system/config-permissions */
    static async updateConfigPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: UpdateConfigPermissionsInput = req.body;
            const updatedBy = req.auth?.user_id ?? 'SYSTEM';
            const data = await ConfigPermissionsService.updateConfigPermissions(input, updatedBy);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }
}
