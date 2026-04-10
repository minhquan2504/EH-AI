/**
 * Interface Types cho Module 2.10 - Quản lý Trang thiết bị y tế
 */

/** Thông tin thiết bị y tế */
export interface MedicalEquipment {
    equipment_id: string;
    facility_id: string;
    branch_id: string;
    code: string;
    name: string;
    serial_number: string | null;
    manufacturer: string | null;
    manufacturing_date: string | null;
    purchase_date: string | null;
    warranty_expiration: string | null;
    status: string;
    current_room_id: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;

    branch_name?: string;
    room_name?: string;
    room_code?: string;
    facility_name?: string;
}

/** Input tạo mới thiết bị */
export interface CreateEquipmentInput {
    facility_id: string;
    branch_id: string;
    code: string;
    name: string;
    serial_number?: string;
    manufacturer?: string;
    manufacturing_date?: string;
    purchase_date?: string;
    warranty_expiration?: string;
    status?: string;
    current_room_id?: string;
}

/** Input cập nhật thiết bị */
export interface UpdateEquipmentInput {
    name?: string;
    serial_number?: string;
    manufacturer?: string;
    manufacturing_date?: string;
    purchase_date?: string;
    warranty_expiration?: string;
}

/** Input gán phòng cho thiết bị */
export interface AssignRoomInput {
    room_id: string | null;
}

/** Kết quả phân trang thiết bị */
export interface PaginatedEquipments {
    data: MedicalEquipment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/** Thông tin bản ghi bảo trì / kiểm định */
export interface EquipmentMaintenanceLog {
    log_id: string;
    equipment_id: string;
    maintenance_date: string;
    maintenance_type: string;
    description: string | null;
    performed_by: string | null;
    cost: number;
    next_maintenance_date: string | null;
    created_at: string;
    updated_at: string;

    equipment_name?: string;
    equipment_code?: string;
}

/** Input tạo mới log bảo trì */
export interface CreateMaintenanceLogInput {
    maintenance_date: string;
    maintenance_type: string;
    description?: string;
    performed_by?: string;
    cost?: number;
    next_maintenance_date?: string;
}

/** Input cập nhật log bảo trì */
export interface UpdateMaintenanceLogInput {
    maintenance_date?: string;
    maintenance_type?: string;
    description?: string;
    performed_by?: string;
    cost?: number;
    next_maintenance_date?: string;
}

/** Kết quả phân trang log bảo trì */
export interface PaginatedMaintenanceLogs {
    data: EquipmentMaintenanceLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
