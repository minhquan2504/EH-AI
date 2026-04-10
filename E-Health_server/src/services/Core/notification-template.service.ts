import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../utils/app-error.util';
import { NotificationTemplateRepository } from '../../repository/Core/notification-template.repository';
import { NotificationCategoryRepository } from '../../repository/Core/notification-category.repository';
import { CreateTemplateInput, UpdateTemplateInput } from '../../models/Core/notification.model';

export class NotificationTemplateService {
    static async getTemplates(search?: string, categoryId?: string, page: number = 1, limit: number = 20) {
        return await NotificationTemplateRepository.getTemplates(search, categoryId, page, limit);
    }

    static async createTemplate(input: CreateTemplateInput) {
        // Kiểm tra loại thông báo có hợp lệ
        const category = await NotificationCategoryRepository.getCategoryById(input.category_id);
        if (!category) {
            throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Loại thông báo không tồn tại.');
        }

        // Kiểm tra trùng code
        const existingCode = await NotificationTemplateRepository.getTemplateByCode(input.code);
        if (existingCode) {
            throw new AppError(400, 'TEMPLATE_CODE_EXISTS', 'Mã mẫu thông báo đã tồn tại.');
        }

        const id = `NTPL_${uuidv4()}`;
        return await NotificationTemplateRepository.createTemplate(id, input);
    }

    static async updateTemplate(id: string, input: UpdateTemplateInput) {
        const existing = await NotificationTemplateRepository.getTemplateById(id);
        if (!existing) {
            throw new AppError(404, 'TEMPLATE_NOT_FOUND', 'Không tìm thấy mẫu thông báo này.');
        }

        if (input.category_id && input.category_id !== existing.category_id) {
            const category = await NotificationCategoryRepository.getCategoryById(input.category_id);
            if (!category) {
                throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Loại thông báo không hợp lệ.');
            }
        }

        return await NotificationTemplateRepository.updateTemplate(id, input);
    }

    static async deleteTemplate(id: string) {
        const existing = await NotificationTemplateRepository.getTemplateById(id);
        if (!existing) {
            throw new AppError(404, 'TEMPLATE_NOT_FOUND', 'Không tìm thấy mẫu thông báo này.');
        }

        if (existing.is_system) {
            throw new AppError(403, 'TEMPLATE_SYSTEM_PROTECTED', 'Không thể xóa mẫu thông báo hệ thống cốt lõi.');
        }

        const deleted = await NotificationTemplateRepository.deleteTemplate(id);
        if (!deleted) {
            throw new AppError(400, 'TEMPLATE_DELETE_FAILED', 'Xóa mẫu thông báo thất bại.');
        }
    }
}
