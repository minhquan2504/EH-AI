import { pool } from '../../config/postgresdb';
import {
    DispenseOrder,
    DispenseDetail,
    DispenseItemInput,
    InventoryBatch,
    StockCheckResult,
} from '../../models/Medication Management/dispensing.model';
import { PoolClient } from 'pg';


export class DispensingRepository {

    //  HELPERS 

    /** Sinh mã phiếu cấp phát: DIS_YYMMDD_random */
    static generateDispenseCode(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const rand = Math.random().toString(36).substring(2, 10);
        return `DIS_${yy}${mm}${dd}_${rand}`;
    }

    /** Sinh ID phiếu cấp phát */
    static generateOrderId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const rand = Math.random().toString(36).substring(2, 10);
        return `DSO_${yy}${mm}${dd}_${rand}`;
    }

    /** Sinh ID chi tiết cấp phát */
    static generateDetailId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const rand = Math.random().toString(36).substring(2, 10);
        return `DSD_${yy}${mm}${dd}_${rand}`;
    }

    //  VALIDATION 

    /** Lấy thông tin đơn thuốc để validate */
    static async getPrescriptionInfo(prescriptionId: string): Promise<{
        exists: boolean;
        status?: string;
        prescription_code?: string;
        patient_id?: string;
        doctor_id?: string;
    }> {
        const result = await pool.query(
            `SELECT prescriptions_id, status, prescription_code, patient_id, doctor_id
             FROM prescriptions WHERE prescriptions_id = $1`,
            [prescriptionId]
        );
        if (result.rows.length === 0) return { exists: false };
        return { exists: true, ...result.rows[0] };
    }

    /** Kiểm tra đơn thuốc đã có phiếu cấp phát chưa */
    static async hasDispenseOrder(prescriptionId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT EXISTS(
                SELECT 1 FROM drug_dispense_orders
                WHERE prescription_id = $1 AND status = 'COMPLETED'
            ) AS has_order`,
            [prescriptionId]
        );
        return result.rows[0].has_order;
    }

    /** Lấy dòng thuốc (prescription_detail) và kiểm tra drug_id */
    static async getPrescriptionDetail(detailId: string, prescriptionId: string): Promise<{
        exists: boolean;
        drug_id?: string;
        quantity?: number;
    }> {
        const result = await pool.query(
            `SELECT prescription_details_id, drug_id, quantity
             FROM prescription_details
             WHERE prescription_details_id = $1
               AND prescription_id = $2
               AND is_active = TRUE`,
            [detailId, prescriptionId]
        );
        if (result.rows.length === 0) return { exists: false };
        return { exists: true, drug_id: result.rows[0].drug_id, quantity: result.rows[0].quantity };
    }

    /** Lấy thông tin lô tồn kho */
    static async getInventoryBatch(inventoryId: string): Promise<{
        exists: boolean;
        drug_id?: string;
        stock_quantity?: number;
        expiry_date?: string;
    }> {
        const result = await pool.query(
            `SELECT pharmacy_inventory_id, drug_id, stock_quantity, expiry_date
             FROM pharmacy_inventory WHERE pharmacy_inventory_id = $1`,
            [inventoryId]
        );
        if (result.rows.length === 0) return { exists: false };
        return {
            exists: true,
            drug_id: result.rows[0].drug_id,
            stock_quantity: result.rows[0].stock_quantity,
            expiry_date: result.rows[0].expiry_date,
        };
    }

    /** Kiểm tra dược sĩ tồn tại */
    static async pharmacistExists(pharmacistId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM users WHERE users_id = $1 AND deleted_at IS NULL) AS exists`,
            [pharmacistId]
        );
        return result.rows[0].exists;
    }

    /** Kiểm tra thuốc tồn tại */
    static async drugExists(drugId: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT EXISTS(SELECT 1 FROM drugs WHERE drugs_id = $1 AND is_active = TRUE) AS exists`,
            [drugId]
        );
        return result.rows[0].exists;
    }

    /**
     * Lấy branch_id từ chuỗi: prescription → encounter → room → medical_rooms.branch_id
     * Dùng để validate facility match khi cấp phát
     */
    static async getBranchFromPrescription(prescriptionId: string): Promise<string | null> {
        const result = await pool.query(
            `SELECT mr.branch_id
             FROM prescriptions p
             JOIN encounters e ON e.encounters_id = p.encounter_id
             JOIN medical_rooms mr ON mr.medical_rooms_id = e.room_id
             WHERE p.prescriptions_id = $1`,
            [prescriptionId]
        );
        return result.rows[0]?.branch_id || null;
    }

    /**
     * Lấy branch_id từ chuỗi: inventory → warehouse → warehouse.branch_id
     * Dùng để validate facility match khi cấp phát
     */
    static async getBranchFromInventory(inventoryId: string): Promise<string | null> {
        const result = await pool.query(
            `SELECT w.branch_id
             FROM pharmacy_inventory pi
             JOIN warehouses w ON w.warehouse_id = pi.warehouse_id
             WHERE pi.pharmacy_inventory_id = $1`,
            [inventoryId]
        );
        return result.rows[0]?.branch_id || null;
    }

    //  DISPENSE (TRANSACTION) 

    /**
     * Xóa phiếu cấp phát CANCELLED cũ (để tránh vi phạm UNIQUE prescription_id)
     * Gọi trước khi tạo phiếu mới cho cùng prescription
     */
    static async deleteCancelledOrder(client: PoolClient, prescriptionId: string): Promise<void> {
        // Xóa details trước (FK constraint)
        await client.query(
            `DELETE FROM drug_dispense_details
             WHERE dispense_order_id IN (
                SELECT drug_dispense_orders_id FROM drug_dispense_orders
                WHERE prescription_id = $1 AND status = 'CANCELLED'
             )`,
            [prescriptionId]
        );
        // Xóa order
        await client.query(
            `DELETE FROM drug_dispense_orders WHERE prescription_id = $1 AND status = 'CANCELLED'`,
            [prescriptionId]
        );
    }

    /**
     * Tạo phiếu cấp phát (header) trong transaction
     */
    static async createOrder(
        client: PoolClient,
        orderId: string,
        code: string,
        prescriptionId: string,
        pharmacistId: string,
        notes?: string
    ): Promise<DispenseOrder> {
        // Xóa phiếu CANCELLED cũ nếu có (re-dispense sau hủy)
        await this.deleteCancelledOrder(client, prescriptionId);

        const result = await client.query(
            `INSERT INTO drug_dispense_orders
                (drug_dispense_orders_id, dispense_code, prescription_id, pharmacist_id, status, notes, dispensed_at)
             VALUES ($1, $2, $3, $4, 'COMPLETED', $5, NOW())
             RETURNING *`,
            [orderId, code, prescriptionId, pharmacistId, notes || null]
        );
        return result.rows[0];
    }

    /**
     * Tạo chi tiết dòng cấp phát trong transaction
     */
    static async createDetail(
        client: PoolClient,
        detailId: string,
        orderId: string,
        item: DispenseItemInput
    ): Promise<DispenseDetail> {
        const result = await client.query(
            `INSERT INTO drug_dispense_details
                (drug_dispense_details_id, dispense_order_id, prescription_detail_id, inventory_id, dispensed_quantity)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [detailId, orderId, item.prescription_detail_id, item.inventory_id, item.dispensed_quantity]
        );
        return result.rows[0];
    }

    /**
     * Trừ tồn kho trong transaction (có kiểm tra stock >= quantity)
     */
    static async deductStock(
        client: PoolClient,
        inventoryId: string,
        quantity: number
    ): Promise<boolean> {
        const result = await client.query(
            `UPDATE pharmacy_inventory
             SET stock_quantity = stock_quantity - $2
             WHERE pharmacy_inventory_id = $1
               AND stock_quantity >= $2
             RETURNING pharmacy_inventory_id`,
            [inventoryId, quantity]
        );
        return result.rowCount !== null && result.rowCount > 0;
    }

    /**
     * Cập nhật trạng thái đơn thuốc trong transaction
     */
    static async updatePrescriptionStatus(
        client: PoolClient,
        prescriptionId: string,
        status: string
    ): Promise<void> {
        await client.query(
            `UPDATE prescriptions SET status = $2 WHERE prescriptions_id = $1`,
            [prescriptionId, status]
        );
    }

    //  CANCEL (TRANSACTION) 

    /** Lấy phiếu cấp phát theo ID */
    static async getOrderById(orderId: string): Promise<DispenseOrder | null> {
        const result = await pool.query(
            `SELECT * FROM drug_dispense_orders WHERE drug_dispense_orders_id = $1`,
            [orderId]
        );
        return result.rows[0] || null;
    }

    /** Lấy danh sách chi tiết của phiếu (để hoàn kho) */
    static async getDetailsByOrderId(orderId: string): Promise<DispenseDetail[]> {
        const result = await pool.query(
            `SELECT * FROM drug_dispense_details WHERE dispense_order_id = $1`,
            [orderId]
        );
        return result.rows;
    }

    /** Hoàn tồn kho trong transaction */
    static async restoreStock(
        client: PoolClient,
        inventoryId: string,
        quantity: number
    ): Promise<void> {
        await client.query(
            `UPDATE pharmacy_inventory
             SET stock_quantity = stock_quantity + $2
             WHERE pharmacy_inventory_id = $1`,
            [inventoryId, quantity]
        );
    }

    /** Hủy phiếu cấp phát trong transaction */
    static async cancelOrder(
        client: PoolClient,
        orderId: string,
        reason: string
    ): Promise<void> {
        await client.query(
            `UPDATE drug_dispense_orders
             SET status = 'CANCELLED', cancelled_at = NOW(), cancelled_reason = $2
             WHERE drug_dispense_orders_id = $1`,
            [orderId, reason]
        );
    }

    //  QUERIES 

    /**
     * Xem phiếu cấp phát theo đơn thuốc (JOIN đầy đủ thông tin)
     */
    static async findByPrescriptionId(prescriptionId: string): Promise<{
        order: DispenseOrder | null;
        details: DispenseDetail[];
    }> {
        const orderResult = await pool.query(
            `SELECT ddo.*,
                    up.full_name AS pharmacist_name,
                    p.prescription_code,
                    p.patient_id,
                    pat.full_name AS patient_name,
                    up_doc.full_name AS doctor_name
             FROM drug_dispense_orders ddo
             LEFT JOIN user_profiles up ON up.user_id = ddo.pharmacist_id
             LEFT JOIN prescriptions p ON p.prescriptions_id = ddo.prescription_id
             LEFT JOIN patients pat ON pat.id::text = p.patient_id
             LEFT JOIN user_profiles up_doc ON up_doc.user_id = p.doctor_id
             WHERE ddo.prescription_id = $1
             ORDER BY ddo.dispensed_at DESC
             LIMIT 1`,
            [prescriptionId]
        );

        const order = orderResult.rows[0] || null;
        if (!order) return { order: null, details: [] };

        const detailsResult = await pool.query(
            `SELECT ddd.*,
                    d.drug_code,
                    d.brand_name,
                    d.active_ingredients,
                    d.dispensing_unit,
                    pi.batch_number,
                    pi.expiry_date,
                    pi.location_bin,
                    pi.unit_price
             FROM drug_dispense_details ddd
             LEFT JOIN prescription_details pd ON pd.prescription_details_id = ddd.prescription_detail_id
             LEFT JOIN drugs d ON d.drugs_id = pd.drug_id
             LEFT JOIN pharmacy_inventory pi ON pi.pharmacy_inventory_id = ddd.inventory_id
             WHERE ddd.dispense_order_id = $1`,
            [order.drug_dispense_orders_id]
        );

        return { order, details: detailsResult.rows };
    }

    /**
     * Lịch sử cấp phát (phân trang + filter)
     */
    static async findHistory(
        page: number,
        limit: number,
        status?: string,
        fromDate?: string,
        toDate?: string
    ): Promise<{ data: DispenseOrder[]; total: number }> {
        const conditions: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (status) {
            conditions.push(`ddo.status = $${paramIndex++}`);
            values.push(status);
        }
        if (fromDate) {
            conditions.push(`ddo.dispensed_at >= $${paramIndex++}`);
            values.push(fromDate);
        }
        if (toDate) {
            conditions.push(`ddo.dispensed_at <= ($${paramIndex++}::date + INTERVAL '1 day')`);
            values.push(toDate);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const offset = (page - 1) * limit;

        const countResult = await pool.query(
            `SELECT COUNT(*)::int AS total FROM drug_dispense_orders ddo ${whereClause}`,
            values
        );

        const dataValues = [...values, limit, offset];
        const dataResult = await pool.query(
            `SELECT ddo.*,
                    up.full_name AS pharmacist_name,
                    p.prescription_code,
                    p.patient_id,
                    pat.full_name AS patient_name,
                    up_doc.full_name AS doctor_name
             FROM drug_dispense_orders ddo
             LEFT JOIN user_profiles up ON up.user_id = ddo.pharmacist_id
             LEFT JOIN prescriptions p ON p.prescriptions_id = ddo.prescription_id
             LEFT JOIN patients pat ON pat.id::text = p.patient_id
             LEFT JOIN user_profiles up_doc ON up_doc.user_id = p.doctor_id
             ${whereClause}
             ORDER BY ddo.dispensed_at DESC
             LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
            dataValues
        );

        return { data: dataResult.rows, total: countResult.rows[0].total };
    }

    /**
     * Lịch sử cấp phát theo dược sĩ (phân trang)
     */
    static async findByPharmacistId(
        pharmacistId: string,
        page: number,
        limit: number,
        fromDate?: string,
        toDate?: string
    ): Promise<{ data: DispenseOrder[]; total: number }> {
        const conditions: string[] = ['ddo.pharmacist_id = $1'];
        const values: any[] = [pharmacistId];
        let paramIndex = 2;

        if (fromDate) {
            conditions.push(`ddo.dispensed_at >= $${paramIndex++}`);
            values.push(fromDate);
        }
        if (toDate) {
            conditions.push(`ddo.dispensed_at <= ($${paramIndex++}::date + INTERVAL '1 day')`);
            values.push(toDate);
        }

        const whereClause = conditions.join(' AND ');
        const offset = (page - 1) * limit;

        const countResult = await pool.query(
            `SELECT COUNT(*)::int AS total FROM drug_dispense_orders ddo WHERE ${whereClause}`,
            values
        );

        const dataValues = [...values, limit, offset];
        const dataResult = await pool.query(
            `SELECT ddo.*,
                    up.full_name AS pharmacist_name,
                    p.prescription_code,
                    pat.full_name AS patient_name
             FROM drug_dispense_orders ddo
             LEFT JOIN user_profiles up ON up.user_id = ddo.pharmacist_id
             LEFT JOIN prescriptions p ON p.prescriptions_id = ddo.prescription_id
             LEFT JOIN patients pat ON pat.id::text = p.patient_id
             WHERE ${whereClause}
             ORDER BY ddo.dispensed_at DESC
             LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
            dataValues
        );

        return { data: dataResult.rows, total: countResult.rows[0].total };
    }

    /**
     * Lấy tồn kho theo thuốc (FEFO — First Expired First Out)
     * Chỉ lấy lô còn hàng và chưa hết hạn
     */
    static async getInventoryByDrugId(drugId: string): Promise<InventoryBatch[]> {
        const result = await pool.query(
            `SELECT pi.*,
                    d.drug_code,
                    d.brand_name,
                    d.dispensing_unit
             FROM pharmacy_inventory pi
             LEFT JOIN drugs d ON d.drugs_id = pi.drug_id
             WHERE pi.drug_id = $1
               AND pi.stock_quantity > 0
               AND pi.expiry_date > CURRENT_DATE
             ORDER BY pi.expiry_date ASC`,
            [drugId]
        );
        return result.rows;
    }

    /**
     * Kiểm tra tồn kho đủ cho số lượng yêu cầu
     */
    static async checkStock(drugId: string, requiredQuantity: number): Promise<StockCheckResult> {
        const batches = await this.getInventoryByDrugId(drugId);
        const totalAvailable = batches.reduce((sum, b) => sum + b.stock_quantity, 0);

        const drugResult = await pool.query(
            `SELECT drug_code, brand_name FROM drugs WHERE drugs_id = $1`,
            [drugId]
        );
        const drugInfo = drugResult.rows[0] || {};

        return {
            drug_id: drugId,
            drug_code: drugInfo.drug_code || '',
            brand_name: drugInfo.brand_name || '',
            requested_quantity: requiredQuantity,
            total_available: totalAvailable,
            is_sufficient: totalAvailable >= requiredQuantity,
            batches,
        };
    }
}
