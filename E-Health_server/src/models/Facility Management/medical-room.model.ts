// src\models\medical-room.model.ts
export interface MedicalRoomDropdown {
    medical_rooms_id: string;
    branch_id: string;
    department_id?: string | null;
    code: string;
    name: string;
}

export interface MedicalRoomInfo extends MedicalRoomDropdown {
    room_type: string;
    capacity: number;
    status: string;
    branch_name?: string;
    department_name?: string;
}

export interface CreateMedicalRoomInput {
    branch_id: string;
    department_id?: string;
    code: string;
    name: string;
    room_type: string;
    capacity?: number;
}

export interface UpdateMedicalRoomInput {
    department_id?: string | null;
    name?: string;
    room_type?: string;
    capacity?: number;
}

export interface MedicalRoomQuery {
    page?: number;
    limit?: number;
    search?: string;
    branch_id?: string;
    department_id?: string;
    room_type?: string;
    status?: string;
}
