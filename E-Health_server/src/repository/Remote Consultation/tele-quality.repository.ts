import { pool } from '../../config/postgresdb';
import { TeleQualityReview, TeleQualityAlert, QualityReviewFilter } from '../../models/Remote Consultation/tele-quality.model';

/**
 * Data Access Layer cho quản lý chất lượng & đánh giá
 */
export class TeleQualityRepository {

    // ═══════════════════════════════════════════════════
    // REVIEWS
    // ═══════════════════════════════════════════════════

    /** Tạo review */
    static async createReview(data: Record<string, any>): Promise<TeleQualityReview> {
        const r = await pool.query(`
            INSERT INTO tele_quality_reviews (
                review_id, tele_consultation_id, patient_id, doctor_id,
                doctor_professionalism, doctor_communication, doctor_knowledge,
                doctor_empathy, doctor_overall, doctor_comment,
                ease_of_use, waiting_time_rating, overall_satisfaction,
                would_recommend, patient_comment,
                video_quality, audio_quality, connection_stability,
                tech_issues, is_anonymous
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
            RETURNING *
        `, [
            data.review_id, data.tele_consultation_id, data.patient_id, data.doctor_id,
            data.doctor_professionalism, data.doctor_communication, data.doctor_knowledge,
            data.doctor_empathy, data.doctor_overall, data.doctor_comment,
            data.ease_of_use, data.waiting_time_rating, data.overall_satisfaction,
            data.would_recommend, data.patient_comment,
            data.video_quality, data.audio_quality, data.connection_stability,
            data.tech_issues ? JSON.stringify(data.tech_issues) : null, data.is_anonymous
        ]);
        return r.rows[0];
    }

    /** Tìm review theo consultation */
    static async findByConsultation(consultationId: string): Promise<TeleQualityReview | null> {
        const r = await pool.query(`
            SELECT qr.*,
                   CASE WHEN qr.is_anonymous THEN 'Ẩn danh' ELSE up_pat.full_name END AS patient_name,
                   up_doc.full_name AS doctor_name
            FROM tele_quality_reviews qr
            LEFT JOIN user_profiles up_pat ON qr.patient_id = up_pat.user_id
            LEFT JOIN user_profiles up_doc ON qr.doctor_id = up_doc.user_id
            WHERE qr.tele_consultation_id = $1
        `, [consultationId]);
        return r.rows[0] || null;
    }

    /** DS reviews (filter) */
    static async findAll(filters: QualityReviewFilter): Promise<{ data: TeleQualityReview[]; total: number }> {
        let where = 'WHERE 1=1';
        const params: any[] = [];
        let idx = 1;

        if (filters.doctor_id) { where += ` AND qr.doctor_id = $${idx++}`; params.push(filters.doctor_id); }
        if (filters.min_rating) { where += ` AND qr.overall_satisfaction >= $${idx++}`; params.push(filters.min_rating); }
        if (filters.max_rating) { where += ` AND qr.overall_satisfaction <= $${idx++}`; params.push(filters.max_rating); }
        if (filters.keyword) {
            where += ` AND (qr.patient_comment ILIKE $${idx} OR qr.doctor_comment ILIKE $${idx} OR up_doc.full_name ILIKE $${idx})`;
            params.push(`%${filters.keyword}%`); idx++;
        }

        const countR = await pool.query(`
            SELECT COUNT(*)::int AS total FROM tele_quality_reviews qr
            LEFT JOIN user_profiles up_doc ON qr.doctor_id = up_doc.user_id
            ${where}
        `, params);

        const offset = (filters.page - 1) * filters.limit;
        const r = await pool.query(`
            SELECT qr.*,
                   CASE WHEN qr.is_anonymous THEN 'Ẩn danh' ELSE up_pat.full_name END AS patient_name,
                   up_doc.full_name AS doctor_name
            FROM tele_quality_reviews qr
            LEFT JOIN user_profiles up_pat ON qr.patient_id = up_pat.user_id
            LEFT JOIN user_profiles up_doc ON qr.doctor_id = up_doc.user_id
            ${where}
            ORDER BY qr.created_at DESC LIMIT $${idx++} OFFSET $${idx}
        `, [...params, filters.limit, offset]);

        return { data: r.rows, total: countR.rows[0].total };
    }

    /** DS reviews theo BS */
    static async findByDoctor(doctorId: string, page: number, limit: number): Promise<{ data: TeleQualityReview[]; total: number }> {
        const countR = await pool.query(`SELECT COUNT(*)::int AS total FROM tele_quality_reviews WHERE doctor_id = $1`, [doctorId]);
        const offset = (page - 1) * limit;
        const r = await pool.query(`
            SELECT qr.*,
                   CASE WHEN qr.is_anonymous THEN 'Ẩn danh' ELSE up_pat.full_name END AS patient_name
            FROM tele_quality_reviews qr
            LEFT JOIN user_profiles up_pat ON qr.patient_id = up_pat.user_id
            WHERE qr.doctor_id = $1
            ORDER BY qr.created_at DESC LIMIT $2 OFFSET $3
        `, [doctorId, limit, offset]);
        return { data: r.rows, total: countR.rows[0].total };
    }

    // ═══════════════════════════════════════════════════
    // METRICS
    // ═══════════════════════════════════════════════════

    /** Metrics BS */
    static async getDoctorMetrics(doctorId: string): Promise<any> {
        const r = await pool.query(`
            SELECT
                COUNT(*)::int AS total_reviews,
                ROUND(AVG(doctor_overall)::numeric, 2)::float AS avg_doctor_overall,
                ROUND(AVG(doctor_professionalism)::numeric, 2)::float AS avg_professionalism,
                ROUND(AVG(doctor_communication)::numeric, 2)::float AS avg_communication,
                ROUND(AVG(doctor_knowledge)::numeric, 2)::float AS avg_knowledge,
                ROUND(AVG(doctor_empathy)::numeric, 2)::float AS avg_empathy,
                ROUND(AVG(overall_satisfaction)::numeric, 2)::float AS avg_satisfaction,
                COUNT(*) FILTER (WHERE would_recommend = TRUE)::int AS recommend_count,
                ROUND(AVG(video_quality)::numeric, 2)::float AS avg_video,
                ROUND(AVG(audio_quality)::numeric, 2)::float AS avg_audio,
                ROUND(AVG(connection_stability)::numeric, 2)::float AS avg_stability
            FROM tele_quality_reviews WHERE doctor_id = $1
        `, [doctorId]);
        return r.rows[0];
    }

    /** Tổng quan hệ thống */
    static async getSystemOverview(): Promise<any> {
        const r = await pool.query(`
            SELECT
                COUNT(*)::int AS total_reviews,
                ROUND(AVG(overall_satisfaction)::numeric, 2)::float AS avg_satisfaction,
                ROUND(AVG(doctor_overall)::numeric, 2)::float AS avg_doctor_overall,
                COUNT(*) FILTER (WHERE would_recommend = TRUE)::int AS recommend_count,
                COUNT(DISTINCT doctor_id)::int AS reviewed_doctors
            FROM tele_quality_reviews
        `);

        // Top & low performers
        const topR = await pool.query(`
            SELECT qr.doctor_id, up.full_name AS doctor_name,
                   ROUND(AVG(qr.doctor_overall)::numeric, 2)::float AS avg_rating,
                   COUNT(*)::int AS review_count
            FROM tele_quality_reviews qr
            LEFT JOIN user_profiles up ON qr.doctor_id = up.user_id
            GROUP BY qr.doctor_id, up.full_name HAVING COUNT(*) >= 3
            ORDER BY avg_rating DESC LIMIT 5
        `);
        const lowR = await pool.query(`
            SELECT qr.doctor_id, up.full_name AS doctor_name,
                   ROUND(AVG(qr.doctor_overall)::numeric, 2)::float AS avg_rating,
                   COUNT(*)::int AS review_count
            FROM tele_quality_reviews qr
            LEFT JOIN user_profiles up ON qr.doctor_id = up.user_id
            GROUP BY qr.doctor_id, up.full_name HAVING COUNT(*) >= 3
            ORDER BY avg_rating ASC LIMIT 5
        `);

        return { ...r.rows[0], top_performers: topR.rows, low_performers: lowR.rows };
    }

    /** Thống kê kết nối */
    static async getConnectionStats(): Promise<any> {
        const r = await pool.query(`
            SELECT
                ROUND(AVG(video_quality)::numeric, 2)::float AS avg_video,
                ROUND(AVG(audio_quality)::numeric, 2)::float AS avg_audio,
                ROUND(AVG(connection_stability)::numeric, 2)::float AS avg_stability,
                COUNT(*) FILTER (WHERE video_quality <= 2)::int AS poor_video_count,
                COUNT(*) FILTER (WHERE audio_quality <= 2)::int AS poor_audio_count
            FROM tele_quality_reviews
        `);
        // Tech issues phổ biến
        const issuesR = await pool.query(`
            SELECT item AS issue, COUNT(*)::int AS count
            FROM tele_quality_reviews, jsonb_array_elements_text(tech_issues) AS item
            WHERE tech_issues IS NOT NULL
            GROUP BY item ORDER BY count DESC LIMIT 10
        `);
        return { ...r.rows[0], common_issues: issuesR.rows };
    }

    /** Xu hướng (weekly, 12 tuần gần nhất) */
    static async getTrends(): Promise<any[]> {
        const r = await pool.query(`
            SELECT
                DATE_TRUNC('week', created_at)::date AS week_start,
                COUNT(*)::int AS review_count,
                ROUND(AVG(overall_satisfaction)::numeric, 2)::float AS avg_satisfaction,
                ROUND(AVG(doctor_overall)::numeric, 2)::float AS avg_doctor
            FROM tele_quality_reviews
            WHERE created_at >= CURRENT_DATE - INTERVAL '12 weeks'
            GROUP BY DATE_TRUNC('week', created_at)
            ORDER BY week_start ASC
        `);
        return r.rows;
    }

    // ═══════════════════════════════════════════════════
    // ALERTS
    // ═══════════════════════════════════════════════════

    /** Tạo alert */
    static async createAlert(data: Record<string, any>): Promise<TeleQualityAlert> {
        const r = await pool.query(`
            INSERT INTO tele_quality_alerts (
                alert_id, alert_type, severity, target_type, target_id,
                title, description, metrics_snapshot
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
        `, [data.alert_id, data.alert_type, data.severity, data.target_type,
            data.target_id, data.title, data.description,
            data.metrics_snapshot ? JSON.stringify(data.metrics_snapshot) : null]);
        return r.rows[0];
    }

    /** DS alerts (filter) */
    static async findAlerts(status?: string, page?: number, limit?: number): Promise<{ data: TeleQualityAlert[]; total: number }> {
        let where = 'WHERE 1=1';
        const params: any[] = [];
        let idx = 1;
        if (status) { where += ` AND a.status = $${idx++}`; params.push(status); }

        const countR = await pool.query(`SELECT COUNT(*)::int AS total FROM tele_quality_alerts a ${where}`, params);
        const p = page || 1;
        const l = limit || 20;
        const offset = (p - 1) * l;
        const r = await pool.query(`
            SELECT a.*, up.full_name AS resolver_name
            FROM tele_quality_alerts a
            LEFT JOIN user_profiles up ON a.resolved_by = up.user_id
            ${where}
            ORDER BY a.created_at DESC LIMIT $${idx++} OFFSET $${idx}
        `, [...params, l, offset]);
        return { data: r.rows, total: countR.rows[0].total };
    }

    /** Tìm alert theo ID */
    static async findAlertById(alertId: string): Promise<TeleQualityAlert | null> {
        const r = await pool.query(`SELECT * FROM tele_quality_alerts WHERE alert_id = $1`, [alertId]);
        return r.rows[0] || null;
    }

    /** Resolve alert */
    static async resolveAlert(alertId: string, userId: string, status: string, notes: string): Promise<void> {
        await pool.query(`
            UPDATE tele_quality_alerts SET status = $1, resolved_by = $2,
            resolution_notes = $3, resolved_at = CURRENT_TIMESTAMP WHERE alert_id = $4
        `, [status, userId, notes, alertId]);
    }

    /** Thống kê alerts */
    static async getAlertStats(): Promise<any> {
        const r = await pool.query(`
            SELECT
                COUNT(*)::int AS total_alerts,
                COUNT(*) FILTER (WHERE status = 'OPEN')::int AS open_count,
                COUNT(*) FILTER (WHERE status = 'ACKNOWLEDGED')::int AS acknowledged_count,
                COUNT(*) FILTER (WHERE status = 'RESOLVED')::int AS resolved_count,
                COUNT(*) FILTER (WHERE status = 'DISMISSED')::int AS dismissed_count,
                COUNT(*) FILTER (WHERE severity = 'CRITICAL')::int AS critical_count,
                COUNT(*) FILTER (WHERE severity = 'WARNING')::int AS warning_count
            FROM tele_quality_alerts
        `);
        return r.rows[0];
    }

    /** Avg doctor rating (N reviews gần nhất) */
    static async getRecentDoctorAvg(doctorId: string, limit: number): Promise<number> {
        const r = await pool.query(`
            SELECT ROUND(AVG(doctor_overall)::numeric, 2)::float AS avg
            FROM (
                SELECT doctor_overall FROM tele_quality_reviews
                WHERE doctor_id = $1 ORDER BY created_at DESC LIMIT $2
            ) sub
        `, [doctorId, limit]);
        return r.rows[0]?.avg || 0;
    }

    /** Lấy consultation */
    static async getConsultation(consultationId: string): Promise<any> {
        const r = await pool.query(`SELECT * FROM tele_consultations WHERE tele_consultations_id = $1`, [consultationId]);
        return r.rows[0] || null;
    }
}
