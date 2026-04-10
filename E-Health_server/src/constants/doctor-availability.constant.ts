/** Thông báo lỗi Doctor Availability */
export const DOCTOR_AVAILABILITY_ERRORS = {
    DOCTOR_NOT_FOUND: 'Bác sĩ không tồn tại hoặc đã bị vô hiệu hoá.',
    MISSING_DATE_RANGE: 'Vui lòng cung cấp start_date và end_date.',
    MISSING_DATE: 'Vui lòng cung cấp ngày cần kiểm tra.',
    MISSING_SHIFT_ID: 'Vui lòng cung cấp shift_id.',
    SPECIALTY_NOT_FOUND: 'Chuyên khoa không tồn tại.',
    INVALID_DATE_FORMAT: 'Định dạng ngày không hợp lệ (YYYY-MM-DD).',
} as const;

/** Thông báo thành công */
export const DOCTOR_AVAILABILITY_SUCCESS = {
    SCHEDULE_FETCHED: 'Lấy lịch làm việc bác sĩ thành công.',
    CONFLICT_CHECKED: 'Kiểm tra xung đột lịch thành công.',
    BY_SPECIALTY_FETCHED: 'Lấy danh sách bác sĩ theo chuyên khoa thành công.',
    BY_DATE_FETCHED: 'Lấy tổng quan lịch bác sĩ theo ngày thành công.',
    FACILITIES_FETCHED: 'Lấy lịch đa cơ sở của bác sĩ thành công.',
} as const;
