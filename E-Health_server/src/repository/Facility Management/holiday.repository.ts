// src/repository/Facility Management/holiday.repository.ts
import { pool } from '../../config/postgresdb';
import { Holiday, CreateHolidayInput, UpdateHolidayInput } from '../../models/Facility Management/holiday.model';
import { v4 as uuidv4 } from 'uuid';

export class HolidayRepository {

    /**
     * Sinh mã Holiday ID theo format chuẩn
     */
    private static generateId(): string {
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const shortUuid = uuidv4().split('-')[0];
        return `HOL_${dateStr}_${shortUuid}`;
    }

    /**
     * Tạo mới ngày lễ
     */
    static async create(input: CreateHolidayInput): Promise<Holiday> {
        const id = this.generateId();
        const query = `
            INSERT INTO facility_holidays
                (holiday_id, facility_id, holiday_date, title, is_closed,
                 special_open_time, special_close_time, description, is_recurring,
                 created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
            RETURNING *
        `;
        const values = [
            id,
            input.facility_id,
            input.holiday_date,
            input.title,
            input.is_closed !== undefined ? input.is_closed : true,
            input.special_open_time || null,
            input.special_close_time || null,
            input.description || null,
            input.is_recurring || false,
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Lấy danh sách ngày lễ (filter facility_id, year, from, to)
     */
    static async findAll(filters: {
        facilityId?: string;
        year?: number;
        from?: string;
        to?: string;
    }): Promise<Holiday[]> {
        let query = `
            SELECT h.*,
                   TO_CHAR(h.holiday_date, 'YYYY-MM-DD') AS holiday_date,
                   f.name AS facility_name
            FROM facility_holidays h
            LEFT JOIN facilities f ON h.facility_id = f.facilities_id
            WHERE h.deleted_at IS NULL
        `;
        const values: any[] = [];

        if (filters.facilityId) {
            values.push(filters.facilityId);
            query += ` AND h.facility_id = $${values.length}`;
        }
        if (filters.year) {
            values.push(filters.year);
            query += ` AND EXTRACT(YEAR FROM h.holiday_date) = $${values.length}`;
        }
        if (filters.from) {
            values.push(filters.from);
            query += ` AND h.holiday_date >= $${values.length}::date`;
        }
        if (filters.to) {
            values.push(filters.to);
            query += ` AND h.holiday_date <= $${values.length}::date`;
        }

        query += ` ORDER BY h.holiday_date ASC`;

        const result = await pool.query(query, values);
        return result.rows;
    }

    /**
     * Tìm theo ID
     */
    static async findById(id: string): Promise<Holiday | null> {
        const query = `
            SELECT h.*,
                   TO_CHAR(h.holiday_date, 'YYYY-MM-DD') AS holiday_date,
                   f.name AS facility_name
            FROM facility_holidays h
            LEFT JOIN facilities f ON h.facility_id = f.facilities_id
            WHERE h.holiday_id = $1 AND h.deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Tìm theo facility_id + holiday_date (kiểm tra trùng lặp)
     */
    static async findByFacilityAndDate(facilityId: string, holidayDate: string): Promise<Holiday | null> {
        const query = `
            SELECT * FROM facility_holidays
            WHERE facility_id = $1 AND holiday_date = $2::date AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [facilityId, holidayDate]);
        return result.rows[0] || null;
    }

    /**
     * Cập nhật ngày lễ
     */
    static async update(id: string, input: UpdateHolidayInput): Promise<Holiday | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (input.title !== undefined) {
            fields.push(`title = $${paramIndex++}`);
            values.push(input.title);
        }
        if (input.is_closed !== undefined) {
            fields.push(`is_closed = $${paramIndex++}`);
            values.push(input.is_closed);
        }
        if (input.special_open_time !== undefined) {
            fields.push(`special_open_time = $${paramIndex++}`);
            values.push(input.special_open_time);
        }
        if (input.special_close_time !== undefined) {
            fields.push(`special_close_time = $${paramIndex++}`);
            values.push(input.special_close_time);
        }
        if (input.description !== undefined) {
            fields.push(`description = $${paramIndex++}`);
            values.push(input.description);
        }
        if (input.is_recurring !== undefined) {
            fields.push(`is_recurring = $${paramIndex++}`);
            values.push(input.is_recurring);
        }

        if (fields.length === 0) return this.findById(id);

        fields.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
            UPDATE facility_holidays
            SET ${fields.join(', ')}
            WHERE holiday_id = $${paramIndex} AND deleted_at IS NULL
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
            UPDATE facility_holidays SET deleted_at = NOW()
            WHERE holiday_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return (result.rowCount ?? 0) > 0;
    }
}
