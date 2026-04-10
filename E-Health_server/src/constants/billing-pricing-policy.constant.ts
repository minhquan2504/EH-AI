/** Loại giảm giá */
export const DISCOUNT_TYPE = {
    PERCENTAGE: 'PERCENTAGE',
    FIXED_AMOUNT: 'FIXED_AMOUNT',
} as const;
export type DiscountType = typeof DISCOUNT_TYPE[keyof typeof DISCOUNT_TYPE];

/** Phạm vi áp dụng */
export const APPLY_TO = {
    ALL_SERVICES: 'ALL_SERVICES',
    SPECIFIC_SERVICES: 'SPECIFIC_SERVICES',
    SERVICE_GROUP: 'SERVICE_GROUP',
} as const;
export type ApplyTo = typeof APPLY_TO[keyof typeof APPLY_TO];
export const VALID_APPLY_TO = Object.values(APPLY_TO);

/** Nhóm dịch vụ cho SERVICE_GROUP */
export const SERVICE_GROUP = {
    CONSULTATION: 'CONSULTATION',
    LAB_ORDER: 'LAB_ORDER',
    DRUG: 'DRUG',
} as const;

/** Mã lỗi */
export const POLICY_ERRORS = {
    DISCOUNT_NOT_FOUND: { code: 'PPL_001', message: 'Không tìm thấy chính sách giảm giá.' },
    DISCOUNT_CODE_EXISTS: { code: 'PPL_002', message: 'Mã chính sách đã tồn tại.' },
    INVALID_DISCOUNT_TYPE: { code: 'PPL_003', message: 'Loại giảm giá không hợp lệ (PERCENTAGE/FIXED_AMOUNT).' },
    INVALID_DISCOUNT_VALUE: { code: 'PPL_004', message: 'Giá trị giảm phải lớn hơn 0.' },
    INVALID_PERCENTAGE: { code: 'PPL_005', message: 'Phần trăm giảm phải từ 0.01 đến 100.' },
    INVALID_DATE_RANGE: { code: 'PPL_006', message: 'Ngày hiệu lực không hợp lệ (effective_to phải sau effective_from).' },
    INVALID_APPLY_TO: { code: 'PPL_007', message: 'Phạm vi áp dụng không hợp lệ.' },
    NAME_REQUIRED: { code: 'PPL_008', message: 'Tên chính sách/voucher/gói là bắt buộc.' },
    VOUCHER_NOT_FOUND: { code: 'PPL_009', message: 'Không tìm thấy voucher.' },
    VOUCHER_CODE_EXISTS: { code: 'PPL_010', message: 'Mã voucher đã tồn tại.' },
    VOUCHER_EXPIRED: { code: 'PPL_011', message: 'Voucher đã hết hạn.' },
    VOUCHER_EXHAUSTED: { code: 'PPL_012', message: 'Voucher đã hết lượt sử dụng.' },
    VOUCHER_PATIENT_LIMIT: { code: 'PPL_013', message: 'Bạn đã sử dụng hết số lượt cho voucher này.' },
    VOUCHER_MIN_ORDER: { code: 'PPL_014', message: 'Đơn hàng chưa đạt giá trị tối thiểu để sử dụng voucher.' },
    VOUCHER_PATIENT_TYPE: { code: 'PPL_015', message: 'Voucher không áp dụng cho đối tượng bệnh nhân này.' },
    VOUCHER_INACTIVE: { code: 'PPL_016', message: 'Voucher không còn hoạt động.' },
    INVOICE_NOT_FOUND: { code: 'PPL_017', message: 'Không tìm thấy hóa đơn.' },
    BUNDLE_NOT_FOUND: { code: 'PPL_018', message: 'Không tìm thấy gói dịch vụ.' },
    BUNDLE_CODE_EXISTS: { code: 'PPL_019', message: 'Mã gói dịch vụ đã tồn tại.' },
    BUNDLE_NO_ITEMS: { code: 'PPL_020', message: 'Gói dịch vụ phải có ít nhất 1 dịch vụ.' },
    BUNDLE_EXHAUSTED: { code: 'PPL_021', message: 'Gói dịch vụ đã hết số lượng.' },
    FACILITY_SERVICE_NOT_FOUND: { code: 'PPL_022', message: 'Không tìm thấy dịch vụ cơ sở.' },
    VOUCHER_CODE_REQUIRED: { code: 'PPL_023', message: 'Vui lòng nhập mã voucher.' },
} as const;

/** Thông báo thành công */
export const POLICY_SUCCESS = {
    DISCOUNT_CREATED: 'Tạo chính sách giảm giá thành công.',
    DISCOUNT_UPDATED: 'Cập nhật chính sách giảm giá thành công.',
    DISCOUNT_DELETED: 'Vô hiệu hóa chính sách giảm giá thành công.',
    VOUCHER_CREATED: 'Tạo voucher thành công.',
    VOUCHER_UPDATED: 'Cập nhật voucher thành công.',
    VOUCHER_DELETED: 'Vô hiệu hóa voucher thành công.',
    VOUCHER_VALID: 'Voucher hợp lệ.',
    VOUCHER_REDEEMED: 'Sử dụng voucher thành công.',
    BUNDLE_CREATED: 'Tạo gói dịch vụ thành công.',
    BUNDLE_UPDATED: 'Cập nhật gói dịch vụ thành công.',
    BUNDLE_DELETED: 'Vô hiệu hóa gói dịch vụ thành công.',
} as const;

/** Cấu hình */
export const POLICY_CONFIG = {
    DISCOUNT_CODE_PREFIX: 'DSC',
    VOUCHER_CODE_PREFIX: 'VCH',
    BUNDLE_CODE_PREFIX: 'BDL',
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;
