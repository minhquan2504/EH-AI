// CLOUDINARY CONFIG
export const CLOUDINARY_CONFIG = {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
    API_KEY: process.env.CLOUDINARY_API_KEY || '',
    API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
    /** Tên thư mục mặc định lưu ảnh trên Cloudinary */
    DEFAULT_FOLDER: 'project_uploads',
    /** Giới hạn dung lượng file (5MB) */
    MAX_FILE_SIZE: 5 * 1024 * 1024,
} as const;

export const UPLOAD_MESSAGES = {
    FILE_MISSING: 'Không tìm thấy file tải lên.',
    INVALID_FORMAT: 'Chỉ cho phép định dạng hình ảnh!',
    UPLOAD_SUCCESS: 'Tải ảnh lên thành công!',
    UPLOAD_FAILED: 'Không thể tải ảnh lên hệ thống.',
} as const;

// SYSTEM ERRORS
export const SYSTEM_ERRORS = {
    FACILITY_NOT_FOUND: {
        httpCode: 404,
        code: 'SYS_001',
        message: 'Không tìm thấy thông tin cơ sở y tế.',
    },
    INVALID_IMAGE_FORMAT: {
        httpCode: 400,
        code: 'SYS_002',
        message: UPLOAD_MESSAGES.INVALID_FORMAT,
    },
    IMAGE_TOO_LARGE: {
        httpCode: 400,
        code: 'SYS_003',
        message: `File ảnh vượt quá giới hạn ${CLOUDINARY_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB.`,
    },
    UPLOAD_FAILED: {
        httpCode: 500,
        code: 'SYS_004',
        message: UPLOAD_MESSAGES.UPLOAD_FAILED,
    },
} as const;

// LOGO CONFIG
export const LOGO_CONFIG = {
    ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as string[],
    CLOUDINARY_FOLDER: 'ehealth/logos',
} as const;

// LICENSE FILE CONFIG
export const LICENSE_CONFIG = {
    ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'application/pdf'] as string[],
    CLOUDINARY_FOLDER: 'ehealth/licenses',
    MAX_FILE_SIZE: 10 * 1024 * 1024,
} as const;

export const LICENSE_UPLOAD_ERRORS = {
    FILE_MISSING: {
        httpCode: 400, code: 'LIC_FILE_001',
        message: 'Không tìm thấy file tải lên. Vui lòng chọn file PDF, JPG hoặc PNG.',
    },
    INVALID_FORMAT: {
        httpCode: 400, code: 'LIC_FILE_002',
        message: 'Định dạng file không hợp lệ. Chỉ chấp nhận PDF, JPG, PNG.',
    },
    FILE_TOO_LARGE: {
        httpCode: 400, code: 'LIC_FILE_003',
        message: `File vượt quá giới hạn ${10}MB.`,
    },
    UPLOAD_FAILED: {
        httpCode: 500, code: 'LIC_FILE_004',
        message: 'Không thể tải file lên hệ thống lưu trữ.',
    },
    NO_FILE_ATTACHED: {
        httpCode: 404, code: 'LIC_FILE_005',
        message: 'Giấy phép này chưa có file đính kèm.',
    },
} as const;

// WORKING HOURS & SLOT CONFIG

/** Keys cố định dùng trong bảng system_settings cho slot config */
export const SLOT_CONFIG_KEYS = {
    DURATION_MINUTES: 'SLOT_DURATION_MINUTES',
    MAX_PATIENTS: 'SLOT_MAX_PATIENTS',
} as const;

/** Giá trị mặc định khi chưa có cấu hình slot trong DB */
export const DEFAULT_SLOT_CONFIG = {
    duration_minutes: 15,
    max_patients_per_slot: 1,
} as const;

/** Nhãn tiếng Việt cho từng ngày trong tuần */
export const DAY_OF_WEEK_LABELS: Record<number, string> = {
    0: 'Chủ nhật',
    1: 'Thứ 2',
    2: 'Thứ 3',
    3: 'Thứ 4',
    4: 'Thứ 5',
    5: 'Thứ 6',
    6: 'Thứ 7',
};

export const WORKING_HOURS_ERRORS = {
    INVALID_TIME_RANGE: {
        httpCode: 400,
        code: 'SYS_WH_001',
        message: 'Giờ đóng cửa phải sau giờ mở cửa.',
    },
    INVALID_DAY_OF_WEEK: {
        httpCode: 400,
        code: 'SYS_WH_002',
        message: 'day_of_week phải là số nguyên từ 0 (Chủ nhật) đến 6 (Thứ 7).',
    },
    INVALID_SLOT_DURATION: {
        httpCode: 400,
        code: 'SYS_WH_003',
        message: 'Thời lượng slot phải là bội số của 5 và nằm trong khoảng 5–120 phút.',
    },
    INVALID_MAX_PATIENTS: {
        httpCode: 400,
        code: 'SYS_WH_004',
        message: 'Số bệnh nhân tối đa mỗi slot phải từ 1 đến 20.',
    },
} as const;

// BUSINESS RULES

/** Key chuẩn cho 8 business rules được quản lý qua API */
export const BUSINESS_RULE_KEYS = {
    CANCEL_APPOINTMENT_BEFORE_HOURS: 'CANCEL_APPOINTMENT_BEFORE_HOURS',
    MAX_BOOKING_PER_DAY_PER_PATIENT: 'MAX_BOOKING_PER_DAY_PER_PATIENT',
    MAX_ADVANCE_BOOKING_DAYS: 'MAX_ADVANCE_BOOKING_DAYS',
    MAX_APPOINTMENTS_PER_DOCTOR_PER_DAY: 'MAX_APPOINTMENTS_PER_DOCTOR_PER_DAY',
    ALLOW_PATIENT_SELF_CANCEL: 'ALLOW_PATIENT_SELF_CANCEL',
    MAX_LOGIN_ATTEMPTS: 'MAX_LOGIN_ATTEMPTS',
    LOCK_ACCOUNT_DURATION_MINUTES: 'LOCK_ACCOUNT_DURATION_MINUTES',
    REQUIRE_EMAIL_VERIFICATION: 'REQUIRE_EMAIL_VERIFICATION',
} as const;

/** Schema validation cho từng rule: type + range cho phép */
export const BUSINESS_RULE_SCHEMAS: Record<string, {
    type: 'number' | 'boolean';
    min?: number;
    max?: number;
}> = {
    CANCEL_APPOINTMENT_BEFORE_HOURS: { type: 'number', min: 1, max: 168 },
    MAX_BOOKING_PER_DAY_PER_PATIENT: { type: 'number', min: 1, max: 10 },
    MAX_ADVANCE_BOOKING_DAYS: { type: 'number', min: 1, max: 365 },
    MAX_APPOINTMENTS_PER_DOCTOR_PER_DAY: { type: 'number', min: 1, max: 100 },
    ALLOW_PATIENT_SELF_CANCEL: { type: 'boolean' },
    MAX_LOGIN_ATTEMPTS: { type: 'number', min: 3, max: 20 },
    LOCK_ACCOUNT_DURATION_MINUTES: { type: 'number', min: 5, max: 1440 },
    REQUIRE_EMAIL_VERIFICATION: { type: 'boolean' },
};

export const BUSINESS_RULE_ERRORS = {
    RULE_NOT_FOUND: {
        httpCode: 404,
        code: 'SYS_BR_001',
        message: 'Quy định nghiệp vụ không tồn tại.',
    },
    INVALID_RULE_VALUE: {
        httpCode: 400,
        code: 'SYS_BR_002',
        message: 'Giá trị quy định không hợp lệ (sai type hoặc vượt ngoài giới hạn cho phép).',
    },
    INVALID_RULE_KEY: {
        httpCode: 400,
        code: 'SYS_BR_003',
        message: 'Khóa quy định không tồn tại hoặc không được phép chỉnh sửa qua API.',
    },
} as const;

// SECURITY SETTINGS
/** Tất cả keys bảo mật – gồm 3 reuse từ 1.4.3 + 5 mới */
export const SECURITY_SETTING_KEYS = {
    MAX_LOGIN_ATTEMPTS: 'MAX_LOGIN_ATTEMPTS',
    LOCK_ACCOUNT_DURATION_MINUTES: 'LOCK_ACCOUNT_DURATION_MINUTES',
    REQUIRE_EMAIL_VERIFICATION: 'REQUIRE_EMAIL_VERIFICATION',
    PASSWORD_MIN_LENGTH: 'PASSWORD_MIN_LENGTH',
    SESSION_DURATION_DAYS: 'SESSION_DURATION_DAYS',
    REQUIRE_2FA_ROLES: 'REQUIRE_2FA_ROLES',
    ACCESS_TOKEN_EXPIRY_MINUTES: 'ACCESS_TOKEN_EXPIRY_MINUTES',
    REFRESH_TOKEN_EXPIRY_DAYS: 'REFRESH_TOKEN_EXPIRY_DAYS',
} as const;

/** Fallback mặc định khi key chưa có trong DB */
export const DEFAULT_SECURITY_CONFIG = {
    max_login_attempts: 7,
    lock_duration_minutes: 30,
    require_email_verification: true,
    password_min_length: 8,
    session_duration_days: 14,
    require_2fa_roles: [] as string[],
    access_token_expiry_minutes: 15,
    refresh_token_expiry_days: 14,
} as const;

export const SECURITY_SETTING_ERRORS = {
    INVALID_PASSWORD_LENGTH: {
        httpCode: 400,
        code: 'SYS_SEC_001',
        message: 'Độ dài mật khẩu tối thiểu phải từ 8–32 ký tự.',
    },
    INVALID_SESSION_DURATION: {
        httpCode: 400,
        code: 'SYS_SEC_002',
        message: 'Thời hạn phiên đăng nhập phải từ 1–365 ngày.',
    },
    INVALID_TOKEN_EXPIRY: {
        httpCode: 400,
        code: 'SYS_SEC_003',
        message: 'Thời hạn token phải từ 5–1440 phút (access) hoặc 1–365 ngày (refresh).',
    },
} as const;

// CẤU HÌNH ĐA NGÔN NGỮ 

export const I18N_SETTING_KEYS = {
    DEFAULT_LANGUAGE: 'DEFAULT_LANGUAGE',
    SUPPORTED_LANGUAGES: 'SUPPORTED_LANGUAGES',
} as const;

/** Danh sách ngôn ngữ tĩnh hệ thống hỗ trợ */
export const AVAILABLE_LANGUAGES = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
] as const;

/** Tập hợp mã ngôn ngữ hợp lệ để validate nhanh */
export const VALID_LANGUAGE_CODES = new Set(AVAILABLE_LANGUAGES.map(l => l.code));

export const I18N_ERRORS = {
    INVALID_LANGUAGE_CODE: {
        httpCode: 400,
        code: 'SYS_I18N_001',
        message: 'Mã ngôn ngữ không hợp lệ hoặc chưa được hỗ trợ.',
    },
    DEFAULT_LANG_NOT_IN_SUPPORTED: {
        httpCode: 400,
        code: 'SYS_I18N_002',
        message: 'Ngôn ngữ mặc định phải nằm trong danh sách ngôn ngữ hỗ trợ.',
    },
    MIN_ONE_LANGUAGE: {
        httpCode: 400,
        code: 'SYS_I18N_003',
        message: 'Hệ thống phải hỗ trợ ít nhất 1 ngôn ngữ.',
    },
} as const;

// UI SETTINGS

// UI setting keys
export const UI_SETTING_KEYS = {
    THEME: 'UI_THEME',
    PRIMARY_COLOR: 'UI_PRIMARY_COLOR',
    FONT_FAMILY: 'UI_FONT_FAMILY',
    DATE_FORMAT: 'UI_DATE_FORMAT',
    TIMEZONE: 'UI_TIMEZONE',
    TIME_FORMAT: 'UI_TIME_FORMAT',
} as const;

export const ALLOWED_THEMES = ['light', 'dark', 'system'] as const;
export const ALLOWED_FONTS = ['Inter', 'Roboto', 'Open Sans', 'Noto Sans'] as const;
export const ALLOWED_DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const;
export const ALLOWED_TIME_FORMATS = ['12h', '24h'] as const;
export const ALLOWED_TIMEZONES = [
    'Asia/Ho_Chi_Minh', 'Asia/Bangkok', 'Asia/Singapore', 'Asia/Tokyo',
    'Asia/Seoul', 'Asia/Shanghai', 'Asia/Kolkata', 'Asia/Dubai',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Sao_Paulo', 'Africa/Cairo', 'Australia/Sydney', 'Pacific/Auckland',
] as const;

/** Regex kiểm tra màu hex 6 ký tự (#RRGGBB) */
export const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export const DEFAULT_UI_SETTINGS = {
    theme: 'light',
    primary_color: '#1677FF',
    font_family: 'Inter',
    date_format: 'DD/MM/YYYY',
    timezone: 'Asia/Ho_Chi_Minh',
    time_format: '24h',
} as const;

export const UI_ERRORS = {
    INVALID_THEME: {
        httpCode: 400, code: 'SYS_UI_001',
        message: 'Chủ đề không hợp lệ. Giá trị cho phép: light, dark, system.',
    },
    INVALID_COLOR: {
        httpCode: 400, code: 'SYS_UI_002',
        message: 'Màu sắc phải đúng định dạng hex 6 ký tự (ví dụ: #2563EB).',
    },
    INVALID_FONT: {
        httpCode: 400, code: 'SYS_UI_003',
        message: 'Font chữ không hợp lệ. Giá trị cho phép: Inter, Roboto, Open Sans, Noto Sans.',
    },
    INVALID_DATE_FORMAT: {
        httpCode: 400, code: 'SYS_UI_004',
        message: 'Định dạng ngày không hợp lệ. Giá trị cho phép: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD.',
    },
    INVALID_TIMEZONE: {
        httpCode: 400, code: 'SYS_UI_005',
        message: 'Múi giờ không hợp lệ hoặc chưa được hỗ trợ.',
    },
    INVALID_TIME_FORMAT: {
        httpCode: 400, code: 'SYS_UI_006',
        message: 'Định dạng giờ không hợp lệ. Giá trị cho phép: 12h, 24h.',
    },
} as const;

// SYSTEM PARAMS 

export const SYSTEM_SETTINGS_MODULE_NAMES = [
    'GENERAL', 'APPOINTMENT', 'SECURITY', 'I18N', 'UI', 'WORKING_HOURS',
] as const;

/**
 * Tập hợp các setting key được seed bởi hệ thống (1.4.1–1.4.6).
 * Những key này KHÔNG được phép xóa qua API.
 */
export const PROTECTED_SETTING_KEYS = new Set([
    // Working Hours / Slot (1.4.2)
    'SLOT_DURATION_MINUTES', 'MAX_PATIENTS_PER_SLOT',
    // Business Rules (1.4.3)
    'CANCEL_APPOINTMENT_BEFORE_HOURS', 'MAX_BOOKING_PER_DAY_PER_PATIENT',
    'MAX_ADVANCE_BOOKING_DAYS', 'MAX_APPOINTMENTS_PER_DOCTOR_PER_DAY',
    'ALLOW_PATIENT_SELF_CANCEL',
    // Security (1.4.4)
    'MAX_LOGIN_ATTEMPTS', 'LOCK_ACCOUNT_DURATION_MINUTES',
    'REQUIRE_EMAIL_VERIFICATION', 'PASSWORD_MIN_LENGTH',
    'SESSION_DURATION_DAYS', 'REQUIRE_2FA_ROLES',
    'ACCESS_TOKEN_EXPIRY_MINUTES', 'REFRESH_TOKEN_EXPIRY_DAYS',
    // I18N (1.4.5)
    'DEFAULT_LANGUAGE', 'SUPPORTED_LANGUAGES',
    // UI (1.4.6)
    'UI_THEME', 'UI_PRIMARY_COLOR', 'UI_FONT_FAMILY',
    'UI_DATE_FORMAT', 'UI_TIMEZONE', 'UI_TIME_FORMAT',
    // Reminder (3.6)
    'REMINDER_BEFORE_HOURS', 'AUTO_REMINDER_ENABLED', 'REMINDER_CRON_INTERVAL',
]);

export const SYSTEM_SETTINGS_ERRORS = {
    KEY_EXISTS: {
        httpCode: 409, code: 'SYS_SET_001',
        message: 'Setting key đã tồn tại trong hệ thống.',
    },
    KEY_NOT_FOUND: {
        httpCode: 404, code: 'SYS_SET_002',
        message: 'Setting key không tồn tại.',
    },
    PROTECTED_KEY: {
        httpCode: 403, code: 'SYS_SET_003',
        message: 'Setting này là tham số hệ thống cốt lõi, không thể xóa.',
    },
    INVALID_VALUE: {
        httpCode: 400, code: 'SYS_SET_004',
        message: 'setting_value phải là JSON object hợp lệ.',
    },
} as const;

// CONFIG PERMISSIONS

export const CONFIG_PERMISSION_ERRORS = {
    ADMIN_MUST_HAVE_SECURITY: {
        httpCode: 400, code: 'SYS_CFG_001',
        message: 'ADMIN phải giữ quyền chỉnh sửa module SECURITY để tránh mất quyền kiểm soát.',
    },
    INVALID_ROLE: {
        httpCode: 400, code: 'SYS_CFG_002',
        message: 'Role code không hợp lệ hoặc không tồn tại trong hệ thống.',
    },
    INVALID_MODULE: {
        httpCode: 400, code: 'SYS_CFG_003',
        message: 'Tên module không hợp lệ. Giá trị cho phép: GENERAL, APPOINTMENT, SECURITY, I18N, UI, WORKING_HOURS.',
    },
} as const;




