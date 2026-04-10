import { pool } from '../../config/postgresdb';
import { PoolClient } from 'pg';
import {
    PosTerminal,
    PaymentReceipt,
    ShiftCashDenomination,
    OfflineTransaction,
    CreateTerminalInput,
    UpdateTerminalInput,
    PaginatedResult,
} from '../../models/Billing/billing-offline-payment.model';

export class BillingOfflinePaymentRepository {

    /** Lấy client cho transaction */
    static async getClient(): Promise<PoolClient> {
        return await pool.connect();
    }

    // POS TERMINALS

    /** Tạo thiết bị POS mới */
    static async createTerminal(
        terminalId: string, input: CreateTerminalInput, userId: string
    ): Promise<PosTerminal> {
        const sql = `
            INSERT INTO pos_terminals (
                terminal_id, terminal_code, terminal_name, terminal_type,
                brand, model, serial_number, location_description,
                branch_id, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        const result = await pool.query(sql, [
            terminalId, input.terminal_code, input.terminal_name,
            input.terminal_type || 'COMBO',
            input.brand || null, input.model || null,
            input.serial_number || null, input.location_description || null,
            input.branch_id, userId,
        ]);
        return result.rows[0];
    }

    /** Cập nhật thiết bị POS */
    static async updateTerminal(terminalId: string, input: UpdateTerminalInput): Promise<PosTerminal> {
        const sets: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const params: any[] = [];
        let idx = 1;

        if (input.terminal_name !== undefined) { sets.push(`terminal_name = $${idx++}`); params.push(input.terminal_name); }
        if (input.terminal_type !== undefined) { sets.push(`terminal_type = $${idx++}`); params.push(input.terminal_type); }
        if (input.brand !== undefined) { sets.push(`brand = $${idx++}`); params.push(input.brand); }
        if (input.model !== undefined) { sets.push(`model = $${idx++}`); params.push(input.model); }
        if (input.serial_number !== undefined) { sets.push(`serial_number = $${idx++}`); params.push(input.serial_number); }
        if (input.location_description !== undefined) { sets.push(`location_description = $${idx++}`); params.push(input.location_description); }

        params.push(terminalId);
        const sql = `UPDATE pos_terminals SET ${sets.join(', ')} WHERE terminal_id = $${idx} RETURNING *`;
        const result = await pool.query(sql, params);
        return result.rows[0];
    }

    /** Bật/tắt thiết bị POS */
    static async toggleTerminal(terminalId: string): Promise<PosTerminal> {
        const sql = `
            UPDATE pos_terminals SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
            WHERE terminal_id = $1 RETURNING *
        `;
        const result = await pool.query(sql, [terminalId]);
        return result.rows[0];
    }

    /** Lấy danh sách POS theo chi nhánh */
    static async getTerminals(
        branchId?: string, isActive?: boolean,
        page: number = 1, limit: number = 20
    ): Promise<PaginatedResult<PosTerminal>> {
        const conditions: string[] = [];
        const params: any[] = [];
        let idx = 1;

        if (branchId) { conditions.push(`pt.branch_id = $${idx++}`); params.push(branchId); }
        if (isActive !== undefined) { conditions.push(`pt.is_active = $${idx++}`); params.push(isActive); }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const countSql = `SELECT COUNT(*) as total FROM pos_terminals pt ${where}`;
        const countResult = await pool.query(countSql, params);
        const total = parseInt(countResult.rows[0].total);

        const offset = (page - 1) * limit;
        const dataSql = `
            SELECT pt.*, b.name as branch_name
            FROM pos_terminals pt
            LEFT JOIN branches b ON pt.branch_id = b.branches_id
            ${where}
            ORDER BY pt.created_at DESC
            LIMIT $${idx} OFFSET $${idx + 1}
        `;
        params.push(limit, offset);
        const dataResult = await pool.query(dataSql, params);

        return { data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    /** Lấy chi tiết POS */
    static async getTerminalById(terminalId: string): Promise<PosTerminal | null> {
        const sql = `
            SELECT pt.*, b.name as branch_name
            FROM pos_terminals pt
            LEFT JOIN branches b ON pt.branch_id = b.branches_id
            WHERE pt.terminal_id = $1
        `;
        const result = await pool.query(sql, [terminalId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Kiểm tra mã POS đã tồn tại */
    static async checkTerminalCodeExists(code: string): Promise<boolean> {
        const r = await pool.query('SELECT 1 FROM pos_terminals WHERE terminal_code = $1', [code]);
        return r.rows.length > 0;
    }

    // OFFLINE PAYMENT PROCESSING

    /**
     * Tạo giao dịch thanh toán tại quầy — ghi shift_id + terminal_id
     * Liên kết trực tiếp vào payment_transactions (bảng chung với 9.2)
     */
    static async createOfflinePayment(
        paymentId: string,
        transactionCode: string,
        invoiceId: string,
        amount: number,
        paymentMethod: string,
        cashierId: string,
        shiftId: string,
        terminalId: string | null,
        approvalCode: string | null,
        cardLastFour: string | null,
        cardBrand: string | null,
        notes: string | null,
        client?: PoolClient
    ): Promise<OfflineTransaction> {
        const sql = `
            INSERT INTO payment_transactions (
                payment_transactions_id, transaction_code, invoice_id,
                transaction_type, payment_method, amount,
                status, cashier_id, shift_id,
                terminal_id, approval_code, card_last_four, card_brand,
                notes
            ) VALUES ($1, $2, $3, 'PAYMENT', $4, $5, 'SUCCESS', $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;
        const executor = client || pool;
        const result = await executor.query(sql, [
            paymentId, transactionCode, invoiceId,
            paymentMethod, amount, cashierId, shiftId,
            terminalId, approvalCode, cardLastFour, cardBrand, notes,
        ]);
        return result.rows[0];
    }

    /**
     * Hủy giao dịch (VOID)
     * Đánh dấu voided_at, voided_by, void_reason + đổi status sang VOIDED
     */
    static async voidTransaction(
        transactionId: string, reason: string, userId: string, client?: PoolClient
    ): Promise<OfflineTransaction> {
        const sql = `
            UPDATE payment_transactions SET
                status = 'VOIDED',
                voided_at = CURRENT_TIMESTAMP,
                voided_by = $2,
                void_reason = $3
            WHERE payment_transactions_id = $1
            RETURNING *
        `;
        const executor = client || pool;
        const result = await executor.query(sql, [transactionId, userId, reason]);
        return result.rows[0];
    }

    /** Lấy chi tiết giao dịch (cho VOID check) */
    static async getTransactionById(transactionId: string): Promise<OfflineTransaction | null> {
        const sql = `
            SELECT pt.*, up.full_name as cashier_name,
                   i.invoice_code, p.full_name as patient_name,
                   pos.terminal_name
            FROM payment_transactions pt
            LEFT JOIN user_profiles up ON pt.cashier_id = up.user_id
            LEFT JOIN invoices i ON pt.invoice_id = i.invoices_id
            LEFT JOIN patients p ON i.patient_id = p.id
            LEFT JOIN pos_terminals pos ON pt.terminal_id = pos.terminal_id
            WHERE pt.payment_transactions_id = $1
        `;
        const result = await pool.query(sql, [transactionId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /**
     * Danh sách giao dịch tại quầy
     * Chỉ lấy giao dịch có shift_id (phân biệt với online)
     */
    static async getOfflineTransactions(
        shiftId?: string, cashierId?: string, paymentMethod?: string,
        terminalId?: string, status?: string,
        dateFrom?: string, dateTo?: string,
        page: number = 1, limit: number = 20
    ): Promise<PaginatedResult<OfflineTransaction>> {
        const conditions: string[] = ['pt.shift_id IS NOT NULL'];
        const params: any[] = [];
        let idx = 1;

        if (shiftId) { conditions.push(`pt.shift_id = $${idx++}`); params.push(shiftId); }
        if (cashierId) { conditions.push(`pt.cashier_id = $${idx++}`); params.push(cashierId); }
        if (paymentMethod) { conditions.push(`pt.payment_method = $${idx++}`); params.push(paymentMethod); }
        if (terminalId) { conditions.push(`pt.terminal_id = $${idx++}`); params.push(terminalId); }
        if (status) { conditions.push(`pt.status = $${idx++}`); params.push(status); }
        if (dateFrom) { conditions.push(`pt.paid_at >= $${idx++}`); params.push(dateFrom); }
        if (dateTo) { conditions.push(`pt.paid_at <= $${idx++}::timestamptz + interval '1 day'`); params.push(dateTo); }

        const where = 'WHERE ' + conditions.join(' AND ');

        const countSql = `SELECT COUNT(*) as total FROM payment_transactions pt ${where}`;
        const countResult = await pool.query(countSql, params);
        const total = parseInt(countResult.rows[0].total);

        const offset = (page - 1) * limit;
        const dataSql = `
            SELECT pt.*, up.full_name as cashier_name,
                   i.invoice_code, p.full_name as patient_name,
                   pos.terminal_name
            FROM payment_transactions pt
            LEFT JOIN user_profiles up ON pt.cashier_id = up.user_id
            LEFT JOIN invoices i ON pt.invoice_id = i.invoices_id
            LEFT JOIN patients p ON i.patient_id = p.id
            LEFT JOIN pos_terminals pos ON pt.terminal_id = pos.terminal_id
            ${where}
            ORDER BY pt.paid_at DESC
            LIMIT $${idx} OFFSET $${idx + 1}
        `;
        params.push(limit, offset);
        const dataResult = await pool.query(dataSql, params);

        return { data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // RECEIPTS

    /** Tạo biên lai thanh toán */
    static async createReceipt(
        receiptId: string,
        receiptNumber: string,
        transactionId: string,
        invoiceId: string,
        patientId: string,
        patientName: string,
        patientCode: string | null,
        facilityName: string | null,
        facilityAddress: string | null,
        cashierName: string,
        cashierId: string,
        itemsSnapshot: any[],
        totalAmount: number,
        discountAmount: number,
        insuranceAmount: number,
        netAmount: number,
        paidAmount: number,
        paymentMethod: string,
        changeAmount: number,
        receiptType: string,
        shiftId: string | null,
        client?: PoolClient
    ): Promise<PaymentReceipt> {
        const sql = `
            INSERT INTO payment_receipts (
                receipt_id, receipt_number, payment_transaction_id,
                invoice_id, patient_id, patient_name, patient_code,
                facility_name, facility_address,
                cashier_name, cashier_id,
                items_snapshot, total_amount, discount_amount,
                insurance_amount, net_amount, paid_amount,
                payment_method, change_amount, receipt_type, shift_id
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
            RETURNING *
        `;
        const executor = client || pool;
        const result = await executor.query(sql, [
            receiptId, receiptNumber, transactionId,
            invoiceId, patientId, patientName, patientCode,
            facilityName, facilityAddress,
            cashierName, cashierId,
            JSON.stringify(itemsSnapshot), totalAmount, discountAmount,
            insuranceAmount, netAmount, paidAmount,
            paymentMethod, changeAmount, receiptType, shiftId,
        ]);
        return result.rows[0];
    }

    /** Lấy biên lai theo giao dịch */
    static async getReceiptByTransaction(transactionId: string): Promise<PaymentReceipt | null> {
        const sql = `
            SELECT pr.*, pt.transaction_code, i.invoice_code
            FROM payment_receipts pr
            LEFT JOIN payment_transactions pt ON pr.payment_transaction_id = pt.payment_transactions_id
            LEFT JOIN invoices i ON pr.invoice_id = i.invoices_id
            WHERE pr.payment_transaction_id = $1
        `;
        const result = await pool.query(sql, [transactionId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Lấy biên lai theo ID */
    static async getReceiptById(receiptId: string): Promise<PaymentReceipt | null> {
        const sql = `
            SELECT pr.*, pt.transaction_code, i.invoice_code
            FROM payment_receipts pr
            LEFT JOIN payment_transactions pt ON pr.payment_transaction_id = pt.payment_transactions_id
            LEFT JOIN invoices i ON pr.invoice_id = i.invoices_id
            WHERE pr.receipt_id = $1
        `;
        const result = await pool.query(sql, [receiptId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** In lại biên lai — tăng reprint_count */
    static async incrementReprintCount(receiptId: string): Promise<PaymentReceipt> {
        const sql = `
            UPDATE payment_receipts SET
                reprint_count = reprint_count + 1,
                printed_at = CURRENT_TIMESTAMP
            WHERE receipt_id = $1 RETURNING *
        `;
        const result = await pool.query(sql, [receiptId]);
        return result.rows[0];
    }

    /** Đánh dấu biên lai đã void */
    static async voidReceipt(
        transactionId: string, userId: string, reason: string, client?: PoolClient
    ): Promise<void> {
        const sql = `
            UPDATE payment_receipts SET
                voided_at = CURRENT_TIMESTAMP, voided_by = $2, void_reason = $3
            WHERE payment_transaction_id = $1
        `;
        const executor = client || pool;
        await executor.query(sql, [transactionId, userId, reason]);
    }

    // CASH DENOMINATIONS

    /** Lưu mệnh giá tiền kê khai khi đóng ca (upsert) */
    static async saveDenominations(
        shiftId: string, denominations: { id: string; value: number; quantity: number }[]
    ): Promise<ShiftCashDenomination[]> {
        const results: ShiftCashDenomination[] = [];

        for (const d of denominations) {
            const subtotal = d.value * d.quantity;
            const sql = `
                INSERT INTO shift_cash_denominations (denomination_id, shift_id, denomination_value, quantity, subtotal)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (shift_id, denomination_value)
                DO UPDATE SET quantity = $4, subtotal = $5
                RETURNING *
            `;
            const result = await pool.query(sql, [d.id, shiftId, d.value, d.quantity, subtotal]);
            results.push(result.rows[0]);
        }

        return results;
    }

    /** Lấy mệnh giá theo ca */
    static async getDenominationsByShift(shiftId: string): Promise<ShiftCashDenomination[]> {
        const sql = `
            SELECT * FROM shift_cash_denominations
            WHERE shift_id = $1 ORDER BY denomination_value DESC
        `;
        const result = await pool.query(sql, [shiftId]);
        return result.rows;
    }

    // SHIFT EXTENSIONS

    /** Lấy giao dịch trong ca thu ngân */
    static async getTransactionsByShift(shiftId: string): Promise<OfflineTransaction[]> {
        const sql = `
            SELECT pt.*, up.full_name as cashier_name,
                   i.invoice_code, p.full_name as patient_name,
                   pos.terminal_name
            FROM payment_transactions pt
            LEFT JOIN user_profiles up ON pt.cashier_id = up.user_id
            LEFT JOIN invoices i ON pt.invoice_id = i.invoices_id
            LEFT JOIN patients p ON i.patient_id = p.id
            LEFT JOIN pos_terminals pos ON pt.terminal_id = pos.terminal_id
            WHERE pt.shift_id = $1
            ORDER BY pt.paid_at DESC
        `;
        const result = await pool.query(sql, [shiftId]);
        return result.rows;
    }

    /**
     * Tổng kết ca — tổng tiền theo phương thức
     * Chỉ tính giao dịch SUCCESS (không tính VOIDED)
     */
    static async getShiftStats(shiftId: string): Promise<any> {
        const sql = `
            SELECT
                COUNT(*) FILTER (WHERE status = 'SUCCESS') as success_count,
                COUNT(*) FILTER (WHERE status = 'VOIDED') as void_count,
                COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'PAYMENT' AND status = 'SUCCESS' AND payment_method = 'CASH'), 0) as total_cash,
                COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'PAYMENT' AND status = 'SUCCESS' AND payment_method = 'CREDIT_CARD'), 0) as total_card,
                COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'PAYMENT' AND status = 'SUCCESS' AND payment_method = 'BANK_TRANSFER'), 0) as total_transfer,
                COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'REFUND' AND status = 'SUCCESS'), 0) as total_refunds,
                COALESCE(SUM(amount) FILTER (WHERE status = 'VOIDED'), 0) as total_voids
            FROM payment_transactions
            WHERE shift_id = $1
        `;
        const result = await pool.query(sql, [shiftId]);
        return result.rows[0];
    }

    /**
     * Cập nhật thống kê ca sau mỗi giao dịch
     * Gọi sau processOfflinePayment hoặc voidTransaction
     */
    static async updateShiftStats(shiftId: string, client?: PoolClient): Promise<void> {
        const sql = `
            UPDATE cashier_shifts SET
                total_cash_payments = COALESCE((
                    SELECT SUM(amount) FROM payment_transactions
                    WHERE shift_id = $1 AND transaction_type = 'PAYMENT' AND status = 'SUCCESS' AND payment_method = 'CASH'
                ), 0),
                total_card_payments = COALESCE((
                    SELECT SUM(amount) FROM payment_transactions
                    WHERE shift_id = $1 AND transaction_type = 'PAYMENT' AND status = 'SUCCESS' AND payment_method = 'CREDIT_CARD'
                ), 0),
                total_transfer_payments = COALESCE((
                    SELECT SUM(amount) FROM payment_transactions
                    WHERE shift_id = $1 AND transaction_type = 'PAYMENT' AND status = 'SUCCESS' AND payment_method = 'BANK_TRANSFER'
                ), 0),
                total_refunds = COALESCE((
                    SELECT SUM(amount) FROM payment_transactions
                    WHERE shift_id = $1 AND transaction_type = 'REFUND' AND status = 'SUCCESS'
                ), 0),
                total_voids = COALESCE((
                    SELECT SUM(amount) FROM payment_transactions
                    WHERE shift_id = $1 AND status = 'VOIDED'
                ), 0),
                transaction_count = (
                    SELECT COUNT(*) FROM payment_transactions WHERE shift_id = $1
                )
            WHERE cashier_shifts_id = $1
        `;
        const executor = client || pool;
        await executor.query(sql, [shiftId]);
    }

    // REPORTS

    /**
     * Báo cáo cuối ngày — tổng hợp tất cả ca trong ngày cho 1 branch/facility
     */
    static async getDailyReport(
        reportDate: string, facilityId?: string, branchId?: string
    ): Promise<any> {
        const conditions: string[] = ['cs.shift_start::date = $1::date'];
        const params: any[] = [reportDate];
        let idx = 2;

        if (facilityId) { conditions.push(`cs.facility_id = $${idx++}`); params.push(facilityId); }
        if (branchId) { conditions.push(`cs.branch_id = $${idx++}`); params.push(branchId); }

        const where = 'WHERE ' + conditions.join(' AND ');

        /* Tổng hợp */
        const summarySql = `
            SELECT
                COUNT(DISTINCT cs.cashier_shifts_id) as total_shifts,
                COALESCE(SUM(cs.transaction_count), 0) as total_transactions,
                COALESCE(SUM(cs.total_cash_payments), 0) as total_cash,
                COALESCE(SUM(cs.total_card_payments), 0) as total_card,
                COALESCE(SUM(cs.total_transfer_payments), 0) as total_transfer,
                COALESCE(SUM(cs.total_cash_payments + cs.total_card_payments + cs.total_transfer_payments), 0) as total_collected,
                COALESCE(SUM(cs.total_refunds), 0) as total_refunds,
                COALESCE(SUM(cs.total_voids), 0) as total_voids,
                COALESCE(SUM(cs.total_cash_payments + cs.total_card_payments + cs.total_transfer_payments - cs.total_refunds - cs.total_voids), 0) as net_collected
            FROM cashier_shifts cs ${where}
        `;
        const summaryResult = await pool.query(summarySql, params);

        /* Phân theo thu ngân */
        const byCashierSql = `
            SELECT
                cs.cashier_id,
                up.full_name as cashier_name,
                COUNT(cs.cashier_shifts_id) as shifts_count,
                COALESCE(SUM(cs.transaction_count), 0) as transaction_count,
                COALESCE(SUM(cs.total_cash_payments + cs.total_card_payments + cs.total_transfer_payments), 0) as total_collected,
                COALESCE(SUM(cs.total_refunds), 0) as total_refunds,
                COALESCE(SUM(cs.total_voids), 0) as total_voids
            FROM cashier_shifts cs
            LEFT JOIN user_profiles up ON cs.cashier_id = up.user_id
            ${where}
            GROUP BY cs.cashier_id, up.full_name
            ORDER BY total_collected DESC
        `;
        const byCashierResult = await pool.query(byCashierSql, params);

        return {
            summary: summaryResult.rows[0],
            by_cashier: byCashierResult.rows,
        };
    }

    /**
     * Hiệu suất thu ngân
     */
    static async getCashierPerformance(
        cashierId: string, dateFrom: string, dateTo: string
    ): Promise<any> {
        const sql = `
            SELECT
                cs.cashier_id,
                up.full_name as cashier_name,
                COUNT(cs.cashier_shifts_id) as total_shifts,
                COALESCE(SUM(cs.transaction_count), 0) as total_transactions,
                COALESCE(SUM(cs.total_cash_payments + cs.total_card_payments + cs.total_transfer_payments), 0) as total_collected,
                COALESCE(SUM(cs.total_refunds), 0) as total_refunds,
                COALESCE(SUM(cs.total_voids), 0) as total_voids,
                CASE
                    WHEN SUM(cs.transaction_count) > 0
                    THEN ROUND(SUM(cs.total_cash_payments + cs.total_card_payments + cs.total_transfer_payments) / SUM(cs.transaction_count), 2)
                    ELSE 0
                END as avg_transaction_amount,
                COUNT(*) FILTER (WHERE cs.status = 'DISCREPANCY') as discrepancy_count,
                COALESCE(SUM(
                    ABS(COALESCE(cs.actual_closing_balance, 0) - COALESCE(cs.system_calculated_balance, 0))
                ) FILTER (WHERE cs.status = 'DISCREPANCY'), 0) as total_discrepancy_amount
            FROM cashier_shifts cs
            LEFT JOIN user_profiles up ON cs.cashier_id = up.user_id
            WHERE cs.cashier_id = $1
              AND cs.shift_start >= $2
              AND cs.shift_start <= $3::timestamptz + interval '1 day'
            GROUP BY cs.cashier_id, up.full_name
        `;
        const result = await pool.query(sql, [cashierId, dateFrom, dateTo]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    // HELPERS — Kiểm tra tồn tại & lấy dữ liệu liên kết

    static async getInvoiceWithPatient(invoiceId: string): Promise<any | null> {
        const sql = `
            SELECT i.*, p.full_name as patient_name, p.patient_code,
                   f.name as facility_name, f.address as facility_address,
                   up.full_name as created_by_name
            FROM invoices i
            LEFT JOIN patients p ON i.patient_id = p.id
            LEFT JOIN facilities f ON i.facility_id = f.facilities_id
            LEFT JOIN user_profiles up ON i.created_by = up.user_id
            WHERE i.invoices_id = $1
        `;
        const result = await pool.query(sql, [invoiceId]);
        if (result.rows.length === 0) return null;

        /* Load items */
        const itemsSql = 'SELECT * FROM invoice_details WHERE invoice_id = $1';
        const items = await pool.query(itemsSql, [invoiceId]);
        result.rows[0].items = items.rows;

        return result.rows[0];
    }

    static async getOpenShiftByCashier(cashierId: string): Promise<any | null> {
        const sql = `SELECT * FROM cashier_shifts WHERE cashier_id = $1 AND status = 'OPEN' LIMIT 1`;
        const result = await pool.query(sql, [cashierId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    static async getShiftById(shiftId: string): Promise<any | null> {
        const sql = `
            SELECT cs.*, up.full_name as cashier_name
            FROM cashier_shifts cs
            LEFT JOIN user_profiles up ON cs.cashier_id = up.user_id
            WHERE cs.cashier_shifts_id = $1
        `;
        const result = await pool.query(sql, [shiftId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    static async checkBranchExists(branchId: string): Promise<boolean> {
        const r = await pool.query('SELECT 1 FROM branches WHERE branches_id = $1', [branchId]);
        return r.rows.length > 0;
    }

    static async checkFacilityExists(facilityId: string): Promise<boolean> {
        const r = await pool.query('SELECT 1 FROM facilities WHERE facilities_id = $1', [facilityId]);
        return r.rows.length > 0;
    }

    /** Lấy tên cashier từ user_profiles */
    static async getCashierName(cashierId: string): Promise<string> {
        const r = await pool.query('SELECT full_name FROM user_profiles WHERE user_id = $1', [cashierId]);
        return r.rows.length > 0 ? r.rows[0].full_name : 'Unknown';
    }

    /**
     * Cập nhật paid_amount & status hóa đơn sau thanh toán/void
     * Reuse lại logic từ Module 9.2 — tính tổng từ payment_transactions
     */
    static async updateInvoicePaidAmount(invoiceId: string, client?: PoolClient): Promise<void> {
        const sql = `
            UPDATE invoices SET
                paid_amount = COALESCE((
                    SELECT SUM(CASE WHEN transaction_type = 'PAYMENT' AND status = 'SUCCESS' THEN amount
                                    WHEN transaction_type = 'REFUND' AND status = 'SUCCESS' THEN -amount
                                    ELSE 0 END)
                    FROM payment_transactions
                    WHERE invoice_id = $1 AND status IN ('SUCCESS')
                ), 0),
                status = CASE
                    WHEN COALESCE((
                        SELECT SUM(CASE WHEN transaction_type = 'PAYMENT' AND status = 'SUCCESS' THEN amount
                                        WHEN transaction_type = 'REFUND' AND status = 'SUCCESS' THEN -amount
                                        ELSE 0 END)
                        FROM payment_transactions
                        WHERE invoice_id = $1 AND status IN ('SUCCESS')
                    ), 0) > net_amount THEN 'OVERPAID'
                    WHEN COALESCE((
                        SELECT SUM(CASE WHEN transaction_type = 'PAYMENT' AND status = 'SUCCESS' THEN amount
                                        WHEN transaction_type = 'REFUND' AND status = 'SUCCESS' THEN -amount
                                        ELSE 0 END)
                        FROM payment_transactions
                        WHERE invoice_id = $1 AND status IN ('SUCCESS')
                    ), 0) >= net_amount THEN 'PAID'
                    WHEN COALESCE((
                        SELECT SUM(CASE WHEN transaction_type = 'PAYMENT' AND status = 'SUCCESS' THEN amount
                                        WHEN transaction_type = 'REFUND' AND status = 'SUCCESS' THEN -amount
                                        ELSE 0 END)
                        FROM payment_transactions
                        WHERE invoice_id = $1 AND status IN ('SUCCESS')
                    ), 0) > 0 THEN 'PARTIAL'
                    ELSE 'UNPAID'
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE invoices_id = $1
        `;
        const executor = client || pool;
        await executor.query(sql, [invoiceId]);
    }
}
