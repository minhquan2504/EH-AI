/**
 * Thiết bị POS
 */
export interface PosTerminal {
    terminal_id: string;
    terminal_code: string;
    terminal_name: string;
    terminal_type: string;
    brand: string | null;
    model: string | null;
    serial_number: string | null;
    location_description: string | null;
    branch_id: string;
    is_active: boolean;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;

    branch_name?: string;
}

export interface CreateTerminalInput {
    terminal_code: string;
    terminal_name: string;
    terminal_type?: string;
    brand?: string;
    model?: string;
    serial_number?: string;
    location_description?: string;
    branch_id: string;
}

export interface UpdateTerminalInput {
    terminal_name?: string;
    terminal_type?: string;
    brand?: string;
    model?: string;
    serial_number?: string;
    location_description?: string;
}

/**
 * Biên lai thanh toán
 */
export interface PaymentReceipt {
    receipt_id: string;
    receipt_number: string;
    payment_transaction_id: string;
    invoice_id: string;
    patient_id: string;
    patient_name: string;
    patient_code: string | null;
    facility_name: string | null;
    facility_address: string | null;
    cashier_name: string;
    cashier_id: string;
    items_snapshot: ReceiptItem[];
    total_amount: string;
    discount_amount: string;
    insurance_amount: string;
    net_amount: string;
    paid_amount: string;
    payment_method: string;
    change_amount: string;
    receipt_type: string;
    printed_at: Date;
    reprint_count: number;
    voided_at: Date | null;
    voided_by: string | null;
    void_reason: string | null;
    shift_id: string | null;
    created_at: Date;

    transaction_code?: string;
    invoice_code?: string;
}

export interface ReceiptItem {
    item_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    discount_amount: number;
    insurance_covered: number;
}

/**
 * Mệnh giá tiền khi đóng ca
 */
export interface ShiftCashDenomination {
    denomination_id: string;
    shift_id: string;
    denomination_value: number;
    quantity: number;
    subtotal: string;
    created_at: Date;
}

export interface CashDenominationInput {
    denomination_value: number;
    quantity: number;
}

/**
 * Input thanh toán tại quầy
 */
export interface OfflinePaymentInput {
    invoice_id: string;
    payment_method: string;
    amount: number;
    terminal_id?: string;
    approval_code?: string;
    card_last_four?: string;
    card_brand?: string;
    notes?: string;
}

/**
 * Input hủy giao dịch
 */
export interface VoidTransactionInput {
    void_reason: string;
}

/**
 * Giao dịch tại quầy mở rộng (JOIN data)
 */
export interface OfflineTransaction {
    payment_transactions_id: string;
    transaction_code: string;
    invoice_id: string;
    transaction_type: string;
    payment_method: string;
    amount: string;
    status: string;
    cashier_id: string | null;
    terminal_id: string | null;
    shift_id: string | null;
    approval_code: string | null;
    card_last_four: string | null;
    card_brand: string | null;
    voided_at: Date | null;
    voided_by: string | null;
    void_reason: string | null;
    notes: string | null;
    paid_at: Date;

    cashier_name?: string;
    invoice_code?: string;
    patient_name?: string;
    terminal_name?: string;
}

/**
 * Tổng kết ca thu ngân
 */
export interface ShiftSummary {
    shift_id: string;
    cashier_id: string;
    cashier_name: string;
    shift_start: Date;
    shift_end: Date | null;
    opening_balance: string;
    system_calculated_balance: string;
    actual_closing_balance: string | null;
    status: string;
    total_cash_payments: string;
    total_card_payments: string;
    total_transfer_payments: string;
    total_refunds: string;
    total_voids: string;
    transaction_count: number;
    denominations: ShiftCashDenomination[];
    transactions: OfflineTransaction[];
}

/**
 * Báo cáo cuối ngày
 */
export interface DailyReport {
    report_date: string;
    facility_id: string | null;
    branch_id: string | null;
    facility_name: string | null;
    branch_name: string | null;
    total_shifts: number;
    total_transactions: number;
    total_cash: string;
    total_card: string;
    total_transfer: string;
    total_collected: string;
    total_refunds: string;
    total_voids: string;
    net_collected: string;
    by_cashier: CashierDailyStats[];
}

export interface CashierDailyStats {
    cashier_id: string;
    cashier_name: string;
    shifts_count: number;
    transaction_count: number;
    total_collected: string;
    total_refunds: string;
    total_voids: string;
}

/**
 * Hiệu suất thu ngân
 */
export interface CashierPerformance {
    cashier_id: string;
    cashier_name: string;
    period_start: string;
    period_end: string;
    total_shifts: number;
    total_transactions: number;
    total_collected: string;
    total_refunds: string;
    total_voids: string;
    avg_transaction_amount: string;
    discrepancy_count: number;
    total_discrepancy_amount: string;
}

/**
 * Phân trang
 */
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
