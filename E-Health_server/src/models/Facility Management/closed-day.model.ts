// src/models/Facility Management/closed-day.model.ts
import { DAY_OF_WEEK_MAP } from './operating-hour.model';

// Re-export để tiện dùng
export { DAY_OF_WEEK_MAP };

/**
 * Entity đầy đủ bảng facility_closed_days
 */
export interface ClosedDay {
    closed_day_id: string;
    facility_id: string;
    day_of_week: number;
    title: string;
    start_time: string;
    end_time: string;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;

    /** Tên cơ sở (JOIN) */
    facility_name?: string;
    /** Tên ngày tiếng Việt (computed) */
    day_name?: string;
}

/**
 * DTO tạo ngày nghỉ mới
 */
export interface CreateClosedDayInput {
    facility_id: string;
    day_of_week: number;
    title: string;
    start_time: string;
    end_time: string;
}
