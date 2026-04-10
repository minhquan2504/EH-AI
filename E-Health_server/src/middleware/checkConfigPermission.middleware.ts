import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authorizeRoles.middleware';
import { ConfigPermissionsRepository } from '../repository/Core/config-permissions.repository';
import { SystemSettingsRepository } from '../repository/Core/system-settings.repository';
import { AppError } from '../utils/app-error.util';

/**
 * Middleware kiểm tra xem người dùng có quyền chỉnh sửa cấu hình của một module cụ thể hay không.
 */
export const checkConfigPermission = (fixedModule?: string) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.auth?.user_id;
            if (!userId) {
                return next(new AppError(401, 'UNAUTHORIZED', 'Chưa xác thực người dùng'));
            }

            // Lấy danh sách các module mà user được phép sửa
            const allowedModules = await ConfigPermissionsRepository.getModulesByUserId(userId);

            let targetModule = fixedModule;

            // Tự động suy luận module nếu không truyền cố định
            if (!targetModule) {
                if (req.method === 'POST' && req.body.module) {
                    targetModule = typeof req.body.module === 'string' ? req.body.module : String(req.body.module);
                } else if ((req.method === 'PUT' || req.method === 'DELETE') && req.params.key) {
                    const setting = await SystemSettingsRepository.getSettingByKey(String(req.params.key));
                    if (!setting) {
                        return next(new AppError(404, 'NOT_FOUND', 'Không tìm thấy cấu hình này'));
                    }
                    targetModule = setting.module || undefined;
                }
            }

            if (!targetModule) {

                return next();
            }

            if (!allowedModules.includes(targetModule)) {
                return next(new AppError(403, 'FORBIDDEN_CONFIG_MODULE', `Bạn không có quyền tinh chỉnh cấu hình thuộc phân hệ [${targetModule}]`));
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};
