import { pool } from '../../config/postgresdb';
import { PoolClient } from 'pg';
import {
    RefundRequest,
    TransactionAdjustment,
    RefundTimelineEvent,
    PaginatedResult,
} from '../../models/Billing/billing-refund.model';

export class BillingRefundRepository {

    static async getClient(): Promise<PoolClient> {
        return await pool.connect();
    }

    // REFUND REQUESTS

    /** Tạo yêu cầu hoàn tiền */
    static async createRefundRequest(data: Partial<RefundRequest>, client?: PoolClient): Promise<RefundRequest> {
        const sql = `
            INSERT INTO refund_requests (
                request_id, request_code, transaction_id, invoice_id, patient_id,
                refund_type, original_amount, refund_amount, refund_method,
                reason_category, reason_detail, evidence_urls,
                status, requested_by, notes, facility_id
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
            RETURNING *
        `;
        const executor = client || pool;
        const result = await executor.query(sql, [
            data.request_id, data.request_code, data.transaction_id, data.invoice_id,
            data.patient_id || null,
            data.refund_type, data.original_amount, data.refund_amount, data.refund_method,
            data.reason_category, data.reason_detail || null,
            data.evidence_urls ? JSON.stringify(data.evidence_urls) : null,
            data.status || 'PENDING', data.requested_by || null,
            data.notes || null, data.facility_id || null,
        ]);
        return result.rows[0];
    }

    /** Cập nhật trạng thái + extra fields */
    static async updateRefundStatus(
        requestId: string, status: string, extraFields: Record<string, any> = {}, client?: PoolClient
    ): Promise<RefundRequest> {
        const sets = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
        const params: any[] = [requestId, status];
        let idx = 3;
        for (const [key, value] of Object.entries(extraFields)) {
            sets.push(`${key} = $${idx++}`);
            params.push(value);
        }
        const sql = `UPDATE refund_requests SET ${sets.join(', ')} WHERE request_id = $1 RETURNING *`;
        const executor = client || pool;
        const result = await executor.query(sql, params);
        return result.rows[0];
    }

    /** Chi tiết */
    static async getRefundById(requestId: string): Promise<RefundRequest | null> {
        const sql = `
            SELECT rr.*,
                   up1.full_name as requested_by_name,
                   up2.full_name as approved_by_name,
                   up3.full_name as rejected_by_name,
                   up4.full_name as processed_by_name,
                   p.full_name as patient_name,
                   i.invoice_code,
                   pt.transaction_code,
                   pt.payment_method as original_payment_method
            FROM refund_requests rr
            LEFT JOIN user_profiles up1 ON rr.requested_by = up1.user_id
            LEFT JOIN user_profiles up2 ON rr.approved_by = up2.user_id
            LEFT JOIN user_profiles up3 ON rr.rejected_by = up3.user_id
            LEFT JOIN user_profiles up4 ON rr.processed_by = up4.user_id
            LEFT JOIN patients p ON rr.patient_id = p.patients_id
            LEFT JOIN invoices i ON rr.invoice_id = i.invoices_id
            LEFT JOIN payment_transactions pt ON rr.transaction_id = pt.payment_transactions_id
            WHERE rr.request_id = $1
        `;
        const result = await pool.query(sql, [requestId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Danh sách yêu cầu */
    static async getRefundRequests(
        status?: string, refundType?: string, reasonCategory?: string,
        patientId?: string, dateFrom?: string, dateTo?: string,
        page: number = 1, limit: number = 20
    ): Promise<PaginatedResult<RefundRequest>> {
        const conditions: string[] = [];
        const params: any[] = [];
        let idx = 1;

        if (status) { conditions.push(`rr.status = $${idx++}`); params.push(status); }
        if (refundType) { conditions.push(`rr.refund_type = $${idx++}`); params.push(refundType); }
        if (reasonCategory) { conditions.push(`rr.reason_category = $${idx++}`); params.push(reasonCategory); }
        if (patientId) { conditions.push(`rr.patient_id = $${idx++}`); params.push(patientId); }
        if (dateFrom) { conditions.push(`rr.requested_at >= $${idx++}`); params.push(dateFrom); }
        if (dateTo) { conditions.push(`rr.requested_at <= $${idx++}::date + INTERVAL '1 day'`); params.push(dateTo); }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const countResult = await pool.query(`SELECT COUNT(*) as total FROM refund_requests rr ${where}`, params);
        const total = parseInt(countResult.rows[0].total);

        const offset = (page - 1) * limit;
        const dataSql = `
            SELECT rr.*,
                   up1.full_name as requested_by_name,
                   p.full_name as patient_name,
                   i.invoice_code,
                   pt.transaction_code
            FROM refund_requests rr
            LEFT JOIN user_profiles up1 ON rr.requested_by = up1.user_id
            LEFT JOIN patients p ON rr.patient_id = p.patients_id
            LEFT JOIN invoices i ON rr.invoice_id = i.invoices_id
            LEFT JOIN payment_transactions pt ON rr.transaction_id = pt.payment_transactions_id
            ${where}
            ORDER BY rr.requested_at DESC
            LIMIT $${idx} OFFSET $${idx + 1}
        `;
        params.push(limit, offset);
        const dataResult = await pool.query(dataSql, params);

        return { data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    /** Tổng tiền đã hoàn cho 1 GD gốc (từ refund_requests COMPLETED) */
    static async getTotalRefundedForTransaction(transactionId: string): Promise<number> {
        const sql = `
            SELECT COALESCE(SUM(refund_amount), 0) as total
            FROM refund_requests
            WHERE transaction_id = $1 AND status IN ('COMPLETED', 'PROCESSING', 'APPROVED')
        `;
        const result = await pool.query(sql, [transactionId]);
        return parseFloat(result.rows[0].total);
    }

    /** Lấy GD gốc */
    static async getTransactionById(transactionId: string): Promise<any | null> {
        const sql = `
            SELECT pt.*, i.patient_id, i.invoices_id as invoice_id,
                   i.invoice_code, i.net_amount, i.paid_amount
            FROM payment_transactions pt
            JOIN invoices i ON pt.invoice_id = i.invoices_id
            WHERE pt.payment_transactions_id = $1
        `;
        const result = await pool.query(sql, [transactionId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Tạo giao dịch hoàn trong payment_transactions (Module 9.2) */
    static async createRefundTransaction(
        txnId: string, txnCode: string, invoiceId: string,
        amount: number, paymentMethod: string, notes: string,
        cashierId: string, client: PoolClient
    ): Promise<any> {
        const sql = `
            INSERT INTO payment_transactions (
                payment_transactions_id, transaction_code, invoice_id,
                transaction_type, payment_method, amount,
                status, cashier_id, notes
            ) VALUES ($1, $2, $3, 'REFUND', $4, $5, 'SUCCESS', $6, $7)
            RETURNING *
        `;
        const result = await client.query(sql, [txnId, txnCode, invoiceId, paymentMethod, amount, cashierId, notes]);
        return result.rows[0];
    }

    /** Cập nhật paid_amount trên invoice (Module 9.2) */
    static async updateInvoicePaidAmount(invoiceId: string, client: PoolClient): Promise<void> {
        const sql = `
            UPDATE invoices SET
                paid_amount = COALESCE((
                    SELECT SUM(CASE
                        WHEN transaction_type = 'PAYMENT' AND status = 'SUCCESS' THEN amount
                        WHEN transaction_type = 'REFUND' AND status = 'SUCCESS' THEN -amount
                        ELSE 0 END)
                    FROM payment_transactions WHERE invoice_id = $1
                ), 0),
                status = CASE
                    WHEN COALESCE((
                        SELECT SUM(CASE
                            WHEN transaction_type = 'PAYMENT' AND status = 'SUCCESS' THEN amount
                            WHEN transaction_type = 'REFUND' AND status = 'SUCCESS' THEN -amount
                            ELSE 0 END)
                        FROM payment_transactions WHERE invoice_id = $1
                    ), 0) >= net_amount THEN 'PAID'
                    WHEN COALESCE((
                        SELECT SUM(CASE
                            WHEN transaction_type = 'PAYMENT' AND status = 'SUCCESS' THEN amount
                            WHEN transaction_type = 'REFUND' AND status = 'SUCCESS' THEN -amount
                            ELSE 0 END)
                        FROM payment_transactions WHERE invoice_id = $1
                    ), 0) > 0 THEN 'PARTIAL'
                    ELSE 'UNPAID'
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE invoices_id = $1
        `;
        await client.query(sql, [invoiceId]);
    }

    // TRANSACTION ADJUSTMENTS

    /** Tạo điều chỉnh */
    static async createAdjustment(data: Partial<TransactionAdjustment>): Promise<TransactionAdjustment> {
        const sql = `
            INSERT INTO transaction_adjustments (
                adjustment_id, adjustment_code, original_transaction_id, invoice_id,
                adjustment_type, adjustment_amount, description,
                status, requested_by, notes
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            RETURNING *
        `;
        const result = await pool.query(sql, [
            data.adjustment_id, data.adjustment_code,
            data.original_transaction_id, data.invoice_id,
            data.adjustment_type, data.adjustment_amount, data.description,
            data.status || 'PENDING', data.requested_by || null, data.notes || null,
        ]);
        return result.rows[0];
    }

    /** Cập nhật trạng thái điều chỉnh */
    static async updateAdjustmentStatus(
        adjustmentId: string, status: string, extraFields: Record<string, any> = {}, client?: PoolClient
    ): Promise<TransactionAdjustment> {
        const sets = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
        const params: any[] = [adjustmentId, status];
        let idx = 3;
        for (const [key, value] of Object.entries(extraFields)) {
            sets.push(`${key} = $${idx++}`);
            params.push(value);
        }
        const sql = `UPDATE transaction_adjustments SET ${sets.join(', ')} WHERE adjustment_id = $1 RETURNING *`;
        const executor = client || pool;
        const result = await executor.query(sql, params);
        return result.rows[0];
    }

    /** Chi tiết điều chỉnh */
    static async getAdjustmentById(adjustmentId: string): Promise<TransactionAdjustment | null> {
        const sql = `
            SELECT ta.*,
                   up1.full_name as requested_by_name,
                   up2.full_name as approved_by_name,
                   up3.full_name as applied_by_name,
                   i.invoice_code,
                   pt.transaction_code
            FROM transaction_adjustments ta
            LEFT JOIN user_profiles up1 ON ta.requested_by = up1.user_id
            LEFT JOIN user_profiles up2 ON ta.approved_by = up2.user_id
            LEFT JOIN user_profiles up3 ON ta.applied_by = up3.user_id
            LEFT JOIN invoices i ON ta.invoice_id = i.invoices_id
            LEFT JOIN payment_transactions pt ON ta.original_transaction_id = pt.payment_transactions_id
            WHERE ta.adjustment_id = $1
        `;
        const result = await pool.query(sql, [adjustmentId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Danh sách điều chỉnh */
    static async getAdjustments(
        status?: string, adjustmentType?: string,
        dateFrom?: string, dateTo?: string,
        page: number = 1, limit: number = 20
    ): Promise<PaginatedResult<TransactionAdjustment>> {
        const conditions: string[] = [];
        const params: any[] = [];
        let idx = 1;

        if (status) { conditions.push(`ta.status = $${idx++}`); params.push(status); }
        if (adjustmentType) { conditions.push(`ta.adjustment_type = $${idx++}`); params.push(adjustmentType); }
        if (dateFrom) { conditions.push(`ta.requested_at >= $${idx++}`); params.push(dateFrom); }
        if (dateTo) { conditions.push(`ta.requested_at <= $${idx++}::date + INTERVAL '1 day'`); params.push(dateTo); }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const countResult = await pool.query(`SELECT COUNT(*) as total FROM transaction_adjustments ta ${where}`, params);
        const total = parseInt(countResult.rows[0].total);

        const offset = (page - 1) * limit;
        const dataSql = `
            SELECT ta.*, up.full_name as requested_by_name,
                   i.invoice_code, pt.transaction_code
            FROM transaction_adjustments ta
            LEFT JOIN user_profiles up ON ta.requested_by = up.user_id
            LEFT JOIN invoices i ON ta.invoice_id = i.invoices_id
            LEFT JOIN payment_transactions pt ON ta.original_transaction_id = pt.payment_transactions_id
            ${where}
            ORDER BY ta.requested_at DESC
            LIMIT $${idx} OFFSET $${idx + 1}
        `;
        params.push(limit, offset);
        const dataResult = await pool.query(dataSql, params);

        return { data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // DASHBOARD & TRACKING

    /** Dashboard stats */
    static async getDashboardStats(): Promise<any> {
        const sql = `
            SELECT
                COUNT(*) FILTER (WHERE status = 'PENDING') as pending_count,
                COALESCE(SUM(refund_amount) FILTER (WHERE status = 'PENDING'), 0) as pending_amount,
                COALESCE(SUM(refund_amount) FILTER (WHERE status = 'COMPLETED'), 0) as total_refunded,
                COUNT(*) FILTER (WHERE status = 'COMPLETED') as total_refund_count
            FROM refund_requests
        `;
        const result = await pool.query(sql);
        return result.rows[0];
    }

    /** Thống kê theo lý do */
    static async getRefundsByReason(): Promise<any[]> {
        const sql = `
            SELECT reason_category,
                   COUNT(*) as count,
                   COALESCE(SUM(refund_amount), 0) as total
            FROM refund_requests
            WHERE status NOT IN ('CANCELLED')
            GROUP BY reason_category ORDER BY total DESC
        `;
        const result = await pool.query(sql);
        return result.rows;
    }

    /** Thống kê theo trạng thái */
    static async getRefundsByStatus(): Promise<any[]> {
        const sql = `
            SELECT status, COUNT(*) as count
            FROM refund_requests
            GROUP BY status ORDER BY count DESC
        `;
        const result = await pool.query(sql);
        return result.rows;
    }

    /** Recent pending */
    static async getRecentPending(limit: number = 10): Promise<RefundRequest[]> {
        const sql = `
            SELECT rr.*, up.full_name as requested_by_name,
                   p.full_name as patient_name, i.invoice_code
            FROM refund_requests rr
            LEFT JOIN user_profiles up ON rr.requested_by = up.user_id
            LEFT JOIN patients p ON rr.patient_id = p.patients_id
            LEFT JOIN invoices i ON rr.invoice_id = i.invoices_id
            WHERE rr.status = 'PENDING'
            ORDER BY rr.requested_at DESC LIMIT $1
        `;
        const result = await pool.query(sql, [limit]);
        return result.rows;
    }

    /** Lịch sử hoàn/điều chỉnh cho 1 GD */
    static async getTransactionRefundHistory(transactionId: string): Promise<any> {
        const refundsSql = `
            SELECT rr.*, up.full_name as requested_by_name
            FROM refund_requests rr
            LEFT JOIN user_profiles up ON rr.requested_by = up.user_id
            WHERE rr.transaction_id = $1
            ORDER BY rr.requested_at DESC
        `;
        const adjustmentsSql = `
            SELECT ta.*, up.full_name as requested_by_name
            FROM transaction_adjustments ta
            LEFT JOIN user_profiles up ON ta.requested_by = up.user_id
            WHERE ta.original_transaction_id = $1
            ORDER BY ta.requested_at DESC
        `;
        const [refunds, adjustments] = await Promise.all([
            pool.query(refundsSql, [transactionId]),
            pool.query(adjustmentsSql, [transactionId]),
        ]);
        return { refunds: refunds.rows, adjustments: adjustments.rows };
    }
}
