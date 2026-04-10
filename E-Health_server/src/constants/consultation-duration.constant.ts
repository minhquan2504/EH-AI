/** Giới hạn validate cho thời lượng khám (phút) */
export const DURATION_LIMITS = {
    MIN_MINUTES: 5,
    MAX_MINUTES: 240,
} as const;

/** Mã lỗi */
export const DURATION_ERRORS = {
    FACILITY_NOT_FOUND: 'Cơ sở y tế không tồn tại hoặc đã bị xóa.',
    SERVICE_NOT_FOUND: 'Dịch vụ cơ sở không tồn tại.',
    SERVICE_NOT_BELONG: 'Dịch vụ không thuộc cơ sở được chỉ định.',
    INVALID_DURATION: `Thời lượng khám phải từ ${5} đến ${240} phút.`,
    MISSING_DURATION: 'Thiếu thông tin estimated_duration_minutes.',
    MISSING_UPDATES: 'Thiếu danh sách cập nhật (updates).',
    EMPTY_UPDATES: 'Danh sách cập nhật không được rỗng.',
    INVALID_UPDATE_ITEM: 'Mỗi mục cập nhật phải có facility_service_id và estimated_duration_minutes.',
} as const;

/** Thông báo thành công */
export const DURATION_SUCCESS = {
    LIST_FETCHED: 'Lấy danh sách thời lượng khám thành công.',
    UPDATED: 'Cập nhật thời lượng khám thành công.',
    BATCH_UPDATED: 'Cập nhật hàng loạt thời lượng khám thành công.',
} as const;
