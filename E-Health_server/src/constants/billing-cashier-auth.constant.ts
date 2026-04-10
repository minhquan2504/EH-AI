/** Loại hành động thu ngân */
export const CASHIER_ACTION_TYPE = {
    SHIFT_OPEN: 'SHIFT_OPEN',
    SHIFT_CLOSE: 'SHIFT_CLOSE',
    SHIFT_LOCK: 'SHIFT_LOCK',
    SHIFT_UNLOCK: 'SHIFT_UNLOCK',
    FORCE_CLOSE: 'FORCE_CLOSE',
    HANDOVER: 'HANDOVER',
    PAYMENT: 'PAYMENT',
    VOID: 'VOID',
    REFUND: 'REFUND',
    LIMIT_EXCEEDED: 'LIMIT_EXCEEDED',
    PROFILE_UPDATE: 'PROFILE_UPDATE',
} as const;
export type CashierActionType = typeof CASHIER_ACTION_TYPE[keyof typeof CASHIER_ACTION_TYPE];

/** Loại thao tác cần check limit */
export const LIMIT_CHECK_TYPE = {
    PAYMENT: 'PAYMENT',
    REFUND: 'REFUND',
    VOID: 'VOID',
} as const;
export type LimitCheckType = typeof LIMIT_CHECK_TYPE[keyof typeof LIMIT_CHECK_TYPE];

/** Trạng thái shift mở rộng */
export const SHIFT_STATUS = {
    OPEN: 'OPEN',
    CLOSED: 'CLOSED',
    LOCKED: 'LOCKED',
    DISCREPANCY: 'DISCREPANCY',
} as const;

/** Mã lỗi */
export const CASHIER_AUTH_ERRORS = {
    PROFILE_NOT_FOUND: { code: 'CSH_001', message: 'Không tìm thấy hồ sơ thu ngân.' },
    USER_ALREADY_CASHIER: { code: 'CSH_002', message: 'User đã được gán hồ sơ thu ngân.' },
    USER_NOT_FOUND: { code: 'CSH_003', message: 'Không tìm thấy user.' },
    PROFILE_INACTIVE: { code: 'CSH_004', message: 'Hồ sơ thu ngân đã bị vô hiệu hóa.' },
    NO_COLLECT_PERMISSION: { code: 'CSH_005', message: 'Thu ngân không có quyền thu tiền.' },
    NO_REFUND_PERMISSION: { code: 'CSH_006', message: 'Thu ngân không có quyền hoàn tiền.' },
    NO_VOID_PERMISSION: { code: 'CSH_007', message: 'Thu ngân không có quyền VOID giao dịch.' },
    NO_OPEN_SHIFT_PERM: { code: 'CSH_008', message: 'Thu ngân không có quyền mở ca.' },
    NO_CLOSE_SHIFT_PERM: { code: 'CSH_009', message: 'Thu ngân không có quyền đóng ca.' },
    LIMIT_NOT_FOUND: { code: 'CSH_010', message: 'Chưa cấu hình giới hạn cho thu ngân.' },
    EXCEED_SINGLE_PAYMENT: { code: 'CSH_011', message: 'Số tiền vượt giới hạn cho phép mỗi giao dịch.' },
    EXCEED_SINGLE_REFUND: { code: 'CSH_012', message: 'Số tiền hoàn vượt giới hạn cho phép.' },
    EXCEED_SINGLE_VOID: { code: 'CSH_013', message: 'Số tiền VOID vượt giới hạn cho phép.' },
    EXCEED_SHIFT_TOTAL: { code: 'CSH_014', message: 'Tổng thu trong ca đã đạt giới hạn.' },
    EXCEED_SHIFT_REFUND: { code: 'CSH_015', message: 'Tổng hoàn tiền trong ca đã đạt giới hạn.' },
    EXCEED_SHIFT_VOID_COUNT: { code: 'CSH_016', message: 'Số lần VOID trong ca đã đạt giới hạn.' },
    EXCEED_DAILY_TOTAL: { code: 'CSH_017', message: 'Tổng thu trong ngày đã đạt giới hạn.' },
    EXCEED_DAILY_REFUND: { code: 'CSH_018', message: 'Tổng hoàn tiền trong ngày đã đạt giới hạn.' },
    EXCEED_DAILY_VOID_COUNT: { code: 'CSH_019', message: 'Số lần VOID trong ngày đã đạt giới hạn.' },
    REQUIRE_SUPERVISOR: { code: 'CSH_020', message: 'Giao dịch vượt ngưỡng, cần phê duyệt supervisor.' },
    SHIFT_NOT_FOUND: { code: 'CSH_021', message: 'Không tìm thấy ca thu ngân.' },
    SHIFT_NOT_OPEN: { code: 'CSH_022', message: 'Ca không ở trạng thái OPEN.' },
    SHIFT_ALREADY_LOCKED: { code: 'CSH_023', message: 'Ca đã bị khóa.' },
    SHIFT_NOT_LOCKED: { code: 'CSH_024', message: 'Ca không bị khóa, không cần mở khóa.' },
    SHIFT_ALREADY_CLOSED: { code: 'CSH_025', message: 'Ca đã đóng.' },
    LOCK_REASON_REQUIRED: { code: 'CSH_026', message: 'Vui lòng nhập lý do khóa ca.' },
    HANDOVER_USER_REQUIRED: { code: 'CSH_027', message: 'Vui lòng chọn thu ngân nhận bàn giao.' },
    HANDOVER_USER_NO_PROFILE: { code: 'CSH_028', message: 'Người nhận bàn giao chưa có hồ sơ thu ngân.' },
} as const;

/** Thông báo thành công */
export const CASHIER_AUTH_SUCCESS = {
    PROFILE_CREATED: 'Tạo hồ sơ thu ngân thành công.',
    PROFILE_UPDATED: 'Cập nhật hồ sơ thu ngân thành công.',
    PROFILE_DELETED: 'Vô hiệu hóa thu ngân thành công.',
    LIMIT_SET: 'Cấu hình giới hạn thành công.',
    LIMIT_UPDATED: 'Cập nhật giới hạn thành công.',
    LIMIT_PASSED: 'Thao tác trong giới hạn cho phép.',
    SHIFT_LOCKED: 'Khóa ca thành công.',
    SHIFT_UNLOCKED: 'Mở khóa ca thành công.',
    SHIFT_FORCE_CLOSED: 'Force close ca thành công.',
    SHIFT_HANDOVER: 'Bàn giao ca thành công.',
} as const;

/** Cấu hình */
export const CASHIER_AUTH_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;
