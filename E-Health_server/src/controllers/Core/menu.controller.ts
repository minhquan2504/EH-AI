import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authorizeRoles.middleware';
import { MenuService } from '../../services/Core/menu.service';
import { CreateMenuInput, UpdateMenuInput, MenuQueryFilter } from '../../models/Core/menu.model';
import { AppError } from '../../utils/app-error.util';

export class MenuController {
    /**
     * Lấy danh sách toàn bộ Menu hệ thống
     */
    static async getMenus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const filter: MenuQueryFilter = {
                search: req.query.search as string,
                parent_id: req.query.parent_id as string,
                status: req.query.status as 'ACTIVE' | 'INACTIVE'
            };

            const menus = await MenuService.getAllMenus(filter);
            res.status(200).json({
                success: true,
                data: menus
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tạo mới Menu
     */
    static async createMenu(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.auth?.user_id;
            if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Không thể xác thực danh tính');

            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            const input: CreateMenuInput = req.body;
            if (!input.code || !input.name) {
                throw new AppError(400, 'INVALID_INPUT', 'Vui lòng cung cấp mã code và tên Menu');
            }

            const menu = await MenuService.createMenu(input, adminId, ipAddress, userAgent);
            res.status(201).json({
                success: true,
                message: 'Tạo Menu thành công',
                data: menu
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật Menu
     */
    static async updateMenu(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.auth?.user_id;
            if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Không thể xác thực danh tính');

            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            const input: UpdateMenuInput = req.body;

            const menu = await MenuService.updateMenu(req.params.menuId as string, input, adminId, ipAddress, userAgent);
            res.status(200).json({
                success: true,
                message: 'Cập nhật Menu thành công',
                data: menu
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa mềm Menu
     */
    static async deleteMenu(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminId = req.auth?.user_id;
            if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Không thể xác thực danh tính');

            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            await MenuService.deleteMenu(req.params.menuId as string, adminId, ipAddress, userAgent);
            res.status(200).json({
                success: true,
                message: 'Xóa Menu thành công'
            });
        } catch (error) {
            next(error);
        }
    }
}
