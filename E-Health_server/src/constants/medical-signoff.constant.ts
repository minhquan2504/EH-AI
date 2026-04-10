/** Loại chữ ký */
export const SIGN_TYPE = {
    DRAFT: 'DRAFT',
    OFFICIAL: 'OFFICIAL',
} as const;

/** Phạm vi ký */
export const SIGN_SCOPE = {
    ENCOUNTER: 'ENCOUNTER',
    CLINICAL_EXAM: 'CLINICAL_EXAM',
    DIAGNOSIS: 'DIAGNOSIS',
    PRESCRIPTION: 'PRESCRIPTION',
    MEDICAL_ORDER: 'MEDICAL_ORDER',
} as const;

/** Hành động audit log */
export const SIGNOFF_ACTION = {
    ENCOUNTER_COMPLETED: 'ENCOUNTER_COMPLETED',
    DRAFT_SIGNED: 'DRAFT_SIGNED',
    OFFICIAL_SIGNED: 'OFFICIAL_SIGNED',
    SIGN_REVOKED: 'SIGN_REVOKED',
    INTEGRITY_VERIFIED: 'INTEGRITY_VERIFIED',
} as const;

/** Trạng thái encounter cho phép complete */
export const COMPLETABLE_STATUSES = ['IN_PROGRESS', 'WAITING_FOR_RESULTS'] as const;

/** Thông báo lỗi */
export const SIGNOFF_ERRORS = {
    ENCOUNTER_NOT_FOUND: 'Lượt khám không tồn tại',
    SIGNATURE_NOT_FOUND: 'Chữ ký không tồn tại',
    NOT_COMPLETABLE: 'Lượt khám không ở trạng thái cho phép hoàn tất',
    NOT_DOCTOR_OWNER: 'Chỉ bác sĩ phụ trách hoặc ADMIN mới được xác nhận hoàn tất',
    COMPLETENESS_TOO_LOW: 'Điểm đầy đủ bệnh án chưa đạt mức tối thiểu',
    NOT_COMPLETED: 'Lượt khám chưa hoàn tất (cần status COMPLETED)',
    NOT_FINALIZED: 'Bệnh án chưa được finalize. Vui lòng finalize trước khi ký chính thức',
    ALREADY_OFFICIAL_SIGNED: 'Scope này đã có chữ ký chính thức chưa bị thu hồi',
    ALREADY_REVOKED: 'Chữ ký đã bị thu hồi trước đó',
    MISSING_REASON: 'Phải có lý do khi thu hồi chữ ký',
    MISSING_SIGNATURE_ID: 'Thiếu ID chữ ký cần thu hồi',
    ENCOUNTER_LOCKED: 'Hồ sơ đã ký chính thức, không thể chỉnh sửa',
    SNAPSHOT_NOT_FOUND: 'Không tìm thấy snapshot bệnh án',
    INVALID_SIGN_SCOPE: 'Phạm vi ký không hợp lệ',
} as const;

/** Thông báo thành công */
export const SIGNOFF_SUCCESS = {
    COMPLETED: 'Xác nhận hoàn tất khám thành công',
    DRAFT_SIGNED: 'Ký nháp hồ sơ thành công',
    OFFICIAL_SIGNED: 'Ký chính thức hồ sơ thành công — dữ liệu đã khóa',
    REVOKED: 'Thu hồi chữ ký thành công',
    SIGNATURES_FETCHED: 'Lấy danh sách chữ ký thành công',
    VERIFIED: 'Xác minh tính toàn vẹn thành công',
    AUDIT_FETCHED: 'Lấy lịch sử hành động thành công',
    LOCK_STATUS_FETCHED: 'Lấy trạng thái khóa thành công',
    PENDING_FETCHED: 'Lấy danh sách chờ ký thành công',
} as const;
