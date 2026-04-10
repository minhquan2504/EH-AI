/** Loại kho */
export const WAREHOUSE_TYPE = {
    MAIN: 'MAIN',
    SECONDARY: 'SECONDARY',
} as const;

/** Lỗi */
export const WAREHOUSE_ERRORS = {
    NOT_FOUND: 'Không tìm thấy kho thuốc',
    BRANCH_NOT_FOUND: 'Chi nhánh không tồn tại',
    CODE_ALREADY_EXISTS: 'Mã kho đã tồn tại trong chi nhánh này',
    MISSING_REQUIRED: 'Thiếu thông tin bắt buộc: branch_id, code, name',
    NO_FIELDS_TO_UPDATE: 'Không có trường nào để cập nhật',
} as const;

/** Thành công */
export const WAREHOUSE_SUCCESS = {
    LIST_FETCHED: 'Lấy danh sách kho thành công',
    DETAIL_FETCHED: 'Lấy chi tiết kho thành công',
    CREATED: 'Tạo kho mới thành công',
    UPDATED: 'Cập nhật kho thành công',
    TOGGLED: 'Thay đổi trạng thái kho thành công',
} as const;
