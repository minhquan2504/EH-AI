import { pool } from '../../config/postgresdb';
import {
    Tag,
    PatientTagAssignment,
    CreateTagInput,
    UpdateTagInput,
    PaginatedTags
} from '../../models/Patient Management/patient-tag.model';

export class PatientTagRepository {


    /**
     * Kiểm tra code đã tồn tại chưa (dùng khi tạo mới)
     */
    static async isCodeExists(code: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT 1 FROM tags WHERE code = $1 AND deleted_at IS NULL`,
            [code]
        );
        return result.rows.length > 0;
    }

    /**
     * Tạo mới Tag
     */
    static async create(id: string, input: CreateTagInput): Promise<Tag> {
        const query = `
            INSERT INTO tags (tags_id, code, name, color_hex, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const result = await pool.query(query, [
            id,
            input.code,
            input.name,
            input.color_hex || '#000000',
            input.description || null,
        ]);
        return result.rows[0];
    }

    /**
     * Danh sách Tag (phân trang, filter is_active)
     */
    static async getAll(
        page: number,
        limit: number,
        isActive?: boolean
    ): Promise<PaginatedTags> {
        const conditions: string[] = ['deleted_at IS NULL'];
        const params: (string | number | boolean)[] = [];
        let paramIndex = 1;

        if (isActive !== undefined) {
            conditions.push(`is_active = $${paramIndex++}`);
            params.push(isActive);
        }

        const whereClause = conditions.join(' AND ');

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM tags WHERE ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count, 10);

        const offset = (page - 1) * limit;
        const dataResult = await pool.query(
            `SELECT * FROM tags WHERE ${whereClause} ORDER BY created_at DESC OFFSET $${paramIndex} LIMIT $${paramIndex + 1}`,
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
     * Chi tiết Tag theo ID
     */
    static async getById(id: string): Promise<Tag | null> {
        const result = await pool.query(
            `SELECT * FROM tags WHERE tags_id = $1 AND deleted_at IS NULL`,
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Cập nhật Tag (không cho đổi code)
     */
    static async update(id: string, input: UpdateTagInput): Promise<Tag> {
        const fields: string[] = [];
        const params: (string | null)[] = [];
        let paramIndex = 1;

        if (input.name !== undefined) { fields.push(`name = $${paramIndex++}`); params.push(input.name); }
        if (input.color_hex !== undefined) { fields.push(`color_hex = $${paramIndex++}`); params.push(input.color_hex); }
        if (input.description !== undefined) { fields.push(`description = $${paramIndex++}`); params.push(input.description); }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);

        const query = `
            UPDATE tags SET ${fields.join(', ')}
            WHERE tags_id = $${paramIndex} AND deleted_at IS NULL
            RETURNING *
        `;
        const result = await pool.query(query, params);
        return result.rows[0];
    }

    /**
     * Xóa mềm Tag
     */
    static async softDelete(id: string): Promise<void> {
        await pool.query(
            `UPDATE tags SET deleted_at = CURRENT_TIMESTAMP, is_active = false WHERE tags_id = $1 AND deleted_at IS NULL`,
            [id]
        );
    }


    /**
     * Kiểm tra bệnh nhân có tồn tại (bảng patients, PK = id kiểu UUID)
     */
    static async checkPatientExists(patientId: string): Promise<boolean> {
        const result = await pool.query(`SELECT 1 FROM patients WHERE id = $1`, [patientId]);
        return result.rows.length > 0;
    }

    /**
     * Kiểm tra tag có tồn tại và đang active
     */
    static async checkTagActive(tagId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT 1 FROM tags WHERE tags_id = $1 AND is_active = true AND deleted_at IS NULL`,
            [tagId]
        );
        return result.rows.length > 0;
    }

    /**
     * Kiểm tra bệnh nhân đã được gắn tag này chưa
     */
    static async isAssigned(patientId: string, tagId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT 1 FROM patient_tags WHERE patient_id = $1 AND tag_id = $2`,
            [patientId, tagId]
        );
        return result.rows.length > 0;
    }

    /**
     * Gắn tag cho bệnh nhân
     */
    static async assign(
        id: string,
        patientId: string,
        tagId: string,
        assignedBy: string | null
    ): Promise<PatientTagAssignment> {
        const query = `
            INSERT INTO patient_tags (patient_tags_id, patient_id, tag_id, assigned_by)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await pool.query(query, [id, patientId, tagId, assignedBy]);
        return result.rows[0];
    }

    /**
     * Danh sách tag đang gắn trên bệnh nhân (có JOIN lấy thông tin tag)
     */
    static async getByPatient(patientId: string): Promise<PatientTagAssignment[]> {
        const query = `
            SELECT pt.*,
                   t.code AS tag_code,
                   t.name AS tag_name,
                   t.color_hex AS tag_color_hex
            FROM patient_tags pt
            INNER JOIN tags t ON t.tags_id = pt.tag_id AND t.deleted_at IS NULL
            WHERE pt.patient_id = $1
            ORDER BY pt.assigned_at DESC
        `;
        const result = await pool.query(query, [patientId]);
        return result.rows;
    }

    /**
     * Gỡ tag khỏi bệnh nhân (Hard Delete mapping record)
     */
    static async remove(patientId: string, tagId: string): Promise<boolean> {
        const result = await pool.query(
            `DELETE FROM patient_tags WHERE patient_id = $1 AND tag_id = $2`,
            [patientId, tagId]
        );
        return (result.rowCount ?? 0) > 0;
    }
}
