/**
 * Entity đại diện cho Master Data Item
 */
export interface MasterDataItem {
    master_data_items_id: string;
    category_code: string;
    code: string;
    value: string;
    sort_order: number;
    is_active: boolean;
}

/**
 * Payload tạo mới chi tiết danh mục
 */
export interface CreateItemInput {
    code: string;
    value: string;
    sort_order?: number;
    is_active?: boolean;
}

/**
 * Payload cập nhật chi tiết danh mục
 */
export interface UpdateItemInput {
    value?: string;
    sort_order?: number;
    is_active?: boolean;
}

/**
 * Result chuẩn phân trang cho Items
 */
export interface PaginatedItems {
    data: MasterDataItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
