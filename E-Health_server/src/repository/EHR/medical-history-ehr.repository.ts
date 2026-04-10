import { pool } from '../../config/postgresdb';
import { v4 as uuidv4 } from 'uuid';
import {
    MedicalHistoryItem, CreateMedicalHistoryInput, UpdateMedicalHistoryInput, MedicalHistoryFilters,
    AllergyItem, CreateAllergyInput, UpdateAllergyInput, AllergyFilters,
    RiskFactorItem, CreateRiskFactorInput, UpdateRiskFactorInput,
    SpecialConditionItem, CreateSpecialConditionInput,
} from '../../models/EHR/medical-history-ehr.model';

/** Tạo ID chung có prefix + ngày */
function generateId(prefix: string): string {
    const d = new Date();
    const ymd = `${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    return `${prefix}_${ymd}_${uuidv4().slice(0, 8)}`;
}


export class MedicalHistoryEhrRepository {

    // VALIDATION

    static async patientExists(patientId: string): Promise<boolean> {
        const r = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM patients WHERE id = $1 AND deleted_at IS NULL) AS exists`,
            [patientId]
        );
        return r.rows[0].exists;
    }

    //  NHÓM A: TIỀN SỬ BỆNH (patient_medical_histories) 

    /** Danh sách tiền sử có filter */
    static async getHistories(patientId: string, filters: MedicalHistoryFilters): Promise<MedicalHistoryItem[]> {
        const conditions = ['pmh.patient_id = $1', 'pmh.deleted_at IS NULL'];
        const params: any[] = [patientId];
        let idx = 2;

        if (filters.history_type) {
            conditions.push(`pmh.history_type = $${idx++}`);
            params.push(filters.history_type);
        }
        if (filters.status) {
            conditions.push(`pmh.status = $${idx++}`);
            params.push(filters.status);
        }
        if (filters.keyword) {
            conditions.push(`(pmh.condition_name ILIKE $${idx} OR pmh.condition_code ILIKE $${idx})`);
            params.push(`%${filters.keyword}%`);
            idx++;
        }

        const result = await pool.query(
            `SELECT pmh.*, up.full_name AS reported_by_name
             FROM patient_medical_histories pmh
             LEFT JOIN user_profiles up ON up.user_id = pmh.reported_by
             WHERE ${conditions.join(' AND ')}
             ORDER BY pmh.history_type ASC,
                 CASE pmh.status WHEN 'ACTIVE' THEN 1 ELSE 2 END,
                 pmh.created_at DESC`,
            params
        );
        return result.rows;
    }

    /** Chi tiết 1 bản ghi */
    static async getHistoryById(historyId: string): Promise<MedicalHistoryItem | null> {
        const r = await pool.query(
            `SELECT pmh.*, up.full_name AS reported_by_name
             FROM patient_medical_histories pmh
             LEFT JOIN user_profiles up ON up.user_id = pmh.reported_by
             WHERE pmh.patient_medical_histories_id = $1 AND pmh.deleted_at IS NULL`,
            [historyId]
        );
        return r.rows[0] || null;
    }

    /** Thêm tiền sử */
    static async createHistory(patientId: string, userId: string, input: CreateMedicalHistoryInput): Promise<MedicalHistoryItem> {
        const id = generateId('PMH');
        const r = await pool.query(
            `INSERT INTO patient_medical_histories
                (patient_medical_histories_id, patient_id, condition_code, condition_name,
                 history_type, relationship, diagnosis_date, status, notes, reported_by, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING *`,
            [
                id, patientId,
                input.condition_code || null, input.condition_name,
                input.history_type, input.relationship || null,
                input.diagnosis_date || null, input.status || 'ACTIVE',
                input.notes || null, userId,
            ]
        );
        return { ...r.rows[0], reported_by_name: null };
    }

    /** Cập nhật tiền sử */
    static async updateHistory(historyId: string, input: UpdateMedicalHistoryInput): Promise<MedicalHistoryItem> {
        const sets: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const vals: any[] = [];
        let idx = 1;

        if (input.condition_code !== undefined) { sets.push(`condition_code = $${idx++}`); vals.push(input.condition_code); }
        if (input.condition_name !== undefined) { sets.push(`condition_name = $${idx++}`); vals.push(input.condition_name); }
        if (input.relationship !== undefined) { sets.push(`relationship = $${idx++}`); vals.push(input.relationship); }
        if (input.diagnosis_date !== undefined) { sets.push(`diagnosis_date = $${idx++}`); vals.push(input.diagnosis_date); }
        if (input.status !== undefined) { sets.push(`status = $${idx++}`); vals.push(input.status); }
        if (input.notes !== undefined) { sets.push(`notes = $${idx++}`); vals.push(input.notes); }

        vals.push(historyId);
        const r = await pool.query(
            `UPDATE patient_medical_histories SET ${sets.join(', ')}
             WHERE patient_medical_histories_id = $${idx} AND deleted_at IS NULL
             RETURNING *`,
            vals
        );
        return { ...r.rows[0], reported_by_name: null };
    }

    /** Đổi status */
    static async updateHistoryStatus(historyId: string, status: string): Promise<MedicalHistoryItem> {
        const r = await pool.query(
            `UPDATE patient_medical_histories SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE patient_medical_histories_id = $2 AND deleted_at IS NULL
             RETURNING *`,
            [status, historyId]
        );
        return { ...r.rows[0], reported_by_name: null };
    }

    /** Soft delete */
    static async deleteHistory(historyId: string): Promise<void> {
        await pool.query(
            `UPDATE patient_medical_histories SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE patient_medical_histories_id = $1`,
            [historyId]
        );
    }

    // NHÓM B: DỊ ỨNG (patient_allergies) 

    /** Danh sách dị ứng có filter */
    static async getAllergies(patientId: string, filters: AllergyFilters): Promise<AllergyItem[]> {
        const conditions = ['pa.patient_id = $1', 'pa.deleted_at IS NULL'];
        const params: any[] = [patientId];
        let idx = 2;

        if (filters.allergen_type) {
            conditions.push(`pa.allergen_type = $${idx++}`);
            params.push(filters.allergen_type);
        }
        if (filters.severity) {
            conditions.push(`pa.severity = $${idx++}`);
            params.push(filters.severity);
        }

        const result = await pool.query(
            `SELECT pa.*, up.full_name AS reported_by_name
             FROM patient_allergies pa
             LEFT JOIN user_profiles up ON up.user_id = pa.reported_by
             WHERE ${conditions.join(' AND ')}
             ORDER BY
                 CASE pa.severity WHEN 'SEVERE' THEN 1 WHEN 'MODERATE' THEN 2 ELSE 3 END,
                 pa.allergen_name ASC`,
            params
        );
        return result.rows;
    }

    /** Chi tiết 1 dị ứng */
    static async getAllergyById(allergyId: string): Promise<AllergyItem | null> {
        const r = await pool.query(
            `SELECT pa.*, up.full_name AS reported_by_name
             FROM patient_allergies pa
             LEFT JOIN user_profiles up ON up.user_id = pa.reported_by
             WHERE pa.patient_allergies_id = $1 AND pa.deleted_at IS NULL`,
            [allergyId]
        );
        return r.rows[0] || null;
    }

    /** Kiểm tra trùng dị ứng */
    static async allergyExists(patientId: string, allergenName: string): Promise<boolean> {
        const r = await pool.query(
            `SELECT EXISTS(
                SELECT 1 FROM patient_allergies
                WHERE patient_id = $1 AND LOWER(allergen_name) = LOWER($2) AND deleted_at IS NULL
            ) AS exists`,
            [patientId, allergenName]
        );
        return r.rows[0].exists;
    }

    /** Thêm dị ứng */
    static async createAllergy(patientId: string, userId: string, input: CreateAllergyInput): Promise<AllergyItem> {
        const id = generateId('PA');
        const r = await pool.query(
            `INSERT INTO patient_allergies
                (patient_allergies_id, patient_id, allergen_type, allergen_name,
                 reaction, severity, notes, reported_by, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING *`,
            [
                id, patientId,
                input.allergen_type || 'OTHER', input.allergen_name,
                input.reaction || null, input.severity || 'MILD',
                input.notes || null, userId,
            ]
        );
        return { ...r.rows[0], reported_by_name: null };
    }

    /** Cập nhật dị ứng */
    static async updateAllergy(allergyId: string, input: UpdateAllergyInput): Promise<AllergyItem> {
        const sets: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const vals: any[] = [];
        let idx = 1;

        if (input.allergen_type !== undefined) { sets.push(`allergen_type = $${idx++}`); vals.push(input.allergen_type); }
        if (input.allergen_name !== undefined) { sets.push(`allergen_name = $${idx++}`); vals.push(input.allergen_name); }
        if (input.reaction !== undefined) { sets.push(`reaction = $${idx++}`); vals.push(input.reaction); }
        if (input.severity !== undefined) { sets.push(`severity = $${idx++}`); vals.push(input.severity); }
        if (input.notes !== undefined) { sets.push(`notes = $${idx++}`); vals.push(input.notes); }

        vals.push(allergyId);
        const r = await pool.query(
            `UPDATE patient_allergies SET ${sets.join(', ')}
             WHERE patient_allergies_id = $${idx} AND deleted_at IS NULL
             RETURNING *`,
            vals
        );
        return { ...r.rows[0], reported_by_name: null };
    }

    /** Soft delete dị ứng */
    static async deleteAllergy(allergyId: string): Promise<void> {
        await pool.query(
            `UPDATE patient_allergies SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE patient_allergies_id = $1`,
            [allergyId]
        );
    }

    //  NHÓM C: YẾU TỐ NGUY CƠ (patient_risk_factors) 

    /** Danh sách yếu tố nguy cơ */
    static async getRiskFactors(patientId: string): Promise<RiskFactorItem[]> {
        const r = await pool.query(
            `SELECT rf.*, up.full_name AS recorded_by_name
             FROM patient_risk_factors rf
             LEFT JOIN user_profiles up ON up.user_id = rf.recorded_by
             WHERE rf.patient_id = $1 AND rf.deleted_at IS NULL
             ORDER BY
                 CASE rf.severity WHEN 'HIGH' THEN 1 WHEN 'MODERATE' THEN 2 ELSE 3 END,
                 rf.created_at DESC`,
            [patientId]
        );
        return r.rows;
    }

    /** Tìm risk factor theo ID */
    static async getRiskFactorById(factorId: string): Promise<RiskFactorItem | null> {
        const r = await pool.query(
            `SELECT rf.*, up.full_name AS recorded_by_name
             FROM patient_risk_factors rf
             LEFT JOIN user_profiles up ON up.user_id = rf.recorded_by
             WHERE rf.risk_factor_id = $1 AND rf.deleted_at IS NULL`,
            [factorId]
        );
        return r.rows[0] || null;
    }

    /** Thêm yếu tố nguy cơ */
    static async createRiskFactor(patientId: string, userId: string, input: CreateRiskFactorInput): Promise<RiskFactorItem> {
        const id = generateId('RF');
        const r = await pool.query(
            `INSERT INTO patient_risk_factors
                (risk_factor_id, patient_id, factor_type, severity, details,
                 start_date, end_date, is_active, recorded_by, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING *`,
            [
                id, patientId,
                input.factor_type, input.severity || 'LOW',
                input.details,
                input.start_date || null, input.end_date || null,
                input.is_active !== undefined ? input.is_active : true,
                userId,
            ]
        );
        return { ...r.rows[0], recorded_by_name: null };
    }

    /** Cập nhật yếu tố nguy cơ */
    static async updateRiskFactor(factorId: string, input: UpdateRiskFactorInput): Promise<RiskFactorItem> {
        const sets: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const vals: any[] = [];
        let idx = 1;

        if (input.factor_type !== undefined) { sets.push(`factor_type = $${idx++}`); vals.push(input.factor_type); }
        if (input.severity !== undefined) { sets.push(`severity = $${idx++}`); vals.push(input.severity); }
        if (input.details !== undefined) { sets.push(`details = $${idx++}`); vals.push(input.details); }
        if (input.start_date !== undefined) { sets.push(`start_date = $${idx++}`); vals.push(input.start_date); }
        if (input.end_date !== undefined) { sets.push(`end_date = $${idx++}`); vals.push(input.end_date); }
        if (input.is_active !== undefined) { sets.push(`is_active = $${idx++}`); vals.push(input.is_active); }

        vals.push(factorId);
        const r = await pool.query(
            `UPDATE patient_risk_factors SET ${sets.join(', ')}
             WHERE risk_factor_id = $${idx} AND deleted_at IS NULL
             RETURNING *`,
            vals
        );
        return { ...r.rows[0], recorded_by_name: null };
    }

    /** Soft delete yếu tố nguy cơ */
    static async deleteRiskFactor(factorId: string): Promise<void> {
        await pool.query(
            `UPDATE patient_risk_factors SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE risk_factor_id = $1`,
            [factorId]
        );
    }

    //  NHÓM D: TÌNH TRẠNG ĐẶC BIỆT (patient_special_conditions) 

    /** Danh sách tình trạng đặc biệt */
    static async getSpecialConditions(patientId: string): Promise<SpecialConditionItem[]> {
        const r = await pool.query(
            `SELECT sc.*, up.full_name AS recorded_by_name
             FROM patient_special_conditions sc
             LEFT JOIN user_profiles up ON up.user_id = sc.recorded_by
             WHERE sc.patient_id = $1 AND sc.deleted_at IS NULL
             ORDER BY sc.is_active DESC, sc.created_at DESC`,
            [patientId]
        );
        return r.rows;
    }

    /** Tìm tình trạng đặc biệt theo ID */
    static async getSpecialConditionById(conditionId: string): Promise<SpecialConditionItem | null> {
        const r = await pool.query(
            `SELECT sc.*, up.full_name AS recorded_by_name
             FROM patient_special_conditions sc
             LEFT JOIN user_profiles up ON up.user_id = sc.recorded_by
             WHERE sc.special_condition_id = $1 AND sc.deleted_at IS NULL`,
            [conditionId]
        );
        return r.rows[0] || null;
    }

    /** Thêm tình trạng đặc biệt */
    static async createSpecialCondition(patientId: string, userId: string, input: CreateSpecialConditionInput): Promise<SpecialConditionItem> {
        const id = generateId('PSC');
        const r = await pool.query(
            `INSERT INTO patient_special_conditions
                (special_condition_id, patient_id, condition_type, description,
                 start_date, end_date, is_active, recorded_by, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING *`,
            [
                id, patientId,
                input.condition_type, input.description,
                input.start_date || null, input.end_date || null,
                input.is_active !== undefined ? input.is_active : true,
                userId,
            ]
        );
        return { ...r.rows[0], recorded_by_name: null };
    }

    /** Soft delete tình trạng đặc biệt */
    static async deleteSpecialCondition(conditionId: string): Promise<void> {
        await pool.query(
            `UPDATE patient_special_conditions SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE special_condition_id = $1`,
            [conditionId]
        );
    }
}
