import { Request, Response, NextFunction } from 'express';
import { SystemParamsService } from '../../services/Core/system-params.service';
import { CreateSystemSettingInput, UpdateSystemSettingInput } from '../../models/Core/system-settings.model';
import { AuthenticatedRequest } from '../../middleware/authorizeRoles.middleware';

export class SystemParamsController {
    /** GET /api/system/settings?module=&page=&limit=&search= */
    static async listSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20));
            const data = await SystemParamsService.listSettings({
                module: req.query.module as string | undefined,
                search: req.query.search as string | undefined,
                page,
                limit,
            });
            res.status(200).json({ success: true, ...data });
        } catch (error) {
            next(error);
        }
    }

    /** GET /api/system/settings/modules */
    static async getDistinctModules(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await SystemParamsService.getDistinctModules();
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /** GET /api/system/settings/:key */
    static async getSettingByKey(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await SystemParamsService.getSettingByKey(String(req.params.key));
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /** POST /api/system/settings */
    static async createSetting(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: CreateSystemSettingInput = req.body;
            const updatedBy = req.auth?.user_id ?? 'SYSTEM';
            const data = await SystemParamsService.createSetting(input, updatedBy);
            res.status(201).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /** PUT /api/system/settings/:key */
    static async updateSetting(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: UpdateSystemSettingInput = req.body;
            const updatedBy = req.auth?.user_id ?? 'SYSTEM';
            const data = await SystemParamsService.updateSetting(String(req.params.key), input, updatedBy);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /** DELETE /api/system/settings/:key */
    static async deleteSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await SystemParamsService.deleteSetting(String(req.params.key));
            res.status(200).json({ success: true, message: 'Xóa tham số thành công.' });
        } catch (error) {
            next(error);
        }
    }
}
