import { pool } from '../../config/postgresdb';
import { NotificationRoleConfig, UpdateRoleConfigInput } from '../../models/Core/notification.model';

export class NotificationRoleConfigRepository {
    /**
     * Lấy toàn bộ ma trận phân quyền nhận thông báo theo Role (cho Admin xem)
     */
    static async getRoleConfigsMatrix(): Promise<any[]> {
        const query = `
            SELECT 
                r.roles_id, r.code as role_code, r.name as role_name,
                nc.notification_categories_id as category_id, nc.code as category_code, nc.name as category_name,
                COALESCE(nrc.notification_role_configs_id, null) as config_id,
                COALESCE(nrc.allow_inapp, true) as allow_inapp,
                COALESCE(nrc.allow_email, false) as allow_email,
                COALESCE(nrc.allow_push, false) as allow_push
            FROM roles r
            CROSS JOIN notification_categories nc
            LEFT JOIN notification_role_configs nrc 
                ON r.roles_id = nrc.role_id AND nc.notification_categories_id = nrc.category_id
            WHERE nc.deleted_at IS NULL AND r.deleted_at IS NULL
            ORDER BY r.code ASC, nc.name ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    /**
     * Lấy cấu hình của 1 Role đối với 1 Category (Dùng trong lúc bắn thông báo)
     */
    static async getConfig(roleId: string, categoryId: string): Promise<NotificationRoleConfig | null> {
        const query = `
            SELECT * FROM notification_role_configs
            WHERE role_id = $1 AND category_id = $2
        `;
        const result = await pool.query(query, [roleId, categoryId]);
        return result.rows[0] || null;
    }

    /**
     * Upsert 1 cấu hình
     */
    static async upsertConfig(
        id: string,
        roleId: string,
        categoryId: string,
        data: UpdateRoleConfigInput
    ): Promise<NotificationRoleConfig> {
        const query = `
            INSERT INTO notification_role_configs (
                notification_role_configs_id, role_id, category_id, allow_inapp, allow_email, allow_push
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (role_id, category_id) DO UPDATE 
            SET allow_inapp = excluded.allow_inapp,
                allow_email = excluded.allow_email,
                allow_push = excluded.allow_push,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;
        const result = await pool.query(query, [
            id, roleId, categoryId, data.allow_inapp, data.allow_email, data.allow_push
        ]);
        return result.rows[0];
    }
}
