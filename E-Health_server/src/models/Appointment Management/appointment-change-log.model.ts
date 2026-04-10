/** Log thay đổi lịch khám (dời / hủy) */
export interface AppointmentChangeLog {
    id: string;
    appointment_id: string;
    change_type: 'RESCHEDULE' | 'CANCEL';
    old_date?: string | null;
    old_slot_id?: string | null;
    new_date?: string | null;
    new_slot_id?: string | null;
    reason?: string | null;
    changed_by?: string | null;
    policy_checked: boolean;
    policy_result?: string | null;
    created_at: string;


    changed_by_name?: string;
    appointment_code?: string;
    patient_name?: string;
    old_slot_time?: string;
    new_slot_time?: string;
}

/** Input tạo change log */
export interface CreateChangeLogInput {
    id: string;
    appointment_id: string;
    change_type: 'RESCHEDULE' | 'CANCEL';
    old_date?: string | null;
    old_slot_id?: string | null;
    new_date?: string | null;
    new_slot_id?: string | null;
    reason?: string;
    changed_by?: string;
    policy_checked?: boolean;
    policy_result?: string;
}
