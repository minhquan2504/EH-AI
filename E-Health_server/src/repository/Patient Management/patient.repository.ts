import { pool } from '../../config/postgresdb';
import {
    Patient,
    CreatePatientInput,
    UpdatePatientInput,
    PaginatedPatients,
    PatientQuickResult,
    PatientSummary
} from '../../models/Patient Management/patient.model';

export class PatientRepository {
    /**
     * Lấy số sequence tiếp theo để sinh mã bệnh nhân
     */
    static async getNextSequenceValue(): Promise<number> {
        const result = await pool.query(`SELECT nextval('patient_code_seq') AS seq`);
        return parseInt(result.rows[0].seq);
    }

    /**
     * Lấy danh sách hồ sơ bệnh nhân có phân trang, tìm kiếm, lọc
     */
    static async getPatients(
        search?: string,
        status?: string,
        gender?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedPatients> {
        let whereClause = 'WHERE p.deleted_at IS NULL';
        const params: any[] = [];
        let paramIndex = 1;

        if (status) {
            whereClause += ` AND p.status = $${paramIndex++}`;
            params.push(status);
        }
        if (gender) {
            whereClause += ` AND p.gender = $${paramIndex++}`;
            params.push(gender);
        }
        if (search) {
            whereClause += ` AND (p.full_name ILIKE $${paramIndex} OR p.patient_code ILIKE $${paramIndex} OR p.phone_number ILIKE $${paramIndex} OR p.id_card_number ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        // Count
        const countQuery = `SELECT COUNT(*) FROM patients p ${whereClause}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Data
        const offset = (page - 1) * limit;
        const dataQuery = `
            SELECT p.*,
                   a.email AS account_email,
                   a.phone_number AS account_phone
            FROM patients p
            LEFT JOIN users a ON a.users_id = p.account_id
            ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;
        params.push(limit, offset);
        const dataResult = await pool.query(dataQuery, params);

        return {
            data: dataResult.rows as Patient[],
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Lấy chi tiết hồ sơ bệnh nhân theo ID (JOIN thông tin tài khoản nếu có)
     */
    static async getPatientById(id: string): Promise<Patient | null> {
        const query = `
            SELECT p.*,
                   a.email AS account_email,
                   a.phone_number AS account_phone
            FROM patients p
            LEFT JOIN users a ON a.users_id = p.account_id
            WHERE p.id = $1 AND p.deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Kiểm tra CMND/CCCD đã tồn tại trong hệ thống chưa
     */
    static async checkIdCardExists(idCardNumber: string, excludeId?: string): Promise<boolean> {
        let query = `SELECT 1 FROM patients WHERE id_card_number = $1 AND deleted_at IS NULL`;
        const params: any[] = [idCardNumber];
        if (excludeId) {
            query += ' AND id != $2';
            params.push(excludeId);
        }
        const result = await pool.query(query, params);
        return result.rows.length > 0;
    }

    /**
     * Kiểm tra tài khoản người dùng tồn tại (dùng cho liên kết)
     */
    static async checkAccountExists(accountId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT 1 FROM users WHERE users_id = $1`, [accountId]
        );
        return result.rows.length > 0;
    }

    /**
     * Tạo mới hồ sơ bệnh nhân
     */
    static async createPatient(id: string, patientCode: string, input: CreatePatientInput): Promise<Patient> {
        const query = `
            INSERT INTO patients (
                id, patient_code, full_name, date_of_birth, gender,
                phone_number, email, id_card_number,
                address, province_id, district_id, ward_id,
                emergency_contact_name, emergency_contact_phone
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `;
        const result = await pool.query(query, [
            id,
            patientCode,
            input.full_name,
            input.date_of_birth,
            input.gender,
            input.phone_number || null,
            input.email || null,
            input.id_card_number || null,
            input.address || null,
            input.province_id || null,
            input.district_id || null,
            input.ward_id || null,
            input.emergency_contact_name || null,
            input.emergency_contact_phone || null,
        ]);
        return result.rows[0];
    }

    /**
     * Cập nhật thông tin hành chính bệnh nhân (chỉ các trường được truyền)
     */
    static async updatePatient(id: string, input: UpdatePatientInput): Promise<Patient> {
        const fields: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (input.full_name !== undefined) { fields.push(`full_name = $${paramIndex++}`); params.push(input.full_name); }
        if (input.date_of_birth !== undefined) { fields.push(`date_of_birth = $${paramIndex++}`); params.push(input.date_of_birth); }
        if (input.gender !== undefined) { fields.push(`gender = $${paramIndex++}`); params.push(input.gender); }
        if (input.phone_number !== undefined) { fields.push(`phone_number = $${paramIndex++}`); params.push(input.phone_number); }
        if (input.email !== undefined) { fields.push(`email = $${paramIndex++}`); params.push(input.email); }
        if (input.id_card_number !== undefined) { fields.push(`id_card_number = $${paramIndex++}`); params.push(input.id_card_number); }
        if (input.address !== undefined) { fields.push(`address = $${paramIndex++}`); params.push(input.address); }
        if (input.province_id !== undefined) { fields.push(`province_id = $${paramIndex++}`); params.push(input.province_id); }
        if (input.district_id !== undefined) { fields.push(`district_id = $${paramIndex++}`); params.push(input.district_id); }
        if (input.ward_id !== undefined) { fields.push(`ward_id = $${paramIndex++}`); params.push(input.ward_id); }
        if (input.emergency_contact_name !== undefined) { fields.push(`emergency_contact_name = $${paramIndex++}`); params.push(input.emergency_contact_name); }
        if (input.emergency_contact_phone !== undefined) { fields.push(`emergency_contact_phone = $${paramIndex++}`); params.push(input.emergency_contact_phone); }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);

        const query = `UPDATE patients SET ${fields.join(', ')} WHERE id = $${paramIndex} AND deleted_at IS NULL RETURNING *`;
        const result = await pool.query(query, params);
        return result.rows[0];
    }

    /**
     * Cập nhật trạng thái hồ sơ bệnh nhân (ACTIVE / INACTIVE)
     */
    static async updateStatus(id: string, status: string): Promise<Patient> {
        const query = `
            UPDATE patients SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND deleted_at IS NULL RETURNING *
        `;
        const result = await pool.query(query, [status, id]);
        return result.rows[0];
    }

    /**
     * Liên kết hồ sơ bệnh nhân với tài khoản Mobile App
     */
    static async linkAccount(id: string, accountId: string): Promise<Patient> {
        const query = `
            UPDATE patients SET account_id = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND deleted_at IS NULL RETURNING *
        `;
        const result = await pool.query(query, [accountId, id]);
        return result.rows[0];
    }

    /**
     * Hủy liên kết tài khoản khỏi hồ sơ bệnh nhân
     */
    static async unlinkAccount(id: string): Promise<Patient> {
        const query = `
            UPDATE patients SET account_id = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND deleted_at IS NULL RETURNING *
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Soft delete hồ sơ bệnh nhân
     */
    static async softDeletePatient(id: string): Promise<void> {
        await pool.query(
            `UPDATE patients SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL`,
            [id]
        );
    }

    /**
     * Cập nhật cờ has_insurance cho bệnh nhân (phục vụ billing nhanh)
     */
    static async updateInsuranceStatus(patientId: string, hasInsurance: boolean): Promise<void> {
        await pool.query(
            `UPDATE patients SET has_insurance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND deleted_at IS NULL`,
            [hasInsurance, patientId]
        );
    }

    /**
     * Danh sách bệnh nhân CÓ bảo hiểm (has_insurance = TRUE)
     */
    static async getPatientsWithInsurance(
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedPatients> {
        const offset = (page - 1) * limit;

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM patients WHERE has_insurance = TRUE AND deleted_at IS NULL`
        );
        const total = parseInt(countResult.rows[0].count, 10);

        const dataResult = await pool.query(
            `SELECT p.*, a.email AS account_email, a.phone_number AS account_phone
             FROM patients p
             LEFT JOIN users a ON a.users_id = p.account_id
             WHERE p.has_insurance = TRUE AND p.deleted_at IS NULL
             ORDER BY p.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        return {
            data: dataResult.rows as Patient[],
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Danh sách bệnh nhân KHÔNG CÓ bảo hiểm (has_insurance = FALSE)
     */
    static async getPatientsWithoutInsurance(
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedPatients> {
        const offset = (page - 1) * limit;

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM patients WHERE (has_insurance = FALSE OR has_insurance IS NULL) AND status = 'ACTIVE' AND deleted_at IS NULL`
        );
        const total = parseInt(countResult.rows[0].count, 10);

        const dataResult = await pool.query(
            `SELECT p.*, a.email AS account_email, a.phone_number AS account_phone
             FROM patients p
             LEFT JOIN users a ON a.users_id = p.account_id
             WHERE (p.has_insurance = FALSE OR p.has_insurance IS NULL) AND p.status = 'ACTIVE' AND p.deleted_at IS NULL
             ORDER BY p.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        return {
            data: dataResult.rows as Patient[],
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Lọc danh sách bệnh nhân theo tag(s).
     */
    static async filterByTags(
        tagIds: string[],
        matchAll: boolean,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedPatients> {
        const placeholders = tagIds.map((_, i) => `$${i + 1}`).join(', ');
        const paramIndex = tagIds.length + 1;

        /* Subquery tìm patient_id thỏa mãn điều kiện tag */
        let subquery: string;
        if (matchAll) {
            // AND: patient phải có đủ TẤT CẢ tags trong danh sách
            subquery = `
                SELECT pt.patient_id FROM patient_tags pt
                WHERE pt.tag_id IN (${placeholders})
                GROUP BY pt.patient_id
                HAVING COUNT(DISTINCT pt.tag_id) = ${tagIds.length}
            `;
        } else {
            // OR: patient có ÍT NHẤT 1 tag trong danh sách
            subquery = `
                SELECT DISTINCT pt.patient_id FROM patient_tags pt
                WHERE pt.tag_id IN (${placeholders})
            `;
        }

        // Count
        const countQuery = `
            SELECT COUNT(*) FROM patients p
            WHERE p.id IN (${subquery}) AND p.deleted_at IS NULL
        `;
        const countResult = await pool.query(countQuery, tagIds);
        const total = parseInt(countResult.rows[0].count, 10);

        // Data
        const offset = (page - 1) * limit;
        const dataQuery = `
            SELECT p.*, a.email AS account_email, a.phone_number AS account_phone
            FROM patients p
            LEFT JOIN users a ON a.users_id = p.account_id
            WHERE p.id IN (${subquery}) AND p.deleted_at IS NULL
            ORDER BY p.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        const dataResult = await pool.query(dataQuery, [...tagIds, limit, offset]);

        return {
            data: dataResult.rows as Patient[],
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }


    /**
     * Tìm kiếm nâng cao: keyword + gender + status + ageMin/ageMax (phân trang)
     */
    static async advancedSearch(
        keyword?: string,
        status?: string,
        gender?: string,
        ageMin?: number,
        ageMax?: number,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedPatients> {
        const conditions: string[] = ['p.deleted_at IS NULL'];
        const params: any[] = [];
        let paramIndex = 1;

        if (keyword) {
            conditions.push(`(p.full_name ILIKE $${paramIndex} OR p.patient_code ILIKE $${paramIndex} OR p.phone_number ILIKE $${paramIndex} OR p.id_card_number ILIKE $${paramIndex})`);
            params.push(`%${keyword}%`);
            paramIndex++;
        }
        if (status) {
            conditions.push(`p.status = $${paramIndex++}`);
            params.push(status);
        }
        if (gender) {
            conditions.push(`p.gender = $${paramIndex++}`);
            params.push(gender);
        }
        if (ageMin !== undefined) {
            conditions.push(`EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth)) >= $${paramIndex++}`);
            params.push(ageMin);
        }
        if (ageMax !== undefined) {
            conditions.push(`EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth)) <= $${paramIndex++}`);
            params.push(ageMax);
        }

        const whereClause = 'WHERE ' + conditions.join(' AND ');

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM patients p ${whereClause}`, params
        );
        const total = parseInt(countResult.rows[0].count, 10);

        const offset = (page - 1) * limit;
        const dataResult = await pool.query(
            `SELECT p.*, a.email AS account_email, a.phone_number AS account_phone
             FROM patients p
             LEFT JOIN users a ON a.users_id = p.account_id
             ${whereClause}
             ORDER BY p.full_name ASC
             LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
            [...params, limit, offset]
        );

        return {
            data: dataResult.rows as Patient[],
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Tìm kiếm nhanh (Autocomplete) — tối thiểu dữ liệu, tối đa tốc độ.
     */
    static async quickSearch(keyword: string): Promise<PatientQuickResult[]> {
        const query = `
            SELECT id, patient_code, full_name, phone_number, date_of_birth, gender
            FROM patients
            WHERE deleted_at IS NULL
              AND (full_name ILIKE $1 OR patient_code ILIKE $1 OR phone_number ILIKE $1 OR id_card_number ILIKE $1)
            ORDER BY full_name ASC
            LIMIT 10
        `;
        const result = await pool.query(query, [`%${keyword}%`]);
        return result.rows;
    }

    /**
     * Tra cứu tóm tắt hồ sơ — gộp subquery đếm tag, bảo hiểm, tiền sử, dị ứng.
     */
    static async getPatientSummary(id: string): Promise<PatientSummary | null> {
        const query = `
            SELECT
                p.id, p.patient_code, p.full_name, p.date_of_birth, p.gender,
                p.phone_number, p.email, p.id_card_number, p.address, p.status,
                COALESCE(p.has_insurance, false) AS has_insurance,
                EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth))::int AS age,
                (SELECT COUNT(*) FROM patient_tags pt WHERE pt.patient_id = p.id)::int AS tag_count,
                (SELECT COUNT(*) FROM patient_insurances pi2 WHERE pi2.patient_id = p.id::varchar)::int AS insurance_count,
                (SELECT COUNT(*) FROM patient_medical_histories pmh WHERE pmh.patient_id = p.id::varchar)::int AS medical_history_count,
                (SELECT COUNT(*) FROM patient_allergies pa WHERE pa.patient_id = p.id::varchar)::int AS allergy_count
            FROM patients p
            WHERE p.id = $1 AND p.deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }
}

