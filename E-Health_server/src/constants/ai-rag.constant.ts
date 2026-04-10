/**
 * Trạng thái xử lý của một tài liệu RAG
 */
export const AI_RAG_DOCUMENT_STATUS = {
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED'
} as const;

/**
 * Cấu hình hệ thống RAG (Retrieval-Augmented Generation)
 */
export const AI_RAG_CONFIG = {
    EMBEDDING_MODEL: 'text-embedding-3-small',

    EMBEDDING_OUTPUT_DIMENSIONS: 1536,

    CHUNK_SIZE: 1200,

    CHUNK_OVERLAP: 150,

    TOP_K_RESULTS: 5,

    EMBEDDING_BATCH_SIZE: 100,

    EMBEDDING_MAX_RETRIES: 5,
} as const;

/** Cấu hình file upload cho Admin */
export const AI_RAG_UPLOAD_CONFIG = {
    MAX_FILE_SIZE_MB: 10, // Max 10MB
    ALLOWED_MIME_TYPES: ['application/pdf'],
} as const;

/** Thông báo lỗi RAG */
export const AI_RAG_ERRORS = {
    FILE_TOO_LARGE: 'File quá lớn. Vui lòng chọn file dưới 10MB.',
    INVALID_FILE_TYPE: 'Định dạng file không hợp lệ. Chỉ chấp nhận định dạng PDF.',
    EMPTY_FILE: 'File rỗng hoặc không có nội dung text.',
    DOCUMENT_NOT_FOUND: 'Không tìm thấy tài liệu.',
    EMBEDDING_FAILED: 'Lỗi trong quá trình nhúng dữ liệu (Embedding). Vui lòng thử lại.',
    DB_INSERT_FAILED: 'Lỗi khi lưu trữ vector vào Database.',
} as const;

/** Thông báo thành công */
export const AI_RAG_SUCCESS = {
    UPLOAD_STARTED: 'Đang xử lý tài liệu. Quá trình chia nhỏ và nhúng đang chạy ngầm.',
    UPLOAD_COMPLETED: 'Xử lý tài liệu và trích xuất vector thành công.',
    DOCUMENT_DELETED: 'Đã xóa tài liệu khỏi thư viện tri thức.',
} as const;
