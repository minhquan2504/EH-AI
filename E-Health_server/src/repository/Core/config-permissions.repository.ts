import { pool } from '../../config/postgresdb';
import { ConfigPermissionMap } from '../../models/Core/system-settings.model';
import { randomUUID } from 'crypto';

export class ConfigPermissionsRepository {
    /**
     * Lấy toàn bộ phân quyền, nhóm theo role_code.
     */
    static async getAll(): Promise<ConfigPermissionMap> {
        // Lấy tất cả role codes trong hệ thống
        const rolesResult = await pool.query(`SELECT code FROM roles ORDER BY code`);
        const allRoles: string[] = rolesResult.rows.map((r: any) => r.code as string);

        // Lấy tất cả phân quyền hiện tại
        const permsResult = await pool.query(
            `SELECT role_code, module FROM system_config_permissions ORDER BY role_code, module`,
        );

        // Build map: khởi tạo với mảng rỗng cho mọi role
        const map: ConfigPermissionMap = {};
        for (const role of allRoles) {
            map[role] = [];
        }
        for (const row of permsResult.rows as any[]) {
            if (!map[row.role_code]) map[row.role_code] = [];
            map[row.role_code].push(row.module as string);
        }

        return map;
    }

    /**
     * Lấy danh sách các module mà một User được phép chỉnh sửa (dựa trên các Roles của họ)
     */
    static async getModulesByUserId(userId: string): Promise<string[]> {
        const query = `
            SELECT DISTINCT scp.module
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.roles_id
            JOIN system_config_permissions scp ON r.code = scp.role_code
            WHERE ur.user_id = $1
        `;
        const result = await pool.query(query, [userId]);
        return result.rows.map(row => row.module);
    }

    /**
     * Thay thế toàn bộ phân quyền trong 1 transaction.
     */
    static async bulkReplace(permissions: ConfigPermissionMap, updatedBy: string): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Xóa toàn bộ permissions cũ
            await client.query(`DELETE FROM system_config_permissions`);

            // Insert permissions mới
            for (const [roleCode, modules] of Object.entries(permissions)) {
                for (const module of modules) {
                    const id = `SCP_${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
                    await client.query(
                        `INSERT INTO system_config_permissions (id, role_code, module, updated_by, updated_at)
                         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                         ON CONFLICT (role_code, module) DO NOTHING`,
                        [id, roleCode, module, updatedBy],
                    );
                }
            }

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}
