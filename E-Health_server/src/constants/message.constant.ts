/**
 * Lưu trữ tập trung toàn bộ thông báo lỗi của hệ thống.
 */
export const ERROR_MESSAGES = {
    SPECIALTY_NOT_FOUND: 'Không tìm thấy thông tin chuyên khoa.',
    SPECIALTY_CODE_EXISTS: 'Mã chuyên khoa đã tồn tại trong hệ thống.',
    SPECIALTY_CODE_BOUND_TO_DOCTOR: 'Không thể cập nhật mã do đã có bác sĩ trực thuộc chuyên khoa này.',
    SPECIALTY_CANNOT_DELETE_BOUND_TO_DOCTOR: 'Không thể xóa chuyên khoa do đang có bác sĩ trực thuộc.',
    // Các lỗi chung
    INTERNAL_SERVER_ERROR: 'Đã xảy ra lỗi từ phía máy chủ.',
    INVALID_REQUEST_DATA: 'Dữ liệu đầu vào không hợp lệ.',
};

/**
 * Lưu trữ các thông báo thành công.
 */
export const SUCCESS_MESSAGES = {
    SPECIALTY_CREATED: 'Thêm mới chuyên khoa thành công.',
    SPECIALTY_UPDATED: 'Cập nhật thông tin chuyên khoa thành công.',
    SPECIALTY_FETCHED: 'Lấy dữ liệu chuyên khoa thành công.',
    SPECIALTY_DELETED: 'Xóa chuyên khoa thành công.',
};