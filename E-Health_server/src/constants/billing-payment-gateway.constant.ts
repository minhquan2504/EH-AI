/** Trạng thái lệnh thanh toán QR */
export const PAYMENT_ORDER_STATUS = {
    PENDING: 'PENDING',
    PAID: 'PAID',
    EXPIRED: 'EXPIRED',
    CANCELLED: 'CANCELLED',
} as const;
export type PaymentOrderStatus = typeof PAYMENT_ORDER_STATUS[keyof typeof PAYMENT_ORDER_STATUS];

/** Tên cổng thanh toán */
export const GATEWAY_NAME = {
    SEPAY: 'SEPAY',
} as const;

/** Môi trường gateway */
export const GATEWAY_ENVIRONMENT = {
    SANDBOX: 'SANDBOX',
    PRODUCTION: 'PRODUCTION',
} as const;

/** Cấu hình mặc định */
export const PAYMENT_GATEWAY_CONFIG = {
    /** Thời gian hết hạn QR (phút) */
    QR_EXPIRY_MINUTES: 15,
    /** Prefix mã lệnh thanh toán */
    ORDER_CODE_PREFIX: 'PO',
    /** Prefix nội dung chuyển khoản — SePay sẽ dựa vào để detect */
    TRANSFER_CONTENT_PREFIX: 'EHEALTH',
    /** Base URL sinh QR SePay */
    SEPAY_QR_BASE_URL: 'https://qr.sepay.vn/img',
    /** SePay API base */
    SEPAY_API_BASE_URL: 'https://my.sepay.vn/userapi',
    /** Phân trang */
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;

/** Mã lỗi module Payment Gateway */
export const PAYMENT_GATEWAY_ERRORS = {
    ORDER_NOT_FOUND: { code: 'PGW_001', message: 'Không tìm thấy lệnh thanh toán.' },
    ORDER_ALREADY_PAID: { code: 'PGW_002', message: 'Lệnh thanh toán đã được thanh toán.' },
    ORDER_EXPIRED: { code: 'PGW_003', message: 'Lệnh thanh toán đã hết hạn.' },
    ORDER_CANCELLED: { code: 'PGW_004', message: 'Lệnh thanh toán đã bị hủy.' },
    INVOICE_NOT_FOUND: { code: 'PGW_005', message: 'Không tìm thấy hóa đơn.' },
    INVOICE_ALREADY_PAID: { code: 'PGW_006', message: 'Hóa đơn đã thanh toán đầy đủ.' },
    INVOICE_CANCELLED: { code: 'PGW_007', message: 'Hóa đơn đã bị hủy.' },
    INVALID_AMOUNT: { code: 'PGW_008', message: 'Số tiền thanh toán không hợp lệ.' },
    AMOUNT_EXCEEDS_REMAINING: { code: 'PGW_009', message: 'Số tiền vượt quá số tiền còn lại.' },
    GATEWAY_NOT_CONFIGURED: { code: 'PGW_010', message: 'Chưa cấu hình cổng thanh toán.' },
    GATEWAY_INACTIVE: { code: 'PGW_011', message: 'Cổng thanh toán đang tắt.' },
    WEBHOOK_AUTH_FAILED: { code: 'PGW_012', message: 'Xác thực webhook thất bại.' },
    WEBHOOK_INVALID_DATA: { code: 'PGW_013', message: 'Dữ liệu webhook không hợp lệ.' },
    DUPLICATE_TRANSACTION: { code: 'PGW_014', message: 'Giao dịch đã được xử lý trước đó.' },
    PENDING_ORDER_EXISTS: { code: 'PGW_015', message: 'Đã có lệnh thanh toán đang chờ cho hóa đơn này.' },
    CONFIG_NOT_FOUND: { code: 'PGW_016', message: 'Không tìm thấy cấu hình cổng thanh toán.' },
    GATEWAY_CONNECTION_FAILED: { code: 'PGW_017', message: 'Không thể kết nối đến cổng thanh toán.' },
} as const;

/** Thông báo thành công */
export const PAYMENT_GATEWAY_SUCCESS = {
    QR_GENERATED: 'Sinh QR Code thanh toán thành công.',
    ORDER_CANCELLED: 'Hủy lệnh thanh toán thành công.',
    WEBHOOK_PROCESSED: 'Webhook đã được xử lý thành công.',
    CONFIG_UPDATED: 'Cập nhật cấu hình thành công.',
    CONNECTION_OK: 'Kết nối cổng thanh toán thành công.',
} as const;
