import crypto from 'crypto';
import { pool } from '../../config/postgresdb';
import { DoctorAbsence } from '../../models/Appointment Management/doctor-absence.model';

/**
 * Sinh ID duy nhất: ABS_xxxxxxxx
 */
const generateAbsenceId = (): string =>
    `ABS_${crypto.randomBytes(4).toString('hex')}`;

/**
 * Repository quản lý lịch vắng đột xuất bác sĩ.
 */
export class DoctorAbsenceRepository {

    /**
     * Kiểm tra doctor tồn tại và active, trả về user_id
     */
    static async getDoctorUserId(doctorId: string): Promise<string | null> {
        const query = `SELECT user_id FROM doctors WHERE doctors_id = $1 AND is_active = true`;
        const result = await pool.query(query, [doctorId]);
        return result.rows[0]?.user_id || null;
    }

    /**
     * Kiểm tra shift tồn tại
     */
    static async isShiftExists(shiftId: string): Promise<boolean> {
        const query = `SELECT 1 FROM shifts WHERE shifts_id = $1 AND status = 'ACTIVE' AND deleted_at IS NULL`;
        const result = await pool.query(query, [shiftId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Tạo bản ghi vắng đột xuất
     */
    static async create(
        doctorId: string,
        absenceDate: string,
        shiftId: string | null,
        absenceType: string,
        reason: string | null,
        createdBy: string | null
    ): Promise<DoctorAbsence | null> {
        const id = generateAbsenceId();
        const query = `
            INSERT INTO doctor_absences (absence_id, doctor_id, absence_date, shift_id, absence_type, reason, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const result = await pool.query(query, [id, doctorId, absenceDate, shiftId, absenceType, reason, createdBy]);
        return result.rows[0] || null;
    }

    /**
     * Lấy danh sách vắng đột xuất (filter)
     */
    static async findAll(filters: {
        doctor_id?: string;
        start_date?: string;
        end_date?: string;
        absence_type?: string;
    }): Promise<DoctorAbsence[]> {
        const conditions: string[] = ['da.deleted_at IS NULL'];
        const params: any[] = [];
        let idx = 1;

        if (filters.doctor_id) {
            conditions.push(`da.doctor_id = $${idx++}`);
            params.push(filters.doctor_id);
        }
        if (filters.start_date) {
            conditions.push(`da.absence_date >= $${idx++}::date`);
            params.push(filters.start_date);
        }
        if (filters.end_date) {
            conditions.push(`da.absence_date <= $${idx++}::date`);
            params.push(filters.end_date);
        }
        if (filters.absence_type) {
            conditions.push(`da.absence_type = $${idx++}`);
            params.push(filters.absence_type);
        }

        const query = `
            SELECT
                da.absence_id,
                da.doctor_id,
                TO_CHAR(da.absence_date, 'YYYY-MM-DD') AS absence_date,
                da.shift_id,
                da.absence_type,
                da.reason,
                da.created_by,
                da.created_at,
                up.full_name AS doctor_name,
                sp.name AS specialty_name,
                sh.name AS shift_name,
                creator_up.full_name AS created_by_name
            FROM doctor_absences da
            JOIN doctors d ON da.doctor_id = d.doctors_id
            JOIN user_profiles up ON d.user_id = up.user_id
            LEFT JOIN specialties sp ON d.specialty_id = sp.specialties_id
            LEFT JOIN shifts sh ON da.shift_id = sh.shifts_id
            LEFT JOIN users creator ON da.created_by = creator.users_id
            LEFT JOIN user_profiles creator_up ON creator.users_id = creator_up.user_id
            WHERE ${conditions.join(' AND ')}
            ORDER BY da.absence_date DESC, da.created_at DESC
        `;
        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Tìm bản ghi absence theo ID (chưa bị xoá)
     */
    static async findById(absenceId: string): Promise<DoctorAbsence | null> {
        const query = `SELECT * FROM doctor_absences WHERE absence_id = $1 AND deleted_at IS NULL`;
        const result = await pool.query(query, [absenceId]);
        return result.rows[0] || null;
    }

    /**
     * Soft delete
     */
    static async softDelete(absenceId: string): Promise<boolean> {
        const query = `
            UPDATE doctor_absences SET deleted_at = CURRENT_TIMESTAMP
            WHERE absence_id = $1 AND deleted_at IS NULL
            RETURNING absence_id
        `;
        const result = await pool.query(query, [absenceId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Đếm lịch khám bị ảnh hưởng bởi vắng đột xuất
     * Logic: appointments PENDING/CONFIRMED + doctor_id match + ngày + ca
     */
    static async getAffectedAppointments(
        doctorId: string,
        absenceDate: string,
        shiftId?: string
    ): Promise<{ count: number; appointments: any[] }> {
        let shiftCondition = '';
        const params: any[] = [doctorId, absenceDate];

        if (shiftId) {
            shiftCondition = 'AND asl.shift_id = $3';
            params.push(shiftId);
        }

        const query = `
            SELECT
                a.appointments_id,
                a.appointment_date,
                a.status,
                pt.full_name AS patient_name,
                asl.start_time,
                asl.end_time,
                sh.name AS shift_name
            FROM appointments a
            JOIN appointment_slots asl ON a.slot_id = asl.slot_id
            JOIN shifts sh ON asl.shift_id = sh.shifts_id
            LEFT JOIN patients pt ON a.patient_id = pt.id::varchar
            WHERE a.doctor_id = $1
              AND a.appointment_date = $2::date
              AND a.status IN ('PENDING', 'CONFIRMED')
              ${shiftCondition}
            ORDER BY asl.start_time ASC
        `;
        const result = await pool.query(query, params);
        return {
            count: result.rows.length,
            appointments: result.rows,
        };
    }

    /**
     * Đánh dấu staff_schedules.is_leave = true cho BS vào ngày/ca vắng
     */
    static async markSchedulesAsAbsent(
        userId: string,
        absenceDate: string,
        shiftId: string | null,
        reason: string | null
    ): Promise<number> {
        let shiftCondition = '';
        const params: any[] = [reason || 'Vắng đột xuất', userId, absenceDate];

        if (shiftId) {
            shiftCondition = 'AND shift_id = $4';
            params.push(shiftId);
        }

        const query = `
            UPDATE staff_schedules
            SET is_leave = true, leave_reason = $1
            WHERE user_id = $2
              AND working_date = $3::date
              AND status = 'ACTIVE'
              ${shiftCondition}
        `;
        const result = await pool.query(query, params);
        return result.rowCount ?? 0;
    }

    /**
     * Revert staff_schedules.is_leave = false khi huỷ vắng
     */
    static async revertSchedulesFromAbsent(
        userId: string,
        absenceDate: string,
        shiftId: string | null
    ): Promise<number> {
        let shiftCondition = '';
        const params: any[] = [userId, absenceDate];

        if (shiftId) {
            shiftCondition = 'AND shift_id = $3';
            params.push(shiftId);
        }

        const query = `
            UPDATE staff_schedules
            SET is_leave = false, leave_reason = NULL
            WHERE user_id = $1
              AND working_date = $2::date
              AND is_leave = true
              ${shiftCondition}
        `;
        const result = await pool.query(query, params);
        return result.rowCount ?? 0;
    }
}
