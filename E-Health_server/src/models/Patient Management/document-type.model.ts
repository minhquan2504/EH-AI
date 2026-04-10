/** Interface cho loại tài liệu */
export interface DocumentType {
    document_type_id: string;
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

/** Input tạo mới loại tài liệu */
export interface CreateDocumentTypeInput {
    code: string;
    name: string;
    description?: string;
    is_active?: boolean;
}

/** Input cập nhật loại tài liệu */
export interface UpdateDocumentTypeInput {
    code?: string;
    name?: string;
    description?: string;
    is_active?: boolean;
}
