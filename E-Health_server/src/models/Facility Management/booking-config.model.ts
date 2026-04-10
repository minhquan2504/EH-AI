/**
 * Interface và Type cho Module 2.12 – Cấu hình Quy tắc đặt khám.
 */

/** Entity thô từ bảng booking_configurations (các field NULLable) */
export interface BookingConfigEntity {
    config_id: string;
    facility_id: string;
    branch_id: string;
    max_patients_per_slot: number | null;
    buffer_duration: number | null;
    advance_booking_days: number | null;
    minimum_booking_hours: number | null;
    cancellation_allowed_hours: number | null;
    created_at: string;
    updated_at: string;
}

/**
 * Cấu hình đã kết hợp (Branch Override + Global Fallback).
 */
export interface ResolvedBookingConfig {
    branch_id: string;
    max_patients_per_slot: number;
    buffer_duration: number;
    advance_booking_days: number;
    minimum_booking_hours: number;
    cancellation_allowed_hours: number;
    /** Ghi chú nguồn gốc từng field (từ 'branch' hay 'global' hay 'default') */
    sources: Record<string, 'branch' | 'global' | 'default'>;
}

/** Input cho việc tạo/cập nhật cấu hình chi nhánh (tất cả optional) */
export interface UpdateBookingConfigInput {
    max_patients_per_slot?: number | null;
    buffer_duration?: number | null;
    advance_booking_days?: number | null;
    minimum_booking_hours?: number | null;
    cancellation_allowed_hours?: number | null;
}
