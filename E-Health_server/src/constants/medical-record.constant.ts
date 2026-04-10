
/** Trọng số tính điểm completeness */
export const COMPLETENESS_WEIGHTS = {
    CLINICAL_EXAMINATION: 25,
    DIAGNOSIS_PRIMARY: 25,
    PRESCRIPTION: 20,
    MEDICAL_ORDERS_RESULTS: 15,
    DOCTOR_NOTES: 15,
} as const;

/** Điểm tối thiểu để finalize */
export const MIN_COMPLETENESS_SCORE = 50;

/** Trạng thái completeness item */
export const COMPLETENESS_STATUS = {
    COMPLETED: 'COMPLETED',
    MISSING: 'MISSING',
    PARTIAL: 'PARTIAL',
    NOT_APPLICABLE: 'NOT_APPLICABLE',
} as const;

/** Loại timeline event */
export const TIMELINE_EVENT_TYPE = {
    ENCOUNTER: 'ENCOUNTER',
    DIAGNOSIS: 'DIAGNOSIS',
    PRESCRIPTION: 'PRESCRIPTION',
    LAB_RESULT: 'LAB_RESULT',
    EMR_FINALIZED: 'EMR_FINALIZED',
    EMR_SIGNED: 'EMR_SIGNED',
    VACCINATION: 'VACCINATION',
} as const;

/** Cấu hình phân trang */
export const MEDICAL_RECORD_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    TIMELINE_DEFAULT_LIMIT: 50,
    TOP_DIAGNOSES_LIMIT: 10,
    TOP_DRUGS_LIMIT: 10,
} as const;

/** Thông báo lỗi */
export const MEDICAL_RECORD_ERRORS = {
    ENCOUNTER_NOT_FOUND: 'Không tìm thấy lượt khám',
    PATIENT_NOT_FOUND: 'Bệnh nhân không tồn tại',
    NOT_COMPLETED: 'Lượt khám chưa ở trạng thái COMPLETED. Phải hoàn tất khám trước khi finalize bệnh án.',
    ALREADY_FINALIZED: 'Bệnh án đã được hoàn tất (finalize) trước đó',
    NOT_FINALIZED: 'Bệnh án chưa được hoàn tất (finalize). Phải finalize trước khi ký số.',
    ALREADY_SIGNED: 'Bệnh án đã được ký số trước đó',
    COMPLETENESS_TOO_LOW: `Bệnh án chưa đủ điều kiện finalize. Yêu cầu completeness >= ${MIN_COMPLETENESS_SCORE}%`,
    SNAPSHOT_NOT_FOUND: 'Không tìm thấy snapshot bệnh án. Bệnh án chưa được finalize.',
    MISSING_SEARCH_QUERY: 'Thiếu từ khóa tìm kiếm hoặc bộ lọc',
} as const;

/** Thông báo thành công */
export const MEDICAL_RECORD_SUCCESS = {
    RECORD_FETCHED: 'Lấy bệnh án đầy đủ thành công',
    COMPLETENESS_FETCHED: 'Kiểm tra tính đầy đủ thành công',
    FINALIZED: 'Hoàn tất & khóa bệnh án thành công',
    SIGNED: 'Ký số bệnh án thành công',
    PATIENT_RECORDS_FETCHED: 'Lấy danh sách bệnh án thành công',
    TIMELINE_FETCHED: 'Lấy dòng thời gian thành công',
    STATISTICS_FETCHED: 'Lấy thống kê thành công',
    SNAPSHOT_FETCHED: 'Lấy snapshot bệnh án thành công',
    EXPORT_FETCHED: 'Xuất bệnh án thành công',
    SEARCH_FETCHED: 'Tìm kiếm bệnh án thành công',
} as const;
