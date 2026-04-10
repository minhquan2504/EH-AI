export enum FacilityStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED'
}

export const FACILITY_ERRORS = {
    FACILITY_NOT_FOUND: {
        success: false,
        code: 'FAC_001',
        message: 'Không tìm thấy thông tin cơ sở y tế hoặc cơ sở đã bị xóa.',
        statusCode: 404
    },
    FACILITY_CODE_EXISTS: {
        success: false,
        code: 'FAC_002',
        message: 'Mã cơ sở y tế (code) đã tồn tại. Xin vui lòng chọn mã khác.',
        statusCode: 400
    },
    FACILITY_STILL_ACTIVE: {
        success: false,
        code: 'FAC_003',
        message: 'Không thể xóa cứng cơ sở y tế đang có chi nhánh/bác sĩ hoạt động. Hãy chuyển trạng thái thay vì xóa.',
        statusCode: 400
    }
};
