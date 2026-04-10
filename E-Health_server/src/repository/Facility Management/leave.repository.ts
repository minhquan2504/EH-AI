// src/repository/Facility Management/leave.repository.ts
import { pool } from '../../config/postgresdb';
import { CreateLeaveInput, LeaveRequest, UpdateLeaveInput } from '../../models/Facility Management/leave.model';
import { v4 as uuidv4 } from 'uuid';

export class LeaveRepository {

    /**
     * Sinh mã Đơn nghỉ phép theo format chuẩn
     */
    static generateLeaveId(): string {
        const yy = String(new Date().getFullYear()).slice(-2);
        const mm = String(new Date().getMonth() + 1).padStart(2, '0');
        return `LV_${yy}${mm}_${uuidv4().substring(0, 8)}`;
    }

    /**
     * Tạo đơn nghỉ phép mới
     */
    static async create(data: CreateLeaveInput): Promise<LeaveRequest> {
        const id = this.generateLeaveId();
        const query = `
            INSERT INTO leave_requests (leave_requests_id, user_id, start_date, end_date, reason)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const values = [id, data.user_id, data.start_date, data.end_date, data.reason];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Lấy danh sách đơn có filter (Admin xem tất cả, NV xem của mình)
     */
    static async findAll(filters: { user_id?: string; status?: string }): Promise<LeaveRequest[]> {
        let query = `
            SELECT lr.*, up.full_name
            FROM leave_requests lr
            LEFT JOIN user_profiles up ON lr.user_id = up.user_id
            WHERE lr.deleted_at IS NULL
        `;
        const values: any[] = [];
        let index = 1;

        if (filters.user_id) {
            query += ` AND lr.user_id = $${index++}`;
            values.push(filters.user_id);
        }
        if (filters.status) {
            query += ` AND lr.status = $${index++}`;
            values.push(filters.status);
        }

        query += ` ORDER BY lr.created_at DESC`;
        const result = await pool.query(query, values);
        return result.rows;
    }

    /**
     * Tìm chi tiết 1 đơn theo ID (JOIN tên người tạo + người duyệt)
     */
    static async findById(id: string): Promise<LeaveRequest | null> {
        try {
            const query = `
                SELECT lr.*,
                       up.full_name,
                       approver_up.full_name AS approver_name
                FROM leave_requests lr
                LEFT JOIN user_profiles up ON lr.user_id = up.user_id
                LEFT JOIN user_profiles approver_up ON lr.approver_id = approver_up.user_id
                WHERE lr.leave_requests_id = $1 AND lr.deleted_at IS NULL
            `;
            const result = await pool.query(query, [id]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('[LeaveRepository.findById] SQL Error:', error);
            throw error;
        }
    }

    /**
     * Cập nhật Đơn nghỉ phép (dùng cho cả NV sửa đơn lẫn Admin duyệt/từ chối)
     */
    static async update(id: string, data: Record<string, any>): Promise<LeaveRequest | null> {
        try {
            const setClauses: string[] = [];
            const values: any[] = [];
            let index = 1;

            for (const [key, value] of Object.entries(data)) {
                if (value !== undefined) {
                    setClauses.push(`${key} = $${index++}`);
                    values.push(value);
                }
            }

            if (setClauses.length === 0) return null;

            setClauses.push(`updated_at = NOW()`);
            values.push(id);

            const query = `
                UPDATE leave_requests SET ${setClauses.join(', ')}
                WHERE leave_requests_id = $${index}
                RETURNING *;
            `;
            console.log('[LeaveRepository.update] Query:', query, 'Values:', values);
            const result = await pool.query(query, values);
            return result.rows[0] || null;
        } catch (error) {
            console.error('[LeaveRepository.update] SQL Error:', error);
            throw error;
        }
    }

    /**
     * Soft delete đơn nghỉ phép
     */
    static async softDelete(id: string): Promise<boolean> {
        const query = `UPDATE leave_requests SET deleted_at = NOW() WHERE leave_requests_id = $1 AND deleted_at IS NULL`;
        const result = await pool.query(query, [id]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Tìm đơn nghỉ phép APPROVED của 1 nhân viên mà ngày làm việc rơi vào khoảng start_date -> end_date
     */
    static async findApprovedLeaveByUserAndDate(userId: string, workingDate: string): Promise<LeaveRequest | null> {
        const query = `
            SELECT * FROM leave_requests
            WHERE user_id = $1
              AND status = 'APPROVED'
              AND deleted_at IS NULL
              AND $2::date BETWEEN start_date AND end_date
            LIMIT 1
        `;
        const result = await pool.query(query, [userId, workingDate]);
        return result.rows[0] || null;
    }
}
