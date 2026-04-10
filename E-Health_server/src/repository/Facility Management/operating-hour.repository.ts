// src/repository/Facility Management/operating-hour.repository.ts
import { pool } from '../../config/postgresdb';
import { OperatingHour, CreateOperatingHourInput, UpdateOperatingHourInput } from '../../models/Facility Management/operating-hour.model';
import { v4 as uuidv4 } from 'uuid';

export class OperatingHourRepository {

    /**
     * Sinh mã Operating Hour ID theo format chuẩn
     */
    private static generateId(): string {
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const shortUuid = uuidv4().split('-')[0];
        return `OPH_${dateStr}_${shortUuid}`;
    }

    /**
     * Tạo mới một cấu hình giờ hoạt động
     */
    static async create(input: CreateOperatingHourInput): Promise<OperatingHour> {
        const id = this.generateId();
        const query = `
            INSERT INTO facility_operation_hours 
                (operation_hours_id, facility_id, day_of_week, open_time, close_time, is_closed, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            RETURNING *
        `;
        const values = [
            id,
            input.facility_id,
            input.day_of_week,
            input.open_time || '00:00',
            input.close_time || '00:00',
            input.is_closed || false,
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Lấy danh sách giờ hoạt động (có thể filter theo facility_id)
     */
    static async findAll(facilityId?: string): Promise<OperatingHour[]> {
        let query = `
            SELECT oh.*, f.name AS facility_name
            FROM facility_operation_hours oh
            LEFT JOIN facilities f ON oh.facility_id = f.facilities_id
            WHERE oh.deleted_at IS NULL
        `;
        const values: any[] = [];

        if (facilityId) {
            values.push(facilityId);
            query += ` AND oh.facility_id = $${values.length}`;
        }

        query += ` ORDER BY oh.facility_id, oh.day_of_week ASC`;

        const result = await pool.query(query, values);
        return result.rows;
    }

    /**
     * Tìm theo ID
     */
    static async findById(id: string): Promise<OperatingHour | null> {
        const query = `
            SELECT oh.*, f.name AS facility_name
            FROM facility_operation_hours oh
            LEFT JOIN facilities f ON oh.facility_id = f.facilities_id
            WHERE oh.operation_hours_id = $1 AND oh.deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Tìm theo facility_id + day_of_week (kiểm tra trùng lặp)
     */
    static async findByFacilityAndDay(facilityId: string, dayOfWeek: number): Promise<OperatingHour | null> {
        const query = `
            SELECT * FROM facility_operation_hours
            WHERE facility_id = $1 AND day_of_week = $2 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [facilityId, dayOfWeek]);
        return result.rows[0] || null;
    }

    /**
     * Cập nhật giờ hoạt động
     */
    static async update(id: string, input: UpdateOperatingHourInput): Promise<OperatingHour | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (input.open_time !== undefined) {
            fields.push(`open_time = $${paramIndex++}`);
            values.push(input.open_time);
        }
        if (input.close_time !== undefined) {
            fields.push(`close_time = $${paramIndex++}`);
            values.push(input.close_time);
        }
        if (input.is_closed !== undefined) {
            fields.push(`is_closed = $${paramIndex++}`);
            values.push(input.is_closed);
        }

        if (fields.length === 0) return this.findById(id);

        fields.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
            UPDATE facility_operation_hours
            SET ${fields.join(', ')}
            WHERE operation_hours_id = $${paramIndex} AND deleted_at IS NULL
            RETURNING *
        `;
        const result = await pool.query(query, values);
        return result.rows[0] || null;
    }

    /**
     * Xóa mềm (Soft Delete)
     */
    static async softDelete(id: string): Promise<boolean> {
        const query = `
            UPDATE facility_operation_hours SET deleted_at = NOW()
            WHERE operation_hours_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Đồng bộ cờ is_closed cho 1 cặp (facility_id, day_of_week).
     */
    static async updateIsClosedByFacilityAndDay(facilityId: string, dayOfWeek: number, isClosed: boolean): Promise<boolean> {
        const query = `
            UPDATE facility_operation_hours
            SET is_closed = $3, updated_at = NOW()
            WHERE facility_id = $1 AND day_of_week = $2 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [facilityId, dayOfWeek, isClosed]);
        return (result.rowCount ?? 0) > 0;
    }
}
