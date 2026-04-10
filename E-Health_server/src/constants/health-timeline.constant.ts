/**
 * Hằng số cho module Health Timeline (6.2)
 * Phân loại sự kiện y tế trên dòng thời gian sức khỏe
 */

/** Loại sự kiện TỰ ĐỘNG — query real-time từ bảng EMR */
export const AUTO_EVENT_TYPE = {
    ENCOUNTER_START: 'ENCOUNTER_START',
    ENCOUNTER_END: 'ENCOUNTER_END',
    VITALS_RECORDED: 'VITALS_RECORDED',
    DIAGNOSIS: 'DIAGNOSIS',
    LAB_ORDER: 'LAB_ORDER',
    LAB_RESULT: 'LAB_RESULT',
    PRESCRIPTION: 'PRESCRIPTION',
    EMR_FINALIZED: 'EMR_FINALIZED',
    EMR_SIGNED: 'EMR_SIGNED',
    TREATMENT_PLAN: 'TREATMENT_PLAN',
    TREATMENT_NOTE: 'TREATMENT_NOTE',
} as const;

/** Loại sự kiện THỦ CÔNG — BS tạo, lưu DB */
export const MANUAL_EVENT_TYPE = {
    MANUAL_NOTE: 'MANUAL_NOTE',
    EXTERNAL_VISIT: 'EXTERNAL_VISIT',
    EXTERNAL_LAB: 'EXTERNAL_LAB',
    EXTERNAL_PROCEDURE: 'EXTERNAL_PROCEDURE',
} as const;

/** Tất cả event types hợp lệ */
export const ALL_EVENT_TYPES = [
    ...Object.values(AUTO_EVENT_TYPE),
    ...Object.values(MANUAL_EVENT_TYPE),
] as const;

/** Cấu hình phân trang và giới hạn */
export const TIMELINE_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 30,
    MAX_LIMIT: 200,
} as const;

/** Nhãn hiển thị tiếng Việt cho mỗi loại event */
export const EVENT_TYPE_LABEL: Record<string, string> = {
    ENCOUNTER_START: 'Bắt đầu khám',
    ENCOUNTER_END: 'Kết thúc khám',
    VITALS_RECORDED: 'Ghi nhận sinh hiệu',
    DIAGNOSIS: 'Chẩn đoán',
    LAB_ORDER: 'Chỉ định CLS',
    LAB_RESULT: 'Kết quả CLS',
    PRESCRIPTION: 'Kê đơn thuốc',
    EMR_FINALIZED: 'Khóa bệnh án',
    EMR_SIGNED: 'Ký số bệnh án',
    TREATMENT_PLAN: 'Kế hoạch điều trị',
    TREATMENT_NOTE: 'Ghi nhận diễn tiến',
    MANUAL_NOTE: 'Ghi chú thủ công',
    EXTERNAL_VISIT: 'Khám ngoài hệ thống',
    EXTERNAL_LAB: 'Xét nghiệm ngoài',
    EXTERNAL_PROCEDURE: 'Thủ thuật ngoài',
};

/** Thông báo lỗi */
export const TIMELINE_ERRORS = {
    PATIENT_NOT_FOUND: 'Bệnh nhân không tồn tại hoặc đã bị xóa',
    EVENT_NOT_FOUND: 'Sự kiện không tồn tại hoặc đã bị xóa',
    EVENT_NOT_BELONG: 'Sự kiện không thuộc bệnh nhân này',
    TITLE_REQUIRED: 'Tiêu đề sự kiện là bắt buộc',
    EVENT_TIME_REQUIRED: 'Thời điểm sự kiện là bắt buộc',
    INVALID_EVENT_TYPE: 'Loại sự kiện không hợp lệ',
    ICD10_REQUIRED: 'Mã ICD-10 là bắt buộc để theo dõi tiến triển bệnh',
    ENCOUNTER_NOT_FOUND: 'Encounter không tồn tại hoặc không thuộc bệnh nhân này',
    CANNOT_DELETE_AUTO: 'Không thể xóa sự kiện tự động',
} as const;

/** Thông báo thành công */
export const TIMELINE_SUCCESS = {
    TIMELINE_FETCHED: 'Lấy dòng thời gian sức khỏe thành công',
    SUMMARY_FETCHED: 'Lấy thống kê timeline thành công',
    ENCOUNTER_EVENTS_FETCHED: 'Lấy events theo encounter thành công',
    CONDITION_TRACKED: 'Theo dõi tiến triển bệnh thành công',
    EVENT_CREATED: 'Thêm sự kiện thành công',
    EVENT_DELETED: 'Xóa sự kiện thành công',
} as const;
