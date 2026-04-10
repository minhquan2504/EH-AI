import { pool } from '../../config/postgresdb';
import {
    Bed,
    CreateBedInput,
    UpdateBedInput,
    PaginatedBeds
} from '../../models/Facility Management/bed.model';

export class BedRepository {
    /**
     * Lấy danh sách giường bệnh có phân trang, tìm kiếm, lọc
     */
    static async getBeds(
        facilityId?: string,
        branchId?: string,
        departmentId?: string,
        roomId?: string,
        type?: string,
        status?: string,
        search?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedBeds> {
        let whereClause = 'WHERE b.deleted_at IS NULL';
        const params: any[] = [];
        let paramIndex = 1;

        if (facilityId) {
            whereClause += ` AND b.facility_id = $${paramIndex++}`;
            params.push(facilityId);
        }
        if (branchId) {
            whereClause += ` AND b.branch_id = $${paramIndex++}`;
            params.push(branchId);
        }
        if (departmentId) {
            whereClause += ` AND b.department_id = $${paramIndex++}`;
            params.push(departmentId);
        }
        if (roomId) {
            whereClause += ` AND b.room_id = $${paramIndex++}`;
            params.push(roomId);
        }
        if (type) {
            whereClause += ` AND b.type = $${paramIndex++}`;
            params.push(type);
        }
        if (status) {
            whereClause += ` AND b.status = $${paramIndex++}`;
            params.push(status);
        }
        if (search) {
            whereClause += ` AND (b.name ILIKE $${paramIndex} OR b.code ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        // Count
        const countQuery = `SELECT COUNT(*) FROM beds b ${whereClause}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Data
        const offset = (page - 1) * limit;
        const dataQuery = `
            SELECT b.*,
                   f.name AS facility_name,
                   br.name AS branch_name,
                   d.name AS department_name,
                   mr.name AS room_name,
                   mr.code AS room_code
            FROM beds b
            LEFT JOIN facilities f ON f.facilities_id = b.facility_id
            LEFT JOIN branches br ON br.branches_id = b.branch_id
            LEFT JOIN departments d ON d.departments_id = b.department_id
            LEFT JOIN medical_rooms mr ON mr.medical_rooms_id = b.room_id
            ${whereClause}
            ORDER BY b.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;
        params.push(limit, offset);
        const dataResult = await pool.query(dataQuery, params);

        return {
            data: dataResult.rows as Bed[],
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Lấy chi tiết giường theo ID (JOIN thông tin phòng, khoa, chi nhánh)
     */
    static async getBedById(id: string): Promise<Bed | null> {
        const query = `
            SELECT b.*,
                   f.name AS facility_name,
                   br.name AS branch_name,
                   d.name AS department_name,
                   mr.name AS room_name,
                   mr.code AS room_code
            FROM beds b
            LEFT JOIN facilities f ON f.facilities_id = b.facility_id
            LEFT JOIN branches br ON br.branches_id = b.branch_id
            LEFT JOIN departments d ON d.departments_id = b.department_id
            LEFT JOIN medical_rooms mr ON mr.medical_rooms_id = b.room_id
            WHERE b.bed_id = $1 AND b.deleted_at IS NULL
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    /**
     * Kiểm tra mã giường đã tồn tại trong cùng chi nhánh chưa
     */
    static async checkCodeExistsInBranch(code: string, branchId: string, excludeId?: string): Promise<boolean> {
        let query = `SELECT 1 FROM beds WHERE code = $1 AND branch_id = $2 AND deleted_at IS NULL`;
        const params: any[] = [code, branchId];
        if (excludeId) {
            query += ' AND bed_id != $3';
            params.push(excludeId);
        }
        const result = await pool.query(query, params);
        return result.rows.length > 0;
    }

    /** Kiểm tra cơ sở có tồn tại không */
    static async checkFacilityExists(facilityId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT 1 FROM facilities WHERE facilities_id = $1 AND deleted_at IS NULL`, [facilityId]
        );
        return result.rows.length > 0;
    }

    /** Kiểm tra chi nhánh thuộc cơ sở */
    static async checkBranchBelongsToFacility(branchId: string, facilityId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT 1 FROM branches WHERE branches_id = $1 AND facility_id = $2 AND deleted_at IS NULL`,
            [branchId, facilityId]
        );
        return result.rows.length > 0;
    }

    /** Kiểm tra khoa thuộc chi nhánh */
    static async checkDepartmentBelongsToBranch(departmentId: string, branchId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT 1 FROM departments WHERE departments_id = $1 AND branch_id = $2 AND deleted_at IS NULL`,
            [departmentId, branchId]
        );
        return result.rows.length > 0;
    }

    /** Kiểm tra phòng thuộc chi nhánh */
    static async checkRoomBelongsToBranch(roomId: string, branchId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT 1 FROM medical_rooms WHERE medical_rooms_id = $1 AND branch_id = $2 AND deleted_at IS NULL`,
            [roomId, branchId]
        );
        return result.rows.length > 0;
    }

    /**
     * Tạo mới giường bệnh
     */
    static async createBed(id: string, input: CreateBedInput): Promise<Bed> {
        const query = `
            INSERT INTO beds (bed_id, facility_id, branch_id, department_id, room_id, name, code, type, status, description)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        const result = await pool.query(query, [
            id,
            input.facility_id,
            input.branch_id,
            input.department_id || null,
            input.room_id || null,
            input.name,
            input.code,
            input.type || 'STANDARD',
            input.status || 'EMPTY',
            input.description || null,
        ]);
        return result.rows[0];
    }

    /**
     * Cập nhật thông tin cơ bản giường (tên, mã, loại, mô tả)
     */
    static async updateBed(id: string, input: UpdateBedInput): Promise<Bed> {
        const fields: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (input.name !== undefined) { fields.push(`name = $${paramIndex++}`); params.push(input.name); }
        if (input.code !== undefined) { fields.push(`code = $${paramIndex++}`); params.push(input.code); }
        if (input.type !== undefined) { fields.push(`type = $${paramIndex++}`); params.push(input.type); }
        if (input.description !== undefined) { fields.push(`description = $${paramIndex++}`); params.push(input.description); }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);

        const query = `UPDATE beds SET ${fields.join(', ')} WHERE bed_id = $${paramIndex} AND deleted_at IS NULL RETURNING *`;
        const result = await pool.query(query, params);
        return result.rows[0];
    }

    /**
     * Cập nhật trạng thái giường
     */
    static async updateStatus(id: string, status: string): Promise<Bed> {
        const query = `
            UPDATE beds SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE bed_id = $2 AND deleted_at IS NULL RETURNING *
        `;
        const result = await pool.query(query, [status, id]);
        return result.rows[0];
    }

    /**
     * Gán / thay đổi phòng và khoa cho giường
     */
    static async assignBed(id: string, departmentId: string | null, roomId: string | null): Promise<Bed> {
        const query = `
            UPDATE beds SET department_id = $1, room_id = $2, updated_at = CURRENT_TIMESTAMP
            WHERE bed_id = $3 AND deleted_at IS NULL RETURNING *
        `;
        const result = await pool.query(query, [departmentId, roomId, id]);
        return result.rows[0];
    }

    /**
     * Soft delete giường
     */
    static async softDeleteBed(id: string): Promise<void> {
        await pool.query(
            `UPDATE beds SET deleted_at = CURRENT_TIMESTAMP WHERE bed_id = $1 AND deleted_at IS NULL`,
            [id]
        );
    }
}
