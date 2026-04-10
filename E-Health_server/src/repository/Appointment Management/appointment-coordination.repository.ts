// src/repository/Appointment Management/appointment-coordination.repository.ts
import { pool } from '../../config/postgresdb';
import { CreateCoordinationLogInput } from '../../models/Appointment Management/appointment-coordination.model';
import { ACTIVE_APPOINTMENT_STATUSES } from '../../constants/appointment.constant';
import { PoolClient } from 'pg';


export class AppointmentCoordinationRepository {


    /** Tạo placeholder IN cho ACTIVE_APPOINTMENT_STATUSES bắt đầu từ startIdx */
    private static buildStatusPlaceholders(startIdx: number): { placeholders: string; values: string[] } {
        const placeholders = ACTIVE_APPOINTMENT_STATUSES.map((_, i) => `$${startIdx + i}`).join(', ');
        return { placeholders, values: [...ACTIVE_APPOINTMENT_STATUSES] };
    }

    /**
     * Phân tích tải bác sĩ theo ngày.
     */
    static async getDoctorLoadByDate(date: string, branchId?: string, specialtyId?: string): Promise<any[]> {
        const { placeholders: statusPH, values: statusVals } = this.buildStatusPlaceholders(2);
        const params: any[] = [date, ...statusVals];
        let paramIdx = params.length + 1;

        const conditions: string[] = [];
        if (branchId) {
            conditions.push(`ss.medical_room_id IN (
                SELECT mr2.medical_rooms_id FROM medical_rooms mr2
                JOIN departments dept2 ON mr2.department_id = dept2.departments_id
                WHERE dept2.branch_id = $${paramIdx++}
            )`);
            params.push(branchId);
        }
        if (specialtyId) {
            conditions.push(`d.specialty_id = $${paramIdx++}`);
            params.push(specialtyId);
        }
        const extraWhere = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

        const query = `
            SELECT
                d.doctors_id AS doctor_id,
                up.full_name AS doctor_name,
                sp.name AS specialty_name,
                sh.name AS shift_name,
                sh.shifts_id AS shift_id,
                ss.start_time AS shift_start,
                ss.end_time AS shift_end,
                mr.name AS room_name,
                -- Đếm số slot thuộc ca này
                (SELECT COUNT(*)::int FROM appointment_slots sl
                 WHERE sl.shift_id = sh.shifts_id AND sl.is_active = true) AS total_slots,
                -- Đếm số lịch khám active của BS này trong ngày
                COALESCE((
                    SELECT COUNT(*)::int FROM appointments apt
                    WHERE apt.doctor_id = d.doctors_id
                      AND apt.appointment_date = $1::date
                      AND apt.status IN (${statusPH})
                ), 0) AS booked_count
            FROM staff_schedules ss
            JOIN doctors d ON ss.user_id = d.user_id AND d.is_active = true
            JOIN user_profiles up ON d.user_id = up.user_id
            JOIN specialties sp ON d.specialty_id = sp.specialties_id
            JOIN shifts sh ON ss.shift_id = sh.shifts_id
            LEFT JOIN medical_rooms mr ON ss.medical_room_id = mr.medical_rooms_id
            WHERE ss.working_date = $1::date
              AND ss.is_leave = false
              AND ss.status = 'ACTIVE'
              ${extraWhere}
            ORDER BY booked_count ASC, up.full_name ASC;
        `;
        const result = await pool.query(query, params);
        return result.rows;
    }


    /**
     * Lấy slot trống cho gợi ý, CHỈ những slot thuộc ca có BS thực sự đang làm việc ngày đó (subquery staff_schedules).
     */
    static async getSlotsWithLoadInfo(date: string, doctorId?: string, specialtyId?: string, branchId?: string): Promise<any[]> {
        const { placeholders: statusPH, values: statusVals } = this.buildStatusPlaceholders(2);
        const params: any[] = [date, ...statusVals];
        let paramIdx = params.length + 1;

        let doctorFilter = '';
        if (doctorId) {
            doctorFilter = `
                AND sh.shifts_id IN (
                    SELECT ss2.shift_id FROM staff_schedules ss2
                    JOIN doctors dr ON ss2.user_id = dr.user_id
                    WHERE dr.doctors_id = $${paramIdx++}
                      AND ss2.working_date = $1::date
                      AND ss2.is_leave = false AND ss2.status = 'ACTIVE'
                )
            `;
            params.push(doctorId);
        }

        let specialtyFilter = '';
        if (specialtyId) {
            specialtyFilter = `
                AND sh.shifts_id IN (
                    SELECT ss3.shift_id FROM staff_schedules ss3
                    JOIN doctors dr2 ON ss3.user_id = dr2.user_id
                    WHERE dr2.specialty_id = $${paramIdx++}
                      AND dr2.is_active = true
                      AND ss3.working_date = $1::date
                      AND ss3.is_leave = false AND ss3.status = 'ACTIVE'
                )
            `;
            params.push(specialtyId);
        }

        const query = `
            SELECT
                sl.slot_id,
                sl.start_time,
                sl.end_time,
                sh.shifts_id AS shift_id,
                sh.name AS shift_name,
                COALESCE(booked.cnt, 0)::int AS booked_count
            FROM appointment_slots sl
            JOIN shifts sh ON sl.shift_id = sh.shifts_id
            LEFT JOIN (
                SELECT slot_id, COUNT(*)::int AS cnt
                FROM appointments
                WHERE appointment_date = $1::date
                  AND status IN (${statusPH})
                GROUP BY slot_id
            ) booked ON booked.slot_id = sl.slot_id
            LEFT JOIN locked_slots ls
                ON ls.slot_id = sl.slot_id
                AND ls.locked_date = $1::date
                AND ls.deleted_at IS NULL
            WHERE sl.is_active = true
              AND sh.status = 'ACTIVE'
              AND sh.deleted_at IS NULL
              AND ls.locked_slot_id IS NULL
              -- CHỈ lấy slot ở ca có ít nhất 1 BS làm việc ngày đó
              AND sh.shifts_id IN (
                  SELECT ss_check.shift_id FROM staff_schedules ss_check
                  JOIN doctors d_check ON ss_check.user_id = d_check.user_id AND d_check.is_active = true
                  WHERE ss_check.working_date = $1::date
                    AND ss_check.is_leave = false AND ss_check.status = 'ACTIVE'
              )
              ${doctorFilter}
              ${specialtyFilter}
              ${branchId ? `AND sh.shifts_id IN (
                  SELECT ss_br.shift_id FROM staff_schedules ss_br
                  WHERE ss_br.working_date = $1::date
                    AND ss_br.is_leave = false AND ss_br.status = 'ACTIVE'
                    AND ss_br.medical_room_id IN (
                        SELECT medical_rooms_id FROM medical_rooms WHERE branch_id = $${paramIdx++}
                    )
              )` : ''}
            ORDER BY sl.start_time ASC;
        `;
        if (branchId) params.push(branchId);
        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Lấy BS ít tải nhất đang làm ở ca/ngày cụ thể
     */
    static async getLeastLoadedDoctorForShift(date: string, shiftId: string, specialtyId?: string): Promise<any | null> {
        const { placeholders: statusPH, values: statusVals } = this.buildStatusPlaceholders(3);
        const params: any[] = [date, shiftId, ...statusVals];
        let paramIdx = params.length + 1;

        let specialtyFilter = '';
        if (specialtyId) {
            specialtyFilter = `AND d.specialty_id = $${paramIdx++}`;
            params.push(specialtyId);
        }

        const query = `
            SELECT
                d.doctors_id AS doctor_id,
                up.full_name AS doctor_name,
                sp.name AS specialty_name,
                COALESCE((
                    SELECT COUNT(*)::int FROM appointments apt
                    WHERE apt.doctor_id = d.doctors_id
                      AND apt.appointment_date = $1::date
                      AND apt.status IN (${statusPH})
                ), 0) AS current_load
            FROM staff_schedules ss
            JOIN doctors d ON ss.user_id = d.user_id AND d.is_active = true
            JOIN user_profiles up ON d.user_id = up.user_id
            JOIN specialties sp ON d.specialty_id = sp.specialties_id
            WHERE ss.working_date = $1::date
              AND ss.shift_id = $2
              AND ss.is_leave = false
              AND ss.status = 'ACTIVE'
              ${specialtyFilter}
            ORDER BY current_load ASC
            LIMIT 1;
        `;
        const result = await pool.query(query, params);
        return result.rows[0] || null;
    }

    /**
     * Tìm BS ít tải nhất đang trực ca + chi nhánh cụ thể (queue-based booking)
     */
    static async getLeastLoadedDoctorForShiftAtBranch(
        date: string, shiftId: string, branchId: string, specialtyId?: string
    ): Promise<{ doctor_id: string; doctor_name: string; specialty_name: string; current_load: number } | null> {
        const { placeholders: statusPH, values: statusVals } = this.buildStatusPlaceholders(4);
        const params: any[] = [date, shiftId, branchId, ...statusVals];

        let specialtyFilter = '';
        if (specialtyId) {
            params.push(specialtyId);
            specialtyFilter = `AND d.specialty_id = $${params.length}`;
        }

        const query = `
            SELECT
                d.doctors_id AS doctor_id,
                up.full_name AS doctor_name,
                sp.name AS specialty_name,
                COALESCE((
                    SELECT COUNT(*)::int FROM appointments apt
                    WHERE apt.doctor_id = d.doctors_id
                      AND apt.appointment_date = $1::date
                      AND apt.status IN (${statusPH})
                ), 0) AS current_load
            FROM staff_schedules ss
            JOIN doctors d ON ss.user_id = d.user_id AND d.is_active = true
            JOIN user_profiles up ON d.user_id = up.user_id
            JOIN specialties sp ON d.specialty_id = sp.specialties_id
            WHERE ss.working_date = $1::date
              AND ss.shift_id = $2
              AND ss.is_leave = false
              AND ss.status = 'ACTIVE'
              AND ss.medical_room_id IN (
                  SELECT medical_rooms_id FROM medical_rooms WHERE branch_id = $3
              )
              ${specialtyFilter}
            ORDER BY current_load ASC
            LIMIT 1;
        `;
        const result = await pool.query(query, params);
        return result.rows[0] || null;
    }
    /**
     * Lấy tất cả BS khả dụng cho 1 ca trong ngày (dùng cho auto-assign)
     */
    static async getAvailableDoctorsForShift(date: string, shiftId: string, specialtyId?: string): Promise<any[]> {
        const { placeholders: statusPH, values: statusVals } = this.buildStatusPlaceholders(3);
        const params: any[] = [date, shiftId, ...statusVals];
        let paramIdx = params.length + 1;

        let specialtyFilter = '';
        if (specialtyId) {
            specialtyFilter = `AND d.specialty_id = $${paramIdx++}`;
            params.push(specialtyId);
        }

        const query = `
            SELECT
                d.doctors_id AS doctor_id,
                up.full_name AS doctor_name,
                sp.name AS specialty_name,
                COALESCE((
                    SELECT COUNT(*)::int FROM appointments apt
                    WHERE apt.doctor_id = d.doctors_id
                      AND apt.appointment_date = $1::date
                      AND apt.status IN (${statusPH})
                ), 0) AS current_load
            FROM staff_schedules ss
            JOIN doctors d ON ss.user_id = d.user_id AND d.is_active = true
            JOIN user_profiles up ON d.user_id = up.user_id
            JOIN specialties sp ON d.specialty_id = sp.specialties_id
            WHERE ss.working_date = $1::date
              AND ss.shift_id = $2
              AND ss.is_leave = false
              AND ss.status = 'ACTIVE'
              ${specialtyFilter}
            ORDER BY current_load ASC;
        `;
        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Lấy danh sách appointments chưa gán BS trong ngày
     */
    static async getUnassignedAppointments(date: string, specialtyId?: string, branchId?: string): Promise<any[]> {
        const { placeholders: statusPH, values: statusVals } = this.buildStatusPlaceholders(2);
        const params: any[] = [date, ...statusVals];
        let paramIdx = params.length + 1;

        const conditions: string[] = [];
        if (specialtyId) {
            conditions.push(`a.facility_service_id IN (
                SELECT fs.facility_services_id FROM facility_services fs
                JOIN services s ON fs.service_id = s.services_id
                JOIN specialty_services sps ON sps.service_id = s.services_id
                WHERE sps.specialty_id = $${paramIdx++}
            )`);
            params.push(specialtyId);
        }
        if (branchId) {
            conditions.push(`a.branch_id = $${paramIdx++}`);
            params.push(branchId);
        }
        const extraWhere = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

        const query = `
            SELECT
                a.appointments_id,
                a.appointment_code,
                a.patient_id,
                a.slot_id,
                a.room_id,
                a.priority,
                TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
                sl.start_time AS slot_start_time,
                sl.end_time AS slot_end_time,
                sl.shift_id,
                p.full_name AS patient_name
            FROM appointments a
            LEFT JOIN appointment_slots sl ON a.slot_id = sl.slot_id
            LEFT JOIN patients p ON a.patient_id = p.id::varchar
            WHERE a.appointment_date = $1::date
              AND a.doctor_id IS NULL
              AND a.status IN (${statusPH})
              ${extraWhere}
            ORDER BY
                CASE a.priority
                    WHEN 'EMERGENCY' THEN 1
                    WHEN 'URGENT' THEN 2
                    ELSE 3
                END ASC,
                sl.start_time ASC;
        `;
        const result = await pool.query(query, params);
        return result.rows;
    }


    /** Update doctor_id cho appointment */
    static async updateAppointmentDoctor(appointmentId: string, newDoctorId: string): Promise<boolean> {
        const result = await pool.query(
            `UPDATE appointments SET doctor_id = $1, updated_at = CURRENT_TIMESTAMP WHERE appointments_id = $2`,
            [newDoctorId, appointmentId]
        );
        return (result.rowCount ?? 0) > 0;
    }

    /** Update priority cho appointment */
    static async updateAppointmentPriority(appointmentId: string, priority: string): Promise<boolean> {
        const result = await pool.query(
            `UPDATE appointments SET priority = $1, updated_at = CURRENT_TIMESTAMP WHERE appointments_id = $2`,
            [priority, appointmentId]
        );
        return (result.rowCount ?? 0) > 0;
    }


    /** Ghi log điều phối */
    static async createCoordinationLog(input: CreateCoordinationLogInput, client?: PoolClient): Promise<void> {
        const query = `
            INSERT INTO appointment_coordination_logs
            (id, appointment_id, action_type, old_value, new_value, reason, performed_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7);
        `;
        const params = [
            input.id, input.appointment_id, input.action_type,
            input.old_value || null, input.new_value || null,
            input.reason || null, input.performed_by || null,
        ];
        if (client) {
            await client.query(query, params);
        } else {
            await pool.query(query, params);
        }
    }


    /** Lấy account_id từ patient_id để gửi notification */
    static async getAccountIdByPatientId(patientId: string): Promise<string | null> {
        const result = await pool.query(
            `SELECT a.accounts_id FROM accounts a JOIN patients p ON a.accounts_id = p.account_id WHERE p.id::varchar = $1`,
            [patientId]
        );
        return result.rows[0]?.accounts_id || null;
    }


    /**
     * Xuất dữ liệu lịch sử cho AI/ML, đã round số phút đợi
     */
    static async getAIDataset(fromDate: string, toDate: string, branchId?: string): Promise<{
        records: any[];
        aggregations: any;
    }> {
        const params: any[] = [fromDate, toDate];
        let paramIdx = 3;
        let branchFilter = '';
        if (branchId) {
            branchFilter = `AND a.room_id IN (
                SELECT mr2.medical_rooms_id FROM medical_rooms mr2
                JOIN departments dept2 ON mr2.department_id = dept2.departments_id
                WHERE dept2.branch_id = $${paramIdx++}
            )`;
            params.push(branchId);
        }

        const recordsQuery = `
            SELECT
                a.appointments_id,
                a.appointment_code,
                TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
                a.status,
                a.priority,
                a.booking_channel,
                a.reschedule_count,
                sl.start_time AS slot_start_time,
                sl.end_time AS slot_end_time,
                sh.name AS shift_name,
                d.doctors_id AS doctor_id,
                sp.name AS specialty_name,
                a.created_at,
                a.confirmed_at,
                a.checked_in_at,
                a.cancelled_at,
                a.completed_at,
                ROUND(EXTRACT(EPOCH FROM (a.confirmed_at - a.created_at)) / 60, 2) AS confirm_wait_minutes,
                ROUND(EXTRACT(EPOCH FROM (a.checked_in_at - a.confirmed_at)) / 60, 2) AS checkin_wait_minutes
            FROM appointments a
            LEFT JOIN appointment_slots sl ON a.slot_id = sl.slot_id
            LEFT JOIN shifts sh ON sl.shift_id = sh.shifts_id
            LEFT JOIN doctors d ON a.doctor_id = d.doctors_id
            LEFT JOIN specialties sp ON d.specialty_id = sp.specialties_id
            WHERE a.appointment_date >= $1::date
              AND a.appointment_date <= $2::date
              ${branchFilter}
            ORDER BY a.appointment_date ASC, sl.start_time ASC;
        `;
        const recordsResult = await pool.query(recordsQuery, params);

        // Aggregations
        const aggParams: any[] = [fromDate, toDate];
        let aggIdx = 3;
        let aggBranchFilter = '';
        if (branchId) {
            aggBranchFilter = `AND a.room_id IN (
                SELECT mr2.medical_rooms_id FROM medical_rooms mr2
                JOIN departments dept2 ON mr2.department_id = dept2.departments_id
                WHERE dept2.branch_id = $${aggIdx++}
            )`;
            aggParams.push(branchId);
        }

        const aggQuery = `
            SELECT
                EXTRACT(HOUR FROM sl.start_time)::int AS hour,
                COUNT(*)::int AS appointment_count,
                COUNT(*) FILTER (WHERE a.status = 'CANCELLED')::int AS cancel_count,
                COUNT(*) FILTER (WHERE a.status = 'NO_SHOW')::int AS no_show_count,
                COUNT(*) FILTER (WHERE a.status = 'COMPLETED')::int AS completed_count
            FROM appointments a
            LEFT JOIN appointment_slots sl ON a.slot_id = sl.slot_id
            WHERE a.appointment_date >= $1::date
              AND a.appointment_date <= $2::date
              AND sl.start_time IS NOT NULL
              ${aggBranchFilter}
            GROUP BY EXTRACT(HOUR FROM sl.start_time)
            ORDER BY hour ASC;
        `;
        const aggResult = await pool.query(aggQuery, aggParams);

        return {
            records: recordsResult.rows,
            aggregations: {
                hourly_distribution: aggResult.rows,
                total_records: recordsResult.rowCount,
            },
        };
    }
}
