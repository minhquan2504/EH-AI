/**
 *master_data_categories
 */
export interface MasterDataCategory {
    master_data_categories_id: string;
    code: string;
    name: string;
    description: string | null;
}

/**
 * Payload  tạo danh mục.
 */
export interface CreateCategoryInput {
    code: string;
    name: string;
    description?: string;
}

/**
 * Payloadcập nhật nhóm danh mục.
 */
export interface UpdateCategoryInput {
    name?: string;
    description?: string;
}

/**
 * phân trang.
 */
export interface PaginatedCategories {
    data: MasterDataCategory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}