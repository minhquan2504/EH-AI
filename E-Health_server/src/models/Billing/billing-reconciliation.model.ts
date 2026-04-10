/**
 * Phiên đối soát
 */
export interface ReconciliationSession {
    session_id: string;
    session_code: string;
    reconciliation_type: string;
    reconcile_date: string;
    facility_id: string | null;
    total_system_amount: string;
    total_external_amount: string;
    discrepancy_amount: string;
    total_transactions_matched: number;
    total_transactions_unmatched: number;
    status: string;
    notes: string | null;
    reviewed_by: string | null;
    reviewed_at: Date | null;
    approved_by: string | null;
    approved_at: Date | null;
    reject_reason: string | null;
    shift_id: string | null;
    gateway_name: string | null;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;

    facility_name?: string;
    created_by_name?: string;
    reviewed_by_name?: string;
    approved_by_name?: string;
    items?: ReconciliationItem[];
}

/**
 * Chi tiết dòng đối soát
 */
export interface ReconciliationItem {
    item_id: string;
    session_id: string;
    match_status: string;
    system_transaction_id: string | null;
    system_transaction_code: string | null;
    system_amount: string | null;
    system_method: string | null;
    system_date: Date | null;
    external_reference: string | null;
    external_amount: string | null;
    external_date: Date | null;
    external_raw: any;
    discrepancy_amount: string;
    discrepancy_reason: string | null;
    resolution_status: string;
    resolved_by: string | null;
    resolved_at: Date | null;
    resolution_notes: string | null;
    created_at: Date;

    resolved_by_name?: string;
}

/**
 * Phiếu quyết toán
 */
export interface SettlementReport {
    report_id: string;
    report_code: string;
    report_type: string;
    period_start: string;
    period_end: string;
    facility_id: string | null;
    total_revenue: string;
    total_cash: string;
    total_card: string;
    total_transfer: string;
    total_online: string;
    total_refunds: string;
    total_voids: string;
    net_revenue: string;
    total_discrepancies: number;
    unresolved_discrepancies: number;
    status: string;
    submitted_by: string | null;
    submitted_at: Date | null;
    approved_by: string | null;
    approved_at: Date | null;
    reject_reason: string | null;
    notes: string | null;
    export_data: any;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;

    facility_name?: string;
    created_by_name?: string;
    submitted_by_name?: string;
    approved_by_name?: string;
}

/** Input chạy đối soát online */
export interface RunOnlineReconcInput {
    reconcile_date: string;
    facility_id?: string;
}

/** Input chạy đối soát ca */
export interface RunShiftReconcInput {
    notes?: string;
}

/** Input xử lý chênh lệch */
export interface ResolveItemInput {
    resolution_status: string;
    resolution_notes: string;
}

/** Input tạo phiếu quyết toán */
export interface CreateSettlementInput {
    report_type: string;
    period_start: string;
    period_end: string;
    facility_id?: string;
    notes?: string;
}

/** Input phê duyệt/từ chối quyết toán */
export interface ApproveRejectInput {
    reject_reason?: string;
    notes?: string;
}

/** Báo cáo chênh lệch */
export interface DiscrepancyReport {
    total_unresolved: number;
    total_discrepancy_amount: string;
    by_severity: { severity: string; count: number; total: string }[];
    by_type: { reconciliation_type: string; count: number; total: string }[];
    recent_items: ReconciliationItem[];
}

/** Phân trang */
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
