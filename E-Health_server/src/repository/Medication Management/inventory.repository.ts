import { pool } from '../../config/postgresdb';
import {
    InventoryItem,
    CreateInventoryInput,
    UpdateInventoryInput,
    ExpiryAlert,
} from '../../models/Medication Management/inventory.model';
import { EXPIRY_ALERT_LEVELS } from '../../constants/inventory.constant';


export class InventoryRepository {

    /** Sinh ID lô tồn kho */
    static generateId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const rand = Math.random().toString(36).substring(2, 10);
        return `PINV_${yy}${mm}${dd}_${rand}`;
    }

    //  QUERIES 

    /**
     * Danh sách tồn kho (phân trang + filter)
     */
    static async findAll(
        page: number,
        limit: number,
        drugId?: string,
        search?: string,
        expiryBefore?: string,
        lowStockOnly?: boolean
    ): Promise<{ data: InventoryItem[]; total: number }> {
        const conditions: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (drugId) {
            conditions.push(`pi.drug_id = $${paramIndex++}`);
            values.push(drugId);
        }
        if (search) {
            conditions.push(`(d.brand_name ILIKE $${paramIndex} OR d.drug_code ILIKE $${paramIndex} OR pi.batch_number ILIKE $${paramIndex})`);
            values.push(`%${search}%`);
            paramIndex++;
        }
        if (expiryBefore) {
            conditions.push(`pi.expiry_date <= $${paramIndex++}`);
            values.push(expiryBefore);
        }
        if (lowStockOnly) {
            conditions.push(`pi.stock_quantity <= pi.low_stock_threshold AND pi.stock_quantity > 0`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const offset = (page - 1) * limit;

        const countResult = await pool.query(
            `SELECT COUNT(*)::int AS total FROM pharmacy_inventory pi
             LEFT JOIN drugs d ON d.drugs_id = pi.drug_id
             ${whereClause}`,
            values
        );

        const dataValues = [...values, limit, offset];
        const dataResult = await pool.query(
            `SELECT pi.*,
                    d.drug_code, d.brand_name, d.active_ingredients, d.dispensing_unit,
                    dc.name AS category_name
             FROM pharmacy_inventory pi
             LEFT JOIN drugs d ON d.drugs_id = pi.drug_id
             LEFT JOIN drug_categories dc ON dc.drug_categories_id = d.category_id
             ${whereClause}
             ORDER BY pi.expiry_date ASC
             LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
            dataValues
        );

        return { data: dataResult.rows, total: countResult.rows[0].total };
    }

    /**
     * Chi tiết 1 lô
     */
    static async findById(batchId: string): Promise<InventoryItem | null> {
        const result = await pool.query(
            `SELECT pi.*,
                    d.drug_code, d.brand_name, d.active_ingredients, d.dispensing_unit,
                    dc.name AS category_name
             FROM pharmacy_inventory pi
             LEFT JOIN drugs d ON d.drugs_id = pi.drug_id
             LEFT JOIN drug_categories dc ON dc.drug_categories_id = d.category_id
             WHERE pi.pharmacy_inventory_id = $1`,
            [batchId]
        );
        return result.rows[0] || null;
    }

    /**
     * Cảnh báo thuốc sắp hết hạn
     * Lấy tất cả lô chưa hết hạn, hết hạn trong N ngày, còn tồn kho > 0
     */
    static async findExpiring(days: number): Promise<ExpiryAlert[]> {
        const result = await pool.query(
            `SELECT pi.pharmacy_inventory_id, pi.drug_id, pi.batch_number,
                    pi.expiry_date, pi.stock_quantity, pi.location_bin,
                    d.drug_code, d.brand_name,
                    (pi.expiry_date - CURRENT_DATE) AS days_until_expiry
             FROM pharmacy_inventory pi
             LEFT JOIN drugs d ON d.drugs_id = pi.drug_id
             WHERE pi.expiry_date <= (CURRENT_DATE + $1::int)
               AND pi.expiry_date > CURRENT_DATE
               AND pi.stock_quantity > 0
             ORDER BY pi.expiry_date ASC`,
            [days]
        );

        return result.rows.map((row: any) => ({
            ...row,
            days_until_expiry: parseInt(row.days_until_expiry),
            alert_level: row.days_until_expiry <= EXPIRY_ALERT_LEVELS.CRITICAL
                ? 'CRITICAL'
                : row.days_until_expiry <= EXPIRY_ALERT_LEVELS.WARNING
                    ? 'WARNING'
                    : 'NOTICE',
        }));
    }

    /**
     * Cảnh báo tồn kho thấp
     * Kiểm tra từng lô: stock_quantity <= low_stock_threshold
     */
    static async findLowStock(): Promise<any[]> {
        const result = await pool.query(
            `SELECT pi.pharmacy_inventory_id, pi.drug_id, pi.batch_number,
                    pi.stock_quantity, pi.low_stock_threshold, pi.location_bin,
                    pi.expiry_date,
                    d.drug_code, d.brand_name, d.dispensing_unit,
                    CASE
                        WHEN pi.low_stock_threshold > 0
                        THEN ROUND((pi.stock_quantity::numeric / pi.low_stock_threshold) * 100)
                        ELSE 0
                    END AS percentage_remaining
             FROM pharmacy_inventory pi
             LEFT JOIN drugs d ON d.drugs_id = pi.drug_id
             WHERE pi.stock_quantity <= pi.low_stock_threshold
               AND pi.stock_quantity >= 0
             ORDER BY pi.stock_quantity ASC`
        );
        return result.rows;
    }

    //  MUTATIONS 

    /**
     * Kiểm tra thuốc tồn tại và active
     */
    static async drugExists(drugId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM drugs WHERE drugs_id = $1 AND is_active = TRUE) AS exists`,
            [drugId]
        );
        return result.rows[0].exists;
    }

    /**
     * Kiểm tra lô đã tồn tại (UNIQUE drug_id + batch_number)
     */
    static async batchExists(drugId: string, batchNumber: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT EXISTS(
                SELECT 1 FROM pharmacy_inventory WHERE drug_id = $1 AND batch_number = $2
            ) AS exists`,
            [drugId, batchNumber]
        );
        return result.rows[0].exists;
    }

    /**
     * Nhập kho lô mới
     */
    static async create(id: string, input: CreateInventoryInput): Promise<InventoryItem> {
        const result = await pool.query(
            `INSERT INTO pharmacy_inventory
                (pharmacy_inventory_id, drug_id, batch_number, expiry_date,
                 stock_quantity, unit_cost, unit_price, location_bin, low_stock_threshold, warehouse_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [
                id,
                input.drug_id,
                input.batch_number,
                input.expiry_date,
                input.stock_quantity,
                input.unit_cost || 0,
                input.unit_price || 0,
                input.location_bin || null,
                input.low_stock_threshold || 50,
                input.warehouse_id || null,
            ]
        );
        return result.rows[0];
    }

    /**
     * Cập nhật tồn kho
     */
    static async update(batchId: string, input: UpdateInventoryInput): Promise<InventoryItem> {
        const updates: string[] = [];
        const params: any[] = [batchId];
        let paramIdx = 2;

        const fields: (keyof UpdateInventoryInput)[] = [
            'stock_quantity', 'unit_cost', 'unit_price', 'location_bin', 'low_stock_threshold',
        ];

        for (const field of fields) {
            if (input[field] !== undefined) {
                updates.push(`${field} = $${paramIdx++}`);
                params.push(input[field]);
            }
        }

        if (updates.length === 0) {
            return (await this.findById(batchId))!;
        }

        const result = await pool.query(
            `UPDATE pharmacy_inventory SET ${updates.join(', ')}
             WHERE pharmacy_inventory_id = $1 RETURNING *`,
            params
        );
        return result.rows[0];
    }
}
