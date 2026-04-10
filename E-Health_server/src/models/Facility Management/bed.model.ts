/**
 * Interface Types cho Module 2.11 - Quản lý Giường bệnh
 */

/** Thông tin giường bệnh */
export interface Bed {
    bed_id: string;
    facility_id: string;
    branch_id: string;
    department_id: string | null;
    room_id: string | null;
    name: string;
    code: string;
    type: string;
    status: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;

    /** JOIN fields */
    facility_name?: string;
    branch_name?: string;
    department_name?: string;
    room_name?: string;
    room_code?: string;
}

/** Input tạo mới giường */
export interface CreateBedInput {
    facility_id: string;
    branch_id: string;
    department_id?: string;
    room_id?: string;
    name: string;
    code: string;
    type?: string;
    status?: string;
    description?: string;
}

/** Input cập nhật thông tin giường */
export interface UpdateBedInput {
    name?: string;
    code?: string;
    type?: string;
    description?: string;
}

/** Input gán giường vào phòng/khoa */
export interface AssignBedInput {
    department_id?: string | null;
    room_id?: string | null;
}

/** Kết quả phân trang giường */
export interface PaginatedBeds {
    data: Bed[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
