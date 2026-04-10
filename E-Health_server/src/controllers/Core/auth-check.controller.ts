import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authorizeRoles.middleware';
import { UserRepository } from '../../repository/Core/user.repository';
import { MenuRepository } from '../../repository/Core/menu.repository';
import { RolePermissionRepository } from '../../repository/Core/role-permission.repository';
import { AppError } from '../../utils/app-error.util';

export class AuthCheckController {
    /**
     * Lấy danh sách Roles của phiên đăng nhập hiện hành
     */
    static async getMeRoles(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.auth?.user_id;
            if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Invalid session');

            const roles = await UserRepository.getUserRoles(userId);
            res.status(200).json({
                success: true,
                data: roles
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy danh sách Menu UI hiển thị của phiên đăng nhập hiện hành
     */
    static async getMeMenus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.auth?.user_id;
            if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Invalid session');

            const userRoles = await UserRepository.getUserRoles(userId);
            const roleIds = userRoles.map((ur: any) => ur.roles_id);

            const mergedMenus = await MenuRepository.getMenusByRoleIds(roleIds);

            // Có thể xây dựng hệ thống Tree ở Frontend, Backend trả List phẳng
            res.status(200).json({
                success: true,
                data: mergedMenus
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy danh sách đặc quyền hệ thống (Permission Codes)
     */
    static async getMePermissions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.auth?.user_id;
            if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Invalid session');

            const userRoles = await UserRepository.getUserRoles(userId);
            const roleIds = userRoles.map((ur: any) => ur.roles_id);

            const mergedPermissions = await RolePermissionRepository.getFeaturePermissionsByRoleIds(roleIds);

            res.status(200).json({
                success: true,
                data: mergedPermissions
            });
        } catch (error) {
            next(error);
        }
    }
}
