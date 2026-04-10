// src/repository/Appointment Management/appointment.repository.ts
import { pool } from '../../config/postgresdb';
import { Appointment, CreateAppointmentInput, UpdateAppointmentInput } from '../../models/Appointment Management/appointment.model';
import { CreateAuditLogInput } from '../../models/Appointment Management/appointment-audit-log.model';
import { ACTIVE_APPOINTMENT_STATUSES, APPOINTMENT_CODE_PREFIX } from '../../constants/appointment.constant';
import { AppointmentAuditLogRepository } from './appointment-audit-log.repository';
import { v4 as uuidv4 } from 'uuid';

export class AppointmentRepository {

    /**
     * Sinh mã lịch khám tự động: APP-YYYYMMDD-XXXX
     */
    static generateAppointmentCode(): string {
        const now = new Date();
        const yy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const rand = uuidv4().substring(0, 4).toUpperCase();
        return `${APPOINTMENT_CODE_PREFIX}-${yy}${mm}${dd}-${rand}`;
    }

    static generateId(): string {
        return `APT_${uuidv4().substring(0, 12)}`;
    }


    /** Kiểm tra bệnh nhân có tồn tại không */
    static async patientExists(patientId: string): Promise<boolean> {
        const result = await pool.query(
            'SELECT id FROM patients WHERE id::varchar = $1 AND deleted_at IS NULL', [patientId]
        );
        return (result.rowCount ?? 0) > 0;
    }

    /** Kiểm tra bác sĩ có tồn tại và đang hoạt động không */
    static async doctorExists(doctorId: string): Promise<boolean> {
        const result = await pool.query(
            'SELECT doctors_id FROM doctors WHERE doctors_id = $1 AND is_active = true', [doctorId]
        );
        return (result.rowCount ?? 0) > 0;
    }

    /** Kiểm tra slot có tồn tại và đang hoạt động không */
    static async slotExists(slotId: string): Promise<boolean> {
        const result = await pool.query(
            'SELECT slot_id FROM appointment_slots WHERE slot_id = $1 AND is_active = true', [slotId]
        );
        return (result.rowCount ?? 0) > 0;
    }

    /** Kiểm tra phòng khám có tồn tại và đang hoạt động không */
    static async roomIsActive(roomId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT medical_rooms_id FROM medical_rooms WHERE medical_rooms_id = $1 AND status = 'ACTIVE'`, [roomId]
        );
        return (result.rowCount ?? 0) > 0;
    }

    /** Kiểm tra dịch vụ cơ sở có tồn tại và đang hoạt động không */
    static async facilityServiceIsActive(facilityServiceId: string): Promise<boolean> {
        const result = await pool.query(
            'SELECT facility_services_id FROM facility_services WHERE facility_services_id = $1 AND is_active = true', [facilityServiceId]
        );
        return (result.rowCount ?? 0) > 0;
    }

    /** Kiểm tra chi nhánh có tồn tại và đang hoạt động không */
    static async branchExists(branchId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT branches_id FROM branches WHERE branches_id = $1 AND status = 'ACTIVE'`, [branchId]
        );
        return (result.rowCount ?? 0) > 0;
    }

    /** Lấy branch_id của 1 phòng khám (kiểm tra cross-branch) */
    static async getRoomBranchId(roomId: string): Promise<string | null> {
        const result = await pool.query(
            `SELECT branch_id FROM medical_rooms WHERE medical_rooms_id = $1`, [roomId]
        );
        return result.rows[0]?.branch_id || null;
    }

    /** Kiểm tra ca khám có tồn tại và đang hoạt động không */
    static async shiftExists(shiftId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT shifts_id FROM shifts WHERE shifts_id = $1 AND status = 'ACTIVE' AND deleted_at IS NULL`, [shiftId]
        );
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Tìm slot đầu tiên còn chỗ trong 1 ca, xếp theo thời gian (FIFO queue).
     */
    static async findNextAvailableSlot(
        shiftId: string, date: string, maxPerSlot: number, client?: import('pg').PoolClient
    ): Promise<{ slot_id: string; start_time: string; end_time: string } | null> {
        const statusPlaceholders = ACTIVE_APPOINTMENT_STATUSES.map((_, i) => `$${i + 4}`).join(', ');
        const query = `
            SELECT sl.slot_id, sl.start_time::text, sl.end_time::text
            FROM appointment_slots sl
            LEFT JOIN locked_slots ls
                ON ls.slot_id = sl.slot_id AND ls.locked_date = $2::date AND ls.deleted_at IS NULL
            WHERE sl.shift_id = $1
              AND sl.is_active = true
              AND ls.locked_slot_id IS NULL
              AND (
                  SELECT COUNT(*)::int FROM appointments apt
                  WHERE apt.slot_id = sl.slot_id
                    AND apt.appointment_date = $2::date
                    AND apt.status IN (${statusPlaceholders})
              ) < $3
            ORDER BY sl.start_time ASC
            LIMIT 1;
        `;
        const values = [shiftId, date, maxPerSlot, ...ACTIVE_APPOINTMENT_STATUSES];
        const executor = client || pool;
        const result = await executor.query(query, values);
        return result.rows[0] || null;
    }

    /**
     * Tìm phòng khám CONSULTATION trống tại branch.
     * Nếu có specialtyId → ưu tiên phòng thuộc khoa đúng chuyên khoa (qua department_specialties).
     * Fallback: nếu không có phòng đúng khoa → lấy phòng bất kỳ còn trống.
     */
    static async findAvailableRoom(
        branchId: string, specialtyId?: string
    ): Promise<{ medical_rooms_id: string; name: string } | null> {
        // Nếu có specialtyId → ưu tiên tìm phòng thuộc khoa đúng chuyên khoa
        if (specialtyId) {
            const specificResult = await pool.query(`
                SELECT mr.medical_rooms_id, mr.name
                FROM medical_rooms mr
                JOIN department_specialties ds ON mr.department_id = ds.department_id
                WHERE mr.branch_id = $1
                  AND ds.specialty_id = $2
                  AND mr.status = 'ACTIVE'
                  AND mr.room_type = 'CONSULTATION'
                  AND (mr.room_status IS NULL OR mr.room_status = 'AVAILABLE')
                ORDER BY mr.name ASC
                LIMIT 1;
            `, [branchId, specialtyId]);

            if (specificResult.rows[0]) {
                return specificResult.rows[0];
            }
            // Fallback: không có phòng đúng khoa → lấy phòng bất kỳ
        }

        const result = await pool.query(`
            SELECT medical_rooms_id, name FROM medical_rooms
            WHERE branch_id = $1 AND status = 'ACTIVE' AND room_type = 'CONSULTATION'
              AND (room_status IS NULL OR room_status = 'AVAILABLE')
            ORDER BY name ASC
            LIMIT 1;
        `, [branchId]);
        return result.rows[0] || null;
    }

    /**
     * Tìm chuyên khoa từ facility_service_id 
     */
    static async getSpecialtyByFacilityService(facilityServiceId: string): Promise<string | null> {
        const result = await pool.query(`
            SELECT ss.specialty_id
            FROM facility_services fs
            JOIN specialty_services ss ON fs.service_id = ss.service_id
            WHERE fs.facility_services_id = $1
            LIMIT 1;
        `, [facilityServiceId]);
        return result.rows[0]?.specialty_id || null;
    }

    /**
     * Đếm số lịch khám đang hoạt động trên 1 slot trong 1 ngày cụ thể
     */
    static async countActiveBySlotAndDate(slotId: string, appointmentDate: string): Promise<number> {
        const placeholders = ACTIVE_APPOINTMENT_STATUSES.map((_, i) => `$${i + 3}`).join(', ');
        const query = `
            SELECT COUNT(*)::int AS cnt
            FROM appointments
            WHERE slot_id = $1
              AND appointment_date = $2::date
              AND status IN (${placeholders});
        `;
        const values = [slotId, appointmentDate, ...ACTIVE_APPOINTMENT_STATUSES];
        const result = await pool.query(query, values);
        return result.rows[0].cnt;
    }

    /** Lấy max_patients_per_slot từ booking_configurations (fallback về null) */
    static async getMaxPatientsPerSlot(): Promise<number | null> {
        const result = await pool.query(
            'SELECT max_patients_per_slot FROM booking_configurations LIMIT 1'
        );
        return result.rows[0]?.max_patients_per_slot ?? null;
    }


    /**
     * Lấy danh sách lịch khám (có phân trang, filter, JOIN thông tin liên quan)
     */
    static async findAll(filters: {
        status?: string; patient_id?: string; doctor_id?: string;
        room_id?: string; fromDate?: string; toDate?: string;
        booking_channel?: string; date?: string; keyword?: string;
        facility_service_id?: string;
        page?: number; limit?: number;
    }): Promise<{ data: Appointment[]; total: number }> {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const offset = (page - 1) * limit;

        let whereClause = ' WHERE 1=1 ';
        const values: any[] = [];
        let idx = 1;

        if (filters.status) {
            whereClause += ` AND a.status = $${idx++}`;
            values.push(filters.status);
        }
        if (filters.patient_id) {
            whereClause += ` AND a.patient_id = $${idx++}`;
            values.push(filters.patient_id);
        }
        if (filters.doctor_id) {
            whereClause += ` AND a.doctor_id = $${idx++}`;
            values.push(filters.doctor_id);
        }
        if (filters.room_id) {
            whereClause += ` AND a.room_id = $${idx++}`;
            values.push(filters.room_id);
        }
        if (filters.fromDate) {
            whereClause += ` AND a.appointment_date >= $${idx++}::date`;
            values.push(filters.fromDate);
        }
        if (filters.toDate) {
            whereClause += ` AND a.appointment_date <= $${idx++}::date`;
            values.push(filters.toDate);
        }
        if (filters.booking_channel) {
            whereClause += ` AND a.booking_channel = $${idx++}`;
            values.push(filters.booking_channel);
        }
        if (filters.date) {
            whereClause += ` AND a.appointment_date = $${idx++}::date`;
            values.push(filters.date);
        }
        if (filters.facility_service_id) {
            whereClause += ` AND a.facility_service_id = $${idx++}`;
            values.push(filters.facility_service_id);
        }
        if (filters.keyword) {
            whereClause += ` AND (a.appointment_code ILIKE $${idx} OR p.full_name ILIKE $${idx})`;
            values.push(`%${filters.keyword}%`);
            idx++;
        }

        // Count query cần JOIN patients khi có keyword filter
        const countJoin = filters.keyword ? ` LEFT JOIN patients p ON a.patient_id = p.id::varchar` : '';
        const countQuery = `SELECT COUNT(*)::int AS total FROM appointments a${countJoin} ${whereClause}`;
        const countResult = await pool.query(countQuery, values);
        const total = countResult.rows[0].total;

        const dataQuery = `
            SELECT a.*,
                   TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
                   p.full_name AS patient_name,
                   up.full_name AS doctor_name,
                   mr.name AS room_name,
                   br.name AS branch_name,
                   fs_svc.name AS service_name,
                   sl.start_time AS slot_start_time,
                   sl.end_time AS slot_end_time
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id::varchar
            LEFT JOIN doctors d ON a.doctor_id = d.doctors_id
            LEFT JOIN user_profiles up ON d.user_id = up.user_id
            LEFT JOIN medical_rooms mr ON a.room_id = mr.medical_rooms_id
            LEFT JOIN branches br ON a.branch_id = br.branches_id
            LEFT JOIN facility_services fs ON a.facility_service_id = fs.facility_services_id
            LEFT JOIN services fs_svc ON fs.service_id = fs_svc.services_id
            LEFT JOIN appointment_slots sl ON a.slot_id = sl.slot_id
            ${whereClause}
            ORDER BY a.appointment_date DESC, a.created_at DESC
            LIMIT $${idx++} OFFSET $${idx++};
        `;
        values.push(limit, offset);
        const dataResult = await pool.query(dataQuery, values);

        return { data: dataResult.rows, total };
    }

    /**
     * Lấy chi tiết 1 lịch khám theo ID (kèm JOIN thông tin)
     */
    static async findById(id: string): Promise<Appointment | null> {
        const query = `
            SELECT a.*,
                   TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
                   p.full_name AS patient_name,
                   up.full_name AS doctor_name,
                   mr.name AS room_name,
                   br.name AS branch_name,
                   fs_svc.name AS service_name,
                   sl.start_time AS slot_start_time,
                   sl.end_time AS slot_end_time
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id::varchar
            LEFT JOIN doctors d ON a.doctor_id = d.doctors_id
            LEFT JOIN user_profiles up ON d.user_id = up.user_id
            LEFT JOIN medical_rooms mr ON a.room_id = mr.medical_rooms_id
            LEFT JOIN branches br ON a.branch_id = br.branches_id
            LEFT JOIN facility_services fs ON a.facility_service_id = fs.facility_services_id
            LEFT JOIN services fs_svc ON fs.service_id = fs_svc.services_id
            LEFT JOIN appointment_slots sl ON a.slot_id = sl.slot_id
            WHERE a.appointments_id = $1;
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Lấy danh sách lịch khám theo bác sĩ
     */
    static async findByDoctorId(doctorId: string, filters?: { fromDate?: string; toDate?: string }): Promise<Appointment[]> {
        let query = `
            SELECT a.*,
                   TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
                   p.full_name AS patient_name,
                   mr.name AS room_name,
                   sl.start_time AS slot_start_time,
                   sl.end_time AS slot_end_time
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id::varchar
            LEFT JOIN medical_rooms mr ON a.room_id = mr.medical_rooms_id
            LEFT JOIN appointment_slots sl ON a.slot_id = sl.slot_id
            WHERE a.doctor_id = $1
              AND a.status NOT IN ('CANCELLED', 'NO_SHOW')
        `;
        const values: any[] = [doctorId];
        let idx = 2;

        if (filters?.fromDate) {
            query += ` AND a.appointment_date >= $${idx++}::date`;
            values.push(filters.fromDate);
        }
        if (filters?.toDate) {
            query += ` AND a.appointment_date <= $${idx++}::date`;
            values.push(filters.toDate);
        }

        query += ` ORDER BY a.appointment_date ASC, sl.start_time ASC`;
        const result = await pool.query(query, values);
        return result.rows;
    }


    /**
     * Tạo lịch khám mới kèm ghi audit log — chạy trong Transaction
     * @param initialStatus Trạng thái khởi tạo (PENDING hoặc CONFIRMED cho auto-confirm channels)
     */
    static async create(data: CreateAppointmentInput, auditLog: CreateAuditLogInput, initialStatus: string = 'PENDING'): Promise<Appointment> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const id = this.generateId();
            const code = this.generateAppointmentCode();
            const insertQuery = `
                INSERT INTO appointments (
                    appointments_id, appointment_code, patient_id, branch_id, doctor_id, slot_id,
                    room_id, facility_service_id, appointment_date, booking_channel,
                    reason_for_visit, symptoms_notes, status
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING *, TO_CHAR(appointment_date, 'YYYY-MM-DD') AS appointment_date;
            `;
            const values = [
                id, code, data.patient_id, data.branch_id, data.doctor_id || null, data.slot_id || null,
                data.room_id || null, data.facility_service_id || null, data.appointment_date,
                data.booking_channel, data.reason_for_visit || null, data.symptoms_notes || null,
                initialStatus
            ];
            const result = await client.query(insertQuery, values);
            const appointment = result.rows[0];

            // Ghi audit log trong cùng transaction
            await AppointmentAuditLogRepository.create(
                { ...auditLog, appointment_id: appointment.appointments_id },
                client
            );

            await client.query('COMMIT');
            return appointment;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Cập nhật thông tin lịch khám kèm ghi audit log — chạy trong Transaction
     */
    static async update(id: string, data: UpdateAppointmentInput, auditLog: CreateAuditLogInput): Promise<Appointment | null> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const setClauses: string[] = [];
            const values: any[] = [];
            let idx = 1;

            if (data.appointment_date !== undefined) { setClauses.push(`appointment_date = $${idx++}`); values.push(data.appointment_date); }
            if (data.reason_for_visit !== undefined) { setClauses.push(`reason_for_visit = $${idx++}`); values.push(data.reason_for_visit); }
            if (data.symptoms_notes !== undefined) { setClauses.push(`symptoms_notes = $${idx++}`); values.push(data.symptoms_notes); }
            if (data.doctor_id !== undefined) { setClauses.push(`doctor_id = $${idx++}`); values.push(data.doctor_id); }
            if (data.slot_id !== undefined) { setClauses.push(`slot_id = $${idx++}`); values.push(data.slot_id); }
            if (data.room_id !== undefined) { setClauses.push(`room_id = $${idx++}`); values.push(data.room_id); }
            if (data.facility_service_id !== undefined) { setClauses.push(`facility_service_id = $${idx++}`); values.push(data.facility_service_id); }

            if (setClauses.length === 0) { return null; }

            setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

            const query = `
                UPDATE appointments SET ${setClauses.join(', ')}
                WHERE appointments_id = $${idx}
                RETURNING *, TO_CHAR(appointment_date, 'YYYY-MM-DD') AS appointment_date;
            `;
            values.push(id);
            const result = await client.query(query, values);
            const updated = result.rows[0] || null;

            // Ghi audit log trong cùng transaction
            await AppointmentAuditLogRepository.create(auditLog, client);

            await client.query('COMMIT');
            return updated;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Huỷ lịch khám kèm ghi audit log — chạy trong Transaction
     */
    static async cancel(id: string, cancellationReason: string, auditLog: CreateAuditLogInput, cancelledBy?: string): Promise<Appointment | null> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
                UPDATE appointments
                SET status = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP,
                    cancellation_reason = $1, cancelled_by = $3, updated_at = CURRENT_TIMESTAMP
                WHERE appointments_id = $2
                RETURNING *, TO_CHAR(appointment_date, 'YYYY-MM-DD') AS appointment_date;
            `;
            const result = await client.query(query, [cancellationReason, id, cancelledBy || null]);
            const cancelled = result.rows[0] || null;

            await AppointmentAuditLogRepository.create(auditLog, client);

            await client.query('COMMIT');
            return cancelled;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Gán bác sĩ kèm ghi audit log — chạy trong Transaction
     */
    static async assignDoctor(id: string, doctorId: string, auditLog: CreateAuditLogInput): Promise<Appointment | null> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
                UPDATE appointments SET doctor_id = $1, updated_at = CURRENT_TIMESTAMP
                WHERE appointments_id = $2
                RETURNING *, TO_CHAR(appointment_date, 'YYYY-MM-DD') AS appointment_date;
            `;
            const result = await client.query(query, [doctorId, id]);
            const updated = result.rows[0] || null;

            await AppointmentAuditLogRepository.create(auditLog, client);

            await client.query('COMMIT');
            return updated;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Gán phòng khám kèm ghi audit log — chạy trong Transaction
     */
    static async assignRoom(id: string, roomId: string, auditLog: CreateAuditLogInput): Promise<Appointment | null> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
                UPDATE appointments SET room_id = $1, updated_at = CURRENT_TIMESTAMP
                WHERE appointments_id = $2
                RETURNING *, TO_CHAR(appointment_date, 'YYYY-MM-DD') AS appointment_date;
            `;
            const result = await client.query(query, [roomId, id]);
            const updated = result.rows[0] || null;

            await AppointmentAuditLogRepository.create(auditLog, client);

            await client.query('COMMIT');
            return updated;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Gán dịch vụ kèm ghi audit log — chạy trong Transaction
     */
    static async assignService(id: string, facilityServiceId: string, auditLog: CreateAuditLogInput): Promise<Appointment | null> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
                UPDATE appointments SET facility_service_id = $1, updated_at = CURRENT_TIMESTAMP
                WHERE appointments_id = $2
                RETURNING *, TO_CHAR(appointment_date, 'YYYY-MM-DD') AS appointment_date;
            `;
            const result = await client.query(query, [facilityServiceId, id]);
            const updated = result.rows[0] || null;

            await AppointmentAuditLogRepository.create(auditLog, client);

            await client.query('COMMIT');
            return updated;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Kiểm tra cơ sở có đóng cửa vào ngày này không (ngày lễ hoặc giờ hoạt động)
     */
    static async isFacilityClosed(facilityId: string, date: string): Promise<boolean> {
        // Kiểm tra ngày lễ
        const holidayResult = await pool.query(
            `SELECT holiday_id FROM facility_holidays
             WHERE facility_id = $1 AND holiday_date = $2::date AND is_closed = true AND deleted_at IS NULL`,
            [facilityId, date]
        );
        if ((holidayResult.rowCount ?? 0) > 0) return true;

        // Kiểm tra giờ hoạt động theo thứ
        const dayOfWeek = new Date(date).getDay(); // 0=CN, 1-6=T2-T7
        const opHoursResult = await pool.query(
            `SELECT is_closed FROM facility_operation_hours
             WHERE facility_id = $1 AND day_of_week = $2 AND deleted_at IS NULL`,
            [facilityId, dayOfWeek]
        );
        if (opHoursResult.rows[0]?.is_closed === true) return true;

        return false;
    }

    /**
     * Kiểm tra bác sĩ có lịch làm việc vào ngày + ca cụ thể không
     */
    static async isDoctorAvailableOnDate(doctorId: string, date: string, shiftId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT ss.staff_schedules_id
             FROM staff_schedules ss
             JOIN doctors d ON ss.user_id = d.user_id
             WHERE d.doctors_id = $1
               AND ss.working_date = $2::date
               AND ss.shift_id = $3
               AND ss.is_leave = false
               AND ss.status = 'ACTIVE'`,
            [doctorId, date, shiftId]
        );
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Lấy danh sách slot trống cho 1 ngày (kèm thông tin ca, số đã đặt, sức chứa)
     */
    static async findAvailableSlots(date: string, doctorId?: string, facilityId?: string): Promise<any[]> {
        const statusPlaceholders = ACTIVE_APPOINTMENT_STATUSES.map((_, i) => `$${i + 2}`).join(', ');
        const baseValues: any[] = [date, ...ACTIVE_APPOINTMENT_STATUSES];
        let idx = baseValues.length + 1;

        let doctorFilter = '';
        if (doctorId) {
            doctorFilter = `
                AND s.shifts_id IN (
                    SELECT ss.shift_id FROM staff_schedules ss
                    JOIN doctors d ON ss.user_id = d.user_id
                    WHERE d.doctors_id = $${idx++}
                      AND ss.working_date = $1::date
                      AND ss.is_leave = false
                      AND ss.status = 'ACTIVE'
                )
            `;
            baseValues.push(doctorId);
        }

        const query = `
            SELECT
                sl.slot_id,
                sl.start_time,
                sl.end_time,
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
            LEFT JOIN locked_slots ls
                ON ls.slot_id = sl.slot_id
                AND ls.locked_date = $1::date
                AND ls.deleted_at IS NULL
            WHERE sl.is_active = true
              AND s.status = 'ACTIVE'
              AND s.deleted_at IS NULL
              AND ls.locked_slot_id IS NULL
              ${doctorFilter}
            ORDER BY sl.start_time ASC;
        `;

        const result = await pool.query(query, baseValues);
        return result.rows;
    }

    // ======================= 3.1.5: Conflict Check =======================

    /**
     * Tìm lịch trùng bác sĩ: cùng doctor_id + date + slot_id + status active
     */
    static async findDoctorConflict(doctorId: string, date: string, slotId: string, excludeAppointmentId?: string): Promise<any | null> {
        const statusPlaceholders = ACTIVE_APPOINTMENT_STATUSES.map((_, i) => `$${i + 4}`).join(', ');
        let query = `
            SELECT a.appointments_id, a.appointment_code, a.patient_id,
                   p.full_name AS patient_name,
                   sl.start_time, sl.end_time
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id::varchar
            LEFT JOIN appointment_slots sl ON a.slot_id = sl.slot_id
            WHERE a.doctor_id = $1
              AND a.appointment_date = $2::date
              AND a.slot_id = $3
              AND a.status IN (${statusPlaceholders})
        `;
        const values: any[] = [doctorId, date, slotId, ...ACTIVE_APPOINTMENT_STATUSES];

        if (excludeAppointmentId) {
            query += ` AND a.appointments_id != $${values.length + 1}`;
            values.push(excludeAppointmentId);
        }

        query += ` LIMIT 1`;
        const result = await pool.query(query, values);
        return result.rows[0] || null;
    }

    /**
     * Tìm lịch trùng bệnh nhân: cùng patient_id + date + slot_id + status active
     */
    static async findPatientConflict(patientId: string, date: string, slotId: string, excludeAppointmentId?: string): Promise<any | null> {
        const statusPlaceholders = ACTIVE_APPOINTMENT_STATUSES.map((_, i) => `$${i + 4}`).join(', ');
        let query = `
            SELECT a.appointments_id, a.appointment_code,
                   sl.start_time, sl.end_time
            FROM appointments a
            LEFT JOIN appointment_slots sl ON a.slot_id = sl.slot_id
            WHERE a.patient_id = $1
              AND a.appointment_date = $2::date
              AND a.slot_id = $3
              AND a.status IN (${statusPlaceholders})
        `;
        const values: any[] = [patientId, date, slotId, ...ACTIVE_APPOINTMENT_STATUSES];

        if (excludeAppointmentId) {
            query += ` AND a.appointments_id != $${values.length + 1}`;
            values.push(excludeAppointmentId);
        }

        query += ` LIMIT 1`;
        const result = await pool.query(query, values);
        return result.rows[0] || null;
    }

    /**
     * Đếm lịch đang active trên cùng phòng + ngày + slot (so với capacity phòng)
     */
    static async countRoomBookings(roomId: string, date: string, slotId: string, excludeAppointmentId?: string): Promise<number> {
        const statusPlaceholders = ACTIVE_APPOINTMENT_STATUSES.map((_, i) => `$${i + 4}`).join(', ');
        let query = `
            SELECT COUNT(*)::int AS cnt
            FROM appointments
            WHERE room_id = $1
              AND appointment_date = $2::date
              AND slot_id = $3
              AND status IN (${statusPlaceholders})
        `;
        const values: any[] = [roomId, date, slotId, ...ACTIVE_APPOINTMENT_STATUSES];

        if (excludeAppointmentId) {
            query += ` AND appointments_id != $${values.length + 1}`;
            values.push(excludeAppointmentId);
        }

        const result = await pool.query(query, values);
        return result.rows[0].cnt;
    }

    /** Lấy sức chứa phòng khám */
    static async getRoomCapacity(roomId: string): Promise<number> {
        const result = await pool.query(
            'SELECT capacity FROM medical_rooms WHERE medical_rooms_id = $1', [roomId]
        );
        return result.rows[0]?.capacity ?? 1;
    }

    /** Lấy shift_id từ slot_id */
    static async getShiftIdBySlot(slotId: string): Promise<string | null> {
        const result = await pool.query(
            'SELECT shift_id FROM appointment_slots WHERE slot_id = $1', [slotId]
        );
        return result.rows[0]?.shift_id ?? null;
    }

    // ======================= 3.1.4: Reschedule =======================

    /**
     * Đổi lịch (ngày + slot) kèm ghi audit log — Transaction
     */
    static async reschedule(id: string, newDate: string, newSlotId: string, auditLog: CreateAuditLogInput): Promise<Appointment | null> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
                UPDATE appointments
                SET appointment_date = $1, slot_id = $2,
                    reschedule_count = COALESCE(reschedule_count, 0) + 1,
                    last_rescheduled_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE appointments_id = $3
                RETURNING *, TO_CHAR(appointment_date, 'YYYY-MM-DD') AS appointment_date;
            `;
            const result = await client.query(query, [newDate, newSlotId, id]);
            const updated = result.rows[0] || null;

            await AppointmentAuditLogRepository.create(auditLog, client);

            await client.query('COMMIT');
            return updated;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // ======================= 3.1.6: Visit Reason =======================

    /**
     * Cập nhật lý do khám + ghi chú triệu chứng — Transaction
     */
    static async updateVisitReason(id: string, reasonForVisit: string | undefined, symptomsNotes: string | undefined, auditLog: CreateAuditLogInput): Promise<Appointment | null> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const setClauses: string[] = [];
            const values: any[] = [];
            let idx = 1;

            if (reasonForVisit !== undefined) { setClauses.push(`reason_for_visit = $${idx++}`); values.push(reasonForVisit); }
            if (symptomsNotes !== undefined) { setClauses.push(`symptoms_notes = $${idx++}`); values.push(symptomsNotes); }

            if (setClauses.length === 0) return null;
            setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

            const query = `
                UPDATE appointments SET ${setClauses.join(', ')}
                WHERE appointments_id = $${idx}
                RETURNING *, TO_CHAR(appointment_date, 'YYYY-MM-DD') AS appointment_date;
            `;
            values.push(id);
            const result = await client.query(query, values);
            const updated = result.rows[0] || null;

            await AppointmentAuditLogRepository.create(auditLog, client);

            await client.query('COMMIT');
            return updated;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /** Lấy thông tin mục đích khám */
    static async findVisitReason(id: string): Promise<{ reason_for_visit: string | null; symptoms_notes: string | null } | null> {
        const result = await pool.query(
            `SELECT reason_for_visit, symptoms_notes FROM appointments WHERE appointments_id = $1`, [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Xác nhận lịch khám (PENDING → CONFIRMED) kèm ghi audit log — Transaction
     * Ghi nhận thời điểm xác nhận và người xác nhận
     */
    static async confirmAppointment(id: string, confirmedBy: string, auditLog: CreateAuditLogInput): Promise<Appointment | null> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
                UPDATE appointments
                SET status = 'CONFIRMED',
                    confirmed_at = CURRENT_TIMESTAMP,
                    confirmed_by = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE appointments_id = $2 AND status = 'PENDING'
                RETURNING *, TO_CHAR(appointment_date, 'YYYY-MM-DD') AS appointment_date;
            `;
            const result = await client.query(query, [confirmedBy, id]);
            const confirmed = result.rows[0] || null;

            if (confirmed) {
                await AppointmentAuditLogRepository.create(auditLog, client);
            }

            await client.query('COMMIT');
            return confirmed;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Check-in lịch khám (CONFIRMED → CHECKED_IN) kèm ghi audit log 
     */
    static async checkIn(id: string, auditLog: CreateAuditLogInput): Promise<Appointment | null> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
                UPDATE appointments
                SET status = 'CHECKED_IN',
                    checked_in_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE appointments_id = $1 AND status = 'CONFIRMED'
                RETURNING *, TO_CHAR(appointment_date, 'YYYY-MM-DD') AS appointment_date;
            `;
            const result = await client.query(query, [id]);
            const checkedIn = result.rows[0] || null;

            if (checkedIn) {
                await AppointmentAuditLogRepository.create(auditLog, client);
            }

            await client.query('COMMIT');
            return checkedIn;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Hoàn tất lịch khám (CHECKED_IN → COMPLETED) kèm ghi audit log — Transaction
     */
    static async completeAppointment(id: string, auditLog: CreateAuditLogInput): Promise<Appointment | null> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
                UPDATE appointments
                SET status = 'COMPLETED',
                    updated_at = CURRENT_TIMESTAMP
                WHERE appointments_id = $1 AND status = 'CHECKED_IN'
                RETURNING *, TO_CHAR(appointment_date, 'YYYY-MM-DD') AS appointment_date;
            `;
            const result = await client.query(query, [id]);
            const completed = result.rows[0] || null;

            if (completed) {
                await AppointmentAuditLogRepository.create(auditLog, client);
            }

            await client.query('COMMIT');
            return completed;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Tìm các lịch khám sắp tới cần nhắc lịch.
     */
    static async findUpcomingForReminder(
        reminderHours: number,
        windowMinutes: number = 15
    ): Promise<Array<{
        appointments_id: string;
        appointment_code: string;
        patient_id: string;
        patient_name: string;
        account_id: string | null;
        doctor_name: string | null;
        appointment_date: string;
        slot_start_time: string;
        slot_end_time: string;
        slot_time: string;
        appointment_datetime: string;
    }>> {
        const query = `
            SELECT
                a.appointments_id,
                a.appointment_code,
                a.patient_id,
                p.full_name AS patient_name,
                p.account_id,
                up.full_name AS doctor_name,
                TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
                sl.start_time AS slot_start_time,
                sl.end_time AS slot_end_time,
                CONCAT(sl.start_time, ' - ', sl.end_time) AS slot_time,
                (a.appointment_date + sl.start_time::time)::timestamp AS appointment_datetime
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id::varchar
            LEFT JOIN doctors d ON a.doctor_id = d.doctors_id
            LEFT JOIN user_profiles up ON d.user_id = up.user_id
            LEFT JOIN appointment_slots sl ON a.slot_id = sl.slot_id
            WHERE a.status IN ('PENDING', 'CONFIRMED')
              AND sl.start_time IS NOT NULL
              AND (a.appointment_date + sl.start_time::time)::timestamp
                  BETWEEN (CURRENT_TIMESTAMP + INTERVAL '1 hour' * $1 - INTERVAL '1 minute' * $2)
                  AND     (CURRENT_TIMESTAMP + INTERVAL '1 hour' * $1 + INTERVAL '1 minute' * $2)
            ORDER BY a.appointment_date ASC, sl.start_time ASC;
        `;
        const result = await pool.query(query, [reminderHours, windowMinutes]);
        return result.rows;
    }

    /**
     * Lấy thông tin appointment kèm account_id bệnh nhân (dùng cho notification)
     */
    static async findWithPatientAccount(id: string): Promise<(Appointment & { account_id: string | null; patient_email: string | null }) | null> {
        const query = `
            SELECT a.*,
                   TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
                   p.full_name AS patient_name,
                   p.account_id,
                   p.email AS patient_email,
                   up.full_name AS doctor_name,
                   mr.name AS room_name,
                   fs_svc.name AS service_name,
                   sl.start_time AS slot_start_time,
                   sl.end_time AS slot_end_time,
                   CONCAT(sl.start_time, ' - ', sl.end_time) AS slot_time
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id::varchar
            LEFT JOIN doctors d ON a.doctor_id = d.doctors_id
            LEFT JOIN user_profiles up ON d.user_id = up.user_id
            LEFT JOIN medical_rooms mr ON a.room_id = mr.medical_rooms_id
            LEFT JOIN facility_services fs ON a.facility_service_id = fs.facility_services_id
            LEFT JOIN services fs_svc ON fs.service_id = fs_svc.services_id
            LEFT JOIN appointment_slots sl ON a.slot_id = sl.slot_id
            WHERE a.appointments_id = $1;
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Kiểm tra bác sĩ có đăng ký vắng đột xuất vào ngày/ca cụ thể không
     */
    static async isDoctorAbsentOnDate(doctorId: string, date: string, shiftId?: string): Promise<boolean> {
        let query = `
            SELECT absence_id FROM doctor_absences
            WHERE doctor_id = $1
              AND absence_date = $2::date
              AND deleted_at IS NULL
        `;
        const values: any[] = [doctorId, date];

        if (shiftId) {
            query += ` AND (shift_id = $3 OR shift_id IS NULL)`;
            values.push(shiftId);
        }

        const result = await pool.query(query, values);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Kiểm tra slot có bị khoá vào ngày cụ thể không
     */
    static async isSlotLocked(slotId: string, date: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT locked_slot_id FROM locked_slots
             WHERE slot_id = $1 AND locked_date = $2::date AND deleted_at IS NULL`,
            [slotId, date]
        );
        return (result.rowCount ?? 0) > 0;
    }
}

