import { Request, Response, NextFunction } from 'express';
import { NotificationCategoryService } from '../../services/Core/notification-category.service';
import { CreateCategoryInput, UpdateCategoryInput } from '../../models/Core/notification.model';

export class NotificationCategoryController {
    /**
     * Lấy danh sách phân trang (Admin)
     */
    static async getCategories(req: Request, res: Response, next: NextFunction) {
        try {
            const search = req.query.search as string;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            const result = await NotificationCategoryService.getCategories(search, page, limit);

            res.status(200).json({
                success: true,
                message: 'Lấy danh sách nhóm thông báo thành công.',
                data: result.data,
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy danh sách cấu hình Dropdown (Public)
     */
    static async getActiveCategories(req: Request, res: Response, next: NextFunction) {
        try {
            const categories = await NotificationCategoryService.getActiveCategories();
            res.status(200).json({
                success: true,
                message: 'Thành công.',
                data: categories
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Thêm mới danh mục
     */
    static async createCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const data: CreateCategoryInput = req.body;
            const category = await NotificationCategoryService.createCategory(data);

            res.status(201).json({
                success: true,
                message: 'Tạo loại thông báo thành công.',
                data: category
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật danh mục
     */
    static async updateCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const data: UpdateCategoryInput = req.body;
            const category = await NotificationCategoryService.updateCategory(id, data);

            res.status(200).json({
                success: true,
                message: 'Cập nhật loại thông báo thành công.',
                data: category
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa mềm danh mục
     */
    static async deleteCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            await NotificationCategoryService.deleteCategory(id);

            res.status(200).json({
                success: true,
                message: 'Đã xóa loại thông báo thành công.'
            });
        } catch (error) {
            next(error);
        }
    }
}
