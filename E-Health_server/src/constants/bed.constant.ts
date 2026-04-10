/**
 * Hằng số cho Module 2.11 - Quản lý Giường bệnh
 */

/** Phân loại giường */
export const BED_TYPE = {
    STANDARD: 'STANDARD',
    EMERGENCY: 'EMERGENCY',
    ICU: 'ICU',
} as const;

/** Trạng thái giường */
export const BED_STATUS = {
    EMPTY: 'EMPTY',
    OCCUPIED: 'OCCUPIED',
    CLEANING: 'CLEANING',
    MAINTENANCE: 'MAINTENANCE',
} as const;

/** Danh sách giá trị hợp lệ (dùng cho validate) */
export const VALID_BED_TYPES = Object.values(BED_TYPE);
export const VALID_BED_STATUSES = Object.values(BED_STATUS);

/**
 * Luồng chuyển đổi trạng thái hợp lệ.
 */
export const BED_STATUS_TRANSITIONS: Record<string, string[]> = {
    [BED_STATUS.EMPTY]: [BED_STATUS.OCCUPIED, BED_STATUS.MAINTENANCE],
    [BED_STATUS.OCCUPIED]: [BED_STATUS.CLEANING, BED_STATUS.MAINTENANCE],
    [BED_STATUS.CLEANING]: [BED_STATUS.EMPTY, BED_STATUS.MAINTENANCE],
    [BED_STATUS.MAINTENANCE]: [BED_STATUS.EMPTY],
};

/** Mã lỗi cho Giường bệnh */
export const BED_ERRORS = {
    NOT_FOUND: {
        success: false,
        code: 'BED_001',
        message: 'Không tìm thấy giường bệnh này.',
    },
    CODE_ALREADY_EXISTS: {
        success: false,
        code: 'BED_002',
        message: 'Mã giường (code) đã tồn tại trong chi nhánh này. Vui lòng chọn mã khác.',
    },
    FACILITY_NOT_FOUND: {
        success: false,
        code: 'BED_003',
        message: 'Không tìm thấy cơ sở y tế này.',
    },
    BRANCH_NOT_FOUND: {
        success: false,
        code: 'BED_004',
        message: 'Không tìm thấy chi nhánh này hoặc chi nhánh không thuộc cơ sở đã chọn.',
    },
    DEPARTMENT_NOT_FOUND: {
        success: false,
        code: 'BED_005',
        message: 'Không tìm thấy khoa/phòng ban này hoặc khoa không thuộc cùng chi nhánh.',
    },
    ROOM_NOT_FOUND: {
        success: false,
        code: 'BED_006',
        message: 'Không tìm thấy phòng này hoặc phòng không thuộc cùng chi nhánh.',
    },
    INVALID_STATUS: {
        success: false,
        code: 'BED_007',
        message: `Trạng thái giường không hợp lệ. Giá trị hợp lệ: ${Object.values(BED_STATUS).join(', ')}.`,
    },
    INVALID_TYPE: {
        success: false,
        code: 'BED_008',
        message: `Loại giường không hợp lệ. Giá trị hợp lệ: ${Object.values(BED_TYPE).join(', ')}.`,
    },
    INVALID_STATUS_TRANSITION: {
        success: false,
        code: 'BED_009',
        message: 'Không thể chuyển trạng thái giường theo luồng này.',
    },
    CANNOT_DELETE_OCCUPIED: {
        success: false,
        code: 'BED_010',
        message: 'Không thể xóa giường đang có bệnh nhân sử dụng.',
    },
};

/** Cấu hình phân trang và giới hạn */
export const BED_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};
