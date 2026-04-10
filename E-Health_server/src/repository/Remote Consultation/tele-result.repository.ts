import { pool } from '../../config/postgresdb';
import { TeleConsultationResult, ResultFilter } from '../../models/Remote Consultation/tele-result.model';
import { v4 as uuidv4 } from 'uuid';

/**
 * Data Access Layer cho kết quả khám từ xa
 */
export class TeleResultRepository {

    // ═══════════════════════════════════════════════════
    // CRUD
    // ═══════════════════════════════════════════════════

    static async createResult(data: Record<string, any>): Promise<TeleConsultationResult> {
        const r = await pool.query(`
            INSERT INTO tele_consultation_results (
                result_id, tele_consultation_id, encounter_id,
                chief_complaint, symptom_description, symptom_duration, symptom_severity,
                status, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
        `, [
            data.result_id, data.tele_consultation_id, data.encounter_id || null,
            data.chief_complaint || null, data.symptom_description || null,
            data.symptom_duration || null, data.symptom_severity || null,
            'DRAFT', data.created_by,
        ]);
        return r.rows[0];
    }

    static async findByConsultationId(consultationId: string): Promise<TeleConsultationResult | null> {
        const r = await pool.query(`
            SELECT tcr.*,
                up_doc.full_name AS doctor_name,
                up_pat.full_name AS patient_name,
                sp.name AS specialty_name,
                tct.name AS type_name
            FROM tele_consultation_results tcr
            LEFT JOIN tele_consultations tc ON tcr.tele_consultation_id = tc.tele_consultations_id
            LEFT JOIN encounters enc ON tcr.encounter_id = enc.encounters_id
            LEFT JOIN doctors doc ON enc.doctor_id = doc.doctors_id
            LEFT JOIN user_profiles up_doc ON doc.user_id = up_doc.user_id
            LEFT JOIN patients pat ON enc.patient_id = pat.id::varchar
            LEFT JOIN user_profiles up_pat ON pat.account_id = up_pat.user_id
            LEFT JOIN tele_booking_sessions tbs ON tc.booking_session_id = tbs.session_id
            LEFT JOIN specialties sp ON tbs.specialty_id = sp.specialties_id
            LEFT JOIN tele_consultation_types tct ON tc.consultation_type_id = tct.type_id
            WHERE tcr.tele_consultation_id = $1
        `, [consultationId]);
        return r.rows[0] || null;
    }

    static async updateResult(resultId: string, data: Record<string, any>): Promise<void> {
        const setClauses: string[] = [];
        const values: any[] = [];
        let idx = 1;
        for (const [key, val] of Object.entries(data)) {
            setClauses.push(`${key} = $${idx++}`);
            values.push(val);
        }
        setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(resultId);
        await pool.query(`UPDATE tele_consultation_results SET ${setClauses.join(', ')} WHERE result_id = $${idx}`, values);
    }

    // ═══════════════════════════════════════════════════
    // QUERIES
    // ═══════════════════════════════════════════════════

    /** DS kết quả (filter, phân trang) */
    static async findAll(filters: ResultFilter): Promise<{ data: TeleConsultationResult[]; total: number }> {
        let where = 'WHERE 1=1';
        const params: any[] = [];
        let idx = 1;

        if (filters.status) { where += ` AND tcr.status = $${idx++}`; params.push(filters.status); }
        if (filters.doctor_id) { where += ` AND enc.doctor_id = $${idx++}`; params.push(filters.doctor_id); }
        if (filters.keyword) {
            where += ` AND (tcr.medical_conclusion ILIKE $${idx} OR tcr.chief_complaint ILIKE $${idx} OR up_pat.full_name ILIKE $${idx})`;
            params.push(`%${filters.keyword}%`); idx++;
        }

        const countR = await pool.query(`
            SELECT COUNT(*)::int AS total
            FROM tele_consultation_results tcr
            LEFT JOIN encounters enc ON tcr.encounter_id = enc.encounters_id
            LEFT JOIN patients pat ON enc.patient_id = pat.id::varchar
            LEFT JOIN user_profiles up_pat ON pat.account_id = up_pat.user_id
            ${where}
        `, params);

        const offset = (filters.page - 1) * filters.limit;
        const r = await pool.query(`
            SELECT tcr.*,
                up_doc.full_name AS doctor_name,
                up_pat.full_name AS patient_name,
                tct.name AS type_name
            FROM tele_consultation_results tcr
            LEFT JOIN tele_consultations tc ON tcr.tele_consultation_id = tc.tele_consultations_id
            LEFT JOIN encounters enc ON tcr.encounter_id = enc.encounters_id
            LEFT JOIN doctors doc ON enc.doctor_id = doc.doctors_id
            LEFT JOIN user_profiles up_doc ON doc.user_id = up_doc.user_id
            LEFT JOIN patients pat ON enc.patient_id = pat.id::varchar
            LEFT JOIN user_profiles up_pat ON pat.account_id = up_pat.user_id
            LEFT JOIN tele_consultation_types tct ON tc.consultation_type_id = tct.type_id
            ${where}
            ORDER BY tcr.created_at DESC
            LIMIT $${idx++} OFFSET $${idx}
        `, [...params, filters.limit, offset]);

        return { data: r.rows, total: countR.rows[0].total };
    }

    /** Lịch sử kết quả BN */
    static async findByPatient(patientId: string, page: number, limit: number): Promise<{ data: TeleConsultationResult[]; total: number }> {
        const countR = await pool.query(`
            SELECT COUNT(*)::int AS total
            FROM tele_consultation_results tcr
            JOIN encounters enc ON tcr.encounter_id = enc.encounters_id
            WHERE enc.patient_id = $1
        `, [patientId]);

        const offset = (page - 1) * limit;
        const r = await pool.query(`
            SELECT tcr.*, up_doc.full_name AS doctor_name, tct.name AS type_name
            FROM tele_consultation_results tcr
            LEFT JOIN tele_consultations tc ON tcr.tele_consultation_id = tc.tele_consultations_id
            LEFT JOIN encounters enc ON tcr.encounter_id = enc.encounters_id
            LEFT JOIN doctors doc ON enc.doctor_id = doc.doctors_id
            LEFT JOIN user_profiles up_doc ON doc.user_id = up_doc.user_id
            LEFT JOIN tele_consultation_types tct ON tc.consultation_type_id = tct.type_id
            WHERE enc.patient_id = $1
            ORDER BY tcr.created_at DESC LIMIT $2 OFFSET $3
        `, [patientId, limit, offset]);

        return { data: r.rows, total: countR.rows[0].total };
    }

    /** DS chờ ký (COMPLETED, chưa signed) */
    static async findUnsigned(doctorUserId: string, page: number, limit: number): Promise<{ data: TeleConsultationResult[]; total: number }> {
        const countR = await pool.query(`
            SELECT COUNT(*)::int AS total
            FROM tele_consultation_results tcr
            JOIN encounters enc ON tcr.encounter_id = enc.encounters_id
            JOIN doctors doc ON enc.doctor_id = doc.doctors_id
            WHERE tcr.status = 'COMPLETED' AND tcr.is_signed = FALSE AND doc.user_id = $1
        `, [doctorUserId]);

        const offset = (page - 1) * limit;
        const r = await pool.query(`
            SELECT tcr.*, up_pat.full_name AS patient_name
            FROM tele_consultation_results tcr
            LEFT JOIN encounters enc ON tcr.encounter_id = enc.encounters_id
            LEFT JOIN patients pat ON enc.patient_id = pat.id::varchar
            LEFT JOIN user_profiles up_pat ON pat.account_id = up_pat.user_id
            LEFT JOIN doctors doc ON enc.doctor_id = doc.doctors_id
            WHERE tcr.status = 'COMPLETED' AND tcr.is_signed = FALSE AND doc.user_id = $1
            ORDER BY tcr.created_at ASC LIMIT $2 OFFSET $3
        `, [doctorUserId, limit, offset]);

        return { data: r.rows, total: countR.rows[0].total };
    }

    /** DS cần tái khám */
    static async findFollowUps(doctorUserId: string, page: number, limit: number): Promise<{ data: TeleConsultationResult[]; total: number }> {
        const countR = await pool.query(`
            SELECT COUNT(*)::int AS total
            FROM tele_consultation_results tcr
            JOIN encounters enc ON tcr.encounter_id = enc.encounters_id
            JOIN doctors doc ON enc.doctor_id = doc.doctors_id
            WHERE tcr.follow_up_needed = TRUE AND doc.user_id = $1
        `, [doctorUserId]);

        const offset = (page - 1) * limit;
        const r = await pool.query(`
            SELECT tcr.*, up_pat.full_name AS patient_name
            FROM tele_consultation_results tcr
            LEFT JOIN encounters enc ON tcr.encounter_id = enc.encounters_id
            LEFT JOIN patients pat ON enc.patient_id = pat.id::varchar
            LEFT JOIN user_profiles up_pat ON pat.account_id = up_pat.user_id
            LEFT JOIN doctors doc ON enc.doctor_id = doc.doctors_id
            WHERE tcr.follow_up_needed = TRUE AND doc.user_id = $1
            ORDER BY tcr.follow_up_date ASC NULLS LAST LIMIT $2 OFFSET $3
        `, [doctorUserId, limit, offset]);

        return { data: r.rows, total: countR.rows[0].total };
    }

    /** Lấy encounter diagnoses + prescriptions cho summary */
    static async getRelatedEMRData(encounterId: string): Promise<any> {
        const [diagnosesR, prescriptionsR, signaturesR] = await Promise.all([
            pool.query(`SELECT * FROM encounter_diagnoses WHERE encounter_id = $1 ORDER BY created_at`, [encounterId]),
            pool.query(`SELECT * FROM prescriptions WHERE encounter_id = $1 ORDER BY created_at`, [encounterId]),
            pool.query(`SELECT * FROM emr_signatures WHERE encounter_id = $1`, [encounterId]),
        ]);
        return {
            diagnoses: diagnosesR.rows,
            prescriptions: prescriptionsR.rows,
            emr_signature: signaturesR.rows[0] || null,
        };
    }

    /** Kiểm tra consultation tồn tại (lấy encounter_id) */
    static async getConsultation(consultationId: string): Promise<any> {
        const r = await pool.query(`SELECT * FROM tele_consultations WHERE tele_consultations_id = $1`, [consultationId]);
        return r.rows[0] || null;
    }

    /** Cập nhật tele_consultations has_result / result_status */
    static async updateConsultationResultFlag(consultationId: string, hasResult: boolean, resultStatus: string): Promise<void> {
        await pool.query(`UPDATE tele_consultations SET has_result = $1, result_status = $2 WHERE tele_consultations_id = $3`, [hasResult, resultStatus, consultationId]);
    }
}
