/**
 * Entity đại diện cho Từ điển Thuốc
 */
export interface Drug {
    drugs_id: string;
    drug_code: string;
    national_drug_code: string | null;
    brand_name: string;
    active_ingredients: string;
    category_id: string;
    route_of_administration: string | null;
    dispensing_unit: string;
    is_prescription_only: boolean;
    is_active: boolean;
    created_at?: Date;
}

/**
 * Payload tạo mới Thuốc
 */
export interface CreateDrugInput {
    drug_code: string;
    national_drug_code?: string;
    brand_name: string;
    active_ingredients: string;
    category_id: string;
    route_of_administration?: string;
    dispensing_unit: string;
    is_prescription_only?: boolean;
    is_active?: boolean;
}

/**
 * Payload cập nhật Thuốc
 */
export interface UpdateDrugInput {
    national_drug_code?: string;
    brand_name?: string;
    active_ingredients?: string;
    category_id?: string;
    route_of_administration?: string;
    dispensing_unit?: string;
    is_prescription_only?: boolean;
}

/**
 * Payload Khóa/Mở khóa thuốc
 */
export interface ToggleDrugStatusInput {
    is_active: boolean;
}

/**
 * Model trả về khi phân trang
 */
export interface PaginatedDrugs {
    data: Drug[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
