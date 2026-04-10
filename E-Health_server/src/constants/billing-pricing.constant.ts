/**
 * Phân loại đối tượng bệnh nhân để áp dụng chính sách giá
 */
export const PATIENT_TYPE = {
    STANDARD: 'STANDARD',
    INSURANCE: 'INSURANCE',
    VIP: 'VIP',
    EMPLOYEE: 'EMPLOYEE',
    CHILD: 'CHILD',
    ELDERLY: 'ELDERLY',
} as const;

export type PatientType = typeof PATIENT_TYPE[keyof typeof PATIENT_TYPE];

/** Danh sách giá trị hợp lệ cho patient_type */
export const VALID_PATIENT_TYPES: string[] = Object.values(PATIENT_TYPE);

/**
 * Loại thay đổi giá (dùng cho service_price_history)
 */
export const PRICE_CHANGE_TYPE = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
} as const;

/**
 * Nguồn thay đổi giá (bảng gốc bị thay đổi)
 */
export const PRICE_CHANGE_SOURCE = {
    PRICE_POLICY: 'PRICE_POLICY',
    SPECIALTY_PRICE: 'SPECIALTY_PRICE',
    FACILITY_SERVICE: 'FACILITY_SERVICE',
} as const;

/**
 * Mã lỗi cho module Billing Pricing
 */
export const BILLING_PRICING_ERRORS = {
    POLICY_NOT_FOUND: {
        success: false,
        code: 'BPR_001',
        message: 'Không tìm thấy chính sách giá này.',
    },
    POLICY_DUPLICATE: {
        success: false,
        code: 'BPR_002',
        message: 'Đã tồn tại chính sách giá cho đối tượng này với cùng ngày hiệu lực.',
    },
    INVALID_PATIENT_TYPE: {
        success: false,
        code: 'BPR_003',
        message: 'Loại đối tượng bệnh nhân không hợp lệ.',
    },
    INVALID_PRICE: {
        success: false,
        code: 'BPR_004',
        message: 'Giá dịch vụ phải lớn hơn hoặc bằng 0.',
    },
    FACILITY_SERVICE_NOT_FOUND: {
        success: false,
        code: 'BPR_005',
        message: 'Không tìm thấy dịch vụ cơ sở này.',
    },
    SPECIALTY_NOT_FOUND: {
        success: false,
        code: 'BPR_006',
        message: 'Không tìm thấy chuyên khoa này.',
    },
    SPECIALTY_PRICE_NOT_FOUND: {
        success: false,
        code: 'BPR_007',
        message: 'Không tìm thấy cấu hình giá chuyên khoa này.',
    },
    SPECIALTY_PRICE_DUPLICATE: {
        success: false,
        code: 'BPR_008',
        message: 'Đã tồn tại giá chuyên khoa cho dịch vụ này với cùng đối tượng và ngày hiệu lực.',
    },
    REASON_REQUIRED: {
        success: false,
        code: 'BPR_009',
        message: 'Vui lòng nhập lý do thay đổi giá.',
    },
    EFFECTIVE_DATE_INVALID: {
        success: false,
        code: 'BPR_010',
        message: 'Ngày hiệu lực không hợp lệ (effective_to phải sau effective_from).',
    },
    FACILITY_NOT_FOUND: {
        success: false,
        code: 'BPR_011',
        message: 'Không tìm thấy cơ sở y tế này.',
    },
    BULK_EMPTY: {
        success: false,
        code: 'BPR_012',
        message: 'Danh sách chính sách giá không được để trống.',
    },
    SERVICE_NOT_FOUND: {
        success: false,
        code: 'BPR_013',
        message: 'Không tìm thấy dịch vụ chuẩn này.',
    },
};

/**
 * Cấu hình phân trang & mặc định
 */
export const BILLING_PRICING_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    DEFAULT_EXPIRY_WARNING_DAYS: 30,
    DEFAULT_CURRENCY: 'VND',
};
