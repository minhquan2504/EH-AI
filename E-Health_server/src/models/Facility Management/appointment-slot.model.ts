// src/models/appointment-slot.model.ts

export interface AppointmentSlot {
    slot_id: string;
    shift_id: string;
    start_time: string;
    end_time: string;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface CreateAppointmentSlotInput {
    shift_id: string;
    start_time: string;
    end_time: string;
}

export interface BulkCreateAppointmentSlotInput {
    shift_id: string;
    interval_minutes: number;
}

export interface UpdateAppointmentSlotInput {
    shift_id?: string;
    start_time?: string;
    end_time?: string;
    is_active?: boolean;
}
