
/** Trạng thái phiếu khám lâm sàng */
export const CLINICAL_EXAM_STATUS = {
    DRAFT: 'DRAFT',
    FINAL: 'FINAL',
} as const;

/** Phân loại mức độ bệnh */
export const SEVERITY_LEVEL = {
    MILD: 'MILD',
    MODERATE: 'MODERATE',
    SEVERE: 'SEVERE',
    CRITICAL: 'CRITICAL',
} as const;

/** Danh sách giá trị hợp lệ */
export const VALID_SEVERITY_LEVELS = Object.values(SEVERITY_LEVEL);

/** Ngưỡng bình thường cho sinh hiệu (dùng để đánh dấu bất thường) */
export const VITAL_SIGN_NORMAL_RANGES = {
    pulse: { min: 60, max: 100, unit: 'bpm' },
    blood_pressure_systolic: { min: 90, max: 140, unit: 'mmHg' },
    blood_pressure_diastolic: { min: 60, max: 90, unit: 'mmHg' },
    temperature: { min: 36.0, max: 37.5, unit: '°C' },
    respiratory_rate: { min: 12, max: 20, unit: 'lần/phút' },
    spo2: { min: 95, max: 100, unit: '%' },
    blood_glucose: { min: 3.9, max: 7.0, unit: 'mmol/L' },
} as const;

/** Cấu hình phân trang */
export const CLINICAL_EXAM_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;

/** Thông báo lỗi */
export const CLINICAL_EXAM_ERRORS = {
    ENCOUNTER_NOT_FOUND: 'Lượt khám không tồn tại hoặc đã bị xóa',
    ENCOUNTER_NOT_EDITABLE: 'Lượt khám đã hoàn tất hoặc đóng, không thể ghi nhận khám lâm sàng',
    ALREADY_EXISTS: 'Phiếu khám lâm sàng đã tồn tại cho lượt khám này. Vui lòng cập nhật thay vì tạo mới.',
    NOT_FOUND: 'Chưa có phiếu khám lâm sàng cho lượt khám này',
    ALREADY_FINALIZED: 'Phiếu khám lâm sàng đã được xác nhận (FINAL), không thể chỉnh sửa. Chỉ có thể cập nhật sinh hiệu.',
    NOT_DRAFT: 'Chỉ có thể xác nhận phiếu khám đang ở trạng thái DRAFT',
    MISSING_CHIEF_COMPLAINT: 'Phải ghi nhận triệu chứng chính (chief_complaint) trước khi xác nhận phiếu khám',
    MISSING_VITALS: 'Phải có ít nhất 1 chỉ số sinh hiệu trước khi xác nhận phiếu khám',
    INVALID_SEVERITY: 'Mức độ bệnh không hợp lệ. Giá trị cho phép: MILD, MODERATE, SEVERE, CRITICAL',
    PATIENT_NOT_FOUND: 'Bệnh nhân không tồn tại trong hệ thống',
} as const;

/** Thông báo thành công */
export const CLINICAL_EXAM_SUCCESS = {
    CREATED: 'Ghi nhận khám lâm sàng thành công',
    UPDATED: 'Cập nhật phiếu khám lâm sàng thành công',
    VITALS_UPDATED: 'Cập nhật sinh hiệu thành công',
    FINALIZED: 'Hoàn tất phiếu khám lâm sàng',
    DETAIL_FETCHED: 'Lấy chi tiết khám lâm sàng thành công',
    HISTORY_FETCHED: 'Lấy lịch sử khám lâm sàng thành công',
    SUMMARY_FETCHED: 'Lấy tóm tắt khám lâm sàng thành công',
} as const;
