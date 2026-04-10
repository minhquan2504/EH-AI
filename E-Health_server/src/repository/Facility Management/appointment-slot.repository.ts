// src/repository/Facility Management/appointment-slot.repository.ts
import { pool } from '../../config/postgresdb';
import { AppointmentSlot, CreateAppointmentSlotInput, UpdateAppointmentSlotInput } from '../../models/Facility Management/appointment-slot.model';
import { v4 as uuidv4 } from 'uuid';

export class AppointmentSlotRepository {
    /**
     * Sinh ID cho bảng appointment_slots tự động
     */
    static generateSlotId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const slotPrefix = "SLT";

        return `${slotPrefix}_${yy}${mm}_${uuidv4().substring(0, 8)}`;
    }

    /**
     * Tạo một Slot khám bệnh mới
     */
    static async createSlot(input: CreateAppointmentSlotInput): Promise<AppointmentSlot> {
        const id = this.generateSlotId();
        const query = `
            INSERT INTO appointment_slots (slot_id, shift_id, start_time, end_time)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [id, input.shift_id, input.start_time, input.end_time];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Lấy toàn bộ Slot khám bệnh (Hỗ trợ lọc theo shift_id hoặc trạng thái isActive)
     */
    static async getSlots(shiftId?: string, isActive?: boolean): Promise<AppointmentSlot[]> {
        let query = `SELECT * FROM appointment_slots WHERE 1=1`;
        const values: any[] = [];
        let pIndex = 1;

        if (shiftId) {
            query += ` AND shift_id = $${pIndex++}`;
            values.push(shiftId);
        }

        if (isActive !== undefined) {
            query += ` AND is_active = $${pIndex++}`;
            values.push(isActive);
        }

        query += ` ORDER BY start_time ASC`;

        const result = await pool.query(query, values);
        return result.rows;
    }

    /**
     * Lấy chi tiết slot theo ID
     */
    static async getSlotById(id: string): Promise<AppointmentSlot | null> {
        const query = `SELECT * FROM appointment_slots WHERE slot_id = $1`;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Cập nhật thông tin slot khám bệnh
     */
    static async updateSlot(id: string, updateData: UpdateAppointmentSlotInput): Promise<AppointmentSlot | null> {
        let query = `UPDATE appointment_slots SET updated_at = CURRENT_TIMESTAMP`;
        const values: any[] = [];
        let index = 1;

        if (updateData.shift_id !== undefined) {
            query += `, shift_id = $${index++}`;
            values.push(updateData.shift_id);
        }
        if (updateData.start_time !== undefined) {
            query += `, start_time = $${index++}`;
            values.push(updateData.start_time);
        }
        if (updateData.end_time !== undefined) {
            query += `, end_time = $${index++}`;
            values.push(updateData.end_time);
        }
        if (updateData.is_active !== undefined) {
            query += `, is_active = $${index++}`;
            values.push(updateData.is_active);
        }

        query += ` WHERE slot_id = $${index} RETURNING *`;
        values.push(id);

        const result = await pool.query(query, values);
        return result.rows[0] || null;
    }

    /**
     * Disable Slot để giữ liệu nếu đã có lịch hẹn
     */
    static async disableSlot(id: string): Promise<boolean> {
        const query = `
            UPDATE appointment_slots 
            SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
            WHERE slot_id = $1
        `;
        const result = await pool.query(query, [id]);
        return (result.rowCount ?? 0) > 0;
    }
}
