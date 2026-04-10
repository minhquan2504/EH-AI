
/** Trạng thái đơn thuốc */
export const PRESCRIPTION_STATUS = {
    DRAFT: 'DRAFT',
    PRESCRIBED: 'PRESCRIBED',
    DISPENSED: 'DISPENSED',
    CANCELLED: 'CANCELLED',
} as const;

/** Trạng thái kế hoạch điều trị */
export const PLAN_STATUS = {
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED',
    SUSPENDED: 'SUSPENDED',
    CANCELLED: 'CANCELLED',
} as const;

/** Cấu hình phân trang */
export const MT_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;

/** Thông báo lỗi */
export const MT_ERRORS = {
    PATIENT_NOT_FOUND: 'Bệnh nhân không tồn tại hoặc đã bị xóa',
    PRESCRIPTION_NOT_FOUND: 'Đơn thuốc không tồn tại',
    PRESCRIPTION_NOT_BELONG: 'Đơn thuốc không thuộc bệnh nhân này',
    PLAN_NOT_FOUND: 'Kế hoạch điều trị không tồn tại',
    PLAN_NOT_BELONG: 'Kế hoạch điều trị không thuộc bệnh nhân này',
    DETAIL_NOT_FOUND: 'Chi tiết thuốc không tồn tại',
    ADHERENCE_DATE_REQUIRED: 'Ngày ghi nhận tuân thủ là bắt buộc',
    DETAIL_ID_REQUIRED: 'prescription_detail_id là bắt buộc',
} as const;

/** Thông báo thành công */
export const MT_SUCCESS = {
    MEDICATIONS_FETCHED: 'Lấy lịch sử đơn thuốc thành công',
    MEDICATION_DETAIL_FETCHED: 'Lấy chi tiết đơn thuốc thành công',
    CURRENT_MEDS_FETCHED: 'Lấy thuốc đang sử dụng thành công',
    TREATMENTS_FETCHED: 'Lấy lịch sử điều trị thành công',
    TREATMENT_DETAIL_FETCHED: 'Lấy chi tiết kế hoạch điều trị thành công',
    INTERACTIONS_FETCHED: 'Kiểm tra tương tác thuốc thành công',
    ADHERENCE_CREATED: 'Ghi nhận tuân thủ thành công',
    ADHERENCE_FETCHED: 'Lấy lịch sử tuân thủ thành công',
    TIMELINE_FETCHED: 'Lấy timeline thuốc & điều trị thành công',
} as const;
