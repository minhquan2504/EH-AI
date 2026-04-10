
/** Mã chỉ số sinh hiệu (từ clinical_examinations) */
export const VITAL_METRICS = {
    PULSE: 'pulse',
    BP_SYSTOLIC: 'blood_pressure_systolic',
    BP_DIASTOLIC: 'blood_pressure_diastolic',
    TEMPERATURE: 'temperature',
    RESPIRATORY_RATE: 'respiratory_rate',
    SPO2: 'spo2',
    WEIGHT: 'weight',
    HEIGHT: 'height',
    BMI: 'bmi',
    BLOOD_GLUCOSE: 'blood_glucose',
} as const;

/** Nguồn ghi nhận */
export const SOURCE_TYPE = {
    SELF_REPORTED: 'SELF_REPORTED',
    CLINIC: 'CLINIC',
    DEVICE: 'DEVICE',
} as const;

/** Phân loại BMI */
export const BMI_CLASSIFICATION = {
    UNDERWEIGHT: { max: 18.5, label: 'Thiếu cân' },
    NORMAL: { min: 18.5, max: 24.9, label: 'Bình thường' },
    OVERWEIGHT: { min: 25, max: 29.9, label: 'Thừa cân' },
    OBESE: { min: 30, label: 'Béo phì' },
} as const;

/** Mức bất thường */
export const ABNORMAL_LEVEL = {
    NORMAL: 'NORMAL',
    WARNING: 'WARNING',
    CRITICAL: 'CRITICAL',
} as const;

/** Cấu hình */
export const VS_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    TREND_MAX_POINTS: 50,
    SUMMARY_LAST_N: 3,
} as const;

/** Lỗi */
export const VS_ERRORS = {
    PATIENT_NOT_FOUND: 'Bệnh nhân không tồn tại hoặc đã bị xóa',
    METRIC_TYPE_REQUIRED: 'Loại chỉ số (metric_type) là bắt buộc để xem xu hướng',
    METRIC_CODE_REQUIRED: 'Mã chỉ số (metric_code) là bắt buộc',
    METRIC_VALUE_REQUIRED: 'Giá trị chỉ số (metric_value) là bắt buộc',
    UNIT_REQUIRED: 'Đơn vị (unit) là bắt buộc',
    MEASURED_AT_REQUIRED: 'Thời gian đo (measured_at) là bắt buộc',
} as const;

/** Thành công */
export const VS_SUCCESS = {
    VITALS_FETCHED: 'Lấy lịch sử sinh hiệu thành công',
    LATEST_FETCHED: 'Lấy sinh hiệu mới nhất thành công',
    TRENDS_FETCHED: 'Lấy xu hướng sinh hiệu thành công',
    ABNORMAL_FETCHED: 'Lấy sinh hiệu bất thường thành công',
    SUMMARY_FETCHED: 'Lấy tổng hợp sinh hiệu thành công',
    METRICS_FETCHED: 'Lấy danh sách chỉ số sức khỏe thành công',
    METRIC_CREATED: 'Thêm chỉ số sức khỏe thành công',
    TIMELINE_FETCHED: 'Lấy timeline hợp nhất thành công',
} as const;
