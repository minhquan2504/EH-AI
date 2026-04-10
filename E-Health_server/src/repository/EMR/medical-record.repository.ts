import { pool } from '../../config/postgresdb';
import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import {
    EncounterInfo,
    ClinicalExamInfo,
    DiagnosisInfo,
    MedicalOrderInfo,
    PrescriptionInfo,
    SignatureInfo,
    SnapshotMeta,
    SnapshotFull,
    PatientRecordItem,
    TimelineEvent,
    TopDiagnosisItem,
    TopDrugItem,
    VitalSignTrend,
    SearchRecordItem,
} from '../../models/EMR/medical-record.model';
import { MEDICAL_RECORD_CONFIG } from '../../constants/medical-record.constant';

type QueryExecutor = Pool | PoolClient;

/**
 * Tạo ID snapshot
 */
function generateSnapshotId(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `SNAP_${yy}${mm}${dd}_${uuidv4().substring(0, 8)}`;
}

/**
 * Tạo ID timeline event
 */
function generateTimelineId(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `TLE_${yy}${mm}${dd}_${uuidv4().substring(0, 8)}`;
}


export class MedicalRecordRepository {

    //  ENCOUNTER INFO 
    /** Lấy encounter kèm thông tin join (bệnh nhân, BS, phòng) */
    static async getEncounterInfo(encounterId: string): Promise<EncounterInfo | null> {
        const result = await pool.query(
            `SELECT e.*,
                    p.full_name AS patient_name, p.patient_code,
                    up.full_name AS doctor_name, d.title AS doctor_title,
                    sp.name AS specialty_name,
                    mr.name AS room_name, mr.code AS room_code
             FROM encounters e
             LEFT JOIN patients p ON p.id::text = e.patient_id
             LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
             LEFT JOIN user_profiles up ON up.user_id = d.user_id
             LEFT JOIN specialties sp ON sp.specialties_id = d.specialty_id
             LEFT JOIN medical_rooms mr ON mr.medical_rooms_id = e.room_id
             WHERE e.encounters_id = $1`,
            [encounterId]
        );
        return result.rows[0] || null;
    }

    // CLINICAL EXAMINATION 
    static async getClinicalExamination(encounterId: string): Promise<ClinicalExamInfo | null> {
        const result = await pool.query(
            `SELECT ce.*, up.full_name AS recorder_name
             FROM clinical_examinations ce
             LEFT JOIN user_profiles up ON up.user_id = ce.recorded_by
             WHERE ce.encounter_id = $1`,
            [encounterId]
        );
        return result.rows[0] || null;
    }

    // DIAGNOSES
    static async getDiagnoses(encounterId: string): Promise<DiagnosisInfo[]> {
        const result = await pool.query(
            `SELECT ed.*, up.full_name AS diagnosed_by_name
             FROM encounter_diagnoses ed
             LEFT JOIN user_profiles up ON up.user_id = ed.diagnosed_by
             WHERE ed.encounter_id = $1
             ORDER BY CASE ed.diagnosis_type
                 WHEN 'PRIMARY' THEN 1 WHEN 'FINAL' THEN 2
                 WHEN 'SECONDARY' THEN 3 ELSE 4 END`,
            [encounterId]
        );
        return result.rows;
    }

    // MEDICAL ORDERS
    static async getMedicalOrders(encounterId: string): Promise<MedicalOrderInfo[]> {
        const result = await pool.query(
            `SELECT mo.medical_orders_id, mo.service_code, mo.service_name,
                    mo.clinical_indicator, mo.priority, mo.status, mo.ordered_at,
                    mor.result_summary, mor.result_details, mor.attachment_urls
             FROM medical_orders mo
             LEFT JOIN medical_order_results mor ON mor.order_id = mo.medical_orders_id
             WHERE mo.encounter_id = $1
             ORDER BY mo.ordered_at ASC`,
            [encounterId]
        );
        return result.rows;
    }

    //  PRESCRIPTION
    static async getPrescription(encounterId: string): Promise<PrescriptionInfo | null> {
        const headerResult = await pool.query(
            `SELECT prescriptions_id, prescription_code, status,
                    clinical_diagnosis, doctor_notes, prescribed_at
             FROM prescriptions WHERE encounter_id = $1`,
            [encounterId]
        );
        if (headerResult.rows.length === 0) return null;

        const presc = headerResult.rows[0];
        const detailsResult = await pool.query(
            `SELECT d.drug_code, d.brand_name, d.active_ingredients,
                    pd.quantity, pd.dosage, pd.frequency, pd.duration_days,
                    pd.usage_instruction, pd.route_of_administration, d.dispensing_unit
             FROM prescription_details pd
             JOIN drugs d ON d.drugs_id = pd.drug_id
             WHERE pd.prescription_id = $1 AND pd.is_active = TRUE
             ORDER BY pd.sort_order ASC`,
            [presc.prescriptions_id]
        );

        return { ...presc, details: detailsResult.rows };
    }

    //  SIGNATURE

    static async getSignature(encounterId: string): Promise<SignatureInfo | null> {
        const result = await pool.query(
            `SELECT es.*, up.full_name AS signer_name
             FROM emr_signatures es
             LEFT JOIN user_profiles up ON up.user_id = es.signed_by
             WHERE es.encounter_id = $1`,
            [encounterId]
        );
        return result.rows[0] || null;
    }

    /** Tạo ký số */
    static async createSignature(
        encounterId: string,
        userId: string,
        signatureHash: string,
        certificateSerial: string | null,
        clientIp: string | null,
        client: QueryExecutor = pool
    ): Promise<void> {
        const id = `SIG_${uuidv4().substring(0, 12)}`;
        await client.query(
            `INSERT INTO emr_signatures (emr_signatures_id, encounter_id, signed_by, signature_hash, certificate_serial, signed_at, client_ip)
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)`,
            [id, encounterId, userId, signatureHash, certificateSerial, clientIp]
        );
    }

    //  SNAPSHOT 

    static async getSnapshotMeta(encounterId: string): Promise<SnapshotMeta | null> {
        const result = await pool.query(
            `SELECT s.emr_record_snapshots_id, s.record_type, s.finalized_by,
                    up.full_name AS finalizer_name, s.finalized_at, s.notes
             FROM emr_record_snapshots s
             LEFT JOIN user_profiles up ON up.user_id = s.finalized_by
             WHERE s.encounter_id = $1`,
            [encounterId]
        );
        return result.rows[0] || null;
    }

    static async getSnapshotFull(encounterId: string): Promise<SnapshotFull | null> {
        const result = await pool.query(
            `SELECT s.*, up.full_name AS finalizer_name
             FROM emr_record_snapshots s
             LEFT JOIN user_profiles up ON up.user_id = s.finalized_by
             WHERE s.encounter_id = $1`,
            [encounterId]
        );
        return result.rows[0] || null;
    }

    /** Tạo snapshot khi finalize */
    static async createSnapshot(
        encounterId: string,
        patientId: string,
        recordType: string,
        snapshotData: any,
        userId: string,
        notes: string | null,
        client: QueryExecutor = pool
    ): Promise<void> {
        const id = generateSnapshotId();
        await client.query(
            `INSERT INTO emr_record_snapshots (emr_record_snapshots_id, encounter_id, patient_id, record_type, snapshot_data, finalized_by, finalized_at, notes)
             VALUES ($1, $2, $3, $4, $5::jsonb, $6, CURRENT_TIMESTAMP, $7)`,
            [id, encounterId, patientId, recordType, JSON.stringify(snapshotData), userId, notes]
        );
    }

    /** Đánh dấu encounter đã finalize */
    static async markFinalized(encounterId: string, client: QueryExecutor = pool): Promise<void> {
        await client.query(
            `UPDATE encounters SET is_finalized = TRUE, finalized_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE encounters_id = $1`,
            [encounterId]
        );
    }

    //  TIMELINE 

    /** Ghi timeline event */
    static async addTimelineEvent(
        patientId: string,
        eventDate: string,
        eventType: string,
        title: string,
        summary: string | null,
        referenceId: string | null,
        referenceTable: string | null,
        client: QueryExecutor = pool
    ): Promise<void> {
        const id = generateTimelineId();
        await client.query(
            `INSERT INTO health_timeline_events (health_timeline_events_id, patient_id, event_date, event_type, title, summary, reference_id, reference_table, source_system)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'INTERNAL_HIS')`,
            [id, patientId, eventDate, eventType, title, summary, referenceId, referenceTable]
        );
    }

    /**
     * Lấy dòng thời gian: UNION giữa health_timeline_events (đã ghi)
     * VÀ auto-generated events từ encounters, diagnoses, prescriptions, medical_orders.
     * Đảm bảo timeline luôn có data ngay cả khi chưa finalize.
     */
    static async getTimeline(
        patientId: string,
        fromDate?: string,
        toDate?: string,
        eventType?: string,
        limit: number = MEDICAL_RECORD_CONFIG.TIMELINE_DEFAULT_LIMIT
    ): Promise<TimelineEvent[]> {
        /** Outer filter áp dụng sau UNION ALL */
        const outerConditions: string[] = [];
        const values: any[] = [patientId]; // $1 = patientId dùng trong mỗi sub-query
        let paramIndex = 2;

        if (fromDate) {
            outerConditions.push(`event_date >= $${paramIndex++}`);
            values.push(fromDate);
        }
        if (toDate) {
            outerConditions.push(`event_date <= ($${paramIndex++}::date + INTERVAL '1 day')`);
            values.push(toDate);
        }
        if (eventType) {
            outerConditions.push(`event_type = $${paramIndex++}`);
            values.push(eventType);
        }

        const outerWhere = outerConditions.length > 0
            ? `WHERE ${outerConditions.join(' AND ')}`
            : '';

        values.push(limit);

        const query = `
            SELECT * FROM (
                -- 1. Events đã ghi trong bảng health_timeline_events
                SELECT
                    hte.health_timeline_events_id AS event_id,
                    hte.event_date,
                    hte.event_type,
                    hte.title,
                    hte.summary,
                    hte.reference_id,
                    hte.reference_table
                FROM health_timeline_events hte
                WHERE hte.patient_id = $1

                UNION ALL

                -- 2. Auto: Lượt khám (ENCOUNTER)
                SELECT
                    'AUTO_ENC_' || e.encounters_id AS event_id,
                    e.start_time AS event_date,
                    'ENCOUNTER' AS event_type,
                    'Lượt khám — ' || e.encounter_type AS title,
                    'BS: ' || COALESCE(up.full_name, 'N/A') || ' | Trạng thái: ' || e.status AS summary,
                    e.encounters_id AS reference_id,
                    'encounters' AS reference_table
                FROM encounters e
                LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
                LEFT JOIN user_profiles up ON up.user_id = d.user_id
                WHERE e.patient_id = $1

                UNION ALL

                -- 3. Auto: Chẩn đoán (DIAGNOSIS)
                SELECT
                    'AUTO_DX_' || ed.encounter_diagnoses_id AS event_id,
                    ed.created_at AS event_date,
                    'DIAGNOSIS' AS event_type,
                    'Chẩn đoán: ' || ed.diagnosis_name || ' (' || ed.icd10_code || ')' AS title,
                    'Loại: ' || ed.diagnosis_type AS summary,
                    ed.encounter_id AS reference_id,
                    'encounter_diagnoses' AS reference_table
                FROM encounter_diagnoses ed
                JOIN encounters e ON e.encounters_id = ed.encounter_id
                WHERE e.patient_id = $1

                UNION ALL

                -- 4. Auto: Đơn thuốc (PRESCRIPTION)
                SELECT
                    'AUTO_RX_' || pr.prescriptions_id AS event_id,
                    pr.prescribed_at AS event_date,
                    'PRESCRIPTION' AS event_type,
                    'Đơn thuốc: ' || pr.prescription_code || ' (' || pr.status || ')' AS title,
                    COALESCE(pr.clinical_diagnosis, '') AS summary,
                    pr.encounter_id AS reference_id,
                    'prescriptions' AS reference_table
                FROM prescriptions pr
                WHERE pr.patient_id = $1

                UNION ALL

                -- 5. Auto: Chỉ định CLS (LAB_ORDER)
                SELECT
                    'AUTO_MO_' || mo.medical_orders_id AS event_id,
                    mo.ordered_at AS event_date,
                    'LAB_ORDER' AS event_type,
                    'CLS: ' || mo.service_name AS title,
                    'Ưu tiên: ' || mo.priority || ' | Trạng thái: ' || mo.status AS summary,
                    mo.encounter_id AS reference_id,
                    'medical_orders' AS reference_table
                FROM medical_orders mo
                JOIN encounters e ON e.encounters_id = mo.encounter_id
                WHERE e.patient_id = $1

                UNION ALL

                -- 6. Auto: Kết quả CLS (LAB_RESULT)
                SELECT
                    'AUTO_MOR_' || mor.medical_order_results_id AS event_id,
                    mor.performed_at AS event_date,
                    'LAB_RESULT' AS event_type,
                    'Kết quả: ' || mo.service_name AS title,
                    COALESCE(mor.result_summary, '') AS summary,
                    mo.encounter_id AS reference_id,
                    'medical_order_results' AS reference_table
                FROM medical_order_results mor
                JOIN medical_orders mo ON mo.medical_orders_id = mor.order_id
                JOIN encounters e ON e.encounters_id = mo.encounter_id
                WHERE e.patient_id = $1 AND mor.performed_at IS NOT NULL
            ) AS timeline
            ${outerWhere}
            ORDER BY event_date DESC
            LIMIT $${paramIndex}
        `;

        const result = await pool.query(query, values);
        return result.rows;
    }

    //  DS BỆNH ÁN THEO BỆNH NHÂN 

    static async getPatientRecords(
        patientId: string,
        page: number,
        limit: number,
        recordType?: string,
        isFinalized?: boolean,
        fromDate?: string,
        toDate?: string
    ): Promise<{ data: PatientRecordItem[]; total: number }> {
        const conditions: string[] = ['e.patient_id = $1'];
        const values: any[] = [patientId];
        let paramIndex = 2;

        if (recordType) {
            conditions.push(`e.encounter_type = $${paramIndex++}`);
            values.push(recordType);
        }
        if (isFinalized !== undefined) {
            conditions.push(`COALESCE(e.is_finalized, FALSE) = $${paramIndex++}`);
            values.push(isFinalized);
        }
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
            `SELECT COUNT(*)::int AS total FROM encounters e WHERE ${whereClause}`,
            values
        );

        const dataValues = [...values, limit, offset];
        const dataResult = await pool.query(
            `SELECT e.encounters_id, e.encounter_type, e.start_time, e.end_time,
                    e.status, COALESCE(e.is_finalized, FALSE) AS is_finalized, e.finalized_at,
                    e.visit_number,
                    up.full_name AS doctor_name, d.title AS doctor_title,
                    sp.name AS specialty_name,
                    (SELECT ed.diagnosis_name FROM encounter_diagnoses ed
                     WHERE ed.encounter_id = e.encounters_id AND ed.diagnosis_type = 'PRIMARY' LIMIT 1) AS primary_diagnosis,
                    (SELECT ed.icd10_code FROM encounter_diagnoses ed
                     WHERE ed.encounter_id = e.encounters_id AND ed.diagnosis_type = 'PRIMARY' LIMIT 1) AS icd10_code,
                    EXISTS(SELECT 1 FROM emr_signatures es WHERE es.encounter_id = e.encounters_id) AS has_signature
             FROM encounters e
             LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
             LEFT JOIN user_profiles up ON up.user_id = d.user_id
             LEFT JOIN specialties sp ON sp.specialties_id = d.specialty_id
             WHERE ${whereClause}
             ORDER BY e.start_time DESC
             LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
            dataValues
        );

        return { data: dataResult.rows, total: countResult.rows[0].total };
    }

    //  THỐNG KÊ 

    /** Tổng encounters + finalized count */
    static async getEncounterCounts(patientId: string): Promise<{ total: number; finalized: number }> {
        const result = await pool.query(
            `SELECT COUNT(*)::int AS total,
                    COUNT(*) FILTER (WHERE COALESCE(is_finalized, FALSE) = TRUE)::int AS finalized
             FROM encounters WHERE patient_id = $1`,
            [patientId]
        );
        return result.rows[0];
    }

    /** Encounters theo loại */
    static async getEncountersByType(patientId: string): Promise<Record<string, number>> {
        const result = await pool.query(
            `SELECT encounter_type, COUNT(*)::int AS count
             FROM encounters WHERE patient_id = $1
             GROUP BY encounter_type`,
            [patientId]
        );
        const map: Record<string, number> = {};
        for (const row of result.rows) map[row.encounter_type] = row.count;
        return map;
    }

    /** Encounters theo năm */
    static async getEncountersByYear(patientId: string): Promise<Record<string, number>> {
        const result = await pool.query(
            `SELECT EXTRACT(YEAR FROM start_time)::int AS year, COUNT(*)::int AS count
             FROM encounters WHERE patient_id = $1
             GROUP BY year ORDER BY year DESC`,
            [patientId]
        );
        const map: Record<string, number> = {};
        for (const row of result.rows) map[String(row.year)] = row.count;
        return map;
    }

    /** Top chẩn đoán lặp lại nhiều nhất */
    static async getTopDiagnoses(patientId: string, limit: number): Promise<TopDiagnosisItem[]> {
        const result = await pool.query(
            `SELECT ed.icd10_code, ed.diagnosis_name, COUNT(*)::int AS count
             FROM encounter_diagnoses ed
             JOIN encounters e ON e.encounters_id = ed.encounter_id
             WHERE e.patient_id = $1
             GROUP BY ed.icd10_code, ed.diagnosis_name
             ORDER BY count DESC
             LIMIT $2`,
            [patientId, limit]
        );
        return result.rows;
    }

    /** Top thuốc được kê nhiều nhất */
    static async getTopDrugs(patientId: string, limit: number): Promise<TopDrugItem[]> {
        const result = await pool.query(
            `SELECT d.brand_name, d.drug_code, COUNT(*)::int AS count
             FROM prescription_details pd
             JOIN prescriptions p ON p.prescriptions_id = pd.prescription_id
             JOIN drugs d ON d.drugs_id = pd.drug_id
             WHERE p.patient_id = $1 AND pd.is_active = TRUE
             GROUP BY d.brand_name, d.drug_code
             ORDER BY count DESC
             LIMIT $2`,
            [patientId, limit]
        );
        return result.rows;
    }

    /** Xu hướng sinh hiệu theo thời gian */
    static async getVitalSignsTrend(patientId: string): Promise<VitalSignTrend[]> {
        const result = await pool.query(
            `SELECT e.start_time::date AS date,
                    ce.blood_pressure_systolic AS systolic,
                    ce.blood_pressure_diastolic AS diastolic,
                    ce.pulse, ce.weight
             FROM clinical_examinations ce
             JOIN encounters e ON e.encounters_id = ce.encounter_id
             WHERE e.patient_id = $1
             ORDER BY e.start_time ASC`,
            [patientId]
        );
        return result.rows;
    }

    /** Lần khám gần nhất (tóm tắt) */
    static async getLastEncounter(patientId: string): Promise<{ date: string; doctor_name: string | null; diagnosis: string | null } | null> {
        const result = await pool.query(
            `SELECT e.start_time AS date,
                    up.full_name AS doctor_name,
                    (SELECT ed.diagnosis_name FROM encounter_diagnoses ed
                     WHERE ed.encounter_id = e.encounters_id AND ed.diagnosis_type = 'PRIMARY' LIMIT 1) AS diagnosis
             FROM encounters e
             LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
             LEFT JOIN user_profiles up ON up.user_id = d.user_id
             WHERE e.patient_id = $1
             ORDER BY e.start_time DESC LIMIT 1`,
            [patientId]
        );
        return result.rows[0] || null;
    }

    //  TÌM KIẾM 

    static async searchRecords(
        keyword?: string,
        icd10Code?: string,
        doctorId?: string,
        recordType?: string,
        isFinalized?: boolean,
        fromDate?: string,
        toDate?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<{ data: SearchRecordItem[]; total: number }> {
        const conditions: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (keyword) {
            conditions.push(`(p.full_name ILIKE $${paramIndex} OR p.patient_code ILIKE $${paramIndex} OR e.encounters_id ILIKE $${paramIndex})`);
            values.push(`%${keyword}%`);
            paramIndex++;
        }
        if (icd10Code) {
            conditions.push(`EXISTS(SELECT 1 FROM encounter_diagnoses ed WHERE ed.encounter_id = e.encounters_id AND ed.icd10_code = $${paramIndex++})`);
            values.push(icd10Code);
        }
        if (doctorId) {
            conditions.push(`e.doctor_id = $${paramIndex++}`);
            values.push(doctorId);
        }
        if (recordType) {
            conditions.push(`e.encounter_type = $${paramIndex++}`);
            values.push(recordType);
        }
        if (isFinalized !== undefined) {
            conditions.push(`COALESCE(e.is_finalized, FALSE) = $${paramIndex++}`);
            values.push(isFinalized);
        }
        if (fromDate) {
            conditions.push(`e.start_time >= $${paramIndex++}`);
            values.push(fromDate);
        }
        if (toDate) {
            conditions.push(`e.start_time <= ($${paramIndex++}::date + INTERVAL '1 day')`);
            values.push(toDate);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const offset = (page - 1) * limit;

        const countResult = await pool.query(
            `SELECT COUNT(*)::int AS total
             FROM encounters e
             LEFT JOIN patients p ON p.id::text = e.patient_id
             ${whereClause}`,
            values
        );

        const dataValues = [...values, limit, offset];
        const dataResult = await pool.query(
            `SELECT e.encounters_id, e.encounter_type, e.start_time, e.end_time,
                    e.status, COALESCE(e.is_finalized, FALSE) AS is_finalized, e.finalized_at,
                    e.visit_number,
                    p.full_name AS patient_name, p.patient_code,
                    up.full_name AS doctor_name, d.title AS doctor_title,
                    sp.name AS specialty_name,
                    (SELECT ed.diagnosis_name FROM encounter_diagnoses ed
                     WHERE ed.encounter_id = e.encounters_id AND ed.diagnosis_type = 'PRIMARY' LIMIT 1) AS primary_diagnosis,
                    (SELECT ed.icd10_code FROM encounter_diagnoses ed
                     WHERE ed.encounter_id = e.encounters_id AND ed.diagnosis_type = 'PRIMARY' LIMIT 1) AS icd10_code,
                    EXISTS(SELECT 1 FROM emr_signatures es WHERE es.encounter_id = e.encounters_id) AS has_signature
             FROM encounters e
             LEFT JOIN patients p ON p.id::text = e.patient_id
             LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
             LEFT JOIN user_profiles up ON up.user_id = d.user_id
             LEFT JOIN specialties sp ON sp.specialties_id = d.specialty_id
             ${whereClause}
             ORDER BY e.start_time DESC
             LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
            dataValues
        );

        return { data: dataResult.rows, total: countResult.rows[0].total };
    }

    //  VALIDATION HELPERS 

    static async patientExists(patientId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM patients WHERE id::text = $1 AND deleted_at IS NULL) AS exists`,
            [patientId]
        );
        return result.rows[0].exists;
    }

    /**
     * Tạo SHA-256 hash từ snapshot data
     */
    static generateSignatureHash(snapshotData: any): string {
        return crypto.createHash('sha256').update(JSON.stringify(snapshotData)).digest('hex');
    }
}
