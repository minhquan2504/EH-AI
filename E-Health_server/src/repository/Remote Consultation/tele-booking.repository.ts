import { pool } from '../../config/postgresdb';
import { TeleBookingSession, BookingFilter } from '../../models/Remote Consultation/tele-booking.model';
import { TELE_BOOKING_STATUS } from '../../constants/remote-consultation.constant';
import { ACTIVE_APPOINTMENT_STATUSES } from '../../constants/appointment.constant';
import { v4 as uuidv4 } from 'uuid';

/**
 * Data Access Layer cho tele_booking_sessions
 * và các truy vấn liên quan đến đặt lịch khám từ xa
 */
export class TeleBookingRepository {

    static generateId(): string {
        return `TBS_${uuidv4().substring(0, 12)}`;
    }

    static generateCode(): string {
        const now = new Date();
        const yy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const rand = uuidv4().substring(0, 4).toUpperCase();
        return `TBS-${yy}${mm}${dd}-${rand}`;
    }

    // ═══════════════════════════════════════════════════
    // TÌM BS & SLOT KHẢ DỤNG
    // ═══════════════════════════════════════════════════

    /**
     * Lấy danh sách BS khả dụng theo CK + ngày + cơ sở
     * Lọc: is_active, có staff_schedules, chưa nghỉ phép, chưa vắng mặt
     */
    static async findAvailableDoctors(
        specialtyId: string, date: string, facilityId: string, shiftId?: string
    ): Promise<any[]> {
        const params: any[] = [specialtyId, date, facilityId];
        let shiftFilter = '';
        if (shiftId) {
            shiftFilter = ` AND ss.shift_id = $4`;
            params.push(shiftId);
        }

        const query = `
            SELECT DISTINCT
                d.doctors_id,
                d.user_id,
                up.full_name AS doctor_name,
                d.title,
                sp.name AS specialty_name,
                ss.start_time AS schedule_start,
                ss.end_time AS schedule_end,
                sh.shifts_id AS shift_id,
                sh.code AS shift_code,
                sh.name AS shift_name,
                -- Đếm số appointment active trong ngày
                COALESCE(apt_count.cnt, 0)::int AS current_load,
                CASE
                    WHEN lr.leave_requests_id IS NOT NULL THEN 'ON_LEAVE'
                    WHEN da.doctor_absence_id IS NOT NULL THEN 'ABSENT'
                    ELSE 'AVAILABLE'
                END AS availability_status
            FROM doctors d
            JOIN user_profiles up ON d.user_id = up.user_id
            JOIN specialties sp ON d.specialty_id = sp.specialties_id
            -- Phải có lịch làm việc
            JOIN staff_schedules ss ON d.user_id = ss.user_id
                AND ss.working_date = $2::date
                AND ss.status = 'ACTIVE'
                AND ss.is_leave = false
            JOIN shifts sh ON ss.shift_id = sh.shifts_id
            -- Kiểm tra nghỉ phép
            LEFT JOIN leave_requests lr ON d.user_id = lr.user_id
                AND $2::date BETWEEN lr.start_date AND lr.end_date
                AND lr.status = 'APPROVED' AND lr.deleted_at IS NULL
            -- Kiểm tra vắng mặt
            LEFT JOIN doctor_absences da ON d.doctors_id = da.doctor_id
                AND da.absence_date = $2::date
                AND da.deleted_at IS NULL
            -- Đếm tải hiện tại
            LEFT JOIN (
                SELECT doctor_id, COUNT(*)::int AS cnt
                FROM appointments
                WHERE appointment_date = $2::date
                  AND status IN ('PENDING','CONFIRMED','CHECKED_IN','IN_PROGRESS')
                GROUP BY doctor_id
            ) apt_count ON apt_count.doctor_id = d.doctors_id
            WHERE d.specialty_id = $1
              AND d.is_active = true
              AND lr.leave_requests_id IS NULL
              AND da.doctor_absence_id IS NULL
              ${shiftFilter}
            ORDER BY apt_count.cnt ASC NULLS FIRST, up.full_name ASC
        `;
        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Lấy danh sách khung giờ trống cho BS + ngày
     */
    static async findAvailableSlots(
        date: string, doctorId?: string, shiftId?: string
    ): Promise<any[]> {
        const statusPlaceholders = ACTIVE_APPOINTMENT_STATUSES.map((_, i) => `$${i + 2}`).join(', ');
        const params: any[] = [date, ...ACTIVE_APPOINTMENT_STATUSES];
        let idx = params.length + 1;

        let doctorFilter = '';
        if (doctorId) {
            doctorFilter = `
                AND s.shifts_id IN (
                    SELECT ss.shift_id FROM staff_schedules ss
                    JOIN doctors doc ON ss.user_id = doc.user_id
                    WHERE doc.doctors_id = $${idx++}
                      AND ss.working_date = $1::date
                      AND ss.is_leave = false AND ss.status = 'ACTIVE'
                )
            `;
            params.push(doctorId);
        }

        let shiftFilter = '';
        if (shiftId) {
            shiftFilter = ` AND s.shifts_id = $${idx++}`;
            params.push(shiftId);
        }

        const query = `
            SELECT
                sl.slot_id,
                sl.start_time::text,
                sl.end_time::text,
                s.shifts_id AS shift_id,
                s.code AS shift_code,
                s.name AS shift_name,
                COALESCE(booked.cnt, 0)::int AS booked_count
            FROM appointment_slots sl
            JOIN shifts s ON sl.shift_id = s.shifts_id
            LEFT JOIN (
                SELECT slot_id, COUNT(*)::int AS cnt
                FROM appointments
                WHERE appointment_date = $1::date
                  AND status IN (${statusPlaceholders})
                GROUP BY slot_id
            ) booked ON booked.slot_id = sl.slot_id
            LEFT JOIN locked_slots ls ON ls.slot_id = sl.slot_id
                AND ls.locked_date = $1::date AND ls.deleted_at IS NULL
            WHERE sl.is_active = true
              AND s.status = 'ACTIVE' AND s.deleted_at IS NULL
              AND ls.locked_slot_id IS NULL
              ${doctorFilter}
              ${shiftFilter}
            ORDER BY sl.start_time ASC
        `;
        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Kiểm tra chi tiết availability của 1 BS cụ thể vào 1 ngày
     */
    static async checkDoctorAvailability(
        doctorId: string, date: string
    ): Promise<{
        doctor: any;
        schedules: any[];
        has_leave: boolean;
        absences: any[];
        current_load: number;
    } | null> {
        // Kiểm tra BS tồn tại
        const docResult = await pool.query(`
            SELECT d.doctors_id, d.user_id, up.full_name, d.title,
                   sp.name AS specialty_name, sp.specialties_id AS specialty_id
            FROM doctors d
            JOIN user_profiles up ON d.user_id = up.user_id
            JOIN specialties sp ON d.specialty_id = sp.specialties_id
            WHERE d.doctors_id = $1 AND d.is_active = true
        `, [doctorId]);
        if (!docResult.rows[0]) return null;

        // Lịch làm việc
        const schedResult = await pool.query(`
            SELECT ss.staff_schedules_id, ss.start_time, ss.end_time,
                   sh.shifts_id AS shift_id, sh.code AS shift_code, sh.name AS shift_name,
                   mr.name AS room_name
            FROM staff_schedules ss
            JOIN shifts sh ON ss.shift_id = sh.shifts_id
            LEFT JOIN medical_rooms mr ON ss.medical_room_id = mr.medical_rooms_id
            WHERE ss.user_id = $1 AND ss.working_date = $2::date
              AND ss.status = 'ACTIVE' AND ss.is_leave = false
            ORDER BY ss.start_time ASC
        `, [docResult.rows[0].user_id, date]);

        // Nghỉ phép
        const leaveResult = await pool.query(`
            SELECT 1 FROM leave_requests
            WHERE user_id = $1 AND $2::date BETWEEN start_date AND end_date
              AND status = 'APPROVED' AND deleted_at IS NULL
            LIMIT 1
        `, [docResult.rows[0].user_id, date]);

        // Vắng mặt
        const absResult = await pool.query(`
            SELECT da.doctor_absence_id, da.absence_date::text, da.reason,
                   sh.name AS shift_name
            FROM doctor_absences da
            LEFT JOIN shifts sh ON da.shift_id = sh.shifts_id
            WHERE da.doctor_id = $1 AND da.absence_date = $2::date AND da.deleted_at IS NULL
        `, [doctorId, date]);

        // Tải hiện tại
        const loadResult = await pool.query(`
            SELECT COUNT(*)::int AS cnt FROM appointments
            WHERE doctor_id = $1 AND appointment_date = $2::date
              AND status IN ('PENDING','CONFIRMED','CHECKED_IN','IN_PROGRESS')
        `, [doctorId, date]);

        return {
            doctor: docResult.rows[0],
            schedules: schedResult.rows,
            has_leave: (leaveResult.rowCount ?? 0) > 0,
            absences: absResult.rows,
            current_load: loadResult.rows[0].cnt,
        };
    }

    // ═══════════════════════════════════════════════════
    // CRUD PHIÊN ĐẶT LỊCH
    // ═══════════════════════════════════════════════════

    /**
     * Tạo phiên đặt lịch mới
     */
    static async create(data: {
        session_id: string;
        session_code: string;
        patient_id: string;
        specialty_id: string;
        facility_id: string;
        type_id: string;
        config_id?: string;
        doctor_id?: string;
        booking_date: string;
        slot_id?: string;
        shift_id?: string;
        booking_start_time?: string;
        booking_end_time?: string;
        duration_minutes: number;
        platform: string;
        price_amount: number;
        price_type: string;
        payment_required: boolean;
        reason_for_visit?: string;
        symptoms_notes?: string;
        patient_notes?: string;
        status: string;
        payment_status: string;
        expires_at?: Date;
        created_by?: string;
    }): Promise<TeleBookingSession> {
        const query = `
            INSERT INTO tele_booking_sessions (
                session_id, session_code, patient_id, specialty_id, facility_id,
                type_id, config_id, doctor_id, booking_date, slot_id, shift_id,
                booking_start_time, booking_end_time, duration_minutes, platform,
                price_amount, price_type, payment_required, reason_for_visit,
                symptoms_notes, patient_notes, status, payment_status, expires_at, created_by
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
                $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
                $22, $23, $24, $25
            )
            RETURNING *,
                TO_CHAR(booking_date, 'YYYY-MM-DD') AS booking_date
        `;
        const values = [
            data.session_id, data.session_code, data.patient_id, data.specialty_id,
            data.facility_id, data.type_id, data.config_id || null, data.doctor_id || null,
            data.booking_date, data.slot_id || null, data.shift_id || null,
            data.booking_start_time || null, data.booking_end_time || null,
            data.duration_minutes, data.platform, data.price_amount, data.price_type,
            data.payment_required, data.reason_for_visit || null,
            data.symptoms_notes || null, data.patient_notes || null,
            data.status, data.payment_status, data.expires_at || null, data.created_by || null,
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Cập nhật phiên đặt lịch
     */
    static async update(sessionId: string, data: Record<string, any>): Promise<TeleBookingSession | null> {
        const setClauses: string[] = [];
        const values: any[] = [];
        let idx = 1;

        const allowedFields = [
            'doctor_id', 'booking_date', 'slot_id', 'shift_id',
            'booking_start_time', 'booking_end_time', 'reason_for_visit',
            'symptoms_notes', 'patient_notes', 'platform', 'price_type',
            'price_amount', 'duration_minutes', 'config_id',
            'status', 'payment_status', 'payment_required',
            'appointment_id', 'tele_consultation_id', 'invoice_id',
            'confirmed_at', 'confirmed_by', 'cancelled_at', 'cancelled_by',
            'cancellation_reason', 'expires_at',
        ];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                setClauses.push(`${field} = $${idx++}`);
                values.push(data[field]);
            }
        }

        if (setClauses.length === 0) return null;
        setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

        const query = `
            UPDATE tele_booking_sessions SET ${setClauses.join(', ')}
            WHERE session_id = $${idx}
            RETURNING *, TO_CHAR(booking_date, 'YYYY-MM-DD') AS booking_date
        `;
        values.push(sessionId);
        const result = await pool.query(query, values);
        return result.rows[0] || null;
    }

    /**
     * Lấy chi tiết phiên với JOIN
     */
    static async findById(sessionId: string): Promise<TeleBookingSession | null> {
        const query = `
            SELECT tbs.*,
                TO_CHAR(tbs.booking_date, 'YYYY-MM-DD') AS booking_date,
                p.full_name AS patient_name,
                sp.name AS specialty_name,
                f.name AS facility_name,
                tct.code AS type_code,
                tct.name AS type_name,
                up.full_name AS doctor_name,
                d.title AS doctor_title,
                sl.start_time::text AS slot_start_time,
                sl.end_time::text AS slot_end_time,
                sh.name AS shift_name,
                apt.appointment_code,
                creator.full_name AS created_by_name
            FROM tele_booking_sessions tbs
            LEFT JOIN patients p ON tbs.patient_id = p.id::varchar
            LEFT JOIN specialties sp ON tbs.specialty_id = sp.specialties_id
            LEFT JOIN facilities f ON tbs.facility_id = f.facilities_id
            LEFT JOIN tele_consultation_types tct ON tbs.type_id = tct.type_id
            LEFT JOIN doctors d ON tbs.doctor_id = d.doctors_id
            LEFT JOIN user_profiles up ON d.user_id = up.user_id
            LEFT JOIN appointment_slots sl ON tbs.slot_id = sl.slot_id
            LEFT JOIN shifts sh ON tbs.shift_id = sh.shifts_id
            LEFT JOIN appointments apt ON tbs.appointment_id = apt.appointments_id
            LEFT JOIN user_profiles creator ON tbs.created_by = creator.user_id
            WHERE tbs.session_id = $1
        `;
        const result = await pool.query(query, [sessionId]);
        return result.rows[0] || null;
    }

    /**
     * Danh sách phiên (phân trang + filter)
     */
    static async findAll(filters: BookingFilter): Promise<{ data: TeleBookingSession[]; total: number }> {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const offset = (page - 1) * limit;

        let where = ' WHERE 1=1 ';
        const values: any[] = [];
        let idx = 1;

        if (filters.patient_id) { where += ` AND tbs.patient_id = $${idx++}`; values.push(filters.patient_id); }
        if (filters.doctor_id) { where += ` AND tbs.doctor_id = $${idx++}`; values.push(filters.doctor_id); }
        if (filters.specialty_id) { where += ` AND tbs.specialty_id = $${idx++}`; values.push(filters.specialty_id); }
        if (filters.facility_id) { where += ` AND tbs.facility_id = $${idx++}`; values.push(filters.facility_id); }
        if (filters.type_id) { where += ` AND tbs.type_id = $${idx++}`; values.push(filters.type_id); }
        if (filters.status) { where += ` AND tbs.status = $${idx++}`; values.push(filters.status); }
        if (filters.payment_status) { where += ` AND tbs.payment_status = $${idx++}`; values.push(filters.payment_status); }
        if (filters.from_date) { where += ` AND tbs.booking_date >= $${idx++}::date`; values.push(filters.from_date); }
        if (filters.to_date) { where += ` AND tbs.booking_date <= $${idx++}::date`; values.push(filters.to_date); }
        if (filters.keyword) {
            where += ` AND (tbs.session_code ILIKE $${idx} OR p.full_name ILIKE $${idx} OR up.full_name ILIKE $${idx})`;
            values.push(`%${filters.keyword}%`);
            idx++;
        }

        // Count
        const countQuery = `
            SELECT COUNT(*)::int AS total
            FROM tele_booking_sessions tbs
            LEFT JOIN patients p ON tbs.patient_id = p.id::varchar
            LEFT JOIN doctors d ON tbs.doctor_id = d.doctors_id
            LEFT JOIN user_profiles up ON d.user_id = up.user_id
            ${where}
        `;
        const countResult = await pool.query(countQuery, values);
        const total = countResult.rows[0].total;

        // Data
        const dataQuery = `
            SELECT tbs.*,
                TO_CHAR(tbs.booking_date, 'YYYY-MM-DD') AS booking_date,
                p.full_name AS patient_name,
                sp.name AS specialty_name,
                f.name AS facility_name,
                tct.code AS type_code,
                tct.name AS type_name,
                up.full_name AS doctor_name,
                d.title AS doctor_title,
                apt.appointment_code
            FROM tele_booking_sessions tbs
            LEFT JOIN patients p ON tbs.patient_id = p.id::varchar
            LEFT JOIN specialties sp ON tbs.specialty_id = sp.specialties_id
            LEFT JOIN facilities f ON tbs.facility_id = f.facilities_id
            LEFT JOIN tele_consultation_types tct ON tbs.type_id = tct.type_id
            LEFT JOIN doctors d ON tbs.doctor_id = d.doctors_id
            LEFT JOIN user_profiles up ON d.user_id = up.user_id
            LEFT JOIN appointments apt ON tbs.appointment_id = apt.appointments_id
            ${where}
            ORDER BY tbs.created_at DESC
            LIMIT $${idx++} OFFSET $${idx++}
        `;
        values.push(limit, offset);
        const dataResult = await pool.query(dataQuery, values);
        return { data: dataResult.rows, total };
    }

    // ═══════════════════════════════════════════════════
    // VALIDATION HELPERS
    // ═══════════════════════════════════════════════════

    static async patientExists(patientId: string): Promise<boolean> {
        const r = await pool.query('SELECT id FROM patients WHERE id::varchar = $1 AND deleted_at IS NULL', [patientId]);
        return (r.rowCount ?? 0) > 0;
    }

    static async specialtyExists(specialtyId: string): Promise<boolean> {
        const r = await pool.query('SELECT specialties_id FROM specialties WHERE specialties_id = $1 AND deleted_at IS NULL', [specialtyId]);
        return (r.rowCount ?? 0) > 0;
    }

    static async facilityExists(facilityId: string): Promise<boolean> {
        const r = await pool.query('SELECT facilities_id FROM facilities WHERE facilities_id = $1', [facilityId]);
        return (r.rowCount ?? 0) > 0;
    }

    static async doctorExists(doctorId: string): Promise<boolean> {
        const r = await pool.query('SELECT doctors_id FROM doctors WHERE doctors_id = $1 AND is_active = true', [doctorId]);
        return (r.rowCount ?? 0) > 0;
    }

    static async typeExists(typeId: string): Promise<boolean> {
        const r = await pool.query('SELECT type_id FROM tele_consultation_types WHERE type_id = $1 AND is_active = true AND deleted_at IS NULL', [typeId]);
        return (r.rowCount ?? 0) > 0;
    }

    /**
     * Lấy config (giá, thời lượng, platform) cho type + specialty + facility
     */
    static async getConfig(typeId: string, specialtyId: string, facilityId: string): Promise<any | null> {
        const r = await pool.query(`
            SELECT * FROM tele_type_specialty_config
            WHERE type_id = $1 AND specialty_id = $2 AND facility_id = $3
              AND is_enabled = true AND is_active = true AND deleted_at IS NULL
        `, [typeId, specialtyId, facilityId]);
        return r.rows[0] || null;
    }

    /**
     * Kiểm tra BS có lịch làm việc vào ngày + ca
     */
    static async isDoctorScheduled(doctorId: string, date: string, shiftId?: string): Promise<boolean> {
        let query = `
            SELECT 1 FROM staff_schedules ss
            JOIN doctors d ON ss.user_id = d.user_id
            WHERE d.doctors_id = $1
              AND ss.working_date = $2::date
              AND ss.is_leave = false AND ss.status = 'ACTIVE'
        `;
        const params: any[] = [doctorId, date];
        if (shiftId) {
            query += ` AND ss.shift_id = $3`;
            params.push(shiftId);
        }
        query += ' LIMIT 1';
        const r = await pool.query(query, params);
        return (r.rowCount ?? 0) > 0;
    }

    /**
     * Kiểm tra BS có nghỉ phép vào ngày
     */
    static async isDoctorOnLeave(doctorId: string, date: string): Promise<boolean> {
        const r = await pool.query(`
            SELECT 1 FROM leave_requests lr
            JOIN doctors d ON lr.user_id = d.user_id
            WHERE d.doctors_id = $1 AND $2::date BETWEEN lr.start_date AND lr.end_date
              AND lr.status = 'APPROVED' AND lr.deleted_at IS NULL
            LIMIT 1
        `, [doctorId, date]);
        return (r.rowCount ?? 0) > 0;
    }

    /**
     * Kiểm tra trùng phiên booking (BN + ngày + slot chưa hủy)
     */
    static async findPatientBookingConflict(
        patientId: string, date: string, slotId: string, excludeSessionId?: string
    ): Promise<any | null> {
        let query = `
            SELECT session_id, session_code FROM tele_booking_sessions
            WHERE patient_id = $1 AND booking_date = $2::date AND slot_id = $3
              AND status NOT IN ('CANCELLED','EXPIRED')
        `;
        const params: any[] = [patientId, date, slotId];
        if (excludeSessionId) {
            query += ` AND session_id != $4`;
            params.push(excludeSessionId);
        }
        query += ' LIMIT 1';
        const r = await pool.query(query, params);
        return r.rows[0] || null;
    }

    /**
     * Lấy phiên hết hạn (PENDING_PAYMENT + quá expires_at)
     */
    static async findExpiredSessions(): Promise<TeleBookingSession[]> {
        const r = await pool.query(`
            SELECT * FROM tele_booking_sessions
            WHERE status = $1 AND expires_at < CURRENT_TIMESTAMP
        `, [TELE_BOOKING_STATUS.PENDING_PAYMENT]);
        return r.rows;
    }

    /**
     * Batch expire các phiên quá hạn
     */
    static async expireSessions(sessionIds: string[]): Promise<number> {
        if (sessionIds.length === 0) return 0;
        const placeholders = sessionIds.map((_, i) => `$${i + 2}`).join(', ');
        const r = await pool.query(`
            UPDATE tele_booking_sessions
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE session_id IN (${placeholders})
        `, [TELE_BOOKING_STATUS.EXPIRED, ...sessionIds]);
        return r.rowCount ?? 0;
    }
}
