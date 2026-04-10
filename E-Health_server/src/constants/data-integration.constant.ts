
/** Loại nguồn dữ liệu */
export const SOURCE_TYPE = {
    HOSPITAL: 'HOSPITAL',
    LAB: 'LAB',
    INSURANCE: 'INSURANCE',
    DEVICE: 'DEVICE',
    OTHER: 'OTHER',
} as const;

/** Giao thức tích hợp */
export const PROTOCOL = {
    REST_API: 'REST_API',
    HL7_FHIR: 'HL7_FHIR',
    SOAP: 'SOAP',
    MANUAL: 'MANUAL',
} as const;

/** Loại dữ liệu bên ngoài */
export const DATA_TYPE = {
    VACCINE_CERT: 'VACCINE_CERT',
    LAB_HISTORY: 'LAB_HISTORY',
    IMAGING: 'IMAGING',
    INSURANCE_CLAIM: 'INSURANCE_CLAIM',
    DISCHARGE_SUMMARY: 'DISCHARGE_SUMMARY',
    REFERRAL: 'REFERRAL',
    OTHER: 'OTHER',
} as const;

/** Trạng thái sync */
export const SYNC_STATUS = {
    PENDING: 'PENDING',
    PROCESSED: 'PROCESSED',
    FAILED: 'FAILED',
} as const;

/** Trạng thái sync thiết bị */
export const DEVICE_SYNC_STATUS = {
    SUCCESS: 'SUCCESS',
    PARTIAL: 'PARTIAL',
    FAILED: 'FAILED',
} as const;

/** Cấu hình */
export const DI_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;

/** Lỗi */
export const DI_ERRORS = {
    PATIENT_NOT_FOUND: 'Bệnh nhân không tồn tại hoặc đã bị xóa',
    SOURCE_NOT_FOUND: 'Nguồn dữ liệu không tồn tại',
    SOURCE_NAME_REQUIRED: 'Tên nguồn dữ liệu là bắt buộc',
    SOURCE_TYPE_REQUIRED: 'Loại nguồn là bắt buộc',
    RECORD_NOT_FOUND: 'Hồ sơ bên ngoài không tồn tại',
    RECORD_NOT_BELONG: 'Hồ sơ không thuộc bệnh nhân này',
    PAYLOAD_REQUIRED: 'Dữ liệu raw_payload là bắt buộc',
    PROVIDER_REQUIRED: 'Tên nhà cung cấp (provider_name) là bắt buộc',
    STATUS_REQUIRED: 'Trạng thái mới là bắt buộc',
    INVALID_STATUS: 'Trạng thái không hợp lệ (PROCESSED hoặc FAILED)',
    DEVICE_NAME_REQUIRED: 'Tên thiết bị là bắt buộc',
} as const;

/** Thành công */
export const DI_SUCCESS = {
    SOURCES_FETCHED: 'Lấy danh sách nguồn dữ liệu thành công',
    SOURCE_CREATED: 'Tạo nguồn dữ liệu thành công',
    SOURCE_UPDATED: 'Cập nhật nguồn dữ liệu thành công',
    RECORDS_FETCHED: 'Lấy danh sách hồ sơ bên ngoài thành công',
    RECORD_CREATED: 'Nhập hồ sơ bên ngoài thành công',
    RECORD_DETAIL_FETCHED: 'Lấy chi tiết hồ sơ thành công',
    STATUS_UPDATED: 'Cập nhật trạng thái sync thành công',
    DEVICE_SYNC_CREATED: 'Ghi log đồng bộ thiết bị thành công',
    DEVICE_SYNC_FETCHED: 'Lấy lịch sử đồng bộ thành công',
    SUMMARY_FETCHED: 'Lấy dashboard tổng hợp thành công',
} as const;
