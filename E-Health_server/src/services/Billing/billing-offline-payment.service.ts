import { randomUUID } from 'crypto';
import { BillingOfflinePaymentRepository } from '../../repository/Billing/billing-offline-payment.repository';
import {
    PosTerminal,
    PaymentReceipt,
    ShiftCashDenomination,
    OfflineTransaction,
    ShiftSummary,
    DailyReport,
    CashierPerformance,
    CreateTerminalInput,
    UpdateTerminalInput,
    OfflinePaymentInput,
    VoidTransactionInput,
    CashDenominationInput,
    PaginatedResult,
} from '../../models/Billing/billing-offline-payment.model';
import {
    OFFLINE_PAYMENT_ERRORS,
    OFFLINE_PAYMENT_CONFIG,
    VALID_OFFLINE_METHODS,
    CASH_DENOMINATIONS,
    RECEIPT_TYPE,
    VOID_STATUS,
} from '../../constants/billing-offline-payment.constant';

export class BillingOfflinePaymentService {

    private static generateId(prefix: string): string {
        return `${prefix}_${randomUUID().substring(0, 16).replace(/-/g, '')}`;
    }

    /** Tạo mã biên lai: RCP-YYYYMMDD-XXXX */
    private static generateReceiptNumber(): string {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${OFFLINE_PAYMENT_CONFIG.RECEIPT_CODE_PREFIX}-${dateStr}-${rand}`;
    }

    /** Tạo mã giao dịch: TXN-YYYYMMDD-XXXX */
    private static generateTransactionCode(): string {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `TXN-${dateStr}-${rand}`;
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 1: THANH TOÁN TẠI QUẦY
    // ═══════════════════════════════════════════════════

    /**
     * Thanh toán tại quầy — Enforce ca mở, ghi shift_id + terminal_id
     * Tự động tạo biên lai sau khi thanh toán thành công
     */
    static async processOfflinePayment(
        input: OfflinePaymentInput, cashierId: string
    ): Promise<{ transaction: OfflineTransaction; receipt: PaymentReceipt }> {
        /* 1. Validate payment method */
        if (!VALID_OFFLINE_METHODS.includes(input.payment_method as any)) {
            throw OFFLINE_PAYMENT_ERRORS.INVALID_PAYMENT_METHOD;
        }
        if (input.amount <= 0) throw OFFLINE_PAYMENT_ERRORS.INVALID_AMOUNT;

        /* 2. Kiểm tra ca mở */
        const openShift = await BillingOfflinePaymentRepository.getOpenShiftByCashier(cashierId);
        if (!openShift) throw OFFLINE_PAYMENT_ERRORS.NO_OPEN_SHIFT;

        /* 3. Kiểm tra hóa đơn */
        const invoice = await BillingOfflinePaymentRepository.getInvoiceWithPatient(input.invoice_id);
        if (!invoice) throw OFFLINE_PAYMENT_ERRORS.INVOICE_NOT_FOUND;
        if (invoice.status === 'CANCELLED') throw OFFLINE_PAYMENT_ERRORS.INVOICE_CANCELLED;
        if (invoice.status === 'PAID') throw OFFLINE_PAYMENT_ERRORS.INVOICE_ALREADY_PAID;

        /* 4. Kiểm tra overpayment */
        const remaining = parseFloat(invoice.net_amount) - parseFloat(invoice.paid_amount);
        if (input.amount > remaining + 0.01) throw OFFLINE_PAYMENT_ERRORS.OVERPAYMENT;

        /* 5. Nếu POS → kiểm tra terminal */
        let terminalId: string | null = null;
        if (input.payment_method === 'CREDIT_CARD') {
            if (!input.approval_code) throw OFFLINE_PAYMENT_ERRORS.CARD_INFO_REQUIRED;
            if (input.terminal_id) {
                const terminal = await BillingOfflinePaymentRepository.getTerminalById(input.terminal_id);
                if (!terminal) throw OFFLINE_PAYMENT_ERRORS.TERMINAL_NOT_FOUND;
                if (!terminal.is_active) throw OFFLINE_PAYMENT_ERRORS.TERMINAL_INACTIVE;
                terminalId = input.terminal_id;
            }
        }

        /* 6. Tạo giao dịch + receipt trong transaction */
        const client = await BillingOfflinePaymentRepository.getClient();
        try {
            await client.query('BEGIN');

            const paymentId = this.generateId('TXN');
            const txnCode = this.generateTransactionCode();
            const transaction = await BillingOfflinePaymentRepository.createOfflinePayment(
                paymentId, txnCode, input.invoice_id, input.amount,
                input.payment_method, cashierId, openShift.cashier_shifts_id,
                terminalId, input.approval_code || null,
                input.card_last_four || null, input.card_brand || null,
                input.notes || null, client
            );

            /* 7. Cập nhật paid_amount & status hóa đơn */
            await BillingOfflinePaymentRepository.updateInvoicePaidAmount(input.invoice_id, client);

            /* 8. Cập nhật thống kê ca */
            await BillingOfflinePaymentRepository.updateShiftStats(openShift.cashier_shifts_id, client);

            /* 9. Tính tiền thừa (chỉ CASH) */
            const changeAmount = input.payment_method === 'CASH'
                ? Math.max(0, input.amount - remaining)
                : 0;

            /* 10. Tạo biên lai */
            const cashierName = await BillingOfflinePaymentRepository.getCashierName(cashierId);
            const itemsSnapshot = (invoice.items || []).map((item: any) => ({
                item_name: item.item_name,
                quantity: item.quantity,
                unit_price: parseFloat(item.unit_price),
                subtotal: parseFloat(item.subtotal),
                discount_amount: parseFloat(item.discount_amount || '0'),
                insurance_covered: parseFloat(item.insurance_covered || '0'),
            }));

            const receiptId = this.generateId('RCP');
            const receiptNumber = this.generateReceiptNumber();
            const receipt = await BillingOfflinePaymentRepository.createReceipt(
                receiptId, receiptNumber, paymentId,
                input.invoice_id, invoice.patient_id,
                invoice.patient_name, invoice.patient_code,
                invoice.facility_name || null, invoice.facility_address || null,
                cashierName, cashierId,
                itemsSnapshot,
                parseFloat(invoice.total_amount), parseFloat(invoice.discount_amount),
                parseFloat(invoice.insurance_amount), parseFloat(invoice.net_amount),
                input.amount, input.payment_method, changeAmount,
                RECEIPT_TYPE.PAYMENT, openShift.cashier_shifts_id, client
            );

            await client.query('COMMIT');
            return { transaction, receipt };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Hủy giao dịch (VOID) — chỉ trong 30', cùng ca, phương thức CASH
     * Khác REFUND: VOID là hủy ngay trong ca, không tạo giao dịch đối ứng
     */
    static async voidTransaction(
        transactionId: string, input: VoidTransactionInput, cashierId: string
    ): Promise<OfflineTransaction> {
        if (!input.void_reason) throw OFFLINE_PAYMENT_ERRORS.VOID_REASON_REQUIRED;

        const txn = await BillingOfflinePaymentRepository.getTransactionById(transactionId);
        if (!txn) throw OFFLINE_PAYMENT_ERRORS.TRANSACTION_NOT_FOUND;
        if (txn.status === VOID_STATUS) throw OFFLINE_PAYMENT_ERRORS.VOID_ALREADY_VOIDED;
        if (txn.status !== 'SUCCESS') throw OFFLINE_PAYMENT_ERRORS.VOID_NOT_SUCCESS;

        /* Kiểm tra thời hạn VOID */
        const paidAt = new Date(txn.paid_at);
        const now = new Date();
        const diffMinutes = (now.getTime() - paidAt.getTime()) / (1000 * 60);
        if (diffMinutes > OFFLINE_PAYMENT_CONFIG.VOID_TIME_LIMIT_MINUTES) {
            throw OFFLINE_PAYMENT_ERRORS.VOID_TIME_EXPIRED;
        }

        /* Kiểm tra cùng ca */
        const openShift = await BillingOfflinePaymentRepository.getOpenShiftByCashier(cashierId);
        if (!openShift || openShift.cashier_shifts_id !== txn.shift_id) {
            throw OFFLINE_PAYMENT_ERRORS.VOID_DIFFERENT_SHIFT;
        }

        const client = await BillingOfflinePaymentRepository.getClient();
        try {
            await client.query('BEGIN');

            /* VOID giao dịch */
            const voided = await BillingOfflinePaymentRepository.voidTransaction(
                transactionId, input.void_reason, cashierId, client
            );

            /* Rollback paid_amount trên invoice */
            await BillingOfflinePaymentRepository.updateInvoicePaidAmount(txn.invoice_id, client);

            /* Đánh dấu biên lai đã void */
            await BillingOfflinePaymentRepository.voidReceipt(
                transactionId, cashierId, input.void_reason, client
            );

            /* Cập nhật thống kê ca */
            await BillingOfflinePaymentRepository.updateShiftStats(openShift.cashier_shifts_id, client);

            await client.query('COMMIT');
            return voided;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /** Danh sách giao dịch tại quầy (chỉ có shift_id) */
    static async getOfflineTransactions(
        shiftId?: string, cashierId?: string, paymentMethod?: string,
        terminalId?: string, status?: string,
        dateFrom?: string, dateTo?: string,
        page: number = OFFLINE_PAYMENT_CONFIG.DEFAULT_PAGE,
        limit: number = OFFLINE_PAYMENT_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedResult<OfflineTransaction>> {
        const safeLimit = Math.min(limit, OFFLINE_PAYMENT_CONFIG.MAX_LIMIT);
        return await BillingOfflinePaymentRepository.getOfflineTransactions(
            shiftId, cashierId, paymentMethod, terminalId, status,
            dateFrom, dateTo, page, safeLimit
        );
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 2: POS TERMINALS
    // ═══════════════════════════════════════════════════

    /** Đăng ký thiết bị POS */
    static async createTerminal(input: CreateTerminalInput, userId: string): Promise<PosTerminal> {
        const exists = await BillingOfflinePaymentRepository.checkTerminalCodeExists(input.terminal_code);
        if (exists) throw OFFLINE_PAYMENT_ERRORS.TERMINAL_CODE_EXISTS;

        const branchOk = await BillingOfflinePaymentRepository.checkBranchExists(input.branch_id);
        if (!branchOk) throw OFFLINE_PAYMENT_ERRORS.BRANCH_NOT_FOUND;

        const terminalId = this.generateId('POS');
        return await BillingOfflinePaymentRepository.createTerminal(terminalId, input, userId);
    }

    /** Cập nhật thiết bị POS */
    static async updateTerminal(terminalId: string, input: UpdateTerminalInput): Promise<PosTerminal> {
        const terminal = await BillingOfflinePaymentRepository.getTerminalById(terminalId);
        if (!terminal) throw OFFLINE_PAYMENT_ERRORS.TERMINAL_NOT_FOUND;
        return await BillingOfflinePaymentRepository.updateTerminal(terminalId, input);
    }

    /** Danh sách POS */
    static async getTerminals(
        branchId?: string, isActive?: boolean,
        page: number = OFFLINE_PAYMENT_CONFIG.DEFAULT_PAGE,
        limit: number = OFFLINE_PAYMENT_CONFIG.DEFAULT_LIMIT
    ): Promise<PaginatedResult<PosTerminal>> {
        const safeLimit = Math.min(limit, OFFLINE_PAYMENT_CONFIG.MAX_LIMIT);
        return await BillingOfflinePaymentRepository.getTerminals(branchId, isActive, page, safeLimit);
    }

    /** Chi tiết POS */
    static async getTerminalById(terminalId: string): Promise<PosTerminal> {
        const terminal = await BillingOfflinePaymentRepository.getTerminalById(terminalId);
        if (!terminal) throw OFFLINE_PAYMENT_ERRORS.TERMINAL_NOT_FOUND;
        return terminal;
    }

    /** Bật/tắt POS */
    static async toggleTerminalStatus(terminalId: string): Promise<PosTerminal> {
        const terminal = await BillingOfflinePaymentRepository.getTerminalById(terminalId);
        if (!terminal) throw OFFLINE_PAYMENT_ERRORS.TERMINAL_NOT_FOUND;
        return await BillingOfflinePaymentRepository.toggleTerminal(terminalId);
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 3: RECEIPTS (BIÊN LAI)
    // ═══════════════════════════════════════════════════

    /** Lấy biên lai theo giao dịch */
    static async getReceiptByTransaction(transactionId: string): Promise<PaymentReceipt> {
        const receipt = await BillingOfflinePaymentRepository.getReceiptByTransaction(transactionId);
        if (!receipt) throw OFFLINE_PAYMENT_ERRORS.RECEIPT_NOT_FOUND;
        return receipt;
    }

    /** Chi tiết biên lai */
    static async getReceiptById(receiptId: string): Promise<PaymentReceipt> {
        const receipt = await BillingOfflinePaymentRepository.getReceiptById(receiptId);
        if (!receipt) throw OFFLINE_PAYMENT_ERRORS.RECEIPT_NOT_FOUND;
        return receipt;
    }

    /**
     * In lại biên lai — tăng reprint_count, cần quyền BILLING_RECEIPT_REPRINT
     * Không cho in lại biên lai đã void
     */
    static async reprintReceipt(receiptId: string): Promise<PaymentReceipt> {
        const receipt = await BillingOfflinePaymentRepository.getReceiptById(receiptId);
        if (!receipt) throw OFFLINE_PAYMENT_ERRORS.RECEIPT_NOT_FOUND;
        if (receipt.voided_at) throw OFFLINE_PAYMENT_ERRORS.RECEIPT_VOIDED;
        return await BillingOfflinePaymentRepository.incrementReprintCount(receiptId);
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 4: CA THU NGÂN MỞ RỘNG
    // ═══════════════════════════════════════════════════

    /**
     * Kê khai mệnh giá tiền khi đóng ca
     * Validate mệnh giá hợp lệ (VND), tính subtotal, upsert vào DB
     */
    static async submitCashDenomination(
        shiftId: string, denominations: CashDenominationInput[]
    ): Promise<ShiftCashDenomination[]> {
        const shift = await BillingOfflinePaymentRepository.getShiftById(shiftId);
        if (!shift) throw OFFLINE_PAYMENT_ERRORS.SHIFT_NOT_FOUND;

        /* Validate mệnh giá */
        const validValues = CASH_DENOMINATIONS as readonly number[];
        for (const d of denominations) {
            if (!validValues.includes(d.denomination_value)) {
                throw OFFLINE_PAYMENT_ERRORS.INVALID_DENOMINATION;
            }
        }

        const items = denominations.map(d => ({
            id: this.generateId('DEN'),
            value: d.denomination_value,
            quantity: d.quantity,
        }));

        return await BillingOfflinePaymentRepository.saveDenominations(shiftId, items);
    }

    /** Danh sách giao dịch trong ca */
    static async getShiftTransactions(shiftId: string): Promise<OfflineTransaction[]> {
        const shift = await BillingOfflinePaymentRepository.getShiftById(shiftId);
        if (!shift) throw OFFLINE_PAYMENT_ERRORS.SHIFT_NOT_FOUND;
        return await BillingOfflinePaymentRepository.getTransactionsByShift(shiftId);
    }

    /** Tổng kết ca — thống kê + mệnh giá + giao dịch */
    static async getShiftSummary(shiftId: string): Promise<ShiftSummary> {
        const shift = await BillingOfflinePaymentRepository.getShiftById(shiftId);
        if (!shift) throw OFFLINE_PAYMENT_ERRORS.SHIFT_NOT_FOUND;

        const stats = await BillingOfflinePaymentRepository.getShiftStats(shiftId);
        const denominations = await BillingOfflinePaymentRepository.getDenominationsByShift(shiftId);
        const transactions = await BillingOfflinePaymentRepository.getTransactionsByShift(shiftId);

        return {
            shift_id: shiftId,
            cashier_id: shift.cashier_id,
            cashier_name: shift.cashier_name,
            shift_start: shift.shift_start,
            shift_end: shift.shift_end,
            opening_balance: shift.opening_balance,
            system_calculated_balance: shift.system_calculated_balance,
            actual_closing_balance: shift.actual_closing_balance,
            status: shift.status,
            total_cash_payments: stats.total_cash,
            total_card_payments: stats.total_card,
            total_transfer_payments: stats.total_transfer,
            total_refunds: stats.total_refunds,
            total_voids: stats.total_voids,
            transaction_count: parseInt(stats.success_count) + parseInt(stats.void_count),
            denominations,
            transactions,
        };
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 5: BÁO CÁO
    // ═══════════════════════════════════════════════════

    /** Báo cáo cuối ngày */
    static async getDailyReport(
        reportDate: string, facilityId?: string, branchId?: string
    ): Promise<DailyReport> {
        if (facilityId) {
            const ok = await BillingOfflinePaymentRepository.checkFacilityExists(facilityId);
            if (!ok) throw OFFLINE_PAYMENT_ERRORS.FACILITY_NOT_FOUND;
        }
        if (branchId) {
            const ok = await BillingOfflinePaymentRepository.checkBranchExists(branchId);
            if (!ok) throw OFFLINE_PAYMENT_ERRORS.BRANCH_NOT_FOUND;
        }

        const report = await BillingOfflinePaymentRepository.getDailyReport(reportDate, facilityId, branchId);

        return {
            report_date: reportDate,
            facility_id: facilityId || null,
            branch_id: branchId || null,
            facility_name: null,
            branch_name: null,
            total_shifts: parseInt(report.summary.total_shifts) || 0,
            total_transactions: parseInt(report.summary.total_transactions) || 0,
            total_cash: report.summary.total_cash,
            total_card: report.summary.total_card,
            total_transfer: report.summary.total_transfer,
            total_collected: report.summary.total_collected,
            total_refunds: report.summary.total_refunds,
            total_voids: report.summary.total_voids,
            net_collected: report.summary.net_collected,
            by_cashier: report.by_cashier,
        };
    }

    /** Hiệu suất thu ngân */
    static async getCashierPerformance(
        cashierId: string, dateFrom: string, dateTo: string
    ): Promise<CashierPerformance> {
        const result = await BillingOfflinePaymentRepository.getCashierPerformance(
            cashierId, dateFrom, dateTo
        );

        if (!result) {
            return {
                cashier_id: cashierId,
                cashier_name: await BillingOfflinePaymentRepository.getCashierName(cashierId),
                period_start: dateFrom,
                period_end: dateTo,
                total_shifts: 0,
                total_transactions: 0,
                total_collected: '0',
                total_refunds: '0',
                total_voids: '0',
                avg_transaction_amount: '0',
                discrepancy_count: 0,
                total_discrepancy_amount: '0',
            };
        }

        return {
            ...result,
            period_start: dateFrom,
            period_end: dateTo,
            total_shifts: parseInt(result.total_shifts) || 0,
            total_transactions: parseInt(result.total_transactions) || 0,
            discrepancy_count: parseInt(result.discrepancy_count) || 0,
        };
    }
}
