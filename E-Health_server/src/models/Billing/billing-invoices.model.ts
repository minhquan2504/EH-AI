/**
 * Hóa đơn
 */
export interface Invoice {
    invoices_id: string;
    invoice_code: string;
    patient_id: string;
    encounter_id: string | null;
    facility_id: string | null;
    total_amount: string;
    discount_amount: string;
    insurance_amount: string;
    net_amount: string;
    paid_amount: string;
    status: string;
    notes: string | null;
    cancelled_reason: string | null;
    cancelled_by: string | null;
    cancelled_at: Date | null;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;

    patient_name?: string;
    patient_code?: string;
    encounter_type?: string;
    facility_name?: string;
    created_by_name?: string;
    items?: InvoiceDetail[];
    payments?: PaymentTransaction[];
}

export interface CreateInvoiceInput {
    patient_id: string;
    encounter_id?: string;
    facility_id?: string;
    notes?: string;
}

export interface UpdateInvoiceInput {
    discount_amount?: number;
    notes?: string;
}

/**
 * Chi tiết hóa đơn
 */
export interface InvoiceDetail {
    invoice_details_id: string;
    invoice_id: string;
    reference_type: string;
    reference_id: string;
    item_name: string;
    quantity: number;
    unit_price: string;
    subtotal: string;
    discount_amount: string;
    insurance_covered: string;
    patient_pays: string | null;
    notes: string | null;
}

export interface AddInvoiceItemInput {
    reference_type: string;
    reference_id: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    discount_amount?: number;
    insurance_covered?: number;
    notes?: string;
}

export interface UpdateInvoiceItemInput {
    quantity?: number;
    unit_price?: number;
    discount_amount?: number;
    insurance_covered?: number;
    notes?: string;
}

/**
 * Giao dịch thanh toán
 */
export interface PaymentTransaction {
    payment_transactions_id: string;
    transaction_code: string;
    invoice_id: string;
    transaction_type: string;
    payment_method: string;
    amount: string;
    gateway_transaction_id: string | null;
    gateway_response: any;
    status: string;
    cashier_id: string | null;
    notes: string | null;
    refund_reason: string | null;
    paid_at: Date;
    created_at: Date;

    cashier_name?: string;
    invoice_code?: string;
}

export interface CreatePaymentInput {
    invoice_id: string;
    payment_method: string;
    amount: number;
    gateway_transaction_id?: string;
    notes?: string;
}

export interface RefundInput {
    amount: number;
    refund_reason: string;
    payment_method?: string;
}

/**
 * Ca thu ngân
 */
export interface CashierShift {
    cashier_shifts_id: string;
    cashier_id: string;
    shift_start: Date;
    shift_end: Date | null;
    opening_balance: string;
    system_calculated_balance: string;
    actual_closing_balance: string | null;
    status: string;
    notes: string | null;

    cashier_name?: string;
    total_transactions?: number;
    total_amount?: string;
}

export interface OpenShiftInput {
    opening_balance: number;
    notes?: string;
}

export interface CloseShiftInput {
    actual_closing_balance: number;
    notes?: string;
}

/**
 * Claim BHYT
 */
export interface InvoiceInsuranceClaim {
    claim_id: string;
    invoice_id: string;
    patient_insurance_id: string;
    coverage_percent: string;
    total_claimable: string;
    approved_amount: string;
    claim_status: string;
    submitted_at: Date;
    processed_at: Date | null;
    notes: string | null;
    created_by: string | null;

    insurance_number?: string;
    insurance_type?: string;
}

/**
 * Thống kê doanh thu
 */
export interface RevenueSummary {
    total_invoices: number;
    total_revenue: string;
    total_paid: string;
    total_unpaid: string;
    total_insurance: string;
    total_discount: string;
    invoices_by_status: { status: string; count: number; amount: string }[];
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
