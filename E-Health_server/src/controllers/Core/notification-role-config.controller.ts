import { Request, Response, NextFunction } from 'express';
import { NotificationRoleConfigService } from '../../services/Core/notification-role-config.service';

export class NotificationRoleConfigController {
    /**
     * Lấy toàn bộ ma trận cấu hình
     */
    static async getConfigs(req: Request, res: Response, next: NextFunction) {
        try {
            const matrix = await NotificationRoleConfigService.getRoleConfigsMatrix();
            res.status(200).json({
                success: true,
                message: 'Lấy cấu hình thông báo hệ thống thành công.',
                data: matrix
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật 1 ô trong ma trận (1 Role - 1 Category)
     */
    static async updateConfig(req: Request, res: Response, next: NextFunction) {
        try {
            const roleId = req.params.roleId as string;
            const categoryId = req.params.categoryId as string;
            const data = req.body;

            const config = await NotificationRoleConfigService.updateConfig(roleId, categoryId, data);

            res.status(200).json({
                success: true,
                message: 'Cập nhật cấu hình thành công.',
                data: config
            });
        } catch (error) {
            next(error);
        }
    }
}
