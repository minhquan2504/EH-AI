import { pool } from '../../config/postgresdb';
import {
    RelationType,
    CreateRelationTypeInput,
    UpdateRelationTypeInput
} from '../../models/Patient Management/relation-type.model';

export class RelationTypeRepository {
    /**
     * Lấy danh sách loại quan hệ (chỉ lấy bản ghi chưa bị xóa mềm)
     */
    static async getAll(): Promise<RelationType[]> {
        const query = `
            SELECT * FROM relation_types
            WHERE deleted_at IS NULL
            ORDER BY created_at ASC
        `;
        const result = await pool.query(query);
        return result.rows as RelationType[];
    }

    /**
     * Lấy chi tiết loại quan hệ theo ID
     */
    static async getById(id: string): Promise<RelationType | null> {
        const query = `
            SELECT * FROM relation_types
            WHERE relation_types_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Kiểm tra mã code đã tồn tại chưa (phục vụ validate trùng lặp)
     */
    static async checkCodeExists(code: string, excludeId?: string): Promise<boolean> {
        let query = `SELECT 1 FROM relation_types WHERE code = $1 AND deleted_at IS NULL`;
        const params: string[] = [code];
        if (excludeId) {
            query += ' AND relation_types_id != $2';
            params.push(excludeId);
        }
        const result = await pool.query(query, params);
        return result.rows.length > 0;
    }

    /**
     * Kiểm tra loại quan hệ có đang được sử dụng trong patient_contacts không
     */
    static async isInUse(id: string): Promise<boolean> {
        const query = `
            SELECT 1 FROM patient_contacts
            WHERE relation_type_id = $1 AND deleted_at IS NULL
            LIMIT 1
        `;
        const result = await pool.query(query, [id]);
        return result.rows.length > 0;
    }

    /**
     * Tạo mới loại quan hệ
     */
    static async create(id: string, input: CreateRelationTypeInput): Promise<RelationType> {
        const query = `
            INSERT INTO relation_types (relation_types_id, code, name, description, is_active)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const result = await pool.query(query, [
            id,
            input.code.toUpperCase(),
            input.name,
            input.description || null,
            input.is_active !== undefined ? input.is_active : true,
        ]);
        return result.rows[0];
    }

    /**
     * Cập nhật loại quan hệ
     */
    static async update(id: string, input: UpdateRelationTypeInput): Promise<RelationType> {
        const fields: string[] = [];
        const params: (string | boolean)[] = [];
        let paramIndex = 1;

        if (input.code !== undefined) { fields.push(`code = $${paramIndex++}`); params.push(input.code.toUpperCase()); }
        if (input.name !== undefined) { fields.push(`name = $${paramIndex++}`); params.push(input.name); }
        if (input.description !== undefined) { fields.push(`description = $${paramIndex++}`); params.push(input.description); }
        if (input.is_active !== undefined) { fields.push(`is_active = $${paramIndex++}`); params.push(input.is_active); }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);

        const query = `
            UPDATE relation_types SET ${fields.join(', ')}
            WHERE relation_types_id = $${paramIndex} AND deleted_at IS NULL
            RETURNING *
        `;
        const result = await pool.query(query, params);
        return result.rows[0];
    }

    /**
     * Xóa mềm loại quan hệ
     */
    static async softDelete(id: string): Promise<void> {
        await pool.query(
            `UPDATE relation_types SET deleted_at = CURRENT_TIMESTAMP WHERE relation_types_id = $1 AND deleted_at IS NULL`,
            [id]
        );
    }
}
