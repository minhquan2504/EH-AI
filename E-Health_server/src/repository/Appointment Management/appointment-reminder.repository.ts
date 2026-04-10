import { pool } from '../../config/postgresdb';
import { AppointmentReminder, CreateReminderInput } from '../../models/Appointment Management/appointment-reminder.model';
import { v4 as uuidv4 } from 'uuid';


export class AppointmentReminderRepository {

    /** Sinh ID cho reminder */
    static generateId(): string {
        return `RMD_${uuidv4().substring(0, 12)}`;
    }

    /**
     * Ghi 1 bản ghi reminder sau khi gửi thông báo thành công
     */
    static async create(input: CreateReminderInput): Promise<AppointmentReminder> {
        const id = this.generateId();
        const query = `
            INSERT INTO appointment_reminders (
                reminder_id, appointment_id, reminder_type, channel, sent_by, trigger_source
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const values = [
            id,
            input.appointment_id,
            input.reminder_type,
            input.channel,
            input.sent_by || null,
            input.trigger_source,
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Lấy lịch sử nhắc lịch của 1 lịch khám (kèm JOIN tên người gửi)
     */
    static async findByAppointmentId(appointmentId: string): Promise<AppointmentReminder[]> {
        const query = `
            SELECT r.*,
                   a.appointment_code,
                   p.full_name AS patient_name,
                   TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
                   CONCAT(sl.start_time, ' - ', sl.end_time) AS slot_time,
                   up.full_name AS sent_by_name
            FROM appointment_reminders r
            JOIN appointments a ON r.appointment_id = a.appointments_id
            LEFT JOIN patients p ON a.patient_id = p.id::varchar
            LEFT JOIN appointment_slots sl ON a.slot_id = sl.slot_id
            LEFT JOIN user_profiles up ON r.sent_by = up.user_id
            WHERE r.appointment_id = $1
            ORDER BY r.sent_at DESC
        `;
        const result = await pool.query(query, [appointmentId]);
        return result.rows;
    }

    /**
     * Kiểm tra đã gửi nhắc cho 1 appointment trong khoảng thời gian gần
     */
    static async hasRecentReminder(
        appointmentId: string,
        withinMinutes: number = 60
    ): Promise<boolean> {
        const query = `
            SELECT 1 FROM appointment_reminders
            WHERE appointment_id = $1
              AND sent_at >= CURRENT_TIMESTAMP - INTERVAL '1 minute' * $2
            LIMIT 1
        `;
        const result = await pool.query(query, [appointmentId, withinMinutes]);
        return (result.rowCount ?? 0) > 0;
    }
}
