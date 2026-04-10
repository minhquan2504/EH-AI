/** Cấu hình hệ thống */
export interface TeleSystemConfig {
    config_id: string;
    config_key: string;
    config_value: string;
    config_type: string;
    category: string;
    description: string | null;
    is_editable: boolean;
    updated_by: string | null;
    created_at: Date;
    updated_at: Date;
    updater_name?: string;
}

/** Input cập nhật config */
export interface UpdateConfigInput {
    config_value: string;
}

/** Input batch update */
export interface BatchUpdateInput {
    configs: { config_key: string; config_value: string }[];
}

/** Chi phí dịch vụ */
export interface TeleServicePricing {
    pricing_id: string;
    type_id: string;
    specialty_id: string | null;
    facility_id: string | null;
    base_price: number;
    currency: string;
    discount_percent: number;
    effective_from: Date;
    effective_to: Date | null;
    is_active: boolean;
    created_by: string | null;
    updated_by: string | null;
    created_at: Date;
    updated_at: Date;
    type_name?: string;
    specialty_name?: string;
    facility_name?: string;
}

/** Input tạo pricing */
export interface CreatePricingInput {
    type_id: string;
    specialty_id?: string;
    facility_id?: string;
    base_price: number;
    currency?: string;
    discount_percent?: number;
    effective_from: string;
    effective_to?: string;
}

/** Audit log */
export interface TeleConfigAuditLog {
    log_id: string;
    config_key: string;
    old_value: string | null;
    new_value: string | null;
    changed_by: string | null;
    changed_at: Date;
    changer_name?: string;
}

/** Filter pricing */
export interface PricingFilter {
    type_id?: string;
    specialty_id?: string;
    facility_id?: string;
    is_active?: boolean;
    page: number;
    limit: number;
}
