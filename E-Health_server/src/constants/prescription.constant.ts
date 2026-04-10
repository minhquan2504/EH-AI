/** Trạng thái đơn thuốc */
export const PRESCRIPTION_STATUS = {
    DRAFT: 'DRAFT',
    PRESCRIBED: 'PRESCRIBED',
    DISPENSED: 'DISPENSED',
    CANCELLED: 'CANCELLED',
} as const;

/** Chuyển trạng thái hợp lệ */
export const PRESCRIPTION_STATUS_TRANSITIONS: Record<string, string[]> = {
    [PRESCRIPTION_STATUS.DRAFT]: [PRESCRIPTION_STATUS.PRESCRIBED, PRESCRIPTION_STATUS.CANCELLED],
    [PRESCRIPTION_STATUS.PRESCRIBED]: [PRESCRIPTION_STATUS.CANCELLED, PRESCRIPTION_STATUS.DISPENSED],
} as const;

/** Trạng thái đơn thuốc cho phép chỉnh sửa (header + detail) */
export const PRESCRIPTION_EDITABLE_STATUSES = [PRESCRIPTION_STATUS.DRAFT] as const;

/** Trạng thái encounter cho phép tạo/sửa đơn thuốc */
export const PRESCRIPTION_EDITABLE_ENCOUNTER_STATUSES = ['IN_PROGRESS', 'WAITING_FOR_RESULTS'] as const;

/** Đường dùng thuốc hợp lệ */
export const VALID_ROUTES_OF_ADMINISTRATION = [
    'ORAL',
    'INJECTION',
    'TOPICAL',
    'INHALATION',
    'SUBLINGUAL',
    'RECTAL',
    'OPHTHALMIC',
    'OTIC',
    'NASAL',
    'OTHER',
] as const;

/** Cấu hình phân trang */
export const PRESCRIPTION_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    DRUG_SEARCH_LIMIT: 30,
    MIN_DETAILS_FOR_CONFIRM: 1,
} as const;

/** Thông báo lỗi */
export const PRESCRIPTION_ERRORS = {
    NOT_FOUND: 'Không tìm thấy đơn thuốc',
    ENCOUNTER_NOT_FOUND: 'Không tìm thấy hồ sơ khám',
    ENCOUNTER_NOT_EDITABLE: 'Hồ sơ khám không ở trạng thái cho phép tạo/sửa đơn thuốc',
    ALREADY_EXISTS: 'Encounter này đã có đơn thuốc. Mỗi lượt khám chỉ được tạo 1 đơn thuốc.',
    NOT_DRAFT: 'Chỉ có thể chỉnh sửa đơn thuốc ở trạng thái DRAFT',
    DETAIL_NOT_FOUND: 'Không tìm thấy dòng thuốc trong đơn',
    DRUG_NOT_FOUND: 'Thuốc không tồn tại hoặc đã ngừng sử dụng',
    DIAGNOSIS_NOT_FOUND: 'Chẩn đoán không tồn tại hoặc không thuộc lượt khám này',
    MISSING_DRUG_ID: 'Thiếu mã thuốc (drug_id)',
    MISSING_QUANTITY: 'Thiếu số lượng (quantity)',
    INVALID_QUANTITY: 'Số lượng phải là số nguyên dương',
    MISSING_DOSAGE: 'Thiếu liều dùng (dosage)',
    MISSING_FREQUENCY: 'Thiếu tần suất dùng (frequency)',
    INVALID_DURATION: 'Số ngày dùng phải là số nguyên dương',
    INVALID_ROUTE: 'Đường dùng thuốc không hợp lệ',
    NO_DETAILS_FOR_CONFIRM: 'Đơn thuốc phải có ít nhất 1 dòng thuốc để xác nhận',
    CANNOT_CANCEL: 'Không thể hủy đơn thuốc ở trạng thái hiện tại',
    MISSING_CANCEL_REASON: 'Thiếu lý do hủy đơn thuốc (cancelled_reason) khi đơn đã xác nhận',
    PATIENT_NOT_FOUND: 'Bệnh nhân không tồn tại trong hệ thống',
    DOCTOR_NOT_FOUND: 'Bác sĩ không tồn tại trong hệ thống',
    MISSING_SEARCH_QUERY: 'Thiếu từ khóa tìm kiếm (q)',
} as const;

/** Thông báo thành công */
export const PRESCRIPTION_SUCCESS = {
    CREATED: 'Tạo đơn thuốc thành công',
    FETCHED: 'Lấy thông tin đơn thuốc thành công',
    UPDATED: 'Cập nhật đơn thuốc thành công',
    CONFIRMED: 'Xác nhận đơn thuốc thành công',
    CANCELLED: 'Hủy đơn thuốc thành công',
    HISTORY_FETCHED: 'Lấy lịch sử đơn thuốc thành công',
    DETAIL_ADDED: 'Thêm dòng thuốc thành công',
    DETAIL_UPDATED: 'Cập nhật dòng thuốc thành công',
    DETAIL_DELETED: 'Xóa dòng thuốc thành công',
    DETAILS_FETCHED: 'Lấy danh sách dòng thuốc thành công',
    DRUGS_SEARCHED: 'Tìm kiếm thuốc thành công',
    SUMMARY_FETCHED: 'Lấy tóm tắt đơn thuốc thành công',
    DOCTOR_HISTORY_FETCHED: 'Lấy lịch sử đơn thuốc theo bác sĩ thành công',
    SEARCH_FETCHED: 'Tìm kiếm đơn thuốc thành công',
    CODE_FETCHED: 'Lấy đơn thuốc theo mã thành công',
    STATS_FETCHED: 'Lấy thống kê đơn thuốc thành công',
} as const;
