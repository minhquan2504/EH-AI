import { pool } from '../../config/postgresdb';
import {
    Warehouse,
    CreateWarehouseInput,
    UpdateWarehouseInput,
} from '../../models/Medication Management/warehouse.model';


export class WarehouseRepository {

    /** Sinh ID kho */
    static generateId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const rand = Math.random().toString(36).substring(2, 10);
        return `WH_${yy}${mm}${dd}_${rand}`;
    }

    /** Danh sách kho (filter branch, search) */
    static async findAll(branchId?: string, search?: string): Promise<Warehouse[]> {
        const conditions: string[] = [];
        const values: any[] = [];
        let paramIdx = 1;

        if (branchId) {
            conditions.push(`w.branch_id = $${paramIdx++}`);
            values.push(branchId);
        }
        if (search) {
            conditions.push(`(w.code ILIKE $${paramIdx} OR w.name ILIKE $${paramIdx})`);
            values.push(`%${search}%`);
            paramIdx++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const result = await pool.query(
            `SELECT w.*,
                    b.name AS branch_name,
                    f.name AS facility_name
             FROM warehouses w
             LEFT JOIN branches b ON b.branches_id = w.branch_id
             LEFT JOIN facilities f ON f.facilities_id = b.facility_id
             ${whereClause}
             ORDER BY w.branch_id, w.code ASC`,
            values
        );
        return result.rows;
    }

    /** Chi tiết 1 kho */
    static async findById(warehouseId: string): Promise<Warehouse | null> {
        const result = await pool.query(
            `SELECT w.*,
                    b.name AS branch_name,
                    f.name AS facility_name
             FROM warehouses w
             LEFT JOIN branches b ON b.branches_id = w.branch_id
             LEFT JOIN facilities f ON f.facilities_id = b.facility_id
             WHERE w.warehouse_id = $1`,
            [warehouseId]
        );
        return result.rows[0] || null;
    }

    /** Kiểm tra branch tồn tại */
    static async branchExists(branchId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM branches WHERE branches_id = $1 AND deleted_at IS NULL) AS exists`,
            [branchId]
        );
        return result.rows[0].exists;
    }

    /** Kiểm tra mã kho UNIQUE theo branch */
    static async codeExists(branchId: string, code: string, excludeId?: string): Promise<boolean> {
        let query = `SELECT EXISTS(SELECT 1 FROM warehouses WHERE branch_id = $1 AND code = $2`;
        const values: any[] = [branchId, code];

        if (excludeId) {
            query += ` AND warehouse_id != $3`;
            values.push(excludeId);
        }
        query += `) AS exists`;

        const result = await pool.query(query, values);
        return result.rows[0].exists;
    }

    /** Tạo kho mới */
    static async create(id: string, input: CreateWarehouseInput): Promise<Warehouse> {
        const result = await pool.query(
            `INSERT INTO warehouses (warehouse_id, branch_id, code, name, warehouse_type, address)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [id, input.branch_id, input.code, input.name, input.warehouse_type || 'MAIN', input.address || null]
        );
        return result.rows[0];
    }

    /** Cập nhật kho */
    static async update(warehouseId: string, input: UpdateWarehouseInput): Promise<Warehouse> {
        const updates: string[] = [];
        const params: any[] = [warehouseId];
        let paramIdx = 2;

        const fields: (keyof UpdateWarehouseInput)[] = ['name', 'warehouse_type', 'address'];
        for (const field of fields) {
            if (input[field] !== undefined) {
                updates.push(`${field} = $${paramIdx++}`);
                params.push(input[field]);
            }
        }

        updates.push(`updated_at = NOW()`);

        const result = await pool.query(
            `UPDATE warehouses SET ${updates.join(', ')} WHERE warehouse_id = $1 RETURNING *`,
            params
        );
        return result.rows[0];
    }

    /** Bật/tắt kho */
    static async toggle(warehouseId: string, isActive: boolean): Promise<Warehouse> {
        const result = await pool.query(
            `UPDATE warehouses SET is_active = $2, updated_at = NOW() WHERE warehouse_id = $1 RETURNING *`,
            [warehouseId, isActive]
        );
        return result.rows[0];
    }
}
