/**
 * Hằng số cho Module 3.9 — Điều phối & tối ưu lịch khám
 */

/** Mức ưu tiên lịch khám */
export const PRIORITY_LEVELS = {
    NORMAL: 'NORMAL',
    URGENT: 'URGENT',
    EMERGENCY: 'EMERGENCY',
} as const;

/** Loại thao tác điều phối */
export const COORDINATION_ACTIONS = {
    REASSIGN_DOCTOR: 'REASSIGN_DOCTOR',
    SET_PRIORITY: 'SET_PRIORITY',
    AUTO_ASSIGN: 'AUTO_ASSIGN',
} as const;

/** Trạng thái cho phép reassign BS */
export const REASSIGNABLE_STATUSES = ['PENDING', 'CONFIRMED'] as const;

/** Điểm scoring cho gợi ý slot */
export const SLOT_SCORING = {
    EMPTY_SLOT: 10,           // Slot trống hoàn toàn
    LOW_LOAD: 5,              // Slot <50% capacity
    LEAST_LOADED_DOCTOR: 3,   // BS ít tải nhất
    URGENT_EARLY_BONUS: 5,    // Ưu tiên slot sớm (URGENT)
    EMERGENCY_FIRST: 20,      // Slot đầu tiên (EMERGENCY)
} as const;

/** Thông báo lỗi */
export const COORDINATION_ERRORS = {
    APPOINTMENT_NOT_FOUND: 'Lịch khám không tồn tại hoặc đã bị xoá',
    INVALID_PRIORITY: 'Mức ưu tiên không hợp lệ. Chấp nhận: NORMAL, URGENT, EMERGENCY',
    CANNOT_REASSIGN_STATUS: 'Chỉ lịch khám ở trạng thái PENDING hoặc CONFIRMED mới được chuyển bác sĩ',
    DOCTOR_NOT_FOUND: 'Bác sĩ mới không tồn tại hoặc không còn hoạt động',
    DOCTOR_NOT_AVAILABLE: 'Bác sĩ mới không có lịch làm việc vào ngày/ca này',
    DOCTOR_CONFLICT: 'Bác sĩ mới đã có lịch khám khác trong cùng khung giờ',
    MISSING_DOCTOR_ID: 'Thiếu thông tin bác sĩ mới (new_doctor_id)',
    MISSING_DATE: 'Thiếu thông tin ngày (date)',
    MISSING_DATE_RANGE: 'Thiếu khoảng thời gian (from_date, to_date)',
    INVALID_DATE_RANGE: 'Khoảng thời gian không hợp lệ (from_date phải trước to_date)',
    NO_UNASSIGNED_FOUND: 'Không có lịch khám nào chưa được gán bác sĩ trong ngày này',
    NO_DOCTORS_AVAILABLE: 'Không có bác sĩ khả dụng để phân bổ',
    SAME_DOCTOR: 'Bác sĩ mới trùng với bác sĩ hiện tại',
} as const;

/** Thông báo thành công */
export const COORDINATION_SUCCESS = {
    DOCTOR_LOAD_FETCHED: 'Lấy thông tin tải bác sĩ thành công',
    SLOTS_SUGGESTED: 'Gợi ý khung giờ phù hợp thành công',
    BALANCE_FETCHED: 'Lấy dashboard cân bằng tải thành công',
    PRIORITY_SET: 'Cập nhật mức ưu tiên thành công',
    DOCTOR_REASSIGNED: 'Chuyển bác sĩ điều phối thành công',
    AUTO_ASSIGNED: 'Tự động phân bổ bác sĩ hoàn tất',
    AI_DATASET_FETCHED: 'Xuất dữ liệu AI/ML thành công',
} as const;
