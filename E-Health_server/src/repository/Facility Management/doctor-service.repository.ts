import { pool } from '../../config/postgresdb';
import { DoctorService } from '../../models/Facility Management/doctor-service.model';

export class DoctorServiceRepository {
    /**
     * Lấy danh sách dịch vụ được gán cho 1 bác sĩ
     */
    static async getServicesByDoctorId(doctorId: string): Promise<DoctorService[]> {
        const query = `
            SELECT 
                ds.doctor_id,
                ds.facility_service_id,
                ds.is_primary,
                ds.assigned_by,
                ds.created_at,
                s.code AS service_code,
                s.name AS service_name,
                s.service_group,
                fs.base_price,
                fs.insurance_price,
                fs.vip_price,
                fs.department_id
            FROM doctor_services ds
            JOIN facility_services fs ON ds.facility_service_id = fs.facility_services_id
            JOIN services s ON fs.service_id = s.services_id
            WHERE ds.doctor_id = $1 AND s.deleted_at IS NULL
            ORDER BY s.name ASC
        `;
        const result = await pool.query(query, [doctorId]);
        return result.rows;
    }

    /**
     * Lấy danh sách bác sĩ thực hiện 1 dịch vụ cơ sở
     */
    static async getDoctorsByFacilityServiceId(facilityServiceId: string): Promise<DoctorService[]> {
        const query = `
            SELECT 
                ds.doctor_id,
                ds.facility_service_id,
                ds.is_primary,
                ds.assigned_by,
                ds.created_at,
                up.full_name AS doctor_name
            FROM doctor_services ds
            JOIN doctors d ON ds.doctor_id = d.doctors_id
            JOIN users u ON d.user_id = u.users_id
            JOIN user_profiles up ON u.users_id = up.user_id
            WHERE ds.facility_service_id = $1
            ORDER BY up.full_name ASC
        `;
        const result = await pool.query(query, [facilityServiceId]);
        return result.rows;
    }

    /**
     * Kiểm tra liên kết đã tồn tại chưa
     */
    static async exists(doctorId: string, facilityServiceId: string): Promise<boolean> {
        const query = `
            SELECT 1 FROM doctor_services
            WHERE doctor_id = $1 AND facility_service_id = $2
        `;
        const result = await pool.query(query, [doctorId, facilityServiceId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Gán 1 dịch vụ cho bác sĩ
     */
    static async assign(
        doctorId: string,
        facilityServiceId: string,
        isPrimary: boolean,
        assignedBy: string
    ): Promise<DoctorService> {
        const query = `
            INSERT INTO doctor_services (doctor_id, facility_service_id, is_primary, assigned_by)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (doctor_id, facility_service_id) DO NOTHING
            RETURNING *
        `;
        const result = await pool.query(query, [doctorId, facilityServiceId, isPrimary, assignedBy]);
        return result.rows[0];
    }

    /**
     * Gỡ 1 dịch vụ khỏi bác sĩ
     */
    static async remove(doctorId: string, facilityServiceId: string): Promise<boolean> {
        const query = `
            DELETE FROM doctor_services
            WHERE doctor_id = $1 AND facility_service_id = $2
        `;
        const result = await pool.query(query, [doctorId, facilityServiceId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Gỡ toàn bộ dịch vụ khỏi bác sĩ
     */
    static async removeAllByDoctor(doctorId: string): Promise<void> {
        const query = `DELETE FROM doctor_services WHERE doctor_id = $1`;
        await pool.query(query, [doctorId]);
    }

    /**
     * Kiểm tra bác sĩ tồn tại
     */
    static async doctorExists(doctorId: string): Promise<boolean> {
        const query = `SELECT 1 FROM doctors WHERE doctors_id = $1`;
        const result = await pool.query(query, [doctorId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Kiểm tra dịch vụ cơ sở tồn tại
     */
    static async facilityServiceExists(facilityServiceId: string): Promise<boolean> {
        const query = `SELECT 1 FROM facility_services WHERE facility_services_id = $1`;
        const result = await pool.query(query, [facilityServiceId]);
        return (result.rowCount ?? 0) > 0;
    }
}
