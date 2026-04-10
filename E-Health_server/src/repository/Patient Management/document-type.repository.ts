import { pool } from '../../config/postgresdb';
import {
    DocumentType,
    CreateDocumentTypeInput,
    UpdateDocumentTypeInput
} from '../../models/Patient Management/document-type.model';

export class DocumentTypeRepository {
    /**
     * Lấy danh sách loại tài liệu 
     */
    static async getAll(): Promise<DocumentType[]> {
        const query = `
            SELECT * FROM document_types
            WHERE deleted_at IS NULL
            ORDER BY created_at ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    /**
     * Lấy chi tiết loại tài liệu theo ID
     */
    static async getById(id: string): Promise<DocumentType | null> {
        const query = `SELECT * FROM document_types WHERE document_type_id = $1 AND deleted_at IS NULL`;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Kiểm tra mã code đã tồn tại chưa
     */
    static async findByCode(code: string): Promise<DocumentType | null> {
        const query = `SELECT * FROM document_types WHERE code = $1 AND deleted_at IS NULL`;
        const result = await pool.query(query, [code]);
        return result.rows[0] || null;
    }

    /**
     * Tạo mới loại tài liệu
     */
    static async create(id: string, input: CreateDocumentTypeInput): Promise<DocumentType> {
        const query = `
            INSERT INTO document_types (document_type_id, code, name, description, is_active)
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
     * Cập nhật loại tài liệu
     */
    static async update(id: string, input: UpdateDocumentTypeInput): Promise<DocumentType> {
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
            UPDATE document_types SET ${fields.join(', ')}
            WHERE document_type_id = $${paramIndex} AND deleted_at IS NULL
            RETURNING *
        `;
        const result = await pool.query(query, params);
        return result.rows[0];
    }

    /**
     * Kiểm tra loại tài liệu có đang được sử dụng bởi patient_documents không
     */
    static async isInUse(id: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT 1 FROM patient_documents WHERE document_type_id = $1 AND deleted_at IS NULL LIMIT 1`,
            [id]
        );
        return result.rows.length > 0;
    }

    /**
     * Xóa mềm loại tài liệu
     */
    static async softDelete(id: string): Promise<void> {
        await pool.query(
            `UPDATE document_types SET deleted_at = CURRENT_TIMESTAMP WHERE document_type_id = $1 AND deleted_at IS NULL`,
            [id]
        );
    }
}
