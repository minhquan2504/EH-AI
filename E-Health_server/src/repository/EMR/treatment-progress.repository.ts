import { pool } from '../../config/postgresdb';
import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import {
    TreatmentPlan,
    ProgressNote,
    FollowUpLink,
    FollowUpChainItem,
    PlanListItem,
    VitalSignItem,
    PrescriptionHistoryItem,
} from '../../models/EMR/treatment-progress.model';
import { TREATMENT_CONFIG } from '../../constants/treatment-progress.constant';

type QueryExecutor = Pool | PoolClient;

/** Tạo ID kế hoạch */
function generatePlanId(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `TP_${yy}${mm}${dd}_${uuidv4().substring(0, 8)}`;
}

/** Tạo plan_code */
function generatePlanCode(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const rand = uuidv4().substring(0, 8).toUpperCase();
    return `TP-${yy}${mm}${dd}-${rand}`;
}

/** Tạo ID note */
function generateNoteId(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `TPN_${yy}${mm}${dd}_${uuidv4().substring(0, 8)}`;
}

/** Tạo ID follow-up link */
function generateLinkId(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `EFL_${yy}${mm}${dd}_${uuidv4().substring(0, 8)}`;
}


export class TreatmentProgressRepository {

    //  TREATMENT PLANS 

    /** Tạo kế hoạch điều trị */
    static async createPlan(
        patientId: string,
        diagnosisCode: string,
        diagnosisName: string,
        title: string,
        description: string | null,
        goals: string | null,
        startDate: string,
        expectedEndDate: string | null,
        createdBy: string,
        createdEncounterId: string | null,
        client: QueryExecutor = pool
    ): Promise<TreatmentPlan> {
        const id = generatePlanId();
        const code = generatePlanCode();
        const result = await client.query(
            `INSERT INTO treatment_plans
             (treatment_plans_id, plan_code, patient_id, primary_diagnosis_code, primary_diagnosis_name,
              title, description, goals, start_date, expected_end_date, created_by, created_encounter_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
             RETURNING *`,
            [id, code, patientId, diagnosisCode, diagnosisName,
                title, description, goals, startDate, expectedEndDate, createdBy, createdEncounterId]
        );
        return result.rows[0];
    }

    /** Lấy plan theo ID (kèm join creator + patient) */
    static async findPlanById(planId: string): Promise<TreatmentPlan | null> {
        const result = await pool.query(
            `SELECT tp.*,
                    up.full_name AS creator_name,
                    p.full_name AS patient_name, p.patient_code
             FROM treatment_plans tp
             LEFT JOIN user_profiles up ON up.user_id = tp.created_by
             LEFT JOIN patients p ON p.id::text = tp.patient_id
             WHERE tp.treatment_plans_id = $1`,
            [planId]
        );
        return result.rows[0] || null;
    }

    /** Cập nhật kế hoạch */
    static async updatePlan(
        planId: string,
        fields: Record<string, any>,
        client: QueryExecutor = pool
    ): Promise<TreatmentPlan> {
        const setClauses: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const values: any[] = [];
        let idx = 1;

        for (const [key, value] of Object.entries(fields)) {
            setClauses.push(`${key} = $${idx++}`);
            values.push(value);
        }
        values.push(planId);

        const result = await client.query(
            `UPDATE treatment_plans SET ${setClauses.join(', ')} WHERE treatment_plans_id = $${idx} RETURNING *`,
            values
        );
        return result.rows[0];
    }

    /** DS kế hoạch theo bệnh nhân */
    static async findPlansByPatient(
        patientId: string,
        status?: string,
        page: number = 1,
        limit: number = TREATMENT_CONFIG.DEFAULT_LIMIT
    ): Promise<{ data: PlanListItem[]; total: number }> {
        const conditions: string[] = ['tp.patient_id = $1'];
        const values: any[] = [patientId];
        let paramIndex = 2;

        if (status) {
            conditions.push(`tp.status = $${paramIndex++}`);
            values.push(status);
        }

        const whereClause = conditions.join(' AND ');
        const offset = (page - 1) * limit;

        const countResult = await pool.query(
            `SELECT COUNT(*)::int AS total FROM treatment_plans tp WHERE ${whereClause}`,
            values
        );

        const dataValues = [...values, limit, offset];
        const dataResult = await pool.query(
            `SELECT tp.*,
                    up.full_name AS creator_name,
                    p.full_name AS patient_name, p.patient_code,
                    (SELECT COUNT(*)::int FROM treatment_progress_notes n WHERE n.plan_id = tp.treatment_plans_id) AS total_notes,
                    (SELECT COUNT(DISTINCT efl.follow_up_encounter_id)::int + 1
                     FROM encounter_follow_up_links efl WHERE efl.plan_id = tp.treatment_plans_id) AS total_encounters
             FROM treatment_plans tp
             LEFT JOIN user_profiles up ON up.user_id = tp.created_by
             LEFT JOIN patients p ON p.id::text = tp.patient_id
             WHERE ${whereClause}
             ORDER BY tp.created_at DESC
             LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
            dataValues
        );

        return { data: dataResult.rows, total: countResult.rows[0].total };
    }

    //  PROGRESS NOTES 

    /** Thêm ghi nhận diễn tiến */
    static async createNote(
        planId: string,
        encounterId: string | null,
        noteType: string,
        title: string | null,
        content: string,
        severity: string,
        recordedBy: string,
        client: QueryExecutor = pool
    ): Promise<ProgressNote> {
        const id = generateNoteId();
        const result = await client.query(
            `INSERT INTO treatment_progress_notes
             (treatment_progress_notes_id, plan_id, encounter_id, note_type, title, content, severity, recorded_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             RETURNING *`,
            [id, planId, encounterId, noteType, title, content, severity, recordedBy]
        );
        return result.rows[0];
    }

    /** DS ghi nhận theo plan */
    static async findNotesByPlan(
        planId: string,
        noteType?: string,
        severity?: string,
        encounterId?: string,
        fromDate?: string,
        toDate?: string,
        page: number = 1,
        limit: number = TREATMENT_CONFIG.DEFAULT_LIMIT
    ): Promise<{ data: ProgressNote[]; total: number }> {
        const conditions: string[] = ['n.plan_id = $1'];
        const values: any[] = [planId];
        let paramIndex = 2;

        if (noteType) {
            conditions.push(`n.note_type = $${paramIndex++}`);
            values.push(noteType);
        }
        if (severity) {
            conditions.push(`n.severity = $${paramIndex++}`);
            values.push(severity);
        }
        if (encounterId) {
            conditions.push(`n.encounter_id = $${paramIndex++}`);
            values.push(encounterId);
        }
        if (fromDate) {
            conditions.push(`n.created_at >= $${paramIndex++}`);
            values.push(fromDate);
        }
        if (toDate) {
            conditions.push(`n.created_at <= ($${paramIndex++}::date + INTERVAL '1 day')`);
            values.push(toDate);
        }

        const whereClause = conditions.join(' AND ');
        const offset = (page - 1) * limit;

        const countResult = await pool.query(
            `SELECT COUNT(*)::int AS total FROM treatment_progress_notes n WHERE ${whereClause}`,
            values
        );

        const dataValues = [...values, limit, offset];
        const dataResult = await pool.query(
            `SELECT n.*, up.full_name AS recorder_name
             FROM treatment_progress_notes n
             LEFT JOIN user_profiles up ON up.user_id = n.recorded_by
             WHERE ${whereClause}
             ORDER BY n.created_at DESC
             LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
            dataValues
        );

        return { data: dataResult.rows, total: countResult.rows[0].total };
    }

    /** Lấy note theo ID */
    static async findNoteById(noteId: string): Promise<ProgressNote | null> {
        const result = await pool.query(
            `SELECT n.*, up.full_name AS recorder_name
             FROM treatment_progress_notes n
             LEFT JOIN user_profiles up ON up.user_id = n.recorded_by
             WHERE n.treatment_progress_notes_id = $1`,
            [noteId]
        );
        return result.rows[0] || null;
    }

    /** Cập nhật note */
    static async updateNote(noteId: string, fields: Record<string, any>): Promise<ProgressNote> {
        const setClauses: string[] = [];
        const values: any[] = [];
        let idx = 1;

        for (const [key, value] of Object.entries(fields)) {
            setClauses.push(`${key} = $${idx++}`);
            values.push(value);
        }
        values.push(noteId);

        const result = await pool.query(
            `UPDATE treatment_progress_notes SET ${setClauses.join(', ')}
             WHERE treatment_progress_notes_id = $${idx} RETURNING *`,
            values
        );
        return result.rows[0];
    }

    /** Xóa note (hard delete) */
    static async deleteNote(noteId: string): Promise<void> {
        await pool.query(
            `DELETE FROM treatment_progress_notes WHERE treatment_progress_notes_id = $1`,
            [noteId]
        );
    }

    /** Lấy notes gần nhất */
    static async getRecentNotes(planId: string, limit: number): Promise<ProgressNote[]> {
        const result = await pool.query(
            `SELECT n.*, up.full_name AS recorder_name
             FROM treatment_progress_notes n
             LEFT JOIN user_profiles up ON up.user_id = n.recorded_by
             WHERE n.plan_id = $1
             ORDER BY n.created_at DESC LIMIT $2`,
            [planId, limit]
        );
        return result.rows;
    }

    /** Đếm notes theo type */
    static async countNotesByType(planId: string): Promise<Record<string, number>> {
        const result = await pool.query(
            `SELECT note_type, COUNT(*)::int AS count
             FROM treatment_progress_notes WHERE plan_id = $1
             GROUP BY note_type`,
            [planId]
        );
        const map: Record<string, number> = {};
        for (const row of result.rows) map[row.note_type] = row.count;
        return map;
    }

    /** Đếm notes theo severity */
    static async countNotesBySeverity(planId: string): Promise<Record<string, number>> {
        const result = await pool.query(
            `SELECT severity, COUNT(*)::int AS count
             FROM treatment_progress_notes WHERE plan_id = $1
             GROUP BY severity`,
            [planId]
        );
        const map: Record<string, number> = {};
        for (const row of result.rows) map[row.severity] = row.count;
        return map;
    }

    /** Tổng notes */
    static async countTotalNotes(planId: string): Promise<number> {
        const result = await pool.query(
            `SELECT COUNT(*)::int AS total FROM treatment_progress_notes WHERE plan_id = $1`,
            [planId]
        );
        return result.rows[0].total;
    }

    //  FOLLOW-UP LINKS 

    /** Tạo liên kết tái khám */
    static async createFollowUpLink(
        planId: string,
        previousEncounterId: string,
        followUpEncounterId: string,
        reason: string | null,
        scheduledDate: string | null,
        notes: string | null,
        createdBy: string,
        client: QueryExecutor = pool
    ): Promise<FollowUpLink> {
        const id = generateLinkId();
        const result = await client.query(
            `INSERT INTO encounter_follow_up_links
             (encounter_follow_up_links_id, plan_id, previous_encounter_id, follow_up_encounter_id,
              follow_up_reason, scheduled_date, notes, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             RETURNING *`,
            [id, planId, previousEncounterId, followUpEncounterId, reason, scheduledDate, notes, createdBy]
        );
        return result.rows[0];
    }

    /** Kiểm tra link đã tồn tại */
    static async followUpLinkExists(previousId: string, followUpId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM encounter_follow_up_links
             WHERE previous_encounter_id = $1 AND follow_up_encounter_id = $2) AS exists`,
            [previousId, followUpId]
        );
        return result.rows[0].exists;
    }

    /**
     * Lấy chuỗi tái khám theo plan, sắp xếp theo thời gian encounter.
     * Bao gồm sinh hiệu, chẩn đoán chính, số notes
     */
    static async getFollowUpChain(planId: string): Promise<FollowUpChainItem[]> {
        const result = await pool.query(
            `SELECT
                e.encounters_id AS encounter_id,
                e.encounter_type,
                e.start_time AS date,
                up.full_name AS doctor_name,
                (SELECT ed.diagnosis_name FROM encounter_diagnoses ed
                 WHERE ed.encounter_id = e.encounters_id AND ed.diagnosis_type = 'PRIMARY' LIMIT 1) AS diagnosis,
                CASE WHEN ce.blood_pressure_systolic IS NOT NULL
                     THEN ce.blood_pressure_systolic || '/' || ce.blood_pressure_diastolic
                     ELSE NULL END AS blood_pressure,
                (SELECT COUNT(*)::int FROM treatment_progress_notes n
                 WHERE n.plan_id = $1 AND n.encounter_id = e.encounters_id) AS notes_count
             FROM (
                 -- Lấy tất cả encounter_id unique liên quan đến plan
                 SELECT DISTINCT encounter_id FROM (
                     SELECT tp.created_encounter_id AS encounter_id FROM treatment_plans tp WHERE tp.treatment_plans_id = $1 AND tp.created_encounter_id IS NOT NULL
                     UNION
                     SELECT efl.previous_encounter_id FROM encounter_follow_up_links efl WHERE efl.plan_id = $1
                     UNION
                     SELECT efl.follow_up_encounter_id FROM encounter_follow_up_links efl WHERE efl.plan_id = $1
                 ) AS all_enc
             ) AS linked_enc
             JOIN encounters e ON e.encounters_id = linked_enc.encounter_id
             LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
             LEFT JOIN user_profiles up ON up.user_id = d.user_id
             LEFT JOIN clinical_examinations ce ON ce.encounter_id = e.encounters_id
             ORDER BY e.start_time ASC`,
            [planId]
        );

        return result.rows.map((row: any, index: number) => ({
            order: index + 1,
            ...row,
        }));
    }

    /** Đếm encounters liên kết */
    static async countLinkedEncounters(planId: string): Promise<number> {
        const result = await pool.query(
            `SELECT COUNT(DISTINCT encounter_id)::int AS total FROM (
                 SELECT tp.created_encounter_id AS encounter_id FROM treatment_plans tp WHERE tp.treatment_plans_id = $1 AND tp.created_encounter_id IS NOT NULL
                 UNION
                 SELECT efl.previous_encounter_id FROM encounter_follow_up_links efl WHERE efl.plan_id = $1
                 UNION
                 SELECT efl.follow_up_encounter_id FROM encounter_follow_up_links efl WHERE efl.plan_id = $1
             ) AS all_enc`,
            [planId]
        );
        return result.rows[0].total;
    }

    //  SUMMARY HELPERS 

    /**
     * Lấy xu hướng sinh hiệu từ các encounter liên kết
     */
    static async getVitalSignsTrend(planId: string): Promise<VitalSignItem[]> {
        const result = await pool.query(
            `SELECT e.start_time::date AS date,
                    ce.blood_pressure_systolic AS systolic,
                    ce.blood_pressure_diastolic AS diastolic,
                    ce.pulse, ce.weight
             FROM (
                 SELECT DISTINCT encounter_id FROM (
                     SELECT tp.created_encounter_id AS encounter_id FROM treatment_plans tp WHERE tp.treatment_plans_id = $1 AND tp.created_encounter_id IS NOT NULL
                     UNION
                     SELECT efl.previous_encounter_id FROM encounter_follow_up_links efl WHERE efl.plan_id = $1
                     UNION
                     SELECT efl.follow_up_encounter_id FROM encounter_follow_up_links efl WHERE efl.plan_id = $1
                 ) AS all_enc
             ) AS linked_enc
             JOIN encounters e ON e.encounters_id = linked_enc.encounter_id
             JOIN clinical_examinations ce ON ce.encounter_id = e.encounters_id
             ORDER BY e.start_time ASC`,
            [planId]
        );
        return result.rows;
    }

    /**
     * Lấy lịch sử đơn thuốc từ các encounter liên kết
     */
    static async getPrescriptionsHistory(planId: string): Promise<PrescriptionHistoryItem[]> {
        const result = await pool.query(
            `SELECT pr.prescribed_at AS date,
                    pr.prescription_code, pr.status,
                    ARRAY_AGG(d.brand_name || ' ' || COALESCE(pd.dosage, '')) AS drugs
             FROM (
                 SELECT DISTINCT encounter_id FROM (
                     SELECT tp.created_encounter_id AS encounter_id FROM treatment_plans tp WHERE tp.treatment_plans_id = $1 AND tp.created_encounter_id IS NOT NULL
                     UNION
                     SELECT efl.previous_encounter_id FROM encounter_follow_up_links efl WHERE efl.plan_id = $1
                     UNION
                     SELECT efl.follow_up_encounter_id FROM encounter_follow_up_links efl WHERE efl.plan_id = $1
                 ) AS all_enc
             ) AS linked_enc
             JOIN prescriptions pr ON pr.encounter_id = linked_enc.encounter_id
             LEFT JOIN prescription_details pd ON pd.prescription_id = pr.prescriptions_id AND pd.is_active = TRUE
             LEFT JOIN drugs d ON d.drugs_id = pd.drug_id
             GROUP BY pr.prescribed_at, pr.prescription_code, pr.status
             ORDER BY pr.prescribed_at ASC`,
            [planId]
        );
        return result.rows;
    }

    //  VALIDATION HELPERS 

    /** Kiểm tra bệnh nhân tồn tại */
    static async patientExists(patientId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM patients WHERE id::text = $1 AND deleted_at IS NULL) AS exists`,
            [patientId]
        );
        return result.rows[0].exists;
    }

    /** Lấy encounter kèm patient_id */
    static async getEncounterPatient(encounterId: string): Promise<{ patient_id: string } | null> {
        const result = await pool.query(
            `SELECT patient_id FROM encounters WHERE encounters_id = $1`,
            [encounterId]
        );
        return result.rows[0] || null;
    }
}
