import { pool } from '../../config/postgresdb';
import { NotificationCategory, CreateCategoryInput, UpdateCategoryInput } from '../../models/Core/notification.model';

export class NotificationCategoryRepository {
    /**
     * Lấy danh sách loại thông báo
     */
    static async getCategories(
        search: string | undefined,
        page: number,
        limit: number
    ): Promise<{ data: NotificationCategory[]; total: number; page: number; limit: number; totalPages: number }> {
        const conditions: string[] = ['deleted_at IS NULL'];
        const params: any[] = [];
        let paramIdx = 1;

        if (search) {
            conditions.push(`(code ILIKE $${paramIdx} OR name ILIKE $${paramIdx})`);
            params.push(`%${search}%`);
            paramIdx++;
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;
        const offset = (page - 1) * limit;

        const countQuery = `SELECT COUNT(*) FROM notification_categories ${whereClause}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT *
            FROM notification_categories
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
        `;
        const dataResult = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            data: dataResult.rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Thêm mới loại thông báo
     */
    static async createCategory(id: string, input: CreateCategoryInput): Promise<NotificationCategory> {
        const query = `
            INSERT INTO notification_categories (
                notification_categories_id, code, name, description
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await pool.query(query, [id, input.code.toUpperCase(), input.name, input.description]);
        return result.rows[0];
    }

    /**
     * Cập nhật loại thông báo
     */
    static async updateCategory(id: string, data: UpdateCategoryInput): Promise<NotificationCategory | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIdx = 1;

        if (data.name !== undefined) {
            fields.push(`name = $${paramIdx++}`);
            values.push(data.name);
        }
        if (data.description !== undefined) {
            fields.push(`description = $${paramIdx++}`);
            values.push(data.description);
        }
        if (data.is_active !== undefined) {
            fields.push(`is_active = $${paramIdx++}`);
            values.push(data.is_active);
        }

        if (fields.length === 0) return this.getCategoryById(id);

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const query = `
            UPDATE notification_categories
            SET ${fields.join(', ')}
            WHERE notification_categories_id = $${paramIdx} AND deleted_at IS NULL
            RETURNING *
        `;

        const result = await pool.query(query, values);
        return result.rows[0] || null;
    }

    /**
     * Xóa mềm loại thông báo
     */
    static async deleteCategory(id: string): Promise<boolean> {
        const query = `
            UPDATE notification_categories
            SET deleted_at = CURRENT_TIMESTAMP, is_active = FALSE
            WHERE notification_categories_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Lấy chi tiết category theo Id
     */
    static async getCategoryById(id: string): Promise<NotificationCategory | null> {
        const query = `SELECT * FROM notification_categories WHERE notification_categories_id = $1 AND deleted_at IS NULL`;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Lấy chi tiết category theo code
     */
    static async getCategoryByCode(code: string): Promise<NotificationCategory | null> {
        const query = `SELECT * FROM notification_categories WHERE code = $1 AND deleted_at IS NULL`;
        const result = await pool.query(query, [code]);
        return result.rows[0] || null;
    }

    /**
     * Lấy danh sách dropdown loại thông báo đang active
     */
    static async getActiveCategories(): Promise<NotificationCategory[]> {
        const query = `SELECT * FROM notification_categories WHERE is_active = TRUE AND deleted_at IS NULL ORDER BY name ASC`;
        const result = await pool.query(query);
        return result.rows;
    }
}
