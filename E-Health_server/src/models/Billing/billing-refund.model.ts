/**
 * Yêu cầu hoàn tiền
 */
export interface RefundRequest {
    request_id: string;
    request_code: string;
    transaction_id: string;
    invoice_id: string;
    patient_id: string | null;
    refund_type: string;
    original_amount: string;
    refund_amount: string;
    refund_method: string;
    reason_category: string;
    reason_detail: string | null;
    evidence_urls: string[] | null;
    status: string;
    requested_by: string | null;
    requested_at: Date;
    approved_by: string | null;
    approved_at: Date | null;
    rejected_by: string | null;
    rejected_at: Date | null;
    reject_reason: string | null;
    processed_by: string | null;
    processed_at: Date | null;
    completed_at: Date | null;
    refund_transaction_id: string | null;
    gateway_refund_id: string | null;
    notes: string | null;
    facility_id: string | null;
    created_at: Date;
    updated_at: Date;

    requested_by_name?: string;
    approved_by_name?: string;
    rejected_by_name?: string;
    processed_by_name?: string;
    patient_name?: string;
    invoice_code?: string;
    transaction_code?: string;
    original_payment_method?: string;
}

/**
 * Điều chỉnh giao dịch
 */
export interface TransactionAdjustment {
    adjustment_id: string;
    adjustment_code: string;
    original_transaction_id: string;
    invoice_id: string;
    adjustment_type: string;
    adjustment_amount: string;
    description: string;
    corrective_transaction_id: string | null;
    status: string;
    requested_by: string | null;
    requested_at: Date;
    approved_by: string | null;
    approved_at: Date | null;
    applied_by: string | null;
    applied_at: Date | null;
    reject_reason: string | null;
    notes: string | null;
    created_at: Date;
    updated_at: Date;

    requested_by_name?: string;
    approved_by_name?: string;
    applied_by_name?: string;
    invoice_code?: string;
    transaction_code?: string;
}

/** Input tạo yêu cầu hoàn tiền */
export interface CreateRefundInput {
    transaction_id: string;
    refund_type: string;
    refund_amount?: number;
    refund_method?: string;
    reason_category: string;
    reason_detail: string;
    evidence_urls?: string[];
    notes?: string;
    facility_id?: string;
}

/** Input tạo điều chỉnh */
export interface CreateAdjustmentInput {
    original_transaction_id: string;
    adjustment_type: string;
    adjustment_amount: number;
    description: string;
    notes?: string;
}

/** Input phê duyệt/từ chối */
export interface ApproveRejectInput {
    reject_reason?: string;
    notes?: string;
}

/** Timeline event */
export interface RefundTimelineEvent {
    event: string;
    timestamp: Date;
    user_name: string | null;
    detail: string | null;
}

/** Dashboard tổng quan */
export interface RefundDashboard {
    pending_count: number;
    pending_amount: string;
    total_refunded: string;
    total_refund_count: number;
    by_reason: { reason_category: string; count: number; total: string }[];
    by_status: { status: string; count: number }[];
    recent_requests: RefundRequest[];
}

/** Phân trang */
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
