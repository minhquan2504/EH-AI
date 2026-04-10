export const PATIENT_INSURANCE_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
};

/** Mã lỗi cho thẻ bảo hiểm bệnh nhân */
export const PATIENT_INSURANCE_ERRORS = {
    NOT_FOUND: {
        success: false,
        code: 'INSURANCE_NOT_FOUND',
        message: 'Không tìm thấy thông tin thẻ bảo hiểm.'
    },
    INSURANCE_NUMBER_EXISTS: {
        success: false,
        code: 'INSURANCE_NUMBER_EXISTS',
        message: 'Số thẻ bảo hiểm này đã tồn tại trong hệ thống.'
    },
    INVALID_DATES: {
        success: false,
        code: 'INVALID_DATES',
        message: 'Ngày hết hạn phải lớn hơn ngày bắt đầu.'
    },
    MISSING_REQUIRED_FIELDS: {
        success: false,
        code: 'MISSING_REQUIRED_FIELDS',
        message: 'Vui lòng cung cấp đầy đủ: patient_id, provider_id, insurance_number, start_date, end_date.'
    }
};
