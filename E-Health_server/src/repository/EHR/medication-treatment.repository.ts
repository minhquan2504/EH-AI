import { pool } from '../../config/postgresdb';
import { v4 as uuidv4 } from 'uuid';
import {
    MedicationRecordItem, PrescriptionDrugItem,
    CurrentMedicationItem, TreatmentRecordItem, TreatmentNoteItem,
    FollowUpItem, InteractionWarning, AdherenceRecord,
    MedicationTimelineItem, MedicationFilters, CreateAdherenceInput,
} from '../../models/EHR/medication-treatment.model';

/** Tạo ID: ADH_yymmdd_uuid */
function generateAdherenceId(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `ADH_${yy}${mm}${dd}_${uuidv4().slice(0, 8)}`;
}

export class MedicationTreatmentRepository {

    /** Kiểm tra bệnh nhân tồn tại */
    static async patientExists(patientId: string): Promise<boolean> {
        const r = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM patients WHERE id = $1 AND deleted_at IS NULL) AS exists`,
            [patientId]
        );
        return r.rows[0].exists;
    }

    /**
     * API 1: Lịch sử đơn thuốc tổng hợp (phân trang + filter)
     */
    static async getMedicationRecords(patientId: string, filters: MedicationFilters): Promise<{ data: MedicationRecordItem[]; total: number }> {
        const conditions = ['pr.patient_id = $1'];
        const params: any[] = [patientId];
        let idx = 2;

        if (filters.status) {
            conditions.push(`pr.status = $${idx++}`);
            params.push(filters.status);
        }
        if (filters.from_date) {
            conditions.push(`pr.prescribed_at >= $${idx++}`);
            params.push(filters.from_date);
        }
        if (filters.to_date) {
            conditions.push(`pr.prescribed_at <= ($${idx++}::date + INTERVAL '1 day')`);
            params.push(filters.to_date);
        }

        const where = conditions.join(' AND ');
        const offset = (filters.page - 1) * filters.limit;

        const countResult = await pool.query(
            `SELECT COUNT(*)::int AS total FROM prescriptions pr WHERE ${where}`, params
        );

        const dataParams = [...params, filters.limit, offset];
        const dataResult = await pool.query(
            `SELECT pr.prescriptions_id, pr.prescription_code, pr.encounter_id, pr.patient_id,
                    pr.doctor_id, pr.status, pr.clinical_diagnosis, pr.doctor_notes, pr.prescribed_at,
                    up.full_name AS doctor_name,
                    e.start_time AS encounter_start,
                    (SELECT COUNT(*)::int FROM prescription_details pd WHERE pd.prescription_id = pr.prescriptions_id) AS drug_count,
                    (ddo.drug_dispense_orders_id IS NOT NULL) AS is_dispensed,
                    ddo.dispensed_at
             FROM prescriptions pr
             LEFT JOIN encounters e ON e.encounters_id = pr.encounter_id
             LEFT JOIN user_profiles up ON up.user_id = pr.doctor_id
             LEFT JOIN drug_dispense_orders ddo ON ddo.prescription_id = pr.prescriptions_id
             WHERE ${where}
             ORDER BY pr.prescribed_at DESC
             LIMIT $${idx++} OFFSET $${idx++}`,
            dataParams
        );

        return { data: dataResult.rows, total: countResult.rows[0].total };
    }

    /**
     * API 2: Chi tiết đơn thuốc — header
     */
    static async getPrescriptionHeader(prescriptionId: string): Promise<any | null> {
        const r = await pool.query(
            `SELECT pr.prescriptions_id, pr.prescription_code, pr.encounter_id, pr.patient_id,
                    pr.status, pr.clinical_diagnosis, pr.doctor_notes, pr.prescribed_at,
                    up.full_name AS doctor_name,
                    (ddo.drug_dispense_orders_id IS NOT NULL) AS is_dispensed,
                    ddo.dispensed_at,
                    up_ph.full_name AS pharmacist_name
             FROM prescriptions pr
             LEFT JOIN user_profiles up ON up.user_id = pr.doctor_id
             LEFT JOIN drug_dispense_orders ddo ON ddo.prescription_id = pr.prescriptions_id
             LEFT JOIN user_profiles up_ph ON up_ph.user_id = ddo.pharmacist_id
             WHERE pr.prescriptions_id = $1`,
            [prescriptionId]
        );
        return r.rows[0] || null;
    }

    /** Chi tiết đơn thuốc — danh sách thuốc */
    static async getPrescriptionDrugs(prescriptionId: string): Promise<PrescriptionDrugItem[]> {
        const r = await pool.query(
            `SELECT pd.prescription_details_id, pd.drug_id,
                    d.drug_code, d.brand_name, d.active_ingredients,
                    d.route_of_administration, d.dispensing_unit,
                    pd.quantity, pd.dosage, pd.frequency, pd.duration_days, pd.usage_instruction
             FROM prescription_details pd
             JOIN drugs d ON d.drugs_id = pd.drug_id
             WHERE pd.prescription_id = $1
             ORDER BY pd.prescription_details_id`,
            [prescriptionId]
        );
        return r.rows;
    }

    /**
     * API 3: Thuốc đang sử dụng
     * Đơn DISPENSED, tính còn duration → trả về thuốc chưa hết liệu trình
     */
    static async getCurrentMedications(patientId: string): Promise<CurrentMedicationItem[]> {
        const r = await pool.query(
            `SELECT pd.prescription_details_id,
                    d.drug_code, d.brand_name, d.active_ingredients,
                    pd.dosage, pd.frequency, pd.duration_days, pd.usage_instruction, d.dispensing_unit,
                    pr.prescribed_at,
                    CASE
                        WHEN pd.duration_days IS NOT NULL
                        THEN GREATEST(pd.duration_days - EXTRACT(DAY FROM (CURRENT_TIMESTAMP - pr.prescribed_at))::int, 0)
                        ELSE NULL
                    END AS days_remaining,
                    pr.prescription_code,
                    up.full_name AS doctor_name
             FROM prescriptions pr
             JOIN prescription_details pd ON pd.prescription_id = pr.prescriptions_id
             JOIN drugs d ON d.drugs_id = pd.drug_id
             LEFT JOIN user_profiles up ON up.user_id = pr.doctor_id
             WHERE pr.patient_id = $1
               AND pr.status = 'DISPENSED'
               AND (
                   pd.duration_days IS NULL
                   OR (pr.prescribed_at + (pd.duration_days || ' days')::INTERVAL) >= CURRENT_TIMESTAMP
               )
             ORDER BY pr.prescribed_at DESC`,
            [patientId]
        );
        return r.rows;
    }

    /**
     * API 4: Lịch sử kế hoạch điều trị
     */
    static async getTreatmentRecords(patientId: string, filters: MedicationFilters): Promise<{ data: TreatmentRecordItem[]; total: number }> {
        const conditions = ['tp.patient_id = $1'];
        const params: any[] = [patientId];
        let idx = 2;

        if (filters.status) {
            conditions.push(`tp.status = $${idx++}`);
            params.push(filters.status);
        }

        const where = conditions.join(' AND ');
        const offset = (filters.page - 1) * filters.limit;

        const countResult = await pool.query(
            `SELECT COUNT(*)::int AS total FROM treatment_plans tp WHERE ${where}`, params
        );

        const dataParams = [...params, filters.limit, offset];
        const dataResult = await pool.query(
            `SELECT tp.treatment_plans_id, tp.plan_code, tp.patient_id,
                    tp.primary_diagnosis_code, tp.primary_diagnosis_name,
                    tp.title, tp.description, tp.goals,
                    tp.start_date, tp.expected_end_date, tp.actual_end_date, tp.status,
                    up.full_name AS created_by_name,
                    (SELECT COUNT(*)::int FROM treatment_progress_notes tpn WHERE tpn.plan_id = tp.treatment_plans_id) AS notes_count
             FROM treatment_plans tp
             LEFT JOIN user_profiles up ON up.user_id = tp.created_by
             WHERE ${where}
             ORDER BY tp.start_date DESC
             LIMIT $${idx++} OFFSET $${idx++}`,
            dataParams
        );

        return { data: dataResult.rows, total: countResult.rows[0].total };
    }

    /**
     * API 5: Chi tiết kế hoạch + notes + follow-ups
     */
    static async getTreatmentPlanHeader(planId: string): Promise<any | null> {
        const r = await pool.query(
            `SELECT tp.*, up.full_name AS created_by_name,
                    (SELECT COUNT(*)::int FROM treatment_progress_notes tpn WHERE tpn.plan_id = tp.treatment_plans_id) AS notes_count
             FROM treatment_plans tp
             LEFT JOIN user_profiles up ON up.user_id = tp.created_by
             WHERE tp.treatment_plans_id = $1`,
            [planId]
        );
        return r.rows[0] || null;
    }

    static async getTreatmentNotes(planId: string): Promise<TreatmentNoteItem[]> {
        const r = await pool.query(
            `SELECT tpn.treatment_progress_notes_id, tpn.note_type, tpn.title, tpn.content,
                    tpn.severity, tpn.created_at,
                    up.full_name AS recorded_by_name
             FROM treatment_progress_notes tpn
             LEFT JOIN user_profiles up ON up.user_id = tpn.recorded_by
             WHERE tpn.plan_id = $1
             ORDER BY tpn.created_at DESC`,
            [planId]
        );
        return r.rows;
    }

    static async getFollowUps(planId: string): Promise<FollowUpItem[]> {
        const r = await pool.query(
            `SELECT efl.*
             FROM encounter_follow_up_links efl
             WHERE efl.plan_id = $1
             ORDER BY efl.scheduled_date ASC`,
            [planId]
        );
        return r.rows;
    }

    /**
     * API 6: Cảnh báo tương tác thuốc
     * So sánh thuốc đang dùng vs dị ứng (allergen_type = DRUG)
     */
    static async checkInteractions(patientId: string): Promise<InteractionWarning[]> {
        const r = await pool.query(
            `SELECT d.drug_code, d.brand_name, d.active_ingredients,
                    pa.allergen_name, pa.allergen_type, pa.severity, pa.reaction,
                    'ALLERGY_MATCH' AS warning_type
             FROM prescriptions pr
             JOIN prescription_details pd ON pd.prescription_id = pr.prescriptions_id
             JOIN drugs d ON d.drugs_id = pd.drug_id
             CROSS JOIN patient_allergies pa
             WHERE pr.patient_id = $1
               AND pr.status = 'DISPENSED'
               AND pa.patient_id = $1
               AND pa.allergen_type = 'DRUG'
               AND (pa.deleted_at IS NULL)
               AND (
                   LOWER(d.brand_name) LIKE '%' || LOWER(pa.allergen_name) || '%'
                   OR LOWER(d.active_ingredients) LIKE '%' || LOWER(pa.allergen_name) || '%'
                   OR LOWER(pa.allergen_name) LIKE '%' || LOWER(d.brand_name) || '%'
               )
               AND (
                   pd.duration_days IS NULL
                   OR (pr.prescribed_at + (pd.duration_days || ' days')::INTERVAL) >= CURRENT_TIMESTAMP
               )`,
            [patientId]
        );
        return r.rows;
    }

    /**
     * API 7: Ghi nhận tuân thủ
     */
    static async createAdherence(patientId: string, data: CreateAdherenceInput, recordedBy: string): Promise<AdherenceRecord> {
        const id = generateAdherenceId();
        const r = await pool.query(
            `INSERT INTO ehr_medication_adherence (adherence_id, patient_id, prescription_detail_id, adherence_date, taken, skip_reason, recorded_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [id, patientId, data.prescription_detail_id, data.adherence_date, data.taken, data.skip_reason || null, recordedBy]
        );
        return r.rows[0];
    }

    /** Validate prescription_detail thuộc patient */
    static async prescriptionDetailBelongsToPatient(detailId: string, patientId: string): Promise<boolean> {
        const r = await pool.query(
            `SELECT EXISTS(
                SELECT 1 FROM prescription_details pd
                JOIN prescriptions pr ON pr.prescriptions_id = pd.prescription_id
                WHERE pd.prescription_details_id = $1 AND pr.patient_id = $2
            ) AS exists`,
            [detailId, patientId]
        );
        return r.rows[0].exists;
    }

    /**
     * API 8: Lịch sử tuân thủ
     */
    static async getAdherenceRecords(patientId: string, fromDate?: string, toDate?: string): Promise<AdherenceRecord[]> {
        const conditions = ['ema.patient_id = $1'];
        const params: any[] = [patientId];
        let idx = 2;

        if (fromDate) {
            conditions.push(`ema.adherence_date >= $${idx++}`);
            params.push(fromDate);
        }
        if (toDate) {
            conditions.push(`ema.adherence_date <= $${idx++}`);
            params.push(toDate);
        }

        const r = await pool.query(
            `SELECT ema.adherence_id, ema.prescription_detail_id, ema.adherence_date,
                    ema.taken, ema.skip_reason, ema.created_at,
                    up.full_name AS recorded_by_name,
                    d.brand_name AS drug_name, pd.dosage
             FROM ehr_medication_adherence ema
             LEFT JOIN user_profiles up ON up.user_id = ema.recorded_by
             LEFT JOIN prescription_details pd ON pd.prescription_details_id = ema.prescription_detail_id
             LEFT JOIN drugs d ON d.drugs_id = pd.drug_id
             WHERE ${conditions.join(' AND ')}
             ORDER BY ema.adherence_date DESC, ema.created_at DESC`,
            params
        );
        return r.rows;
    }

    /**
     * API 9: Timeline thuốc + điều trị
     */
    static async getTimeline(patientId: string): Promise<MedicationTimelineItem[]> {
        const r = await pool.query(
            `(
                SELECT 'RX_' || pr.prescriptions_id AS event_id,
                       'PRESCRIPTION' AS event_type,
                       pr.prescribed_at AS event_date,
                       'Đơn thuốc ' || pr.prescription_code AS title,
                       pr.clinical_diagnosis AS description,
                       pr.status,
                       pr.prescriptions_id AS reference_id
                FROM prescriptions pr
                WHERE pr.patient_id = $1
             )
             UNION ALL
             (
                SELECT 'TP_' || tp.treatment_plans_id AS event_id,
                       'TREATMENT_PLAN' AS event_type,
                       tp.created_at AS event_date,
                       tp.title,
                       tp.primary_diagnosis_name AS description,
                       tp.status,
                       tp.treatment_plans_id AS reference_id
                FROM treatment_plans tp
                WHERE tp.patient_id = $1
             )
             UNION ALL
             (
                SELECT 'DISP_' || ddo.drug_dispense_orders_id AS event_id,
                       'DISPENSED' AS event_type,
                       ddo.dispensed_at AS event_date,
                       'Phát thuốc đơn ' || pr.prescription_code AS title,
                       NULL AS description,
                       ddo.status,
                       ddo.drug_dispense_orders_id AS reference_id
                FROM drug_dispense_orders ddo
                JOIN prescriptions pr ON pr.prescriptions_id = ddo.prescription_id
                WHERE pr.patient_id = $1
             )
             ORDER BY event_date DESC`,
            [patientId]
        );
        return r.rows;
    }
}
