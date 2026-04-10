
/** Loại thay đổi */
export const CHANGE_TYPE = {
    RESCHEDULE: 'RESCHEDULE',
    CANCEL: 'CANCEL',
} as const;

/** Kết quả kiểm tra chính sách */
export const POLICY_RESULT = {
    ALLOWED: 'ALLOWED',
    LATE_CANCEL: 'LATE_CANCEL',
    BLOCKED: 'BLOCKED',
} as const;

/** Trạng thái cho phép hủy */
export const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED', 'CHECKED_IN'] as const;

/** Trạng thái cho phép dời */
export const RESCHEDULABLE_STATUSES = ['PENDING', 'CONFIRMED'] as const;

/** Thông báo lỗi */
export const CHANGE_ERRORS = {
    APPOINTMENT_NOT_FOUND: 'Lịch khám không tồn tại hoặc đã bị xoá',
    ALREADY_CANCELLED: 'Lịch khám này đã bị huỷ trước đó',
    CANNOT_CANCEL_COMPLETED: 'Không thể huỷ lịch khám đã hoàn tất (COMPLETED)',
    CANNOT_CANCEL_NO_SHOW: 'Không thể huỷ lịch khám đã đánh dấu No-Show',
    CANNOT_CANCEL_IN_PROGRESS: 'Không thể huỷ lịch khám đang được khám (IN_PROGRESS)',
    CANCEL_POLICY_BLOCKED: 'Đã quá thời hạn hủy lịch. Vui lòng liên hệ phòng khám hoặc yêu cầu Admin hủy',
    RESCHEDULE_NOT_ALLOWED: 'Chỉ lịch khám ở trạng thái PENDING hoặc CONFIRMED mới được dời lịch',
    MISSING_RESCHEDULE_REASON: 'Vui lòng cung cấp lý do dời lịch (reschedule_reason)',
    NO_CHANGE_HISTORY: 'Không tìm thấy lịch sử thay đổi cho lịch khám này',
    INVALID_DATE_RANGE: 'Khoảng thời gian không hợp lệ (from_date phải trước to_date)',
} as const;

/** Thông báo thành công */
export const CHANGE_SUCCESS = {
    HISTORY_FETCHED: 'Lấy lịch sử thay đổi thành công',
    STATS_FETCHED: 'Lấy thống kê dời/hủy thành công',
    POLICY_CHECKED: 'Kiểm tra chính sách hủy hoàn tất',
    RECENT_FETCHED: 'Lấy danh sách thay đổi gần đây thành công',
    CAN_RESCHEDULE_CHECKED: 'Kiểm tra khả năng dời lịch hoàn tất',
} as const;
