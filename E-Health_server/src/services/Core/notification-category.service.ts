import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../utils/app-error.util';
import { NotificationCategoryRepository } from '../../repository/Core/notification-category.repository';
import { CreateCategoryInput, UpdateCategoryInput } from '../../models/Core/notification.model';

export class NotificationCategoryService {
    /**
     * Lấy danh sách phân trang
     */
    static async getCategories(search?: string, page: number = 1, limit: number = 20) {
        return await NotificationCategoryRepository.getCategories(search, page, limit);
    }

    /**
     * Thêm mới danh mục
     */
    static async createCategory(input: CreateCategoryInput) {
        // Kiểm tra trùng mã
        const existing = await NotificationCategoryRepository.getCategoryByCode(input.code);
        if (existing) {
            throw new AppError(400, 'CATEGORY_CODE_EXISTS', 'Mã loại thông báo đã tồn tại trong hệ thống.');
        }

        const id = `NCAT_${uuidv4()}`;
        return await NotificationCategoryRepository.createCategory(id, input);
    }

    /**
     * Cập nhật danh mục
     */
    static async updateCategory(id: string, input: UpdateCategoryInput) {
        const existing = await NotificationCategoryRepository.getCategoryById(id);
        if (!existing) {
            throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy loại thông báo này.');
        }

        return await NotificationCategoryRepository.updateCategory(id, input);
    }

    /**
     * Xóa danh mục
     */
    static async deleteCategory(id: string) {
        const existing = await NotificationCategoryRepository.getCategoryById(id);
        if (!existing) {
            throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy loại thông báo này.');
        }

        const deleted = await NotificationCategoryRepository.deleteCategory(id);
        if (!deleted) {
            throw new AppError(400, 'CATEGORY_DELETE_FAILED', 'Xóa cấu hình loại thông báo thất bại.');
        }
    }

    /**
     * Get danh sách Public cho dropdowns
     */
    static async getActiveCategories() {
        return await NotificationCategoryRepository.getActiveCategories();
    }
}
