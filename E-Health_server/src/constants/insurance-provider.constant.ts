export const INSURANCE_PROVIDER_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
};

export const VALID_INSURANCE_TYPES = ['STATE', 'PRIVATE'];

/** Mã lỗi cho đơn vị bảo hiểm */
export const INSURANCE_PROVIDER_ERRORS = {
    NOT_FOUND: {
        success: false,
        code: 'PROVIDER_NOT_FOUND',
        message: 'Không tìm thấy thông tin đơn vị bảo hiểm.'
    },
    PROVIDER_CODE_EXISTS: {
        success: false,
        code: 'PROVIDER_CODE_EXISTS',
        message: 'Mã đơn vị bảo hiểm đã tồn tại trong hệ thống.'
    },
    INVALID_INSURANCE_TYPE: {
        success: false,
        code: 'INVALID_INSURANCE_TYPE',
        message: 'Loại bảo hiểm không hợp lệ (Phải là STATE hoặc PRIVATE).'
    },
    MISSING_REQUIRED_FIELDS: {
        success: false,
        code: 'MISSING_REQUIRED_FIELDS',
        message: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc (provider_code, provider_name, insurance_type).'
    }
};
