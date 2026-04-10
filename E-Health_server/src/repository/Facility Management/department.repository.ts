import { pool } from '../../config/postgresdb';
import { DepartmentDropdown, DepartmentInfo, CreateDepartmentInput, UpdateDepartmentInput, DepartmentQuery } from '../../models/Facility Management/department.model';

export class DepartmentRepository {
    /*
    / Tìm kiếm và lấy danh sách khoa/phòng ban
    */
    static async findAllDepartments(queryOptions: DepartmentQuery): Promise<{ data: DepartmentInfo[], total: number }> {
        const { page = 1, limit = 10, search, branch_id, status } = queryOptions;
        const offset = (page - 1) * limit;

        let queryParams: any[] = [];
        let whereClauses = ['d.deleted_at IS NULL'];

        if (search) {
            whereClauses.push(`(d.name ILIKE $${queryParams.length + 1} OR d.code ILIKE $${queryParams.length + 1})`);
            queryParams.push(`%${search}%`);
        }

        if (branch_id) {
            whereClauses.push(`d.branch_id = $${queryParams.length + 1}`);
            queryParams.push(branch_id);
        }

        if (status) {
            whereClauses.push(`d.status = $${queryParams.length + 1}`);
            queryParams.push(status);
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const query = `
            SELECT d.departments_id, d.branch_id, d.code, d.name, d.description, d.status,
                   b.name as branch_name, f.name as facility_name
            FROM departments d
            INNER JOIN branches b ON d.branch_id = b.branches_id
            INNER JOIN facilities f ON b.facility_id = f.facilities_id
            ${whereString}
            ORDER BY d.code ASC
            LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
        `;

        const countQuery = `
            SELECT COUNT(*) 
            FROM departments d
            ${whereString}
        `;

        const [dataResult, countResult] = await Promise.all([
            pool.query(query, [...queryParams, limit, offset]),
            pool.query(countQuery, queryParams)
        ]);

        return {
            data: dataResult.rows,
            total: parseInt(countResult.rows[0].count, 10)
        };
    }

    /*
    / Lấy danh sách khoa/phòng ban cho dropdown
    */

    static async getDepartmentsForDropdown(branch_id: string): Promise<DepartmentDropdown[]> {
        const query = `
            SELECT departments_id, branch_id, code, name
            FROM departments
            WHERE branch_id = $1 AND status = 'ACTIVE' AND deleted_at IS NULL
            ORDER BY name ASC
        `;
        const result = await pool.query(query, [branch_id]);
        return result.rows;
    }

    /*
    / Kiểm tra mã khoa/phòng ban đã tồn tại trong chi nhánh
    */

    static async checkDepartmentCodeExistsInBranch(code: string, branch_id: string): Promise<boolean> {
        const query = `
            SELECT 1 FROM departments 
            WHERE code = $1 AND branch_id = $2 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [code, branch_id]);
        return (result.rowCount ?? 0) > 0;
    }

    /*
    / Tìm kiếm khoa/phòng ban theo ID
    */

    static async findDepartmentById(id: string): Promise<DepartmentInfo | null> {
        const query = `
            SELECT d.*, b.name as branch_name, f.name as facility_name
            FROM departments d
            INNER JOIN branches b ON d.branch_id = b.branches_id
            INNER JOIN facilities f ON b.facility_id = f.facilities_id
            WHERE d.departments_id = $1 AND d.deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }


    /*
    / Tạo khoa/phòng ban
    */
    static async createDepartment(data: CreateDepartmentInput & { departments_id: string }): Promise<void> {
        const query = `
            INSERT INTO departments (departments_id, branch_id, code, name, description)
            VALUES ($1, $2, $3, $4, $5)
        `;
        const values = [data.departments_id, data.branch_id, data.code, data.name, data.description || null];
        await pool.query(query, values);
    }



    /*
    / Cập nhật thông tin khoa/phòng ban
    */
    static async updateDepartmentInfo(id: string, updates: UpdateDepartmentInput): Promise<DepartmentInfo> {
        const setClauses: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (updates.name !== undefined) {
            setClauses.push(`name = $${index++}`);
            values.push(updates.name);
        }
        if (updates.description !== undefined) {
            setClauses.push(`description = $${index++}`);
            values.push(updates.description);
        }

        if (setClauses.length === 0) {
            const current = await this.findDepartmentById(id);
            if (!current) throw new Error('Khoa/Phòng ban không tồn tại hoặc đã bị xóa');
            return current;
        }

        const query = `
            UPDATE departments
            SET ${setClauses.join(', ')}
            WHERE departments_id = $${index} AND deleted_at IS NULL
            RETURNING *
        `;

        const result = await pool.query(query, [...values, id]);
        if ((result.rowCount ?? 0) === 0) throw new Error('Khoa/Phòng ban không tồn tại hoặc đã bị xóa');
        return result.rows[0];
    }



    /*
    / Cập nhật trạng thái khoa/phòng ban
    */
    static async updateDepartmentStatus(id: string, status: string): Promise<void> {
        const query = `
            UPDATE departments
            SET status = $1
            WHERE departments_id = $2 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [status, id]);
        if ((result.rowCount ?? 0) === 0) throw new Error('Khoa/Phòng ban không tồn tại hoặc đã bị xóa');
    }


    /*
    / Xóa khoa/phòng ban
    */
    static async deleteDepartment(id: string): Promise<void> {
        const query = `
            UPDATE departments
            SET deleted_at = CURRENT_TIMESTAMP
            WHERE departments_id = $1 AND deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        if ((result.rowCount ?? 0) === 0) throw new Error('Khoa/Phòng ban không tồn tại hoặc đã bị xóa');
    }
}
