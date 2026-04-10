/** Hồ sơ thu ngân */
export interface CashierProfile {
    cashier_profile_id: string;
    user_id: string;
    employee_code: string | null;
    branch_id: string | null;
    facility_id: string | null;
    can_collect_payment: boolean;
    can_process_refund: boolean;
    can_void_transaction: boolean;
    can_open_shift: boolean;
    can_close_shift: boolean;
    is_active: boolean;
    supervisor_id: string | null;
    notes: string | null;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;

    user_name?: string;
    supervisor_name?: string;
    branch_name?: string;
    facility_name?: string;
}

export interface CreateCashierProfileInput {
    user_id: string;
    employee_code?: string;
    branch_id?: string;
    facility_id?: string;
    can_collect_payment?: boolean;
    can_process_refund?: boolean;
    can_void_transaction?: boolean;
    can_open_shift?: boolean;
    can_close_shift?: boolean;
    supervisor_id?: string;
    notes?: string;
}

export interface UpdateCashierProfileInput {
    employee_code?: string;
    branch_id?: string;
    facility_id?: string;
    can_collect_payment?: boolean;
    can_process_refund?: boolean;
    can_void_transaction?: boolean;
    can_open_shift?: boolean;
    can_close_shift?: boolean;
    is_active?: boolean;
    supervisor_id?: string;
    notes?: string;
}

/** Giới hạn thao tác */
export interface CashierOperationLimit {
    limit_id: string;
    cashier_profile_id: string;
    max_single_payment: string | null;
    max_single_refund: string | null;
    max_single_void: string | null;
    max_shift_total: string | null;
    max_shift_refund_total: string | null;
    max_shift_void_count: number | null;
    max_daily_total: string | null;
    max_daily_refund_total: string | null;
    max_daily_void_count: number | null;
    require_approval_above: string | null;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface SetLimitInput {
    cashier_profile_id: string;
    max_single_payment?: number;
    max_single_refund?: number;
    max_single_void?: number;
    max_shift_total?: number;
    max_shift_refund_total?: number;
    max_shift_void_count?: number;
    max_daily_total?: number;
    max_daily_refund_total?: number;
    max_daily_void_count?: number;
    require_approval_above?: number;
}

export interface CheckLimitInput {
    user_id: string;
    action_type: string;    // PAYMENT | REFUND | VOID
    amount: number;
    shift_id?: string;
}

export interface CheckLimitResult {
    allowed: boolean;
    requires_approval: boolean;
    exceeded_limits: string[];
    current_usage: {
        shift_total?: number;
        shift_refund?: number;
        shift_void_count?: number;
        daily_total?: number;
        daily_refund?: number;
        daily_void_count?: number;
    };
}

/** Nhật ký hoạt động */
export interface CashierActivityLog {
    log_id: string;
    cashier_profile_id: string | null;
    user_id: string;
    shift_id: string | null;
    action_type: string;
    action_detail: any;
    ip_address: string | null;
    user_agent: string | null;
    facility_id: string | null;
    created_at: Date;

    user_name?: string;
    employee_code?: string;
}

/** Phân trang */
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
