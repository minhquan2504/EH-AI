/** Cấu hình phân trang */
export const INVENTORY_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    DEFAULT_EXPIRY_DAYS: 90,
    DEFAULT_LOW_STOCK_THRESHOLD: 50,
} as const;

/** Mức cảnh báo hết hạn */
export const EXPIRY_ALERT_LEVELS = {
    CRITICAL: 30,
    WARNING: 60,
    NOTICE: 90,
} as const;

/** Thông báo lỗi */
export const INVENTORY_ERRORS = {
    BATCH_NOT_FOUND: 'Không tìm thấy lô tồn kho',
    DRUG_NOT_FOUND: 'Thuốc không tồn tại hoặc đã ngưng hoạt động',
    BATCH_ALREADY_EXISTS: 'Lô thuốc (drug_id + batch_number) đã tồn tại trong kho',
    EXPIRY_IN_PAST: 'Ngày hết hạn phải là ngày trong tương lai',
    INVALID_QUANTITY: 'Số lượng tồn kho phải >= 0',
    MISSING_REQUIRED: 'Thiếu thông tin bắt buộc: drug_id, batch_number, expiry_date, stock_quantity',
    MISSING_BATCH_NUMBER: 'Thiếu mã lô (batch_number)',
    MISSING_DRUG_ID: 'Thiếu mã thuốc (drug_id)',
    NO_FIELDS_TO_UPDATE: 'Không có trường nào để cập nhật',
} as const;

/** Thông báo thành công */
export const INVENTORY_SUCCESS = {
    LIST_FETCHED: 'Lấy danh sách tồn kho thành công',
    DETAIL_FETCHED: 'Lấy chi tiết lô tồn kho thành công',
    EXPIRING_FETCHED: 'Lấy danh sách thuốc sắp hết hạn thành công',
    LOW_STOCK_FETCHED: 'Lấy danh sách thuốc tồn kho thấp thành công',
    CREATED: 'Nhập kho lô mới thành công',
    UPDATED: 'Cập nhật tồn kho thành công',
} as const;
