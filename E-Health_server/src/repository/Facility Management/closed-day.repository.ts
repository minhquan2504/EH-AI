// src/repository/Facility Management/closed-day.repository.ts
import { pool } from '../../config/postgresdb';
import { ClosedDay, CreateClosedDayInput } from '../../models/Facility Management/closed-day.model';
import { v4 as uuidv4 } from 'uuid';

export class ClosedDayRepository {

    /**
     * Sinh mã ClosedDay ID theo format chuẩn
     */
    private static generateId(): string {
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const shortUuid = uuidv4().split('-')[0];
        return `CD_${dateStr}_${shortUuid}`;
    }

    /**
     * Tạo mới ngày nghỉ cố định
     */
    static async create(input: CreateClosedDayInput): Promise<ClosedDay> {
        const id = this.generateId();
        const query = `
            INSERT INTO facility_closed_days
                (closed_day_id, facility_id, day_of_week, title, start_time, end_time, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            RETURNING *
        `;
        const values = [id, input.facility_id, input.day_of_week, input.title, input.start_time, input.end_time];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Lấy danh sách ngày nghỉ (filter theo facility_id tùy chọn)
     */
    static async findAll(facilityId?: string): Promise<ClosedDay[]> {
        let query = `
            SELECT cd.*, f.name AS facility_name
            FROM facility_closed_days cd
            LEFT JOIN facilities f ON cd.facility_id = f.facilities_id
            WHERE cd.deleted_at IS NULL
        `;
        const values: any[] = [];

        if (facilityId) {
            values.push(facilityId);
            query += ` AND cd.facility_id = $${values.length}`;
        }

        query += ` ORDER BY cd.facility_id, cd.day_of_week, cd.start_time ASC`;

        const result = await pool.query(query, values);
        return result.rows;
    }

    /**
     * Tìm theo ID
     */
    static async findById(id: string): Promise<ClosedDay | null> {
        const query = `
            SELECT cd.*, f.name AS facility_name
            FROM facility_closed_days cd
            LEFT JOIN facilities f ON cd.facility_id = f.facilities_id
            WHERE cd.closed_day_id = $1 AND cd.deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Tìm ngày nghỉ đã tồn tại trong khoảng thời gian chồng chéo
     */
    static async findOverlapping(facilityId: string, dayOfWeek: number, startTime: string, endTime: string): Promise<ClosedDay | null> {
        const query = `
            SELECT * FROM facility_closed_days
            WHERE facility_id = $1
              AND day_of_week = $2
              AND deleted_at IS NULL
              AND start_time < $4::time
              AND end_time > $3::time
        `;
        const result = await pool.query(query, [facilityId, dayOfWeek, startTime, endTime]);
        return result.rows[0] || null;
    }

    /**
     * Xóa mềm (Soft Delete)
     */
    static async softDelete(id: string): Promise<boolean> {
        const query = `
            UPDATE facility_closed_days SET deleted_at = NOW()
            WHERE closed_day_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Kiểm tra xem có ngày nghỉ cả ngày (00:00 - 23:59) cho 1 cặp (facility, day) không.
     */
    static async hasFullDayClosure(facilityId: string, dayOfWeek: number): Promise<boolean> {
        const query = `
            SELECT 1 FROM facility_closed_days
            WHERE facility_id = $1
              AND day_of_week = $2
              AND deleted_at IS NULL
              AND start_time <= '00:01'::time
              AND end_time >= '23:58'::time
            LIMIT 1
        `;
        const result = await pool.query(query, [facilityId, dayOfWeek]);
        return result.rows.length > 0;
    }

    /**
     * Đếm số ngày nghỉ còn active cho 1 cặp (facility, day).
     */
    static async countByFacilityAndDay(facilityId: string, dayOfWeek: number): Promise<number> {
        const query = `
            SELECT COUNT(*)::int AS cnt FROM facility_closed_days
            WHERE facility_id = $1 AND day_of_week = $2 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [facilityId, dayOfWeek]);
        return result.rows[0]?.cnt || 0;
    }
}
