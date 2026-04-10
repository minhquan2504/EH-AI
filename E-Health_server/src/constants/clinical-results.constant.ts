
/** Loại chỉ định CLS */
export const ORDER_TYPE = {
    LAB: 'LAB',
    IMAGING: 'IMAGING',
    PROCEDURE: 'PROCEDURE',
    OTHER: 'OTHER',
} as const;

/** Trạng thái chỉ định */
export const ORDER_STATUS = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
} as const;

/** Cấu hình phân trang */
export const CR_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    TREND_MAX_RESULTS: 50,
} as const;

/** Thông báo lỗi */
export const CR_ERRORS = {
    PATIENT_NOT_FOUND: 'Bệnh nhân không tồn tại hoặc đã bị xóa',
    ORDER_NOT_FOUND: 'Chỉ định CLS không tồn tại',
    ORDER_NOT_BELONG: 'Chỉ định CLS không thuộc bệnh nhân này',
    ENCOUNTER_NOT_FOUND: 'Lượt khám không tồn tại',
    ENCOUNTER_NOT_BELONG: 'Lượt khám không thuộc bệnh nhân này',
    SERVICE_CODE_REQUIRED: 'Mã dịch vụ (service_code) là bắt buộc để xem xu hướng',
} as const;

/** Thông báo thành công */
export const CR_SUCCESS = {
    RESULTS_FETCHED: 'Lấy danh sách kết quả CLS thành công',
    RESULT_DETAIL_FETCHED: 'Lấy chi tiết kết quả CLS thành công',
    ENCOUNTER_RESULTS_FETCHED: 'Lấy kết quả CLS theo encounter thành công',
    TRENDS_FETCHED: 'Lấy xu hướng kết quả thành công',
    SUMMARY_FETCHED: 'Lấy thống kê tổng quan thành công',
    ATTACHMENTS_FETCHED: 'Lấy danh sách file đính kèm thành công',
    ABNORMAL_FETCHED: 'Lấy kết quả bất thường thành công',
} as const;
