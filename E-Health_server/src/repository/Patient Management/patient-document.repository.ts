import { pool } from '../../config/postgresdb';
import {
    PatientDocument,
    DocumentVersion,
    CreatePatientDocumentInput,
    UpdatePatientDocumentInput,
    PaginatedPatientDocuments
} from '../../models/Patient Management/patient-document.model';

export class PatientDocumentRepository {
    /**
     * Kiểm tra bệnh nhân có tồn tại không (dùng bảng patients, id kiểu UUID)
     */
    static async checkPatientExists(patientId: string): Promise<boolean> {
        const result = await pool.query(`SELECT 1 FROM patients WHERE id = $1`, [patientId]);
        return result.rows.length > 0;
    }

    /**
     * Kiểm tra loại tài liệu có tồn tại và đang active
     */
    static async checkDocumentTypeValid(typeId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT 1 FROM document_types WHERE document_type_id = $1 AND is_active = true AND deleted_at IS NULL`,
            [typeId]
        );
        return result.rows.length > 0;
    }

    /**
     * Tạo mới tài liệu (lưu metadata sau khi đã upload Cloudinary)
     */
    static async create(
        id: string,
        input: CreatePatientDocumentInput,
        fileUrl: string,
        fileFormat: string,
        fileSizeBytes: number,
        uploadedBy: string | null
    ): Promise<PatientDocument> {
        const query = `
            INSERT INTO patient_documents
                (patient_documents_id, patient_id, document_type_id, document_type, title, file_url, file_format, file_size_bytes, notes, uploaded_by)
            VALUES (
                $1, $2, $3,
                (SELECT code FROM document_types WHERE document_type_id = $3),
                $4, $5, $6, $7, $8, $9
            )
            RETURNING *
        `;
        const result = await pool.query(query, [
            id,
            input.patient_id,
            input.document_type_id,
            input.document_name,
            fileUrl,
            fileFormat,
            fileSizeBytes,
            input.notes || null,
            uploadedBy,
        ]);
        return result.rows[0];
    }

    /**
     * Lấy danh sách tài liệu theo bệnh nhân (phân trang, filter)
     */
    static async getByPatient(
        patientId: string,
        documentTypeId: string | null,
        page: number,
        limit: number
    ): Promise<PaginatedPatientDocuments> {
        const conditions: string[] = ['pd.patient_id = $1', 'pd.deleted_at IS NULL'];
        const params: (string | number)[] = [patientId];
        let paramIndex = 2;

        if (documentTypeId) {
            conditions.push(`pd.document_type_id = $${paramIndex++}`);
            params.push(documentTypeId);
        }

        const whereClause = conditions.join(' AND ');

        // Count tổng
        const countQuery = `SELECT COUNT(*) FROM patient_documents pd WHERE ${whereClause}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        // Data
        const offset = (page - 1) * limit;
        const dataQuery = `
            SELECT pd.*,
                   dt.code AS document_type_code,
                   dt.name AS document_type_name
            FROM patient_documents pd
            LEFT JOIN document_types dt ON dt.document_type_id = pd.document_type_id
            WHERE ${whereClause}
            ORDER BY pd.uploaded_at DESC
            OFFSET $${paramIndex} LIMIT $${paramIndex + 1}
        `;
        params.push(offset, limit);
        const dataResult = await pool.query(dataQuery, params);

        return {
            data: dataResult.rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Lấy chi tiết tài liệu theo ID
     */
    static async getById(id: string): Promise<PatientDocument | null> {
        const query = `
            SELECT pd.*,
                   dt.code AS document_type_code,
                   dt.name AS document_type_name
            FROM patient_documents pd
            LEFT JOIN document_types dt ON dt.document_type_id = pd.document_type_id
            WHERE pd.patient_documents_id = $1 AND pd.deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Cập nhật metadata tài liệu (tên, ghi chú, loại)
     * Khi đổi document_type_id, cũng đồng bộ cột `document_type` (code gốc)
     */
    static async updateMetadata(id: string, input: UpdatePatientDocumentInput): Promise<PatientDocument> {
        const fields: string[] = [];
        const params: string[] = [];
        let paramIndex = 1;

        if (input.document_name !== undefined) { fields.push(`title = $${paramIndex++}`); params.push(input.document_name); }
        if (input.document_type_id !== undefined) {
            fields.push(`document_type_id = $${paramIndex++}`);
            params.push(input.document_type_id);

            fields.push(`document_type = (SELECT code FROM document_types WHERE document_type_id = $${paramIndex - 1}::VARCHAR)`);
        }
        if (input.notes !== undefined) { fields.push(`notes = $${paramIndex++}`); params.push(input.notes); }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);

        const query = `
            UPDATE patient_documents SET ${fields.join(', ')}
            WHERE patient_documents_id = $${paramIndex} AND deleted_at IS NULL
            RETURNING *
        `;
        const result = await pool.query(query, params);
        return result.rows[0];
    }

    /**
     * Xóa mềm tài liệu
     */
    static async softDelete(id: string): Promise<void> {
        await pool.query(
            `UPDATE patient_documents SET deleted_at = CURRENT_TIMESTAMP WHERE patient_documents_id = $1 AND deleted_at IS NULL`,
            [id]
        );
    }


    /**
     * Lưu snapshot trạng thái hiện tại của tài liệu vào bảng lịch sử trước khi nâng version
     */
    static async snapshotToVersionHistory(doc: PatientDocument, versionId: string): Promise<void> {
        await pool.query(
            `INSERT INTO patient_document_versions
                (version_id, document_id, version_number, file_url, file_format, file_size_bytes, uploaded_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                versionId,
                doc.document_id,
                doc.version_number,
                doc.file_url,
                doc.file_format || null,
                doc.file_size_bytes || null,
                doc.uploaded_by || null,
            ]
        );
    }


    /**
     * Cập nhật file_url mới và tăng version_number trên bảng chính
     */
    static async upgradeVersion(
        id: string,
        fileUrl: string,
        fileFormat: string,
        fileSizeBytes: number,
        uploadedBy: string | null
    ): Promise<PatientDocument> {
        const query = `
            UPDATE patient_documents
            SET file_url = $1,
                file_format = $2,
                file_size_bytes = $3,
                uploaded_by = $4,
                version_number = version_number + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE patient_documents_id = $5 AND deleted_at IS NULL
            RETURNING *
        `;
        const result = await pool.query(query, [fileUrl, fileFormat, fileSizeBytes, uploadedBy, id]);
        return result.rows[0];
    }

    /**
     * Lấy toàn bộ lịch sử phiên bản (cũ) của một tài liệu, sắp xếp mới nhất trên
     */
    static async getVersionHistory(documentId: string): Promise<DocumentVersion[]> {
        const result = await pool.query(
            `SELECT * FROM patient_document_versions WHERE document_id = $1 ORDER BY version_number DESC`,
            [documentId]
        );
        return result.rows;
    }

    /**
     * Lấy chi tiết 1 phiên bản cụ thể theo versionId
     */
    static async getVersionById(versionId: string): Promise<DocumentVersion | null> {
        const result = await pool.query(
            `SELECT * FROM patient_document_versions WHERE version_id = $1`,
            [versionId]
        );
        return result.rows[0] || null;
    }
}

