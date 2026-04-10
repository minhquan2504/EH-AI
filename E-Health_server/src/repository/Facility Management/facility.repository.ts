import { pool } from '../../config/postgresdb';
import { FacilityDropdown, FacilityInfo, UpdateFacilityInfoInput } from '../../models/Facility Management/facility.model';
import { SYSTEM_ERRORS } from '../../constants/system.constant';

export class FacilityRepository {
    /**
     * Lấy danh sách cơ sở y tế (Facilities) cho Dropdown
     */
    static async getFacilitiesForDropdown(): Promise<FacilityDropdown[]> {
        const query = `
            SELECT facilities_id, code, name
            FROM facilities
            WHERE status = 'ACTIVE' AND deleted_at IS NULL
            ORDER BY name ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    /**
     * Lấy thông tin chi tiết cơ sở y tế chính của hệ thống.
     */
    static async getFacilityInfo(): Promise<FacilityInfo | null> {
        const query = `
            SELECT facilities_id, code, name, tax_code, email, phone,
                   website, logo_url, headquarters_address, status, updated_at, deleted_at
            FROM facilities
            WHERE status = 'ACTIVE' AND deleted_at IS NULL
            ORDER BY created_at ASC
            LIMIT 1
        `;
        const result = await pool.query(query);
        return result.rows[0] ?? null;
    }

    /**
     * Cập nhật thông tin tổng quat cơ sở y tế theo ID.
     */
    static async updateFacilityInfo(id: string, input: UpdateFacilityInfoInput): Promise<FacilityInfo> {
        const fields = Object.keys(input) as (keyof UpdateFacilityInfoInput)[];

        const setClauses = fields.map((field, idx) => `${field} = $${idx + 2}`).join(', ');
        const values = fields.map(field => input[field]);

        const query = `
            UPDATE facilities
            SET ${setClauses}, updated_at = CURRENT_TIMESTAMP
            WHERE facilities_id = $1 AND deleted_at IS NULL
            RETURNING facilities_id, code, name, tax_code, email, phone,
                      website, logo_url, headquarters_address, status, updated_at, deleted_at
        `;

        const result = await pool.query(query, [id, ...values]);

        if (result.rowCount === 0) {
            throw SYSTEM_ERRORS.FACILITY_NOT_FOUND;
        }
        return result.rows[0];
    }

    /**
     * Cập nhật đường dẫn logo sau khi upload lên Cloudinary thành công.
     */
    static async updateFacilityLogo(id: string, logoUrl: string): Promise<void> {
        const query = `
            UPDATE facilities
            SET logo_url = $2, updated_at = CURRENT_TIMESTAMP
            WHERE facilities_id = $1 AND deleted_at IS NULL
        `;
        await pool.query(query, [id, logoUrl]);
    }


    /**
     * Lấy danh sách cơ sở y tế (Phân trang và filter)
     */
    static async findAllFacilities(
        search: string | undefined,
        status: string | undefined,
        offset: number,
        limit: number
    ): Promise<{ facilities: FacilityInfo[], total: number }> {
        let options: string[] = ['deleted_at IS NULL'];
        const values: any[] = [];
        let paramCount = 1;

        if (search) {
            options.push(`(code ILIKE $${paramCount} OR name ILIKE $${paramCount} OR phone ILIKE $${paramCount} OR email ILIKE $${paramCount} OR tax_code ILIKE $${paramCount})`);
            values.push(`%${search}%`);
            paramCount++;
        }

        if (status) {
            options.push(`status = $${paramCount}`);
            values.push(status);
            paramCount++;
        }

        const whereClause = options.length > 0 ? `WHERE ${options.join(' AND ')}` : '';

        const countQuery = `SELECT COUNT(*) FROM facilities ${whereClause}`;
        const countResult = await pool.query(countQuery, values);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT facilities_id, code, name, tax_code, email, phone, 
                   website, logo_url, headquarters_address, status, updated_at, deleted_at
            FROM facilities
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramCount} OFFSET $${paramCount + 1}
        `;
        const dataResult = await pool.query(dataQuery, [...values, limit, offset]);

        return { facilities: dataResult.rows, total };
    }

    /**
     * Lấy chi tiết cơ sở y tế bằng ID
     */
    static async findFacilityById(id: string): Promise<FacilityInfo | null> {
        const query = `
            SELECT facilities_id, code, name, tax_code, email, phone, 
                   website, logo_url, headquarters_address, status, updated_at, deleted_at
            FROM facilities
            WHERE facilities_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] ?? null;
    }

    /**
     * Tìm cơ sở theo mã code (phục vụ check code duplicate)
     */
    static async findFacilityByCode(code: string): Promise<FacilityInfo | null> {
        const query = `SELECT facilities_id, code FROM facilities WHERE code = $1 AND deleted_at IS NULL`;
        const result = await pool.query(query, [code]);
        return result.rows[0] ?? null;
    }

    /**
     * Tạo mới cơ sở y tế
     */
    static async createFacility(data: { id: string, code: string, name: string, tax_code?: string, email?: string, phone?: string, website?: string, headquarters_address?: string, status: string, logo_url?: string }): Promise<void> {
        const query = `
            INSERT INTO facilities 
            (facilities_id, code, name, tax_code, email, phone, website, headquarters_address, status, logo_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;
        await pool.query(query, [data.id, data.code, data.name, data.tax_code || null, data.email || null, data.phone || null, data.website || null, data.headquarters_address || null, data.status, data.logo_url || null]);
    }

    /**
     * Cập nhật trạng thái
     */
    static async updateFacilityStatus(id: string, status: string): Promise<void> {
        const query = `
            UPDATE facilities 
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE facilities_id = $2 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [status, id]);
        if (result.rowCount === 0) throw SYSTEM_ERRORS.FACILITY_NOT_FOUND;
    }

    /**
     * Xóa mềm
     */
    static async deleteFacility(id: string): Promise<void> {
        const query = `
            UPDATE facilities 
            SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE facilities_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        if (result.rowCount === 0) throw SYSTEM_ERRORS.FACILITY_NOT_FOUND;
    }
}
