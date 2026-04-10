// src/models/Facility Management/operating-hour.model.ts

/**
 * Enum ngày trong tuần (theo chuẩn JS: 0 = Chủ nhật, 6 = Thứ 7)
 */
export const DAY_OF_WEEK_MAP: Record<number, string> = {
    0: 'Chủ nhật',
    1: 'Thứ 2',
    2: 'Thứ 3',
    3: 'Thứ 4',
    4: 'Thứ 5',
    5: 'Thứ 6',
    6: 'Thứ 7',
};

/**
 * Entity đầy đủ của bảng facility_operation_hours
 */
export interface OperatingHour {
    operation_hours_id: string;
    facility_id: string;
    day_of_week: number;
    open_time: string;
    close_time: string;
    is_closed: boolean;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;

    facility_name?: string;
    day_name?: string;
}

/**
 * DTO tạo giờ hoạt động mới
 */
export interface CreateOperatingHourInput {
    facility_id: string;
    day_of_week: number;
    open_time?: string;
    close_time?: string;
    is_closed?: boolean;
}

/**
 * DTO cập nhật giờ hoạt động
 */
export interface UpdateOperatingHourInput {
    open_time?: string;
    close_time?: string;
    is_closed?: boolean;
}
