import { pool } from '../../config/postgresdb';
import { v4 as uuidv4 } from 'uuid';
import {
    VitalSignRecord, VitalTrendPoint, AbnormalVitalItem,
    HealthMetricItem, VitalTimelineItem,
    VitalFilters, MetricFilters, CreateHealthMetricInput, ReferenceRange,
} from '../../models/EHR/vital-signs.model';
import { VS_CONFIG, ABNORMAL_LEVEL } from '../../constants/vital-signs.constant';

function generateMetricId(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `PHM_${yy}${mm}${dd}_${uuidv4().slice(0, 8)}`;
}


export class VitalSignsRepository {

    static async patientExists(patientId: string): Promise<boolean> {
        const r = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM patients WHERE id = $1 AND deleted_at IS NULL) AS exists`,
            [patientId]
        );
        return r.rows[0].exists;
    }

    /** Lấy tất cả reference ranges đang active */
    static async getReferenceRanges(): Promise<ReferenceRange[]> {
        const r = await pool.query(
            `SELECT * FROM vital_reference_ranges WHERE is_active = TRUE`
        );
        return r.rows;
    }

    /**
     * API 1: Lịch sử sinh hiệu từ clinical_examinations (phân trang)
     */
    static async getVitals(patientId: string, filters: VitalFilters): Promise<{ data: VitalSignRecord[]; total: number }> {
        const conditions = ['e.patient_id = $1'];
        const params: any[] = [patientId];
        let idx = 2;

        if (filters.from_date) {
            conditions.push(`ce.created_at >= $${idx++}`);
            params.push(filters.from_date);
        }
        if (filters.to_date) {
            conditions.push(`ce.created_at <= ($${idx++}::date + INTERVAL '1 day')`);
            params.push(filters.to_date);
        }

        const where = conditions.join(' AND ');
        const offset = (filters.page - 1) * filters.limit;

        const countResult = await pool.query(
            `SELECT COUNT(*)::int AS total
             FROM clinical_examinations ce
             JOIN encounters e ON e.encounters_id = ce.encounter_id
             WHERE ${where}`, params
        );

        const dataParams = [...params, filters.limit, offset];
        const dataResult = await pool.query(
            `SELECT ce.clinical_examinations_id, ce.encounter_id,
                    e.start_time AS encounter_start,
                    up_doc.full_name AS doctor_name,
                    up_rec.full_name AS recorder_name,
                    ce.pulse, ce.blood_pressure_systolic, ce.blood_pressure_diastolic,
                    ce.temperature, ce.respiratory_rate, ce.spo2,
                    ce.weight, ce.height, ce.bmi, ce.blood_glucose,
                    ce.created_at
             FROM clinical_examinations ce
             JOIN encounters e ON e.encounters_id = ce.encounter_id
             LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
             LEFT JOIN user_profiles up_doc ON up_doc.user_id = d.user_id
             LEFT JOIN user_profiles up_rec ON up_rec.user_id = ce.recorded_by
             WHERE ${where}
             ORDER BY ce.created_at DESC
             LIMIT $${idx++} OFFSET $${idx++}`,
            dataParams
        );

        return { data: dataResult.rows, total: countResult.rows[0].total };
    }

    /**
     * API 2: Sinh hiệu mới nhất (encounter gần nhất)
     */
    static async getLatestVitals(patientId: string): Promise<VitalSignRecord | null> {
        const r = await pool.query(
            `SELECT ce.clinical_examinations_id, ce.encounter_id,
                    e.start_time AS encounter_start,
                    up_doc.full_name AS doctor_name,
                    up_rec.full_name AS recorder_name,
                    ce.pulse, ce.blood_pressure_systolic, ce.blood_pressure_diastolic,
                    ce.temperature, ce.respiratory_rate, ce.spo2,
                    ce.weight, ce.height, ce.bmi, ce.blood_glucose,
                    ce.created_at
             FROM clinical_examinations ce
             JOIN encounters e ON e.encounters_id = ce.encounter_id
             LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
             LEFT JOIN user_profiles up_doc ON up_doc.user_id = d.user_id
             LEFT JOIN user_profiles up_rec ON up_rec.user_id = ce.recorded_by
             WHERE e.patient_id = $1
             ORDER BY ce.created_at DESC
             LIMIT 1`,
            [patientId]
        );
        return r.rows[0] || null;
    }

    /**
     * API 3: Xu hướng 1 chỉ số - từ clinical_examinations
     */
    static async getVitalTrendsFromExams(patientId: string, metricType: string): Promise<VitalTrendPoint[]> {
        const validFields = [
            'pulse', 'blood_pressure_systolic', 'blood_pressure_diastolic',
            'temperature', 'respiratory_rate', 'spo2',
            'weight', 'height', 'bmi', 'blood_glucose',
        ];
        if (!validFields.includes(metricType)) return [];

        const r = await pool.query(
            `SELECT ce.created_at AS measured_at,
                    ce.${metricType} AS value,
                    'CLINIC' AS source,
                    ce.encounter_id
             FROM clinical_examinations ce
             JOIN encounters e ON e.encounters_id = ce.encounter_id
             WHERE e.patient_id = $1
               AND ce.${metricType} IS NOT NULL
             ORDER BY ce.created_at ASC
             LIMIT $2`,
            [patientId, VS_CONFIG.TREND_MAX_POINTS]
        );
        return r.rows;
    }

    /**
     * API 3 phần 2: Xu hướng từ patient_health_metrics
     */
    static async getMetricTrends(patientId: string, metricCode: string): Promise<VitalTrendPoint[]> {
        const r = await pool.query(
            `SELECT phm.measured_at,
                    phm.metric_value AS value,
                    phm.source_type AS source,
                    NULL AS encounter_id
             FROM patient_health_metrics phm
             WHERE phm.patient_id = $1
               AND phm.metric_code = $2
             ORDER BY phm.measured_at ASC
             LIMIT $3`,
            [patientId, metricCode, VS_CONFIG.TREND_MAX_POINTS]
        );
        return r.rows;
    }

    /**
     * API 4: Lấy tất cả sinh hiệu để check bất thường
     */
    static async getAllVitalsForAbnormalCheck(patientId: string): Promise<any[]> {
        const r = await pool.query(
            `SELECT ce.clinical_examinations_id, ce.encounter_id,
                    e.start_time AS encounter_start,
                    ce.pulse, ce.blood_pressure_systolic, ce.blood_pressure_diastolic,
                    ce.temperature, ce.respiratory_rate, ce.spo2,
                    ce.weight, ce.height, ce.bmi, ce.blood_glucose,
                    ce.created_at
             FROM clinical_examinations ce
             JOIN encounters e ON e.encounters_id = ce.encounter_id
             WHERE e.patient_id = $1
             ORDER BY ce.created_at DESC`,
            [patientId]
        );
        return r.rows;
    }

    /**
     * API 5: Dữ liệu cho tổng hợp (N lần gần nhất)
     */
    static async getRecentVitals(patientId: string, lastN: number): Promise<VitalSignRecord[]> {
        const r = await pool.query(
            `SELECT ce.pulse, ce.blood_pressure_systolic, ce.blood_pressure_diastolic,
                    ce.weight, ce.height, ce.bmi, ce.blood_glucose,
                    ce.created_at
             FROM clinical_examinations ce
             JOIN encounters e ON e.encounters_id = ce.encounter_id
             WHERE e.patient_id = $1
             ORDER BY ce.created_at DESC
             LIMIT $2`,
            [patientId, lastN]
        );
        return r.rows;
    }

    /** Tổng số lần đo */
    static async getTotalMeasurements(patientId: string): Promise<number> {
        const r = await pool.query(
            `SELECT COUNT(*)::int AS total
             FROM clinical_examinations ce
             JOIN encounters e ON e.encounters_id = ce.encounter_id
             WHERE e.patient_id = $1`, [patientId]
        );
        return r.rows[0].total;
    }

    /**
     * API 6: DS chỉ số từ patient_health_metrics
     */
    static async getHealthMetrics(patientId: string, filters: MetricFilters): Promise<{ data: HealthMetricItem[]; total: number }> {
        const conditions = ['phm.patient_id = $1'];
        const params: any[] = [patientId];
        let idx = 2;

        if (filters.metric_code) {
            conditions.push(`phm.metric_code = $${idx++}`);
            params.push(filters.metric_code);
        }
        if (filters.source_type) {
            conditions.push(`phm.source_type = $${idx++}`);
            params.push(filters.source_type);
        }
        if (filters.from_date) {
            conditions.push(`phm.measured_at >= $${idx++}`);
            params.push(filters.from_date);
        }
        if (filters.to_date) {
            conditions.push(`phm.measured_at <= ($${idx++}::date + INTERVAL '1 day')`);
            params.push(filters.to_date);
        }

        const where = conditions.join(' AND ');
        const offset = (filters.page - 1) * filters.limit;

        const countResult = await pool.query(
            `SELECT COUNT(*)::int AS total FROM patient_health_metrics phm WHERE ${where}`, params
        );

        const dataParams = [...params, filters.limit, offset];
        const dataResult = await pool.query(
            `SELECT phm.*
             FROM patient_health_metrics phm
             WHERE ${where}
             ORDER BY phm.measured_at DESC
             LIMIT $${idx++} OFFSET $${idx++}`,
            dataParams
        );

        return { data: dataResult.rows, total: countResult.rows[0].total };
    }

    /**
     * API 7: Thêm chỉ số
     */
    static async createHealthMetric(patientId: string, data: CreateHealthMetricInput): Promise<HealthMetricItem> {
        const id = generateMetricId();
        const r = await pool.query(
            `INSERT INTO patient_health_metrics (patient_health_metrics_id, patient_id, metric_code, metric_name, metric_value, unit, measured_at, source_type, device_info)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [id, patientId, data.metric_code, data.metric_name, JSON.stringify(data.metric_value), data.unit, data.measured_at, data.source_type || 'SELF_REPORTED', data.device_info || null]
        );
        return r.rows[0];
    }

    /**
     * API 8: Timeline hợp nhất
     */
    static async getTimeline(patientId: string): Promise<VitalTimelineItem[]> {
        const r = await pool.query(
            `(
                SELECT 'CE_' || ce.clinical_examinations_id AS event_id,
                       'CLINICAL_EXAM' AS event_type,
                       ce.created_at AS event_date,
                       'vitals' AS metric_code,
                       'Sinh hiệu lần khám' AS metric_name,
                       CONCAT_WS(', ',
                           CASE WHEN ce.pulse IS NOT NULL THEN 'Mạch: ' || ce.pulse || 'bpm' END,
                           CASE WHEN ce.blood_pressure_systolic IS NOT NULL THEN 'HA: ' || ce.blood_pressure_systolic || '/' || ce.blood_pressure_diastolic || 'mmHg' END,
                           CASE WHEN ce.temperature IS NOT NULL THEN 'T°: ' || ce.temperature || '°C' END,
                           CASE WHEN ce.spo2 IS NOT NULL THEN 'SpO2: ' || ce.spo2 || '%' END
                       ) AS value,
                       '' AS unit,
                       'CLINIC' AS source
                FROM clinical_examinations ce
                JOIN encounters e ON e.encounters_id = ce.encounter_id
                WHERE e.patient_id = $1
             )
             UNION ALL
             (
                SELECT 'PHM_' || phm.patient_health_metrics_id AS event_id,
                       'HEALTH_METRIC' AS event_type,
                       phm.measured_at AS event_date,
                       phm.metric_code,
                       phm.metric_name,
                       phm.metric_value::text AS value,
                       phm.unit,
                       phm.source_type AS source
                FROM patient_health_metrics phm
                WHERE phm.patient_id = $1
             )
             ORDER BY event_date DESC`,
            [patientId]
        );
        return r.rows;
    }
}
