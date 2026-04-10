import { pool } from '../../config/postgresdb';
import { BranchInfo, BranchDropdown } from '../../models/Facility Management/branch.model';
import { SYSTEM_ERRORS } from '../../constants/system.constant';

export class BranchRepository {
    /**
     * Lấy danh sách Chi nhánh (Phân trang và filter)
     */
    static async findAllBranches(
        search: string | undefined,
        facility_id: string | undefined,
        status: string | undefined,
        offset: number,
        limit: number
    ): Promise<{ branches: BranchInfo[], total: number }> {
        let options: string[] = ['b.deleted_at IS NULL'];
        const values: any[] = [];
        let paramCount = 1;

        if (search) {
            options.push(`(b.code ILIKE $${paramCount} OR b.name ILIKE $${paramCount} OR b.phone ILIKE $${paramCount} OR b.address ILIKE $${paramCount})`);
            values.push(`%${search}%`);
            paramCount++;
        }

        if (facility_id) {
            options.push(`b.facility_id = $${paramCount}`);
            values.push(facility_id);
            paramCount++;
        }

        if (status) {
            options.push(`b.status = $${paramCount}`);
            values.push(status);
            paramCount++;
        }

        const whereClause = options.length > 0 ? `WHERE ${options.join(' AND ')}` : '';

        const countQuery = `SELECT COUNT(*) FROM branches b ${whereClause}`;
        const countResult = await pool.query(countQuery, values);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT b.branches_id, b.facility_id, b.code, b.name, b.address, 
                   b.phone, b.status, b.established_date, b.deleted_at, f.name as facility_name
            FROM branches b
            LEFT JOIN facilities f ON b.facility_id = f.facilities_id
            ${whereClause}
            ORDER BY b.established_date DESC NULLS LAST
            LIMIT $${paramCount} OFFSET $${paramCount + 1}
        `;
        const dataResult = await pool.query(dataQuery, [...values, limit, offset]);

        return { branches: dataResult.rows, total };
    }

    /**
     * Lấy danh sách chi nhánh dùng cho Select/Dropdown
     */
    static async getBranchesForDropdown(): Promise<BranchDropdown[]> {
        const query = `
            SELECT branches_id, facility_id, code, name
            FROM branches
            WHERE status = 'ACTIVE' AND deleted_at IS NULL
            ORDER BY name ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    /**
     * Lấy chi tiết 1 chi nhánh
     */
    static async findBranchById(id: string): Promise<BranchInfo | null> {
        const query = `
            SELECT b.branches_id, b.facility_id, b.code, b.name, b.address, 
                   b.phone, b.status, b.established_date, b.deleted_at, f.name as facility_name
            FROM branches b
            LEFT JOIN facilities f ON b.facility_id = f.facilities_id
            WHERE b.branches_id = $1 AND b.deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] ?? null;
    }

    /**
     * Dùng để check unique branch code
     */
    static async findBranchByCode(code: string): Promise<BranchInfo | null> {
        const query = `SELECT branches_id, code FROM branches WHERE code = $1 AND deleted_at IS NULL`;
        const result = await pool.query(query, [code]);
        return result.rows[0] ?? null;
    }

    /**
     * Tạo mới chi nhánh
     */
    static async createBranch(data: {
        id: string; facility_id: string; code: string; name: string;
        address: string; phone?: string; established_date?: string; status: string;
    }): Promise<void> {
        const query = `
            INSERT INTO branches 
            (branches_id, facility_id, code, name, address, phone, established_date, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        await pool.query(query, [
            data.id, data.facility_id, data.code, data.name, data.address,
            data.phone || null, data.established_date || null, data.status
        ]);
    }

    /**
     * Cập nhật thông tin chi nhánh
     */
    static async updateBranchInfo(id: string, updates: Record<string, any>): Promise<BranchInfo> {
        const setClauses: string[] = [];
        const values: any[] = [];
        let index = 2;

        for (const [key, value] of Object.entries(updates)) {
            setClauses.push(`${key} = $${index}`);
            values.push(value);
            index++;
        }

        const query = `
            UPDATE branches
            SET ${setClauses.join(', ')}
            WHERE branches_id = $1 AND deleted_at IS NULL
            RETURNING branches_id, facility_id, code, name, address, phone, status, established_date
        `;

        const result = await pool.query(query, [id, ...values]);
        if (result.rowCount === 0) throw new Error('Chi nhánh không tồn tại hoặc đã bị xóa');
        return result.rows[0];
    }

    /**
     * Cập nhật trạng thái
     */
    static async updateBranchStatus(id: string, status: string): Promise<void> {
        const query = `
            UPDATE branches 
            SET status = $1
            WHERE branches_id = $2 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [status, id]);
        if (result.rowCount === 0) throw new Error('Chi nhánh không tồn tại hoặc đã bị xóa');
    }

    /**
     * Xóa mềm chi nhánh
     */
    static async deleteBranch(id: string): Promise<void> {
        const query = `
            UPDATE branches 
            SET deleted_at = CURRENT_TIMESTAMP
            WHERE branches_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        if (result.rowCount === 0) throw new Error('Chi nhánh không tồn tại hoặc đã bị xóa');
    }
}
