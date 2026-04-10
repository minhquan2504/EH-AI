export enum DepartmentStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    UNDER_MAINTENANCE = 'UNDER_MAINTENANCE'
}

export const DEPARTMENT_MESSAGES = {
    CREATE_SUCCESS: 'Tạo khoa/phòng ban thành công',
    UPDATE_SUCCESS: 'Cập nhật thông tin khoa/phòng ban thành công',
    STATUS_UPDATE_SUCCESS: 'Cập nhật trạng thái thành công',
    DELETE_SUCCESS: 'Xóa khoa/phòng ban thành công',
} as const;

export const DEPARTMENT_ERRORS = {
    NOT_FOUND: {
        httpCode: 404,
        code: 'DEPT_001',
        message: 'Khoa/Phòng ban không tồn tại hoặc đã bị xóa.',
    },
    CODE_EXISTS: {
        httpCode: 400,
        code: 'DEPT_002',
        message: 'Mã khoa này đã tồn tại trong cùng chi nhánh! Hệ thống không cho phép trùng lặp.',
    },
    BRANCH_NOT_FOUND: {
        httpCode: 400,
        code: 'DEPT_003',
        message: 'Chi nhánh quản lý không hợp lệ hoặc đã bị vô hiệu hóa.',
    },
    INVALID_STATUS: {
        httpCode: 400,
        code: 'DEPT_004',
        message: `Trạng thái không hợp lệ. Phải là một trong: ${Object.values(DepartmentStatus).join(', ')}`,
    },
    CODE_IMMUTABLE: {
        httpCode: 400,
        code: 'DEPT_005',
        message: 'Bạn không được phép thay đổi Mã khoa và mã Chi nhánh để đảm bảo tính toàn vẹn phân cấp.',
    }
} as const;
