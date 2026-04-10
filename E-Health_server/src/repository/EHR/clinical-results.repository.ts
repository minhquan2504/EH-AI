import { pool } from '../../config/postgresdb';
import {
    ClinicalResultItem, ClinicalResultDetail, TrendDataPoint,
    ClinicalResultsSummary, AttachmentItem, AbnormalResultItem,
    ClinicalResultFilters,
} from '../../models/EHR/clinical-results.model';
import { CR_CONFIG } from '../../constants/clinical-results.constant';

/**
 * Repository cho module Clinical Results EHR (6.4)
 * Read-only aggregation từ medical_orders + medical_order_results
 */
export class ClinicalResultsRepository {

    /** Kiểm tra bệnh nhân tồn tại */
    static async patientExists(patientId: string): Promise<boolean> {
        const r = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM patients WHERE id = $1 AND deleted_at IS NULL) AS exists`,
            [patientId]
        );
        return r.rows[0].exists;
    }

    /** Kiểm tra encounter thuộc patient */
    static async encounterBelongsToPatient(encounterId: string, patientId: string): Promise<boolean> {
        const r = await pool.query(
            `SELECT EXISTS(
                SELECT 1 FROM encounters WHERE encounters_id = $1 AND patient_id = $2
            ) AS exists`,
            [encounterId, patientId]
        );
        return r.rows[0].exists;
    }

    /**
     * API 1: Danh sách kết quả CLS tổng hợp (phân trang + filter)
     */
    static async getResults(patientId: string, filters: ClinicalResultFilters): Promise<{ data: ClinicalResultItem[]; total: number }> {
        const conditions = ['e.patient_id = $1'];
        const params: any[] = [patientId];
        let idx = 2;

        if (filters.order_type) {
            conditions.push(`mo.order_type = $${idx++}`);
            params.push(filters.order_type);
        }
        if (filters.service_code) {
            conditions.push(`mo.service_code = $${idx++}`);
            params.push(filters.service_code);
        }
        if (filters.status) {
            conditions.push(`mo.status = $${idx++}`);
            params.push(filters.status);
        }
        if (filters.from_date) {
            conditions.push(`mo.ordered_at >= $${idx++}`);
            params.push(filters.from_date);
        }
        if (filters.to_date) {
            conditions.push(`mo.ordered_at <= ($${idx++}::date + INTERVAL '1 day')`);
            params.push(filters.to_date);
        }

        const where = conditions.join(' AND ');
        const offset = (filters.page - 1) * filters.limit;

        const countResult = await pool.query(
            `SELECT COUNT(*)::int AS total
             FROM medical_orders mo
             JOIN encounters e ON e.encounters_id = mo.encounter_id
             WHERE ${where}`,
            params
        );

        const dataParams = [...params, filters.limit, offset];
        const dataResult = await pool.query(
            `SELECT mo.medical_orders_id, mo.encounter_id, mo.service_code, mo.service_name,
                    mo.order_type, mo.priority, mo.status, mo.clinical_indicator, mo.notes,
                    mo.ordered_by, mo.ordered_at,
                    up_ord.full_name AS orderer_name,
                    up_doc.full_name AS doctor_name,
                    e.start_time AS encounter_start,
                    mor.medical_order_results_id AS result_id,
                    mor.result_summary, mor.result_details,
                    mor.attachment_urls, mor.performed_by, mor.performed_at,
                    up_perf.full_name AS performer_name
             FROM medical_orders mo
             JOIN encounters e ON e.encounters_id = mo.encounter_id
             LEFT JOIN medical_order_results mor ON mor.order_id = mo.medical_orders_id
             LEFT JOIN user_profiles up_ord ON up_ord.user_id = mo.ordered_by
             LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
             LEFT JOIN user_profiles up_doc ON up_doc.user_id = d.user_id
             LEFT JOIN user_profiles up_perf ON up_perf.user_id = mor.performed_by
             WHERE ${where}
             ORDER BY mo.ordered_at DESC
             LIMIT $${idx++} OFFSET $${idx++}`,
            dataParams
        );

        return { data: dataResult.rows, total: countResult.rows[0].total };
    }

    /**
     * API 2: Chi tiết 1 kết quả + chỉ định gốc
     */
    static async getResultDetail(orderId: string): Promise<ClinicalResultDetail | null> {
        const r = await pool.query(
            `SELECT mo.medical_orders_id, mo.encounter_id, mo.service_code, mo.service_name,
                    mo.order_type, mo.priority, mo.status, mo.clinical_indicator, mo.notes,
                    mo.ordered_by, mo.ordered_at,
                    up_ord.full_name AS orderer_name,
                    up_doc.full_name AS doctor_name,
                    e.start_time AS encounter_start,
                    e.patient_id,
                    p.full_name AS patient_name,
                    mor.medical_order_results_id AS result_id,
                    mor.result_summary, mor.result_details,
                    mor.attachment_urls, mor.performed_by, mor.performed_at,
                    up_perf.full_name AS performer_name
             FROM medical_orders mo
             JOIN encounters e ON e.encounters_id = mo.encounter_id
             LEFT JOIN patients p ON p.id = e.patient_id
             LEFT JOIN medical_order_results mor ON mor.order_id = mo.medical_orders_id
             LEFT JOIN user_profiles up_ord ON up_ord.user_id = mo.ordered_by
             LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
             LEFT JOIN user_profiles up_doc ON up_doc.user_id = d.user_id
             LEFT JOIN user_profiles up_perf ON up_perf.user_id = mor.performed_by
             WHERE mo.medical_orders_id = $1`,
            [orderId]
        );
        return r.rows[0] || null;
    }

    /**
     * API 3: Kết quả theo encounter
     */
    static async getResultsByEncounter(encounterId: string): Promise<ClinicalResultItem[]> {
        const r = await pool.query(
            `SELECT mo.medical_orders_id, mo.encounter_id, mo.service_code, mo.service_name,
                    mo.order_type, mo.priority, mo.status, mo.clinical_indicator, mo.notes,
                    mo.ordered_by, mo.ordered_at,
                    up_ord.full_name AS orderer_name,
                    up_doc.full_name AS doctor_name,
                    e.start_time AS encounter_start,
                    mor.medical_order_results_id AS result_id,
                    mor.result_summary, mor.result_details,
                    mor.attachment_urls, mor.performed_by, mor.performed_at,
                    up_perf.full_name AS performer_name
             FROM medical_orders mo
             JOIN encounters e ON e.encounters_id = mo.encounter_id
             LEFT JOIN medical_order_results mor ON mor.order_id = mo.medical_orders_id
             LEFT JOIN user_profiles up_ord ON up_ord.user_id = mo.ordered_by
             LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
             LEFT JOIN user_profiles up_doc ON up_doc.user_id = d.user_id
             LEFT JOIN user_profiles up_perf ON up_perf.user_id = mor.performed_by
             WHERE mo.encounter_id = $1
             ORDER BY mo.ordered_at ASC`,
            [encounterId]
        );
        return r.rows;
    }

    /**
     * API 4: Xu hướng kết quả theo service_code
     */
    static async getTrends(patientId: string, serviceCode: string): Promise<TrendDataPoint[]> {
        const r = await pool.query(
            `SELECT mor.performed_at, mor.result_summary, mor.result_details,
                    mo.encounter_id, mo.ordered_at
             FROM medical_orders mo
             JOIN encounters e ON e.encounters_id = mo.encounter_id
             JOIN medical_order_results mor ON mor.order_id = mo.medical_orders_id
             WHERE e.patient_id = $1
               AND mo.service_code = $2
               AND mo.status = 'COMPLETED'
             ORDER BY mor.performed_at ASC
             LIMIT $3`,
            [patientId, serviceCode, CR_CONFIG.TREND_MAX_RESULTS]
        );
        return r.rows;
    }

    /**
     * API 5: Thống kê tổng quan
     */
    static async getSummary(patientId: string): Promise<ClinicalResultsSummary> {
        const statsResult = await pool.query(
            `SELECT
                COUNT(*)::int AS total_orders,
                COUNT(mor.medical_order_results_id)::int AS total_with_results,
                COUNT(*) FILTER (WHERE mo.status = 'PENDING')::int AS total_pending,
                COUNT(*) FILTER (WHERE mo.status = 'IN_PROGRESS')::int AS total_in_progress,
                COUNT(*) FILTER (WHERE mo.status = 'COMPLETED')::int AS total_completed,
                COUNT(*) FILTER (WHERE mo.status = 'CANCELLED')::int AS total_cancelled,
                MAX(mo.ordered_at) AS latest_order_at,
                MAX(mor.performed_at) AS latest_result_at
             FROM medical_orders mo
             JOIN encounters e ON e.encounters_id = mo.encounter_id
             LEFT JOIN medical_order_results mor ON mor.order_id = mo.medical_orders_id
             WHERE e.patient_id = $1`,
            [patientId]
        );

        const byTypeResult = await pool.query(
            `SELECT mo.order_type, COUNT(*)::int AS count
             FROM medical_orders mo
             JOIN encounters e ON e.encounters_id = mo.encounter_id
             WHERE e.patient_id = $1
             GROUP BY mo.order_type
             ORDER BY count DESC`,
            [patientId]
        );

        const stats = statsResult.rows[0];
        return {
            total_orders: stats.total_orders,
            total_with_results: stats.total_with_results,
            total_pending: stats.total_pending,
            total_in_progress: stats.total_in_progress,
            total_completed: stats.total_completed,
            total_cancelled: stats.total_cancelled,
            by_order_type: byTypeResult.rows,
            latest_order_at: stats.latest_order_at,
            latest_result_at: stats.latest_result_at,
        };
    }

    /**
     * API 6: Danh sách file đính kèm xuyên suốt
     */
    static async getAttachments(patientId: string): Promise<AttachmentItem[]> {
        const r = await pool.query(
            `SELECT mo.medical_orders_id, mo.service_code, mo.service_name, mo.order_type,
                    mor.attachment_urls, mor.performed_at,
                    up.full_name AS performer_name
             FROM medical_orders mo
             JOIN encounters e ON e.encounters_id = mo.encounter_id
             JOIN medical_order_results mor ON mor.order_id = mo.medical_orders_id
             LEFT JOIN user_profiles up ON up.user_id = mor.performed_by
             WHERE e.patient_id = $1
               AND mor.attachment_urls IS NOT NULL
               AND mor.attachment_urls::text != '[]'
               AND mor.attachment_urls::text != 'null'
             ORDER BY mor.performed_at DESC`,
            [patientId]
        );
        return r.rows;
    }

    /**
     * API 7: Kết quả bất thường
     * Lọc result_details JSON có key is_abnormal=true hoặc các chỉ số ngoài range
     */
    static async getAbnormalResults(patientId: string): Promise<AbnormalResultItem[]> {
        const r = await pool.query(
            `SELECT mo.medical_orders_id, mo.service_code, mo.service_name, mo.order_type,
                    mo.ordered_at,
                    mor.result_summary, mor.result_details, mor.performed_at,
                    up.full_name AS performer_name
             FROM medical_orders mo
             JOIN encounters e ON e.encounters_id = mo.encounter_id
             JOIN medical_order_results mor ON mor.order_id = mo.medical_orders_id
             LEFT JOIN user_profiles up ON up.user_id = mor.performed_by
             WHERE e.patient_id = $1
               AND mo.status = 'COMPLETED'
               AND mor.result_details IS NOT NULL
               AND (
                   mor.result_details::text ILIKE '%"is_abnormal":true%'
                   OR mor.result_details::text ILIKE '%"is_abnormal": true%'
                   OR mor.result_details::text ILIKE '%"flag":"abnormal"%'
                   OR mor.result_details::text ILIKE '%"flag": "abnormal"%'
                   OR mor.result_details::text ILIKE '%"status":"abnormal"%'
                   OR mor.result_details::text ILIKE '%"status": "abnormal"%'
               )
             ORDER BY mor.performed_at DESC`,
            [patientId]
        );
        return r.rows;
    }
}
