import { pool } from '../../config/postgresdb';
import {
    EncounterListItem,
    EncounterDetail,
    ClinicalExamination,
    Diagnosis,
    PrescriptionSummary,
    MedicalOrderItem,
    TimelineEvent,
    PatientMedicalSummary,
    PaginatedEncounters
} from '../../models/Patient Management/medical-history.model';

export class MedicalHistoryRepository {
    /**
     * Lấy danh sách lượt khám có phân trang, filter
     */
    static async getEncounters(
        patientId?: string,
        doctorId?: string,
        encounterType?: string,
        status?: string,
        from?: string,
        to?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedEncounters> {
        let whereClause = 'WHERE 1=1';
        const params: any[] = [];
        let paramIndex = 1;

        if (patientId) {
            whereClause += ` AND e.patient_id = $${paramIndex++}`;
            params.push(patientId);
        }
        if (doctorId) {
            whereClause += ` AND e.doctor_id = $${paramIndex++}`;
            params.push(doctorId);
        }
        if (encounterType) {
            whereClause += ` AND e.encounter_type = $${paramIndex++}`;
            params.push(encounterType);
        }
        if (status) {
            whereClause += ` AND e.status = $${paramIndex++}`;
            params.push(status);
        }
        if (from) {
            whereClause += ` AND e.start_time >= $${paramIndex++}`;
            params.push(from);
        }
        if (to) {
            whereClause += ` AND e.start_time <= $${paramIndex++}`;
            params.push(to);
        }

        // Count
        const countQuery = `SELECT COUNT(*) FROM encounters e ${whereClause}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Data
        const offset = (page - 1) * limit;
        const dataQuery = `
            SELECT
                e.encounters_id, e.appointment_id, e.patient_id, e.doctor_id,
                e.room_id, e.encounter_type, e.start_time, e.end_time,
                e.status, e.created_at,
                up.full_name AS doctor_name,
                d.title AS doctor_title,
                s.name AS specialty_name,
                mr.name AS room_name, mr.code AS room_code,
                p.patient_code,
                p.full_name AS patient_name,
                ce.chief_complaint,
                (SELECT ed.diagnosis_name FROM encounter_diagnoses ed
                 WHERE ed.encounter_id = e.encounters_id AND ed.diagnosis_type = 'PRIMARY'
                 LIMIT 1) AS primary_diagnosis
            FROM encounters e
            LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
            LEFT JOIN user_profiles up ON up.user_id = d.user_id
            LEFT JOIN specialties s ON s.specialties_id = d.specialty_id
            LEFT JOIN medical_rooms mr ON mr.medical_rooms_id = e.room_id
            LEFT JOIN patients p ON p.id::VARCHAR = e.patient_id
            LEFT JOIN clinical_examinations ce ON ce.encounter_id = e.encounters_id
            ${whereClause}
            ORDER BY e.start_time DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;
        params.push(limit, offset);
        const dataResult = await pool.query(dataQuery, params);

        return {
            data: dataResult.rows as EncounterListItem[],
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Lấy thông tin cơ bản của encounter (dùng nội bộ để kiểm tra tồn tại)
     */
    static async getEncounterBasic(encounterId: string): Promise<EncounterListItem | null> {
        const query = `
            SELECT
                e.encounters_id, e.appointment_id, e.patient_id, e.doctor_id,
                e.room_id, e.encounter_type, e.start_time, e.end_time,
                e.status, e.created_at,
                up.full_name AS doctor_name,
                d.title AS doctor_title,
                s.name AS specialty_name,
                mr.name AS room_name, mr.code AS room_code,
                p.patient_code,
                p.full_name AS patient_name
            FROM encounters e
            LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
            LEFT JOIN user_profiles up ON up.user_id = d.user_id
            LEFT JOIN specialties s ON s.specialties_id = d.specialty_id
            LEFT JOIN medical_rooms mr ON mr.medical_rooms_id = e.room_id
            LEFT JOIN patients p ON p.id::VARCHAR = e.patient_id
            WHERE e.encounters_id = $1
        `;
        const result = await pool.query(query, [encounterId]);
        return result.rows[0] || null;
    }

    /**
     * Lấy sinh hiệu & khám lâm sàng của encounter
     */
    static async getClinicalExamination(encounterId: string): Promise<ClinicalExamination | null> {
        const query = `
            SELECT ce.*,
                   up.full_name AS recorder_name
            FROM clinical_examinations ce
            LEFT JOIN user_profiles up ON up.user_id = ce.recorded_by
            WHERE ce.encounter_id = $1
        `;
        const result = await pool.query(query, [encounterId]);
        return result.rows[0] || null;
    }

    /**
     * Lấy danh sách chẩn đoán của encounter
     */
    static async getDiagnoses(encounterId: string): Promise<Diagnosis[]> {
        const query = `
            SELECT ed.*,
                   up.full_name AS diagnosed_by_name
            FROM encounter_diagnoses ed
            LEFT JOIN user_profiles up ON up.user_id = ed.diagnosed_by
            WHERE ed.encounter_id = $1
            ORDER BY
                CASE ed.diagnosis_type
                    WHEN 'PRIMARY' THEN 1
                    WHEN 'FINAL' THEN 2
                    WHEN 'SECONDARY' THEN 3
                    WHEN 'PRELIMINARY' THEN 4
                END
        `;
        const result = await pool.query(query, [encounterId]);
        return result.rows;
    }

    /**
     * Lấy đơn thuốc + chi tiết thuốc của encounter
     */
    static async getPrescription(encounterId: string): Promise<PrescriptionSummary | null> {
        const headerQuery = `
            SELECT prescriptions_id, prescription_code, status,
                   clinical_diagnosis, doctor_notes, prescribed_at
            FROM prescriptions
            WHERE encounter_id = $1
        `;
        const headerResult = await pool.query(headerQuery, [encounterId]);
        if (headerResult.rows.length === 0) return null;

        const prescription = headerResult.rows[0];

        const detailsQuery = `
            SELECT dr.brand_name AS drug_name,
                   pd.quantity, pd.dosage, pd.frequency,
                   pd.duration_days, pd.usage_instruction
            FROM prescription_details pd
            JOIN drugs dr ON dr.drugs_id = pd.drug_id
            WHERE pd.prescription_id = $1
        `;
        const detailsResult = await pool.query(detailsQuery, [prescription.prescriptions_id]);

        return {
            ...prescription,
            details: detailsResult.rows,
        };
    }

    /**
     * Lấy danh sách chỉ định CLS của encounter
     */
    static async getMedicalOrders(encounterId: string): Promise<MedicalOrderItem[]> {
        const query = `
            SELECT mo.medical_orders_id, mo.service_code, mo.service_name,
                   mo.clinical_indicator, mo.priority, mo.status, mo.ordered_at,
                   mor.result_summary
            FROM medical_orders mo
            LEFT JOIN medical_order_results mor ON mor.order_id = mo.medical_orders_id
            WHERE mo.encounter_id = $1
            ORDER BY mo.ordered_at DESC
        `;
        const result = await pool.query(query, [encounterId]);
        return result.rows;
    }

    /**
     * Lấy lần khám gần nhất của bệnh nhân
     */
    static async getLatestEncounter(patientId: string): Promise<EncounterListItem | null> {
        const query = `
            SELECT
                e.encounters_id, e.appointment_id, e.patient_id, e.doctor_id,
                e.room_id, e.encounter_type, e.start_time, e.end_time,
                e.status, e.created_at,
                up.full_name AS doctor_name,
                d.title AS doctor_title,
                s.name AS specialty_name,
                mr.name AS room_name, mr.code AS room_code,
                p.patient_code,
                p.full_name AS patient_name,
                ce.chief_complaint,
                (SELECT ed.diagnosis_name FROM encounter_diagnoses ed
                 WHERE ed.encounter_id = e.encounters_id AND ed.diagnosis_type = 'PRIMARY'
                 LIMIT 1) AS primary_diagnosis
            FROM encounters e
            LEFT JOIN doctors d ON d.doctors_id = e.doctor_id
            LEFT JOIN user_profiles up ON up.user_id = d.user_id
            LEFT JOIN specialties s ON s.specialties_id = d.specialty_id
            LEFT JOIN medical_rooms mr ON mr.medical_rooms_id = e.room_id
            LEFT JOIN patients p ON p.id::VARCHAR = e.patient_id
            LEFT JOIN clinical_examinations ce ON ce.encounter_id = e.encounters_id
            WHERE e.patient_id = $1
            ORDER BY e.start_time DESC
            LIMIT 1
        `;
        const result = await pool.query(query, [patientId]);
        return result.rows[0] || null;
    }

    /**
     * Lấy dòng thời gian sức khỏe của bệnh nhân
     */
    static async getTimeline(
        patientId: string,
        from?: string,
        to?: string,
        limit: number = 50
    ): Promise<TimelineEvent[]> {
        let whereClause = 'WHERE hte.patient_id = $1';
        const params: any[] = [patientId];
        let paramIndex = 2;

        if (from) {
            whereClause += ` AND hte.event_date >= $${paramIndex++}`;
            params.push(from);
        }
        if (to) {
            whereClause += ` AND hte.event_date <= $${paramIndex++}`;
            params.push(to);
        }

        const query = `
            SELECT hte.*
            FROM health_timeline_events hte
            ${whereClause}
            ORDER BY hte.event_date DESC
            LIMIT $${paramIndex}
        `;
        params.push(limit);
        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Lấy tổng hợp lịch sử bệnh nhân
     */
    static async getPatientSummary(patientId: string): Promise<PatientMedicalSummary> {
        const query = `
            SELECT
                COUNT(e.encounters_id) AS total_encounters,
                MAX(e.start_time) AS last_encounter_date,
                (SELECT e2.encounter_type FROM encounters e2 WHERE e2.patient_id = $1 ORDER BY e2.start_time DESC LIMIT 1) AS last_encounter_type,
                (SELECT up.full_name FROM encounters e3
                    JOIN doctors d ON d.doctors_id = e3.doctor_id
                    JOIN user_profiles up ON up.user_id = d.user_id
                    WHERE e3.patient_id = $1 ORDER BY e3.start_time DESC LIMIT 1
                ) AS last_doctor_name,
                (SELECT ed.diagnosis_name FROM encounters e4
                    JOIN encounter_diagnoses ed ON ed.encounter_id = e4.encounters_id AND ed.diagnosis_type = 'PRIMARY'
                    WHERE e4.patient_id = $1 ORDER BY e4.start_time DESC LIMIT 1
                ) AS last_primary_diagnosis,
                (SELECT pr.prescription_code FROM encounters e5
                    JOIN prescriptions pr ON pr.encounter_id = e5.encounters_id
                    WHERE e5.patient_id = $1 ORDER BY e5.start_time DESC LIMIT 1
                ) AS last_prescription_code
            FROM encounters e
            WHERE e.patient_id = $1
        `;
        const result = await pool.query(query, [patientId]);
        const row = result.rows[0];

        return {
            total_encounters: parseInt(row.total_encounters) || 0,
            last_encounter_date: row.last_encounter_date || null,
            last_encounter_type: row.last_encounter_type || null,
            last_doctor_name: row.last_doctor_name || null,
            last_primary_diagnosis: row.last_primary_diagnosis || null,
            last_prescription_code: row.last_prescription_code || null,
        };
    }

    /**
     * Kiểm tra bệnh nhân tồn tại trong bảng patients gốc (patients_id VARCHAR)
     */
    static async checkPatientExists(patientId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT 1 FROM patients WHERE id = $1`, [patientId]
        );
        return result.rows.length > 0;
    }
}
