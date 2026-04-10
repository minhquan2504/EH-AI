import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authorizeRoles.middleware';
import { PermissionRepository } from '../repository/Core/permission.repository';

/**
 * Middleware kiểm tra quyền truy cập dựa trên mã API Permissions.
 * Query DB theo user_id thay vì đọc từ JWT (permissions không còn được embed vào token).
 */
export const authorizePermissions = (...requiredPermissions: string[]) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const auth = req.auth;

        if (!auth?.user_id) {
            return res.status(401).json({
                success: false,
                error_code: 'UNAUTHORIZED_PERMISSION',
                message: 'Không tìm thấy thông tin xác thực.'
            });
        }

        // Không yêu cầu quyền cụ thể → cho qua
        if (requiredPermissions.length === 0) {
            return next();
        }

        try {
            // Query DB lấy danh sách permissions của user
            const userPermissions = await PermissionRepository.getAggregatedPermissionsForUser(auth.user_id);

            const hasPermission = userPermissions.some((code: string) => requiredPermissions.includes(code));

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    error_code: 'FORBIDDEN_ACCESS',
                    message: `Bạn không có quyền thực hiện thao tác này. Yêu cầu một trong các quyền: ${requiredPermissions.join(', ')}`
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                error_code: 'PERMISSION_CHECK_FAILED',
                message: 'Lỗi kiểm tra quyền hạn.'
            });
        }
    };
};
