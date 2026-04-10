import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authorizeRoles.middleware';
import { PermissionService } from '../../services/Core/permission.service';

export class ModuleController {
    /**
     * Lấy danh sách các Feature Module (Quyền hệ thống được gộp theo module)
     */
    static async getModules(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const modules = await PermissionService.getDistinctModules();
            res.status(200).json({
                success: true,
                data: modules
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy danh sách Quyền của một Module cụ thể
     */
    static async getPermissionsByModule(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const moduleName = req.params.moduleName as string;

            // Tận dụng hàm getPermissions có sẵn của PermissionService kèm filter module
            const permissions = await PermissionService.getPermissions({ module: moduleName });

            res.status(200).json({
                success: true,
                data: permissions
            });
        } catch (error) {
            next(error);
        }
    }
}
