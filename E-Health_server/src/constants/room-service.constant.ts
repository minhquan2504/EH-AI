export const ROOM_SERVICE_ERRORS = {
    ROOM_NOT_FOUND: 'Phòng không tồn tại hoặc đã bị xoá.',
    SERVICE_NOT_FOUND: 'Dịch vụ cơ sở không tồn tại.',
    ALREADY_ASSIGNED: 'Dịch vụ này đã được gán cho phòng rồi.',
    NOT_ASSIGNED: 'Dịch vụ này chưa được gán cho phòng.',
    MISSING_SERVICE_IDS: 'Vui lòng cung cấp danh sách facility_service_ids.',
} as const;

export const ROOM_SERVICE_SUCCESS = {
    ASSIGNED: 'Gán dịch vụ cho phòng thành công.',
    LIST_FETCHED: 'Lấy danh sách dịch vụ của phòng thành công.',
    REMOVED: 'Gỡ dịch vụ khỏi phòng thành công.',
} as const;
