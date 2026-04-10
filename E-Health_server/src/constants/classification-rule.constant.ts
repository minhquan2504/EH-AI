/** Tiền tố sinh ID cho bảng patient_classification_rules */
export const RULE_ID_PREFIX = 'RUL';

/** Các loại tiêu chí hỗ trợ */
export const VALID_CRITERIA_TYPES = ['VISIT_COUNT', 'DIAGNOSIS', 'TOTAL_SPEND'] as const;

/** Các toán tử so sánh hợp lệ */
export const VALID_CRITERIA_OPERATORS = ['>', '<', '=', '>=', '<=', 'IN'] as const;

/** Mã lỗi cho Classification Rule */
export const RULE_ERRORS = {
    NOT_FOUND: {
        success: false,
        code: 'RUL_001',
        message: 'Không tìm thấy luật phân loại.',
    },
    INVALID_CRITERIA_TYPE: {
        success: false,
        code: 'RUL_002',
        message: `Loại tiêu chí không hợp lệ. Chấp nhận: ${['VISIT_COUNT', 'DIAGNOSIS', 'TOTAL_SPEND'].join(', ')}.`,
    },
    INVALID_OPERATOR: {
        success: false,
        code: 'RUL_003',
        message: `Toán tử so sánh không hợp lệ. Chấp nhận: >, <, =, >=, <=, IN.`,
    },
    TARGET_TAG_NOT_FOUND: {
        success: false,
        code: 'RUL_004',
        message: 'Thẻ đích (target_tag_id) không tồn tại hoặc đã bị vô hiệu hóa.',
    },
    MISSING_REQUIRED_FIELDS: {
        success: false,
        code: 'RUL_005',
        message: 'Thiếu trường bắt buộc: name, criteria_type, criteria_operator, criteria_value, target_tag_id.',
    },
};

/** Thông báo thành công */
export const RULE_MESSAGES = {
    CREATE_SUCCESS: 'Tạo luật phân loại thành công.',
    UPDATE_SUCCESS: 'Cập nhật luật phân loại thành công.',
    DELETE_SUCCESS: 'Xóa luật phân loại thành công.',
};

/** Cấu hình phân trang */
export const RULE_PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
};
