/** Thông báo lỗi Doctor Absence */
export const DOCTOR_ABSENCE_ERRORS = {
    DOCTOR_NOT_FOUND: 'Bác sĩ không tồn tại hoặc đã bị vô hiệu hoá.',
    MISSING_DOCTOR_ID: 'Vui lòng cung cấp doctor_id.',
    MISSING_DATE: 'Vui lòng cung cấp absence_date.',
    MISSING_ABSENCE_TYPE: 'Vui lòng cung cấp absence_type.',
    INVALID_ABSENCE_TYPE: 'absence_type phải là: EMERGENCY, SICK hoặc PERSONAL.',
    INVALID_DATE_PAST: 'Không thể tạo lịch vắng cho ngày đã qua.',
    INVALID_DATE_FORMAT: 'Định dạng ngày không hợp lệ (YYYY-MM-DD).',
    ABSENCE_NOT_FOUND: 'Bản ghi vắng đột xuất không tồn tại hoặc đã bị huỷ.',
    ABSENCE_ALREADY_EXISTS: 'Bác sĩ đã được đánh dấu vắng cho ngày/ca này.',
    SHIFT_NOT_FOUND: 'Ca làm việc không tồn tại.',
} as const;

/** Thông báo thành công */
export const DOCTOR_ABSENCE_SUCCESS = {
    CREATED: 'Tạo lịch vắng đột xuất thành công.',
    LIST_FETCHED: 'Lấy danh sách vắng đột xuất thành công.',
    DELETED: 'Huỷ lịch vắng đột xuất thành công.',
    AFFECTED_FETCHED: 'Lấy danh sách lịch khám bị ảnh hưởng thành công.',
} as const;

/** Loại vắng hợp lệ */
export const ABSENCE_TYPES = ['EMERGENCY', 'SICK', 'PERSONAL'] as const;
export type AbsenceType = typeof ABSENCE_TYPES[number];
