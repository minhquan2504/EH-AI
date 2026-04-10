// src/repository/Facility Management/shift-swap.repository.ts
import { pool } from '../../config/postgresdb';
import { CreateShiftSwapInput, ShiftSwap } from '../../models/Facility Management/shift-swap.model';
import { v4 as uuidv4 } from 'uuid';

export class ShiftSwapRepository {

    /**
     * Sinh mã Swap ID theo format chuẩn
     */
    static generateSwapId(): string {
        const yy = String(new Date().getFullYear()).slice(-2);
        const mm = String(new Date().getMonth() + 1).padStart(2, '0');
        return `SWP_${yy}${mm}_${uuidv4().substring(0, 8)}`;
    }

    /**
     * Tạo yêu cầu đổi ca mới
     */
    static async create(data: CreateShiftSwapInput): Promise<ShiftSwap> {
        const id = this.generateSwapId();
        const query = `
            INSERT INTO shift_swaps (swap_id, requester_schedule_id, target_schedule_id, reason)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [id, data.requester_schedule_id, data.target_schedule_id, data.reason];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Lấy danh sách yêu cầu đổi ca (có filter theo status)
     */
    static async findAll(filters: { status?: string }): Promise<ShiftSwap[]> {
        let query = `
            SELECT
                sw.*,
                req_up.full_name AS requester_name,
                TO_CHAR(req_ss.working_date, 'YYYY-MM-DD') AS requester_working_date,
                req_ss.start_time AS requester_start_time,
                req_ss.end_time AS requester_end_time,
                req_shift.name AS requester_shift_name,
                tgt_up.full_name AS target_name,
                TO_CHAR(tgt_ss.working_date, 'YYYY-MM-DD') AS target_working_date,
                tgt_ss.start_time AS target_start_time,
                tgt_ss.end_time AS target_end_time,
                tgt_shift.name AS target_shift_name
            FROM shift_swaps sw
            LEFT JOIN staff_schedules req_ss ON sw.requester_schedule_id = req_ss.staff_schedules_id
            LEFT JOIN user_profiles req_up ON req_ss.user_id = req_up.user_id
            LEFT JOIN shifts req_shift ON req_ss.shift_id = req_shift.shifts_id
            LEFT JOIN staff_schedules tgt_ss ON sw.target_schedule_id = tgt_ss.staff_schedules_id
            LEFT JOIN user_profiles tgt_up ON tgt_ss.user_id = tgt_up.user_id
            LEFT JOIN shifts tgt_shift ON tgt_ss.shift_id = tgt_shift.shifts_id
            WHERE sw.deleted_at IS NULL
        `;
        const values: any[] = [];
        let index = 1;

        if (filters.status) {
            query += ` AND sw.status = $${index++}`;
            values.push(filters.status);
        }

        query += ` ORDER BY sw.created_at DESC`;
        const result = await pool.query(query, values);
        return result.rows;
    }

    /**
     * Xem chi tiết 1 yêu cầu đổi ca (JOIN đầy đủ thông tin 2 lịch trực)
     */
    static async findById(id: string): Promise<ShiftSwap | null> {
        const query = `
            SELECT
                sw.*,
                req_up.full_name AS requester_name,
                TO_CHAR(req_ss.working_date, 'YYYY-MM-DD') AS requester_working_date,
                req_ss.start_time AS requester_start_time,
                req_ss.end_time AS requester_end_time,
                req_shift.name AS requester_shift_name,
                req_room.name AS requester_room_name,
                tgt_up.full_name AS target_name,
                TO_CHAR(tgt_ss.working_date, 'YYYY-MM-DD') AS target_working_date,
                tgt_ss.start_time AS target_start_time,
                tgt_ss.end_time AS target_end_time,
                tgt_shift.name AS target_shift_name,
                tgt_room.name AS target_room_name,
                approver_up.full_name AS approver_name
            FROM shift_swaps sw
            LEFT JOIN staff_schedules req_ss ON sw.requester_schedule_id = req_ss.staff_schedules_id
            LEFT JOIN user_profiles req_up ON req_ss.user_id = req_up.user_id
            LEFT JOIN shifts req_shift ON req_ss.shift_id = req_shift.shifts_id
            LEFT JOIN medical_rooms req_room ON req_ss.medical_room_id = req_room.medical_rooms_id
            LEFT JOIN staff_schedules tgt_ss ON sw.target_schedule_id = tgt_ss.staff_schedules_id
            LEFT JOIN user_profiles tgt_up ON tgt_ss.user_id = tgt_up.user_id
            LEFT JOIN shifts tgt_shift ON tgt_ss.shift_id = tgt_shift.shifts_id
            LEFT JOIN medical_rooms tgt_room ON tgt_ss.medical_room_id = tgt_room.medical_rooms_id
            LEFT JOIN user_profiles approver_up ON sw.approver_id = approver_up.user_id
            WHERE sw.swap_id = $1 AND sw.deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Cập nhật trạng thái yêu cầu đổi ca (Approve / Reject)
     */
    static async updateStatus(id: string, status: string, approverId: string, approverNote?: string | null): Promise<ShiftSwap | null> {
        const query = `
            UPDATE shift_swaps
            SET status = $1, approver_id = $2, approver_note = $3, updated_at = NOW()
            WHERE swap_id = $4 AND deleted_at IS NULL
            RETURNING *;
        `;
        const result = await pool.query(query, [status, approverId, approverNote || null, id]);
        return result.rows[0] || null;
    }

    /**
     * Kiểm tra xem 1 schedule đã nằm trong 1 yêu cầu Swap PENDING khác chưa
     */
    static async findPendingSwapByScheduleId(scheduleId: string): Promise<ShiftSwap | null> {
        const query = `
            SELECT * FROM shift_swaps
            WHERE (requester_schedule_id = $1 OR target_schedule_id = $1)
              AND status = 'PENDING'
              AND deleted_at IS NULL
            LIMIT 1
        `;
        const result = await pool.query(query, [scheduleId]);
        return result.rows[0] || null;
    }
}
