/** Trạng thái phiếu cấp phát */
export const DISPENSE_STATUS = {
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
} as const;

/** Cấu hình phân trang */
export const DISPENSE_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;

/** Thông báo lỗi */
export const DISPENSE_ERRORS = {
    PRESCRIPTION_NOT_FOUND: 'Không tìm thấy đơn thuốc',
    PRESCRIPTION_NOT_PRESCRIBED: 'Đơn thuốc chưa được xác nhận (PRESCRIBED). Chỉ cấp phát đơn đã xác nhận.',
    ALREADY_DISPENSED: 'Đơn thuốc đã được cấp phát rồi. Mỗi đơn chỉ cấp phát 1 lần.',
    DISPENSE_ORDER_NOT_FOUND: 'Không tìm thấy phiếu cấp phát',
    DISPENSE_ALREADY_CANCELLED: 'Phiếu cấp phát đã bị hủy trước đó',
    MISSING_ITEMS: 'Danh sách thuốc cấp phát (items) không được rỗng',
    INVALID_ITEM: 'Mỗi dòng cấp phát phải có prescription_detail_id, inventory_id, và dispensed_quantity > 0',
    DETAIL_NOT_FOUND: 'Dòng thuốc trong đơn không tồn tại hoặc không thuộc đơn này',
    INVENTORY_NOT_FOUND: 'Lô tồn kho không tồn tại',
    DRUG_MISMATCH: 'Lô kho không đúng thuốc với dòng đơn thuốc',
    INSUFFICIENT_STOCK: 'Tồn kho không đủ để cấp phát',
    BATCH_EXPIRED: 'Lô thuốc đã hết hạn sử dụng',
    PHARMACIST_NOT_FOUND: 'Dược sĩ không tồn tại trong hệ thống',
    DRUG_NOT_FOUND: 'Thuốc không tồn tại trong hệ thống',
    MISSING_DRUG_ID: 'Thiếu mã thuốc (drugId)',
    MISSING_QUANTITY: 'Thiếu số lượng cần kiểm tra (quantity)',
    MISSING_CANCEL_REASON: 'Thiếu lý do hủy phiếu cấp phát',
    FACILITY_MISMATCH: 'Lô thuốc không thuộc kho của cùng chi nhánh với lượt khám',
} as const;

/** Thông báo thành công */
export const DISPENSE_SUCCESS = {
    DISPENSED: 'Cấp phát thuốc thành công',
    FETCHED: 'Lấy thông tin phiếu cấp phát thành công',
    HISTORY_FETCHED: 'Lấy lịch sử cấp phát thành công',
    INVENTORY_FETCHED: 'Lấy tồn kho theo thuốc thành công',
    STOCK_CHECKED: 'Kiểm tra tồn kho thành công',
    PHARMACIST_HISTORY_FETCHED: 'Lấy lịch sử cấp phát theo dược sĩ thành công',
    CANCELLED: 'Hủy phiếu cấp phát và hoàn kho thành công',
} as const;
