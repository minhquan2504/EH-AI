/**
 * Định nghĩa các mã lỗi cho module Pharmacy (Nhóm thuốc)
 */
export const PHARMACY_CATEGORY_ERRORS = {
    NOT_FOUND: {
        success: false,
        code: 'PHM_CAT_001',
        message: 'Không tìm thấy nhóm thuốc này trong hệ thống.',
    },
    ALREADY_EXISTS: {
        success: false,
        code: 'PHM_CAT_002',
        message: 'Mã nhóm thuốc (code) đã tồn tại. Vui lòng chọn mã khác.',
    },
    HAS_DRUGS: {
        success: false,
        code: 'PHM_CAT_003',
        message: 'Không thể xóa nhóm thuốc đang chứa danh sách các loại thuốc. Vui lòng gỡ bỏ thuốc khỏi nhóm trước khi xóa.',
    },
};

/**
 * Định nghĩa các mã lỗi cho module Pharmacy (Từ điển thuốc - Drugs)
 */
export const DRUG_ERRORS = {
    NOT_FOUND: {
        success: false,
        code: 'DRG_001',
        message: 'Không tìm thấy loại thuốc này trong hệ thống.',
    },
    ALREADY_EXISTS: {
        success: false,
        code: 'DRG_002',
        message: 'Mã thuốc (drug_code) nội bộ đã tồn tại. Vui lòng chọn mã khác.',
    },
    NDC_ALREADY_EXISTS: {
        success: false,
        code: 'DRG_003',
        message: 'Mã thuốc Quốc gia (national_drug_code) đã tồn tại.',
    },
    CATEGORY_NOT_FOUND: {
        success: false,
        code: 'DRG_004',
        message: 'Nhóm thuốc (category_id) không tồn tại hoặc đã bị xóa.',
    },
};

/**
 * Các hằng số cấu hình dùng chung cho module Pharmacy
 */
export const PHARMACY_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};
