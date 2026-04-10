/** Tiền tố sinh ID cho bảng tags */
export const TAG_ID_PREFIX = 'TAG';

/** Tiền tố sinh ID cho bảng patient_tags (assignment) */
export const PATIENT_TAG_ID_PREFIX = 'PTAG';

/** Regex validate mã màu HEX (#RRGGBB) */
export const COLOR_HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

/** Mã lỗi cho danh mục Tag */
export const TAG_ERRORS = {
    NOT_FOUND: {
        success: false,
        code: 'TAG_001',
        message: 'Không tìm thấy thẻ phân loại.',
    },
    CODE_ALREADY_EXISTS: {
        success: false,
        code: 'TAG_002',
        message: 'Mã thẻ (code) đã tồn tại trong hệ thống.',
    },
    INVALID_COLOR_HEX: {
        success: false,
        code: 'TAG_003',
        message: 'Mã màu HEX không hợp lệ. Định dạng đúng: #RRGGBB (ví dụ: #FFD700).',
    },
    CODE_CHANGE_NOT_ALLOWED: {
        success: false,
        code: 'TAG_004',
        message: 'Không được phép thay đổi mã code sau khi tạo.',
    },
};

/** Thông báo thành công cho danh mục Tag */
export const TAG_MESSAGES = {
    CREATE_SUCCESS: 'Tạo thẻ phân loại thành công.',
    UPDATE_SUCCESS: 'Cập nhật thẻ phân loại thành công.',
    DELETE_SUCCESS: 'Xóa thẻ phân loại thành công.',
};

/** Mã lỗi cho gắn/gỡ thẻ bệnh nhân */
export const PATIENT_TAG_ERRORS = {
    PATIENT_NOT_FOUND: {
        success: false,
        code: 'PTAG_001',
        message: 'Không tìm thấy hồ sơ bệnh nhân.',
    },
    TAG_NOT_FOUND: {
        success: false,
        code: 'PTAG_002',
        message: 'Thẻ phân loại không tồn tại hoặc đã bị vô hiệu hóa.',
    },
    ALREADY_ASSIGNED: {
        success: false,
        code: 'PTAG_003',
        message: 'Bệnh nhân đã được gắn thẻ này rồi.',
    },
    ASSIGNMENT_NOT_FOUND: {
        success: false,
        code: 'PTAG_004',
        message: 'Không tìm thấy bản ghi gắn thẻ để gỡ.',
    },
};

/** Thông báo thành công cho gắn/gỡ thẻ */
export const PATIENT_TAG_MESSAGES = {
    ASSIGN_SUCCESS: 'Gắn thẻ cho bệnh nhân thành công.',
    REMOVE_SUCCESS: 'Gỡ thẻ khỏi bệnh nhân thành công.',
};

/** Cấu hình phân trang mặc định */
export const TAG_PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
};
