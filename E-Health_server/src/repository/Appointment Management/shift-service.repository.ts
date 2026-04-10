import crypto from 'crypto';
import { pool } from '../../config/postgresdb';
import { ShiftService } from '../../models/Appointment Management/shift-service.model';

/**
 * Sinh ID duy nhất: SHSV_xxxxxxxx
 */
const generateShiftServiceId = (): string =>
    `SHSV_${crypto.randomBytes(4).toString('hex')}`;

/**
 * Repository quản lý liên kết ca làm việc – dịch vụ cơ sở.
 */
export class ShiftServiceRepository {

    /**
     * Tạo 1 liên kết ca-dịch vụ
     */
    static async create(shiftId: string, facilityServiceId: string): Promise<ShiftService> {
        const id = generateShiftServiceId();
        const query = `
            INSERT INTO shift_services (shift_service_id, shift_id, facility_service_id)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const result = await pool.query(query, [id, shiftId, facilityServiceId]);
        return result.rows[0];
    }

    /**
     * Tạo hàng loạt liên kết (bỏ qua đã tồn tại)
     */
    static async bulkCreate(shiftId: string, facilityServiceIds: string[]): Promise<ShiftService[]> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const results: ShiftService[] = [];

            for (const fsId of facilityServiceIds) {
                const id = generateShiftServiceId();
                const query = `
                    INSERT INTO shift_services (shift_service_id, shift_id, facility_service_id)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (shift_id, facility_service_id) DO NOTHING
                    RETURNING *
                `;
                const result = await client.query(query, [id, shiftId, fsId]);
                if (result.rows[0]) {
                    results.push(result.rows[0]);
                }
            }

            await client.query('COMMIT');
            return results;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Lấy danh sách liên kết (filter shift_id, facility_service_id)
     */
    static async findAll(shiftId?: string, facilityServiceId?: string): Promise<ShiftService[]> {
        const conditions: string[] = [];
        const params: any[] = [];
        let paramIdx = 1;

        if (shiftId) {
            conditions.push(`ss.shift_id = $${paramIdx}`);
            params.push(shiftId);
            paramIdx++;
        }

        if (facilityServiceId) {
            conditions.push(`ss.facility_service_id = $${paramIdx}`);
            params.push(facilityServiceId);
            paramIdx++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            SELECT
                ss.shift_service_id,
                ss.shift_id,
                ss.facility_service_id,
                ss.is_active,
                ss.created_at,
                ss.updated_at,
                sh.code AS shift_code,
                sh.name AS shift_name,
                sh.start_time,
                sh.end_time,
                sv.code AS service_code,
                sv.name AS service_name,
                fs.base_price,
                fs.estimated_duration_minutes
            FROM shift_services ss
            JOIN shifts sh ON ss.shift_id = sh.shifts_id
            JOIN facility_services fs ON ss.facility_service_id = fs.facility_services_id
            JOIN services sv ON fs.service_id = sv.services_id
            ${whereClause}
            ORDER BY sh.start_time ASC, sv.name ASC
        `;

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Lấy danh sách dịch vụ thuộc 1 ca (by shift)
     */
    static async findByShift(shiftId: string): Promise<ShiftService[]> {
        return this.findAll(shiftId, undefined);
    }

    /**
     * Lấy danh sách ca khám hỗ trợ 1 dịch vụ (by service)
     */
    static async findByService(facilityServiceId: string): Promise<ShiftService[]> {
        return this.findAll(undefined, facilityServiceId);
    }

    /**
     * Tìm liên kết theo ID
     */
    static async findById(shiftServiceId: string): Promise<ShiftService | null> {
        const query = `SELECT * FROM shift_services WHERE shift_service_id = $1`;
        const result = await pool.query(query, [shiftServiceId]);
        return result.rows[0] || null;
    }

    /**
     * Xoá liên kết (hard delete vì bảng join)
     */
    static async delete(shiftServiceId: string): Promise<boolean> {
        const query = `DELETE FROM shift_services WHERE shift_service_id = $1 RETURNING shift_service_id`;
        const result = await pool.query(query, [shiftServiceId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Bật/tắt liên kết
     */
    static async toggleActive(shiftServiceId: string, isActive: boolean): Promise<ShiftService | null> {
        const query = `
            UPDATE shift_services
            SET is_active = $2, updated_at = CURRENT_TIMESTAMP
            WHERE shift_service_id = $1
            RETURNING *
        `;
        const result = await pool.query(query, [shiftServiceId, isActive]);
        return result.rows[0] || null;
    }

    /**
     * Kiểm tra shift tồn tại và active
     */
    static async isShiftActive(shiftId: string): Promise<boolean> {
        const query = `SELECT 1 FROM shifts WHERE shifts_id = $1 AND status = 'ACTIVE' AND deleted_at IS NULL`;
        const result = await pool.query(query, [shiftId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Kiểm tra facility_service tồn tại và active
     */
    static async isFacilityServiceActive(facilityServiceId: string): Promise<boolean> {
        const query = `SELECT 1 FROM facility_services WHERE facility_services_id = $1 AND is_active = true`;
        const result = await pool.query(query, [facilityServiceId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Kiểm tra mapping đã tồn tại chưa
     */
    static async mappingExists(shiftId: string, facilityServiceId: string): Promise<boolean> {
        const query = `SELECT 1 FROM shift_services WHERE shift_id = $1 AND facility_service_id = $2`;
        const result = await pool.query(query, [shiftId, facilityServiceId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Lấy danh sách shift_id có mapping với facility_service_id (dùng cho filter available slots)
     */
    static async getShiftIdsByService(facilityServiceId: string): Promise<string[]> {
        const query = `
            SELECT shift_id FROM shift_services
            WHERE facility_service_id = $1 AND is_active = true
        `;
        const result = await pool.query(query, [facilityServiceId]);
        return result.rows.map((r: any) => r.shift_id);
    }
}
