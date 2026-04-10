import { pool } from '../../config/postgresdb';
import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import {
    PrescriptionRecord,
    CreatePrescriptionInput,
    UpdatePrescriptionInput,
    PrescriptionDetailRecord,
    CreateDetailInput,
    UpdateDetailInput,
    DrugSearchResult,
    PrescriptionSummary,
    PrescriptionSummaryItem,
} from '../../models/EMR/prescription.model';
import { PRESCRIPTION_CONFIG } from '../../constants/prescription.constant';

type QueryExecutor = Pool | PoolClient;

/**
 * Tạo ID đơn thuốc
 */
function generatePrescriptionId(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `RX_${yy}${mm}${dd}_${uuidv4().substring(0, 8)}`;
}

/**
 * Tạo mã đơn thuốc 
 */
function generatePrescriptionCode(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `RX-${yy}${mm}${dd}-${uuidv4().substring(0, 8).toUpperCase()}`;
}

/**
 * Tạo ID dòng thuốc
 */
function generateDetailId(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `RXD_${yy}${mm}${dd}_${uuidv4().substring(0, 8)}`;
}


export class PrescriptionRepository {

    //  ĐƠN THUỐC 

    /**
     * Tạo đơn thuốc mới
     */
    static async create(
        encounterId: string,
        doctorId: string,
        patientId: string,
        data: CreatePrescriptionInput,
        client: QueryExecutor = pool
    ): Promise<PrescriptionRecord> {
        const id = generatePrescriptionId();
        const code = generatePrescriptionCode();
        const result = await client.query(
            `INSERT INTO prescriptions (
                prescriptions_id, prescription_code, encounter_id,
                doctor_id, patient_id, status,
                clinical_diagnosis, doctor_notes, primary_diagnosis_id,
                prescribed_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, 'DRAFT', $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *`,
            [
                id, code, encounterId,
                doctorId, patientId,
                data.clinical_diagnosis || null,
                data.doctor_notes || null,
                data.primary_diagnosis_id || null,
            ]
        );
        return result.rows[0];
    }

    /**
     * Lấy đơn thuốc theo encounter_id (JOIN doctor + patient + diagnosis)
     */
    static async findByEncounterId(encounterId: string): Promise<PrescriptionRecord | null> {
        const result = await pool.query(
            `SELECT p.*,
                    up.full_name AS doctor_name,
                    pat.full_name AS patient_name,
                    ed.diagnosis_name,
                    ed.icd10_code
             FROM prescriptions p
             LEFT JOIN user_profiles up ON up.user_id = p.doctor_id
             LEFT JOIN patients pat ON pat.id::text = p.patient_id
             LEFT JOIN encounter_diagnoses ed ON ed.encounter_diagnoses_id = p.primary_diagnosis_id
             WHERE p.encounter_id = $1`,
            [encounterId]
        );
        return result.rows[0] || null;
    }

    /**
     * Lấy đơn thuốc theo ID
     */
    static async findById(prescriptionId: string): Promise<PrescriptionRecord | null> {
        const result = await pool.query(
            `SELECT p.*,
                    up.full_name AS doctor_name,
                    pat.full_name AS patient_name,
                    ed.diagnosis_name,
                    ed.icd10_code
             FROM prescriptions p
             LEFT JOIN user_profiles up ON up.user_id = p.doctor_id
             LEFT JOIN patients pat ON pat.id::text = p.patient_id
             LEFT JOIN encounter_diagnoses ed ON ed.encounter_diagnoses_id = p.primary_diagnosis_id
             WHERE p.prescriptions_id = $1`,
            [prescriptionId]
        );
        return result.rows[0] || null;
    }

    /**
     * Cập nhật thông tin đơn thuốc (header)
     */
    static async update(prescriptionId: string, data: UpdatePrescriptionInput): Promise<PrescriptionRecord | null> {
        const setClauses: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.clinical_diagnosis !== undefined) {
            setClauses.push(`clinical_diagnosis = $${paramIndex++}`);
            values.push(data.clinical_diagnosis);
        }
        if (data.doctor_notes !== undefined) {
            setClauses.push(`doctor_notes = $${paramIndex++}`);
            values.push(data.doctor_notes);
        }
        if (data.primary_diagnosis_id !== undefined) {
            setClauses.push(`primary_diagnosis_id = $${paramIndex++}`);
            values.push(data.primary_diagnosis_id || null);
        }

        if (values.length === 0) return this.findById(prescriptionId);

        values.push(prescriptionId);
        await pool.query(
            `UPDATE prescriptions SET ${setClauses.join(', ')} WHERE prescriptions_id = $${paramIndex} RETURNING *`,
            values
        );
        return this.findById(prescriptionId);
    }

    /**
     * Xác nhận đơn thuốc DRAFT → PRESCRIBED
     */
    static async confirm(prescriptionId: string, client: QueryExecutor = pool): Promise<void> {
        await client.query(
            `UPDATE prescriptions
             SET status = 'PRESCRIBED', prescribed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE prescriptions_id = $1`,
            [prescriptionId]
        );
    }

    /**
     * Hủy đơn thuốc
     */
    static async cancel(prescriptionId: string, cancelledReason: string | null, client: QueryExecutor = pool): Promise<void> {
        await client.query(
            `UPDATE prescriptions
             SET status = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP, cancelled_reason = $1, updated_at = CURRENT_TIMESTAMP
             WHERE prescriptions_id = $2`,
            [cancelledReason, prescriptionId]
        );
    }

    /**
     * Lịch sử đơn thuốc theo bệnh nhân (phân trang + filter)
     */
    static async findByPatientId(
        patientId: string,
        page: number,
        limit: number,
        status?: string,
        fromDate?: string,
        toDate?: string
    ): Promise<{ data: PrescriptionRecord[]; total: number }> {
        const conditions: string[] = ['p.patient_id = $1'];
        const values: any[] = [patientId];
        let paramIndex = 2;

        if (status) {
            conditions.push(`p.status = $${paramIndex++}`);
            values.push(status);
        }
        if (fromDate) {
            conditions.push(`p.prescribed_at >= $${paramIndex++}`);
            values.push(fromDate);
        }
        if (toDate) {
            conditions.push(`p.prescribed_at <= ($${paramIndex++}::date + INTERVAL '1 day')`);
            values.push(toDate);
        }

        const whereClause = conditions.join(' AND ');
        const offset = (page - 1) * limit;

        const countResult = await pool.query(
            `SELECT COUNT(*)::int AS total
             FROM prescriptions p
             WHERE ${whereClause}`,
            values
        );

        const dataValues = [...values, limit, offset];
        const dataResult = await pool.query(
            `SELECT p.*,
                    up.full_name AS doctor_name,
                    pat.full_name AS patient_name,
                    ed.diagnosis_name,
                    ed.icd10_code
             FROM prescriptions p
             LEFT JOIN user_profiles up ON up.user_id = p.doctor_id
             LEFT JOIN patients pat ON pat.id::text = p.patient_id
             LEFT JOIN encounter_diagnoses ed ON ed.encounter_diagnoses_id = p.primary_diagnosis_id
             WHERE ${whereClause}
             ORDER BY p.prescribed_at DESC
             LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
            dataValues
        );

        return { data: dataResult.rows, total: countResult.rows[0].total };
    }

    // DÒNG THUỐC (DETAILS)

    /**
     * Thêm dòng thuốc vào đơn
     */
    static async createDetail(prescriptionId: string, data: CreateDetailInput): Promise<PrescriptionDetailRecord> {
        const id = generateDetailId();

        /** Lấy sort_order lớn nhất hiện tại */
        const maxSort = await pool.query(
            `SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_sort
             FROM prescription_details
             WHERE prescription_id = $1 AND is_active = TRUE`,
            [prescriptionId]
        );

        const result = await pool.query(
            `INSERT INTO prescription_details (
                prescription_details_id, prescription_id, drug_id,
                quantity, dosage, frequency, duration_days,
                usage_instruction, route_of_administration, notes,
                sort_order, is_active, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *`,
            [
                id, prescriptionId, data.drug_id,
                data.quantity, data.dosage, data.frequency, data.duration_days || null,
                data.usage_instruction || null, data.route_of_administration || null, data.notes || null,
                maxSort.rows[0].next_sort,
            ]
        );
        return result.rows[0];
    }

    /**
     * Cập nhật dòng thuốc
     */
    static async updateDetail(detailId: string, data: UpdateDetailInput): Promise<PrescriptionDetailRecord | null> {
        const setClauses: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.quantity !== undefined) {
            setClauses.push(`quantity = $${paramIndex++}`);
            values.push(data.quantity);
        }
        if (data.dosage !== undefined) {
            setClauses.push(`dosage = $${paramIndex++}`);
            values.push(data.dosage);
        }
        if (data.frequency !== undefined) {
            setClauses.push(`frequency = $${paramIndex++}`);
            values.push(data.frequency);
        }
        if (data.duration_days !== undefined) {
            setClauses.push(`duration_days = $${paramIndex++}`);
            values.push(data.duration_days);
        }
        if (data.usage_instruction !== undefined) {
            setClauses.push(`usage_instruction = $${paramIndex++}`);
            values.push(data.usage_instruction);
        }
        if (data.route_of_administration !== undefined) {
            setClauses.push(`route_of_administration = $${paramIndex++}`);
            values.push(data.route_of_administration);
        }
        if (data.notes !== undefined) {
            setClauses.push(`notes = $${paramIndex++}`);
            values.push(data.notes);
        }

        if (values.length === 0) return this.findDetailById(detailId);

        values.push(detailId);
        await pool.query(
            `UPDATE prescription_details SET ${setClauses.join(', ')} WHERE prescription_details_id = $${paramIndex}`,
            values
        );
        return this.findDetailById(detailId);
    }

    /**
     * Xóa dòng thuốc (soft delete: is_active = FALSE)
     */
    static async deleteDetail(detailId: string): Promise<void> {
        await pool.query(
            `UPDATE prescription_details
             SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
             WHERE prescription_details_id = $1`,
            [detailId]
        );
    }

    /**
     * Lấy dòng thuốc theo ID (kèm thông tin thuốc)
     */
    static async findDetailById(detailId: string): Promise<PrescriptionDetailRecord | null> {
        const result = await pool.query(
            `SELECT pd.*,
                    d.drug_code,
                    d.brand_name,
                    d.active_ingredients,
                    d.dispensing_unit
             FROM prescription_details pd
             LEFT JOIN drugs d ON d.drugs_id = pd.drug_id
             WHERE pd.prescription_details_id = $1`,
            [detailId]
        );
        return result.rows[0] || null;
    }

    /**
     * Lấy danh sách dòng thuốc theo prescription_id (chỉ active)
     */
    static async findDetailsByPrescriptionId(prescriptionId: string): Promise<PrescriptionDetailRecord[]> {
        const result = await pool.query(
            `SELECT pd.*,
                    d.drug_code,
                    d.brand_name,
                    d.active_ingredients,
                    d.dispensing_unit
             FROM prescription_details pd
             LEFT JOIN drugs d ON d.drugs_id = pd.drug_id
             WHERE pd.prescription_id = $1 AND pd.is_active = TRUE
             ORDER BY pd.sort_order ASC`,
            [prescriptionId]
        );
        return result.rows;
    }

    /**
     * Đếm số dòng thuốc active trong đơn
     */
    static async countActiveDetails(prescriptionId: string): Promise<number> {
        const result = await pool.query(
            `SELECT COUNT(*)::int AS total
             FROM prescription_details
             WHERE prescription_id = $1 AND is_active = TRUE`,
            [prescriptionId]
        );
        return result.rows[0].total;
    }

    // TÌM KIẾM THUỐC

    /**
     * Tìm kiếm thuốc theo keyword (drug_code, brand_name, active_ingredients)
     */
    static async searchDrugs(
        query: string,
        categoryId?: string,
        limit: number = PRESCRIPTION_CONFIG.DRUG_SEARCH_LIMIT
    ): Promise<DrugSearchResult[]> {
        const conditions: string[] = ['d.is_active = TRUE'];
        const values: any[] = [];
        let paramIndex = 1;

        if (query) {
            conditions.push(
                `(LOWER(d.drug_code) LIKE LOWER($${paramIndex})
                  OR LOWER(d.brand_name) LIKE LOWER($${paramIndex})
                  OR LOWER(d.active_ingredients) LIKE LOWER($${paramIndex}))`
            );
            values.push(`%${query}%`);
            paramIndex++;
        }

        if (categoryId) {
            conditions.push(`d.category_id = $${paramIndex++}`);
            values.push(categoryId);
        }

        values.push(limit);
        const result = await pool.query(
            `SELECT d.drugs_id, d.drug_code, d.brand_name, d.active_ingredients,
                    d.category_id, dc.name AS category_name,
                    d.route_of_administration, d.dispensing_unit, d.is_prescription_only
             FROM drugs d
             LEFT JOIN drug_categories dc ON dc.drug_categories_id = d.category_id AND dc.deleted_at IS NULL
             WHERE ${conditions.join(' AND ')}
             ORDER BY d.brand_name ASC
             LIMIT $${paramIndex}`,
            values
        );
        return result.rows;
    }

    // TÓM TẮT ĐƠN THUỐC

    /**
     * Tóm tắt đơn thuốc cho encounter (header + list dòng thuốc summary)
     */
    static async getSummary(encounterId: string): Promise<PrescriptionSummary | null> {
        const prescResult = await pool.query(
            `SELECT p.prescriptions_id, p.prescription_code, p.status, p.prescribed_at,
                    p.clinical_diagnosis,
                    up.full_name AS doctor_name
             FROM prescriptions p
             LEFT JOIN user_profiles up ON up.user_id = p.doctor_id
             WHERE p.encounter_id = $1`,
            [encounterId]
        );

        if (prescResult.rows.length === 0) return null;

        const presc = prescResult.rows[0];

        const detailsResult = await pool.query(
            `SELECT d.drug_code, d.brand_name, d.active_ingredients,
                    pd.dosage, pd.frequency, pd.quantity,
                    pd.duration_days, pd.route_of_administration,
                    pd.usage_instruction, d.dispensing_unit, pd.notes
             FROM prescription_details pd
             JOIN drugs d ON d.drugs_id = pd.drug_id
             WHERE pd.prescription_id = $1 AND pd.is_active = TRUE
             ORDER BY pd.sort_order ASC`,
            [presc.prescriptions_id]
        );

        return {
            ...presc,
            total_items: detailsResult.rows.length,
            items: detailsResult.rows,
        };
    }

    // VALIDATION HELPERS

    /**
     * Kiểm tra encounter tồn tại và trả về thông tin cần thiết
     */
    static async getEncounterInfo(encounterId: string): Promise<{
        exists: boolean;
        status: string | null;
        patient_id: string | null;
        doctor_id: string | null;
        doctor_user_id: string | null;
    }> {
        const result = await pool.query(
            `SELECT e.status, e.patient_id, e.doctor_id, d.user_id AS doctor_user_id
             FROM encounters e
             LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
             WHERE e.encounters_id = $1`,
            [encounterId]
        );
        if (result.rows.length === 0) {
            return { exists: false, status: null, patient_id: null, doctor_id: null, doctor_user_id: null };
        }
        return { exists: true, ...result.rows[0] };
    }

    /**
     * Kiểm tra chẩn đoán tồn tại và thuộc encounter
     */
    static async diagnosisBelongsToEncounter(diagnosisId: string, encounterId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT EXISTS(
                SELECT 1 FROM encounter_diagnoses
                WHERE encounter_diagnoses_id = $1 AND encounter_id = $2
            ) AS belongs`,
            [diagnosisId, encounterId]
        );
        return result.rows[0].belongs;
    }

    /**
     * Kiểm tra thuốc tồn tại và đang active
     */
    static async drugExists(drugId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT EXISTS(
                SELECT 1 FROM drugs WHERE drugs_id = $1 AND is_active = TRUE
            ) AS exists`,
            [drugId]
        );
        return result.rows[0].exists;
    }

    /**
     * Kiểm tra bệnh nhân tồn tại
     */
    static async patientExists(patientId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM patients WHERE id::text = $1 AND deleted_at IS NULL) AS exists`,
            [patientId]
        );
        return result.rows[0].exists;
    }

    /**
     * Lịch sử đơn thuốc theo bác sĩ (phân trang + filter)
     */
    static async findByDoctorId(
        doctorId: string,
        page: number,
        limit: number,
        status?: string,
        fromDate?: string,
        toDate?: string
    ): Promise<{ data: PrescriptionRecord[]; total: number }> {
        const conditions: string[] = ['p.doctor_id = $1'];
        const values: any[] = [doctorId];
        let paramIndex = 2;

        if (status) {
            conditions.push(`p.status = $${paramIndex++}`);
            values.push(status);
        }
        if (fromDate) {
            conditions.push(`p.prescribed_at >= $${paramIndex++}`);
            values.push(fromDate);
        }
        if (toDate) {
            conditions.push(`p.prescribed_at <= ($${paramIndex++}::date + INTERVAL '1 day')`);
            values.push(toDate);
        }

        const whereClause = conditions.join(' AND ');
        const offset = (page - 1) * limit;

        const countResult = await pool.query(
            `SELECT COUNT(*)::int AS total
             FROM prescriptions p
             WHERE ${whereClause}`,
            values
        );

        const dataValues = [...values, limit, offset];
        const dataResult = await pool.query(
            `SELECT p.*,
                    up.full_name AS doctor_name,
                    pat.full_name AS patient_name,
                    ed.diagnosis_name,
                    ed.icd10_code
             FROM prescriptions p
             LEFT JOIN user_profiles up ON up.user_id = p.doctor_id
             LEFT JOIN patients pat ON pat.id::text = p.patient_id
             LEFT JOIN encounter_diagnoses ed ON ed.encounter_diagnoses_id = p.primary_diagnosis_id
             WHERE ${whereClause}
             ORDER BY p.prescribed_at DESC
             LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
            dataValues
        );

        return { data: dataResult.rows, total: countResult.rows[0].total };
    }

    /**
     * Kiểm tra bác sĩ (user) tồn tại
     */
    static async doctorExists(doctorId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM users WHERE users_id = $1 AND deleted_at IS NULL) AS exists`,
            [doctorId]
        );
        return result.rows[0].exists;
    }

    //  SEARCH (Module 5.9) 

    /**
     * Tìm kiếm tổng hợp đơn thuốc — multi-filter + text search + phân trang
     */
    static async searchPrescriptions(
        page: number, limit: number,
        q?: string, status?: string, doctorId?: string, patientId?: string,
        fromDate?: string, toDate?: string
    ): Promise<{ data: PrescriptionRecord[]; total: number }> {
        const conditions: string[] = [];
        const values: any[] = [];
        let paramIdx = 1;

        if (q) {
            conditions.push(`(p.prescription_code ILIKE $${paramIdx} OR pat.full_name ILIKE $${paramIdx} OR up.full_name ILIKE $${paramIdx})`);
            values.push(`%${q}%`);
            paramIdx++;
        }
        if (status) { conditions.push(`p.status = $${paramIdx++}`); values.push(status); }
        if (doctorId) { conditions.push(`p.doctor_id = $${paramIdx++}`); values.push(doctorId); }
        if (patientId) { conditions.push(`p.patient_id = $${paramIdx++}`); values.push(patientId); }
        if (fromDate) { conditions.push(`p.prescribed_at >= $${paramIdx++}`); values.push(fromDate); }
        if (toDate) { conditions.push(`p.prescribed_at <= ($${paramIdx++}::date + INTERVAL '1 day')`); values.push(toDate); }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const offset = (page - 1) * limit;

        const countR = await pool.query(
            `SELECT COUNT(*)::int AS total
             FROM prescriptions p
             LEFT JOIN user_profiles up ON up.user_id = p.doctor_id
             LEFT JOIN patients pat ON pat.id::text = p.patient_id
             ${whereClause}`, values
        );

        const dataValues = [...values, limit, offset];
        const dataR = await pool.query(
            `SELECT p.*,
                    up.full_name AS doctor_name,
                    pat.full_name AS patient_name,
                    ed.diagnosis_name, ed.icd10_code,
                    (SELECT COUNT(*)::int FROM prescription_details pd WHERE pd.prescription_id = p.prescriptions_id AND pd.is_active = TRUE) AS detail_count
             FROM prescriptions p
             LEFT JOIN user_profiles up ON up.user_id = p.doctor_id
             LEFT JOIN patients pat ON pat.id::text = p.patient_id
             LEFT JOIN encounter_diagnoses ed ON ed.encounter_diagnoses_id = p.primary_diagnosis_id
             ${whereClause}
             ORDER BY p.prescribed_at DESC
             LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
            dataValues
        );

        return { data: dataR.rows, total: countR.rows[0].total };
    }

    /**
     * Tìm đơn thuốc theo mã đơn (prescription_code) — trả về kèm details
     */
    static async findByCode(code: string): Promise<PrescriptionRecord | null> {
        const r = await pool.query(
            `SELECT p.*,
                    up.full_name AS doctor_name,
                    pat.full_name AS patient_name,
                    ed.diagnosis_name, ed.icd10_code
             FROM prescriptions p
             LEFT JOIN user_profiles up ON up.user_id = p.doctor_id
             LEFT JOIN patients pat ON pat.id::text = p.patient_id
             LEFT JOIN encounter_diagnoses ed ON ed.encounter_diagnoses_id = p.primary_diagnosis_id
             WHERE p.prescription_code = $1`, [code]
        );
        return r.rows[0] || null;
    }

    /**
     * Thống kê đơn thuốc theo trạng thái
     */
    static async getStats(
        doctorId?: string, patientId?: string, fromDate?: string, toDate?: string
    ): Promise<Record<string, number>> {
        const conditions: string[] = [];
        const values: any[] = [];
        let paramIdx = 1;

        if (doctorId) { conditions.push(`doctor_id = $${paramIdx++}`); values.push(doctorId); }
        if (patientId) { conditions.push(`patient_id = $${paramIdx++}`); values.push(patientId); }
        if (fromDate) { conditions.push(`prescribed_at >= $${paramIdx++}`); values.push(fromDate); }
        if (toDate) { conditions.push(`prescribed_at <= ($${paramIdx++}::date + INTERVAL '1 day')`); values.push(toDate); }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const r = await pool.query(
            `SELECT status, COUNT(*)::int AS count FROM prescriptions ${whereClause} GROUP BY status`, values
        );

        const stats: Record<string, number> = { DRAFT: 0, PRESCRIBED: 0, DISPENSED: 0, CANCELLED: 0, total: 0 };
        for (const row of r.rows) {
            stats[row.status] = row.count;
            stats.total += row.count;
        }
        return stats;
    }
}
