import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authorizeRoles.middleware';
import { ApiPermissionCacheService } from '../services/Core/api-permission-cache.service';

/**
 * Middleware đóng chốt chặn phân quyền Dynamic API
 */
export const authorizeApi = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const auth = req.auth;

    // Kiểm tra định dạng cơ bản của Token
    if (!auth || !auth.roles || !Array.isArray(auth.roles)) {
        return res.status(401).json({
            success: false,
            error_code: 'UNAUTHORIZED_ROLE',
            message: 'Không tìm thấy thông tin định danh vai trò của người dùng.'
        });
    }

    // Xác định thông tin Action
    const requestMethod = req.method;

    const originalUrl = req.originalUrl.split('?')[0];

    const isGranted = ApiPermissionCacheService.hasAccess(auth.roles, requestMethod, originalUrl);

    if (!isGranted) {
        return res.status(403).json({
            success: false,
            error_code: 'FORBIDDEN_API_ACCESS',
            message: `Khu vực cấm. Vai trò của bạn không được cấp quyền truy cập vào chức năng [${requestMethod} ${originalUrl}].`
        });
    }

    next();
};
