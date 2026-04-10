// Định nghĩa enum trạng thái chi nhánh
export enum BranchStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    UNDER_MAINTENANCE = 'UNDER_MAINTENANCE'
}

// Định nghĩa mã lỗi chuẩn form cho Chi nhánh
export const BRANCH_ERRORS = {
    BRANCH_NOT_FOUND: {
        success: false,
        error_code: 'BRANCH_NOT_FOUND',
        message: 'Không tìm thấy chi nhánh y tế'
    },
    BRANCH_CODE_EXISTS: {
        success: false,
        error_code: 'BRANCH_CODE_EXISTS',
        message: 'Mã chi nhánh đã tồn tại trong hệ thống'
    },
    INVALID_FACILITY_ID: {
        success: false,
        error_code: 'INVALID_FACILITY_ID',
        message: 'Cơ sở quản lý không hợp lệ hoặc đã bị vô hiệu hóa'
    }
} as const;
