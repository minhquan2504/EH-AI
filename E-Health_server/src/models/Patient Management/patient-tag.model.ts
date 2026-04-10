/** Interface cho bảng tags (danh mục thẻ phân loại) */
export interface Tag {
    tags_id: string;
    code: string;
    name: string;
    color_hex: string;
    description: string | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
}

/** Input tạo mới Tag */
export interface CreateTagInput {
    code: string;
    name: string;
    color_hex?: string;
    description?: string;
}

/** Input cập nhật Tag */
export interface UpdateTagInput {
    name?: string;
    color_hex?: string;
    description?: string;
}

/** Phân trang danh sách Tag */
export interface PaginatedTags {
    data: Tag[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/** Interface cho bảng patient_tags*/
export interface PatientTagAssignment {
    patient_tags_id: string;
    patient_id: string;
    tag_id: string;
    assigned_by: string | null;
    assigned_at: Date;

    tag_code?: string;
    tag_name?: string;
    tag_color_hex?: string;
}

/** Input gắn thẻ cho bệnh nhân */
export interface AssignTagInput {
    tag_id: string;
}
