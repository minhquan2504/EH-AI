/** Loại hoàn tiền */
export const REFUND_TYPE = {
    FULL: 'FULL',
    PARTIAL: 'PARTIAL',
} as const;
export type RefundType = typeof REFUND_TYPE[keyof typeof REFUND_TYPE];

/** Trạng thái yêu cầu hoàn tiền */
export const REFUND_STATUS = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED',
} as const;
export type RefundStatus = typeof REFUND_STATUS[keyof typeof REFUND_STATUS];

/** Danh mục lý do hoàn tiền */
export const REASON_CATEGORY = {
    OVERCHARGE: 'OVERCHARGE',
    SERVICE_CANCELLED: 'SERVICE_CANCELLED',
    DUPLICATE_PAYMENT: 'DUPLICATE_PAYMENT',
    WRONG_PATIENT: 'WRONG_PATIENT',
    QUALITY_ISSUE: 'QUALITY_ISSUE',
    PATIENT_REQUEST: 'PATIENT_REQUEST',
    OTHER: 'OTHER',
} as const;
export type ReasonCategory = typeof REASON_CATEGORY[keyof typeof REASON_CATEGORY];
export const VALID_REASON_CATEGORIES = Object.values(REASON_CATEGORY);

/** Loại điều chỉnh giao dịch */
export const ADJUSTMENT_TYPE = {
    OVERCHARGE: 'OVERCHARGE',
    UNDERCHARGE: 'UNDERCHARGE',
    WRONG_METHOD: 'WRONG_METHOD',
    DUPLICATE: 'DUPLICATE',
    OTHER: 'OTHER',
} as const;
export type AdjustmentType = typeof ADJUSTMENT_TYPE[keyof typeof ADJUSTMENT_TYPE];
export const VALID_ADJUSTMENT_TYPES = Object.values(ADJUSTMENT_TYPE);

/** Trạng thái điều chỉnh */
export const ADJUSTMENT_STATUS = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    APPLIED: 'APPLIED',
    REJECTED: 'REJECTED',
} as const;
export type AdjustmentStatus = typeof ADJUSTMENT_STATUS[keyof typeof ADJUSTMENT_STATUS];

/** Ngưỡng tự động phê duyệt (VND) */
export const AUTO_APPROVE_THRESHOLD = 50000;

/** Mã lỗi */
export const REFUND_ERRORS = {
    REQUEST_NOT_FOUND: { code: 'RFD_001', message: 'Không tìm thấy yêu cầu hoàn tiền.' },
    TRANSACTION_NOT_FOUND: { code: 'RFD_002', message: 'Không tìm thấy giao dịch gốc.' },
    TRANSACTION_NOT_SUCCESS: { code: 'RFD_003', message: 'Chỉ hoàn tiền giao dịch đã thành công (SUCCESS).' },
    TRANSACTION_FULLY_REFUNDED: { code: 'RFD_004', message: 'Giao dịch đã được hoàn tiền toàn bộ.' },
    REFUND_EXCEEDS_REMAINING: { code: 'RFD_005', message: 'Số tiền hoàn vượt quá số tiền có thể hoàn.' },
    INVALID_AMOUNT: { code: 'RFD_006', message: 'Số tiền hoàn phải lớn hơn 0.' },
    INVALID_REASON: { code: 'RFD_007', message: 'Danh mục lý do không hợp lệ.' },
    REASON_DETAIL_REQUIRED: { code: 'RFD_008', message: 'Vui lòng mô tả chi tiết lý do hoàn tiền.' },
    NOT_PENDING: { code: 'RFD_009', message: 'Yêu cầu không ở trạng thái chờ duyệt (PENDING).' },
    NOT_APPROVED: { code: 'RFD_010', message: 'Yêu cầu chưa được phê duyệt.' },
    ALREADY_COMPLETED: { code: 'RFD_011', message: 'Yêu cầu đã hoàn thành.' },
    REJECT_REASON_REQUIRED: { code: 'RFD_012', message: 'Vui lòng cung cấp lý do từ chối.' },
    INVOICE_NOT_FOUND: { code: 'RFD_013', message: 'Không tìm thấy hóa đơn.' },
    ADJUSTMENT_NOT_FOUND: { code: 'RFD_014', message: 'Không tìm thấy yêu cầu điều chỉnh.' },
    ADJ_NOT_PENDING: { code: 'RFD_015', message: 'Điều chỉnh không ở trạng thái chờ duyệt.' },
    ADJ_NOT_APPROVED: { code: 'RFD_016', message: 'Điều chỉnh chưa được phê duyệt.' },
    ADJ_ALREADY_APPLIED: { code: 'RFD_017', message: 'Điều chỉnh đã được áp dụng.' },
    INVALID_ADJUSTMENT_TYPE: { code: 'RFD_018', message: 'Loại điều chỉnh không hợp lệ.' },
    DESCRIPTION_REQUIRED: { code: 'RFD_019', message: 'Vui lòng mô tả lý do điều chỉnh.' },
    CANNOT_CANCEL: { code: 'RFD_020', message: 'Chỉ có thể hủy yêu cầu đang chờ duyệt (PENDING).' },
} as const;

/** Thông báo thành công */
export const REFUND_SUCCESS = {
    REQUEST_CREATED: 'Tạo yêu cầu hoàn tiền thành công.',
    REQUEST_AUTO_APPROVED: 'Yêu cầu hoàn tiền đã được tự động phê duyệt (≤ 50,000 VND).',
    REQUEST_APPROVED: 'Phê duyệt yêu cầu hoàn tiền thành công.',
    REQUEST_REJECTED: 'Từ chối yêu cầu hoàn tiền.',
    REQUEST_PROCESSED: 'Xử lý hoàn tiền thành công — đã tạo giao dịch hoàn.',
    REQUEST_CANCELLED: 'Hủy yêu cầu hoàn tiền thành công.',
    ADJUSTMENT_CREATED: 'Tạo yêu cầu điều chỉnh thành công.',
    ADJUSTMENT_APPROVED: 'Phê duyệt điều chỉnh thành công.',
    ADJUSTMENT_APPLIED: 'Áp dụng điều chỉnh thành công — đã tạo giao dịch bù.',
    ADJUSTMENT_REJECTED: 'Từ chối điều chỉnh.',
} as const;

/** Cấu hình */
export const REFUND_CONFIG = {
    REQUEST_CODE_PREFIX: 'RFD',
    ADJUSTMENT_CODE_PREFIX: 'ADJ',
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;
