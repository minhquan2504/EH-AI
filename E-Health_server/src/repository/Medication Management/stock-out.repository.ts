import { pool } from '../../config/postgresdb';
import { PoolClient } from 'pg';
import { StockOutOrder, StockOutDetail, AddStockOutItemInput } from '../../models/Medication Management/stock-out.model';


export class StockOutRepository {

    static generateOrderId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const rand = Math.random().toString(36).substring(2, 10);
        return `SOO_${yy}${mm}${dd}_${rand}`;
    }

    static generateOrderCode(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `XK-${yy}${mm}${dd}-${rand}`;
    }

    static generateDetailId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const rand = Math.random().toString(36).substring(2, 10);
        return `SOD_${yy}${mm}${dd}_${rand}`;
    }

    static generateInventoryId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const rand = Math.random().toString(36).substring(2, 10);
        return `PINV_${yy}${mm}${dd}_${rand}`;
    }

    // ========== VALIDATION ==========

    static async warehouseActive(warehouseId: string): Promise<boolean> {
        const r = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM warehouses WHERE warehouse_id = $1 AND is_active = TRUE) AS ok`, [warehouseId]
        );
        return r.rows[0].ok;
    }

    static async supplierActive(supplierId: string): Promise<boolean> {
        const r = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM suppliers WHERE supplier_id = $1 AND is_active = TRUE) AS ok`, [supplierId]
        );
        return r.rows[0].ok;
    }

    /** Lấy thông tin lô kho (kèm warehouse_id) */
    static async getInventoryBatch(inventoryId: string): Promise<{
        exists: boolean; drug_id?: string; batch_number?: string; stock_quantity?: number;
        warehouse_id?: string; expiry_date?: string; unit_cost?: number; unit_price?: number;
    }> {
        const r = await pool.query(
            `SELECT pharmacy_inventory_id, drug_id, batch_number, stock_quantity, warehouse_id, expiry_date, unit_cost, unit_price
             FROM pharmacy_inventory WHERE pharmacy_inventory_id = $1`, [inventoryId]
        );
        if (r.rows.length === 0) return { exists: false };
        return { exists: true, ...r.rows[0] };
    }

    // ========== ORDER CRUD ==========

    static async createOrder(
        orderId: string, orderCode: string, warehouseId: string, reasonType: string,
        createdBy: string, supplierId?: string, destWarehouseId?: string, notes?: string
    ): Promise<StockOutOrder> {
        const r = await pool.query(
            `INSERT INTO stock_out_orders
                (stock_out_order_id, order_code, warehouse_id, reason_type, supplier_id, dest_warehouse_id, created_by, status, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'DRAFT', $8) RETURNING *`,
            [orderId, orderCode, warehouseId, reasonType, supplierId || null, destWarehouseId || null, createdBy, notes || null]
        );
        return r.rows[0];
    }

    static async addItem(detailId: string, orderId: string, inventoryId: string, drugId: string,
        batchNumber: string, quantity: number, reasonNote?: string): Promise<StockOutDetail> {
        const r = await pool.query(
            `INSERT INTO stock_out_details
                (stock_out_detail_id, stock_out_order_id, inventory_id, drug_id, batch_number, quantity, reason_note)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [detailId, orderId, inventoryId, drugId, batchNumber, quantity, reasonNote || null]
        );

        // Cập nhật total_quantity
        await pool.query(
            `UPDATE stock_out_orders SET total_quantity = (
                SELECT COALESCE(SUM(quantity), 0) FROM stock_out_details WHERE stock_out_order_id = $1
             ), updated_at = NOW() WHERE stock_out_order_id = $1`, [orderId]
        );
        return r.rows[0];
    }

    static async deleteItem(detailId: string, orderId: string): Promise<void> {
        await pool.query(`DELETE FROM stock_out_details WHERE stock_out_detail_id = $1 AND stock_out_order_id = $2`, [detailId, orderId]);

        await pool.query(
            `UPDATE stock_out_orders SET total_quantity = (
                SELECT COALESCE(SUM(quantity), 0) FROM stock_out_details WHERE stock_out_order_id = $1
             ), updated_at = NOW() WHERE stock_out_order_id = $1`, [orderId]
        );
    }

    static async findDetailById(detailId: string, orderId: string): Promise<StockOutDetail | null> {
        const r = await pool.query(
            `SELECT * FROM stock_out_details WHERE stock_out_detail_id = $1 AND stock_out_order_id = $2`, [detailId, orderId]
        );
        return r.rows[0] || null;
    }

    // ========== QUERIES ==========

    static async findOrderById(orderId: string): Promise<StockOutOrder | null> {
        const r = await pool.query(
            `SELECT soo.*,
                    w1.name AS warehouse_name,
                    w2.name AS dest_warehouse_name,
                    s.name AS supplier_name,
                    u1.full_name AS created_by_name,
                    u2.full_name AS confirmed_by_name
             FROM stock_out_orders soo
             LEFT JOIN warehouses w1 ON w1.warehouse_id = soo.warehouse_id
             LEFT JOIN warehouses w2 ON w2.warehouse_id = soo.dest_warehouse_id
             LEFT JOIN suppliers s ON s.supplier_id = soo.supplier_id
             LEFT JOIN user_profiles u1 ON u1.user_id = soo.created_by
             LEFT JOIN user_profiles u2 ON u2.user_id = soo.confirmed_by
             WHERE soo.stock_out_order_id = $1`, [orderId]
        );
        return r.rows[0] || null;
    }

    static async findDetailsByOrderId(orderId: string): Promise<StockOutDetail[]> {
        const r = await pool.query(
            `SELECT sod.*,
                    d.drug_code, d.brand_name, d.dispensing_unit,
                    pi.expiry_date, pi.stock_quantity
             FROM stock_out_details sod
             LEFT JOIN drugs d ON d.drugs_id = sod.drug_id
             LEFT JOIN pharmacy_inventory pi ON pi.pharmacy_inventory_id = sod.inventory_id
             WHERE sod.stock_out_order_id = $1
             ORDER BY sod.created_at ASC`, [orderId]
        );
        return r.rows;
    }

    static async countItems(orderId: string): Promise<number> {
        const r = await pool.query(
            `SELECT COUNT(*)::int AS cnt FROM stock_out_details WHERE stock_out_order_id = $1`, [orderId]
        );
        return r.rows[0].cnt;
    }

    // ========== CONFIRM — TRỪ KHO (TRANSACTION) ==========

    /**
     * Xác nhận phiếu: trừ kho gốc + cộng kho đích nếu TRANSFER
     */
    static async confirmOrder(
        client: PoolClient, orderId: string, confirmedBy: string,
        destWarehouseId?: string
    ): Promise<void> {
        // Cập nhật trạng thái
        await client.query(
            `UPDATE stock_out_orders SET status = 'CONFIRMED', confirmed_at = NOW(), confirmed_by = $2, updated_at = NOW()
             WHERE stock_out_order_id = $1`, [orderId, confirmedBy]
        );

        // Lấy chi tiết
        const details = await client.query(
            `SELECT sod.*, pi.drug_id, pi.batch_number, pi.expiry_date, pi.unit_cost, pi.unit_price
             FROM stock_out_details sod
             JOIN pharmacy_inventory pi ON pi.pharmacy_inventory_id = sod.inventory_id
             WHERE sod.stock_out_order_id = $1`, [orderId]
        );

        for (const item of details.rows) {
            // Trừ kho gốc (có kiểm tra đủ stock)
            const deduct = await client.query(
                `UPDATE pharmacy_inventory
                 SET stock_quantity = stock_quantity - $2
                 WHERE pharmacy_inventory_id = $1 AND stock_quantity >= $2
                 RETURNING stock_quantity`,
                [item.inventory_id, item.quantity]
            );
            if (deduct.rowCount === 0) {
                throw new Error(`INSUFFICIENT_STOCK:${item.inventory_id}`);
            }

            // Nếu TRANSFER → cộng kho đích
            if (destWarehouseId) {
                // Kiểm tra lô đã có ở kho đích chưa
                const existing = await client.query(
                    `SELECT pharmacy_inventory_id FROM pharmacy_inventory
                     WHERE drug_id = $1 AND batch_number = $2 AND warehouse_id = $3`,
                    [item.drug_id, item.batch_number, destWarehouseId]
                );

                if (existing.rows.length > 0) {
                    await client.query(
                        `UPDATE pharmacy_inventory SET stock_quantity = stock_quantity + $2
                         WHERE pharmacy_inventory_id = $1`,
                        [existing.rows[0].pharmacy_inventory_id, item.quantity]
                    );
                } else {
                    const invId = StockOutRepository.generateInventoryId();
                    await client.query(
                        `INSERT INTO pharmacy_inventory
                            (pharmacy_inventory_id, drug_id, batch_number, expiry_date,
                             stock_quantity, unit_cost, unit_price, warehouse_id, low_stock_threshold)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 50)`,
                        [invId, item.drug_id, item.batch_number, item.expiry_date,
                         item.quantity, item.unit_cost, item.unit_price || 0, destWarehouseId]
                    );
                }
            }
        }
    }

    // ========== CANCEL — HOÀN KHO (TRANSACTION) ==========

    /**
     * Hủy phiếu CONFIRMED: hoàn kho gốc + trừ kho đích nếu TRANSFER
     */
    static async cancelConfirmedOrder(
        client: PoolClient, orderId: string, reason: string,
        destWarehouseId?: string
    ): Promise<void> {
        await client.query(
            `UPDATE stock_out_orders SET status = 'CANCELLED', cancelled_at = NOW(), cancelled_reason = $2, updated_at = NOW()
             WHERE stock_out_order_id = $1`, [orderId, reason]
        );

        const details = await client.query(
            `SELECT sod.*, pi.drug_id, pi.batch_number
             FROM stock_out_details sod
             JOIN pharmacy_inventory pi ON pi.pharmacy_inventory_id = sod.inventory_id
             WHERE sod.stock_out_order_id = $1`, [orderId]
        );

        for (const item of details.rows) {
            // Hoàn kho gốc
            await client.query(
                `UPDATE pharmacy_inventory SET stock_quantity = stock_quantity + $2
                 WHERE pharmacy_inventory_id = $1`,
                [item.inventory_id, item.quantity]
            );

            // Nếu TRANSFER → trừ kho đích
            if (destWarehouseId) {
                await client.query(
                    `UPDATE pharmacy_inventory SET stock_quantity = stock_quantity - $2
                     WHERE drug_id = $1 AND batch_number = $3 AND warehouse_id = $4 AND stock_quantity >= $2`,
                    [item.drug_id, item.quantity, item.batch_number, destWarehouseId]
                );
            }
        }
    }

    /** Hủy phiếu DRAFT (chỉ đổi status, không hoàn kho) */
    static async cancelDraftOrder(orderId: string, reason: string): Promise<void> {
        await pool.query(
            `UPDATE stock_out_orders SET status = 'CANCELLED', cancelled_at = NOW(), cancelled_reason = $2, updated_at = NOW()
             WHERE stock_out_order_id = $1`, [orderId, reason]
        );
    }

    // ========== HISTORY ==========

    static async findHistory(
        page: number, limit: number,
        status?: string, reasonType?: string, warehouseId?: string,
        fromDate?: string, toDate?: string
    ): Promise<{ data: StockOutOrder[]; total: number }> {
        const conditions: string[] = [];
        const values: any[] = [];
        let paramIdx = 1;

        if (status) { conditions.push(`soo.status = $${paramIdx++}`); values.push(status); }
        if (reasonType) { conditions.push(`soo.reason_type = $${paramIdx++}`); values.push(reasonType); }
        if (warehouseId) { conditions.push(`soo.warehouse_id = $${paramIdx++}`); values.push(warehouseId); }
        if (fromDate) { conditions.push(`soo.created_at >= $${paramIdx++}`); values.push(fromDate); }
        if (toDate) { conditions.push(`soo.created_at <= ($${paramIdx++}::date + INTERVAL '1 day')`); values.push(toDate); }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const offset = (page - 1) * limit;

        const countR = await pool.query(`SELECT COUNT(*)::int AS total FROM stock_out_orders soo ${whereClause}`, values);

        const dataValues = [...values, limit, offset];
        const dataR = await pool.query(
            `SELECT soo.*,
                    w1.name AS warehouse_name,
                    w2.name AS dest_warehouse_name,
                    s.name AS supplier_name,
                    u1.full_name AS created_by_name,
                    u2.full_name AS confirmed_by_name
             FROM stock_out_orders soo
             LEFT JOIN warehouses w1 ON w1.warehouse_id = soo.warehouse_id
             LEFT JOIN warehouses w2 ON w2.warehouse_id = soo.dest_warehouse_id
             LEFT JOIN suppliers s ON s.supplier_id = soo.supplier_id
             LEFT JOIN user_profiles u1 ON u1.user_id = soo.created_by
             LEFT JOIN user_profiles u2 ON u2.user_id = soo.confirmed_by
             ${whereClause}
             ORDER BY soo.created_at DESC
             LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
            dataValues
        );

        return { data: dataR.rows, total: countR.rows[0].total };
    }
}
