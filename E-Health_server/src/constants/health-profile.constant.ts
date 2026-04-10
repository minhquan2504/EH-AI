
/** Mức độ rủi ro sức khỏe bệnh nhân */
export const RISK_LEVEL = {
    LOW: 'LOW',
    MODERATE: 'MODERATE',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
} as const;

/** Loại cảnh báo y tế tự động (tính runtime, không lưu DB) */
export const AUTO_ALERT_TYPE = {
    CRITICAL_ALLERGY: 'CRITICAL_ALLERGY',
    CHRONIC_CONDITION: 'CHRONIC_CONDITION',
    INSURANCE_EXPIRING: 'INSURANCE_EXPIRING',
    INSURANCE_EXPIRED: 'INSURANCE_EXPIRED',
    NO_RECENT_VISIT: 'NO_RECENT_VISIT',
    ACTIVE_TREATMENT: 'ACTIVE_TREATMENT',
} as const;

/** Loại cảnh báo y tế thủ công (BS tạo, lưu DB) */
export const MANUAL_ALERT_TYPE = {
    MANUAL_NOTE: 'MANUAL_NOTE',
    DRUG_WARNING: 'DRUG_WARNING',
    CONDITION_NOTE: 'CONDITION_NOTE',
} as const;

/** Mức độ nghiêm trọng của cảnh báo */
export const ALERT_SEVERITY = {
    INFO: 'INFO',
    WARNING: 'WARNING',
    CRITICAL: 'CRITICAL',
} as const;

/** Ngưỡng cảnh báo tự động */
export const ALERT_THRESHOLDS = {
    /** Số ngày trước khi BH hết hạn → cảnh báo INSURANCE_EXPIRING */
    INSURANCE_EXPIRY_WARNING_DAYS: 30,
    /** Số tháng không khám → cảnh báo NO_RECENT_VISIT (chỉ áp dụng BN mãn tính) */
    NO_VISIT_WARNING_MONTHS: 6,
    /** Số tháng tiền sử bệnh ACTIVE → coi là mãn tính */
    CHRONIC_CONDITION_MONTHS: 12,
} as const;

/** Cấu hình phân trang & giới hạn */
export const HEALTH_PROFILE_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    /** Số chẩn đoán gần nhất hiển thị trong profile */
    RECENT_DIAGNOSES_LIMIT: 10,
    /** Số thuốc đang dùng tối đa */
    CURRENT_MEDICATIONS_LIMIT: 50,
    /** Số cảnh báo tối đa hiển thị */
    MAX_ALERTS: 50,
} as const;

/** Thông báo lỗi */
export const HEALTH_PROFILE_ERRORS = {
    PATIENT_NOT_FOUND: 'Bệnh nhân không tồn tại hoặc đã bị xóa',
    ALERT_NOT_FOUND: 'Cảnh báo y tế không tồn tại',
    ALERT_NOT_MANUAL: 'Không thể chỉnh sửa cảnh báo tự động. Chỉ cảnh báo thủ công mới có thể sửa/xóa.',
    ALERT_NOT_BELONG: 'Cảnh báo không thuộc bệnh nhân này',
    MISSING_ALERT_TITLE: 'Tiêu đề cảnh báo là bắt buộc',
    MISSING_ALERT_TYPE: 'Loại cảnh báo là bắt buộc',
    INVALID_ALERT_TYPE: `Loại cảnh báo không hợp lệ. Cho phép: MANUAL_NOTE, DRUG_WARNING, CONDITION_NOTE`,
    INVALID_SEVERITY: `Mức độ nghiêm trọng không hợp lệ. Cho phép: INFO, WARNING, CRITICAL`,
    INVALID_RISK_LEVEL: `Mức độ rủi ro không hợp lệ. Cho phép: LOW, MODERATE, HIGH, CRITICAL`,
    MISSING_NOTES: 'Ghi chú EHR không được để trống',
} as const;

/** Thông báo thành công */
export const HEALTH_PROFILE_SUCCESS = {
    PROFILE_FETCHED: 'Lấy hồ sơ sức khỏe tổng hợp thành công',
    SUMMARY_FETCHED: 'Lấy tóm tắt sức khỏe thành công',
    VITALS_FETCHED: 'Lấy sinh hiệu gần nhất thành công',
    CONDITIONS_FETCHED: 'Lấy danh sách bệnh lý đang hoạt động thành công',
    ALLERGIES_FETCHED: 'Lấy danh sách dị ứng thành công',
    MEDICATIONS_FETCHED: 'Lấy danh sách thuốc đang dùng thành công',
    DIAGNOSIS_HISTORY_FETCHED: 'Lấy lịch sử chẩn đoán thành công',
    INSURANCE_STATUS_FETCHED: 'Lấy tình trạng bảo hiểm thành công',
    ALERTS_FETCHED: 'Lấy danh sách cảnh báo y tế thành công',
    ALERT_CREATED: 'Thêm cảnh báo y tế thành công',
    ALERT_UPDATED: 'Cập nhật cảnh báo y tế thành công',
    ALERT_DELETED: 'Xóa cảnh báo y tế thành công',
    NOTES_UPDATED: 'Cập nhật ghi chú EHR thành công',
} as const;
