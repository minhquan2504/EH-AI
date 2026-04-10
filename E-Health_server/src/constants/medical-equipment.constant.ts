/**
 * Hằng số cho Module 2.10 - Quản lý Trang thiết bị y tế
 */

/** Trạng thái thiết bị */
export const EQUIPMENT_STATUS = {
    ACTIVE: 'ACTIVE',
    MAINTENANCE: 'MAINTENANCE',
    BROKEN: 'BROKEN',
    INACTIVE: 'INACTIVE',
} as const;

/** Loại bảo trì */
export const MAINTENANCE_TYPE = {
    ROUTINE: 'ROUTINE',
    REPAIR: 'REPAIR',
    INSPECTION: 'INSPECTION',
} as const;

/** Danh sách giá trị hợp lệ (dùng cho validate) */
export const VALID_EQUIPMENT_STATUSES = Object.values(EQUIPMENT_STATUS);
export const VALID_MAINTENANCE_TYPES = Object.values(MAINTENANCE_TYPE);

/** Mã lỗi cho Thiết bị y tế */
export const EQUIPMENT_ERRORS = {
    NOT_FOUND: {
        success: false,
        code: 'EQ_001',
        message: 'Không tìm thấy thiết bị y tế này.',
    },
    CODE_ALREADY_EXISTS: {
        success: false,
        code: 'EQ_002',
        message: 'Mã tài sản (code) đã tồn tại trong hệ thống. Vui lòng chọn mã khác.',
    },
    FACILITY_NOT_FOUND: {
        success: false,
        code: 'EQ_003',
        message: 'Không tìm thấy cơ sở y tế này.',
    },
    BRANCH_NOT_FOUND: {
        success: false,
        code: 'EQ_004',
        message: 'Không tìm thấy chi nhánh này hoặc chi nhánh không thuộc cơ sở đã chọn.',
    },
    ROOM_NOT_FOUND: {
        success: false,
        code: 'EQ_005',
        message: 'Không tìm thấy phòng này hoặc phòng không thuộc cùng chi nhánh với thiết bị.',
    },
    INVALID_STATUS: {
        success: false,
        code: 'EQ_006',
        message: `Trạng thái không hợp lệ. Giá trị hợp lệ: ${Object.values(EQUIPMENT_STATUS).join(', ')}.`,
    },
};

/** Mã lỗi cho Log bảo trì */
export const MAINTENANCE_LOG_ERRORS = {
    NOT_FOUND: {
        success: false,
        code: 'EML_001',
        message: 'Không tìm thấy bản ghi bảo trì này.',
    },
    INVALID_TYPE: {
        success: false,
        code: 'EML_002',
        message: `Loại bảo trì không hợp lệ. Giá trị hợp lệ: ${Object.values(MAINTENANCE_TYPE).join(', ')}.`,
    },
};

/** Cấu hình phân trang và giới hạn */
export const EQUIPMENT_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};
