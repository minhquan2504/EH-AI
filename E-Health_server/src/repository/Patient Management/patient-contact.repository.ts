import { pool } from '../../config/postgresdb';
import {
    PatientContact,
    CreatePatientContactInput,
    UpdatePatientContactInput,
    PaginatedPatientContacts
} from '../../models/Patient Management/patient-contact.model';

export class PatientContactRepository {
    /**
     * Lấy danh sách người thân có phân trang, hỗ trợ lọc theo patient_id
     */
    static async getContacts(
        patientId?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedPatientContacts> {
        let whereClause = 'WHERE pc.deleted_at IS NULL';
        const params: (string | number)[] = [];
        let paramIndex = 1;

        if (patientId) {
            whereClause += ` AND pc.patient_id = $${paramIndex++}`;
            params.push(patientId);
        }

        // Count
        const countQuery = `SELECT COUNT(*) FROM patient_contacts pc ${whereClause}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Data kèm JOIN relation_types và patients
        const offset = (page - 1) * limit;
        const dataQuery = `
            SELECT pc.*,
                   rt.code AS relation_type_code,
                   rt.name AS relation_type_name,
                   p.full_name AS patient_name,
                   p.patient_code AS patient_code
            FROM patient_contacts pc
            LEFT JOIN relation_types rt ON rt.relation_types_id = pc.relation_type_id
            LEFT JOIN patients p ON p.id = pc.patient_id
            ${whereClause}
            ORDER BY pc.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;
        params.push(limit, offset);
        const dataResult = await pool.query(dataQuery, params);

        return {
            data: dataResult.rows as PatientContact[],
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Lấy chi tiết người thân theo ID (kèm JOIN thông tin)
     */
    static async getById(id: string): Promise<PatientContact | null> {
        const query = `
            SELECT pc.*,
                   rt.code AS relation_type_code,
                   rt.name AS relation_type_name,
                   p.full_name AS patient_name,
                   p.patient_code AS patient_code
            FROM patient_contacts pc
            LEFT JOIN relation_types rt ON rt.relation_types_id = pc.relation_type_id
            LEFT JOIN patients p ON p.id = pc.patient_id
            WHERE pc.patient_contacts_id = $1 AND pc.deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Kiểm tra bệnh nhân tồn tại (chưa bị soft delete)
     */
    static async checkPatientExists(patientId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT 1 FROM patients WHERE id = $1 AND deleted_at IS NULL`,
            [patientId]
        );
        return result.rows.length > 0;
    }

    /**
     * Tạo mới người thân cho bệnh nhân
     */
    static async create(id: string, input: CreatePatientContactInput): Promise<PatientContact> {
        const query = `
            INSERT INTO patient_contacts (
                patient_contacts_id, patient_id, relation_type_id,
                contact_name, phone_number, address, is_emergency_contact
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const result = await pool.query(query, [
            id,
            input.patient_id,
            input.relation_type_id,
            input.contact_name,
            input.phone_number,
            input.address || null,
            input.is_emergency_contact !== undefined ? input.is_emergency_contact : false,
        ]);
        return result.rows[0];
    }

    /**
     * Cập nhật thông tin người thân
     */
    static async update(id: string, input: UpdatePatientContactInput): Promise<PatientContact> {
        const fields: string[] = [];
        const params: (string | boolean)[] = [];
        let paramIndex = 1;

        if (input.relation_type_id !== undefined) { fields.push(`relation_type_id = $${paramIndex++}`); params.push(input.relation_type_id); }
        if (input.contact_name !== undefined) { fields.push(`contact_name = $${paramIndex++}`); params.push(input.contact_name); }
        if (input.phone_number !== undefined) { fields.push(`phone_number = $${paramIndex++}`); params.push(input.phone_number); }
        if (input.address !== undefined) { fields.push(`address = $${paramIndex++}`); params.push(input.address); }
        if (input.is_emergency_contact !== undefined) { fields.push(`is_emergency_contact = $${paramIndex++}`); params.push(input.is_emergency_contact); }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);

        const query = `
            UPDATE patient_contacts SET ${fields.join(', ')}
            WHERE patient_contacts_id = $${paramIndex} AND deleted_at IS NULL
            RETURNING *
        `;
        const result = await pool.query(query, params);
        return result.rows[0];
    }

    /**
     * Xóa mềm người thân
     */
    static async softDelete(id: string): Promise<void> {
        await pool.query(
            `UPDATE patient_contacts SET deleted_at = CURRENT_TIMESTAMP WHERE patient_contacts_id = $1 AND deleted_at IS NULL`,
            [id]
        );
    }

    /**
     * Cập nhật cờ liên hệ khẩn cấp cho người thân
     */
    static async setEmergencyContact(id: string, isEmergency: boolean): Promise<PatientContact> {
        const query = `
            UPDATE patient_contacts
            SET is_emergency_contact = $2, updated_at = CURRENT_TIMESTAMP
            WHERE patient_contacts_id = $1 AND deleted_at IS NULL
            RETURNING *
        `;
        const result = await pool.query(query, [id, isEmergency]);
        return result.rows[0];
    }

    /**
     * Lấy danh sách liên hệ khẩn cấp của 1 bệnh nhân
     */
    static async getEmergencyContacts(patientId: string): Promise<PatientContact[]> {
        const query = `
            SELECT pc.*,
                   rt.code AS relation_type_code,
                   rt.name AS relation_type_name
            FROM patient_contacts pc
            LEFT JOIN relation_types rt ON rt.relation_types_id = pc.relation_type_id
            WHERE pc.patient_id = $1
              AND pc.is_emergency_contact = true
              AND pc.deleted_at IS NULL
            ORDER BY pc.created_at DESC
        `;
        const result = await pool.query(query, [patientId]);
        return result.rows;
    }

    /**
     * Chỉ định người đại diện pháp lý.
     */
    static async setLegalRepresentative(id: string, patientId: string, isLegalRep: boolean): Promise<PatientContact> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            if (isLegalRep) {
                // Unset tất cả legal rep cũ của cùng bệnh nhân
                await client.query(
                    `UPDATE patient_contacts
                     SET is_legal_representative = false, updated_at = CURRENT_TIMESTAMP
                     WHERE patient_id = $1 AND is_legal_representative = true AND deleted_at IS NULL`,
                    [patientId]
                );
            }

            // Set giá trị mới cho contact được chỉ định
            const result = await client.query(
                `UPDATE patient_contacts
                 SET is_legal_representative = $2, updated_at = CURRENT_TIMESTAMP
                 WHERE patient_contacts_id = $1 AND deleted_at IS NULL
                 RETURNING *`,
                [id, isLegalRep]
            );

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Lấy người đại diện pháp lý hiện tại của bệnh nhân (tối đa 1)
     */
    static async getLegalRepresentative(patientId: string): Promise<PatientContact | null> {
        const query = `
            SELECT pc.*,
                   rt.code AS relation_type_code,
                   rt.name AS relation_type_name
            FROM patient_contacts pc
            LEFT JOIN relation_types rt ON rt.relation_types_id = pc.relation_type_id
            WHERE pc.patient_id = $1
              AND pc.is_legal_representative = true
              AND pc.deleted_at IS NULL
            LIMIT 1
        `;
        const result = await pool.query(query, [patientId]);
        return result.rows[0] || null;
    }

    /**
     * Cập nhật ghi chú quyền quyết định y tế
     */
    static async updateMedicalDecisionNote(id: string, note: string): Promise<PatientContact> {
        const query = `
            UPDATE patient_contacts
            SET medical_decision_note = $2, updated_at = CURRENT_TIMESTAMP
            WHERE patient_contacts_id = $1 AND deleted_at IS NULL
            RETURNING *
        `;
        const result = await pool.query(query, [id, note]);
        return result.rows[0];
    }

    /**
     * Lấy ghi chú quyền quyết định y tế của 1 người thân
     */
    static async getMedicalDecisionNote(id: string): Promise<{ medical_decision_note: string | null } | null> {
        const query = `
            SELECT medical_decision_note
            FROM patient_contacts
            WHERE patient_contacts_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Lấy tất cả người liên hệ của bệnh nhân (không phân biệt cờ)
     */
    static async getAllRelations(patientId: string): Promise<PatientContact[]> {
        const query = `
            SELECT pc.*,
                   rt.code AS relation_type_code,
                   rt.name AS relation_type_name
            FROM patient_contacts pc
            LEFT JOIN relation_types rt ON rt.relation_types_id = pc.relation_type_id
            WHERE pc.patient_id = $1 AND pc.deleted_at IS NULL
            ORDER BY pc.created_at DESC
        `;
        const result = await pool.query(query, [patientId]);
        return result.rows;
    }

    /**
     * Lấy người thân thông thường (KHÔNG phải khẩn cấp VÀ KHÔNG phải đại diện pháp lý)
     */
    static async getNormalRelatives(patientId: string): Promise<PatientContact[]> {
        const query = `
            SELECT pc.*,
                   rt.code AS relation_type_code,
                   rt.name AS relation_type_name
            FROM patient_contacts pc
            LEFT JOIN relation_types rt ON rt.relation_types_id = pc.relation_type_id
            WHERE pc.patient_id = $1
              AND pc.is_emergency_contact = false
              AND pc.is_legal_representative = false
              AND pc.deleted_at IS NULL
            ORDER BY pc.created_at DESC
        `;
        const result = await pool.query(query, [patientId]);
        return result.rows;
    }

    /**
     * Lấy danh sách người giám hộ (is_legal_representative = true)
     */
    static async getGuardians(patientId: string): Promise<PatientContact[]> {
        const query = `
            SELECT pc.*,
                   rt.code AS relation_type_code,
                   rt.name AS relation_type_name
            FROM patient_contacts pc
            LEFT JOIN relation_types rt ON rt.relation_types_id = pc.relation_type_id
            WHERE pc.patient_id = $1
              AND pc.is_legal_representative = true
              AND pc.deleted_at IS NULL
            ORDER BY pc.created_at DESC
        `;
        const result = await pool.query(query, [patientId]);
        return result.rows;
    }
}
