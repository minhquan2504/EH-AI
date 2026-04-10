import { pool } from '../../config/postgresdb';
import { TelePrescription, PrescriptionItem, DrugRestriction, TeleRxFilter } from '../../models/Remote Consultation/tele-prescription.model';
import { v4 as uuidv4 } from 'uuid';

/**
 * Data Access Layer cho kê đơn & chỉ định từ xa
 */
export class TelePrescriptionRepository {

    // ═══════════════════════════════════════════════════
    // TELE_PRESCRIPTIONS
    // ═══════════════════════════════════════════════════

    /** Tạo record tele_prescriptions */
    static async create(data: Record<string, any>): Promise<TelePrescription> {
        const r = await pool.query(`
            INSERT INTO tele_prescriptions (
                tele_prescription_id, prescription_id, tele_consultation_id, encounter_id
            ) VALUES ($1, $2, $3, $4) RETURNING *
        `, [data.tele_prescription_id, data.prescription_id, data.tele_consultation_id, data.encounter_id]);
        return r.rows[0];
    }

    /** Tìm theo consultation */
    static async findByConsultationId(consultationId: string): Promise<TelePrescription | null> {
        const r = await pool.query(`
            SELECT tp.*, p.prescription_code, p.status AS prescription_status,
                   p.clinical_diagnosis, p.doctor_notes,
                   up_doc.full_name AS doctor_name,
                   up_pat.full_name AS patient_name
            FROM tele_prescriptions tp
            JOIN prescriptions p ON tp.prescription_id = p.prescriptions_id
            LEFT JOIN users u_doc ON p.doctor_id = u_doc.users_id
            LEFT JOIN user_profiles up_doc ON u_doc.users_id = up_doc.user_id
            LEFT JOIN encounters enc ON tp.encounter_id = enc.encounters_id
            LEFT JOIN patients pat ON enc.patient_id = pat.id::varchar
            LEFT JOIN user_profiles up_pat ON pat.account_id = up_pat.user_id
            WHERE tp.tele_consultation_id = $1
        `, [consultationId]);
        return r.rows[0] || null;
    }

    /** Cập nhật tele_prescriptions */
    static async update(telePrescriptionId: string, data: Record<string, any>): Promise<void> {
        const setClauses: string[] = [];
        const values: any[] = [];
        let idx = 1;
        for (const [key, val] of Object.entries(data)) {
            setClauses.push(`${key} = $${idx++}`);
            values.push(val);
        }
        setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(telePrescriptionId);
        await pool.query(`UPDATE tele_prescriptions SET ${setClauses.join(', ')} WHERE tele_prescription_id = $${idx}`, values);
    }

    // ═══════════════════════════════════════════════════
    // PRESCRIPTIONS (bảng EMR)
    // ═══════════════════════════════════════════════════

    /** Tạo prescription header (EMR) */
    static async createPrescription(data: Record<string, any>): Promise<any> {
        const r = await pool.query(`
            INSERT INTO prescriptions (
                prescriptions_id, prescription_code, encounter_id, doctor_id, patient_id,
                status, clinical_diagnosis, doctor_notes
            ) VALUES ($1, $2, $3, $4, $5, 'DRAFT', $6, $7) RETURNING *
        `, [data.prescriptions_id, data.prescription_code, data.encounter_id,
            data.doctor_id, data.patient_id, data.clinical_diagnosis, data.doctor_notes]);
        return r.rows[0];
    }

    /** Cập nhật trạng thái prescription */
    static async updatePrescriptionStatus(prescriptionId: string, status: string): Promise<void> {
        await pool.query(`UPDATE prescriptions SET status = $1 WHERE prescriptions_id = $2`, [status, prescriptionId]);
    }

    // ═══════════════════════════════════════════════════
    // PRESCRIPTION DETAILS (thuốc)
    // ═══════════════════════════════════════════════════

    /** Thêm thuốc vào đơn */
    static async addItem(data: Record<string, any>): Promise<PrescriptionItem> {
        const r = await pool.query(`
            INSERT INTO prescription_details (
                prescription_details_id, prescription_id, drug_id,
                quantity, dosage, frequency, duration_days, usage_instruction
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
        `, [data.id, data.prescription_id, data.drug_id,
            data.quantity, data.dosage, data.frequency, data.duration_days, data.usage_instruction]);
        return r.rows[0];
    }

    /** Xóa thuốc */
    static async removeItem(detailId: string, prescriptionId: string): Promise<boolean> {
        const r = await pool.query(
            `DELETE FROM prescription_details WHERE prescription_details_id = $1 AND prescription_id = $2`,
            [detailId, prescriptionId]
        );
        return (r.rowCount ?? 0) > 0;
    }

    /** DS thuốc trong đơn */
    static async getItems(prescriptionId: string): Promise<PrescriptionItem[]> {
        const r = await pool.query(`
            SELECT pd.*, d.drug_code, d.brand_name, d.active_ingredients
            FROM prescription_details pd
            LEFT JOIN drugs d ON pd.drug_id = d.drugs_id
            WHERE pd.prescription_id = $1
            ORDER BY pd.prescription_details_id
        `, [prescriptionId]);
        return r.rows;
    }

    // ═══════════════════════════════════════════════════
    // DRUGS & RESTRICTIONS
    // ═══════════════════════════════════════════════════

    /** Kiểm tra thuốc tồn tại */
    static async getDrug(drugId: string): Promise<any> {
        const r = await pool.query(`SELECT * FROM drugs WHERE drugs_id = $1 AND is_active = TRUE`, [drugId]);
        return r.rows[0] || null;
    }

    /** Kiểm tra restriction */
    static async getDrugRestriction(drugId: string): Promise<DrugRestriction | null> {
        const r = await pool.query(`
            SELECT tdr.*, d.drug_code, d.brand_name
            FROM tele_drug_restrictions tdr
            JOIN drugs d ON tdr.drug_id = d.drugs_id
            WHERE tdr.drug_id = $1 AND tdr.is_active = TRUE
        `, [drugId]);
        return r.rows[0] || null;
    }

    /** DS tất cả thuốc hạn chế */
    static async getAllRestrictions(): Promise<DrugRestriction[]> {
        const r = await pool.query(`
            SELECT tdr.*, d.drug_code, d.brand_name
            FROM tele_drug_restrictions tdr
            JOIN drugs d ON tdr.drug_id = d.drugs_id
            WHERE tdr.is_active = TRUE
            ORDER BY tdr.restriction_type, d.brand_name
        `);
        return r.rows;
    }

    // ═══════════════════════════════════════════════════
    // PHARMACY INVENTORY (tồn kho)
    // ═══════════════════════════════════════════════════

    /** Kiểm tra tồn kho 1 thuốc */
    static async checkStock(drugId: string): Promise<number> {
        const r = await pool.query(`
            SELECT COALESCE(SUM(stock_quantity), 0)::int AS total_stock
            FROM pharmacy_inventory
            WHERE drug_id = $1 AND expiry_date > CURRENT_DATE
        `, [drugId]);
        return r.rows[0].total_stock;
    }

    // ═══════════════════════════════════════════════════
    // MEDICAL ORDERS (chỉ định XN)
    // ═══════════════════════════════════════════════════

    /** Tạo chỉ định XN */
    static async createLabOrder(data: Record<string, any>): Promise<any> {
        const r = await pool.query(`
            INSERT INTO medical_orders (
                medical_orders_id, encounter_id, service_code, service_name,
                clinical_indicator, priority, status, ordered_by
            ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7) RETURNING *
        `, [data.id, data.encounter_id, data.service_code, data.service_name,
            data.clinical_indicator, data.priority || 'ROUTINE', data.ordered_by]);
        return r.rows[0];
    }

    /** DS chỉ định XN theo encounter */
    static async getLabOrders(encounterId: string): Promise<any[]> {
        const r = await pool.query(`
            SELECT mo.*, up.full_name AS ordered_by_name
            FROM medical_orders mo
            LEFT JOIN user_profiles up ON mo.ordered_by = up.user_id
            WHERE mo.encounter_id = $1
            ORDER BY mo.ordered_at DESC
        `, [encounterId]);
        return r.rows;
    }

    // ═══════════════════════════════════════════════════
    // QUERIES
    // ═══════════════════════════════════════════════════

    /** DS đơn từ xa */
    static async findAll(filters: TeleRxFilter): Promise<{ data: TelePrescription[]; total: number }> {
        let where = 'WHERE 1=1';
        const params: any[] = [];
        let idx = 1;

        if (filters.status) { where += ` AND p.status = $${idx++}`; params.push(filters.status); }
        if (filters.doctor_id) { where += ` AND p.doctor_id = $${idx++}`; params.push(filters.doctor_id); }
        if (filters.keyword) {
            where += ` AND (p.prescription_code ILIKE $${idx} OR up_pat.full_name ILIKE $${idx} OR p.clinical_diagnosis ILIKE $${idx})`;
            params.push(`%${filters.keyword}%`); idx++;
        }

        const countR = await pool.query(`
            SELECT COUNT(*)::int AS total
            FROM tele_prescriptions tp
            JOIN prescriptions p ON tp.prescription_id = p.prescriptions_id
            LEFT JOIN encounters enc ON tp.encounter_id = enc.encounters_id
            LEFT JOIN patients pat ON enc.patient_id = pat.id::varchar
            LEFT JOIN user_profiles up_pat ON pat.account_id = up_pat.user_id
            ${where}
        `, params);

        const offset = (filters.page - 1) * filters.limit;
        const r = await pool.query(`
            SELECT tp.*, p.prescription_code, p.status AS prescription_status,
                   p.clinical_diagnosis, up_doc.full_name AS doctor_name,
                   up_pat.full_name AS patient_name
            FROM tele_prescriptions tp
            JOIN prescriptions p ON tp.prescription_id = p.prescriptions_id
            LEFT JOIN user_profiles up_doc ON p.doctor_id = up_doc.user_id
            LEFT JOIN encounters enc ON tp.encounter_id = enc.encounters_id
            LEFT JOIN patients pat ON enc.patient_id = pat.id::varchar
            LEFT JOIN user_profiles up_pat ON pat.account_id = up_pat.user_id
            ${where}
            ORDER BY tp.created_at DESC
            LIMIT $${idx++} OFFSET $${idx}
        `, [...params, filters.limit, offset]);

        return { data: r.rows, total: countR.rows[0].total };
    }

    /** Lịch sử đơn BN */
    static async findByPatient(patientId: string, page: number, limit: number): Promise<{ data: TelePrescription[]; total: number }> {
        const countR = await pool.query(`
            SELECT COUNT(*)::int AS total
            FROM tele_prescriptions tp
            JOIN prescriptions p ON tp.prescription_id = p.prescriptions_id
            WHERE p.patient_id = $1
        `, [patientId]);

        const offset = (page - 1) * limit;
        const r = await pool.query(`
            SELECT tp.*, p.prescription_code, p.status AS prescription_status,
                   p.clinical_diagnosis, up_doc.full_name AS doctor_name
            FROM tele_prescriptions tp
            JOIN prescriptions p ON tp.prescription_id = p.prescriptions_id
            LEFT JOIN user_profiles up_doc ON p.doctor_id = up_doc.user_id
            WHERE p.patient_id = $1
            ORDER BY tp.created_at DESC LIMIT $2 OFFSET $3
        `, [patientId, limit, offset]);

        return { data: r.rows, total: countR.rows[0].total };
    }

    /** Lấy consultation */
    static async getConsultation(consultationId: string): Promise<any> {
        const r = await pool.query(`SELECT * FROM tele_consultations WHERE tele_consultations_id = $1`, [consultationId]);
        return r.rows[0] || null;
    }
}
