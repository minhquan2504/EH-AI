/**
 * Hằng số cho Module 3.2.6 – Phân biệt ca khám theo dịch vụ.
 */

/** Mã lỗi */
export const SHIFT_SERVICE_ERRORS = {
    SHIFT_NOT_FOUND: 'Ca làm việc không tồn tại hoặc đã bị vô hiệu hoá.',
    SERVICE_NOT_FOUND: 'Dịch vụ cơ sở không tồn tại hoặc đã bị vô hiệu hoá.',
    MAPPING_EXISTS: 'Liên kết ca-dịch vụ này đã tồn tại.',
    MAPPING_NOT_FOUND: 'Liên kết ca-dịch vụ không tồn tại.',
    MISSING_SHIFT_ID: 'Thiếu mã ca làm việc (shift_id).',
    MISSING_SERVICE_ID: 'Thiếu mã dịch vụ cơ sở (facility_service_id).',
    MISSING_SERVICE_IDS: 'Thiếu danh sách facility_service_ids.',
} as const;

/** Thông báo thành công */
export const SHIFT_SERVICE_SUCCESS = {
    CREATED: 'Gán dịch vụ cho ca khám thành công.',
    BULK_CREATED: 'Gán hàng loạt dịch vụ cho ca khám thành công.',
    LIST_FETCHED: 'Lấy danh sách liên kết ca-dịch vụ thành công.',
    BY_SHIFT_FETCHED: 'Lấy danh sách dịch vụ theo ca thành công.',
    BY_SERVICE_FETCHED: 'Lấy danh sách ca khám theo dịch vụ thành công.',
    DELETED: 'Xoá liên kết ca-dịch vụ thành công.',
    TOGGLED: 'Cập nhật trạng thái liên kết ca-dịch vụ thành công.',
} as const;
