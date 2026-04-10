/**
 * Chính sách giảm giá
 */
export interface DiscountPolicy {
    discount_id: string;
    discount_code: string;
    name: string;
    description: string | null;
    discount_type: string;
    discount_value: string;
    max_discount_amount: string | null;
    min_order_amount: string;
    apply_to: string;
    applicable_services: any[] | null;
    applicable_groups: string[] | null;
    target_patient_types: string[] | null;
    effective_from: string;
    effective_to: string | null;
    is_active: boolean;
    priority: number;
    facility_id: string | null;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;

    created_by_name?: string;
    facility_name?: string;
}

export interface CreateDiscountInput {
    name: string;
    description?: string;
    discount_type: string;
    discount_value: number;
    max_discount_amount?: number;
    min_order_amount?: number;
    apply_to?: string;
    applicable_services?: any[];
    applicable_groups?: string[];
    target_patient_types?: string[];
    effective_from: string;
    effective_to?: string;
    priority?: number;
    facility_id?: string;
}

export interface UpdateDiscountInput {
    name?: string;
    description?: string;
    discount_value?: number;
    max_discount_amount?: number;
    min_order_amount?: number;
    apply_to?: string;
    applicable_services?: any[];
    applicable_groups?: string[];
    target_patient_types?: string[];
    effective_from?: string;
    effective_to?: string | null;
    priority?: number;
    is_active?: boolean;
}

/**
 * Voucher / Coupon
 */
export interface Voucher {
    voucher_id: string;
    voucher_code: string;
    name: string;
    description: string | null;
    discount_type: string;
    discount_value: string;
    max_discount_amount: string | null;
    min_order_amount: string;
    max_usage: number | null;
    max_usage_per_patient: number;
    current_usage: number;
    target_patient_types: string[] | null;
    valid_from: string;
    valid_to: string | null;
    is_active: boolean;
    facility_id: string | null;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;

    created_by_name?: string;
    facility_name?: string;
    remaining_usage?: number;
}

export interface CreateVoucherInput {
    voucher_code: string;
    name: string;
    description?: string;
    discount_type: string;
    discount_value: number;
    max_discount_amount?: number;
    min_order_amount?: number;
    max_usage?: number;
    max_usage_per_patient?: number;
    target_patient_types?: string[];
    valid_from: string;
    valid_to?: string;
    facility_id?: string;
}

export interface UpdateVoucherInput {
    name?: string;
    description?: string;
    discount_value?: number;
    max_discount_amount?: number;
    min_order_amount?: number;
    max_usage?: number;
    max_usage_per_patient?: number;
    target_patient_types?: string[];
    valid_from?: string;
    valid_to?: string | null;
    is_active?: boolean;
}

/** Lịch sử sử dụng voucher */
export interface VoucherUsage {
    usage_id: string;
    voucher_id: string;
    invoice_id: string;
    patient_id: string | null;
    discount_amount: string;
    used_at: Date;
    used_by: string | null;

    voucher_code?: string;
    invoice_code?: string;
    patient_name?: string;
    used_by_name?: string;
}

/** Validate voucher input */
export interface ValidateVoucherInput {
    voucher_code: string;
    invoice_id?: string;
    patient_id?: string;
    order_amount?: number;
    patient_type?: string;
}

/** Redeem voucher input */
export interface RedeemVoucherInput {
    voucher_code: string;
    invoice_id: string;
    patient_id?: string;
    order_amount: number;
    patient_type?: string;
}

/**
 * Gói dịch vụ
 */
export interface ServiceBundle {
    bundle_id: string;
    bundle_code: string;
    name: string;
    description: string | null;
    bundle_price: string;
    original_total_price: string;
    discount_percentage: string;
    valid_from: string;
    valid_to: string | null;
    target_patient_types: string[] | null;
    max_purchases: number | null;
    current_purchases: number;
    is_active: boolean;
    facility_id: string | null;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;

    created_by_name?: string;
    facility_name?: string;
    items?: ServiceBundleItem[];
}

export interface ServiceBundleItem {
    item_id: string;
    bundle_id: string;
    facility_service_id: string;
    quantity: number;
    unit_price: string;
    item_price: string;
    notes: string | null;

    service_name?: string;
    service_code?: string;
}

export interface CreateBundleInput {
    bundle_code: string;
    name: string;
    description?: string;
    bundle_price: number;
    valid_from: string;
    valid_to?: string;
    target_patient_types?: string[];
    max_purchases?: number;
    facility_id?: string;
    items: {
        facility_service_id: string;
        quantity?: number;
        item_price: number;
    }[];
}

export interface UpdateBundleInput {
    name?: string;
    description?: string;
    bundle_price?: number;
    valid_from?: string;
    valid_to?: string | null;
    target_patient_types?: string[];
    max_purchases?: number;
    is_active?: boolean;
}

/** Kết quả tính giảm giá */
export interface DiscountCalculation {
    original_amount: number;
    total_discount: number;
    final_amount: number;
    applied_discounts: {
        discount_id: string;
        discount_code: string;
        name: string;
        type: string;
        value: number;
        discount_amount: number;
    }[];
}

/** Phân trang */
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
