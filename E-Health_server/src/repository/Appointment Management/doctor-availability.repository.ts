import { pool } from '../../config/postgresdb';

export class DoctorAvailabilityRepository {

    /**
     * Kiểm tra doctor tồn tại và active, trả về user_id
     */
    static async getDoctorUserId(doctorId: string): Promise<string | null> {
        const query = `SELECT user_id FROM doctors WHERE doctors_id = $1 AND is_active = true`;
        const result = await pool.query(query, [doctorId]);
        return result.rows[0]?.user_id || null;
    }

    /**
     * Lấy lịch làm việc tổng hợp của 1 BS theo khoảng ngày
     */
    static async getDoctorSchedule(
        userId: string,
        startDate: string,
        endDate: string
    ): Promise<any[]> {
        const query = `
            SELECT
                s.staff_schedules_id,
                TO_CHAR(s.working_date, 'YYYY-MM-DD') AS working_date,
                s.start_time,
                s.end_time,
                s.is_leave,
                s.leave_reason,
                s.status AS schedule_status,
                sh.shifts_id AS shift_id,
                sh.code AS shift_code,
                sh.name AS shift_name,
                mr.medical_rooms_id AS room_id,
                mr.name AS room_name,
                d.doctors_id AS doctor_id,
                sp.name AS specialty_name,
                CASE
                    WHEN s.is_leave = true THEN 'ON_LEAVE'
                    WHEN s.status = 'SUSPENDED' THEN 'SUSPENDED'
                    ELSE 'WORKING'
                END AS availability_status
            FROM staff_schedules s
            JOIN shifts sh ON s.shift_id = sh.shifts_id
            LEFT JOIN medical_rooms mr ON s.medical_room_id = mr.medical_rooms_id
            LEFT JOIN doctors d ON s.user_id = d.user_id
            LEFT JOIN specialties sp ON d.specialty_id = sp.specialties_id
            WHERE s.user_id = $1
              AND s.working_date >= $2::date
              AND s.working_date <= $3::date
            ORDER BY s.working_date ASC, s.start_time ASC
        `;
        const result = await pool.query(query, [userId, startDate, endDate]);
        return result.rows;
    }

    /**
     * Kiểm tra leave APPROVED trùng ngày cho 1 user
     */
    static async hasApprovedLeave(userId: string, date: string): Promise<boolean> {
        const query = `
            SELECT 1 FROM leave_requests
            WHERE user_id = $1
              AND $2::date BETWEEN start_date AND end_date
              AND status = 'APPROVED'
              AND deleted_at IS NULL
            LIMIT 1
        `;
        const result = await pool.query(query, [userId, date]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Lấy tất cả lịch của 1 user trong ngày (để check overlap)
     */
    static async getSchedulesByUserAndDate(userId: string, date: string): Promise<any[]> {
        const query = `
            SELECT
                s.staff_schedules_id,
                s.start_time,
                s.end_time,
                s.status,
                sh.code AS shift_code,
                sh.name AS shift_name,
                mr.name AS room_name
            FROM staff_schedules s
            JOIN shifts sh ON s.shift_id = sh.shifts_id
            LEFT JOIN medical_rooms mr ON s.medical_room_id = mr.medical_rooms_id
            WHERE s.user_id = $1
              AND s.working_date = $2::date
              AND s.status = 'ACTIVE'
            ORDER BY s.start_time ASC
        `;
        const result = await pool.query(query, [userId, date]);
        return result.rows;
    }

    /**
     * Lấy thông tin ca (start_time, end_time) theo shift_id
     */
    static async getShiftTime(shiftId: string): Promise<{ start_time: string; end_time: string } | null> {
        const query = `SELECT start_time, end_time FROM shifts WHERE shifts_id = $1 AND status = 'ACTIVE'`;
        const result = await pool.query(query, [shiftId]);
        return result.rows[0] || null;
    }

    /**
     * Lấy tất cả BS active theo chuyên khoa, kèm lịch ngày đó
     */
    static async getDoctorsBySpecialtyAndDate(
        specialtyId: string,
        date: string,
        shiftId?: string
    ): Promise<any[]> {
        let query = `
            SELECT
                d.doctors_id,
                d.user_id,
                up.full_name AS doctor_name,
                d.title,
                sp.name AS specialty_name,
                CASE
                    WHEN lr.leave_requests_id IS NOT NULL THEN 'ON_LEAVE'
                    WHEN EXISTS (
                        SELECT 1 FROM doctor_absences da
                        WHERE da.doctor_id = d.doctors_id
                          AND da.absence_date = $2::date
                          AND da.deleted_at IS NULL
                          AND (da.shift_id IS NULL ${shiftId ? 'OR da.shift_id = $3' : ''})
                    ) THEN 'ABSENT'
                    WHEN ss.staff_schedules_id IS NOT NULL THEN 'BUSY'
                    ELSE 'AVAILABLE'
                END AS availability_status,
                ss.start_time AS schedule_start,
                ss.end_time AS schedule_end,
                ssh.name AS scheduled_shift_name,
                mr.name AS scheduled_room_name
            FROM doctors d
            JOIN user_profiles up ON d.user_id = up.user_id
            JOIN specialties sp ON d.specialty_id = sp.specialties_id
            LEFT JOIN leave_requests lr ON d.user_id = lr.user_id
                AND $2::date BETWEEN lr.start_date AND lr.end_date
                AND lr.status = 'APPROVED' AND lr.deleted_at IS NULL
            LEFT JOIN staff_schedules ss ON d.user_id = ss.user_id
                AND ss.working_date = $2::date AND ss.status = 'ACTIVE'
        `;

        const params: any[] = [specialtyId, date];

        if (shiftId) {
            query += ` AND ss.shift_id = $3`;
            params.push(shiftId);
        }

        query += `
            LEFT JOIN shifts ssh ON ss.shift_id = ssh.shifts_id
            LEFT JOIN medical_rooms mr ON ss.medical_room_id = mr.medical_rooms_id
            WHERE d.specialty_id = $1 AND d.is_active = true
            ORDER BY availability_status ASC, up.full_name ASC
        `;

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Tổng quan: tất cả BS đang làm việc/vắng trong 1 ngày
     */
    static async getDoctorOverviewByDate(date: string): Promise<any[]> {
        const query = `
            SELECT
                d.doctors_id,
                up.full_name AS doctor_name,
                d.title,
                sp.name AS specialty_name,
                TO_CHAR(ss.working_date, 'YYYY-MM-DD') AS working_date,
                ss.start_time,
                ss.end_time,
                ss.is_leave,
                ss.status AS schedule_status,
                sh.shifts_id AS shift_id,
                sh.code AS shift_code,
                sh.name AS shift_name,
                mr.name AS room_name,
                CASE
                    WHEN ss.is_leave = true THEN 'ON_LEAVE'
                    WHEN ss.status = 'SUSPENDED' THEN 'SUSPENDED'
                    ELSE 'WORKING'
                END AS availability_status
            FROM staff_schedules ss
            JOIN doctors d ON ss.user_id = d.user_id AND d.is_active = true
            JOIN user_profiles up ON d.user_id = up.user_id
            JOIN specialties sp ON d.specialty_id = sp.specialties_id
            JOIN shifts sh ON ss.shift_id = sh.shifts_id
            LEFT JOIN medical_rooms mr ON ss.medical_room_id = mr.medical_rooms_id
            WHERE ss.working_date = $1::date
            ORDER BY sh.start_time ASC, up.full_name ASC
        `;
        const result = await pool.query(query, [date]);
        return result.rows;
    }

    /**
     * Lịch BS ở tất cả cơ sở (đa cơ sở)
     */
    static async getDoctorMultiFacilitySchedule(
        userId: string,
        startDate: string,
        endDate: string
    ): Promise<any[]> {
        const query = `
            SELECT
                s.staff_schedules_id,
                TO_CHAR(s.working_date, 'YYYY-MM-DD') AS working_date,
                s.start_time,
                s.end_time,
                s.is_leave,
                s.status AS schedule_status,
                sh.name AS shift_name,
                sh.code AS shift_code,
                mr.name AS room_name,
                dept.name AS department_name,
                b.name AS branch_name,
                b.branches_id AS branch_id,
                f.name AS facility_name
            FROM staff_schedules s
            JOIN shifts sh ON s.shift_id = sh.shifts_id
            LEFT JOIN medical_rooms mr ON s.medical_room_id = mr.medical_rooms_id
            LEFT JOIN departments dept ON mr.department_id = dept.departments_id
            LEFT JOIN branches b ON dept.branch_id = b.branches_id
            LEFT JOIN facilities f ON b.facility_id = f.facilities_id
            WHERE s.user_id = $1
              AND s.working_date >= $2::date
              AND s.working_date <= $3::date
            ORDER BY b.name ASC, s.working_date ASC, s.start_time ASC
        `;
        const result = await pool.query(query, [userId, startDate, endDate]);
        return result.rows;
    }

    /**
     * Kiểm tra specialty tồn tại
     */
    static async isSpecialtyExists(specialtyId: string): Promise<boolean> {
        const query = `SELECT 1 FROM specialties WHERE specialties_id = $1 AND deleted_at IS NULL`;
        const result = await pool.query(query, [specialtyId]);
        return (result.rowCount ?? 0) > 0;
    }
}
