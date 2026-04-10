/** Loại hình khám từ xa */
export interface TeleConsultationType {
    type_id: string;
    code: string;
    name: string;
    description: string | null;
    default_platform: string;
    requires_video: boolean;
    requires_audio: boolean;
    allows_file_sharing: boolean;
    allows_screen_sharing: boolean;
    default_duration_minutes: number;
    min_duration_minutes: number;
    max_duration_minutes: number;
    icon_url: string | null;
    sort_order: number;
    is_active: boolean;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;

    created_by_name?: string;
    total_configs?: number;
}

/** Tạo loại hình mới */
export interface CreateTypeInput {
    code: string;
    name: string;
    description?: string;
    default_platform?: string;
    requires_video?: boolean;
    requires_audio?: boolean;
    allows_file_sharing?: boolean;
    allows_screen_sharing?: boolean;
    default_duration_minutes?: number;
    min_duration_minutes?: number;
    max_duration_minutes?: number;
    icon_url?: string;
    sort_order?: number;
}

/** Cập nhật loại hình */
export interface UpdateTypeInput {
    name?: string;
    description?: string;
    default_platform?: string;
    requires_video?: boolean;
    requires_audio?: boolean;
    allows_file_sharing?: boolean;
    allows_screen_sharing?: boolean;
    default_duration_minutes?: number;
    min_duration_minutes?: number;
    max_duration_minutes?: number;
    icon_url?: string;
    sort_order?: number;
    is_active?: boolean;
}

/** Cấu hình hình thức theo chuyên khoa & cơ sở */
export interface TeleTypeSpecialtyConfig {
    config_id: string;
    type_id: string;
    specialty_id: string;
    facility_id: string;
    facility_service_id: string | null;
    is_enabled: boolean;
    allowed_platforms: string[];
    min_duration_minutes: number | null;
    max_duration_minutes: number | null;
    default_duration_minutes: number | null;
    base_price: string;
    insurance_price: string | null;
    vip_price: string | null;
    max_patients_per_slot: number;
    advance_booking_days: number;
    cancellation_hours: number;
    auto_record: boolean;
    priority: number;
    notes: string | null;
    is_active: boolean;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;

    type_code?: string;
    type_name?: string;
    specialty_name?: string;
    specialty_code?: string;
    facility_name?: string;
    facility_service_name?: string;
    created_by_name?: string;
}

/** Tạo cấu hình chuyên khoa */
export interface CreateConfigInput {
    type_id: string;
    specialty_id: string;
    facility_id: string;
    facility_service_id?: string;
    is_enabled?: boolean;
    allowed_platforms?: string[];
    min_duration_minutes?: number;
    max_duration_minutes?: number;
    default_duration_minutes?: number;
    base_price: number;
    insurance_price?: number;
    vip_price?: number;
    max_patients_per_slot?: number;
    advance_booking_days?: number;
    cancellation_hours?: number;
    auto_record?: boolean;
    priority?: number;
    notes?: string;
}

/** Cập nhật cấu hình */
export interface UpdateConfigInput {
    facility_service_id?: string | null;
    is_enabled?: boolean;
    allowed_platforms?: string[];
    min_duration_minutes?: number | null;
    max_duration_minutes?: number | null;
    default_duration_minutes?: number | null;
    base_price?: number;
    insurance_price?: number | null;
    vip_price?: number | null;
    max_patients_per_slot?: number;
    advance_booking_days?: number;
    cancellation_hours?: number;
    auto_record?: boolean;
    priority?: number;
    notes?: string;
    is_active?: boolean;
}

/** Batch create input */
export interface BatchConfigInput {
    type_id: string;
    facility_id: string;
    configs: {
        specialty_id: string;
        facility_service_id?: string;
        base_price: number;
        insurance_price?: number;
        vip_price?: number;
        min_duration_minutes?: number;
        max_duration_minutes?: number;
        default_duration_minutes?: number;
        allowed_platforms?: string[];
        auto_record?: boolean;
    }[];
}

/** Bộ lọc loại hình */
export interface TypeFilter {
    is_active?: boolean;
    keyword?: string;
    page: number;
    limit: number;
}

/** Bộ lọc cấu hình */
export interface ConfigFilter {
    type_id?: string;
    specialty_id?: string;
    facility_id?: string;
    is_enabled?: boolean;
    is_active?: boolean;
    page: number;
    limit: number;
}

/** Phân trang */
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
