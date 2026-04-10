/** Loại hóa đơn điện tử */
export const E_INVOICE_TYPE = {
    SALES: 'SALES',
    VAT: 'VAT',
} as const;
export type EInvoiceType = typeof E_INVOICE_TYPE[keyof typeof E_INVOICE_TYPE];

/** Trạng thái HĐĐT */
export const E_INVOICE_STATUS = {
    DRAFT: 'DRAFT',
    ISSUED: 'ISSUED',
    SIGNED: 'SIGNED',
    SENT: 'SENT',
    CANCELLED: 'CANCELLED',
    REPLACED: 'REPLACED',
    ADJUSTED: 'ADJUSTED',
} as const;
export type EInvoiceStatus = typeof E_INVOICE_STATUS[keyof typeof E_INVOICE_STATUS];

/** Loại bên mua */
export const BUYER_TYPE = {
    INDIVIDUAL: 'INDIVIDUAL',
    COMPANY: 'COMPANY',
} as const;
export type BuyerType = typeof BUYER_TYPE[keyof typeof BUYER_TYPE];

/** Loại điều chỉnh */
export const ADJUSTMENT_TYPE = {
    INCREASE: 'INCREASE',
    DECREASE: 'DECREASE',
} as const;
export type AdjustmentType = typeof ADJUSTMENT_TYPE[keyof typeof ADJUSTMENT_TYPE];

/** Thuế suất cho phép (%) */
export const TAX_RATE = {
    RATE_0: 0,
    RATE_5: 5,
    RATE_8: 8,
    RATE_10: 10,
} as const;
export const VALID_TAX_RATES = Object.values(TAX_RATE);

/** Loại chứng từ */
export const DOCUMENT_TYPE = {
    E_INVOICE_PDF: 'E_INVOICE_PDF',
    RECEIPT_SCAN: 'RECEIPT_SCAN',
    VAT_PAPER: 'VAT_PAPER',
    BANK_SLIP: 'BANK_SLIP',
    REFUND_PROOF: 'REFUND_PROOF',
    OTHER: 'OTHER',
} as const;
export type DocumentType = typeof DOCUMENT_TYPE[keyof typeof DOCUMENT_TYPE];
export const VALID_DOCUMENT_TYPES = Object.values(DOCUMENT_TYPE);

/** Nguồn upload */
export const UPLOAD_SOURCE = {
    MANUAL: 'MANUAL',
    AUTO_GENERATED: 'AUTO_GENERATED',
} as const;

/** Mã lỗi module Document & E-Invoice */
export const BILLING_DOC_ERRORS = {
    EINVOICE_NOT_FOUND: { code: 'DOC_001', message: 'Không tìm thấy hóa đơn điện tử.' },
    EINVOICE_NOT_DRAFT: { code: 'DOC_002', message: 'Chỉ có thể phát hành HĐĐT ở trạng thái DRAFT.' },
    EINVOICE_NOT_ISSUED: { code: 'DOC_003', message: 'Chỉ có thể ký số HĐĐT ở trạng thái ISSUED.' },
    EINVOICE_NOT_SIGNED: { code: 'DOC_004', message: 'Chỉ có thể gửi HĐĐT ở trạng thái SIGNED.' },
    EINVOICE_ALREADY_CANCELLED: { code: 'DOC_005', message: 'HĐĐT đã bị hủy.' },
    EINVOICE_CANNOT_CANCEL: { code: 'DOC_006', message: 'Chỉ có thể hủy HĐĐT ở trạng thái ISSUED/SIGNED/SENT.' },
    EINVOICE_CANNOT_REPLACE: { code: 'DOC_007', message: 'Chỉ có thể thay thế HĐĐT ở trạng thái ISSUED/SIGNED/SENT.' },
    EINVOICE_CANNOT_ADJUST: { code: 'DOC_008', message: 'Chỉ có thể điều chỉnh HĐĐT ở trạng thái SIGNED/SENT.' },
    INVOICE_NOT_FOUND: { code: 'DOC_009', message: 'Không tìm thấy hóa đơn nội bộ.' },
    INVOICE_NOT_PAID: { code: 'DOC_010', message: 'Hóa đơn chưa thanh toán, không thể tạo HĐĐT.' },
    EINVOICE_ALREADY_EXISTS: { code: 'DOC_011', message: 'Hóa đơn nội bộ này đã có HĐĐT.' },
    CONFIG_NOT_FOUND: { code: 'DOC_012', message: 'Chưa cấu hình phát hành HĐĐT cho cơ sở này.' },
    CONFIG_INACTIVE: { code: 'DOC_013', message: 'Cấu hình phát hành HĐĐT đang tắt.' },
    FACILITY_NOT_FOUND: { code: 'DOC_014', message: 'Không tìm thấy cơ sở y tế.' },
    BUYER_TAX_CODE_REQUIRED: { code: 'DOC_015', message: 'HĐ VAT yêu cầu mã số thuế bên mua.' },
    BUYER_NAME_REQUIRED: { code: 'DOC_016', message: 'HĐ VAT yêu cầu tên bên mua.' },
    BUYER_ADDRESS_REQUIRED: { code: 'DOC_017', message: 'HĐ VAT yêu cầu địa chỉ bên mua.' },
    CANCEL_REASON_REQUIRED: { code: 'DOC_018', message: 'Vui lòng cung cấp lý do hủy HĐĐT.' },
    DOCUMENT_NOT_FOUND: { code: 'DOC_019', message: 'Không tìm thấy chứng từ.' },
    DOCUMENT_ARCHIVED: { code: 'DOC_020', message: 'Chứng từ đã được lưu trữ.' },
    INVALID_DOCUMENT_TYPE: { code: 'DOC_021', message: 'Loại chứng từ không hợp lệ.' },
    FILE_URL_REQUIRED: { code: 'DOC_022', message: 'Vui lòng cung cấp URL file.' },
    INVALID_TAX_RATE: { code: 'DOC_023', message: 'Thuế suất không hợp lệ (0, 5, 8, 10%).' },
    ADJUSTMENT_TYPE_REQUIRED: { code: 'DOC_024', message: 'Vui lòng chọn loại điều chỉnh (INCREASE/DECREASE).' },
    LOOKUP_CODE_NOT_FOUND: { code: 'DOC_025', message: 'Không tìm thấy HĐĐT theo mã tra cứu.' },
} as const;

/** Thông báo thành công */
export const BILLING_DOC_SUCCESS = {
    EINVOICE_CREATED: 'Tạo hóa đơn điện tử thành công.',
    EINVOICE_VAT_CREATED: 'Tạo hóa đơn VAT thành công.',
    EINVOICE_ISSUED: 'Phát hành hóa đơn điện tử thành công.',
    EINVOICE_SIGNED: 'Ký số hóa đơn điện tử thành công.',
    EINVOICE_SENT: 'Gửi hóa đơn điện tử thành công.',
    EINVOICE_CANCELLED: 'Hủy hóa đơn điện tử thành công.',
    EINVOICE_REPLACED: 'Thay thế hóa đơn điện tử thành công.',
    EINVOICE_ADJUSTED: 'Điều chỉnh hóa đơn điện tử thành công.',
    DOCUMENT_UPLOADED: 'Upload chứng từ thành công.',
    DOCUMENT_DELETED: 'Xóa chứng từ thành công.',
    DOCUMENTS_ARCHIVED: 'Lưu trữ chứng từ thành công.',
    CONFIG_UPDATED: 'Cập nhật cấu hình HĐĐT thành công.',
} as const;

/** Cấu hình mặc định */
export const BILLING_DOC_CONFIG = {
    E_INVOICE_PREFIX: 'EIV',
    DOC_CODE_PREFIX: 'DOC',
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    /** Số HĐĐT có 8 chữ số */
    EINVOICE_NUMBER_LENGTH: 8,
} as const;
