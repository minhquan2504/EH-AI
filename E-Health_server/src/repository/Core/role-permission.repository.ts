import { pool } from '../../config/postgresdb';
import { RolePermissionDetail } from '../../models/Core/role-permission.model';
import { randomUUID } from 'crypto';

export class RolePermissionRepository {
    /**
     * Lấy danh sách Quyền của một Vai trò
     */
    static async getPermissionsByRoleId(roleId: string): Promise<RolePermissionDetail[]> {
        const query = `
            SELECT p.permissions_id as permission_id, p.code, p.module, p.description
            FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.permissions_id
            WHERE rp.role_id = $1 AND p.deleted_at IS NULL
            ORDER BY p.module ASC, p.code ASC
        `;
        const result = await pool.query(query, [roleId]);
        return result.rows;
    }

    /**
     * Thay thế toàn bộ quyền của một Vai trò
     */
    static async replacePermissions(
        roleId: string,
        permissionIds: string[],
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Snapshot quyền cũ để lưu Audit logs
            const getOldQuery = `SELECT permission_id FROM role_permissions WHERE role_id = $1`;
            const oldResult = await client.query(getOldQuery, [roleId]);
            const oldPermissions = oldResult.rows.map(r => r.permission_id);

            // Xóa toàn bộ quyền cũ
            await client.query(`DELETE FROM role_permissions WHERE role_id = $1`, [roleId]);

            // Insert quyền mới
            if (permissionIds.length > 0) {
                const insertPlaceholders: string[] = [];
                const values: any[] = [];

                permissionIds.forEach((permId, index) => {
                    insertPlaceholders.push(`($${index * 2 + 1}, $${index * 2 + 2})`);
                    values.push(roleId, permId);
                });

                const insertQuery = `
                    INSERT INTO role_permissions (role_id, permission_id)
                    VALUES ${insertPlaceholders.join(',')}
                    ON CONFLICT DO NOTHING
                `;
                await client.query(insertQuery, values);
            }

            // Ghi Audit Log


            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Gán lẻ một quyền cho Vai trò
     */
    static async assignPermission(
        roleId: string,
        permissionId: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(`
                INSERT INTO role_permissions (role_id, permission_id)
                VALUES ($1, $2)
                ON CONFLICT (role_id, permission_id) DO NOTHING
            `, [roleId, permissionId]);




            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Xóa vĩnh viễn một quyền lẻ khỏi Vai trò
     */
    static async removePermission(
        roleId: string,
        permissionId: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(`
                DELETE FROM role_permissions
                WHERE role_id = $1 AND permission_id = $2
            `, [roleId, permissionId]);




            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Lấy danh sách Feature Permissions hiển thị (distinct) dựa trên danh sách Roles
     */
    static async getFeaturePermissionsByRoleIds(roleIds: string[]): Promise<RolePermissionDetail[]> {
        if (!roleIds || roleIds.length === 0) return [];

        const placeholders = roleIds.map((_, i) => `$${i + 1}`).join(', ');

        const query = `
            SELECT DISTINCT p.permissions_id as permission_id, p.code, p.module, p.description
            FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.permissions_id
            WHERE rp.role_id IN (${placeholders}) AND p.deleted_at IS NULL
            ORDER BY p.module ASC, p.code ASC
        `;
        const result = await pool.query(query, roleIds);
        return result.rows;
    }
}
