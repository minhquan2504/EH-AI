
/** Trạng thái encounter (State Machine) */
export const ENCOUNTER_STATUS = {
    IN_PROGRESS: 'IN_PROGRESS',
    WAITING_FOR_RESULTS: 'WAITING_FOR_RESULTS',
    COMPLETED: 'COMPLETED',
    CLOSED: 'CLOSED',
} as const;

/** Loại encounter */
export const ENCOUNTER_TYPE = {
    FIRST_VISIT: 'FIRST_VISIT',
    FOLLOW_UP: 'FOLLOW_UP',
    OUTPATIENT: 'OUTPATIENT',
    INPATIENT: 'INPATIENT',
    EMERGENCY: 'EMERGENCY',
    TELEMED: 'TELEMED',
} as const;

/** Chuyển trạng thái hợp lệ */
export const ENCOUNTER_STATUS_TRANSITIONS: Record<string, string[]> = {
    IN_PROGRESS: ['WAITING_FOR_RESULTS', 'COMPLETED'],
    WAITING_FOR_RESULTS: ['IN_PROGRESS', 'COMPLETED'],
    COMPLETED: ['CLOSED'],
    CLOSED: [],
} as const;

/** Trạng thái cho phép cập nhật nội dung encounter */
export const ENCOUNTER_EDITABLE_STATUSES = [
    ENCOUNTER_STATUS.IN_PROGRESS,
    ENCOUNTER_STATUS.WAITING_FOR_RESULTS,
] as const;

/** Trạng thái encounter đang hoạt động */
export const ENCOUNTER_ACTIVE_STATUSES = [
    ENCOUNTER_STATUS.IN_PROGRESS,
    ENCOUNTER_STATUS.WAITING_FOR_RESULTS,
] as const;

/** Cấu hình phân trang */
export const ENCOUNTER_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;

/** Thông báo lỗi */
export const ENCOUNTER_ERRORS = {
    NOT_FOUND: 'Lượt khám không tồn tại hoặc đã bị xóa',
    ALREADY_EXISTS_FOR_APPOINTMENT: 'Lịch khám này đã có hồ sơ lượt khám. Mỗi lịch khám chỉ được mở 1 hồ sơ khám.',
    APPOINTMENT_NOT_FOUND: 'Lịch khám không tồn tại hoặc đã bị hủy',
    APPOINTMENT_NOT_CHECKED_IN: 'Lịch khám chưa check-in (trạng thái phải là CHECKED_IN)',
    APPOINTMENT_PATIENT_MISMATCH: 'Bệnh nhân trên lịch khám không khớp với bệnh nhân được chỉ định',
    PATIENT_NOT_FOUND: 'Bệnh nhân không tồn tại trong hệ thống',
    DOCTOR_NOT_FOUND: 'Bác sĩ không tồn tại hoặc không còn hoạt động',
    DOCTOR_NOT_ACTIVE: 'Bác sĩ này hiện không hoạt động',
    ROOM_NOT_FOUND: 'Phòng khám không tồn tại',
    ROOM_MAINTENANCE: 'Phòng khám đang bảo trì, không thể sử dụng',
    MISSING_REQUIRED_FIELDS: 'Thiếu thông tin bắt buộc: patient_id, doctor_id, room_id',
    MISSING_PATIENT_ID: 'Thiếu thông tin bệnh nhân (patient_id)',
    MISSING_DOCTOR_ID: 'Thiếu thông tin bác sĩ (doctor_id)',
    MISSING_ROOM_ID: 'Thiếu thông tin phòng khám (room_id)',
    MISSING_STATUS: 'Thiếu trạng thái mới (new_status)',
    INVALID_STATUS_TRANSITION: 'Không thể chuyển trạng thái theo luồng này',
    ENCOUNTER_CLOSED: 'Hồ sơ khám đã đóng, không thể chỉnh sửa',
    ENCOUNTER_NOT_EDITABLE: 'Chỉ được chỉnh sửa hồ sơ khám ở trạng thái IN_PROGRESS hoặc WAITING_FOR_RESULTS',
    PATIENT_HAS_ACTIVE_ENCOUNTER: 'Bệnh nhân đang có lượt khám chưa hoàn tất (IN_PROGRESS hoặc WAITING_FOR_RESULTS). Vui lòng hoàn tất hoặc đóng lượt khám trước đó.',
} as const;

/** Thông báo thành công */
export const ENCOUNTER_SUCCESS = {
    CREATED: 'Mở hồ sơ lượt khám thành công',
    CREATED_FROM_APPOINTMENT: 'Mở hồ sơ lượt khám từ lịch khám thành công',
    UPDATED: 'Cập nhật hồ sơ lượt khám thành công',
    DOCTOR_ASSIGNED: 'Đổi bác sĩ phụ trách thành công',
    ROOM_ASSIGNED: 'Đổi phòng khám thành công',
    STATUS_CHANGED: 'Chuyển trạng thái lượt khám thành công',
    LIST_FETCHED: 'Lấy danh sách lượt khám thành công',
    DETAIL_FETCHED: 'Lấy chi tiết lượt khám thành công',
    HISTORY_FETCHED: 'Lấy lịch sử thay đổi trạng thái thành công',
    PATIENT_ENCOUNTERS_FETCHED: 'Lấy danh sách lượt khám của bệnh nhân thành công',
    APPOINTMENT_ENCOUNTER_FETCHED: 'Lấy hồ sơ khám từ lịch khám thành công',
    ACTIVE_FETCHED: 'Lấy danh sách lượt khám đang diễn ra thành công',
} as const;
