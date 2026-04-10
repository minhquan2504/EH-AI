import { v4 as uuidv4 } from 'uuid';
import { NotificationRoleConfigRepository } from '../../repository/Core/notification-role-config.repository';
import { UpdateRoleConfigInput } from '../../models/Core/notification.model';

export class NotificationRoleConfigService {
    /**
     * Transform query matrix thành dạng gom nhóm (Grouped) để UI vẽ bảng dễ hơn
     */
    static async getRoleConfigsMatrix() {
        const rawRows = await NotificationRoleConfigRepository.getRoleConfigsMatrix();

        // Nhóm lại theo Role -> mảng các Categories
        const grouped: Record<string, any> = {};

        for (const row of rawRows) {
            if (!grouped[row.role_code]) {
                grouped[row.role_code] = {
                    role_id: row.roles_id,
                    role_code: row.role_code,
                    role_name: row.role_name,
                    categories: []
                };
            }

            grouped[row.role_code].categories.push({
                config_id: row.config_id,
                category_id: row.category_id,
                category_code: row.category_code,
                category_name: row.category_name,
                allow_inapp: row.allow_inapp,
                allow_email: row.allow_email,
                allow_push: row.allow_push
            });
        }

        return Object.values(grouped);
    }

    /**
     * Cập nhật / Upsert config
     */
    static async updateConfig(roleId: string, categoryId: string, input: UpdateRoleConfigInput) {
        const id = `NRC_${uuidv4()}`;
        return await NotificationRoleConfigRepository.upsertConfig(id, roleId, categoryId, input);
    }
}
