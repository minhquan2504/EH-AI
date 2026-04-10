import { pool } from '../../config/postgresdb';
import { SpecialtyService } from '../../models/Facility Management/specialty-service.model';

export class SpecialtyServiceRepository {
    /**
     * Lấy danh sách dịch vụ đã gán cho 1 chuyên khoa
     */
    static async getServicesBySpecialtyId(specialtyId: string): Promise<SpecialtyService[]> {
        const query = `
            SELECT 
                ss.specialty_id,
                ss.service_id,
                ss.created_at,
                s.code AS service_code,
                s.name AS service_name,
                s.service_group,
                s.service_type
            FROM specialty_services ss
            JOIN services s ON ss.service_id = s.services_id
            WHERE ss.specialty_id = $1 AND s.deleted_at IS NULL
            ORDER BY s.name ASC
        `;
        const result = await pool.query(query, [specialtyId]);
        return result.rows;
    }

    /**
     * Lấy danh sách chuyên khoa đã gán cho 1 dịch vụ
     */
    static async getSpecialtiesByServiceId(serviceId: string): Promise<SpecialtyService[]> {
        const query = `
            SELECT 
                ss.specialty_id,
                ss.service_id,
                ss.created_at,
                sp.code AS specialty_code,
                sp.name AS specialty_name
            FROM specialty_services ss
            JOIN specialties sp ON ss.specialty_id = sp.specialties_id
            WHERE ss.service_id = $1
            ORDER BY sp.name ASC
        `;
        const result = await pool.query(query, [serviceId]);
        return result.rows;
    }

    /**
     * Kiểm tra liên kết đã tồn tại chưa
     */
    static async exists(specialtyId: string, serviceId: string): Promise<boolean> {
        const query = `
            SELECT 1 FROM specialty_services
            WHERE specialty_id = $1 AND service_id = $2
        `;
        const result = await pool.query(query, [specialtyId, serviceId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Gán 1 dịch vụ vào chuyên khoa
     */
    static async assign(specialtyId: string, serviceId: string): Promise<SpecialtyService> {
        const query = `
            INSERT INTO specialty_services (specialty_id, service_id)
            VALUES ($1, $2)
            ON CONFLICT (specialty_id, service_id) DO NOTHING
            RETURNING *
        `;
        const result = await pool.query(query, [specialtyId, serviceId]);
        return result.rows[0];
    }

    /**
     * Gỡ 1 dịch vụ khỏi chuyên khoa
     */
    static async remove(specialtyId: string, serviceId: string): Promise<boolean> {
        const query = `
            DELETE FROM specialty_services
            WHERE specialty_id = $1 AND service_id = $2
        `;
        const result = await pool.query(query, [specialtyId, serviceId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Gỡ toàn bộ dịch vụ khỏi chuyên khoa (Dùng cho reset & gán lại)
     */
    static async removeAllBySpecialty(specialtyId: string): Promise<void> {
        const query = `DELETE FROM specialty_services WHERE specialty_id = $1`;
        await pool.query(query, [specialtyId]);
    }

    /**
     * Kiểm tra chuyên khoa tồn tại
     */
    static async specialtyExists(specialtyId: string): Promise<boolean> {
        const query = `SELECT 1 FROM specialties WHERE specialties_id = $1`;
        const result = await pool.query(query, [specialtyId]);
        return (result.rowCount ?? 0) > 0;
    }
}
