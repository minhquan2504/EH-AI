export const ROOM_MAINTENANCE_ERRORS = {
    ROOM_NOT_FOUND: 'Phòng không tồn tại hoặc đã bị xoá.',
    MAINTENANCE_NOT_FOUND: 'Lịch bảo trì không tồn tại hoặc đã bị huỷ.',
    MISSING_DATES: 'Vui lòng cung cấp start_date và end_date.',
    INVALID_DATE_RANGE: 'end_date phải lớn hơn hoặc bằng start_date.',
    INVALID_DATE_FORMAT: 'Định dạng ngày không hợp lệ (YYYY-MM-DD).',
    DATE_IN_PAST: 'Không thể tạo lịch bảo trì cho ngày đã qua.',
    OVERLAP_EXISTS: 'Phòng này đã có lịch bảo trì trùng khoảng thời gian.',
} as const;

export const ROOM_MAINTENANCE_SUCCESS = {
    CREATED: 'Tạo lịch bảo trì phòng thành công.',
    LIST_FETCHED: 'Lấy danh sách lịch bảo trì thành công.',
    DELETED: 'Huỷ lịch bảo trì thành công.',
    ACTIVE_FETCHED: 'Lấy danh sách phòng đang/sắp bảo trì thành công.',
} as const;
