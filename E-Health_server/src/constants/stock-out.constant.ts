/** Loại xuất kho */
export const STOCK_OUT_REASON_TYPE = {
    DISPOSAL: 'DISPOSAL',
    RETURN_SUPPLIER: 'RETURN_SUPPLIER',
    TRANSFER: 'TRANSFER',
    OTHER: 'OTHER',
} as const;

/** Trạng thái phiếu xuất */
export const STOCK_OUT_STATUS = {
    DRAFT: 'DRAFT',
    CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
} as const;

/** Config */
export const STOCK_OUT_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;

export const STOCK_OUT_ERRORS = {
    ORDER_NOT_FOUND: 'Không tìm thấy phiếu xuất kho',
    WAREHOUSE_NOT_FOUND: 'Kho không tồn tại hoặc không hoạt động',
    SUPPLIER_NOT_FOUND: 'Nhà cung cấp không tồn tại hoặc không hoạt động',
    DEST_WAREHOUSE_NOT_FOUND: 'Kho đích không tồn tại hoặc không hoạt động',
    SAME_WAREHOUSE: 'Kho đích phải khác kho xuất',
    MISSING_REQUIRED: 'Thiếu thông tin: warehouse_id, reason_type',
    MISSING_SUPPLIER: 'Loại RETURN_SUPPLIER yêu cầu supplier_id',
    MISSING_DEST_WAREHOUSE: 'Loại TRANSFER yêu cầu dest_warehouse_id',
    INVALID_REASON_TYPE: 'Loại xuất kho không hợp lệ (DISPOSAL, RETURN_SUPPLIER, TRANSFER, OTHER)',
    NOT_DRAFT: 'Chỉ được thao tác khi phiếu ở trạng thái DRAFT',
    NO_ITEMS: 'Phiếu phải có ít nhất 1 dòng thuốc',
    INVENTORY_NOT_FOUND: 'Lô tồn kho không tồn tại',
    INVENTORY_WRONG_WAREHOUSE: 'Lô tồn kho không thuộc kho xuất của phiếu',
    INVALID_QUANTITY: 'Số lượng phải > 0',
    INSUFFICIENT_STOCK: 'Tồn kho không đủ để xuất',
    DETAIL_NOT_FOUND: 'Dòng thuốc không tồn tại trong phiếu',
    ALREADY_CANCELLED: 'Phiếu đã bị hủy trước đó',
    ALREADY_CONFIRMED: 'Phiếu đã được xác nhận, không thể thêm/xóa dòng thuốc',
    MISSING_CANCEL_REASON: 'Thiếu lý do hủy phiếu',
    MISSING_ITEM_FIELDS: 'Thiếu thông tin: inventory_id, quantity',
} as const;

export const STOCK_OUT_SUCCESS = {
    ORDER_CREATED: 'Tạo phiếu xuất kho thành công',
    ITEM_ADDED: 'Thêm dòng thuốc vào phiếu thành công',
    ITEM_DELETED: 'Xóa dòng thuốc khỏi phiếu thành công',
    CONFIRMED: 'Xác nhận và trừ tồn kho thành công',
    CANCELLED: 'Hủy phiếu và hoàn tồn kho thành công',
    LIST_FETCHED: 'Lấy lịch sử xuất kho thành công',
    DETAIL_FETCHED: 'Lấy chi tiết phiếu xuất thành công',
} as const;
