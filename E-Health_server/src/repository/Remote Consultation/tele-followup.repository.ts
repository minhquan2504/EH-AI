import { pool } from '../../config/postgresdb';
import { TeleFollowUpPlan, TeleHealthUpdate, FollowUpPlanFilter } from '../../models/Remote Consultation/tele-followup.model';
import { v4 as uuidv4 } from 'uuid';

/**
 * Data Access Layer cho theo dõi sau tư vấn & tái khám
 */
export class TeleFollowUpRepository {

    // ═══════════════════════════════════════════════════
    // FOLLOW-UP PLANS
    // ═══════════════════════════════════════════════════

    /** Tạo plan */
    static async createPlan(data: Record<string, any>): Promise<TeleFollowUpPlan> {
        const r = await pool.query(`
            INSERT INTO tele_follow_up_plans (
                plan_id, tele_consultation_id, patient_id, doctor_id, encounter_id,
                plan_type, description, instructions, monitoring_items, frequency,
                start_date, end_date, next_follow_up_date, follow_up_type
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *
        `, [
            data.plan_id, data.tele_consultation_id, data.patient_id, data.doctor_id, data.encounter_id,
            data.plan_type, data.description, data.instructions,
            data.monitoring_items ? JSON.stringify(data.monitoring_items) : null,
            data.frequency, data.start_date, data.end_date,
            data.next_follow_up_date, data.follow_up_type
        ]);
        return r.rows[0];
    }

    /** Tìm plan theo ID (có JOIN) */
    static async findPlanById(planId: string): Promise<TeleFollowUpPlan | null> {
        const r = await pool.query(`
            SELECT p.*,
                   up_pat.full_name AS patient_name,
                   up_doc.full_name AS doctor_name,
                   (SELECT COUNT(*)::int FROM tele_health_updates WHERE plan_id = p.plan_id) AS update_count
            FROM tele_follow_up_plans p
            LEFT JOIN patients pat ON p.patient_id = pat.id::varchar
            LEFT JOIN user_profiles up_pat ON pat.account_id = up_pat.user_id
            LEFT JOIN doctors doc ON p.doctor_id = doc.doctors_id
            LEFT JOIN user_profiles up_doc ON doc.account_id = up_doc.user_id
            WHERE p.plan_id = $1
        `, [planId]);
        return r.rows[0] || null;
    }

    /** Cập nhật plan (dynamic fields) */
    static async updatePlan(planId: string, data: Record<string, any>): Promise<void> {
        const setClauses: string[] = [];
        const values: any[] = [];
        let idx = 1;
        for (const [key, val] of Object.entries(data)) {
            if (key === 'monitoring_items') {
                setClauses.push(`${key} = $${idx++}`);
                values.push(JSON.stringify(val));
            } else {
                setClauses.push(`${key} = $${idx++}`);
                values.push(val);
            }
        }
        setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(planId);
        await pool.query(`UPDATE tele_follow_up_plans SET ${setClauses.join(', ')} WHERE plan_id = $${idx}`, values);
    }

    // ═══════════════════════════════════════════════════
    // HEALTH UPDATES
    // ═══════════════════════════════════════════════════

    /** Tạo health update */
    static async createUpdate(data: Record<string, any>): Promise<TeleHealthUpdate> {
        const r = await pool.query(`
            INSERT INTO tele_health_updates (
                update_id, plan_id, reported_by, reporter_type,
                update_type, content, vital_data, severity_level,
                attachments, requires_attention
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
        `, [
            data.update_id, data.plan_id, data.reported_by, data.reporter_type,
            data.update_type, data.content,
            data.vital_data ? JSON.stringify(data.vital_data) : null,
            data.severity_level,
            data.attachments ? JSON.stringify(data.attachments) : null,
            data.requires_attention
        ]);
        return r.rows[0];
    }

    /** DS updates theo plan (phân trang) */
    static async getUpdates(planId: string, page: number, limit: number): Promise<{ data: TeleHealthUpdate[]; total: number }> {
        const countR = await pool.query(`SELECT COUNT(*)::int AS total FROM tele_health_updates WHERE plan_id = $1`, [planId]);
        const offset = (page - 1) * limit;
        const r = await pool.query(`
            SELECT u.*, up.full_name AS reporter_name
            FROM tele_health_updates u
            LEFT JOIN user_profiles up ON u.reported_by = up.user_id
            WHERE u.plan_id = $1
            ORDER BY u.created_at DESC LIMIT $2 OFFSET $3
        `, [planId, limit, offset]);
        return { data: r.rows, total: countR.rows[0].total };
    }

    /** Tìm update theo ID */
    static async findUpdateById(updateId: string): Promise<TeleHealthUpdate | null> {
        const r = await pool.query(`SELECT * FROM tele_health_updates WHERE update_id = $1`, [updateId]);
        return r.rows[0] || null;
    }

    /** Cập nhật BS phản hồi */
    static async respondToUpdate(updateId: string, response: string): Promise<void> {
        await pool.query(`
            UPDATE tele_health_updates 
            SET doctor_response = $1, responded_at = CURRENT_TIMESTAMP, requires_attention = FALSE
            WHERE update_id = $2
        `, [response, updateId]);
    }

    /** DS updates cần BS xem xét */
    static async getAttentionUpdates(doctorId: string, page: number, limit: number): Promise<{ data: TeleHealthUpdate[]; total: number }> {
        const countR = await pool.query(`
            SELECT COUNT(*)::int AS total
            FROM tele_health_updates u
            JOIN tele_follow_up_plans p ON u.plan_id = p.plan_id
            WHERE u.requires_attention = TRUE AND u.doctor_response IS NULL AND p.doctor_id = $1
        `, [doctorId]);
        const offset = (page - 1) * limit;
        const r = await pool.query(`
            SELECT u.*, up.full_name AS reporter_name, p.plan_type
            FROM tele_health_updates u
            JOIN tele_follow_up_plans p ON u.plan_id = p.plan_id
            LEFT JOIN user_profiles up ON u.reported_by = up.user_id
            WHERE u.requires_attention = TRUE AND u.doctor_response IS NULL AND p.doctor_id = $1
            ORDER BY u.created_at DESC LIMIT $2 OFFSET $3
        `, [doctorId, limit, offset]);
        return { data: r.rows, total: countR.rows[0].total };
    }

    // ═══════════════════════════════════════════════════
    // QUERIES
    // ═══════════════════════════════════════════════════

    /** DS plans (filter) */
    static async findAllPlans(filters: FollowUpPlanFilter): Promise<{ data: TeleFollowUpPlan[]; total: number }> {
        let where = 'WHERE 1=1';
        const params: any[] = [];
        let idx = 1;

        if (filters.status) { where += ` AND p.status = $${idx++}`; params.push(filters.status); }
        if (filters.plan_type) { where += ` AND p.plan_type = $${idx++}`; params.push(filters.plan_type); }
        if (filters.doctor_id) { where += ` AND p.doctor_id = $${idx++}`; params.push(filters.doctor_id); }
        if (filters.keyword) {
            where += ` AND (p.description ILIKE $${idx} OR up_pat.full_name ILIKE $${idx})`;
            params.push(`%${filters.keyword}%`); idx++;
        }

        const countR = await pool.query(`
            SELECT COUNT(*)::int AS total
            FROM tele_follow_up_plans p
            LEFT JOIN patients pat ON p.patient_id = pat.id::varchar
            LEFT JOIN user_profiles up_pat ON pat.account_id = up_pat.user_id
            ${where}
        `, params);

        const offset = (filters.page - 1) * filters.limit;
        const r = await pool.query(`
            SELECT p.*,
                   up_pat.full_name AS patient_name,
                   up_doc.full_name AS doctor_name,
                   (SELECT COUNT(*)::int FROM tele_health_updates WHERE plan_id = p.plan_id) AS update_count
            FROM tele_follow_up_plans p
            LEFT JOIN patients pat ON p.patient_id = pat.id::varchar
            LEFT JOIN user_profiles up_pat ON pat.account_id = up_pat.user_id
            LEFT JOIN doctors doc ON p.doctor_id = doc.doctors_id
            LEFT JOIN user_profiles up_doc ON doc.account_id = up_doc.user_id
            ${where}
            ORDER BY p.created_at DESC
            LIMIT $${idx++} OFFSET $${idx}
        `, [...params, filters.limit, offset]);

        return { data: r.rows, total: countR.rows[0].total };
    }

    /** Lịch sử follow-up BN */
    static async findByPatient(patientId: string, page: number, limit: number): Promise<{ data: TeleFollowUpPlan[]; total: number }> {
        const countR = await pool.query(`SELECT COUNT(*)::int AS total FROM tele_follow_up_plans WHERE patient_id = $1`, [patientId]);
        const offset = (page - 1) * limit;
        const r = await pool.query(`
            SELECT p.*, up_doc.full_name AS doctor_name,
                   (SELECT COUNT(*)::int FROM tele_health_updates WHERE plan_id = p.plan_id) AS update_count
            FROM tele_follow_up_plans p
            LEFT JOIN doctors doc ON p.doctor_id = doc.doctors_id
            LEFT JOIN user_profiles up_doc ON doc.account_id = up_doc.user_id
            WHERE p.patient_id = $1
            ORDER BY p.created_at DESC LIMIT $2 OFFSET $3
        `, [patientId, limit, offset]);
        return { data: r.rows, total: countR.rows[0].total };
    }

    /** DS plans sắp tái khám (trong vòng N ngày) */
    static async getUpcomingPlans(doctorId: string, daysAhead: number): Promise<TeleFollowUpPlan[]> {
        const r = await pool.query(`
            SELECT p.*, up_pat.full_name AS patient_name
            FROM tele_follow_up_plans p
            LEFT JOIN patients pat ON p.patient_id = pat.id::varchar
            LEFT JOIN user_profiles up_pat ON pat.account_id = up_pat.user_id
            WHERE p.status = 'ACTIVE'
              AND p.next_follow_up_date IS NOT NULL
              AND p.next_follow_up_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + $1 * INTERVAL '1 day')
              AND p.doctor_id = $2
            ORDER BY p.next_follow_up_date ASC
        `, [daysAhead, doctorId]);
        return r.rows;
    }

    /** Thống kê */
    static async getStats(doctorId?: string): Promise<any> {
        let where = '';
        const params: any[] = [];
        if (doctorId) { where = 'WHERE doctor_id = $1'; params.push(doctorId); }

        const r = await pool.query(`
            SELECT
                COUNT(*)::int AS total_plans,
                COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active_plans,
                COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed_plans,
                COUNT(*) FILTER (WHERE status = 'CONVERTED_IN_PERSON')::int AS converted_plans,
                COUNT(*) FILTER (WHERE outcome_rating = 'IMPROVED')::int AS improved,
                COUNT(*) FILTER (WHERE outcome_rating = 'STABLE')::int AS stable,
                COUNT(*) FILTER (WHERE outcome_rating = 'WORSENED')::int AS worsened,
                COUNT(*) FILTER (WHERE outcome_rating = 'RESOLVED')::int AS resolved
            FROM tele_follow_up_plans ${where}
        `, params);
        return r.rows[0];
    }

    /** Lấy consultation */
    static async getConsultation(consultationId: string): Promise<any> {
        const r = await pool.query(`
            SELECT tc.*, up_pat.full_name AS patient_name
            FROM tele_consultations tc
            LEFT JOIN user_profiles up_pat ON tc.patient_id = up_pat.user_id
            WHERE tc.tele_consultations_id = $1
        `, [consultationId]);
        return r.rows[0] || null;
    }
}
