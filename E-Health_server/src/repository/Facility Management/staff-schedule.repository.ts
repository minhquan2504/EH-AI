// src/repository/Facility Management/staff-schedule.repository.ts
import { pool } from '../../config/postgresdb';
import { CreateStaffScheduleInput, StaffSchedule, UpdateStaffScheduleInput } from '../../models/Facility Management/staff-schedule.model';
import { v4 as uuidv4 } from 'uuid';

export class StaffScheduleRepository {
    static generateScheduleId(): string {
        const yy = String(new Date().getFullYear()).slice(-2);
        const mm = String(new Date().getMonth() + 1).padStart(2, '0');
        return `SCH_${yy}${mm}_${uuidv4().substring(0, 8)}`;
    }

    /**
     * Tạo một lịch làm việc mới
     */
    static async create(data: CreateStaffScheduleInput): Promise<StaffSchedule> {
        const id = this.generateScheduleId();
        const query = `
            INSERT INTO staff_schedules (staff_schedules_id, user_id, medical_room_id, shift_id, working_date, start_time, end_time)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *, TO_CHAR(working_date, 'YYYY-MM-DD') AS working_date;
        `;
        const values = [id, data.user_id, data.medical_room_id, data.shift_id, data.working_date, data.start_time, data.end_time];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Lấy danh sách lịch phân công (Có filter)
     */
    static async findAll(filters: { staff_schedules_id?: string; user_id?: string; shift_id?: string; working_date?: string; medical_room_id?: string; branch_id?: string }): Promise<StaffSchedule[]> {
        let query = `
            SELECT s.staff_schedules_id, s.user_id, s.medical_room_id, s.shift_id,
                   TO_CHAR(s.working_date, 'YYYY-MM-DD') AS working_date,
                   s.start_time, s.end_time, s.is_leave, s.leave_reason, s.status,
                   u.full_name as full_name, 
                   r.name as room_name,
                   sh.name as shift_name
            FROM staff_schedules s
            LEFT JOIN user_profiles u ON s.user_id = u.user_id
            LEFT JOIN medical_rooms r ON s.medical_room_id = r.medical_rooms_id
            LEFT JOIN shifts sh ON s.shift_id = sh.shifts_id
            WHERE 1=1
        `;
        const values: any[] = [];
        let index = 1;

        if (filters.staff_schedules_id) {
            query += ` AND s.staff_schedules_id = $${index++}`;
            values.push(filters.staff_schedules_id);
        }

        if (filters.user_id) {
            query += ` AND s.user_id = $${index++}`;
            values.push(filters.user_id);
        }
        if (filters.shift_id) {
            query += ` AND s.shift_id = $${index++}`;
            values.push(filters.shift_id);
        }
        if (filters.working_date) {
            query += ` AND s.working_date = $${index++}::date`;
            values.push(filters.working_date);
        }
        if (filters.medical_room_id) {
            query += ` AND s.medical_room_id = $${index++}`;
            values.push(filters.medical_room_id);
        }
        if (filters.branch_id) {
            query += ` AND r.branch_id = $${index++}`;
            values.push(filters.branch_id);
        }

        query += ` ORDER BY s.working_date DESC, s.start_time ASC`;

        const result = await pool.query(query, values);
        return result.rows;
    }

    /**
     * Lấy chi tiết một lịch làm việc
     */
    static async findById(id: string): Promise<StaffSchedule | null> {
        const query = `
            SELECT s.staff_schedules_id, s.user_id, s.medical_room_id, s.shift_id,
                   TO_CHAR(s.working_date, 'YYYY-MM-DD') AS working_date,
                   s.start_time, s.end_time, s.is_leave, s.leave_reason, s.status,
                   u.full_name as full_name, 
                   r.name as room_name,
                   sh.name as shift_name
            FROM staff_schedules s
            LEFT JOIN user_profiles u ON s.user_id = u.user_id
            LEFT JOIN medical_rooms r ON s.medical_room_id = r.medical_rooms_id
            LEFT JOIN shifts sh ON s.shift_id = sh.shifts_id
            WHERE s.staff_schedules_id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Lấy toàn bộ lịch của 1 nhân viên trong khoảng +/- 1 ngày để validation (Check lấp giờ vắt qua biên ngày)
     */
    static async findSchedulesByUserIdAndDateRange(userId: string, date: string): Promise<StaffSchedule[]> {
        const query = `
            SELECT s.*, TO_CHAR(s.working_date, 'YYYY-MM-DD') AS working_date
            FROM staff_schedules s
            WHERE s.user_id = $1 
              AND s.working_date >= $2::date - interval '1 day'
              AND s.working_date <= $2::date + interval '1 day'
        `;
        const result = await pool.query(query, [userId, date]);
        return result.rows;
    }

    /**
     * Lấy toàn bộ lịch của 1 phòng trong ngày (±1 ngày) để kiểm tra trùng phòng
     */
    static async findSchedulesByRoomAndDate(roomId: string, date: string): Promise<StaffSchedule[]> {
        const query = `
            SELECT s.*, TO_CHAR(s.working_date, 'YYYY-MM-DD') AS working_date
            FROM staff_schedules s
            WHERE s.medical_room_id = $1
              AND s.working_date >= $2::date - interval '1 day'
              AND s.working_date <= $2::date + interval '1 day'
              AND s.status = 'ACTIVE'
        `;
        const result = await pool.query(query, [roomId, date]);
        return result.rows;
    }

    /**
     * Cập nhật thông tin lịch
     */
    static async update(id: string, data: UpdateStaffScheduleInput): Promise<StaffSchedule | null> {
        let query = `UPDATE staff_schedules SET `;
        const values: any[] = [];
        let index = 1;
        const setClauses: string[] = [];

        if (data.medical_room_id !== undefined) {
            setClauses.push(`medical_room_id = $${index++}`);
            values.push(data.medical_room_id);
        }
        if (data.shift_id !== undefined) {
            setClauses.push(`shift_id = $${index++}`);
            values.push(data.shift_id);
        }
        if (data.working_date !== undefined) {
            setClauses.push(`working_date = $${index++}`);
            values.push(data.working_date);
        }
        if (data.is_leave !== undefined) {
            setClauses.push(`is_leave = $${index++}`);
            values.push(data.is_leave);
        }
        if (data.leave_reason !== undefined) {
            setClauses.push(`leave_reason = $${index++}`);
            values.push(data.leave_reason);
        }

        if (data.start_time !== undefined) {
            setClauses.push(`start_time = $${index++}`);
            values.push(data.start_time);
        }
        if (data.end_time !== undefined) {
            setClauses.push(`end_time = $${index++}`);
            values.push(data.end_time);
        }
        if (data.status !== undefined) {
            setClauses.push(`status = $${index++}`);
            values.push(data.status);
        }

        if (setClauses.length === 0) return null;

        query += setClauses.join(', ') + ` WHERE staff_schedules_id = $${index} RETURNING *, TO_CHAR(working_date, 'YYYY-MM-DD') AS working_date`;
        values.push(id);

        const result = await pool.query(query, values);
        return result.rows[0] || null;
    }

    /**
     * Xóa Lịch (Chỉ dùng cho lịch tương lai)
     */
    static async delete(id: string): Promise<boolean> {
        const query = `DELETE FROM staff_schedules WHERE staff_schedules_id = $1`;
        const result = await pool.query(query, [id]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Thay đổi trạng thái lịch (Tạm ngưng / Mở lại)
     */
    static async changeStatus(id: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<boolean> {
        const query = `UPDATE staff_schedules SET status = $1 WHERE staff_schedules_id = $2`;
        const result = await pool.query(query, [status, id]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Hoán đổi user_id giữa 2 lịch trực
     */
    static async swapUsers(scheduleIdA: string, scheduleIdB: string): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Lấy user_id hiện tại của 2 lịch trực
            const resA = await client.query('SELECT user_id FROM staff_schedules WHERE staff_schedules_id = $1', [scheduleIdA]);
            const resB = await client.query('SELECT user_id FROM staff_schedules WHERE staff_schedules_id = $1', [scheduleIdB]);

            const userIdA = resA.rows[0]?.user_id;
            const userIdB = resB.rows[0]?.user_id;

            if (!userIdA || !userIdB) {
                throw new Error('Không tìm thấy 1 trong 2 lịch trực để hoán đổi.');
            }

            // Hoán đổi user_id
            await client.query('UPDATE staff_schedules SET user_id = $1 WHERE staff_schedules_id = $2', [userIdB, scheduleIdA]);
            await client.query('UPDATE staff_schedules SET user_id = $1 WHERE staff_schedules_id = $2', [userIdA, scheduleIdB]);

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}
