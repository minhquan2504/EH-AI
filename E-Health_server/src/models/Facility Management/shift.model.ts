// src/models/shift.model.ts
export interface Shift {
    shifts_id: string;
    facility_id: string;
    code: string;
    name: string;
    start_time: string;
    end_time: string;
    description?: string;
    status: 'ACTIVE' | 'INACTIVE';
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date | null;
}

export interface CreateShiftInput {
    facility_id: string;
    code: string;
    name: string;
    start_time: string;
    end_time: string;
    description?: string;
}

export interface UpdateShiftInput {
    code?: string;
    name?: string;
    start_time?: string;
    end_time?: string;
    description?: string;
    status?: 'ACTIVE' | 'INACTIVE';
}
