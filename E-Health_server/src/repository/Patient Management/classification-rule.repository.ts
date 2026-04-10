import { pool } from '../../config/postgresdb';
import {
    ClassificationRule,
    CreateRuleInput,
    UpdateRuleInput,
    PaginatedRules
} from '../../models/Patient Management/classification-rule.model';

export class ClassificationRuleRepository {

    /**
     * Kiểm tra tag đích có tồn tại và active
     */
    static async checkTagExists(tagId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT 1 FROM tags WHERE tags_id = $1 AND is_active = true AND deleted_at IS NULL`,
            [tagId]
        );
        return result.rows.length > 0;
    }

    /**
     * Tạo mới Rule
     */
    static async create(id: string, input: CreateRuleInput): Promise<ClassificationRule> {
        const query = `
            INSERT INTO patient_classification_rules
                (rule_id, name, criteria_type, criteria_operator, criteria_value, target_tag_id, timeframe_days)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const result = await pool.query(query, [
            id,
            input.name,
            input.criteria_type,
            input.criteria_operator,
            input.criteria_value,
            input.target_tag_id,
            input.timeframe_days ?? null,
        ]);
        return result.rows[0];
    }

    /**
     * Danh sách rules (phân trang, filter active)
     */
    static async getAll(page: number, limit: number, isActive?: boolean): Promise<PaginatedRules> {
        const conditions: string[] = ['r.deleted_at IS NULL'];
        const params: (string | number | boolean)[] = [];
        let paramIndex = 1;

        if (isActive !== undefined) {
            conditions.push(`r.is_active = $${paramIndex++}`);
            params.push(isActive);
        }

        const whereClause = conditions.join(' AND ');

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM patient_classification_rules r WHERE ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count, 10);

        const offset = (page - 1) * limit;
        const dataResult = await pool.query(
            `SELECT r.*, t.code AS tag_code, t.name AS tag_name, t.color_hex AS tag_color_hex
             FROM patient_classification_rules r
             LEFT JOIN tags t ON t.tags_id = r.target_tag_id
             WHERE ${whereClause}
             ORDER BY r.created_at DESC
             OFFSET $${paramIndex} LIMIT $${paramIndex + 1}`,
            [...params, offset, limit]
        );

        return {
            data: dataResult.rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Chi tiết Rule theo ID (có JOIN tag)
     */
    static async getById(id: string): Promise<ClassificationRule | null> {
        const result = await pool.query(
            `SELECT r.*, t.code AS tag_code, t.name AS tag_name, t.color_hex AS tag_color_hex
             FROM patient_classification_rules r
             LEFT JOIN tags t ON t.tags_id = r.target_tag_id
             WHERE r.rule_id = $1 AND r.deleted_at IS NULL`,
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Cập nhật Rule
     */
    static async update(id: string, input: UpdateRuleInput): Promise<ClassificationRule> {
        const fields: string[] = [];
        const params: (string | number | boolean | null)[] = [];
        let paramIndex = 1;

        if (input.name !== undefined) { fields.push(`name = $${paramIndex++}`); params.push(input.name); }
        if (input.criteria_type !== undefined) { fields.push(`criteria_type = $${paramIndex++}`); params.push(input.criteria_type); }
        if (input.criteria_operator !== undefined) { fields.push(`criteria_operator = $${paramIndex++}`); params.push(input.criteria_operator); }
        if (input.criteria_value !== undefined) { fields.push(`criteria_value = $${paramIndex++}`); params.push(input.criteria_value); }
        if (input.target_tag_id !== undefined) { fields.push(`target_tag_id = $${paramIndex++}`); params.push(input.target_tag_id); }
        if (input.timeframe_days !== undefined) { fields.push(`timeframe_days = $${paramIndex++}`); params.push(input.timeframe_days); }
        if (input.is_active !== undefined) { fields.push(`is_active = $${paramIndex++}`); params.push(input.is_active); }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);

        const query = `
            UPDATE patient_classification_rules SET ${fields.join(', ')}
            WHERE rule_id = $${paramIndex} AND deleted_at IS NULL
            RETURNING *
        `;
        const result = await pool.query(query, params);
        return result.rows[0];
    }

    /**
     * Xóa mềm Rule
     */
    static async softDelete(id: string): Promise<void> {
        await pool.query(
            `UPDATE patient_classification_rules SET deleted_at = CURRENT_TIMESTAMP, is_active = false WHERE rule_id = $1 AND deleted_at IS NULL`,
            [id]
        );
    }
}
