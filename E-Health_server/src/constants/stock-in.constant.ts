/** Lỗi NCC */
export const SUPPLIER_ERRORS = {
    NOT_FOUND: 'Không tìm thấy nhà cung cấp',
    CODE_EXISTS: 'Mã nhà cung cấp đã tồn tại',
    MISSING_REQUIRED: 'Thiếu thông tin bắt buộc: code, name',
    NO_FIELDS_TO_UPDATE: 'Không có trường nào để cập nhật',
} as const;

/** Thành công NCC */
export const SUPPLIER_SUCCESS = {
    LIST_FETCHED: 'Lấy danh sách nhà cung cấp thành công',
    DETAIL_FETCHED: 'Lấy chi tiết nhà cung cấp thành công',
    CREATED: 'Tạo nhà cung cấp thành công',
    UPDATED: 'Cập nhật nhà cung cấp thành công',
} as const;

/** Trạng thái phiếu nhập */
export const STOCK_IN_STATUS = {
    DRAFT: 'DRAFT',
    CONFIRMED: 'CONFIRMED',
    RECEIVED: 'RECEIVED',
    CANCELLED: 'CANCELLED',
} as const;

/** Config */
export const STOCK_IN_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;

/** Lỗi phiếu nhập */
export const STOCK_IN_ERRORS = {
    ORDER_NOT_FOUND: 'Không tìm thấy phiếu nhập kho',
    SUPPLIER_NOT_FOUND: 'Nhà cung cấp không tồn tại hoặc không hoạt động',
    WAREHOUSE_NOT_FOUND: 'Kho không tồn tại hoặc không hoạt động',
    DRUG_NOT_FOUND: 'Thuốc không tồn tại hoặc không hoạt động',
    NOT_DRAFT: 'Chỉ được thêm dòng thuốc khi phiếu ở trạng thái DRAFT',
    NO_ITEMS: 'Phiếu nhập phải có ít nhất 1 dòng thuốc',
    NOT_CONFIRMED: 'Chỉ nhận hàng khi phiếu ở trạng thái CONFIRMED',
    CANNOT_CANCEL_RECEIVED: 'Không thể hủy phiếu đã nhận hàng (RECEIVED)',
    INVALID_STATUS_FOR_CONFIRM: 'Chỉ xác nhận phiếu ở trạng thái DRAFT',
    EXPIRY_IN_PAST: 'Ngày hết hạn phải là ngày trong tương lai',
    INVALID_QUANTITY: 'Số lượng phải > 0',
    INVALID_UNIT_COST: 'Giá nhập phải > 0',
    MISSING_ITEM_FIELDS: 'Thiếu thông tin: drug_id, batch_number, expiry_date, quantity, unit_cost',
    MISSING_REQUIRED: 'Thiếu thông tin: supplier_id, warehouse_id',
    MISSING_CANCEL_REASON: 'Thiếu lý do hủy phiếu',
} as const;

/** Thành công phiếu nhập */
export const STOCK_IN_SUCCESS = {
    ORDER_CREATED: 'Tạo phiếu nhập kho thành công',
    ITEM_ADDED: 'Thêm dòng thuốc vào phiếu thành công',
    CONFIRMED: 'Xác nhận phiếu nhập kho thành công',
    RECEIVED: 'Nhận hàng và cập nhật tồn kho thành công',
    CANCELLED: 'Hủy phiếu nhập kho thành công',
    LIST_FETCHED: 'Lấy lịch sử nhập kho thành công',
    DETAIL_FETCHED: 'Lấy chi tiết phiếu nhập thành công',
} as const;
