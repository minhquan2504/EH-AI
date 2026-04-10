/**
 * Định nghĩa các mã lỗi cho module Master Data Category
 */
export const MASTER_DATA_CATEGORY_ERRORS = {
    NOT_FOUND: {
        success: false,
        code: 'MD_CAT_001',
        message: 'Không tìm thấy nhóm danh mục này trong hệ thống.',
    },
    ALREADY_EXISTS: {
        success: false,
        code: 'MD_CAT_002',
        message: 'Mã nhóm danh mục (code) đã tồn tại. Vui lòng chọn mã khác.',
    },
    HAS_CHILDREN: {
        success: false,
        code: 'MD_CAT_003',
        message: 'Không thể xóa nhóm danh mục đang chứa dữ liệu chi tiết. Vui lòng vô hiệu hóa hoặc xóa các dữ liệu con trước để đảm bảo tính toàn vẹn.',
    },
};

/**
 * Định nghĩa các mã lỗi cho module Master Data Item
 */
export const MASTER_DATA_ITEM_ERRORS = {
    NOT_FOUND: {
        success: false,
        code: 'MD_ITM_001',
        message: 'Không tìm thấy chi tiết danh mục này trong hệ thống.',
    },
    ALREADY_EXISTS: {
        success: false,
        code: 'MD_ITM_002',
        message: 'Mã chi tiết danh mục (code) đã tồn tại trong nhóm danh mục này. Vui lòng chọn mã khác.',
    },
    CATEGORY_NOT_FOUND: {
        success: false,
        code: 'MD_ITM_003',
        message: 'Mã nhóm danh mục (category code) không tồn tại hoặc đã bị xóa.',
    },
};

/**
 * Các hằng số cấu hình dùng chung cho Master Data
 */
export const MASTER_DATA_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};