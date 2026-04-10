export const INSURANCE_COVERAGE_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
};

/** Mã lỗi cho tỷ lệ chi trả bảo hiểm */
export const INSURANCE_COVERAGE_ERRORS = {
    NOT_FOUND: {
        success: false,
        code: 'COVERAGE_NOT_FOUND',
        message: 'Không tìm thấy thông tin tỷ lệ chi trả bảo hiểm.'
    },
    DUPLICATE_NAME: {
        success: false,
        code: 'COVERAGE_DUPLICATE_NAME',
        message: 'Tên gói tỷ lệ chi trả đã tồn tại cho đơn vị bảo hiểm này.'
    },
    INVALID_PERCENT: {
        success: false,
        code: 'COVERAGE_INVALID_PERCENT',
        message: 'Tỷ lệ chi trả phải nằm trong khoảng 0 - 100.'
    },
    MISSING_REQUIRED_FIELDS: {
        success: false,
        code: 'COVERAGE_MISSING_FIELDS',
        message: 'Vui lòng cung cấp đầy đủ: coverage_name, provider_id, coverage_percent.'
    }
};
