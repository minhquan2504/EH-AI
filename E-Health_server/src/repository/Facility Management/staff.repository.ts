import { pool } from '../../config/postgresdb';
import { AppError } from '../../utils/app-error.util';

export class StaffRepository {
    /**
     * Lấy danh sách nhân sự y tế (Có phân trang và bộ lọc)
     */
    static async getStaffs(filter: any) {
        const page = filter.page || 1;
        const limit = filter.limit || 10;
        const offset = (page - 1) * limit;

        let queryParams: any[] = [];
        let whereClauses: string[] = ['u.deleted_at IS NULL'];

        if (filter.role) {
            // Lọc theo param role được truyền vào
            queryParams.push(filter.role);
            whereClauses.push(`
                EXISTS (
                    SELECT 1 FROM user_roles ur2 
                    JOIN roles r2 ON ur2.role_id = r2.roles_id 
                    WHERE ur2.user_id = u.users_id AND r2.code = $${queryParams.length}
                )
            `);
        } else {
            // Lọc lấy nhân viên (Bác sĩ, y tá, dược sĩ, staff, admin...)
            const internalRoles = ['DOCTOR', 'NURSE', 'PHARMACIST', 'STAFF', 'ADMIN', 'SUPER_ADMIN'];
            queryParams.push(internalRoles);
            whereClauses.push(`
                EXISTS (
                    SELECT 1 FROM user_roles ur2 
                    JOIN roles r2 ON ur2.role_id = r2.roles_id 
                    WHERE ur2.user_id = u.users_id AND r2.code = ANY($${queryParams.length}::varchar[])
                )
            `);
        }

        if (filter.search) {
            queryParams.push(`%${filter.search}%`);
            whereClauses.push(`(u.email ILIKE $${queryParams.length} OR u.phone_number ILIKE $${queryParams.length} OR up.full_name ILIKE $${queryParams.length})`);
        }

        if (filter.status) {
            queryParams.push(filter.status);
            whereClauses.push(`u.status = $${queryParams.length}`);
        }

        if (filter.branch_id) {
            queryParams.push(filter.branch_id);
            whereClauses.push(`ubd.branch_id = $${queryParams.length}`);
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Đếm tổng số lượng
        const countQuery = `
            SELECT COUNT(DISTINCT u.users_id) as total
            FROM users u
            LEFT JOIN user_profiles up ON u.users_id = up.user_id
            LEFT JOIN user_branch_dept ubd ON u.users_id = ubd.user_id
            ${whereString}
        `;
        const countResult = await pool.query(countQuery, queryParams);
        const total = parseInt(countResult.rows[0].total, 10);

        // Lấy data
        queryParams.push(limit);
        const limitParamIdx = queryParams.length;
        queryParams.push(offset);
        const offsetParamIdx = queryParams.length;

        const dataQuery = `
            SELECT 
                u.users_id, 
                u.email, 
                u.phone_number AS phone, 
                u.status, 
                u.created_at, 
                u.updated_at,
                COALESCE(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles,
                up.user_profiles_id,
                up.full_name,
                up.dob,
                up.gender,
                up.avatar_url,
                d.title as doctor_title,
                sp.name as specialty_name,
                f.name as facility_name
            FROM users u
            LEFT JOIN user_profiles up ON u.users_id = up.user_id
            LEFT JOIN user_roles ur ON u.users_id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.roles_id
            LEFT JOIN doctors d ON u.users_id = d.user_id
            LEFT JOIN specialties sp ON d.specialty_id = sp.specialties_id
            LEFT JOIN user_branch_dept ubd ON u.users_id = ubd.user_id
            LEFT JOIN branches b ON ubd.branch_id = b.branches_id
            LEFT JOIN facilities f ON b.facility_id = f.facilities_id
            ${whereString}
            GROUP BY u.users_id, up.user_profiles_id, d.title, sp.name, f.name
            ORDER BY u.created_at DESC
            LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}
        `;

        const result = await pool.query(dataQuery, queryParams);

        return {
            items: result.rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * Lấy chi tiết một nhân sự
     */
    static async getStaffById(userId: string) {
        const query = `
            SELECT 
                u.users_id, 
                u.email, 
                u.phone_number AS phone, 
                u.status, 
                u.created_at, 
                u.updated_at,
                COALESCE(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles,
                up.user_profiles_id,
                up.full_name,
                up.dob,
                up.gender,
                up.identity_card_number,
                up.avatar_url,
                up.address,
                up.signature_url,
                d.doctors_id,
                d.title as doctor_title,
                d.biography,
                d.consultation_fee,
                d.specialty_id,
                sp.name as specialty_name
            FROM users u
            LEFT JOIN user_profiles up ON u.users_id = up.user_id
            LEFT JOIN user_roles ur ON u.users_id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.roles_id
            LEFT JOIN doctors d ON u.users_id = d.user_id
            LEFT JOIN specialties sp ON d.specialty_id = sp.specialties_id
            WHERE u.users_id = $1 AND u.deleted_at IS NULL
            GROUP BY u.users_id, up.user_profiles_id, d.doctors_id, sp.name
        `;

        const result = await pool.query(query, [userId]);
        if (result.rowCount === 0) return null;

        const row = result.rows[0];

        // Lấy thêm danh sách
        const facilityQuery = `
            SELECT ubd.user_branch_dept_id, ubd.branch_id, b.name as branch_name, 
                   ubd.department_id, dp.name as department_name, 
                   ubd.role_title, f.name as facility_name
            FROM user_branch_dept ubd
            JOIN branches b ON ubd.branch_id = b.branches_id
            JOIN facilities f ON b.facility_id = f.facilities_id
            LEFT JOIN departments dp ON ubd.department_id = dp.departments_id
            WHERE ubd.user_id = $1
        `;
        const facilityResult = await pool.query(facilityQuery, [userId]);

        return {
            ...row,
            facilities: facilityResult.rows
        };
    }

    /**
     * Cập nhật URL ảnh chữ ký
     */
    static async updateSignature(userId: string, signatureUrl: string | null): Promise<boolean> {
        const query = `
            UPDATE user_profiles 
            SET signature_url = $1
            WHERE user_id = $2
        `;
        const result = await pool.query(query, [signatureUrl, userId]);
        return (result.rowCount ?? 0) > 0;
    }
}
