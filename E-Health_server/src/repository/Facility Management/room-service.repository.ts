import { pool } from '../../config/postgresdb';

/**
 * Repository quản lý mapping phòng ↔ dịch vụ cơ sở.
 */
export class RoomServiceRepository {

    /**
     * Kiểm tra phòng tồn tại
     */
    static async isRoomExists(roomId: string): Promise<boolean> {
        const query = `SELECT 1 FROM medical_rooms WHERE medical_rooms_id = $1 AND deleted_at IS NULL`;
        const result = await pool.query(query, [roomId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Kiểm tra facility_service tồn tại
     */
    static async isServiceExists(facilityServiceId: string): Promise<boolean> {
        const query = `SELECT 1 FROM facility_services WHERE facility_services_id = $1`;
        const result = await pool.query(query, [facilityServiceId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Gán danh sách dịch vụ cho phòng (upsert strategy)
     */
    static async assignServices(roomId: string, facilityServiceIds: string[]): Promise<number> {
        let inserted = 0;
        for (const fsId of facilityServiceIds) {
            const query = `
                INSERT INTO room_services (room_id, facility_service_id)
                VALUES ($1, $2)
                ON CONFLICT (room_id, facility_service_id) DO NOTHING
            `;
            const result = await pool.query(query, [roomId, fsId]);
            inserted += result.rowCount ?? 0;
        }
        return inserted;
    }

    /**
     * Lấy danh sách dịch vụ đã gán cho phòng
     */
    static async getServicesByRoom(roomId: string): Promise<any[]> {
        const query = `
            SELECT
                rs.facility_service_id,
                fs.service_id,
                s.name AS service_name,
                s.code AS service_code,
                fs.base_price,
                rs.created_at
            FROM room_services rs
            JOIN facility_services fs ON rs.facility_service_id = fs.facility_services_id
            JOIN services s ON fs.service_id = s.services_id
            WHERE rs.room_id = $1
            ORDER BY s.name ASC
        `;
        const result = await pool.query(query, [roomId]);
        return result.rows;
    }

    /**
     * Gỡ 1 dịch vụ khỏi phòng
     */
    static async removeService(roomId: string, facilityServiceId: string): Promise<boolean> {
        const query = `DELETE FROM room_services WHERE room_id = $1 AND facility_service_id = $2`;
        const result = await pool.query(query, [roomId, facilityServiceId]);
        return (result.rowCount ?? 0) > 0;
    }
}
