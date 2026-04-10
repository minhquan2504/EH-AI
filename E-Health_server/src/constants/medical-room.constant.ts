// src\constants\medical-room.constant.ts
export enum MedicalRoomStatus {
    ACTIVE = 'ACTIVE',
    MAINTENANCE = 'MAINTENANCE',
    INACTIVE = 'INACTIVE'
}

export enum MedicalRoomType {
    CONSULTATION = 'CONSULTATION',
    LAB = 'LAB',
    IMAGING = 'IMAGING',
    OPERATING = 'OPERATING'
}

export const ROOM_MESSAGES = {
    CREATE_SUCCESS: 'Tạo phòng khám/chức năng thành công',
    UPDATE_SUCCESS: 'Cập nhật thông tin phòng thành công',
    STATUS_UPDATE_SUCCESS: 'Cập nhật trạng thái phòng thành công',
    DELETE_SUCCESS: 'Xóa phòng thành công'
} as const;

export const ROOM_ERRORS = {
    NOT_FOUND: {
        httpCode: 404,
        code: 'ROOM_001',
        message: 'Phòng không tồn tại hoặc đã bị xóa.'
    },
    CODE_EXISTS: {
        httpCode: 400,
        code: 'ROOM_002',
        message: 'Mã phòng này đã tồn tại trong cùng chi nhánh! Không thể sử dụng mã này.'
    },
    BRANCH_NOT_FOUND: {
        httpCode: 400,
        code: 'ROOM_003',
        message: 'Chi nhánh lưu trữ không hợp lệ hoặc đã bị vô hiệu hóa.'
    },
    DEPARTMENT_NOT_FOUND: {
        httpCode: 400,
        code: 'ROOM_004',
        message: 'Chuyên khoa truyền vào không hợp lệ hoặc đã bị vô hiệu hóa.'
    },
    DEPARTMENT_NOT_IN_BRANCH: {
        httpCode: 400,
        code: 'ROOM_005',
        message: 'Lỗi Logic: Chuyên khoa bạn chọn KHÔNG CÙNG NẰM TRONG Chi nhánh quản lý của Phòng này.'
    },
    INVALID_STATUS: {
        httpCode: 400,
        code: 'ROOM_006',
        message: `Trạng thái không hợp lệ. Phải là một trong: ${Object.values(MedicalRoomStatus).join(', ')}`
    },
    CODE_IMMUTABLE: {
        httpCode: 400,
        code: 'ROOM_007',
        message: 'Không được phép thay đổi Mã phòng (Code) và Mã Chi nhánh (Branch_id) của phòng đã tồn tại.'
    }
} as const;
