/**
 * Chính sách giá dịch vụ theo đối tượng bệnh nhân
 */
export interface ServicePricePolicy {
    policy_id: string;
    facility_service_id: string;
    patient_type: string;
    price: string;
    currency: string;
    description: string | null;
    effective_from: string;
    effective_to: string | null;
    is_active: boolean;
    created_by: string;
    created_at: Date;
    updated_at: Date;

    service_code?: string;
    service_name?: string;
    service_group?: string;
    facility_name?: string;
    created_by_name?: string;
}

export interface CreatePricePolicyInput {
    facility_service_id: string;
    patient_type: string;
    price: number;
    currency?: string;
    description?: string;
    effective_from: string;
    effective_to?: string;
}

export interface UpdatePricePolicyInput {
    patient_type?: string;
    price?: number;
    description?: string;
    effective_from?: string;
    effective_to?: string | null;
    is_active?: boolean;
    reason: string;
}

export interface BulkCreatePoliciesInput {
    facility_service_id: string;
    policies: {
        patient_type: string;
        price: number;
        description?: string;
        effective_from: string;
        effective_to?: string;
    }[];
}

/**
 * Giá dịch vụ theo chuyên khoa
 */
export interface FacilityServiceSpecialtyPrice {
    specialty_price_id: string;
    facility_service_id: string;
    specialty_id: string;
    patient_type: string;
    price: string;
    effective_from: string;
    effective_to: string | null;
    is_active: boolean;
    created_by: string;
    created_at: Date;
    updated_at: Date;

    service_code?: string;
    service_name?: string;
    specialty_name?: string;
    specialty_code?: string;
    created_by_name?: string;
}

export interface CreateSpecialtyPriceInput {
    facility_service_id: string;
    specialty_id: string;
    patient_type?: string;
    price: number;
    effective_from: string;
    effective_to?: string;
}

export interface UpdateSpecialtyPriceInput {
    patient_type?: string;
    price?: number;
    effective_from?: string;
    effective_to?: string | null;
    is_active?: boolean;
    reason: string;
}

/**
 * Lịch sử thay đổi giá
 */
export interface ServicePriceHistory {
    history_id: string;
    facility_service_id: string;
    change_type: string;
    change_source: string;
    reference_id: string;
    patient_type: string | null;
    specialty_id: string | null;
    old_price: string | null;
    new_price: string | null;
    old_effective_from: string | null;
    new_effective_from: string | null;
    old_effective_to: string | null;
    new_effective_to: string | null;
    reason: string | null;
    changed_by: string;
    changed_at: Date;

    service_code?: string;
    service_name?: string;
    changed_by_name?: string;
    specialty_name?: string;
}

/**
 * Kết quả tra cứu giá (Price Resolver)
 */
export interface ResolvedPrice {
    resolved_price: string;
    source: 'SPECIALTY_PRICE' | 'PRICE_POLICY' | 'FACILITY_SERVICE';
    policy_id: string | null;
    specialty_price_id: string | null;
    patient_type: string;
    specialty_id: string | null;
    effective_from: string | null;
    effective_to: string | null;
}

/**
 * Thống kê bảng giá cơ sở
 */
export interface PricingSummary {
    total_services: number;
    total_policies: number;
    min_price: string;
    max_price: string;
    avg_price: string;
    services_with_insurance: number;
    services_without_policy: number;
    expiring_policies_count: number;
}

/**
 * Kết quả so sánh giá liên cơ sở
 */
export interface PriceComparison {
    facility_id: string;
    facility_name: string;
    price: string;
    price_source: string;
    patient_type: string;
}

/**
 * Phân trang chung
 */
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
