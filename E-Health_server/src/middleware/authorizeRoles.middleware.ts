import { Request, Response, NextFunction } from 'express';
import { AccountRole } from '../models/Core/auth_account.model';

export interface AuthenticatedRequest extends Request {
    auth?: {
        user_id: string;
        roles: string[];
        permissions: string[];
        sessionId: string;
        [key: string]: any;
    };
}

/**
 * Middleware kiểm tra quyền truy cập dựa trên mảng Roles.
 */
export const authorizeRoles = (...allowedRoles: AccountRole[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const auth = req.auth;

        // Kiểm tra
        if (!auth || !auth.roles || !Array.isArray(auth.roles)) {
            return res.status(401).json({
                success: false,
                error_code: 'UNAUTHORIZED_ROLE',
                message: 'Không tìm thấy thông tin quyền hạn của người dùng.'
            });
        }

        // Kiểm tra xem roles của user
        const hasPermission = auth.roles.some((role: string) => allowedRoles.includes(role as AccountRole));

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                error_code: 'FORBIDDEN_ACCESS',
                message: 'Bạn không có quyền thực hiện thao tác này.'
            });
        }

        // Hợp lệ 
        next();
    };
};