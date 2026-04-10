/** Phiên đặt lịch khám từ xa */
export interface TeleBookingSession {
    session_id: string;
    session_code: string;
    patient_id: string;
    specialty_id: string;
    facility_id: string;
    type_id: string;
    config_id: string | null;
    doctor_id: string | null;
    appointment_id: string | null;
    tele_consultation_id: string | null;
    invoice_id: string | null;
    booking_date: string;
    booking_start_time: string | null;
    booking_end_time: string | null;
    duration_minutes: number;
    slot_id: string | null;
    shift_id: string | null;
    platform: string;
    price_amount: string;
    price_type: string;
    status: string;
    payment_required: boolean;
    payment_status: string;
    reason_for_visit: string | null;
    symptoms_notes: string | null;
    patient_notes: string | null;
    cancellation_reason: string | null;
    cancelled_by: string | null;
    cancelled_at: Date | null;
    confirmed_at: Date | null;
    confirmed_by: string | null;
    expires_at: Date | null;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;

    // JOIN fields
    patient_name?: string;
    specialty_name?: string;
    facility_name?: string;
    type_code?: string;
    type_name?: string;
    doctor_name?: string;
    doctor_title?: string;
    slot_start_time?: string;
    slot_end_time?: string;
    shift_name?: string;
    appointment_code?: string;
    created_by_name?: string;
}

/** Tạo phiên đặt lịch */
export interface CreateBookingInput {
    patient_id: string;
    specialty_id: string;
    facility_id: string;
    type_id: string;
    config_id?: string;
    doctor_id?: string;
    booking_date: string;
    slot_id?: string;
    shift_id?: string;
    booking_start_time?: string;
    booking_end_time?: string;
    platform?: string;
    price_type?: string;
    reason_for_visit?: string;
    symptoms_notes?: string;
    patient_notes?: string;
}

/** Cập nhật phiên */
export interface UpdateBookingInput {
    doctor_id?: string;
    booking_date?: string;
    slot_id?: string;
    shift_id?: string;
    booking_start_time?: string;
    booking_end_time?: string;
    reason_for_visit?: string;
    symptoms_notes?: string;
    patient_notes?: string;
    platform?: string;
    price_type?: string;
}

/** Bộ lọc phiên */
export interface BookingFilter {
    patient_id?: string;
    doctor_id?: string;
    specialty_id?: string;
    facility_id?: string;
    type_id?: string;
    status?: string;
    payment_status?: string;
    from_date?: string;
    to_date?: string;
    keyword?: string;
    page: number;
    limit: number;
}

/** Tìm BS khả dụng */
export interface DoctorSearchInput {
    specialty_id: string;
    facility_id: string;
    date: string;
    type_id?: string;
    shift_id?: string;
}
