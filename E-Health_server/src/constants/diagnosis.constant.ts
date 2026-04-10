
/** Loại chẩn đoán */
export const DIAGNOSIS_TYPE = {
    PRELIMINARY: 'PRELIMINARY',
    PRIMARY: 'PRIMARY',
    SECONDARY: 'SECONDARY',
    FINAL: 'FINAL',
} as const;

/** Chuyển loại chẩn đoán hợp lệ */
export const VALID_TYPE_TRANSITIONS: Record<string, string[]> = {
    PRELIMINARY: ['PRIMARY', 'FINAL'],
    SECONDARY: ['PRIMARY'],
} as const;

/** Cấu hình phân trang */
export const DIAGNOSIS_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    ICD_SEARCH_LIMIT: 30,
} as const;

/** Thông báo lỗi */
export const DIAGNOSIS_ERRORS = {
    ENCOUNTER_NOT_FOUND: 'Lượt khám không tồn tại hoặc đã bị xóa',
    ENCOUNTER_NOT_EDITABLE: 'Lượt khám đã hoàn tất hoặc đóng, không thể thao tác chẩn đoán',
    NOT_FOUND: 'Chẩn đoán không tồn tại hoặc đã bị xóa',
    PRIMARY_ALREADY_EXISTS: 'Encounter này đã có chẩn đoán chính (PRIMARY). Mỗi lượt khám chỉ có tối đa 1 chẩn đoán chính.',
    MISSING_ICD_CODE: 'Thiếu mã ICD-10 (icd10_code)',
    MISSING_DIAGNOSIS_NAME: 'Thiếu tên chẩn đoán (diagnosis_name)',
    MISSING_DIAGNOSIS_TYPE: 'Thiếu loại chẩn đoán (diagnosis_type)',
    INVALID_DIAGNOSIS_TYPE: 'Loại chẩn đoán không hợp lệ. Giá trị cho phép: PRELIMINARY, PRIMARY, SECONDARY, FINAL',
    INVALID_TYPE_TRANSITION: 'Không thể chuyển loại chẩn đoán theo hướng này',
    MISSING_NEW_TYPE: 'Thiếu loại chẩn đoán mới (new_type)',
    MISSING_CONCLUSION: 'Thiếu nội dung kết luận khám (conclusion)',
    PATIENT_NOT_FOUND: 'Bệnh nhân không tồn tại trong hệ thống',
    MISSING_SEARCH_QUERY: 'Thiếu từ khóa tìm kiếm (q)',
} as const;

/** Thông báo thành công */
export const DIAGNOSIS_SUCCESS = {
    CREATED: 'Thêm chẩn đoán thành công',
    UPDATED: 'Cập nhật chẩn đoán thành công',
    DELETED: 'Xóa chẩn đoán thành công',
    TYPE_CHANGED: 'Chuyển loại chẩn đoán thành công',
    LIST_FETCHED: 'Lấy danh sách chẩn đoán thành công',
    CONCLUSION_SAVED: 'Lưu kết luận khám thành công',
    CONCLUSION_FETCHED: 'Lấy kết luận khám thành công',
    HISTORY_FETCHED: 'Lấy lịch sử chẩn đoán thành công',
    ICD_SEARCH_FETCHED: 'Tìm kiếm mã ICD-10 thành công',
} as const;
