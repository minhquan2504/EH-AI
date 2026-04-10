/**
 * Cấu hình phát hành HĐĐT theo cơ sở
 */
export interface EInvoiceConfig {
    config_id: string;
    facility_id: string;
    seller_name: string;
    seller_tax_code: string;
    seller_address: string | null;
    seller_phone: string | null;
    seller_bank_account: string | null;
    seller_bank_name: string | null;
    invoice_template: string;
    invoice_series: string;
    current_number: number;
    tax_rate_default: string;
    currency_default: string;
    is_active: boolean;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;

    facility_name?: string;
}

export interface UpsertConfigInput {
    seller_name: string;
    seller_tax_code: string;
    seller_address?: string;
    seller_phone?: string;
    seller_bank_account?: string;
    seller_bank_name?: string;
    invoice_template?: string;
    invoice_series?: string;
    tax_rate_default?: number;
    currency_default?: string;
}

/**
 * Hóa đơn điện tử
 */
export interface EInvoice {
    e_invoice_id: string;
    e_invoice_number: string;
    invoice_template: string;
    invoice_series: string;
    lookup_code: string | null;
    invoice_id: string | null;
    payment_transaction_id: string | null;
    invoice_type: string;
    seller_name: string;
    seller_tax_code: string;
    seller_address: string | null;
    seller_phone: string | null;
    seller_bank_account: string | null;
    seller_bank_name: string | null;
    buyer_name: string | null;
    buyer_tax_code: string | null;
    buyer_address: string | null;
    buyer_email: string | null;
    buyer_type: string;
    total_before_tax: string;
    tax_rate: string;
    tax_amount: string;
    total_after_tax: string;
    discount_amount: string;
    payment_method_text: string | null;
    amount_in_words: string | null;
    status: string;
    signed_at: Date | null;
    signed_by: string | null;
    cancelled_at: Date | null;
    cancelled_by: string | null;
    cancel_reason: string | null;
    replaced_by_id: string | null;
    adjustment_for_id: string | null;
    adjustment_type: string | null;
    notes: string | null;
    currency: string;
    facility_id: string | null;
    branch_id: string | null;
    issued_at: Date | null;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;

    invoice_code?: string;
    facility_name?: string;
    created_by_name?: string;
    signed_by_name?: string;
    items?: EInvoiceItem[];
    documents?: BillingDocument[];
}

/**
 * Chi tiết dòng hàng trên HĐĐT
 */
export interface EInvoiceItem {
    item_id: string;
    e_invoice_id: string;
    line_number: number;
    item_name: string;
    unit: string | null;
    quantity: number;
    unit_price: string;
    discount_amount: string;
    amount_before_tax: string;
    tax_rate: string;
    tax_amount: string;
    amount_after_tax: string;
    reference_type: string | null;
    reference_id: string | null;
    notes: string | null;
}

/**
 * Chứng từ thanh toán
 */
export interface BillingDocument {
    document_id: string;
    document_code: string;
    document_type: string;
    document_name: string;
    file_url: string;
    file_size: number | null;
    mime_type: string | null;
    invoice_id: string | null;
    e_invoice_id: string | null;
    payment_transaction_id: string | null;
    description: string | null;
    tags: string[];
    uploaded_by: string | null;
    upload_source: string;
    is_archived: boolean;
    archived_at: Date | null;
    created_at: Date;
    updated_at: Date;

    uploaded_by_name?: string;
    invoice_code?: string;
    e_invoice_number?: string;
}

/**
 * Input tạo HĐĐT
 */
export interface CreateEInvoiceInput {
    invoice_id: string;
    payment_transaction_id?: string;
    buyer_name?: string;
    buyer_email?: string;
    buyer_address?: string;
    tax_rate?: number;
    payment_method_text?: string;
    notes?: string;
    facility_id: string;
    branch_id?: string;
}

/**
 * Input tạo HĐ VAT
 */
export interface CreateVATInvoiceInput extends CreateEInvoiceInput {
    buyer_tax_code: string;
    buyer_name: string;
    buyer_address: string;
}

/**
 * Input hủy HĐĐT
 */
export interface CancelEInvoiceInput {
    cancel_reason: string;
}

/**
 * Input thay thế HĐĐT
 */
export interface ReplaceEInvoiceInput {
    cancel_reason: string;
    buyer_name?: string;
    buyer_tax_code?: string;
    buyer_address?: string;
    buyer_email?: string;
    tax_rate?: number;
    payment_method_text?: string;
    notes?: string;
    /** Items mới (nếu muốn override) */
    items?: ReplaceEInvoiceItemInput[];
}

export interface ReplaceEInvoiceItemInput {
    item_name: string;
    unit?: string;
    quantity: number;
    unit_price: number;
    discount_amount?: number;
    tax_rate?: number;
    reference_type?: string;
    reference_id?: string;
    notes?: string;
}

/**
 * Input điều chỉnh HĐĐT
 */
export interface AdjustEInvoiceInput {
    adjustment_type: string;
    adjust_amount: number;
    cancel_reason: string;
    notes?: string;
}

/**
 * Input upload chứng từ
 */
export interface UploadDocumentInput {
    document_type: string;
    document_name: string;
    file_url: string;
    file_size?: number;
    mime_type?: string;
    invoice_id?: string;
    e_invoice_id?: string;
    payment_transaction_id?: string;
    description?: string;
    tags?: string[];
}

/**
 * Bộ lọc tìm kiếm nâng cao
 */
export interface InvoiceSearchFilters {
    search?: string;
    invoice_code?: string;
    e_invoice_number?: string;
    lookup_code?: string;
    patient_id?: string;
    facility_id?: string;
    status?: string;
    invoice_type?: string;
    date_from?: string;
    date_to?: string;
    amount_from?: number;
    amount_to?: number;
}

/**
 * Sự kiện trong timeline hóa đơn
 */
export interface InvoiceTimelineEvent {
    event_type: string;
    event_at: Date;
    description: string;
    actor_name: string | null;
    details: any;
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
