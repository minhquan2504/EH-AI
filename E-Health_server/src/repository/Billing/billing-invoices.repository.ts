import { pool } from '../../config/postgresdb';
import { PoolClient } from 'pg';
import {
    Invoice,
    InvoiceDetail,
    PaymentTransaction,
    CashierShift,
    InvoiceInsuranceClaim,
    CreateInvoiceInput,
    AddInvoiceItemInput,
    UpdateInvoiceItemInput,
    CreatePaymentInput,
    RevenueSummary,
    PaginatedResult,
} from '../../models/Billing/billing-invoices.model';

export class BillingInvoiceRepository {

    /** Lấy client cho transaction */
    static async getClient(): Promise<PoolClient> {
        return await pool.connect();
    }

    // 
    // INVOICES

    /**
     * Tạo hóa đơn mới
     */
    static async createInvoice(
        invoiceId: string,
        invoiceCode: string,
        input: CreateInvoiceInput,
        userId: string,
        client?: PoolClient
    ): Promise<Invoice> {
        const sql = `
            INSERT INTO invoices (
                invoices_id, invoice_code, patient_id, encounter_id, facility_id,
                total_amount, discount_amount, insurance_amount, net_amount, paid_amount,
                status, notes, created_by
            ) VALUES ($1, $2, $3, $4, $5, 0, 0, 0, 0, 0, 'UNPAID', $6, $7)
            RETURNING *
        `;
        const params = [
            invoiceId, invoiceCode, input.patient_id,
            input.encounter_id || null, input.facility_id || null,
            input.notes || null, userId,
        ];
        const executor = client || pool;
        const result = await executor.query(sql, params);
        return result.rows[0];
    }

    /**
     * Lấy danh sách hóa đơn với filter + phân trang
     */
    static async getInvoices(
        facilityId?: string,
        patientId?: string,
        status?: string,
        dateFrom?: string,
        dateTo?: string,
        search?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedResult<Invoice>> {
        const conditions: string[] = [];
        const params: any[] = [];
        let idx = 1;

        if (facilityId) { conditions.push(`i.facility_id = $${idx++}`); params.push(facilityId); }
        if (patientId) { conditions.push(`i.patient_id = $${idx++}`); params.push(patientId); }
        if (status) { conditions.push(`i.status = $${idx++}`); params.push(status); }
        if (dateFrom) { conditions.push(`i.created_at >= $${idx++}`); params.push(dateFrom); }
        if (dateTo) { conditions.push(`i.created_at <= $${idx++}::timestamptz + interval '1 day'`); params.push(dateTo); }
        if (search) {
            conditions.push(`(i.invoice_code ILIKE $${idx} OR p.full_name ILIKE $${idx})`);
            params.push(`%${search}%`);
            idx++;
        }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const countSql = `
            SELECT COUNT(*) as total FROM invoices i
            LEFT JOIN patients p ON i.patient_id = p.id
            ${where}
        `;
        const countResult = await pool.query(countSql, params);
        const total = parseInt(countResult.rows[0].total);

        const offset = (page - 1) * limit;
        const dataSql = `
            SELECT i.*,
                   p.full_name as patient_name,
                   p.patient_code,
                   e.encounter_type,
                   f.name as facility_name,
                   up2.full_name as created_by_name
            FROM invoices i
            LEFT JOIN patients p ON i.patient_id = p.id
            LEFT JOIN encounters e ON i.encounter_id = e.encounters_id
            LEFT JOIN facilities f ON i.facility_id = f.facilities_id
            LEFT JOIN user_profiles up2 ON i.created_by = up2.user_id
            ${where}
            ORDER BY i.created_at DESC
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

    /**
     * Lấy chi tiết 1 hóa đơn (kèm items + payments)
     */
    static async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
        const sql = `
            SELECT i.*,
                   p.full_name as patient_name,
                   p.patient_code,
                   e.encounter_type,
                   f.name as facility_name,
                   up2.full_name as created_by_name
            FROM invoices i
            LEFT JOIN patients p ON i.patient_id = p.id
            LEFT JOIN encounters e ON i.encounter_id = e.encounters_id
            LEFT JOIN facilities f ON i.facility_id = f.facilities_id
            LEFT JOIN user_profiles up2 ON i.created_by = up2.user_id
            WHERE i.invoices_id = $1
        `;
        const result = await pool.query(sql, [invoiceId]);
        if (result.rows.length === 0) return null;

        const invoice = result.rows[0] as Invoice;

        /* Items */
        const itemsSql = `SELECT * FROM invoice_details WHERE invoice_id = $1`;
        const itemsResult = await pool.query(itemsSql, [invoiceId]);
        invoice.items = itemsResult.rows;

        /* Payments */
        const paymentsSql = `
            SELECT pt.*, up.full_name as cashier_name
            FROM payment_transactions pt
            LEFT JOIN user_profiles up ON pt.cashier_id = up.user_id
            WHERE pt.invoice_id = $1
            ORDER BY pt.paid_at DESC
        `;
        const paymentsResult = await pool.query(paymentsSql, [invoiceId]);
        invoice.payments = paymentsResult.rows;

        return invoice;
    }

    /**
     * Cập nhật hóa đơn (discount, notes)
     */
    static async updateInvoice(
        invoiceId: string,
        discountAmount?: number,
        notes?: string,
        client?: PoolClient
    ): Promise<Invoice> {
        const sets: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const params: any[] = [];
        let idx = 1;

        if (discountAmount !== undefined) {
            sets.push(`discount_amount = $${idx++}`);
            params.push(discountAmount);
        }
        if (notes !== undefined) {
            sets.push(`notes = $${idx++}`);
            params.push(notes);
        }

        params.push(invoiceId);
        const sql = `UPDATE invoices SET ${sets.join(', ')} WHERE invoices_id = $${idx} RETURNING *`;
        const executor = client || pool;
        const result = await executor.query(sql, params);
        return result.rows[0];
    }

    /**
     * Hủy hóa đơn
     */
    static async cancelInvoice(
        invoiceId: string,
        reason: string,
        userId: string,
        client?: PoolClient
    ): Promise<Invoice> {
        const sql = `
            UPDATE invoices
            SET status = 'CANCELLED', cancelled_reason = $2, cancelled_by = $3,
                cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE invoices_id = $1
            RETURNING *
        `;
        const executor = client || pool;
        const result = await executor.query(sql, [invoiceId, reason, userId]);
        return result.rows[0];
    }

    /** Lấy HĐ theo encounter */
    static async getInvoiceByEncounterId(encounterId: string): Promise<Invoice | null> {
        const sql = `SELECT * FROM invoices WHERE encounter_id = $1 AND status != 'CANCELLED' LIMIT 1`;
        const result = await pool.query(sql, [encounterId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Tính lại tổng tiền hóa đơn */
    static async recalculateInvoice(invoiceId: string, client?: PoolClient): Promise<Invoice> {
        const sql = `
            UPDATE invoices SET
                total_amount = COALESCE((SELECT SUM(subtotal) FROM invoice_details WHERE invoice_id = $1), 0),
                insurance_amount = COALESCE((SELECT SUM(insurance_covered) FROM invoice_details WHERE invoice_id = $1), 0),
                net_amount = COALESCE((SELECT SUM(subtotal) FROM invoice_details WHERE invoice_id = $1), 0)
                           - COALESCE(discount_amount, 0)
                           - COALESCE((SELECT SUM(insurance_covered) FROM invoice_details WHERE invoice_id = $1), 0),
                updated_at = CURRENT_TIMESTAMP
            WHERE invoices_id = $1
            RETURNING *
        `;
        const executor = client || pool;
        const result = await executor.query(sql, [invoiceId]);
        return result.rows[0];
    }

    /** Cập nhật paid_amount & status sau thanh toán — xử lý cả trường hợp trả thừa */
    static async updatePaidAmount(invoiceId: string, client?: PoolClient): Promise<Invoice> {
        const sql = `
            UPDATE invoices SET
                paid_amount = COALESCE((
                    SELECT SUM(CASE WHEN transaction_type = 'PAYMENT' THEN amount ELSE -amount END)
                    FROM payment_transactions
                    WHERE invoice_id = $1 AND status = 'SUCCESS'
                ), 0),
                status = CASE
                    WHEN COALESCE((
                        SELECT SUM(CASE WHEN transaction_type = 'PAYMENT' THEN amount ELSE -amount END)
                        FROM payment_transactions
                        WHERE invoice_id = $1 AND status = 'SUCCESS'
                    ), 0) > net_amount THEN 'OVERPAID'
                    WHEN COALESCE((
                        SELECT SUM(CASE WHEN transaction_type = 'PAYMENT' THEN amount ELSE -amount END)
                        FROM payment_transactions
                        WHERE invoice_id = $1 AND status = 'SUCCESS'
                    ), 0) >= net_amount THEN 'PAID'
                    WHEN COALESCE((
                        SELECT SUM(CASE WHEN transaction_type = 'PAYMENT' THEN amount ELSE -amount END)
                        FROM payment_transactions
                        WHERE invoice_id = $1 AND status = 'SUCCESS'
                    ), 0) > 0 THEN 'PARTIAL'
                    ELSE 'UNPAID'
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE invoices_id = $1
            RETURNING *
        `;
        const executor = client || pool;
        const result = await executor.query(sql, [invoiceId]);
        return result.rows[0];
    }

    // INVOICE DETAILS

    /** Thêm dòng chi tiết */
    static async addInvoiceItem(
        itemId: string,
        invoiceId: string,
        input: AddInvoiceItemInput,
        client?: PoolClient
    ): Promise<InvoiceDetail> {
        const subtotal = input.quantity * input.unit_price;
        const discountAmt = input.discount_amount || 0;
        const insuranceCov = input.insurance_covered || 0;
        const patientPays = subtotal - discountAmt - insuranceCov;

        const sql = `
            INSERT INTO invoice_details (
                invoice_details_id, invoice_id, reference_type, reference_id,
                item_name, quantity, unit_price, subtotal,
                discount_amount, insurance_covered, patient_pays, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;
        const params = [
            itemId, invoiceId, input.reference_type, input.reference_id,
            input.item_name, input.quantity, input.unit_price, subtotal,
            discountAmt, insuranceCov, patientPays, input.notes || null,
        ];
        const executor = client || pool;
        const result = await executor.query(sql, params);
        return result.rows[0];
    }

    /** Sửa dòng chi tiết */
    static async updateInvoiceItem(
        itemId: string,
        input: UpdateInvoiceItemInput,
        client?: PoolClient
    ): Promise<InvoiceDetail> {
        /* Lấy item hiện tại để tính toán */
        const old = await pool.query('SELECT * FROM invoice_details WHERE invoice_details_id = $1', [itemId]);
        if (old.rows.length === 0) throw new Error('Item not found');

        const current = old.rows[0];
        const qty = input.quantity ?? current.quantity;
        const price = input.unit_price ?? parseFloat(current.unit_price);
        const subtotal = qty * price;
        const discountAmt = input.discount_amount ?? parseFloat(current.discount_amount || '0');
        const insuranceCov = input.insurance_covered ?? parseFloat(current.insurance_covered || '0');
        const patientPays = subtotal - discountAmt - insuranceCov;

        const sql = `
            UPDATE invoice_details SET
                quantity = $2, unit_price = $3, subtotal = $4,
                discount_amount = $5, insurance_covered = $6, patient_pays = $7,
                notes = COALESCE($8, notes)
            WHERE invoice_details_id = $1
            RETURNING *
        `;
        const executor = client || pool;
        const result = await executor.query(sql, [
            itemId, qty, price, subtotal, discountAmt, insuranceCov, patientPays,
            input.notes !== undefined ? input.notes : null,
        ]);
        return result.rows[0];
    }

    /** Xóa dòng chi tiết */
    static async deleteInvoiceItem(itemId: string, client?: PoolClient): Promise<void> {
        const executor = client || pool;
        await executor.query('DELETE FROM invoice_details WHERE invoice_details_id = $1', [itemId]);
    }

    /** Lấy 1 dòng chi tiết */
    static async getInvoiceItemById(itemId: string): Promise<InvoiceDetail | null> {
        const result = await pool.query('SELECT * FROM invoice_details WHERE invoice_details_id = $1', [itemId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Lấy invoice_id của 1 item */
    static async getInvoiceIdByItemId(itemId: string): Promise<string | null> {
        const result = await pool.query('SELECT invoice_id FROM invoice_details WHERE invoice_details_id = $1', [itemId]);
        return result.rows.length > 0 ? result.rows[0].invoice_id : null;
    }

    // PAYMENT TRANSACTIONS

    /** Tạo giao dịch thanh toán */
    static async createPayment(
        paymentId: string,
        transactionCode: string,
        input: CreatePaymentInput,
        cashierId: string,
        client?: PoolClient
    ): Promise<PaymentTransaction> {
        const sql = `
            INSERT INTO payment_transactions (
                payment_transactions_id, transaction_code, invoice_id,
                transaction_type, payment_method, amount,
                gateway_transaction_id, status, cashier_id, notes
            ) VALUES ($1, $2, $3, 'PAYMENT', $4, $5, $6, 'SUCCESS', $7, $8)
            RETURNING *
        `;
        const params = [
            paymentId, transactionCode, input.invoice_id,
            input.payment_method, input.amount,
            input.gateway_transaction_id || null,
            cashierId, input.notes || null,
        ];
        const executor = client || pool;
        const result = await executor.query(sql, params);
        return result.rows[0];
    }

    /** Tạo giao dịch hoàn tiền */
    static async createRefund(
        refundId: string,
        transactionCode: string,
        invoiceId: string,
        amount: number,
        paymentMethod: string,
        refundReason: string,
        cashierId: string,
        client?: PoolClient
    ): Promise<PaymentTransaction> {
        const sql = `
            INSERT INTO payment_transactions (
                payment_transactions_id, transaction_code, invoice_id,
                transaction_type, payment_method, amount,
                status, cashier_id, refund_reason, notes
            ) VALUES ($1, $2, $3, 'REFUND', $4, $5, 'SUCCESS', $6, $7, $8)
            RETURNING *
        `;
        const executor = client || pool;
        const result = await executor.query(sql, [
            refundId, transactionCode, invoiceId,
            paymentMethod, amount, cashierId, refundReason,
            `Hoàn tiền: ${refundReason}`,
        ]);
        return result.rows[0];
    }

    /** Đánh dấu giao dịch đã hoàn */
    static async markPaymentRefunded(paymentId: string, client?: PoolClient): Promise<void> {
        const executor = client || pool;
        await executor.query(
            `UPDATE payment_transactions SET status = 'REFUNDED' WHERE payment_transactions_id = $1`,
            [paymentId]
        );
    }

    /** Lấy chi tiết giao dịch */
    static async getPaymentById(paymentId: string): Promise<PaymentTransaction | null> {
        const sql = `
            SELECT pt.*, up.full_name as cashier_name, i.invoice_code
            FROM payment_transactions pt
            LEFT JOIN user_profiles up ON pt.cashier_id = up.user_id
            LEFT JOIN invoices i ON pt.invoice_id = i.invoices_id
            WHERE pt.payment_transactions_id = $1
        `;
        const result = await pool.query(sql, [paymentId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Lấy giao dịch theo hóa đơn */
    static async getPaymentsByInvoiceId(invoiceId: string): Promise<PaymentTransaction[]> {
        const sql = `
            SELECT pt.*, up.full_name as cashier_name
            FROM payment_transactions pt
            LEFT JOIN user_profiles up ON pt.cashier_id = up.user_id
            WHERE pt.invoice_id = $1
            ORDER BY pt.paid_at DESC
        `;
        const result = await pool.query(sql, [invoiceId]);
        return result.rows;
    }

    // CASHIER SHIFTS

    /** Mở ca thu ngân */
    static async openShift(
        shiftId: string,
        cashierId: string,
        openingBalance: number,
        notes?: string
    ): Promise<CashierShift> {
        const sql = `
            INSERT INTO cashier_shifts (
                cashier_shifts_id, cashier_id, opening_balance, notes
            ) VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await pool.query(sql, [shiftId, cashierId, openingBalance, notes || null]);
        return result.rows[0];
    }

    /** Đóng ca thu ngân */
    static async closeShift(
        shiftId: string,
        actualClosingBalance: number,
        systemBalance: number,
        notes?: string
    ): Promise<CashierShift> {
        const discrepancy = Math.abs(actualClosingBalance - systemBalance) > 0.01;
        const status = discrepancy ? 'DISCREPANCY' : 'CLOSED';

        const sql = `
            UPDATE cashier_shifts SET
                shift_end = CURRENT_TIMESTAMP,
                actual_closing_balance = $2,
                system_calculated_balance = $3,
                status = $4,
                notes = COALESCE($5, notes)
            WHERE cashier_shifts_id = $1
            RETURNING *
        `;
        const result = await pool.query(sql, [shiftId, actualClosingBalance, systemBalance, status, notes || null]);
        return result.rows[0];
    }

    /** Lấy chi tiết ca kèm tổng giao dịch */
    static async getShiftById(shiftId: string): Promise<CashierShift | null> {
        const sql = `
            SELECT cs.*,
                   up.full_name as cashier_name,
                   COALESCE(stats.total_transactions, 0) as total_transactions,
                   COALESCE(stats.total_amount, '0') as total_amount
            FROM cashier_shifts cs
            LEFT JOIN user_profiles up ON cs.cashier_id = up.user_id
            LEFT JOIN LATERAL (
                SELECT COUNT(*) as total_transactions,
                       SUM(CASE WHEN pt.transaction_type = 'PAYMENT' THEN pt.amount ELSE -pt.amount END) as total_amount
                FROM payment_transactions pt
                WHERE pt.cashier_id = cs.cashier_id
                  AND pt.status = 'SUCCESS'
                  AND pt.paid_at >= cs.shift_start
                  AND (cs.shift_end IS NULL OR pt.paid_at <= cs.shift_end)
            ) stats ON TRUE
            WHERE cs.cashier_shifts_id = $1
        `;
        const result = await pool.query(sql, [shiftId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Danh sách ca thu ngân */
    static async getShifts(
        cashierId?: string,
        status?: string,
        dateFrom?: string,
        dateTo?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedResult<CashierShift>> {
        const conditions: string[] = [];
        const params: any[] = [];
        let idx = 1;

        if (cashierId) { conditions.push(`cs.cashier_id = $${idx++}`); params.push(cashierId); }
        if (status) { conditions.push(`cs.status = $${idx++}`); params.push(status); }
        if (dateFrom) { conditions.push(`cs.shift_start >= $${idx++}`); params.push(dateFrom); }
        if (dateTo) { conditions.push(`cs.shift_start <= $${idx++}::timestamptz + interval '1 day'`); params.push(dateTo); }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const countSql = `SELECT COUNT(*) as total FROM cashier_shifts cs ${where}`;
        const countResult = await pool.query(countSql, params);
        const total = parseInt(countResult.rows[0].total);

        const offset = (page - 1) * limit;
        const dataSql = `
            SELECT cs.*, up.full_name as cashier_name
            FROM cashier_shifts cs
            LEFT JOIN user_profiles up ON cs.cashier_id = up.user_id
            ${where}
            ORDER BY cs.shift_start DESC
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

    /** Kiểm tra có ca đang mở */
    static async getOpenShiftByCashier(cashierId: string): Promise<CashierShift | null> {
        const sql = `SELECT * FROM cashier_shifts WHERE cashier_id = $1 AND status = 'OPEN' LIMIT 1`;
        const result = await pool.query(sql, [cashierId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Tính system balance = opening_balance + tổng payments - tổng refunds trong ca */
    static async calculateSystemBalance(shiftId: string): Promise<number> {
        const shift = await pool.query('SELECT * FROM cashier_shifts WHERE cashier_shifts_id = $1', [shiftId]);
        if (shift.rows.length === 0) return 0;

        const cs = shift.rows[0];
        const sql = `
            SELECT COALESCE(SUM(
                CASE WHEN transaction_type = 'PAYMENT' AND payment_method = 'CASH' THEN amount
                     WHEN transaction_type = 'REFUND' AND payment_method = 'CASH' THEN -amount
                     ELSE 0 END
            ), 0) as cash_total
            FROM payment_transactions
            WHERE cashier_id = $1 AND status = 'SUCCESS'
              AND paid_at >= $2
              AND ($3::timestamptz IS NULL OR paid_at <= $3)
        `;
        const result = await pool.query(sql, [cs.cashier_id, cs.shift_start, cs.shift_end]);
        return parseFloat(cs.opening_balance) + parseFloat(result.rows[0].cash_total);
    }

    // INSURANCE CLAIMS

    /** Lấy claim BHYT theo invoice */
    static async getInsuranceClaimByInvoice(invoiceId: string): Promise<InvoiceInsuranceClaim | null> {
        const sql = `
            SELECT iic.*, pi.insurance_number, pi.insurance_type
            FROM invoice_insurance_claims iic
            LEFT JOIN patient_insurances pi ON iic.patient_insurance_id = pi.patient_insurances_id
            WHERE iic.invoice_id = $1
        `;
        const result = await pool.query(sql, [invoiceId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /** Tạo claim BHYT */
    static async createInsuranceClaim(
        claimId: string,
        invoiceId: string,
        patientInsuranceId: string,
        coveragePercent: number,
        totalClaimable: number,
        userId: string,
        client?: PoolClient
    ): Promise<InvoiceInsuranceClaim> {
        const sql = `
            INSERT INTO invoice_insurance_claims (
                claim_id, invoice_id, patient_insurance_id,
                coverage_percent, total_claimable, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const executor = client || pool;
        const result = await executor.query(sql, [
            claimId, invoiceId, patientInsuranceId, coveragePercent, totalClaimable, userId,
        ]);
        return result.rows[0];
    }

    // THỐNG KÊ

    /** Thống kê doanh thu theo cơ sở */
    static async getRevenueSummary(
        facilityId: string,
        dateFrom?: string,
        dateTo?: string
    ): Promise<RevenueSummary> {
        const conditions = [`i.facility_id = $1`, `i.status != 'CANCELLED'`];
        const params: any[] = [facilityId];
        let idx = 2;

        if (dateFrom) { conditions.push(`i.created_at >= $${idx++}`); params.push(dateFrom); }
        if (dateTo) { conditions.push(`i.created_at <= $${idx++}::timestamptz + interval '1 day'`); params.push(dateTo); }

        const where = 'WHERE ' + conditions.join(' AND ');

        const sql = `
            SELECT
                COUNT(*) as total_invoices,
                COALESCE(SUM(i.total_amount), 0) as total_revenue,
                COALESCE(SUM(i.paid_amount), 0) as total_paid,
                COALESCE(SUM(i.net_amount - i.paid_amount), 0) as total_unpaid,
                COALESCE(SUM(i.insurance_amount), 0) as total_insurance,
                COALESCE(SUM(i.discount_amount), 0) as total_discount
            FROM invoices i ${where}
        `;
        const result = await pool.query(sql, params);

        /* Thống kê theo status */
        const statusSql = `
            SELECT i.status, COUNT(*) as count, COALESCE(SUM(i.net_amount), 0) as amount
            FROM invoices i ${where}
            GROUP BY i.status
        `;
        const statusResult = await pool.query(statusSql, params);

        return {
            ...result.rows[0],
            invoices_by_status: statusResult.rows,
        };
    }

    // HELPER: KIỂM TRA TỒN TẠI

    static async checkEncounterExists(encounterId: string): Promise<boolean> {
        const r = await pool.query('SELECT 1 FROM encounters WHERE encounters_id = $1', [encounterId]);
        return r.rows.length > 0;
    }

    static async checkPatientExists(patientId: string): Promise<boolean> {
        const r = await pool.query('SELECT 1 FROM patients WHERE id = $1', [patientId]);
        return r.rows.length > 0;
    }

    static async checkFacilityExists(facilityId: string): Promise<boolean> {
        const r = await pool.query('SELECT 1 FROM facilities WHERE facilities_id = $1', [facilityId]);
        return r.rows.length > 0;
    }

    static async checkInvoiceExists(invoiceId: string): Promise<boolean> {
        const r = await pool.query('SELECT 1 FROM invoices WHERE invoices_id = $1', [invoiceId]);
        return r.rows.length > 0;
    }

    /**
     * Lấy encounter kèm thông tin dịch vụ khám + facility_id
     * Ưu tiên: appointment.branch → facility
     * Fallback (EMERGENCY): room → department → branch → facility
     */
    static async getEncounterWithServices(encounterId: string): Promise<any> {
        const sql = `
            SELECT e.*,
                   a.facility_service_id as appointment_fs_id,
                   a.branch_id,
                   COALESCE(b.facility_id, b2.facility_id) as facility_id,
                   fs.base_price as consultation_price,
                   fs.facility_services_id,
                   s.name as service_name,
                   s.service_group,
                   p.id as patient_pk_id,
                   pi2.patient_insurances_id,
                   pi2.coverage_percent as insurance_coverage_percent
            FROM encounters e
            LEFT JOIN appointments a ON e.appointment_id = a.appointments_id
            LEFT JOIN branches b ON a.branch_id = b.branches_id
            LEFT JOIN facility_services fs ON a.facility_service_id = fs.facility_services_id
            LEFT JOIN services s ON fs.service_id = s.services_id
            LEFT JOIN patients p ON e.patient_id = p.id
            LEFT JOIN patient_insurances pi2 ON p.id = pi2.patient_id
                AND pi2.is_primary = TRUE
                AND pi2.start_date <= CURRENT_DATE
                AND pi2.end_date >= CURRENT_DATE
            /* Fallback: room → department → branch → facility (cho EMERGENCY) */
            LEFT JOIN medical_rooms mr ON e.room_id = mr.medical_rooms_id
            LEFT JOIN departments dept ON mr.department_id = dept.departments_id
            LEFT JOIN branches b2 ON dept.branch_id = b2.branches_id
            WHERE e.encounters_id = $1
        `;
        const result = await pool.query(sql, [encounterId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /**
     * Lấy medical_orders (CLS) của encounter
     * Lấy giá từ facility_services theo đúng facility, nếu không có thì giá = 0
     */
    static async getMedicalOrdersByEncounter(encounterId: string, facilityId?: string): Promise<any[]> {
        const sql = `
            SELECT mo.*,
                   s.name as service_name,
                   COALESCE(fs.base_price, 0) as base_price,
                   fs.facility_services_id
            FROM medical_orders mo
            LEFT JOIN services s ON mo.service_id = s.services_id
            LEFT JOIN facility_services fs ON fs.service_id = mo.service_id
                AND ($2::varchar IS NULL OR fs.facility_id = $2)
                AND fs.is_active = TRUE
            WHERE mo.encounter_id = $1
              AND mo.status != 'CANCELLED'
        `;
        const result = await pool.query(sql, [encounterId, facilityId || null]);
        return result.rows;
    }

    /**
     * Lấy prescriptions + chi tiết thuốc kèm giá
     * Lấy giá từ pharmacy_inventory (không filter facility vì bảng này không có facility_id)
     */
    static async getPrescriptionsByEncounter(encounterId: string, facilityId?: string): Promise<any[]> {
        const sql = `
            SELECT pd.prescription_details_id,
                   pd.drug_id,
                   d.brand_name as drug_name,
                   pd.quantity,
                   COALESCE(pi.unit_price, 0) as unit_price
            FROM prescriptions pr
            JOIN prescription_details pd ON pr.prescriptions_id = pd.prescription_id
            LEFT JOIN drugs d ON pd.drug_id = d.drugs_id
            LEFT JOIN pharmacy_inventory pi ON pd.drug_id = pi.drug_id
            WHERE pr.encounter_id = $1
              AND pr.status != 'CANCELLED'
              AND pd.is_active = TRUE
        `;
        const result = await pool.query(sql, [encounterId]);
        return result.rows;
    }

    /** Kiểm tra BN có BHYT hiệu lực */
    static async getActiveInsurance(patientId: string): Promise<any | null> {
        const sql = `
            SELECT pi.*, ic.coverage_percent as default_coverage
            FROM patient_insurances pi
            LEFT JOIN insurance_coverages ic ON pi.provider_id = ic.provider_id AND ic.is_active = TRUE
            WHERE pi.patient_id = $1
              AND pi.is_primary = TRUE
              AND pi.start_date <= CURRENT_DATE
              AND pi.end_date >= CURRENT_DATE
            LIMIT 1
        `;
        const result = await pool.query(sql, [patientId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }
}
