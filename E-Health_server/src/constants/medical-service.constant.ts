/**
 * Mã lỗi cho Danh mục dịch vụ chuẩn
 */
export const SERVICE_ERRORS = {
    NOT_FOUND: {
        success: false,
        code: 'SRV_001',
        message: 'Không tìm thấy dịch vụ y tế chuẩn này.',
    },
    ALREADY_EXISTS: {
        success: false,
        code: 'SRV_002',
        message: 'Mã dịch vụ y tế chuẩn (code) đã tồn tại. Vui lòng chọn mã khác.',
    },
};

/**
 * Mã lỗi cho Dịch vụ tại cơ sở
 */
export const FACILITY_SERVICE_ERRORS = {
    NOT_FOUND: {
        success: false,
        code: 'FSRV_001',
        message: 'Không tìm thấy cấu hình dịch vụ này tại cơ sở.',
    },
    ALREADY_EXISTS: {
        success: false,
        code: 'FSRV_002',
        message: 'Dịch vụ chuẩn này đã được cấu hình giá tại cơ sở. Vui lòng cập nhật thay vì tạo mới.',
    },
    FACILITY_NOT_FOUND: {
        success: false,
        code: 'FSRV_003',
        message: 'Không tìm thấy cơ sở y tế này.',
    },
    DEPARTMENT_NOT_FOUND: {
        success: false,
        code: 'FSRV_004',
        message: 'Không tìm thấy phòng ban / khoa này.',
    },
};

/**
 * Mã lỗi cho Gán Dịch vụ - Chuyên khoa
 */
export const SPECIALTY_SERVICE_ERRORS = {
    SPECIALTY_NOT_FOUND: {
        success: false,
        code: 'SSRV_001',
        message: 'Không tìm thấy chuyên khoa này.',
    },
    ALREADY_ASSIGNED: {
        success: false,
        code: 'SSRV_002',
        message: 'Dịch vụ này đã được gán cho chuyên khoa. Không thể gán trùng.',
    },
    NOT_FOUND: {
        success: false,
        code: 'SSRV_003',
        message: 'Không tìm thấy liên kết dịch vụ - chuyên khoa này.',
    },
    SERVICE_IDS_REQUIRED: {
        success: false,
        code: 'SSRV_004',
        message: 'Danh sách service_ids không được để trống.',
    },
};

/**
 * Mã lỗi cho Gán Dịch vụ - Bác sĩ
 */
export const DOCTOR_SERVICE_ERRORS = {
    DOCTOR_NOT_FOUND: {
        success: false,
        code: 'DSRV_001',
        message: 'Không tìm thấy thông tin bác sĩ này.',
    },
    ALREADY_ASSIGNED: {
        success: false,
        code: 'DSRV_002',
        message: 'Bác sĩ đã được gán dịch vụ này. Không thể gán trùng.',
    },
    NOT_FOUND: {
        success: false,
        code: 'DSRV_003',
        message: 'Không tìm thấy liên kết dịch vụ - bác sĩ này.',
    },
    FACILITY_SERVICE_IDS_REQUIRED: {
        success: false,
        code: 'DSRV_004',
        message: 'Danh sách facility_service_ids không được để trống.',
    },
};

/**
 * Phân loại dịch vụ y tế
 */
export const SERVICE_TYPE = {
    CLINICAL: 'CLINICAL',
    LABORATORY: 'LABORATORY',
    RADIOLOGY: 'RADIOLOGY',
    PROCEDURE: 'PROCEDURE',
} as const;

export const SERVICE_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    DEFAULT_ESTIMATED_DURATION: 15,
};
