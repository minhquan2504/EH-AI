
/** Trạng thái encounter */
export type EncounterStatus = 'IN_PROGRESS' | 'WAITING_FOR_RESULTS' | 'COMPLETED' | 'CLOSED';

/** Loại encounter */
export type EncounterType = 'FIRST_VISIT' | 'FOLLOW_UP' | 'OUTPATIENT' | 'INPATIENT' | 'EMERGENCY' | 'TELEMED';

/** Bản ghi encounter */
export interface Encounter {
    encounters_id: string;
    appointment_id: string | null;
    patient_id: string;
    doctor_id: string;
    room_id: string;
    encounter_type: EncounterType;
    start_time: string;
    end_time: string | null;
    status: EncounterStatus;
    visit_number: number;
    notes: string | null;
    created_at: string;
    updated_at: string;

    patient_name?: string;
    patient_code?: string;
    doctor_name?: string;
    doctor_title?: string;
    specialty_name?: string;
    room_name?: string;
    room_code?: string;
    appointment_code?: string;
}

/** Tạo encounter walk-in / cấp cứu (không từ appointment) */
export interface CreateEncounterInput {
    patient_id: string;
    doctor_id: string;
    room_id: string;
    encounter_type?: EncounterType;
    notes?: string;
}

/** Tạo encounter từ lịch khám */
export interface CreateEncounterFromAppointmentInput {
    encounter_type?: EncounterType;
    notes?: string;

    doctor_id?: string;

    room_id?: string;
}

/** Cập nhật encounter */
export interface UpdateEncounterInput {
    encounter_type?: EncounterType;
    notes?: string;
}

/** Bộ lọc danh sách encounter */
export interface EncounterFilter {
    patient_id?: string;
    doctor_id?: string;
    room_id?: string;
    encounter_type?: string;
    status?: string;
    from_date?: string;
    to_date?: string;
    keyword?: string;
    page: number;
    limit: number;
}
