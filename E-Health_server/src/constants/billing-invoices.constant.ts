/** Trạng thái hóa đơn */
export const INVOICE_STATUS = {
    UNPAID: 'UNPAID',
    PARTIAL: 'PARTIAL',
    PAID: 'PAID',
    OVERPAID: 'OVERPAID',
    CANCELLED: 'CANCELLED',
} as const;
export type InvoiceStatus = typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS];

/** Loại dòng chi tiết hóa đơn */
export const INVOICE_ITEM_TYPE = {
    CONSULTATION: 'CONSULTATION',
    LAB_ORDER: 'LAB_ORDER',
    DRUG: 'DRUG',
} as const;
export type InvoiceItemType = typeof INVOICE_ITEM_TYPE[keyof typeof INVOICE_ITEM_TYPE];

/** Loại giao dịch thanh toán */
export const TRANSACTION_TYPE = {
    PAYMENT: 'PAYMENT',
    REFUND: 'REFUND',
} as const;

/** Phương thức thanh toán */
export const PAYMENT_METHOD = {
    CASH: 'CASH',
    CREDIT_CARD: 'CREDIT_CARD',
    BANK_TRANSFER: 'BANK_TRANSFER',
    VNPAY: 'VNPAY',
    MOMO: 'MOMO',
} as const;
export type PaymentMethod = typeof PAYMENT_METHOD[keyof typeof PAYMENT_METHOD];
export const VALID_PAYMENT_METHODS = Object.values(PAYMENT_METHOD);

/** Trạng thái giao dịch thanh toán */
export const PAYMENT_STATUS = {
    PENDING: 'PENDING',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    REFUNDED: 'REFUNDED',
} as const;

/** Trạng thái ca thu ngân */
export const CASHIER_SHIFT_STATUS = {
    OPEN: 'OPEN',
    CLOSED: 'CLOSED',
    DISCREPANCY: 'DISCREPANCY',
} as const;

/** Trạng thái claim BHYT */
export const CLAIM_STATUS = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    PARTIAL: 'PARTIAL',
} as const;

/** Mã lỗi module Billing Invoices */
export const BILLING_INVOICE_ERRORS = {
    INVOICE_NOT_FOUND: { code: 'BIL_001', message: 'Không tìm thấy hóa đơn.' },
    INVOICE_ALREADY_PAID: { code: 'BIL_002', message: 'Hóa đơn đã thanh toán đầy đủ, không thể thay đổi.' },
    INVOICE_CANCELLED: { code: 'BIL_003', message: 'Hóa đơn đã bị hủy.' },
    INVOICE_HAS_PAYMENTS: { code: 'BIL_004', message: 'Không thể hủy hóa đơn đã có giao dịch thanh toán. Vui lòng hoàn tiền trước.' },
    ENCOUNTER_NOT_FOUND: { code: 'BIL_005', message: 'Không tìm thấy lượt khám.' },
    ENCOUNTER_ALREADY_INVOICED: { code: 'BIL_006', message: 'Lượt khám này đã có hóa đơn.' },
    PATIENT_NOT_FOUND: { code: 'BIL_007', message: 'Không tìm thấy bệnh nhân.' },
    FACILITY_NOT_FOUND: { code: 'BIL_008', message: 'Không tìm thấy cơ sở y tế.' },
    ITEM_NOT_FOUND: { code: 'BIL_009', message: 'Không tìm thấy dòng chi tiết hóa đơn.' },
    INVALID_ITEM_TYPE: { code: 'BIL_010', message: 'Loại dòng chi tiết không hợp lệ (CONSULTATION/LAB_ORDER/DRUG).' },
    INVALID_QUANTITY: { code: 'BIL_011', message: 'Số lượng phải lớn hơn 0.' },
    INVALID_PRICE: { code: 'BIL_012', message: 'Đơn giá phải >= 0.' },
    PAYMENT_NOT_FOUND: { code: 'BIL_013', message: 'Không tìm thấy giao dịch thanh toán.' },
    INVALID_PAYMENT_METHOD: { code: 'BIL_014', message: 'Phương thức thanh toán không hợp lệ.' },
    INVALID_AMOUNT: { code: 'BIL_015', message: 'Số tiền thanh toán phải lớn hơn 0.' },
    OVERPAYMENT: { code: 'BIL_016', message: 'Số tiền thanh toán vượt quá số tiền còn lại.' },
    PAYMENT_NOT_SUCCESS: { code: 'BIL_017', message: 'Chỉ có thể hoàn tiền giao dịch đã thành công.' },
    REFUND_EXCEEDS: { code: 'BIL_018', message: 'Số tiền hoàn vượt quá số tiền đã thanh toán.' },
    REASON_REQUIRED: { code: 'BIL_019', message: 'Vui lòng cung cấp lý do.' },
    SHIFT_NOT_FOUND: { code: 'BIL_020', message: 'Không tìm thấy ca thu ngân.' },
    SHIFT_ALREADY_CLOSED: { code: 'BIL_021', message: 'Ca thu ngân đã được đóng.' },
    SHIFT_ALREADY_OPEN: { code: 'BIL_022', message: 'Thu ngân đang có ca mở. Vui lòng đóng ca trước.' },
    MISSING_ENCOUNTER_OR_PATIENT: { code: 'BIL_023', message: 'Phải cung cấp encounter_id hoặc patient_id.' },
    CANCEL_REASON_REQUIRED: { code: 'BIL_024', message: 'Vui lòng cung cấp lý do hủy hóa đơn.' },
    INVALID_OPENING_BALANCE: { code: 'BIL_025', message: 'Số dư đầu ca phải >= 0.' },
} as const;

/** Thông báo thành công */
export const BILLING_INVOICE_SUCCESS = {
    INVOICE_CREATED: 'Tạo hóa đơn thành công.',
    INVOICE_GENERATED: 'Tạo hóa đơn tự động từ lượt khám thành công.',
    INVOICE_UPDATED: 'Cập nhật hóa đơn thành công.',
    INVOICE_CANCELLED: 'Hủy hóa đơn thành công.',
    ITEM_ADDED: 'Thêm dòng chi tiết thành công.',
    ITEM_UPDATED: 'Cập nhật dòng chi tiết thành công.',
    ITEM_DELETED: 'Xóa dòng chi tiết thành công.',
    RECALCULATED: 'Tính lại tổng tiền thành công.',
    PAYMENT_CREATED: 'Ghi nhận thanh toán thành công.',
    REFUND_CREATED: 'Hoàn tiền thành công.',
    SHIFT_OPENED: 'Mở ca thu ngân thành công.',
    SHIFT_CLOSED: 'Đóng ca thu ngân thành công.',
} as const;

/** Cấu hình mặc định */
export const BILLING_INVOICE_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    INVOICE_CODE_PREFIX: 'INV',
    TRANSACTION_CODE_PREFIX: 'TXN',
} as const;
