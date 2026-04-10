import { pool } from '../../config/postgresdb';
import { RoleDetail, CreateRoleInput, UpdateRoleInput, RoleQueryFilter } from '../../models/Core/role.model';
import { AppError } from '../../utils/app-error.util';
import { SecurityUtil } from '../../utils/auth-security.util';

export class RoleRepository {
    /**
     * Lấy danh sách vai trò
     */
    static async getRoles(filter: RoleQueryFilter): Promise<RoleDetail[]> {
        let query = `
            SELECT roles_id, code, name, description, is_system, status
            FROM roles
            WHERE deleted_at IS NULL
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (filter.search) {
            query += ` AND (name ILIKE $${paramIndex} OR code ILIKE $${paramIndex})`;
            params.push(`%${filter.search}%`);
            paramIndex++;
        }

        if (filter.status) {
            query += ` AND status = $${paramIndex}`;
            params.push(filter.status);
            paramIndex++;
        }

        if (filter.is_system !== undefined) {
            query += ` AND is_system = $${paramIndex}`;
            params.push(filter.is_system);
            paramIndex++;
        }

        query += ` ORDER BY code ASC`;

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Lấy chi tiết một vai trò theo ID
     */
    static async getRoleById(roleId: string): Promise<RoleDetail | null> {
        const query = `
            SELECT roles_id, code, name, description, is_system, status
            FROM roles
            WHERE roles_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [roleId]);
        return result.rows.length ? result.rows[0] : null;
    }

    /**
     * Lấy chi tiết một vai trò theo Code
     */
    static async getRoleByCode(code: string): Promise<RoleDetail | null> {
        const query = `
            SELECT roles_id, code, name, description, is_system, status
            FROM roles
            WHERE code = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [code]);
        return result.rows.length ? result.rows[0] : null;
    }

    /**
     * Tạo vai trò mới
     */
    static async createRole(
        data: CreateRoleInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<RoleDetail> {
        const roleId = SecurityUtil.generateRoleId();
        const query = `
            INSERT INTO roles (roles_id, code, name, description)
            VALUES ($1, $2, $3, $4)
            RETURNING roles_id, code, name, description, is_system, status
        `;
        const params = [roleId, data.code, data.name, data.description || ''];
        const result = await pool.query(query, params);

        return result.rows[0];
    }

    /**
     * Cập nhật vai trò
     */
    static async updateRole(
        roleId: string,
        data: UpdateRoleInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<RoleDetail> {
        const currentRole = await this.getRoleById(roleId);
        if (!currentRole) throw new AppError(404, 'NOT_FOUND', 'Vai trò không tồn tại');

        const updates: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        const roleCopy = { ...currentRole };

        if (data.name !== undefined) {
            updates.push(`name = $${paramIndex++}`);
            params.push(data.name);
            roleCopy.name = data.name;
        }
        if (data.description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            params.push(data.description);
            roleCopy.description = data.description;
        }
        if (data.status !== undefined) {
            updates.push(`status = $${paramIndex++}`);
            params.push(data.status);
            roleCopy.status = data.status;
        }

        if (updates.length === 0) {
            return currentRole;
        }

        params.push(roleId);
        const query = `
            UPDATE roles
            SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE roles_id = $${paramIndex} AND deleted_at IS NULL
            RETURNING roles_id, code, name, description, is_system, status
        `;

        const result = await pool.query(query, params);
        return result.rows[0];
    }

    /**
     * Xóa vai trò
     */
    static async deleteRole(
        roleId: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        const currentRole = await this.getRoleById(roleId);
        if (!currentRole) return;

        // Soft delete
        const query = `UPDATE roles SET deleted_at = CURRENT_TIMESTAMP, status = 'INACTIVE' WHERE roles_id = $1`;
        await pool.query(query, [roleId]);
    }

    /**
     * Kiểm tra số lượng user đang gán role này
     */
    static async countUsersByRole(roleId: string): Promise<number> {
        const query = `SELECT COUNT(*) as count FROM user_roles ur JOIN users u ON ur.user_id = u.users_id WHERE ur.role_id = $1 AND u.deleted_at IS NULL`;
        const result = await pool.query(query, [roleId]);
        return parseInt(result.rows[0].count, 10);
    }
}
