import { pool } from '../../config/postgresdb';
import { PoolClient } from 'pg';
import { StockInOrder, StockInDetail, AddStockInItemInput } from '../../models/Medication Management/stock-in.model';


export class StockInRepository {

    static generateOrderId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const rand = Math.random().toString(36).substring(2, 10);
        return `SIO_${yy}${mm}${dd}_${rand}`;
    }

    static generateOrderCode(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `NK-${yy}${mm}${dd}-${rand}`;
    }

    static generateDetailId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const rand = Math.random().toString(36).substring(2, 10);
        return `SID_${yy}${mm}${dd}_${rand}`;
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

    /** Kiểm tra NCC active */
    static async supplierActive(supplierId: string): Promise<boolean> {
        const r = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM suppliers WHERE supplier_id = $1 AND is_active = TRUE) AS ok`, [supplierId]
        );
        return r.rows[0].ok;
    }

    /** Kiểm tra kho active */
    static async warehouseActive(warehouseId: string): Promise<boolean> {
        const r = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM warehouses WHERE warehouse_id = $1 AND is_active = TRUE) AS ok`, [warehouseId]
        );
        return r.rows[0].ok;
    }

    /** Kiểm tra thuốc active */
    static async drugActive(drugId: string): Promise<boolean> {
        const r = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM drugs WHERE drugs_id = $1 AND is_active = TRUE) AS ok`, [drugId]
        );
        return r.rows[0].ok;
    }

    // ========== ORDER CRUD ==========

    /** Tạo phiếu nhập (DRAFT) */
    static async createOrder(
        orderId: string, orderCode: string,
        supplierId: string, warehouseId: string, createdBy: string, notes?: string
    ): Promise<StockInOrder> {
        const r = await pool.query(
            `INSERT INTO stock_in_orders
                (stock_in_order_id, order_code, supplier_id, warehouse_id, created_by, status, notes)
             VALUES ($1, $2, $3, $4, $5, 'DRAFT', $6) RETURNING *`,
            [orderId, orderCode, supplierId, warehouseId, createdBy, notes || null]
        );
        return r.rows[0];
    }

    /** Thêm dòng thuốc vào phiếu */
    static async addItem(detailId: string, orderId: string, input: AddStockInItemInput): Promise<StockInDetail> {
        const amount = input.quantity * input.unit_cost;
        const r = await pool.query(
            `INSERT INTO stock_in_details
                (stock_in_detail_id, stock_in_order_id, drug_id, batch_number, expiry_date, quantity, unit_cost, unit_price, amount)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [detailId, orderId, input.drug_id, input.batch_number, input.expiry_date,
             input.quantity, input.unit_cost, input.unit_price || 0, amount]
        );

        // Cập nhật total_amount
        await pool.query(
            `UPDATE stock_in_orders SET total_amount = (
                SELECT COALESCE(SUM(amount), 0) FROM stock_in_details WHERE stock_in_order_id = $1
             ), updated_at = NOW() WHERE stock_in_order_id = $1`, [orderId]
        );
        return r.rows[0];
    }

    /** Lấy phiếu theo ID */
    static async findOrderById(orderId: string): Promise<StockInOrder | null> {
        const r = await pool.query(
            `SELECT sio.*,
                    s.name AS supplier_name,
                    w.name AS warehouse_name,
                    u1.full_name AS created_by_name,
                    u2.full_name AS received_by_name
             FROM stock_in_orders sio
             LEFT JOIN suppliers s ON s.supplier_id = sio.supplier_id
             LEFT JOIN warehouses w ON w.warehouse_id = sio.warehouse_id
             LEFT JOIN user_profiles u1 ON u1.user_id = sio.created_by
             LEFT JOIN user_profiles u2 ON u2.user_id = sio.received_by
             WHERE sio.stock_in_order_id = $1`, [orderId]
        );
        return r.rows[0] || null;
    }

    /** Lấy chi tiết phiếu */
    static async findDetailsByOrderId(orderId: string): Promise<StockInDetail[]> {
        const r = await pool.query(
            `SELECT sid.*,
                    d.drug_code, d.brand_name, d.dispensing_unit
             FROM stock_in_details sid
             LEFT JOIN drugs d ON d.drugs_id = sid.drug_id
             WHERE sid.stock_in_order_id = $1
             ORDER BY sid.created_at ASC`, [orderId]
        );
        return r.rows;
    }

    /** Đếm dòng thuốc trong phiếu */
    static async countItems(orderId: string): Promise<number> {
        const r = await pool.query(
            `SELECT COUNT(*)::int AS cnt FROM stock_in_details WHERE stock_in_order_id = $1`, [orderId]
        );
        return r.rows[0].cnt;
    }

    // ========== STATUS TRANSITIONS ==========

    /** DRAFT → CONFIRMED */
    static async confirmOrder(orderId: string): Promise<void> {
        await pool.query(
            `UPDATE stock_in_orders SET status = 'CONFIRMED', updated_at = NOW() WHERE stock_in_order_id = $1`, [orderId]
        );
    }

    /** Hủy phiếu */
    static async cancelOrder(orderId: string, reason: string): Promise<void> {
        await pool.query(
            `UPDATE stock_in_orders SET status = 'CANCELLED', cancelled_at = NOW(), cancelled_reason = $2, updated_at = NOW()
             WHERE stock_in_order_id = $1`, [orderId, reason]
        );
    }

    /**
     * CONFIRMED → RECEIVED (transaction)
     * Cộng tồn kho: nếu lô đã có → cộng stock, nếu chưa → tạo mới
     */
    static async receiveOrder(client: PoolClient, orderId: string, receivedBy: string, warehouseId: string): Promise<void> {
        // Cập nhật trạng thái
        await client.query(
            `UPDATE stock_in_orders SET status = 'RECEIVED', received_at = NOW(), received_by = $2, updated_at = NOW()
             WHERE stock_in_order_id = $1`, [orderId, receivedBy]
        );

        // Lấy chi tiết
        const details = await client.query(
            `SELECT * FROM stock_in_details WHERE stock_in_order_id = $1`, [orderId]
        );

        for (const item of details.rows) {
            // Kiểm tra lô đã có chưa
            const existing = await client.query(
                `SELECT pharmacy_inventory_id FROM pharmacy_inventory
                 WHERE drug_id = $1 AND batch_number = $2`,
                [item.drug_id, item.batch_number]
            );

            if (existing.rows.length > 0) {
                // Lô đã có → cộng thêm stock và cập nhật giá
                await client.query(
                    `UPDATE pharmacy_inventory
                     SET stock_quantity = stock_quantity + $2,
                         unit_cost = $3,
                         unit_price = CASE WHEN $4::numeric > 0 THEN $4 ELSE unit_price END
                     WHERE pharmacy_inventory_id = $1`,
                    [existing.rows[0].pharmacy_inventory_id, item.quantity, item.unit_cost, item.unit_price || 0]
                );
            } else {
                // Lô mới → tạo record
                const invId = StockInRepository.generateInventoryId();
                await client.query(
                    `INSERT INTO pharmacy_inventory
                        (pharmacy_inventory_id, drug_id, batch_number, expiry_date,
                         stock_quantity, unit_cost, unit_price, warehouse_id, low_stock_threshold)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 50)`,
                    [invId, item.drug_id, item.batch_number, item.expiry_date,
                     item.quantity, item.unit_cost, item.unit_price || 0, warehouseId]
                );
            }
        }
    }

    // ========== HISTORY ==========

    /** Lịch sử phiếu nhập (phân trang + filter) */
    static async findHistory(
        page: number, limit: number,
        status?: string, supplierId?: string, warehouseId?: string,
        fromDate?: string, toDate?: string
    ): Promise<{ data: StockInOrder[]; total: number }> {
        const conditions: string[] = [];
        const values: any[] = [];
        let paramIdx = 1;

        if (status) { conditions.push(`sio.status = $${paramIdx++}`); values.push(status); }
        if (supplierId) { conditions.push(`sio.supplier_id = $${paramIdx++}`); values.push(supplierId); }
        if (warehouseId) { conditions.push(`sio.warehouse_id = $${paramIdx++}`); values.push(warehouseId); }
        if (fromDate) { conditions.push(`sio.created_at >= $${paramIdx++}`); values.push(fromDate); }
        if (toDate) { conditions.push(`sio.created_at <= ($${paramIdx++}::date + INTERVAL '1 day')`); values.push(toDate); }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const offset = (page - 1) * limit;

        const countR = await pool.query(
            `SELECT COUNT(*)::int AS total FROM stock_in_orders sio ${whereClause}`, values
        );

        const dataValues = [...values, limit, offset];
        const dataR = await pool.query(
            `SELECT sio.*,
                    s.name AS supplier_name,
                    w.name AS warehouse_name,
                    u1.full_name AS created_by_name,
                    u2.full_name AS received_by_name
             FROM stock_in_orders sio
             LEFT JOIN suppliers s ON s.supplier_id = sio.supplier_id
             LEFT JOIN warehouses w ON w.warehouse_id = sio.warehouse_id
             LEFT JOIN user_profiles u1 ON u1.user_id = sio.created_by
             LEFT JOIN user_profiles u2 ON u2.user_id = sio.received_by
             ${whereClause}
             ORDER BY sio.created_at DESC
             LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
            dataValues
        );

        return { data: dataR.rows, total: countR.rows[0].total };
    }
}
