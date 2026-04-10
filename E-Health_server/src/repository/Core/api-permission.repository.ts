import { pool } from '../../config/postgresdb';
import { ApiPermissionDetail, CreateApiPermissionInput, UpdateApiPermissionInput, ApiPermissionQueryFilter } from '../../models/Core/api-permission.model';
import { randomUUID } from 'crypto';

export class ApiPermissionRepository {
    /**
     * Lấy toàn bộ danh sách API Permissions (kèm Filters)
     */
    static async getAllApiPermissions(filter?: ApiPermissionQueryFilter): Promise<ApiPermissionDetail[]> {
        let query = `
            SELECT api_id, method, endpoint, description, module, status, created_at, updated_at
            FROM api_permissions
            WHERE deleted_at IS NULL
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (filter) {
            if (filter.search) {
                query += ` AND (endpoint ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
                params.push(`%${filter.search}%`);
                paramIndex++;
            }
            if (filter.module) {
                query += ` AND module = $${paramIndex}`;
                params.push(filter.module);
                paramIndex++;
            }
            if (filter.method) {
                query += ` AND method = $${paramIndex}`;
                params.push(filter.method);
                paramIndex++;
            }
            if (filter.status) {
                query += ` AND status = $${paramIndex}`;
                params.push(filter.status);
                paramIndex++;
            }
        }

        query += ` ORDER BY module ASC, endpoint ASC, method ASC`;
        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Lấy chi tiết API Permission theo ID
     */
    static async getApiPermissionById(apiId: string): Promise<ApiPermissionDetail | null> {
        const query = `
            SELECT api_id, method, endpoint, description, module, status
            FROM api_permissions
            WHERE api_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [apiId]);
        return result.rows.length ? result.rows[0] : null;
    }

    /**
     * Tìm kiếm một API Permission bằng Method và Endpoint
     */
    static async getApiByMethodAndEndpoint(method: string, endpoint: string): Promise<ApiPermissionDetail | null> {
        const query = `
            SELECT api_id, method, endpoint, description, module, status
            FROM api_permissions
            WHERE method = $1 AND endpoint = $2 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [method, endpoint]);
        return result.rows.length ? result.rows[0] : null;
    }

    /**
     * Thiết lập cấu hình API Endpoint mới
     */
    static async createApiPermission(
        apiId: string,
        data: CreateApiPermissionInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<ApiPermissionDetail> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const insertQuery = `
                INSERT INTO api_permissions (api_id, method, endpoint, description, module)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING api_id, method, endpoint, description, module, status, created_at
            `;
            const params = [apiId, data.method, data.endpoint, data.description || null, data.module || null];
            const result = await client.query(insertQuery, params);
            const newApi = result.rows[0];




            await client.query('COMMIT');
            return newApi;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Cập nhật API Endpoint (ví dụ đổi mô tả hoặc trạng thái)
     */
    static async updateApiPermission(
        apiId: string,
        data: UpdateApiPermissionInput,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<ApiPermissionDetail> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const oldRes = await client.query(`SELECT * FROM api_permissions WHERE api_id = $1`, [apiId]);
            const oldApi = oldRes.rows[0];

            const updates: string[] = [];
            const params: any[] = [apiId];
            let paramIndex = 2;

            if (data.method !== undefined) {
                updates.push(`method = $${paramIndex++}`);
                params.push(data.method);
            }
            if (data.endpoint !== undefined) {
                updates.push(`endpoint = $${paramIndex++}`);
                params.push(data.endpoint);
            }
            if (data.description !== undefined) {
                updates.push(`description = $${paramIndex++}`);
                params.push(data.description === "" ? null : data.description);
            }
            if (data.module !== undefined) {
                updates.push(`module = $${paramIndex++}`);
                params.push(data.module === "" ? null : data.module);
            }
            if (data.status !== undefined) {
                updates.push(`status = $${paramIndex++}`);
                params.push(data.status);
            }

            updates.push(`updated_at = CURRENT_TIMESTAMP`);

            const updateQuery = `
                UPDATE api_permissions
                SET ${updates.join(', ')}
                WHERE api_id = $1 AND deleted_at IS NULL
                RETURNING api_id, method, endpoint, description, module, status, updated_at
            `;
            const result = await client.query(updateQuery, params);
            const updatedApi = result.rows[0];




            await client.query('COMMIT');
            return updatedApi;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Xóa mềm API Permission và loại bỏ khỏi các Roles
     */
    static async deleteApiPermission(
        apiId: string,
        adminId: string,
        ipAddress: string | null = null,
        userAgent: string | null = null
    ): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const oldRes = await client.query(`SELECT * FROM api_permissions WHERE api_id = $1`, [apiId]);
            const oldApi = oldRes.rows[0];

            await client.query(`
                UPDATE api_permissions
                SET deleted_at = CURRENT_TIMESTAMP
                WHERE api_id = $1
            `, [apiId]);

            // Cascade Role-API
            await client.query(`DELETE FROM role_api_permissions WHERE api_id = $1`, [apiId]);




            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}
