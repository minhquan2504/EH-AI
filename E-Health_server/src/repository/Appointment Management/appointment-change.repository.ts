// src/repository/Appointment Management/appointment-change.repository.ts
import { pool } from '../../config/postgresdb';
import { AppointmentChangeLog, CreateChangeLogInput } from '../../models/Appointment Management/appointment-change-log.model';
import { PoolClient } from 'pg';


export class AppointmentChangeRepository {

    /**
     * Tạo change log (dùng trong transaction — nhận client)
     */
    static async createChangeLog(input: CreateChangeLogInput, client?: PoolClient): Promise<void> {
        const query = `
            INSERT INTO appointment_change_logs
            (id, appointment_id, change_type, old_date, old_slot_id, new_date, new_slot_id, reason, changed_by, policy_checked, policy_result)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
        `;
        const params = [
            input.id,
            input.appointment_id,
            input.change_type,
            input.old_date || null,
            input.old_slot_id || null,
            input.new_date || null,
            input.new_slot_id || null,
            input.reason || null,
            input.changed_by || null,
            input.policy_checked || false,
            input.policy_result || null,
        ];
        if (client) {
            await client.query(query, params);
        } else {
            await pool.query(query, params);
        }
    }

    /**
     * Lấy lịch sử thay đổi theo appointment_id
     */
    static async getHistoryByAppointmentId(appointmentId: string): Promise<AppointmentChangeLog[]> {
        const query = `
            SELECT
                cl.*,
                TO_CHAR(cl.old_date, 'YYYY-MM-DD') AS old_date,
                TO_CHAR(cl.new_date, 'YYYY-MM-DD') AS new_date,
                up.full_name AS changed_by_name,
                a.appointment_code,
                CONCAT(sl_old.start_time, ' - ', sl_old.end_time) AS old_slot_time,
                CONCAT(sl_new.start_time, ' - ', sl_new.end_time) AS new_slot_time
            FROM appointment_change_logs cl
            LEFT JOIN user_profiles up ON cl.changed_by = up.user_id
            LEFT JOIN appointments a ON cl.appointment_id = a.appointments_id
            LEFT JOIN appointment_slots sl_old ON cl.old_slot_id = sl_old.slot_id
            LEFT JOIN appointment_slots sl_new ON cl.new_slot_id = sl_new.slot_id
            WHERE cl.appointment_id = $1
            ORDER BY cl.created_at DESC;
        `;
        const result = await pool.query(query, [appointmentId]);
        return result.rows;
    }

    /**
     * Danh sách thay đổi gần đây (phân trang)
     */
    static async getRecentChanges(filters: {
        change_type?: string;
        branch_id?: string;
        page: number;
        limit: number;
    }): Promise<{ data: AppointmentChangeLog[]; total: number }> {
        const conditions: string[] = [];
        const params: any[] = [];
        let paramIdx = 1;

        if (filters.change_type) {
            conditions.push(`cl.change_type = $${paramIdx++}`);
            params.push(filters.change_type);
        }
        if (filters.branch_id) {
            conditions.push(`mr.branch_id = $${paramIdx++}`);
            params.push(filters.branch_id);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const offset = (filters.page - 1) * filters.limit;

        // Count
        const countQuery = `
            SELECT COUNT(*) AS total
            FROM appointment_change_logs cl
            LEFT JOIN appointments a ON cl.appointment_id = a.appointments_id
            LEFT JOIN medical_rooms mr ON a.room_id = mr.medical_rooms_id
            ${whereClause};
        `;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);

        // Data
        const dataQuery = `
            SELECT
                cl.*,
                TO_CHAR(cl.old_date, 'YYYY-MM-DD') AS old_date,
                TO_CHAR(cl.new_date, 'YYYY-MM-DD') AS new_date,
                up.full_name AS changed_by_name,
                a.appointment_code,
                p.full_name AS patient_name,
                CONCAT(sl_old.start_time, ' - ', sl_old.end_time) AS old_slot_time,
                CONCAT(sl_new.start_time, ' - ', sl_new.end_time) AS new_slot_time
            FROM appointment_change_logs cl
            LEFT JOIN appointments a ON cl.appointment_id = a.appointments_id
            LEFT JOIN patients p ON a.patient_id = p.id::varchar
            LEFT JOIN user_profiles up ON cl.changed_by = up.user_id
            LEFT JOIN medical_rooms mr ON a.room_id = mr.medical_rooms_id
            LEFT JOIN appointment_slots sl_old ON cl.old_slot_id = sl_old.slot_id
            LEFT JOIN appointment_slots sl_new ON cl.new_slot_id = sl_new.slot_id
            ${whereClause}
            ORDER BY cl.created_at DESC
            LIMIT $${paramIdx++} OFFSET $${paramIdx++};
        `;
        params.push(filters.limit, offset);
        const dataResult = await pool.query(dataQuery, params);

        return { data: dataResult.rows, total };
    }

    /**
     * Thống kê dời/hủy theo khoảng thời gian
     */
    static async getStats(fromDate: string, toDate: string, branchId?: string): Promise<{
        total_cancels: number;
        total_reschedules: number;
        late_cancels: number;
        cancel_reasons: Array<{ reason: string; count: number }>;
    }> {
        const conditions: string[] = [
            `cl.created_at >= $1::date`,
            `cl.created_at < ($2::date + INTERVAL '1 day')`,
        ];
        const params: any[] = [fromDate, toDate];
        let paramIdx = 3;

        if (branchId) {
            conditions.push(`mr.branch_id = $${paramIdx++}`);
            params.push(branchId);
        }

        const whereClause = conditions.join(' AND ');

        // Aggregate counts
        const statsQuery = `
            SELECT
                COUNT(*) FILTER (WHERE cl.change_type = 'CANCEL') AS total_cancels,
                COUNT(*) FILTER (WHERE cl.change_type = 'RESCHEDULE') AS total_reschedules,
                COUNT(*) FILTER (WHERE cl.policy_result = 'LATE_CANCEL') AS late_cancels
            FROM appointment_change_logs cl
            LEFT JOIN appointments a ON cl.appointment_id = a.appointments_id
            LEFT JOIN medical_rooms mr ON a.room_id = mr.medical_rooms_id
            WHERE ${whereClause};
        `;
        const statsResult = await pool.query(statsQuery, params);
        const stats = statsResult.rows[0];

        // Top cancel reasons
        const reasonQuery = `
            SELECT
                COALESCE(cl.reason, 'Không rõ lý do') AS reason,
                COUNT(*) AS count
            FROM appointment_change_logs cl
            LEFT JOIN appointments a ON cl.appointment_id = a.appointments_id
            LEFT JOIN medical_rooms mr ON a.room_id = mr.medical_rooms_id
            WHERE ${whereClause} AND cl.change_type = 'CANCEL'
            GROUP BY cl.reason
            ORDER BY count DESC
            LIMIT 10;
        `;
        const reasonResult = await pool.query(reasonQuery, params);

        return {
            total_cancels: parseInt(stats.total_cancels || '0'),
            total_reschedules: parseInt(stats.total_reschedules || '0'),
            late_cancels: parseInt(stats.late_cancels || '0'),
            cancel_reasons: reasonResult.rows.map(r => ({ reason: r.reason, count: parseInt(r.count) })),
        };
    }
}
