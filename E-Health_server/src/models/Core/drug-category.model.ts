/**
 * Entity đại diện cho Nhóm thuốc
 */
export interface DrugCategory {
    drug_categories_id: string;
    code: string;
    name: string;
    description: string | null;
    deleted_at?: Date | null;
}

/**
 * Payload tạo mới nhóm thuốc
 */
export interface CreateDrugCategoryInput {
    code: string;
    name: string;
    description?: string;
}

/**
 * Payload cập nhật nhóm thuốc
 */
export interface UpdateDrugCategoryInput {
    name?: string;
    description?: string;
}

/**
 * Model trả về khi phân trang
 */
export interface PaginatedDrugCategories {
    data: DrugCategory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
