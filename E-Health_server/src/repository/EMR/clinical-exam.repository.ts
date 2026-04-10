import { pool } from '../../config/postgresdb';
import { v4 as uuidv4 } from 'uuid';
import { ClinicalExamination, CreateClinicalExamInput, UpdateVitalsInput } from '../../models/EMR/clinical-exam.model';
import { CLINICAL_EXAM_CONFIG } from '../../constants/clinical-exam.constant';

/**
 * Tạo ID phiếu khám lâm sàng theo format: CEXAM_yymmdd_uuid
 */
function generateClinicalExamId(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `CEXAM_${yy}${mm}${dd}_${uuidv4().substring(0, 8)}`;
}

export class ClinicalExamRepository {

    /**
     * Tạo phiếu khám lâm sàng mới (1:1 với encounter)
     */
    static async create(encounterId: string, data: CreateClinicalExamInput, recordedBy: string): Promise<ClinicalExamination> {
        const id = generateClinicalExamId();
        const result = await pool.query(
            `INSERT INTO clinical_examinations (
                clinical_examinations_id, encounter_id,
                pulse, blood_pressure_systolic, blood_pressure_diastolic,
                temperature, respiratory_rate, spo2,
                weight, height, bmi, blood_glucose,
                chief_complaint, physical_examination,
                medical_history_notes, relevant_history,
                clinical_notes, severity_level,
                status, recorded_by,
                created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                $13, $14, $15, $16, $17, $18,
                'DRAFT', $19,
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            ) RETURNING *`,
            [
                id, encounterId,
                data.pulse ?? null,
                data.blood_pressure_systolic ?? null,
                data.blood_pressure_diastolic ?? null,
                data.temperature ?? null,
                data.respiratory_rate ?? null,
                data.spo2 ?? null,
                data.weight ?? null,
                data.height ?? null,
                data.weight && data.height ? +(data.weight / ((data.height / 100) ** 2)).toFixed(2) : null,
                data.blood_glucose ?? null,
                data.chief_complaint ?? null,
                data.physical_examination ?? null,
                data.medical_history_notes ?? null,
                data.relevant_history ?? null,
                data.clinical_notes ?? null,
                data.severity_level ?? null,
                recordedBy,
            ]
        );
        return result.rows[0];
    }

    /**
     * Lấy phiếu khám theo encounter_id (kèm thông tin người ghi)
     */
    static async findByEncounterId(encounterId: string): Promise<ClinicalExamination | null> {
        const result = await pool.query(
            `SELECT ce.*,
                    up.full_name AS recorder_name
             FROM clinical_examinations ce
             LEFT JOIN user_profiles up ON up.user_id = ce.recorded_by
             WHERE ce.encounter_id = $1`,
            [encounterId]
        );
        return result.rows[0] || null;
    }

    /**
     * Kiểm tra phiếu khám đã tồn tại cho encounter chưa
     */
    static async existsByEncounterId(encounterId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM clinical_examinations WHERE encounter_id = $1) AS exists`,
            [encounterId]
        );
        return result.rows[0].exists;
    }

    /**
     * Cập nhật phiếu khám lâm sàng (partial update — chỉ field được gửi)
     */
    static async update(encounterId: string, data: Record<string, any>): Promise<ClinicalExamination | null> {
        const setClauses: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const values: any[] = [];
        let paramIndex = 1;

        const allowedFields = [
            'pulse', 'blood_pressure_systolic', 'blood_pressure_diastolic',
            'temperature', 'respiratory_rate', 'spo2',
            'weight', 'height', 'bmi', 'blood_glucose',
            'chief_complaint', 'physical_examination',
            'medical_history_notes', 'relevant_history',
            'clinical_notes', 'severity_level',
        ];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                setClauses.push(`${field} = $${paramIndex++}`);
                values.push(data[field]);
            }
        }

        if (values.length === 0) return this.findByEncounterId(encounterId);

        values.push(encounterId);

        const result = await pool.query(
            `UPDATE clinical_examinations SET ${setClauses.join(', ')} WHERE encounter_id = $${paramIndex} RETURNING *`,
            values
        );
        return result.rows[0] || null;
    }

    /**
     * Cập nhật riêng sinh hiệu (cho phép khi FINAL — Y tá đo lại)
     */
    static async updateVitals(encounterId: string, data: UpdateVitalsInput): Promise<ClinicalExamination | null> {
        const setClauses: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const values: any[] = [];
        let paramIndex = 1;

        const vitalFields = [
            'pulse', 'blood_pressure_systolic', 'blood_pressure_diastolic',
            'temperature', 'respiratory_rate', 'spo2',
            'weight', 'height', 'blood_glucose',
        ];

        for (const field of vitalFields) {
            if ((data as any)[field] !== undefined) {
                setClauses.push(`${field} = $${paramIndex++}`);
                values.push((data as any)[field]);
            }
        }

        /** Tính lại BMI nếu có weight hoặc height */
        if (data.weight !== undefined || data.height !== undefined) {
            const current = await this.findByEncounterId(encounterId);
            const w = data.weight ?? current?.weight;
            const h = data.height ?? current?.height;
            if (w && h) {
                setClauses.push(`bmi = $${paramIndex++}`);
                values.push(+(w / ((h / 100) ** 2)).toFixed(2));
            }
        }

        if (values.length === 0) return this.findByEncounterId(encounterId);

        values.push(encounterId);

        const result = await pool.query(
            `UPDATE clinical_examinations SET ${setClauses.join(', ')} WHERE encounter_id = $${paramIndex} RETURNING *`,
            values
        );
        return result.rows[0] || null;
    }

    /**
     * Chuyển trạng thái phiếu khám: DRAFT → FINAL
     */
    static async updateStatus(encounterId: string, status: string): Promise<ClinicalExamination | null> {
        const result = await pool.query(
            `UPDATE clinical_examinations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE encounter_id = $2 RETURNING *`,
            [status, encounterId]
        );
        return result.rows[0] || null;
    }

    /**
     * Lấy danh sách phiếu khám lâm sàng theo bệnh nhân (phân trang)
     */
    static async findByPatientId(
        patientId: string,
        page: number = CLINICAL_EXAM_CONFIG.DEFAULT_PAGE,
        limit: number = CLINICAL_EXAM_CONFIG.DEFAULT_LIMIT,
        fromDate?: string,
        toDate?: string
    ): Promise<{ data: ClinicalExamination[]; total: number }> {
        const conditions: string[] = ['e.patient_id = $1'];
        const countValues: any[] = [patientId];
        let paramIndex = 2;

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
             FROM clinical_examinations ce
             JOIN encounters e ON e.encounters_id = ce.encounter_id
             WHERE ${whereClause}`,
            countValues
        );

        const dataValues = [...countValues, limit, offset];

        const dataResult = await pool.query(
            `SELECT ce.*,
                    up.full_name AS recorder_name,
                    e.patient_id,
                    p.full_name AS patient_name,
                    upd.full_name AS doctor_name,
                    e.encounter_type,
                    e.start_time AS encounter_start_time
             FROM clinical_examinations ce
             JOIN encounters e ON e.encounters_id = ce.encounter_id
             LEFT JOIN patients p ON p.id::text = e.patient_id
             LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
             LEFT JOIN user_profiles upd ON upd.user_id = d.user_id
             LEFT JOIN user_profiles up ON up.user_id = ce.recorded_by
             WHERE ${whereClause}
             ORDER BY e.start_time DESC
             LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
            dataValues
        );

        return {
            data: dataResult.rows,
            total: countResult.rows[0].total,
        };
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
