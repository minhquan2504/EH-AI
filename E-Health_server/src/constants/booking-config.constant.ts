/**
 * Hằng số và mã lỗi cho Module 2.12 – Cấu hình Quy tắc đặt khám.
 * Chứa mapping key giữa Branch Config và Global System Settings.
 */

/** Giá trị mặc định khi cả Branch lẫn Global đều chưa có cấu hình */
export const DEFAULT_BOOKING_CONFIG = {
    MAX_PATIENTS_PER_SLOT: 1,
    BUFFER_DURATION: 0,
    ADVANCE_BOOKING_DAYS: 30,
    MINIMUM_BOOKING_HOURS: 2,
    CANCELLATION_ALLOWED_HOURS: 12,
} as const;

/**
 * Mapping giữa field trong bảng booking_configurations
 */
export const GLOBAL_FALLBACK_KEYS: Record<string, string> = {
    max_patients_per_slot: 'SLOT_MAX_PATIENTS',
    advance_booking_days: 'MAX_ADVANCE_BOOKING_DAYS',
    cancellation_allowed_hours: 'CANCEL_APPOINTMENT_BEFORE_HOURS',
};

/** Giới hạn validate cho từng field */
export const BOOKING_CONFIG_LIMITS = {
    MAX_PATIENTS_PER_SLOT: { min: 1, max: 50 },
    BUFFER_DURATION: { min: 0, max: 60 },
    ADVANCE_BOOKING_DAYS: { min: 1, max: 365 },
    MINIMUM_BOOKING_HOURS: { min: 0, max: 72 },
    CANCELLATION_ALLOWED_HOURS: { min: 0, max: 168 },
} as const;

/** Mã lỗi HTTP */
export const BOOKING_CONFIG_ERRORS = {
    BRANCH_NOT_FOUND: {
        httpCode: 404,
        code: 'BKCFG_001',
        message: 'Chi nhánh không tồn tại hoặc đã bị xóa.',
    },
    CONFIG_NOT_FOUND: {
        httpCode: 404,
        code: 'BKCFG_002',
        message: 'Chưa có cấu hình riêng cho chi nhánh này.',
    },
    INVALID_MAX_PATIENTS: {
        httpCode: 400,
        code: 'BKCFG_003',
        message: `Số bệnh nhân tối đa mỗi slot phải từ 1 đến 50.`,
    },
    INVALID_BUFFER_DURATION: {
        httpCode: 400,
        code: 'BKCFG_004',
        message: 'Thời gian đệm phải từ 0 đến 60 phút.',
    },
    INVALID_ADVANCE_DAYS: {
        httpCode: 400,
        code: 'BKCFG_005',
        message: 'Số ngày đặt trước phải từ 1 đến 365.',
    },
    INVALID_MIN_BOOKING_HOURS: {
        httpCode: 400,
        code: 'BKCFG_006',
        message: 'Thời gian đặt lịch trước tối thiểu phải từ 0 đến 72 giờ.',
    },
    INVALID_CANCEL_HOURS: {
        httpCode: 400,
        code: 'BKCFG_007',
        message: 'Thời hạn hủy lịch phải từ 0 đến 168 giờ (7 ngày).',
    },
} as const;
