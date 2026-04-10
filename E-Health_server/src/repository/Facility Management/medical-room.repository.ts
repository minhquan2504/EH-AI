import { pool } from '../../config/postgresdb';
import { CreateMedicalRoomInput, MedicalRoomDropdown, MedicalRoomInfo, MedicalRoomQuery, UpdateMedicalRoomInput } from '../../models/Facility Management/medical-room.model';
import { v4 as uuidv4 } from 'uuid';

export class MedicalRoomRepository {
    /**
     * Lấy danh sách thả xuống (Dropdown)
     */
    static async getDropdownList(branchId?: string, departmentId?: string): Promise<MedicalRoomDropdown[]> {
        let query = `
            SELECT medical_rooms_id, branch_id, department_id, code, name
            FROM medical_rooms
            WHERE status = 'ACTIVE' AND deleted_at IS NULL
        `;
        const params: any[] = [];
        let paramCount = 1;

        if (branchId) {
            query += ` AND branch_id = $${paramCount}`;
            params.push(branchId);
            paramCount++;
        }

        if (departmentId) {
            query += ` AND department_id = $${paramCount}`;
            params.push(departmentId);
            paramCount++;
        }

        query += ` ORDER BY name ASC`;

        const { rows } = await pool.query(query, params);
        return rows;
    }

    /**
     * Lấy danh sách phân trang (kèm JOIN lấy tên chi nhánh và khoa)
     */
    static async getMedicalRooms(params: MedicalRoomQuery): Promise<{ items: MedicalRoomInfo[], total: number }> {
        let query = `
            SELECT 
                r.medical_rooms_id, r.branch_id, r.department_id, 
                r.code, r.name, r.room_type, r.capacity, r.status,
                b.name as branch_name,
                d.name as department_name
            FROM medical_rooms r
            JOIN branches b ON r.branch_id = b.branches_id
            LEFT JOIN departments d ON r.department_id = d.departments_id
            WHERE r.deleted_at IS NULL
        `;
        let countQuery = `
            SELECT COUNT(*) 
            FROM medical_rooms r 
            WHERE r.deleted_at IS NULL
        `;
        const queryParams: any[] = [];
        let paramIndex = 1;

        if (params.search) {
            const searchCondition = ` AND (r.name ILIKE $${paramIndex} OR r.code ILIKE $${paramIndex})`;
            query += searchCondition;
            countQuery += searchCondition;
            queryParams.push(`%${params.search}%`);
            paramIndex++;
        }

        if (params.branch_id) {
            const branchCondition = ` AND r.branch_id = $${paramIndex}`;
            query += branchCondition;
            countQuery += branchCondition;
            queryParams.push(params.branch_id);
            paramIndex++;
        }

        if (params.department_id) {
            const deptCondition = ` AND r.department_id = $${paramIndex}`;
            query += deptCondition;
            countQuery += deptCondition;
            queryParams.push(params.department_id);
            paramIndex++;
        }

        if (params.room_type) {
            const typeCondition = ` AND r.room_type = $${paramIndex}`;
            query += typeCondition;
            countQuery += typeCondition;
            queryParams.push(params.room_type);
            paramIndex++;
        }

        if (params.status) {
            const statusCondition = ` AND r.status = $${paramIndex}`;
            query += statusCondition;
            countQuery += statusCondition;
            queryParams.push(params.status);
            paramIndex++;
        }

        query += ` ORDER BY r.code ASC`;

        if (params.page && params.limit) {
            const offset = (params.page - 1) * params.limit;
            query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            queryParams.push(params.limit, offset);
        }

        const [dataResult, countResult] = await Promise.all([
            pool.query(query, queryParams),
            pool.query(countQuery, queryParams.slice(0, paramIndex - 1))
        ]);

        return {
            items: dataResult.rows,
            total: parseInt(countResult.rows[0].count)
        };
    }

    /**
     * Lấy chi tiết 1 phòng
     */
    static async getById(id: string): Promise<MedicalRoomInfo | null> {
        const query = `
            SELECT 
                r.medical_rooms_id, r.branch_id, r.department_id, 
                r.code, r.name, r.room_type, r.capacity, r.status,
                b.name as branch_name,
                d.name as department_name
            FROM medical_rooms r
            JOIN branches b ON r.branch_id = b.branches_id
            LEFT JOIN departments d ON r.department_id = d.departments_id
            WHERE r.medical_rooms_id = $1 AND r.deleted_at IS NULL
        `;
        const { rows } = await pool.query(query, [id]);
        return rows[0] || null;
    }

    /**
     * Kiểm tra Code tồn tại trong 1 Chi nhánh
     */
    static async checkCodeExists(branchId: string, code: string, excludeId?: string): Promise<boolean> {
        let query = `SELECT 1 FROM medical_rooms WHERE branch_id = $1 AND code = $2 AND deleted_at IS NULL`;
        const params = [branchId, code];

        if (excludeId) {
            query += ` AND medical_rooms_id != $3`;
            params.push(excludeId);
        }

        const { rows } = await pool.query(query, params);
        return rows.length > 0;
    }

    /**
     * Tạo mới phòng khám
     */
    static async create(data: CreateMedicalRoomInput): Promise<string> {
        const id = `ROOM_${uuidv4().substring(0, 8)}`;
        const query = `
            INSERT INTO medical_rooms (
                medical_rooms_id, branch_id, department_id, 
                code, name, room_type, capacity
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING medical_rooms_id
        `;

        await pool.query(query, [
            id,
            data.branch_id,
            data.department_id || null,
            data.code,
            data.name,
            data.room_type,
            data.capacity || 1
        ]);

        return id;
    }

    /**
     * Cập nhật thông tin phòng (Name, Type, Capacity, Dept)
     */
    static async update(id: string, data: UpdateMedicalRoomInput): Promise<void> {
        let query = `UPDATE medical_rooms SET `;
        const params: any[] = [];
        let paramIndex = 1;
        const setClauses: string[] = [];

        if (data.department_id !== undefined) {
            setClauses.push(`department_id = $${paramIndex}`);
            params.push(data.department_id || null);
            paramIndex++;
        }

        if (data.name !== undefined) {
            setClauses.push(`name = $${paramIndex}`);
            params.push(data.name);
            paramIndex++;
        }

        if (data.room_type !== undefined) {
            setClauses.push(`room_type = $${paramIndex}`);
            params.push(data.room_type);
            paramIndex++;
        }

        if (data.capacity !== undefined) {
            setClauses.push(`capacity = $${paramIndex}`);
            params.push(data.capacity);
            paramIndex++;
        }

        if (setClauses.length === 0) return;

        query += setClauses.join(', ') + ` WHERE medical_rooms_id = $${paramIndex} AND deleted_at IS NULL`;
        params.push(id);

        await pool.query(query, params);
    }

    /**
     * Cập nhật trạng thái
     */
    static async updateStatus(id: string, status: string): Promise<void> {
        await pool.query(
            `UPDATE medical_rooms SET status = $1 WHERE medical_rooms_id = $2 AND deleted_at IS NULL`,
            [status, id]
        );
    }

    /**
     * Xóa mềm (Soft Delete)
     */
    static async softDelete(id: string): Promise<void> {
        await pool.query(
            `UPDATE medical_rooms SET deleted_at = NOW() WHERE medical_rooms_id = $1`,
            [id]
        );
    }
}
