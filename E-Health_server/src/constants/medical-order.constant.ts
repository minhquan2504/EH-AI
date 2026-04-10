/**
 * Hằng số cho module Chỉ định dịch vụ y tế (Medical Orders 4.4)
 */

/** Loại chỉ định */
export const ORDER_TYPE = {
    LABORATORY: 'LABORATORY',
    RADIOLOGY: 'RADIOLOGY',
    PROCEDURE: 'PROCEDURE',
    ADMISSION: 'ADMISSION',
    OTHER: 'OTHER',
} as const;

export const VALID_ORDER_TYPES = Object.values(ORDER_TYPE);

/** Trạng thái chỉ định */
export const ORDER_STATUS = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
} as const;

/** Mức ưu tiên */
export const ORDER_PRIORITY = {
    ROUTINE: 'ROUTINE',
    URGENT: 'URGENT',
} as const;

export const VALID_PRIORITIES = Object.values(ORDER_PRIORITY);

/** Chuyển trạng thái hợp lệ */
export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
    [ORDER_STATUS.PENDING]: [ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.IN_PROGRESS]: [ORDER_STATUS.COMPLETED],
};

/** Trạng thái encounter cho phép tạo/hủy chỉ định */
export const ORDER_EDITABLE_ENCOUNTER_STATUSES = ['IN_PROGRESS', 'WAITING_FOR_RESULTS'] as const;

/** Config phân trang */
export const ORDER_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    SERVICE_SEARCH_LIMIT: 30,
} as const;

/** Thông báo lỗi */
export const ORDER_ERRORS = {
    NOT_FOUND: 'Không tìm thấy chỉ định',
    ENCOUNTER_NOT_FOUND: 'Không tìm thấy hồ sơ khám',
    ENCOUNTER_NOT_EDITABLE: 'Hồ sơ khám không ở trạng thái cho phép tạo/sửa chỉ định',
    SERVICE_NOT_FOUND: 'Dịch vụ không tồn tại hoặc đã ngừng hoạt động',
    MISSING_SERVICE_CODE: 'Thiếu mã dịch vụ (service_code)',
    MISSING_ORDER_TYPE: 'Thiếu loại chỉ định (order_type)',
    INVALID_ORDER_TYPE: 'Loại chỉ định không hợp lệ',
    INVALID_PRIORITY: 'Mức ưu tiên không hợp lệ',
    INVALID_STATUS_TRANSITION: 'Chuyển trạng thái chỉ định không hợp lệ',
    CANNOT_CANCEL: 'Chỉ có thể hủy chỉ định ở trạng thái PENDING',
    CANNOT_START: 'Chỉ có thể bắt đầu chỉ định ở trạng thái PENDING',
    CANNOT_ADD_RESULT: 'Chỉ có thể ghi kết quả khi chỉ định đang IN_PROGRESS',
    RESULT_ALREADY_EXISTS: 'Chỉ định này đã có kết quả',
    RESULT_NOT_FOUND: 'Không tìm thấy kết quả cho chỉ định này',
    MISSING_RESULT_SUMMARY: 'Thiếu tóm tắt kết quả (result_summary)',
    MISSING_CANCEL_REASON: 'Thiếu lý do hủy chỉ định',
    PATIENT_NOT_FOUND: 'Bệnh nhân không tồn tại',
} as const;

/** Thông báo thành công */
export const ORDER_SUCCESS = {
    CREATED: 'Tạo chỉ định CLS thành công',
    LIST_FETCHED: 'Lấy danh sách chỉ định thành công',
    DETAIL_FETCHED: 'Lấy chi tiết chỉ định thành công',
    UPDATED: 'Cập nhật chỉ định thành công',
    CANCELLED: 'Hủy chỉ định thành công',
    STARTED: 'Bắt đầu thực hiện chỉ định thành công',
    RESULT_CREATED: 'Ghi kết quả CLS thành công',
    RESULT_UPDATED: 'Cập nhật kết quả CLS thành công',
    HISTORY_FETCHED: 'Lấy lịch sử chỉ định thành công',
    PENDING_FETCHED: 'Lấy danh sách chỉ định chờ thành công',
    SERVICES_FETCHED: 'Tìm kiếm dịch vụ thành công',
    SUMMARY_FETCHED: 'Lấy tóm tắt chỉ định thành công',
} as const;
