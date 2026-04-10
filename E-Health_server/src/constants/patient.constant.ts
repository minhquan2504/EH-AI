/**
 * Hằng số cho Module 2.1 - Quản lý hồ sơ bệnh nhân (Patient Profile)
 */

/** Giới tính bệnh nhân */
export const GENDER = {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
    OTHER: 'OTHER',
} as const;

/** Trạng thái hồ sơ bệnh nhân */
export const PATIENT_STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
} as const;

/** Danh sách giá trị hợp lệ (dùng cho validate) */
export const VALID_GENDERS = Object.values(GENDER);
export const VALID_PATIENT_STATUSES = Object.values(PATIENT_STATUS);

/** Tiền tố mã bệnh nhân */
export const PATIENT_CODE_PREFIX = 'BN';

/** Mã lỗi cho hồ sơ bệnh nhân */
export const PATIENT_ERRORS = {
    NOT_FOUND: {
        success: false,
        code: 'PAT_001',
        message: 'Không tìm thấy hồ sơ bệnh nhân này.',
    },
    ID_CARD_ALREADY_EXISTS: {
        success: false,
        code: 'PAT_002',
        message: 'Số CMND/CCCD đã tồn tại trong hệ thống.',
    },
    INVALID_GENDER: {
        success: false,
        code: 'PAT_003',
        message: `Giới tính không hợp lệ. Giá trị hợp lệ: ${Object.values(GENDER).join(', ')}.`,
    },
    INVALID_STATUS: {
        success: false,
        code: 'PAT_004',
        message: `Trạng thái không hợp lệ. Giá trị hợp lệ: ${Object.values(PATIENT_STATUS).join(', ')}.`,
    },
    MISSING_REQUIRED_FIELDS: {
        success: false,
        code: 'PAT_005',
        message: 'Vui lòng cung cấp đầy đủ các trường bắt buộc: full_name, date_of_birth, gender.',
    },
    ACCOUNT_NOT_FOUND: {
        success: false,
        code: 'PAT_006',
        message: 'Không tìm thấy tài khoản người dùng để liên kết.',
    },
    ACCOUNT_ALREADY_LINKED: {
        success: false,
        code: 'PAT_007',
        message: 'Hồ sơ bệnh nhân này đã được liên kết với một tài khoản khác.',
    },
    INVALID_DATE_OF_BIRTH: {
        success: false,
        code: 'PAT_008',
        message: 'Ngày sinh không hợp lệ hoặc nằm trong tương lai.',
    },
    INVALID_PHONE_NUMBER: {
        success: false,
        code: 'PAT_009',
        message: 'Số điện thoại không hợp lệ. Vui lòng nhập số hợp lệ (VD: 0901234567).',
    },
    INVALID_EMAIL: {
        success: false,
        code: 'PAT_010',
        message: 'Địa chỉ email không hợp lệ.',
    },
};

/** Cấu hình phân trang và giới hạn */
export const PATIENT_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};

/** Regex patterns cho validation */
export const PATIENT_REGEX = {
    PHONE: /^(0|\+84)[0-9]{9,10}$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};
