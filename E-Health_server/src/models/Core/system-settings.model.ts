/** Cấu hình giờ làm việc của 1 ngày trong tuần */
export interface WorkingHoursDay {
    operation_hours_id?: string;
    day_of_week: number;
    day_label: string;
    open_time: string;
    close_time: string;
    is_closed: boolean;
}

/** Toàn bộ cấu hình giờ làm việc 7 ngày trong tuần */
export type WorkingHoursConfig = WorkingHoursDay[];

/** Input để cập nhật giờ làm việc (gửi những ngày cần thay đổi) */
export interface UpdateWorkingHoursInput {
    days: Array<{
        day_of_week: number;
        open_time?: string;
        close_time?: string;
        is_closed?: boolean;
    }>;
}

/** Cấu hình slot khám bệnh */
export interface SlotConfig {
    duration_minutes: number;
    max_patients_per_slot: number;
}

/** Input cập nhật slot config */
export interface UpdateSlotConfigInput {
    duration_minutes?: number;
    max_patients_per_slot?: number;
}

// BUSINESS RULES

/** 1 quy định nghiệp vụ */
export interface BusinessRule {
    system_settings_id: string;
    setting_key: string;
    value: number | boolean;
    module: string;
    description: string | null;
    updated_by: string | null;
    updated_at: Date;
}

/** Response trả về theo nhóm module */
export interface BusinessRulesGrouped {
    module: string;
    rules: BusinessRule[];
}

/** Input PUT single rule */
export interface UpdateBusinessRuleInput {
    value: number | boolean;
}

/** Input PUT bulk */
export interface BulkUpdateBusinessRulesInput {
    rules: Array<{
        key: string;
        value: number | boolean;
    }>;
}

// SECURITY SETTINGS (1.4.4)
/** Cấu hình bảo mật hệ thống – structured object */
export interface SecurityConfig {
    max_login_attempts: number;
    lock_duration_minutes: number;
    require_email_verification: boolean;
    password_min_length: number;
    session_duration_days: number;
    require_2fa_roles: string[];
    access_token_expiry_minutes: number;
    refresh_token_expiry_days: number;
}

/** Input cập nhật – tất cả optional (partial update) */
export interface UpdateSecurityConfigInput {
    max_login_attempts?: number;
    lock_duration_minutes?: number;
    require_email_verification?: boolean;
    password_min_length?: number;
    session_duration_days?: number;
    require_2fa_roles?: string[];
    access_token_expiry_minutes?: number;
    refresh_token_expiry_days?: number;
}

// CẤU HÌNH ĐA NGÔN NGỮ

/** Thông tin 1 ngôn ngữ (kèm trạng thái kích hoạt) */
export interface LangMeta {
    code: string;
    name: string;
    flag: string;
    is_active: boolean;
}

/** Cấu hình ngôn ngữ hệ thống */
export interface I18nConfig {
    default_language: string;
    supported_languages: string[];
}

/** Input cập nhật i18n – partial */
export interface UpdateI18nConfigInput {
    default_language?: string;
    supported_languages?: string[];
}

// UI SETTINGS

/** Cấu hình hiển thị giao diện chung */
export interface UiSettings {
    theme: string;
    primary_color: string;
    font_family: string;
    date_format: string;
    timezone: string;
    time_format: string;
}

/** Input cập nhật UI settings – partial */
export interface UpdateUiSettingsInput {
    theme?: string;
    primary_color?: string;
    font_family?: string;
    date_format?: string;
    timezone?: string;
    time_format?: string;
}

// SYSTEM PARAMS (1.4.7)

/** 1 dòng setting trong bảng system_settings */
export interface SystemSettingRow {
    system_settings_id: string;
    setting_key: string;
    setting_value: Record<string, any>;
    module: string | null;
    description: string | null;
    updated_by: string | null;
    updated_at: Date;
    /** Computed: key có thuộc PROTECTED_SETTING_KEYS không */
    is_protected: boolean;
}

/** Response phân trang */
export interface SystemSettingsPaginated {
    data: SystemSettingRow[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/** Input tạo mới setting */
export interface CreateSystemSettingInput {
    setting_key: string;
    setting_value: Record<string, any>;
    module?: string;
    description?: string;
}

/** Input cập nhật setting */
export interface UpdateSystemSettingInput {
    setting_value: Record<string, any>;
    description?: string;
}

// CONFIG PERMISSIONS

export type ConfigPermissionMap = Record<string, string[]>;

/** Input cập nhật phân quyền chỉnh sửa cấu hình */
export interface UpdateConfigPermissionsInput {
    permissions: ConfigPermissionMap;
}




