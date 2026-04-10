/** Loại template */
export const TEMPLATE_TYPES = {
    DOSAGE: 'DOSAGE',
    FREQUENCY: 'FREQUENCY',
    ROUTE: 'ROUTE',
    INSTRUCTION: 'INSTRUCTION',
} as const;

export const VALID_TEMPLATE_TYPES = Object.values(TEMPLATE_TYPES);

export const MED_INSTRUCTION_ERRORS = {
    TEMPLATE_NOT_FOUND: 'Không tìm thấy mẫu hướng dẫn',
    INVALID_TYPE: 'Loại template không hợp lệ (DOSAGE, FREQUENCY, ROUTE, INSTRUCTION)',
    MISSING_REQUIRED: 'Thiếu thông tin bắt buộc: type, label, value',
    DUPLICATE_VALUE: 'Giá trị đã tồn tại cho loại template này',
    NO_FIELDS_TO_UPDATE: 'Không có trường nào để cập nhật',
    DRUG_NOT_FOUND: 'Thuốc không tồn tại hoặc không hoạt động',
    DEFAULT_NOT_FOUND: 'Chưa có hướng dẫn mặc định cho thuốc này',
    MISSING_DRUG_FIELDS: 'Cần ít nhất 1 trường: default_dosage, default_frequency, default_duration_days, default_route, default_instruction',
} as const;

export const MED_INSTRUCTION_SUCCESS = {
    TEMPLATES_FETCHED: 'Lấy danh sách mẫu hướng dẫn thành công',
    TEMPLATE_CREATED: 'Tạo mẫu hướng dẫn thành công',
    TEMPLATE_UPDATED: 'Cập nhật mẫu hướng dẫn thành công',
    TEMPLATE_DELETED: 'Xóa mẫu hướng dẫn thành công',
    DEFAULT_FETCHED: 'Lấy hướng dẫn mặc định thuốc thành công',
    DEFAULT_UPSERTED: 'Lưu hướng dẫn mặc định thuốc thành công',
    DEFAULT_DELETED: 'Xóa hướng dẫn mặc định thuốc thành công',
    DEFAULTS_LIST_FETCHED: 'Lấy danh sách thuốc có hướng dẫn mặc định thành công',
} as const;
