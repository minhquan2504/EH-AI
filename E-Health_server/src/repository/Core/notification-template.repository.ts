import { pool } from '../../config/postgresdb';
import { NotificationTemplate, CreateTemplateInput, UpdateTemplateInput } from '../../models/Core/notification.model';

export class NotificationTemplateRepository {
    /**
     * Lấy danh sách mẫu thông báo
     */
    static async getTemplates(
        search: string | undefined,
        categoryId: string | undefined,
        page: number,
        limit: number
    ): Promise<{ data: any[]; total: number; page: number; limit: number; totalPages: number }> {
        const conditions: string[] = ['nt.deleted_at IS NULL'];
        const params: any[] = [];
        let paramIdx = 1;

        if (categoryId) {
            conditions.push(`nt.category_id = $${paramIdx}`);
            params.push(categoryId);
            paramIdx++;
        }

        if (search) {
            conditions.push(`(nt.code ILIKE $${paramIdx} OR nt.name ILIKE $${paramIdx})`);
            params.push(`%${search}%`);
            paramIdx++;
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;
        const offset = (page - 1) * limit;

        const countQuery = `SELECT COUNT(*) FROM notification_templates nt ${whereClause}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT 
                nt.*,
                nc.code as category_code,
                nc.name as category_name
            FROM notification_templates nt
            JOIN notification_categories nc ON nt.category_id = nc.notification_categories_id
            ${whereClause}
            ORDER BY nt.created_at DESC
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
     * Thêm mới mẫu
     */
    static async createTemplate(id: string, input: CreateTemplateInput): Promise<NotificationTemplate> {
        const query = `
            INSERT INTO notification_templates (
                notification_templates_id, category_id, code, name, title_template, body_inapp, body_email, body_push
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const result = await pool.query(query, [
            id,
            input.category_id,
            input.code.toUpperCase(),
            input.name,
            input.title_template,
            input.body_inapp,
            input.body_email || null,
            input.body_push || null
        ]);
        return result.rows[0];
    }

    /**
     * Cập nhật mẫu thông báo
     */
    static async updateTemplate(id: string, data: UpdateTemplateInput): Promise<NotificationTemplate | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIdx = 1;

        if (data.category_id !== undefined) {
            fields.push(`category_id = $${paramIdx++}`);
            values.push(data.category_id);
        }
        if (data.name !== undefined) {
            fields.push(`name = $${paramIdx++}`);
            values.push(data.name);
        }
        if (data.title_template !== undefined) {
            fields.push(`title_template = $${paramIdx++}`);
            values.push(data.title_template);
        }
        if (data.body_inapp !== undefined) {
            fields.push(`body_inapp = $${paramIdx++}`);
            values.push(data.body_inapp);
        }
        if (data.body_email !== undefined) {
            fields.push(`body_email = $${paramIdx++}`);
            values.push(data.body_email);
        }
        if (data.body_push !== undefined) {
            fields.push(`body_push = $${paramIdx++}`);
            values.push(data.body_push);
        }
        if (data.is_active !== undefined) {
            fields.push(`is_active = $${paramIdx++}`);
            values.push(data.is_active);
        }

        if (fields.length === 0) return this.getTemplateById(id);

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const query = `
            UPDATE notification_templates
            SET ${fields.join(', ')}
            WHERE notification_templates_id = $${paramIdx} AND deleted_at IS NULL
            RETURNING *
        `;

        const result = await pool.query(query, values);
        return result.rows[0] || null;
    }

    /**
     * Xóa mềm mẫu thông báo
     */
    static async deleteTemplate(id: string): Promise<boolean> {
        const query = `
            UPDATE notification_templates
            SET deleted_at = CURRENT_TIMESTAMP, is_active = FALSE
            WHERE notification_templates_id = $1 AND deleted_at IS NULL AND is_system = FALSE
        `;
        const result = await pool.query(query, [id]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Lấy mẫu theo code 
     */
    static async getTemplateByCode(code: string): Promise<NotificationTemplate | null> {
        const query = `SELECT * FROM notification_templates WHERE code = $1 AND deleted_at IS NULL`;
        const result = await pool.query(query, [code]);
        return result.rows[0] || null;
    }

    /**
     * Lấy chi tiết mẫu theo Id
     */
    static async getTemplateById(id: string): Promise<NotificationTemplate | null> {
        const query = `SELECT * FROM notification_templates WHERE notification_templates_id = $1 AND deleted_at IS NULL`;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }
}
