import { pool } from '../../config/postgresdb';
import { v4 as uuidv4 } from 'uuid';
import {
    PatientBasicInfo,
    LatestVitals,
    ActiveCondition,
    AllergyItem,
    CurrentMedication,
    DiagnosisHistoryItem,
    InsuranceStatusItem,
    PatientTagItem,
    HealthAlert,
    EhrProfileMeta,
    CreateAlertInput,
    UpdateAlertInput,
    UpdateEhrNotesInput,
} from '../../models/EHR/health-profile.model';
import { HEALTH_PROFILE_CONFIG } from '../../constants/health-profile.constant';

/**
 * Tạo ID EHR profile
 */
function generateProfileId(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `EHR_${yy}${mm}${dd}_${uuidv4().substring(0, 8)}`;
}

/**
 * Tạo ID cảnh báo y tế
 */
function generateAlertId(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `EHRA_${yy}${mm}${dd}_${uuidv4().substring(0, 8)}`;
}


export class HealthProfileRepository {

    //  VALIDATION 

    /** Kiểm tra bệnh nhân tồn tại và chưa bị xóa */
    static async patientExists(patientId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM patients WHERE id::text = $1 AND deleted_at IS NULL) AS exists`,
            [patientId]
        );
        return result.rows[0].exists;
    }

    //  PATIENT INFO 

    /** Lấy thông tin hành chính cơ bản bệnh nhân */
    static async getPatientInfo(patientId: string): Promise<PatientBasicInfo | null> {
        const result = await pool.query(
            `SELECT 
                p.id, p.patient_code, p.full_name, p.date_of_birth, p.gender,
                p.phone_number, p.email, p.address, p.status,
                EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth))::int AS age
             FROM patients p
             WHERE p.id::text = $1 AND p.deleted_at IS NULL`,
            [patientId]
        );
        return result.rows[0] || null;
    }

    //  HEALTH SUMMARY (AGGREGATE) 

    /** Tổng số encounters */
    static async getTotalEncounters(patientId: string): Promise<number> {
        const result = await pool.query(
            `SELECT COUNT(*)::int AS total FROM encounters WHERE patient_id = $1`,
            [patientId]
        );
        return result.rows[0].total;
    }

    /** Lần khám cuối cùng (ngày, BS, chẩn đoán chính) */
    static async getLastEncounter(patientId: string): Promise<{
        date: string | null;
        doctor_name: string | null;
        diagnosis_name: string | null;
        icd10_code: string | null;
    }> {
        const result = await pool.query(
            `SELECT 
                e.start_time AS date,
                up.full_name AS doctor_name,
                (SELECT ed.diagnosis_name FROM encounter_diagnoses ed 
                 WHERE ed.encounter_id = e.encounters_id AND ed.diagnosis_type = 'PRIMARY' LIMIT 1) AS diagnosis_name,
                (SELECT ed.icd10_code FROM encounter_diagnoses ed 
                 WHERE ed.encounter_id = e.encounters_id AND ed.diagnosis_type = 'PRIMARY' LIMIT 1) AS icd10_code
             FROM encounters e
             LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
             LEFT JOIN user_profiles up ON up.user_id = d.user_id
             WHERE e.patient_id = $1
             ORDER BY e.start_time DESC LIMIT 1`,
            [patientId]
        );
        return result.rows[0] || { date: null, doctor_name: null, diagnosis_name: null, icd10_code: null };
    }

    /** Đếm bệnh lý đang ACTIVE */
    static async countActiveConditions(patientId: string): Promise<number> {
        const result = await pool.query(
            `SELECT COUNT(*)::int AS total 
             FROM patient_medical_histories 
             WHERE patient_id = $1 AND status = 'ACTIVE'`,
            [patientId]
        );
        return result.rows[0].total;
    }

    /** Đếm dị ứng */
    static async countAllergies(patientId: string): Promise<number> {
        const result = await pool.query(
            `SELECT COUNT(*)::int AS total FROM patient_allergies WHERE patient_id = $1`,
            [patientId]
        );
        return result.rows[0].total;
    }

    /**
     * Đếm thuốc đang dùng (đơn PRESCRIBED/DISPENSED, duration chưa hết)
     * Logic: prescribed_at + duration_days >= CURRENT_DATE
     */
    static async countActiveMedications(patientId: string): Promise<number> {
        const result = await pool.query(
            `SELECT COUNT(DISTINCT pd.prescription_details_id)::int AS total
             FROM prescription_details pd
             JOIN prescriptions p ON p.prescriptions_id = pd.prescription_id
             WHERE p.patient_id = $1
               AND p.status IN ('PRESCRIBED', 'DISPENSED')
               AND pd.is_active = TRUE
               AND (
                   pd.duration_days IS NULL 
                   OR (p.prescribed_at::date + pd.duration_days * INTERVAL '1 day') >= CURRENT_DATE
               )`,
            [patientId]
        );
        return result.rows[0].total;
    }

    /** Kiểm tra có BH còn hiệu lực không */
    static async hasActiveInsurance(patientId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT EXISTS(
                SELECT 1 FROM patient_insurances 
                WHERE patient_id = $1 AND end_date >= CURRENT_DATE
            ) AS has_active`,
            [patientId]
        );
        return result.rows[0].has_active;
    }

    /** Đếm kế hoạch điều trị đang ACTIVE */
    static async countActiveTreatmentPlans(patientId: string): Promise<number> {
        const result = await pool.query(
            `SELECT COUNT(*)::int AS total 
             FROM treatment_plans 
             WHERE patient_id = $1 AND status = 'ACTIVE'`,
            [patientId]
        );
        return result.rows[0].total;
    }

    //  LATEST VITALS 

    /** Sinh hiệu từ lượt khám gần nhất có clinical_examinations */
    static async getLatestVitals(patientId: string): Promise<LatestVitals | null> {
        const result = await pool.query(
            `SELECT 
                e.encounters_id AS encounter_id,
                e.start_time AS encounter_date,
                ce.pulse, ce.blood_pressure_systolic, ce.blood_pressure_diastolic,
                ce.temperature, ce.respiratory_rate, ce.spo2,
                ce.weight, ce.height, ce.bmi,
                up.full_name AS recorded_by
             FROM clinical_examinations ce
             JOIN encounters e ON e.encounters_id = ce.encounter_id
             LEFT JOIN user_profiles up ON up.user_id = ce.recorded_by
             WHERE e.patient_id = $1
             ORDER BY e.start_time DESC
             LIMIT 1`,
            [patientId]
        );
        return result.rows[0] || null;
    }

    //  ACTIVE CONDITIONS 

    /** Danh sách bệnh lý đang ACTIVE */
    static async getActiveConditions(patientId: string): Promise<ActiveCondition[]> {
        const result = await pool.query(
            `SELECT 
                pmh.patient_medical_histories_id,
                pmh.condition_code, pmh.condition_name,
                pmh.history_type, pmh.diagnosis_date,
                pmh.status, pmh.notes, pmh.created_at,
                up.full_name AS reported_by_name
             FROM patient_medical_histories pmh
             LEFT JOIN user_profiles up ON up.user_id = pmh.reported_by
             WHERE pmh.patient_id = $1 AND pmh.status = 'ACTIVE'
             ORDER BY pmh.created_at DESC`,
            [patientId]
        );
        return result.rows;
    }

    //  ALLERGIES 

    /** Toàn bộ dị ứng của bệnh nhân */
    static async getAllergies(patientId: string): Promise<AllergyItem[]> {
        const result = await pool.query(
            `SELECT 
                patient_allergies_id, allergen_type, allergen_name,
                reaction, severity, notes
             FROM patient_allergies
             WHERE patient_id = $1
             ORDER BY 
                CASE severity WHEN 'SEVERE' THEN 1 WHEN 'MODERATE' THEN 2 ELSE 3 END,
                allergen_name ASC`,
            [patientId]
        );
        return result.rows;
    }

    //  CURRENT MEDICATIONS 

    /**
     * Thuốc đang sử dụng: từ đơn PRESCRIBED/DISPENSED mà duration chưa hết
     * Tính estimated_end_date = prescribed_at + duration_days
     */
    static async getCurrentMedications(patientId: string): Promise<CurrentMedication[]> {
        const result = await pool.query(
            `SELECT 
                p.prescription_code,
                d.drug_code, d.brand_name, d.active_ingredients,
                pd.dosage, pd.frequency, pd.duration_days,
                pd.usage_instruction, pd.route_of_administration,
                d.dispensing_unit,
                p.prescribed_at,
                CASE 
                    WHEN pd.duration_days IS NOT NULL 
                    THEN (p.prescribed_at::date + pd.duration_days * INTERVAL '1 day')::date::text
                    ELSE NULL 
                END AS estimated_end_date,
                up.full_name AS doctor_name
             FROM prescription_details pd
             JOIN prescriptions p ON p.prescriptions_id = pd.prescription_id
             JOIN drugs d ON d.drugs_id = pd.drug_id
             LEFT JOIN user_profiles up ON up.user_id = p.doctor_id
             WHERE p.patient_id = $1
               AND p.status IN ('PRESCRIBED', 'DISPENSED')
               AND pd.is_active = TRUE
               AND (
                   pd.duration_days IS NULL 
                   OR (p.prescribed_at::date + pd.duration_days * INTERVAL '1 day') >= CURRENT_DATE
               )
             ORDER BY p.prescribed_at DESC
             LIMIT $2`,
            [patientId, HEALTH_PROFILE_CONFIG.CURRENT_MEDICATIONS_LIMIT]
        );
        return result.rows;
    }

    //  DIAGNOSIS HISTORY 

    /** Lịch sử chẩn đoán có phân trang + filter khoảng thời gian */
    static async getDiagnosisHistory(
        patientId: string,
        page: number,
        limit: number,
        fromDate?: string,
        toDate?: string
    ): Promise<{ data: DiagnosisHistoryItem[]; total: number }> {
        const conditions: string[] = ['e.patient_id = $1'];
        const values: any[] = [patientId];
        let paramIndex = 2;

        if (fromDate) {
            conditions.push(`e.start_time >= $${paramIndex++}`);
            values.push(fromDate);
        }
        if (toDate) {
            conditions.push(`e.start_time <= ($${paramIndex++}::date + INTERVAL '1 day')`);
            values.push(toDate);
        }

        const whereClause = conditions.join(' AND ');
        const offset = (page - 1) * limit;

        const countResult = await pool.query(
            `SELECT COUNT(*)::int AS total
             FROM encounter_diagnoses ed
             JOIN encounters e ON e.encounters_id = ed.encounter_id
             WHERE ${whereClause}`,
            values
        );

        const dataValues = [...values, limit, offset];
        const dataResult = await pool.query(
            `SELECT 
                ed.encounter_diagnoses_id, ed.encounter_id,
                ed.icd10_code, ed.diagnosis_name, ed.diagnosis_type,
                e.start_time AS encounter_date,
                up.full_name AS doctor_name,
                ed.notes
             FROM encounter_diagnoses ed
             JOIN encounters e ON e.encounters_id = ed.encounter_id
             LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
             LEFT JOIN user_profiles up ON up.user_id = d.user_id
             WHERE ${whereClause}
             ORDER BY e.start_time DESC, 
                CASE ed.diagnosis_type WHEN 'PRIMARY' THEN 1 WHEN 'FINAL' THEN 2 ELSE 3 END
             LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
            dataValues
        );

        return { data: dataResult.rows, total: countResult.rows[0].total };
    }

    //  INSURANCE STATUS 

    /** Tình trạng bảo hiểm: tất cả thẻ + tính is_expired và days_until_expiry */
    static async getInsuranceStatus(patientId: string): Promise<InsuranceStatusItem[]> {
        const result = await pool.query(
            `SELECT 
                pi.patient_insurances_id, pi.insurance_type, pi.insurance_number,
                ip.provider_name, pi.start_date, pi.end_date,
                pi.coverage_percent, pi.is_primary,
                (pi.end_date < CURRENT_DATE) AS is_expired,
                (pi.end_date - CURRENT_DATE)::int AS days_until_expiry
             FROM patient_insurances pi
             LEFT JOIN insurance_providers ip ON ip.insurance_providers_id = pi.provider_id
             WHERE pi.patient_id = $1
             ORDER BY pi.is_primary DESC, pi.end_date DESC`,
            [patientId]
        );
        return result.rows;
    }

    //  PATIENT TAGS 

    /** Thẻ phân loại đang gán cho bệnh nhân */
    static async getPatientTags(patientId: string): Promise<PatientTagItem[]> {
        const result = await pool.query(
            `SELECT t.tags_id AS tag_id, t.code, t.name, t.color_hex
             FROM patient_tags pt
             JOIN tags t ON t.tags_id = pt.tag_id
             WHERE pt.patient_id = $1 AND t.is_active = TRUE
             ORDER BY t.name ASC`,
            [patientId]
        );
        return result.rows;
    }

    //  EHR PROFILE METADATA 

    /** Lấy metadata EHR profile (risk_level, notes) */
    static async getEhrProfile(patientId: string): Promise<EhrProfileMeta | null> {
        const result = await pool.query(
            `SELECT ep.*, up.full_name AS reviewer_name
             FROM ehr_health_profiles ep
             LEFT JOIN user_profiles up ON up.user_id = ep.last_reviewed_by
             WHERE ep.patient_id = $1`,
            [patientId]
        );
        return result.rows[0] || null;
    }

    /** Tạo hoặc cập nhật EHR profile (upsert) */
    static async upsertEhrProfile(
        patientId: string,
        userId: string,
        data: UpdateEhrNotesInput
    ): Promise<EhrProfileMeta> {
        const id = generateProfileId();

        const setClauses: string[] = [
            'last_reviewed_by = EXCLUDED.last_reviewed_by',
            'last_reviewed_at = CURRENT_TIMESTAMP',
            'updated_at = CURRENT_TIMESTAMP',
        ];

        if (data.ehr_notes !== undefined) {
            setClauses.push('ehr_notes = EXCLUDED.ehr_notes');
        }
        if (data.risk_level !== undefined) {
            setClauses.push('risk_level = EXCLUDED.risk_level');
        }

        const result = await pool.query(
            `INSERT INTO ehr_health_profiles (
                ehr_profile_id, patient_id, risk_level, ehr_notes,
                last_reviewed_by, last_reviewed_at, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (patient_id) DO UPDATE SET ${setClauses.join(', ')}
            RETURNING *`,
            [
                id,
                patientId,
                data.risk_level || 'LOW',
                data.ehr_notes || null,
                userId,
            ]
        );
        return result.rows[0];
    }

    //  ALERTS (MANUAL) 

    /** Danh sách cảnh báo thủ công (chưa xóa) */
    static async getManualAlerts(patientId: string): Promise<HealthAlert[]> {
        const result = await pool.query(
            `SELECT 
                ea.alert_id, ea.alert_type, ea.severity,
                ea.title, ea.description,
                'MANUAL' AS source,
                up.full_name AS created_by_name,
                ea.is_active, ea.created_at
             FROM ehr_health_alerts ea
             LEFT JOIN user_profiles up ON up.user_id = ea.created_by
             WHERE ea.patient_id = $1 AND ea.deleted_at IS NULL
             ORDER BY 
                CASE ea.severity WHEN 'CRITICAL' THEN 1 WHEN 'WARNING' THEN 2 ELSE 3 END,
                ea.created_at DESC`,
            [patientId]
        );
        return result.rows;
    }

    /** Tạo cảnh báo thủ công */
    static async createAlert(
        patientId: string,
        userId: string,
        data: CreateAlertInput
    ): Promise<HealthAlert> {
        const id = generateAlertId();
        const result = await pool.query(
            `INSERT INTO ehr_health_alerts (
                alert_id, patient_id, alert_type, severity,
                title, description, created_by,
                is_active, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *`,
            [
                id, patientId, data.alert_type,
                data.severity || 'INFO',
                data.title, data.description || null,
                userId,
            ]
        );

        const alert = result.rows[0];
        return {
            ...alert,
            source: 'MANUAL' as const,
            created_by_name: null,
        };
    }

    /** Tìm cảnh báo theo ID */
    static async findAlertById(alertId: string): Promise<any | null> {
        const result = await pool.query(
            `SELECT * FROM ehr_health_alerts WHERE alert_id = $1 AND deleted_at IS NULL`,
            [alertId]
        );
        return result.rows[0] || null;
    }

    /** Cập nhật cảnh báo thủ công */
    static async updateAlert(alertId: string, data: UpdateAlertInput): Promise<HealthAlert> {
        const setClauses: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.severity !== undefined) {
            setClauses.push(`severity = $${paramIndex++}`);
            values.push(data.severity);
        }
        if (data.title !== undefined) {
            setClauses.push(`title = $${paramIndex++}`);
            values.push(data.title);
        }
        if (data.description !== undefined) {
            setClauses.push(`description = $${paramIndex++}`);
            values.push(data.description);
        }
        if (data.is_active !== undefined) {
            setClauses.push(`is_active = $${paramIndex++}`);
            values.push(data.is_active);
        }

        values.push(alertId);
        const result = await pool.query(
            `UPDATE ehr_health_alerts SET ${setClauses.join(', ')} 
             WHERE alert_id = $${paramIndex} AND deleted_at IS NULL
             RETURNING *`,
            values
        );

        const alert = result.rows[0];
        return { ...alert, source: 'MANUAL' as const, created_by_name: null };
    }

    /** Soft delete cảnh báo thủ công */
    static async deleteAlert(alertId: string): Promise<void> {
        await pool.query(
            `UPDATE ehr_health_alerts SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE alert_id = $1 AND deleted_at IS NULL`,
            [alertId]
        );
    }

    //  DATA CHO AUTO ALERTS 

    /** Dị ứng mức SEVERE */
    static async getSevereAllergies(patientId: string): Promise<AllergyItem[]> {
        const result = await pool.query(
            `SELECT patient_allergies_id, allergen_type, allergen_name, reaction, severity, notes
             FROM patient_allergies
             WHERE patient_id = $1 AND severity = 'SEVERE'`,
            [patientId]
        );
        return result.rows;
    }

    /**
     * Bệnh mãn tính: tiền sử ACTIVE tạo cách đây >= thresholdMonths tháng
     */
    static async getChronicConditions(patientId: string, thresholdMonths: number): Promise<ActiveCondition[]> {
        const result = await pool.query(
            `SELECT patient_medical_histories_id, condition_code, condition_name,
                    history_type, diagnosis_date, status, notes, created_at, NULL AS reported_by_name
             FROM patient_medical_histories
             WHERE patient_id = $1 
               AND status = 'ACTIVE'
               AND created_at <= (CURRENT_TIMESTAMP - ($2 || ' months')::INTERVAL)`,
            [patientId, thresholdMonths]
        );
        return result.rows;
    }

    /** BH sắp hết hạn (trong vòng warningDays ngày) */
    static async getExpiringInsurances(patientId: string, warningDays: number): Promise<InsuranceStatusItem[]> {
        const result = await pool.query(
            `SELECT pi.patient_insurances_id, pi.insurance_type, pi.insurance_number,
                    ip.provider_name, pi.start_date, pi.end_date,
                    pi.coverage_percent, pi.is_primary,
                    FALSE AS is_expired,
                    (pi.end_date - CURRENT_DATE)::int AS days_until_expiry
             FROM patient_insurances pi
             LEFT JOIN insurance_providers ip ON ip.insurance_providers_id = pi.provider_id
             WHERE pi.patient_id = $1
               AND pi.end_date >= CURRENT_DATE
               AND pi.end_date <= (CURRENT_DATE + $2 * INTERVAL '1 day')`,
            [patientId, warningDays]
        );
        return result.rows;
    }

    /** BH đã hết hạn */
    static async getExpiredInsurances(patientId: string): Promise<InsuranceStatusItem[]> {
        const result = await pool.query(
            `SELECT pi.patient_insurances_id, pi.insurance_type, pi.insurance_number,
                    ip.provider_name, pi.start_date, pi.end_date,
                    pi.coverage_percent, pi.is_primary,
                    TRUE AS is_expired,
                    (pi.end_date - CURRENT_DATE)::int AS days_until_expiry
             FROM patient_insurances pi
             LEFT JOIN insurance_providers ip ON ip.insurance_providers_id = pi.provider_id
             WHERE pi.patient_id = $1 AND pi.end_date < CURRENT_DATE
             ORDER BY pi.end_date DESC`,
            [patientId]
        );
        return result.rows;
    }

    /** Ngày lượt khám gần nhất (dùng check NO_RECENT_VISIT) */
    static async getLastEncounterDate(patientId: string): Promise<string | null> {
        const result = await pool.query(
            `SELECT start_time FROM encounters WHERE patient_id = $1 ORDER BY start_time DESC LIMIT 1`,
            [patientId]
        );
        return result.rows[0]?.start_time || null;
    }

    /** Kế hoạch điều trị đang ACTIVE */
    static async getActiveTreatmentPlans(patientId: string): Promise<{ plan_code: string; title: string }[]> {
        const result = await pool.query(
            `SELECT plan_code, title FROM treatment_plans WHERE patient_id = $1 AND status = 'ACTIVE'`,
            [patientId]
        );
        return result.rows;
    }
}
