// src/repository/Appointment Management/appointment-audit-log.repository.ts
import { pool } from '../../config/postgresdb';
import { CreateAuditLogInput, AppointmentAuditLog } from '../../models/Appointment Management/appointment-audit-log.model';
import { v4 as uuidv4 } from 'uuid';
import { PoolClient } from 'pg';

/**
 * Repository xử lý truy vấn bảng appointment_audit_logs.
 */
export class AppointmentAuditLogRepository {

    static generateId(): string {
        return `ALOG_${uuidv4().substring(0, 12)}`;
    }

    /**
     * Ghi 1 dòng log thay đổi trạng thái lịch khám.
     */
    static async create(data: CreateAuditLogInput, client?: PoolClient): Promise<AppointmentAuditLog> {
        const id = this.generateId();
        const query = `
            INSERT INTO appointment_audit_logs (appointment_audit_logs_id, appointment_id, changed_by, old_status, new_status, action_note)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const values = [id, data.appointment_id, data.changed_by || null, data.old_status || null, data.new_status || null, data.action_note || null];
        const executor = client || pool;
        const result = await executor.query(query, values);
        return result.rows[0];
    }

    /**
     * Lấy toàn bộ lịch sử thay đổi của 1 lịch khám (sắp theo thời gian mới nhất)
     */
    static async findByAppointmentId(appointmentId: string): Promise<AppointmentAuditLog[]> {
        const query = `
            SELECT a.*, up.full_name AS changed_by_name
            FROM appointment_audit_logs a
            LEFT JOIN user_profiles up ON a.changed_by = up.user_id
            WHERE a.appointment_id = $1
            ORDER BY a.created_at DESC;
        `;
        const result = await pool.query(query, [appointmentId]);
        return result.rows;
    }
}
