import crypto from 'crypto';
import { pool } from '../../config/postgresdb';

const generateMaintenanceId = (): string =>
    `MAINT_${crypto.randomBytes(4).toString('hex')}`;

/**
 * Repository quản lý lịch bảo trì phòng.
 */
export class RoomMaintenanceRepository {

    /**
     * Kiểm tra phòng tồn tại
     */
    static async isRoomExists(roomId: string): Promise<boolean> {
        const query = `SELECT 1 FROM medical_rooms WHERE medical_rooms_id = $1 AND deleted_at IS NULL`;
        const result = await pool.query(query, [roomId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Kiểm tra lịch bảo trì chồng lấp
     */
    static async hasOverlap(roomId: string, startDate: string, endDate: string): Promise<boolean> {
        const query = `
            SELECT 1 FROM room_maintenance_schedules
            WHERE room_id = $1
              AND deleted_at IS NULL
              AND start_date <= $3::date
              AND end_date >= $2::date
            LIMIT 1
        `;
        const result = await pool.query(query, [roomId, startDate, endDate]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Tạo lịch bảo trì
     */
    static async create(
        roomId: string,
        startDate: string,
        endDate: string,
        reason: string | null,
        createdBy: string | null
    ): Promise<any> {
        const id = generateMaintenanceId();
        const query = `
            INSERT INTO room_maintenance_schedules (maintenance_id, room_id, start_date, end_date, reason, created_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const result = await pool.query(query, [id, roomId, startDate, endDate, reason, createdBy]);
        return result.rows[0];
    }

    /**
     * Lấy lịch bảo trì của 1 phòng
     */
    static async findByRoom(roomId: string): Promise<any[]> {
        const query = `
            SELECT
                ms.maintenance_id,
                ms.room_id,
                mr.name AS room_name,
                mr.code AS room_code,
                TO_CHAR(ms.start_date, 'YYYY-MM-DD') AS start_date,
                TO_CHAR(ms.end_date, 'YYYY-MM-DD') AS end_date,
                ms.reason,
                ms.created_by,
                up.full_name AS created_by_name,
                ms.created_at
            FROM room_maintenance_schedules ms
            JOIN medical_rooms mr ON ms.room_id = mr.medical_rooms_id
            LEFT JOIN user_profiles up ON ms.created_by = up.user_id
            WHERE ms.room_id = $1 AND ms.deleted_at IS NULL
            ORDER BY ms.start_date DESC
        `;
        const result = await pool.query(query, [roomId]);
        return result.rows;
    }

    /**
     * Tìm lịch bảo trì theo ID
     */
    static async findById(maintenanceId: string): Promise<any | null> {
        const query = `SELECT * FROM room_maintenance_schedules WHERE maintenance_id = $1 AND deleted_at IS NULL`;
        const result = await pool.query(query, [maintenanceId]);
        return result.rows[0] || null;
    }

    /**
     * Soft delete
     */
    static async softDelete(maintenanceId: string): Promise<boolean> {
        const query = `
            UPDATE room_maintenance_schedules SET deleted_at = CURRENT_TIMESTAMP
            WHERE maintenance_id = $1 AND deleted_at IS NULL
            RETURNING maintenance_id
        `;
        const result = await pool.query(query, [maintenanceId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * DS phòng đang/sắp bảo trì (tất cả phòng, active schedules)
     */
    static async getActiveMaintenances(): Promise<any[]> {
        const query = `
            SELECT
                ms.maintenance_id,
                ms.room_id,
                mr.name AS room_name,
                mr.code AS room_code,
                mr.branch_id,
                TO_CHAR(ms.start_date, 'YYYY-MM-DD') AS start_date,
                TO_CHAR(ms.end_date, 'YYYY-MM-DD') AS end_date,
                ms.reason,
                CASE
                    WHEN CURRENT_DATE BETWEEN ms.start_date AND ms.end_date THEN 'IN_PROGRESS'
                    WHEN ms.start_date > CURRENT_DATE THEN 'UPCOMING'
                    ELSE 'COMPLETED'
                END AS maintenance_status
            FROM room_maintenance_schedules ms
            JOIN medical_rooms mr ON ms.room_id = mr.medical_rooms_id
            WHERE ms.deleted_at IS NULL
              AND ms.end_date >= CURRENT_DATE
            ORDER BY ms.start_date ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    }
}
