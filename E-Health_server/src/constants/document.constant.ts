/** Tiền tố sinh ID cho bảng document_types */
export const DOCUMENT_TYPE_ID_PREFIX = 'DCT';

/** Tiền tố sinh ID cho bảng patient_documents */
export const PATIENT_DOCUMENT_ID_PREFIX = 'DOC';

/** Thư mục lưu trữ trên Cloudinary */
export const DOCUMENT_CLOUDINARY_FOLDER = 'ehealth/patient_documents';

/** Giới hạn kích thước file upload (5MB) */
export const DOCUMENT_MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Các định dạng file được phép upload */
export const DOCUMENT_ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

/** Mã lỗi cho loại tài liệu */
export const DOCUMENT_TYPE_ERRORS = {
    NOT_FOUND: {
        success: false,
        code: 'DCT_001',
        message: 'Không tìm thấy loại tài liệu.',
    },
    CODE_ALREADY_EXISTS: {
        success: false,
        code: 'DCT_002',
        message: 'Mã loại tài liệu (code) đã tồn tại trong hệ thống.',
    },
    IN_USE: {
        success: false,
        code: 'DCT_003',
        message: 'Loại tài liệu đang được sử dụng bởi hồ sơ tài liệu bệnh nhân, không thể xóa.',
    },
    MISSING_REQUIRED_FIELDS: {
        success: false,
        code: 'DCT_004',
        message: 'Vui lòng cung cấp đầy đủ các trường bắt buộc: code, name.',
    },
};

/** Mã lỗi cho tài liệu bệnh nhân */
export const PATIENT_DOCUMENT_ERRORS = {
    NOT_FOUND: {
        success: false,
        code: 'DOC_001',
        message: 'Không tìm thấy tài liệu.',
    },
    MISSING_REQUIRED_FIELDS: {
        success: false,
        code: 'DOC_002',
        message: 'Vui lòng cung cấp đầy đủ: patient_id, document_type_id, document_name.',
    },
    PATIENT_NOT_FOUND: {
        success: false,
        code: 'DOC_003',
        message: 'Không tìm thấy hồ sơ bệnh nhân được chỉ định.',
    },
    DOCUMENT_TYPE_INVALID: {
        success: false,
        code: 'DOC_004',
        message: 'Loại tài liệu không tồn tại hoặc đã bị vô hiệu hóa.',
    },
    FILE_REQUIRED: {
        success: false,
        code: 'DOC_005',
        message: 'Vui lòng chọn file để upload.',
    },
    FILE_TOO_LARGE: {
        success: false,
        code: 'DOC_006',
        message: 'Kích thước file vượt quá giới hạn cho phép (5MB).',
    },
    FILE_FORMAT_NOT_ALLOWED: {
        success: false,
        code: 'DOC_007',
        message: 'Định dạng file không được hỗ trợ. Chấp nhận: JPG, PNG, WEBP, PDF.',
    },
    UPLOAD_FAILED: {
        success: false,
        code: 'DOC_008',
        message: 'Lỗi khi upload file lên hệ thống lưu trữ.',
    },
};

/** Thông báo thành công */
export const DOCUMENT_MESSAGES = {
    TYPE_CREATE_SUCCESS: 'Tạo loại tài liệu thành công.',
    TYPE_UPDATE_SUCCESS: 'Cập nhật loại tài liệu thành công.',
    TYPE_DELETE_SUCCESS: 'Xóa loại tài liệu thành công.',
    DOC_UPLOAD_SUCCESS: 'Upload tài liệu thành công.',
    DOC_UPDATE_SUCCESS: 'Cập nhật thông tin tài liệu thành công.',
    DOC_DELETE_SUCCESS: 'Xóa tài liệu thành công.',
};

/** Cấu hình phân trang */
export const DOCUMENT_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};

/** Tiền tố sinh ID cho bảng patient_document_versions */
export const DOCUMENT_VERSION_ID_PREFIX = 'DOCV';

/** Mã lỗi cho versioning tài liệu */
export const DOCUMENT_VERSION_ERRORS = {
    DOCUMENT_NOT_FOUND: {
        success: false,
        code: 'DOCV_001',
        message: 'Không tìm thấy tài liệu gốc.',
    },
    VERSION_NOT_FOUND: {
        success: false,
        code: 'DOCV_002',
        message: 'Không tìm thấy phiên bản tài liệu.',
    },
    NO_FILE_URL: {
        success: false,
        code: 'DOCV_003',
        message: 'Tài liệu này chưa có file đính kèm.',
    },
};

/** Thông báo thành công cho versioning */
export const DOCUMENT_VERSION_MESSAGES = {
    VERSION_UPLOAD_SUCCESS: 'Upload phiên bản mới tài liệu thành công.',
};

