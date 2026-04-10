
/** Kho thuốc */
export interface Warehouse {
    warehouse_id: string;
    branch_id: string;
    code: string;
    name: string;
    warehouse_type: string;
    address?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;

    branch_name?: string;
    facility_name?: string;
}

/** Input tạo kho */
export interface CreateWarehouseInput {
    branch_id: string;
    code: string;
    name: string;
    warehouse_type?: string;
    address?: string;
}

/** Input cập nhật kho */
export interface UpdateWarehouseInput {
    name?: string;
    warehouse_type?: string;
    address?: string;
}
