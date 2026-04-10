/** Trạng thái kế hoạch điều trị */
export const TREATMENT_PLAN_STATUS = {
    ACTIVE: 'ACTIVE',
    ON_HOLD: 'ON_HOLD',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
} as const;

/** Transition hợp lệ cho state machine */
export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
    ACTIVE: ['ON_HOLD', 'COMPLETED', 'CANCELLED'],
    ON_HOLD: ['ACTIVE', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
} as const;

/** Loại ghi nhận diễn tiến */
export const PROGRESS_NOTE_TYPE = {
    PROGRESS: 'PROGRESS',
    REACTION: 'REACTION',
    SYMPTOM_CHANGE: 'SYMPTOM_CHANGE',
    FOLLOW_UP: 'FOLLOW_UP',
    PLAN_UPDATE: 'PLAN_UPDATE',
    COMPLICATION: 'COMPLICATION',
    OTHER: 'OTHER',
} as const;

/** Mức độ nghiêm trọng */
export const NOTE_SEVERITY = {
    NORMAL: 'NORMAL',
    IMPORTANT: 'IMPORTANT',
    CRITICAL: 'CRITICAL',
} as const;

/** Cấu hình phân trang */
export const TREATMENT_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    RECENT_NOTES_LIMIT: 5,
    SUMMARY_NOTES_LIMIT: 10,
} as const;

/** Thông báo lỗi */
export const TREATMENT_ERRORS = {
    PLAN_NOT_FOUND: 'Không tìm thấy kế hoạch điều trị',
    PATIENT_NOT_FOUND: 'Bệnh nhân không tồn tại',
    NOTE_NOT_FOUND: 'Không tìm thấy ghi nhận diễn tiến',
    ENCOUNTER_NOT_FOUND: 'Lượt khám không tồn tại',
    PLAN_NOT_ACTIVE: 'Kế hoạch không ở trạng thái cho phép thao tác',
    INVALID_TRANSITION: 'Chuyển trạng thái không hợp lệ',
    MISSING_REASON: 'Thiếu lý do khi chuyển trạng thái',
    INVALID_NOTE_TYPE: 'Loại ghi nhận không hợp lệ',
    INVALID_SEVERITY: 'Mức độ nghiêm trọng không hợp lệ',
    NOT_NOTE_AUTHOR: 'Chỉ tác giả ghi nhận mới có quyền sửa/xóa',
    SAME_ENCOUNTER: 'Encounter trước và encounter tái khám không được trùng nhau',
    DIFFERENT_PATIENT: 'Encounter tái khám phải thuộc cùng bệnh nhân',
    DUPLICATE_LINK: 'Liên kết tái khám đã tồn tại',
    MISSING_REQUIRED: 'Thiếu thông tin bắt buộc',
} as const;

/** Thông báo thành công */
export const TREATMENT_SUCCESS = {
    PLAN_CREATED: 'Tạo kế hoạch điều trị thành công',
    PLAN_FETCHED: 'Lấy chi tiết kế hoạch thành công',
    PLAN_UPDATED: 'Cập nhật kế hoạch thành công',
    PLAN_STATUS_CHANGED: 'Chuyển trạng thái kế hoạch thành công',
    PATIENT_PLANS_FETCHED: 'Lấy danh sách kế hoạch thành công',
    NOTE_CREATED: 'Thêm ghi nhận diễn tiến thành công',
    NOTES_FETCHED: 'Lấy danh sách ghi nhận thành công',
    NOTE_UPDATED: 'Cập nhật ghi nhận thành công',
    NOTE_DELETED: 'Xóa ghi nhận thành công',
    FOLLOWUP_CREATED: 'Liên kết tái khám thành công',
    CHAIN_FETCHED: 'Lấy chuỗi tái khám thành công',
    SUMMARY_FETCHED: 'Lấy tổng hợp điều trị thành công',
} as const;
