// src/models/Appointment Management/appointment.model.ts

/** Trạng thái lịch khám (State Machine) */
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'CANCELLED' | 'NO_SHOW' | 'COMPLETED' | 'SKIPPED';

/** Kênh đặt lịch */
export type BookingChannel = 'APP' | 'WEB' | 'HOTLINE' | 'DIRECT_CLINIC' | 'ZALO';

export interface Appointment {
    appointments_id: string;
    appointment_code: string;
    patient_id: string;
    branch_id: string;
    doctor_id?: string | null;
    slot_id?: string | null;
    room_id?: string | null;
    facility_service_id?: string | null;
    appointment_date: string;
    booking_channel: BookingChannel;
    reason_for_visit?: string;
    symptoms_notes?: string;
    status: AppointmentStatus;
    confirmed_at?: string | null;
    confirmed_by?: string | null;
    checked_in_at?: string | null;
    cancelled_at?: string | null;
    cancellation_reason?: string | null;
    created_at: string;
    updated_at: string;


    branch_name?: string;
    patient_name?: string;
    doctor_name?: string;
    room_name?: string;
    service_name?: string;
    slot_start_time?: string;
    slot_end_time?: string;


    queue_number?: number | null;
    check_in_method?: string | null;
    qr_token?: string | null;
    qr_token_expires_at?: string | null;
    is_late?: boolean;
    late_minutes?: number;
    started_at?: string | null;
    completed_at?: string | null;

    reschedule_count?: number;
    last_rescheduled_at?: string | null;
    cancelled_by?: string | null;

    priority?: string;
}

export interface CreateAppointmentInput {
    patient_id: string;
    branch_id: string;
    shift_id: string;
    appointment_date: string;
    booking_channel: BookingChannel;
    reason_for_visit?: string;
    symptoms_notes?: string;
    facility_service_id?: string;

    slot_id?: string;
    doctor_id?: string;
    room_id?: string;
}

export interface UpdateAppointmentInput {
    appointment_date?: string;
    reason_for_visit?: string;
    symptoms_notes?: string;
    doctor_id?: string;
    slot_id?: string;
    room_id?: string;
    facility_service_id?: string;
}
