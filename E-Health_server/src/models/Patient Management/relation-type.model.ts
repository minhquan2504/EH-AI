/**
 * Interface Types cho Module 2.4 - Quản lý Loại quan hệ (Relation Types)
 */

/** Thông tin loại quan hệ */
export interface RelationType {
    relation_types_id: string;
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

/** Input tạo mới loại quan hệ */
export interface CreateRelationTypeInput {
    code: string;
    name: string;
    description?: string;
    is_active?: boolean;
}

/** Input cập nhật loại quan hệ */
export interface UpdateRelationTypeInput {
    code?: string;
    name?: string;
    description?: string;
    is_active?: boolean;
}
