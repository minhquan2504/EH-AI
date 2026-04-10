/** Liên kết ca làm việc - dịch vụ cơ sở */
export interface ShiftService {
    shift_service_id: string;
    shift_id: string;
    facility_service_id: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    /** JOIN fields */
    shift_code?: string;
    shift_name?: string;
    start_time?: string;
    end_time?: string;
    service_code?: string;
    service_name?: string;
    base_price?: string;
    estimated_duration_minutes?: number;
}

/** Input tạo liên kết đơn */
export interface CreateShiftServiceInput {
    shift_id: string;
    facility_service_id: string;
}

/** Input tạo liên kết hàng loạt */
export interface BulkCreateShiftServiceInput {
    shift_id: string;
    facility_service_ids: string[];
}
