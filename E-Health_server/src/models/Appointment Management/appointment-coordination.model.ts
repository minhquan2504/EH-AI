// src/models/Appointment Management/appointment-coordination.model.ts

/** Log thao tác điều phối */
export interface CoordinationLog {
    id: string;
    appointment_id: string;
    action_type: 'REASSIGN_DOCTOR' | 'SET_PRIORITY' | 'AUTO_ASSIGN';
    old_value?: string | null;
    new_value?: string | null;
    reason?: string | null;
    performed_by?: string | null;
    created_at: string;
    // Join fields
    performed_by_name?: string;
    appointment_code?: string;
}

/** Thông tin tải bác sĩ */
export interface DoctorLoadInfo {
    doctor_id: string;
    doctor_name: string;
    specialty_name: string;
    shift_name: string;
    total_slots: number;
    booked_count: number;
    available_count: number;
    load_percentage: number;
    status: 'LIGHT' | 'NORMAL' | 'HEAVY' | 'OVERLOADED';
}

/** Gợi ý slot */
export interface SlotSuggestion {
    slot_id: string;
    start_time: string;
    end_time: string;
    shift_name: string;
    booked_count: number;
    max_capacity: number;
    recommended_doctor?: {
        doctor_id: string;
        doctor_name: string;
        specialty_name: string;
        current_load: number;
    };
    score: number;
    reasons: string[];
}

/** Dashboard cân bằng tải */
export interface BalanceOverview {
    date: string;
    total_doctors: number;
    total_appointments: number;
    avg_load: number;
    max_load: number;
    min_load: number;
    balance_score: number;
    overloaded_doctors: DoctorLoadInfo[];
    underloaded_doctors: DoctorLoadInfo[];
    suggestions: string[];
}

/** Input tạo coordination log */
export interface CreateCoordinationLogInput {
    id: string;
    appointment_id: string;
    action_type: string;
    old_value?: string;
    new_value?: string;
    reason?: string;
    performed_by?: string;
}
