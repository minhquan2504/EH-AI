import { pool } from '../../config/postgresdb';

/**
 * Kết quả trả về cho danh sách thời lượng khám
 */
export interface ServiceDurationRow {
    facility_services_id: string;
    service_code: string;
    service_name: string;
    estimated_duration_minutes: number;
    is_active: boolean;
}


export class ConsultationDurationRepository {

    /**
     * Lấy danh sách thời lượng khám tất cả dịch vụ tại cơ sở
     */
    static async getServiceDurations(
        facilityId: string,
        isActive?: boolean,
        search?: string
    ): Promise<ServiceDurationRow[]> {
        const conditions: string[] = ['fs.facility_id = $1', 's.deleted_at IS NULL'];
        const params: any[] = [facilityId];
        let paramIdx = 2;

        if (isActive !== undefined) {
            conditions.push(`fs.is_active = $${paramIdx}`);
            params.push(isActive);
            paramIdx++;
        }

        if (search) {
            conditions.push(`(s.code ILIKE $${paramIdx} OR s.name ILIKE $${paramIdx})`);
            params.push(`%${search}%`);
            paramIdx++;
        }

        const query = `
            SELECT
                fs.facility_services_id,
                s.code AS service_code,
                s.name AS service_name,
                fs.estimated_duration_minutes,
                fs.is_active
            FROM facility_services fs
            JOIN services s ON fs.service_id = s.services_id
            WHERE ${conditions.join(' AND ')}
            ORDER BY s.name ASC
        `;

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Cập nhật thời lượng khám cho 1 dịch vụ cơ sở
     */
    static async updateDuration(facilityServiceId: string, durationMinutes: number): Promise<ServiceDurationRow | null> {
        const query = `
            UPDATE facility_services
            SET estimated_duration_minutes = $2
            WHERE facility_services_id = $1
            RETURNING facility_services_id
        `;
        const result = await pool.query(query, [facilityServiceId, durationMinutes]);
        if (!result.rowCount) return null;

        return this.getOneById(facilityServiceId);
    }

    /**
     * Batch cập nhật thời lượng khám (dùng Transaction)
     */
    static async batchUpdateDurations(
        updates: Array<{ facility_service_id: string; estimated_duration_minutes: number }>
    ): Promise<number> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            let updatedCount = 0;
            for (const item of updates) {
                const result = await client.query(
                    `UPDATE facility_services SET estimated_duration_minutes = $2 WHERE facility_services_id = $1`,
                    [item.facility_service_id, item.estimated_duration_minutes]
                );
                if (result.rowCount && result.rowCount > 0) updatedCount++;
            }

            await client.query('COMMIT');
            return updatedCount;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Lấy thông tin 1 dịch vụ cơ sở kèm tên
     */
    static async getOneById(facilityServiceId: string): Promise<ServiceDurationRow | null> {
        const query = `
            SELECT
                fs.facility_services_id,
                s.code AS service_code,
                s.name AS service_name,
                fs.estimated_duration_minutes,
                fs.is_active
            FROM facility_services fs
            JOIN services s ON fs.service_id = s.services_id
            WHERE fs.facility_services_id = $1 AND s.deleted_at IS NULL
        `;
        const result = await pool.query(query, [facilityServiceId]);
        return result.rows[0] || null;
    }

    /**
     * Kiểm tra facility_service có thuộc facility_id không
     */
    static async belongsToFacility(facilityServiceId: string, facilityId: string): Promise<boolean> {
        const query = `SELECT 1 FROM facility_services WHERE facility_services_id = $1 AND facility_id = $2`;
        const result = await pool.query(query, [facilityServiceId, facilityId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Kiểm tra cơ sở tồn tại
     */
    static async checkFacilityExists(facilityId: string): Promise<boolean> {
        const query = `SELECT 1 FROM facilities WHERE facilities_id = $1`;
        const result = await pool.query(query, [facilityId]);
        return (result.rowCount ?? 0) > 0;
    }
}
