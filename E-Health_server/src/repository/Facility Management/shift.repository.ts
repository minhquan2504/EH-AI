// src/repository/shift.repository.ts
import { pool } from '../../config/postgresdb';
import { CreateShiftInput, Shift, UpdateShiftInput } from '../../models/Facility Management/shift.model';
import { v4 as uuidv4 } from 'uuid';

export class ShiftRepository {

    /**
     * Sinh ID cho bảng shifts tự động
     */
    static generateShiftId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const shiftPrefix = "SHF";

        return `${shiftPrefix}_${yy}${mm}_${uuidv4().substring(0, 8)}`;
    }

    /**
     * Tạo một Ca làm việc mới
     */
    static async createShift(input: CreateShiftInput): Promise<Shift> {
        const id = this.generateShiftId();
        const query = `
            INSERT INTO shifts (shifts_id, facility_id, code, name, start_time, end_time, description)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        const values = [id, input.facility_id, input.code, input.name, input.start_time, input.end_time, input.description || null];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Lấy danh sách toàn bộ Ca làm việc (cho phép filter theo Trạng thái Status, hoặc search NAME)
     */
    static async getShifts(facilityId?: string, status?: string, keyword?: string): Promise<Shift[]> {
        let query = `
            SELECT * FROM shifts 
            WHERE deleted_at IS NULL
        `;
        const values: any[] = [];

        if (facilityId) {
            query += ` AND facility_id = $${values.length + 1}`;
            values.push(facilityId);
        }

        if (status) {
            query += ` AND status = $${values.length + 1}`;
            values.push(status);
        }

        if (keyword) {
            query += ` AND (name ILIKE $${values.length + 1} OR code ILIKE $${values.length + 1})`;
            values.push(`%${keyword}%`);
        }

        query += ` ORDER BY start_time ASC`;

        const result = await pool.query(query, values);
        return result.rows;
    }

    /**
     * Tìm Ca làm việc thông qua ID
     */
    static async getShiftById(id: string): Promise<Shift | null> {
        const query = `SELECT * FROM shifts WHERE shifts_id = $1 AND deleted_at IS NULL`;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Tìm Ca làm việc thông qua mã Code để tránh trùng lặp
     */
    static async getShiftByCode(code: string): Promise<Shift | null> {
        const query = `SELECT * FROM shifts WHERE code = $1 AND deleted_at IS NULL`;
        const result = await pool.query(query, [code]);
        return result.rows[0] || null;
    }

    /**
     * Cập nhật thông tin Ca làm việc
     */
    static async updateShift(id: string, updateData: UpdateShiftInput): Promise<Shift | null> {
        let query = `UPDATE shifts SET updated_at = CURRENT_TIMESTAMP`;
        let values: any[] = [];
        let index = 1;

        if (updateData.code !== undefined) {
            query += `, code = $${index++}`;
            values.push(updateData.code);
        }
        if (updateData.name !== undefined) {
            query += `, name = $${index++}`;
            values.push(updateData.name);
        }
        if (updateData.start_time !== undefined) {
            query += `, start_time = $${index++}`;
            values.push(updateData.start_time);
        }
        if (updateData.end_time !== undefined) {
            query += `, end_time = $${index++}`;
            values.push(updateData.end_time);
        }
        if (updateData.description !== undefined) {
            query += `, description = $${index++}`;
            values.push(updateData.description);
        }
        if (updateData.status !== undefined) {
            query += `, status = $${index++}`;
            values.push(updateData.status);
        }

        query += ` WHERE shifts_id = $${index} AND deleted_at IS NULL RETURNING *`;
        values.push(id);

        const result = await pool.query(query, values);
        return result.rows[0] || null;
    }

    /**
     * Vô hiệu hóa ca làm việc
     */
    static async softDeleteShift(id: string): Promise<boolean> {
        const query = `
            UPDATE shifts 
            SET deleted_at = CURRENT_TIMESTAMP, status = 'INACTIVE'
            WHERE shifts_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return (result.rowCount ?? 0) > 0;
    }
}
