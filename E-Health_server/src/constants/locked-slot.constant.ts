/**
 * Hằng số cho Module 3.2.5 – Khoá khung giờ không khả dụng.
 */

/** Mã lỗi */
export const LOCKED_SLOT_ERRORS = {
    MISSING_SLOT_IDS: 'Thiếu danh sách slot_ids.',
    MISSING_LOCKED_DATE: 'Thiếu ngày khoá (locked_date).',
    MISSING_SHIFT_ID: 'Thiếu mã ca làm việc (shift_id).',
    INVALID_DATE_PAST: 'Không thể khoá slot trong quá khứ. Ngày khoá phải từ hôm nay trở đi.',
    SLOT_NOT_FOUND: 'Slot khám bệnh không tồn tại hoặc đã bị vô hiệu hoá.',
    LOCKED_SLOT_NOT_FOUND: 'Bản ghi khoá slot không tồn tại hoặc đã được mở khoá.',
    SLOT_ALREADY_LOCKED: 'Slot này đã bị khoá trên ngày được chỉ định.',
    SHIFT_NOT_FOUND: 'Ca làm việc không tồn tại.',
    NO_ACTIVE_SLOTS: 'Không có slot nào đang hoạt động trong ca này.',
    NO_LOCKED_SLOTS_IN_SHIFT: 'Không có slot nào bị khoá trong ca này vào ngày được chỉ định.',
} as const;

/** Thông báo thành công */
export const LOCKED_SLOT_SUCCESS = {
    LOCKED: 'Khoá slot thành công.',
    UNLOCKED: 'Mở khoá slot thành công.',
    LIST_FETCHED: 'Lấy danh sách slot đã khoá thành công.',
    LOCKED_BY_SHIFT: 'Khoá tất cả slot trong ca thành công.',
    UNLOCKED_BY_SHIFT: 'Mở khoá tất cả slot trong ca thành công.',
} as const;
