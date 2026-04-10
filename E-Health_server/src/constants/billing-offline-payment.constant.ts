/** Loại thiết bị POS */
export const POS_TERMINAL_TYPE = {
    CARD_READER: 'CARD_READER',
    QR_SCANNER: 'QR_SCANNER',
    COMBO: 'COMBO',
} as const;
export type PosTerminalType = typeof POS_TERMINAL_TYPE[keyof typeof POS_TERMINAL_TYPE];

/** Thương hiệu thẻ */
export const CARD_BRAND = {
    VISA: 'VISA',
    MASTERCARD: 'MASTERCARD',
    JCB: 'JCB',
    NAPAS: 'NAPAS',
    UNKNOWN: 'UNKNOWN',
} as const;
export type CardBrand = typeof CARD_BRAND[keyof typeof CARD_BRAND];

/** Loại biên lai */
export const RECEIPT_TYPE = {
    PAYMENT: 'PAYMENT',
    REFUND: 'REFUND',
    VOID: 'VOID',
} as const;
export type ReceiptType = typeof RECEIPT_TYPE[keyof typeof RECEIPT_TYPE];

/** Phương thức thanh toán tại quầy */
export const OFFLINE_PAYMENT_METHOD = {
    CASH: 'CASH',
    POS_CARD: 'CREDIT_CARD',
    BANK_TRANSFER: 'BANK_TRANSFER',
} as const;
export type OfflinePaymentMethod = typeof OFFLINE_PAYMENT_METHOD[keyof typeof OFFLINE_PAYMENT_METHOD];
export const VALID_OFFLINE_METHODS = Object.values(OFFLINE_PAYMENT_METHOD);

/** Mệnh giá tiền Việt Nam (đồng) */
export const CASH_DENOMINATIONS = [
    500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000, 500,
] as const;

/** Trạng thái giao dịch bị hủy */
export const VOID_STATUS = 'VOIDED' as const;

/** Mã lỗi module Offline Payment */
export const OFFLINE_PAYMENT_ERRORS = {
    NO_OPEN_SHIFT: { code: 'OFP_001', message: 'Thu ngân chưa mở ca. Vui lòng mở ca trước khi thu tiền.' },
    INVOICE_NOT_FOUND: { code: 'OFP_002', message: 'Không tìm thấy hóa đơn.' },
    INVOICE_ALREADY_PAID: { code: 'OFP_003', message: 'Hóa đơn đã thanh toán đầy đủ.' },
    INVOICE_CANCELLED: { code: 'OFP_004', message: 'Hóa đơn đã bị hủy.' },
    INVALID_AMOUNT: { code: 'OFP_005', message: 'Số tiền thanh toán phải lớn hơn 0.' },
    OVERPAYMENT: { code: 'OFP_006', message: 'Số tiền thanh toán vượt quá số tiền còn lại.' },
    INVALID_PAYMENT_METHOD: { code: 'OFP_007', message: 'Phương thức thanh toán không hợp lệ (CASH, CREDIT_CARD, BANK_TRANSFER).' },
    TRANSACTION_NOT_FOUND: { code: 'OFP_008', message: 'Không tìm thấy giao dịch thanh toán.' },
    VOID_TIME_EXPIRED: { code: 'OFP_009', message: 'Đã quá thời hạn cho phép hủy giao dịch (30 phút).' },
    VOID_DIFFERENT_SHIFT: { code: 'OFP_010', message: 'Chỉ được hủy giao dịch trong cùng ca thu ngân.' },
    VOID_ALREADY_VOIDED: { code: 'OFP_011', message: 'Giao dịch đã bị hủy trước đó.' },
    VOID_NOT_SUCCESS: { code: 'OFP_012', message: 'Chỉ có thể hủy giao dịch đã thành công.' },
    VOID_REASON_REQUIRED: { code: 'OFP_013', message: 'Vui lòng cung cấp lý do hủy giao dịch.' },
    TERMINAL_NOT_FOUND: { code: 'OFP_014', message: 'Không tìm thấy thiết bị POS.' },
    TERMINAL_INACTIVE: { code: 'OFP_015', message: 'Thiết bị POS đang tắt.' },
    TERMINAL_CODE_EXISTS: { code: 'OFP_016', message: 'Mã thiết bị POS đã tồn tại.' },
    RECEIPT_NOT_FOUND: { code: 'OFP_017', message: 'Không tìm thấy biên lai.' },
    RECEIPT_VOIDED: { code: 'OFP_018', message: 'Biên lai đã bị hủy, không thể in lại.' },
    SHIFT_NOT_FOUND: { code: 'OFP_019', message: 'Không tìm thấy ca thu ngân.' },
    INVALID_DENOMINATION: { code: 'OFP_020', message: 'Mệnh giá tiền không hợp lệ.' },
    BRANCH_NOT_FOUND: { code: 'OFP_021', message: 'Không tìm thấy chi nhánh.' },
    FACILITY_NOT_FOUND: { code: 'OFP_022', message: 'Không tìm thấy cơ sở y tế.' },
    CARD_INFO_REQUIRED: { code: 'OFP_023', message: 'Thanh toán POS yêu cầu thông tin thẻ (approval_code).' },
} as const;

/** Thông báo thành công */
export const OFFLINE_PAYMENT_SUCCESS = {
    PAYMENT_PROCESSED: 'Thanh toán tại quầy thành công.',
    TRANSACTION_VOIDED: 'Hủy giao dịch thành công.',
    TERMINAL_CREATED: 'Đăng ký thiết bị POS thành công.',
    TERMINAL_UPDATED: 'Cập nhật thiết bị POS thành công.',
    TERMINAL_TOGGLED: 'Cập nhật trạng thái thiết bị POS thành công.',
    RECEIPT_REPRINTED: 'In lại biên lai thành công.',
    DENOMINATION_SUBMITTED: 'Kê khai mệnh giá tiền thành công.',
} as const;

/** Cấu hình mặc định */
export const OFFLINE_PAYMENT_CONFIG = {
    RECEIPT_CODE_PREFIX: 'RCP',
    /** Thời hạn cho phép VOID (phút) */
    VOID_TIME_LIMIT_MINUTES: 30,
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;
