import { pool } from '../../config/postgresdb';
import { PoolClient } from 'pg';
import {
    PaymentOrder,
    GatewayConfig,
    UpdateGatewayConfigInput,
    PaginatedPaymentOrders,
    OnlinePaymentStats,
} from '../../models/Billing/billing-payment-gateway.model';

export class PaymentGatewayRepository {

    /** Lấy client cho transaction */
    static async getClient(): Promise<PoolClient> {
        return await pool.connect();
    }

    // PAYMENT ORDERS

    /** Tạo lệnh thanh toán QR */
    static async createPaymentOrder(
        orderId: string,
        orderCode: string,
        invoiceId: string,
        amount: number,
        description: string,
        qrCodeUrl: string,
        expiresAt: Date,
        userId: string,
        client?: PoolClient
    ): Promise<PaymentOrder> {
        const sql = `
            INSERT INTO payment_orders (
                payment_orders_id, order_code, invoice_id, amount,
                description, qr_code_url, status, expires_at, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, $8)
            RETURNING *
        `;
        const params = [orderId, orderCode, invoiceId, amount, description, qrCodeUrl, expiresAt, userId];
        const executor = client || pool;
        const result = await executor.query(sql, params);
        return result.rows[0];
    }

    /** Lấy chi tiết lệnh thanh toán */
    static async getOrderById(orderId: string): Promise<PaymentOrder | null> {
        const sql = `
            SELECT po.*,
                   i.invoice_code,
                   p.full_name as patient_name,
                   GREATEST(0, EXTRACT(EPOCH FROM (po.expires_at - CURRENT_TIMESTAMP)))::int as remaining_seconds
            FROM payment_orders po
            LEFT JOIN invoices i ON po.invoice_id = i.invoices_id
            LEFT JOIN patients p ON i.patient_id = p.id
            WHERE po.payment_orders_id = $1
        `;
        const result = await pool.query(sql, [orderId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Tìm lệnh thanh toán theo order_code */
    static async getOrderByCode(orderCode: string): Promise<PaymentOrder | null> {
        const sql = `SELECT * FROM payment_orders WHERE order_code = $1`;
        const result = await pool.query(sql, [orderCode]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Lấy lệnh PENDING chưa hết hạn cho invoice */
    static async getPendingOrderByInvoice(invoiceId: string): Promise<PaymentOrder | null> {
        const sql = `
            SELECT * FROM payment_orders
            WHERE invoice_id = $1 AND status = 'PENDING' AND expires_at > CURRENT_TIMESTAMP
            ORDER BY created_at DESC LIMIT 1
        `;
        const result = await pool.query(sql, [invoiceId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Cập nhật trạng thái PAID sau khi webhook xác nhận */
    static async markOrderPaid(
        orderId: string,
        gatewayTransactionId: string,
        gatewayResponse: any,
        client?: PoolClient
    ): Promise<PaymentOrder> {
        const sql = `
            UPDATE payment_orders SET
                status = 'PAID',
                paid_at = CURRENT_TIMESTAMP,
                gateway_transaction_id = $2,
                gateway_response = $3,
                updated_at = CURRENT_TIMESTAMP
            WHERE payment_orders_id = $1
            RETURNING *
        `;
        const executor = client || pool;
        const result = await executor.query(sql, [orderId, gatewayTransactionId, JSON.stringify(gatewayResponse)]);
        return result.rows[0];
    }

    /** Hủy lệnh thanh toán */
    static async cancelOrder(orderId: string): Promise<PaymentOrder> {
        const sql = `
            UPDATE payment_orders SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
            WHERE payment_orders_id = $1
            RETURNING *
        `;
        const result = await pool.query(sql, [orderId]);
        return result.rows[0];
    }

    /** Chuyển các order hết hạn sang EXPIRED — chạy bởi cron job */
    static async expirePendingOrders(): Promise<number> {
        const sql = `
            UPDATE payment_orders SET status = 'EXPIRED', updated_at = CURRENT_TIMESTAMP
            WHERE status = 'PENDING' AND expires_at <= CURRENT_TIMESTAMP
        `;
        const result = await pool.query(sql);
        return result.rowCount || 0;
    }

    /** Danh sách lệnh thanh toán theo invoice */
    static async getOrdersByInvoice(invoiceId: string): Promise<PaymentOrder[]> {
        const sql = `
            SELECT po.*,
                   GREATEST(0, EXTRACT(EPOCH FROM (po.expires_at - CURRENT_TIMESTAMP)))::int as remaining_seconds
            FROM payment_orders po
            WHERE po.invoice_id = $1
            ORDER BY po.created_at DESC
        `;
        const result = await pool.query(sql, [invoiceId]);
        return result.rows;
    }

    /** Tìm order dựa trên nội dung chuyển khoản (content match) */
    static async findOrderByTransferContent(content: string): Promise<PaymentOrder | null> {

        const normalized = content.toUpperCase();

        /* Match pattern: EHEALTH + 5 số (VD: EHEALTH83921) */
        const match = normalized.match(/EHEALTH(\d{5})/);
        if (!match) return null;

        const orderCode = `EHealth${match[1]}`;
        return await this.getOrderByCode(orderCode);
    }

    // LỊCH SỬ & THỐNG KÊ

    /** Lịch sử thanh toán online với filter + phân trang */
    static async getOnlinePaymentHistory(
        status?: string,
        dateFrom?: string,
        dateTo?: string,
        search?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedPaymentOrders> {
        const conditions: string[] = [];
        const params: any[] = [];
        let idx = 1;

        if (status) { conditions.push(`po.status = $${idx++}`); params.push(status); }
        if (dateFrom) { conditions.push(`po.created_at >= $${idx++}`); params.push(dateFrom); }
        if (dateTo) { conditions.push(`po.created_at <= $${idx++}::timestamptz + interval '1 day'`); params.push(dateTo); }
        if (search) {
            conditions.push(`(po.order_code ILIKE $${idx} OR i.invoice_code ILIKE $${idx} OR p.full_name ILIKE $${idx})`);
            params.push(`%${search}%`);
            idx++;
        }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const countSql = `
            SELECT COUNT(*) as total FROM payment_orders po
            LEFT JOIN invoices i ON po.invoice_id = i.invoices_id
            LEFT JOIN patients p ON i.patient_id = p.id
            ${where}
        `;
        const countResult = await pool.query(countSql, params);
        const total = parseInt(countResult.rows[0].total);

        const offset = (page - 1) * limit;
        const dataSql = `
            SELECT po.*,
                   i.invoice_code,
                   p.full_name as patient_name,
                   GREATEST(0, EXTRACT(EPOCH FROM (po.expires_at - CURRENT_TIMESTAMP)))::int as remaining_seconds
            FROM payment_orders po
            LEFT JOIN invoices i ON po.invoice_id = i.invoices_id
            LEFT JOIN patients p ON i.patient_id = p.id
            ${where}
            ORDER BY po.created_at DESC
            LIMIT $${idx} OFFSET $${idx + 1}
        `;
        params.push(limit, offset);
        const dataResult = await pool.query(dataSql, params);

        return {
            data: dataResult.rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /** Thống kê thanh toán online */
    static async getOnlinePaymentStats(
        dateFrom?: string,
        dateTo?: string
    ): Promise<OnlinePaymentStats> {
        const conditions: string[] = [];
        const params: any[] = [];
        let idx = 1;

        if (dateFrom) { conditions.push(`po.created_at >= $${idx++}`); params.push(dateFrom); }
        if (dateTo) { conditions.push(`po.created_at <= $${idx++}::timestamptz + interval '1 day'`); params.push(dateTo); }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const sql = `
            SELECT
                COUNT(*) as total_orders,
                COUNT(*) FILTER (WHERE po.status = 'PAID') as total_paid,
                COUNT(*) FILTER (WHERE po.status = 'EXPIRED') as total_expired,
                COUNT(*) FILTER (WHERE po.status = 'CANCELLED') as total_cancelled,
                COUNT(*) FILTER (WHERE po.status = 'PENDING') as total_pending,
                COALESCE(SUM(po.amount) FILTER (WHERE po.status = 'PAID'), 0) as total_amount_paid
            FROM payment_orders po ${where}
        `;
        const result = await pool.query(sql, params);

        const statusSql = `
            SELECT po.status, COUNT(*) as count, COALESCE(SUM(po.amount), 0) as amount
            FROM payment_orders po ${where}
            GROUP BY po.status
        `;
        const statusResult = await pool.query(statusSql, params);

        return {
            ...result.rows[0],
            orders_by_status: statusResult.rows,
        };
    }

    // GATEWAY CONFIG

    /** Lấy cấu hình gateway hiện tại */
    static async getGatewayConfig(gatewayName: string = 'SEPAY'): Promise<GatewayConfig | null> {
        const sql = `SELECT * FROM payment_gateway_config WHERE gateway_name = $1`;
        const result = await pool.query(sql, [gatewayName]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Cập nhật cấu hình gateway */
    static async updateGatewayConfig(
        gatewayName: string,
        input: UpdateGatewayConfigInput
    ): Promise<GatewayConfig> {
        const sets: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const params: any[] = [];
        let idx = 1;

        if (input.merchant_id !== undefined) { sets.push(`merchant_id = $${idx++}`); params.push(input.merchant_id); }
        if (input.api_key !== undefined) { sets.push(`api_key = $${idx++}`); params.push(input.api_key); }
        if (input.secret_key !== undefined) { sets.push(`secret_key = $${idx++}`); params.push(input.secret_key); }
        if (input.webhook_secret !== undefined) { sets.push(`webhook_secret = $${idx++}`); params.push(input.webhook_secret); }
        if (input.environment !== undefined) { sets.push(`environment = $${idx++}`); params.push(input.environment); }
        if (input.bank_account_number !== undefined) { sets.push(`bank_account_number = $${idx++}`); params.push(input.bank_account_number); }
        if (input.bank_name !== undefined) { sets.push(`bank_name = $${idx++}`); params.push(input.bank_name); }
        if (input.account_holder !== undefined) { sets.push(`account_holder = $${idx++}`); params.push(input.account_holder); }
        if (input.va_account !== undefined) { sets.push(`va_account = $${idx++}`); params.push(input.va_account); }
        if (input.is_active !== undefined) { sets.push(`is_active = $${idx++}`); params.push(input.is_active); }

        params.push(gatewayName);
        const sql = `UPDATE payment_gateway_config SET ${sets.join(', ')} WHERE gateway_name = $${idx} RETURNING *`;
        const result = await pool.query(sql, params);
        return result.rows[0];
    }
}
