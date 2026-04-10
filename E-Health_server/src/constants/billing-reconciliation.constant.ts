/** Loại đối soát */
export const RECONCILIATION_TYPE = {
    ONLINE: 'ONLINE',
    CASHIER_SHIFT: 'CASHIER_SHIFT',
    DAILY_SETTLEMENT: 'DAILY_SETTLEMENT',
} as const;
export type ReconciliationType = typeof RECONCILIATION_TYPE[keyof typeof RECONCILIATION_TYPE];

/** Trạng thái phiên đối soát */
export const RECONCILIATION_STATUS = {
    PENDING: 'PENDING',
    REVIEWED: 'REVIEWED',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    CLOSED: 'CLOSED',
} as const;
export type ReconciliationStatus = typeof RECONCILIATION_STATUS[keyof typeof RECONCILIATION_STATUS];

/** Trạng thái khớp giao dịch */
export const MATCH_STATUS = {
    MATCHED: 'MATCHED',
    SYSTEM_ONLY: 'SYSTEM_ONLY',
    EXTERNAL_ONLY: 'EXTERNAL_ONLY',
    AMOUNT_MISMATCH: 'AMOUNT_MISMATCH',
} as const;
export type MatchStatus = typeof MATCH_STATUS[keyof typeof MATCH_STATUS];

/** Trạng thái xử lý chênh lệch */
export const RESOLUTION_STATUS = {
    UNRESOLVED: 'UNRESOLVED',
    RESOLVED: 'RESOLVED',
    WRITTEN_OFF: 'WRITTEN_OFF',
} as const;
export type ResolutionStatus = typeof RESOLUTION_STATUS[keyof typeof RESOLUTION_STATUS];

/** Loại phiếu quyết toán */
export const SETTLEMENT_TYPE = {
    DAILY: 'DAILY',
    WEEKLY: 'WEEKLY',
    MONTHLY: 'MONTHLY',
    CUSTOM: 'CUSTOM',
} as const;
export type SettlementType = typeof SETTLEMENT_TYPE[keyof typeof SETTLEMENT_TYPE];

/** Trạng thái phiếu quyết toán */
export const SETTLEMENT_STATUS = {
    DRAFT: 'DRAFT',
    SUBMITTED: 'SUBMITTED',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
} as const;
export type SettlementStatus = typeof SETTLEMENT_STATUS[keyof typeof SETTLEMENT_STATUS];

/** Ngưỡng chênh lệch (VND) */
export const DISCREPANCY_SEVERITY = {
    MINOR_THRESHOLD: 10000,
    MAJOR_THRESHOLD: 100000,
} as const;

/** Mã lỗi module Reconciliation */
export const RECONCILE_ERRORS = {
    SESSION_NOT_FOUND: { code: 'REC_001', message: 'Không tìm thấy phiên đối soát.' },
    SESSION_NOT_PENDING: { code: 'REC_002', message: 'Phiên đối soát không ở trạng thái PENDING.' },
    SESSION_NOT_REVIEWED: { code: 'REC_003', message: 'Phiên đối soát chưa được review.' },
    SESSION_ALREADY_APPROVED: { code: 'REC_004', message: 'Phiên đối soát đã được phê duyệt.' },
    ITEM_NOT_FOUND: { code: 'REC_005', message: 'Không tìm thấy dòng đối soát.' },
    ITEM_ALREADY_RESOLVED: { code: 'REC_006', message: 'Dòng đối soát đã được xử lý.' },
    RESOLUTION_REQUIRED: { code: 'REC_007', message: 'Vui lòng chọn trạng thái xử lý (RESOLVED/WRITTEN_OFF).' },
    NOTES_REQUIRED: { code: 'REC_008', message: 'Vui lòng cung cấp ghi chú xử lý.' },
    SHIFT_NOT_FOUND: { code: 'REC_009', message: 'Không tìm thấy ca thu ngân.' },
    SHIFT_NOT_CLOSED: { code: 'REC_010', message: 'Ca thu ngân chưa đóng, không thể đối soát.' },
    GATEWAY_NOT_CONFIGURED: { code: 'REC_011', message: 'Chưa cấu hình cổng thanh toán.' },
    GATEWAY_CONNECTION_FAILED: { code: 'REC_012', message: 'Không thể kết nối cổng thanh toán.' },
    SETTLEMENT_NOT_FOUND: { code: 'REC_013', message: 'Không tìm thấy phiếu quyết toán.' },
    SETTLEMENT_NOT_DRAFT: { code: 'REC_014', message: 'Phiếu quyết toán không ở trạng thái DRAFT.' },
    SETTLEMENT_NOT_SUBMITTED: { code: 'REC_015', message: 'Phiếu quyết toán chưa được gửi.' },
    SETTLEMENT_ALREADY_APPROVED: { code: 'REC_016', message: 'Phiếu quyết toán đã được phê duyệt.' },
    INVALID_DATE_RANGE: { code: 'REC_017', message: 'Khoảng ngày không hợp lệ.' },
    FACILITY_NOT_FOUND: { code: 'REC_018', message: 'Không tìm thấy cơ sở y tế.' },
    REJECT_REASON_REQUIRED: { code: 'REC_019', message: 'Vui lòng cung cấp lý do từ chối.' },
    RECONCILIATION_EXISTS: { code: 'REC_020', message: 'Đã tồn tại phiên đối soát cho ngày/ca này.' },
} as const;

/** Thông báo thành công */
export const RECONCILE_SUCCESS = {
    ONLINE_RECONCILED: 'Đối soát giao dịch online thành công.',
    SHIFT_RECONCILED: 'Đối soát ca thu ngân thành công.',
    ITEM_RESOLVED: 'Xử lý chênh lệch thành công.',
    SESSION_REVIEWED: 'Review phiên đối soát thành công.',
    SESSION_APPROVED: 'Phê duyệt phiên đối soát thành công.',
    SESSION_REJECTED: 'Từ chối phiên đối soát.',
    SETTLEMENT_CREATED: 'Tạo phiếu quyết toán thành công.',
    SETTLEMENT_SUBMITTED: 'Gửi phiếu quyết toán thành công.',
    SETTLEMENT_APPROVED: 'Phê duyệt quyết toán thành công.',
    SETTLEMENT_REJECTED: 'Từ chối quyết toán.',
} as const;

/** Cấu hình */
export const RECONCILE_CONFIG = {
    SESSION_CODE_PREFIX: 'REC',
    SETTLEMENT_CODE_PREFIX: 'STL',
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;
