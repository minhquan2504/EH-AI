import { pool } from '../../config/postgresdb';
import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { DiagnosisRecord, CreateDiagnosisInput, UpdateDiagnosisInput, ICDSearchResult, EncounterConclusion } from '../../models/EMR/diagnosis.model';
import { DIAGNOSIS_CONFIG } from '../../constants/diagnosis.constant';

/** Type cho query executor — dùng chung cho pool và client trong transaction */
type QueryExecutor = Pool | PoolClient;

/**
 * Tạo ID chẩn đoán: DIAG_yymmdd_uuid
 */
function generateDiagnosisId(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `DIAG_${yy}${mm}${dd}_${uuidv4().substring(0, 8)}`;
}

export class DiagnosisRepository {

    /**
     * Thêm chẩn đoán mới cho encounter
     */
    static async create(encounterId: string, data: CreateDiagnosisInput, diagnosedBy: string, client: QueryExecutor = pool): Promise<DiagnosisRecord> {
        const id = generateDiagnosisId();
        const result = await client.query(
            `INSERT INTO encounter_diagnoses (
                encounter_diagnoses_id, encounter_id,
                icd10_code, diagnosis_name, diagnosis_type,
                notes, diagnosed_by, is_active,
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *`,
            [
                id, encounterId,
                data.icd10_code,
                data.diagnosis_name,
                data.diagnosis_type || 'PRELIMINARY',
                data.notes ?? null,
                diagnosedBy,
            ]
        );
        return result.rows[0];
    }

    /**
     * Lấy tất cả chẩn đoán active của encounter (sắp xếp theo priority)
     */
    static async findByEncounterId(encounterId: string): Promise<DiagnosisRecord[]> {
        const result = await pool.query(
            `SELECT ed.*,
                    up.full_name AS diagnosed_by_name
             FROM encounter_diagnoses ed
             LEFT JOIN user_profiles up ON up.user_id = ed.diagnosed_by
             WHERE ed.encounter_id = $1 AND ed.is_active = TRUE
             ORDER BY
                CASE ed.diagnosis_type
                    WHEN 'PRIMARY' THEN 1
                    WHEN 'FINAL' THEN 2
                    WHEN 'SECONDARY' THEN 3
                    WHEN 'PRELIMINARY' THEN 4
                END,
                ed.created_at ASC`,
            [encounterId]
        );
        return result.rows;
    }

    /**
     * Lấy 1 chẩn đoán theo ID
     */
    static async findById(diagnosisId: string): Promise<DiagnosisRecord | null> {
        const result = await pool.query(
            `SELECT ed.*,
                    up.full_name AS diagnosed_by_name
             FROM encounter_diagnoses ed
             LEFT JOIN user_profiles up ON up.user_id = ed.diagnosed_by
             WHERE ed.encounter_diagnoses_id = $1`,
            [diagnosisId]
        );
        return result.rows[0] || null;
    }

    /**
     * Kiểm tra encounter đã có chẩn đoán PRIMARY active chưa
     */
    static async findPrimaryByEncounterId(encounterId: string, client: QueryExecutor = pool): Promise<DiagnosisRecord | null> {
        const result = await client.query(
            `SELECT * FROM encounter_diagnoses
             WHERE encounter_id = $1 AND diagnosis_type = 'PRIMARY' AND is_active = TRUE`,
            [encounterId]
        );
        return result.rows[0] || null;
    }

    /**
     * Cập nhật nội dung chẩn đoán (partial update)
     */
    static async update(diagnosisId: string, data: UpdateDiagnosisInput): Promise<DiagnosisRecord | null> {
        const setClauses: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.icd10_code !== undefined) {
            setClauses.push(`icd10_code = $${paramIndex++}`);
            values.push(data.icd10_code);
        }
        if (data.diagnosis_name !== undefined) {
            setClauses.push(`diagnosis_name = $${paramIndex++}`);
            values.push(data.diagnosis_name);
        }
        if (data.notes !== undefined) {
            setClauses.push(`notes = $${paramIndex++}`);
            values.push(data.notes);
        }

        if (values.length === 0) return this.findById(diagnosisId);

        values.push(diagnosisId);
        const result = await pool.query(
            `UPDATE encounter_diagnoses SET ${setClauses.join(', ')} WHERE encounter_diagnoses_id = $${paramIndex} RETURNING *`,
            values
        );
        return result.rows[0] || null;
    }

    /**
     * Soft delete chẩn đoán
     */
    static async softDelete(diagnosisId: string): Promise<void> {
        await pool.query(
            `UPDATE encounter_diagnoses SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE encounter_diagnoses_id = $1`,
            [diagnosisId]
        );
    }

    /**
     * Chuyển loại chẩn đoán
     */
    static async updateType(diagnosisId: string, newType: string, client: QueryExecutor = pool): Promise<DiagnosisRecord | null> {
        const result = await client.query(
            `UPDATE encounter_diagnoses SET diagnosis_type = $1, updated_at = CURRENT_TIMESTAMP WHERE encounter_diagnoses_id = $2 RETURNING *`,
            [newType, diagnosisId]
        );
        return result.rows[0] || null;
    }

    /**
     * Lưu kết luận khám vào bảng encounters
     */
    static async updateConclusion(encounterId: string, conclusion: string): Promise<void> {
        await pool.query(
            `UPDATE encounters SET conclusion = $1, updated_at = CURRENT_TIMESTAMP WHERE encounters_id = $2`,
            [conclusion, encounterId]
        );
    }

    /**
     * Lấy kết luận khám
     */
    static async getConclusion(encounterId: string): Promise<EncounterConclusion | null> {
        const result = await pool.query(
            `SELECT e.encounters_id AS encounter_id, e.conclusion, e.updated_at,
                    up.full_name AS doctor_name
             FROM encounters e
             LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
             LEFT JOIN user_profiles up ON up.user_id = d.user_id
             WHERE e.encounters_id = $1`,
            [encounterId]
        );
        return result.rows[0] || null;
    }

    /**
     * Lịch sử chẩn đoán theo bệnh nhân (qua nhiều encounter)
     */
    static async findByPatientId(
        patientId: string,
        page: number = DIAGNOSIS_CONFIG.DEFAULT_PAGE,
        limit: number = DIAGNOSIS_CONFIG.DEFAULT_LIMIT,
        icd10Code?: string,
        fromDate?: string,
        toDate?: string
    ): Promise<{ data: DiagnosisRecord[]; total: number }> {
        const conditions: string[] = ['e.patient_id = $1', 'ed.is_active = TRUE'];
        const countValues: any[] = [patientId];
        let paramIndex = 2;

        if (icd10Code) {
            conditions.push(`ed.icd10_code = $${paramIndex++}`);
            countValues.push(icd10Code);
        }
        if (fromDate) {
            conditions.push(`e.start_time >= $${paramIndex++}`);
            countValues.push(fromDate);
        }
        if (toDate) {
            conditions.push(`e.start_time <= ($${paramIndex++}::date + INTERVAL '1 day')`);
            countValues.push(toDate);
        }

        const whereClause = conditions.join(' AND ');
        const offset = (page - 1) * limit;

        const countResult = await pool.query(
            `SELECT COUNT(*)::int AS total
             FROM encounter_diagnoses ed
             JOIN encounters e ON e.encounters_id = ed.encounter_id
             WHERE ${whereClause}`,
            countValues
        );

        const dataValues = [...countValues, limit, offset];
        const dataResult = await pool.query(
            `SELECT ed.*,
                    up.full_name AS diagnosed_by_name,
                    e.patient_id,
                    p.full_name AS patient_name,
                    upd.full_name AS doctor_name,
                    e.encounter_type,
                    e.start_time AS encounter_start_time
             FROM encounter_diagnoses ed
             JOIN encounters e ON e.encounters_id = ed.encounter_id
             LEFT JOIN patients p ON p.id::text = e.patient_id
             LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
             LEFT JOIN user_profiles upd ON upd.user_id = d.user_id
             LEFT JOIN user_profiles up ON up.user_id = ed.diagnosed_by
             WHERE ${whereClause}
             ORDER BY e.start_time DESC, ed.created_at ASC
             LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
            dataValues
        );

        return {
            data: dataResult.rows,
            total: countResult.rows[0].total,
        };
    }

    /**
     * Tìm kiếm mã ICD-10 từ bảng master_data_items
     */
    static async searchICD(query: string, limit: number = DIAGNOSIS_CONFIG.ICD_SEARCH_LIMIT): Promise<ICDSearchResult[]> {
        const result = await pool.query(
            `SELECT code, value AS name
             FROM master_data_items
             WHERE category_code = 'ICD10' AND is_active = TRUE
               AND (LOWER(code) LIKE LOWER($1) OR LOWER(value) LIKE LOWER($1))
             ORDER BY sort_order ASC, code ASC
             LIMIT $2`,
            [`%${query}%`, limit]
        );
        return result.rows;
    }

    /**
     * Kiểm tra encounter tồn tại và trả về status
     */
    static async getEncounterStatus(encounterId: string): Promise<{ exists: boolean; status: string | null }> {
        const result = await pool.query(
            `SELECT status FROM encounters WHERE encounters_id = $1`,
            [encounterId]
        );
        if (result.rows.length === 0) return { exists: false, status: null };
        return { exists: true, status: result.rows[0].status };
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
}
