//  LOẠI NHẮC LỊCH

/** Loại nhắc lịch */
export const REMINDER_TYPE = {
    AUTO: 'AUTO',
    MANUAL: 'MANUAL',
} as const;

/** Nguồn kích hoạt nhắc lịch */
export const REMINDER_TRIGGER_SOURCE = {
    CRON_JOB: 'CRON_JOB',
    STAFF_MANUAL: 'STAFF_MANUAL',
} as const;

/** Kênh gửi thông báo */
export const NOTIFICATION_CHANNEL = {
    INAPP: 'INAPP',
    EMAIL: 'EMAIL',
    PUSH: 'PUSH',
} as const;

//  CẤU HÌNH NHẮC LỊCH

/** Keys trong bảng system_settings cho cấu hình nhắc lịch */
export const REMINDER_SETTING_KEYS = {
    REMINDER_BEFORE_HOURS: 'REMINDER_BEFORE_HOURS',
    AUTO_REMINDER_ENABLED: 'AUTO_REMINDER_ENABLED',
    REMINDER_CRON_INTERVAL: 'REMINDER_CRON_INTERVAL',
} as const;

/** Giá trị mặc định khi chưa có cấu hình trong DB */
export const DEFAULT_REMINDER_CONFIG = {
    REMINDER_BEFORE_HOURS: [24, 2],
    AUTO_REMINDER_ENABLED: true,
    CRON_INTERVAL: '*/15 * * * *',
} as const;

/** Giới hạn validate cho cấu hình nhắc lịch */
export const REMINDER_CONFIG_LIMITS = {
    REMINDER_HOURS_MIN: 1,
    REMINDER_HOURS_MAX: 168,
    MAX_REMINDER_MILESTONES: 5,
} as const;

//  TEMPLATE CODES

/** Mã template thông báo cho appointment */
export const APPOINTMENT_TEMPLATE_CODES = {
    CREATED: 'APPOINTMENT_CREATED',
    CONFIRMED: 'APPOINTMENT_CONFIRMED',
    CHECKED_IN: 'APPOINTMENT_CHECKED_IN',
    COMPLETED: 'APPOINTMENT_COMPLETED',
    CANCELLED: 'APPOINTMENT_CANCELLED',
    RESCHEDULED: 'APPOINTMENT_RESCHEDULED',
    REMINDER: 'APPOINTMENT_REMINDER',
} as const;

// TRẠNG THÁI CHO PHÉP 

/** Trạng thái cho phép xác nhận */
export const CONFIRMABLE_STATUSES = ['PENDING'] as const;

/** Trạng thái cho phép check-in */
export const CHECKIN_ALLOWED_STATUSES = ['CONFIRMED'] as const;

/** Trạng thái cho phép hoàn tất */
export const COMPLETE_ALLOWED_STATUSES = ['CHECKED_IN'] as const;

/** Trạng thái cho phép gửi nhắc lịch */
export const REMINDABLE_STATUSES = ['PENDING', 'CONFIRMED'] as const;

// THÔNG BÁO LỖI 

export const CONFIRMATION_ERRORS = {
    NOT_PENDING: 'Chỉ lịch khám ở trạng thái PENDING mới được xác nhận',
    NOT_CONFIRMED: 'Chỉ lịch khám ở trạng thái CONFIRMED mới được check-in',
    NOT_CHECKED_IN: 'Chỉ lịch khám ở trạng thái CHECKED_IN mới được hoàn tất',
    ALREADY_CONFIRMED: 'Lịch khám này đã được xác nhận trước đó',
    MISSING_IDS: 'Vui lòng cung cấp danh sách appointment_ids (mảng không rỗng)',
    PATIENT_NO_ACCOUNT: 'Bệnh nhân chưa có tài khoản trong hệ thống, không thể gửi thông báo',
    APPOINTMENT_NOT_ACTIVE: 'Lịch khám không ở trạng thái cho phép gửi nhắc lịch (PENDING/CONFIRMED)',
    REMINDER_ALREADY_SENT: 'Đã gửi nhắc lịch cho lịch khám này rồi',
    INVALID_REMINDER_HOURS: `Mốc nhắc lịch phải từ 1 đến 168 giờ`,
    MAX_MILESTONES_EXCEEDED: 'Tối đa 5 mốc nhắc lịch',
    INVALID_CRON_EXPRESSION: 'Biểu thức cron không hợp lệ',
    REMINDER_SETTINGS_NOT_FOUND: 'Chưa có cấu hình nhắc lịch trong hệ thống',
} as const;

//THÔNG BÁO THÀNH CÔNG

export const CONFIRMATION_SUCCESS = {
    CONFIRMED: 'Xác nhận lịch khám thành công',
    BATCH_CONFIRMED: 'Xác nhận hàng loạt hoàn tất',
    CHECKED_IN: 'Check-in lịch khám thành công',
    COMPLETED: 'Hoàn tất lịch khám thành công',
    REMINDER_SENT: 'Gửi nhắc lịch thành công',
    BATCH_REMINDER_SENT: 'Gửi nhắc lịch hàng loạt hoàn tất',
    REMINDER_HISTORY_FETCHED: 'Lấy lịch sử nhắc lịch thành công',
    REMINDER_SETTINGS_FETCHED: 'Lấy cấu hình nhắc lịch thành công',
    REMINDER_SETTINGS_UPDATED: 'Cập nhật cấu hình nhắc lịch thành công',
} as const;
