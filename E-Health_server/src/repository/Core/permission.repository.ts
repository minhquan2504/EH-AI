import { pool } from '../../config/postgresdb';
import { PermissionDetail, CreatePermissionInput, UpdatePermissionInput, PermissionQueryFilter } from '../../models/Core/permission.model';
import { AppError } from '../../utils/app-error.util';
import { SecurityUtil } from '../../utils/auth-security.util';

export class PermissionRepository {
    /**
     * Lấy danh sách quyền
     */
    static async getPermissions(filter: PermissionQueryFilter): Promise<PermissionDetail[]> {
        let query = `
            SELECT permissions_id, code, module, description
            FROM permissions
            WHERE deleted_at IS NULL
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (filter.search) {
            query += ` AND (code ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
            params.push(`%${filter.search}%`);
            paramIndex++;
        }

        if (filter.module) {
            query += ` AND module = $${paramIndex}`;
            params.push(filter.module);
            paramIndex++;
        }

        query += ` ORDER BY module ASC, code ASC`;

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Lấy danh sách các Module riêng biệt
     */
    static async getDistinctModules(): Promise<string[]> {
        const query = `
            SELECT DISTINCT module
            FROM permissions
            WHERE deleted_at IS NULL
            ORDER BY module ASC
        `;
        const result = await pool.query(query);
        return result.rows.map(row => row.module);
    }

    /**
     * Lấy chi tiết quyền theo ID
     */
    static async getPermissionById(id: string): Promise<PermissionDetail | null> {
        const query = `
            SELECT permissions_id, code, module, description
            FROM permissions
            WHERE permissions_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return result.rows.length ? result.rows[0] : null;
    }

    /**
     * Lấy chi tiết quyền theo Code
     */
    static async getPermissionByCode(code: string): Promise<PermissionDetail | null> {
        const query = `
            SELECT permissions_id, code, module, description
            FROM permissions
            WHERE code = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [code]);
        return result.rows.length ? result.rows[0] : null;
    }

    /**
     * Tạo quyền mới
     */
    static async createPermission(
        data: CreatePermissionInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<PermissionDetail> {
        const permissionId = SecurityUtil.generatePermissionId();

        const query = `
            INSERT INTO permissions (permissions_id, code, module, description)
            VALUES ($1, $2, $3, $4)
            RETURNING permissions_id, code, module, description
        `;
        const params = [permissionId, data.code, data.module, data.description || ''];
        const result = await pool.query(query, params);

        return result.rows[0];
    }

    /**
     * Cập nhật quyền
     */
    static async updatePermission(
        permissionId: string,
        data: UpdatePermissionInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<PermissionDetail> {
        const currentPermission = await this.getPermissionById(permissionId);
        if (!currentPermission) throw new AppError(404, 'NOT_FOUND', 'Quyền không tồn tại');

        const updates: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;
        const permissionCopy = { ...currentPermission };

        if (data.module !== undefined) {
            updates.push(`module = $${paramIndex++}`);
            params.push(data.module);
            permissionCopy.module = data.module;
        }
        if (data.description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            params.push(data.description);
            permissionCopy.description = data.description;
        }

        if (updates.length === 0) {
            return currentPermission;
        }

        params.push(permissionId);
        const query = `
            UPDATE permissions
            SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE permissions_id = $${paramIndex} AND deleted_at IS NULL
            RETURNING permissions_id, code, module, description
        `;

        const result = await pool.query(query, params);
        return result.rows[0];
    }

    /**
     * Xóa quyền
     */
    static async deletePermission(
        permissionId: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        const currentPermission = await this.getPermissionById(permissionId);
        if (!currentPermission) return;

        // Soft delete
        const query = `UPDATE permissions SET deleted_at = CURRENT_TIMESTAMP WHERE permissions_id = $1`;
        await pool.query(query, [permissionId]);
    }

    /**
     * Kiểm tra bao nhiêu vai trò (Role) đang sử dụng quyền này
     */
    static async countRolesByPermission(permissionId: string): Promise<number> {
        const query = `SELECT COUNT(*) as count FROM role_permissions WHERE permission_id = $1`;
        const result = await pool.query(query, [permissionId]);
        return parseInt(result.rows[0].count, 10);
    }

    /**
     * Lấy danh sách toàn bộ mã quyền (code) của người dùng thông qua các Role họ sở hữu
     */
    static async getAggregatedPermissionsForUser(userId: string): Promise<string[]> {
        const query = `
            SELECT DISTINCT p.code
            FROM user_roles ur
            JOIN role_permissions rp ON ur.role_id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.permissions_id
            WHERE ur.user_id = $1 AND p.deleted_at IS NULL
        `;
        const result = await pool.query(query, [userId]);
        return result.rows.map(row => row.code);
    }
}
