// src/models/Facility Management/staff-schedule.model.ts

export interface StaffSchedule {
    staff_schedules_id: string;
    user_id: string;
    medical_room_id: string;
    shift_id: string;
    working_date: Date | string;
    start_time: string;
    end_time: string;
    is_leave: boolean;
    leave_reason?: string;
    status: 'ACTIVE' | 'SUSPENDED';

    full_name?: string;
    shift_name?: string;
    room_name?: string;
}

export interface CreateStaffScheduleInput {
    user_id: string;
    medical_room_id: string;
    shift_id: string;
    working_date: string;
    start_time: string;
    end_time: string;
}

export interface UpdateStaffScheduleInput {
    medical_room_id?: string;
    shift_id?: string;
    working_date?: string;
    is_leave?: boolean;
    leave_reason?: string;
    start_time?: string;
    end_time?: string;
    status?: 'ACTIVE' | 'SUSPENDED';
}
