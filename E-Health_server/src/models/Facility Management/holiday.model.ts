// src/models/Facility Management/holiday.model.ts

/**
 * Entity đầy đủ bảng facility_holidays
 */
export interface Holiday {
    holiday_id: string;
    facility_id: string;
    holiday_date: string;
    title: string;
    is_closed: boolean;
    special_open_time: string | null;
    special_close_time: string | null;
    description: string | null;
    is_recurring: boolean;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;

    facility_name?: string;
}

/**
 * DTO tạo ngày lễ mới
 */
export interface CreateHolidayInput {
    facility_id: string;
    holiday_date: string;
    title: string;
    is_closed?: boolean;
    special_open_time?: string | null;
    special_close_time?: string | null;
    description?: string | null;
    is_recurring?: boolean;
}

/**
 * DTO cập nhật ngày lễ
 */
export interface UpdateHolidayInput {
    title?: string;
    is_closed?: boolean;
    special_open_time?: string | null;
    special_close_time?: string | null;
    description?: string | null;
    is_recurring?: boolean;
}
