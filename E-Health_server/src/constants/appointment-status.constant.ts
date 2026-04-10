
/** Phương thức check-in */
export const CHECK_IN_METHOD = {
    COUNTER: 'COUNTER',
    QR_CODE: 'QR_CODE',
} as const;

/** Trạng thái phòng khám (room occupancy) */
export const ROOM_STATUS = {
    AVAILABLE: 'AVAILABLE',
    OCCUPIED: 'OCCUPIED',
    MAINTENANCE: 'MAINTENANCE',
} as const;

/** Keys trong bảng system_settings cho cấu hình No-Show & Check-in */
export const STATUS_SETTING_KEYS = {
    NO_SHOW_BUFFER_MINUTES: 'NO_SHOW_BUFFER_MINUTES',
    AUTO_NO_SHOW_ENABLED: 'AUTO_NO_SHOW_ENABLED',
    ALLOW_QR_CHECKIN: 'ALLOW_QR_CHECKIN',
    LATE_THRESHOLD_MINUTES: 'LATE_THRESHOLD_MINUTES',
} as const;

/** Giá trị mặc định khi chưa có cấu hình trong DB */
export const DEFAULT_STATUS_CONFIG = {
    NO_SHOW_BUFFER_MINUTES: 30,
    AUTO_NO_SHOW_ENABLED: true,
    ALLOW_QR_CHECKIN: true,
    LATE_THRESHOLD_MINUTES: 0,
} as const;

/** Template codes cho notification */
export const STATUS_TEMPLATE_CODES = {
    NO_SHOW: 'APPOINTMENT_NO_SHOW',
    START_EXAM: 'APPOINTMENT_START_EXAM',
} as const;

/** Trạng thái cho phép check-in */
export const CHECKIN_ALLOWED = ['CONFIRMED'] as const;

/** Trạng thái cho phép bắt đầu khám */
export const START_EXAM_ALLOWED = ['CHECKED_IN'] as const;

/** Trạng thái cho phép hoàn tất khám */
export const COMPLETE_EXAM_ALLOWED = ['IN_PROGRESS'] as const;

/** Trạng thái cho phép đánh No-Show (bao gồm CHECKED_IN: BN check-in rồi bỏ đi) */
export const NO_SHOW_ALLOWED = ['PENDING', 'CONFIRMED', 'CHECKED_IN'] as const;

/** Giới hạn validate */
export const STATUS_CONFIG_LIMITS = {
    NO_SHOW_BUFFER_MIN: 5,
    NO_SHOW_BUFFER_MAX: 120,
    LATE_THRESHOLD_MIN: 0,
    LATE_THRESHOLD_MAX: 60,
} as const;

/** Thông báo lỗi */
export const STATUS_ERRORS = {
    NOT_CONFIRMED: 'Chỉ lịch khám ở trạng thái CONFIRMED mới được check-in',
    NOT_CHECKED_IN: 'Chỉ lịch khám ở trạng thái CHECKED_IN mới được bắt đầu khám',
    NOT_IN_PROGRESS: 'Chỉ lịch khám ở trạng thái IN_PROGRESS mới được hoàn tất',
    NOT_TODAY: 'Chỉ có thể check-in cho lịch khám trong ngày hôm nay',
    MISSING_ROOM: 'Lịch khám chưa được gán phòng khám, không thể bắt đầu khám',
    MISSING_DOCTOR: 'Lịch khám chưa được gán bác sĩ, không thể bắt đầu khám',
    MISSING_QR_TOKEN: 'Vui lòng cung cấp mã QR (qr_token)',
    INVALID_QR_TOKEN: 'Mã QR không hợp lệ hoặc đã hết hạn',
    QR_DISABLED: 'Chức năng check-in bằng QR đang tắt',
    QR_ALREADY_GENERATED: 'Mã QR đã được tạo cho lịch khám này',
    ROOM_OCCUPIED: 'Phòng khám đang bận, vui lòng chờ',
    NO_SHOW_NOT_ALLOWED: 'Chỉ có thể đánh dấu No-Show cho lịch khám ở trạng thái PENDING, CONFIRMED hoặc CHECKED_IN',
    DOCTOR_ABSENT_WARNING: 'Cảnh báo: Bác sĩ đã đăng ký vắng mặt vào ngày/ca này',
    INVALID_BUFFER: `Số phút buffer No-Show phải từ 5 đến 120`,
    INVALID_LATE_THRESHOLD: `Ngưỡng trễ phải từ 0 đến 60 phút`,
    NOT_CHECKED_IN_FOR_SKIP: 'Chỉ có thể bỏ qua BN đang ở trạng thái CHECKED_IN',
    NOT_SKIPPED: 'Chỉ có thể gọi lại BN đang ở trạng thái SKIPPED',
} as const;

/** Thông báo thành công */
export const STATUS_SUCCESS = {
    CHECKED_IN: 'Check-in thành công',
    QR_GENERATED: 'Tạo mã QR check-in thành công',
    QR_CHECKED_IN: 'Check-in bằng QR thành công',
    EXAM_STARTED: 'Bắt đầu khám bệnh thành công',
    EXAM_COMPLETED: 'Hoàn tất khám bệnh thành công',
    NO_SHOW_MARKED: 'Đánh dấu No-Show thành công',
    DASHBOARD_FETCHED: 'Lấy dashboard trạng thái thành công',
    QUEUE_FETCHED: 'Lấy hàng đợi thành công',
    ROOM_STATUS_FETCHED: 'Lấy trạng thái phòng khám thành công',
    SETTINGS_FETCHED: 'Lấy cấu hình check-in thành công',
    SETTINGS_UPDATED: 'Cập nhật cấu hình check-in thành công',
    QUEUE_SKIPPED: 'Bỏ qua bệnh nhân trong hàng đợi thành công',
    QUEUE_RECALLED: 'Gọi lại bệnh nhân thành công, đã xếp vào cuối hàng',
} as const;
