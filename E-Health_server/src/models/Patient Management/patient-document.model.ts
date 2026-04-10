/** Interface cho tài liệu bệnh nhân */
export interface PatientDocument {
    document_id: string;
    patient_id: string;
    document_type_id: string;
    document_name: string;
    file_url: string;
    file_format: string;
    file_size_bytes: number | null;
    notes: string | null;
    version_number: number;
    uploaded_by: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;

    document_type_code?: string;
    document_type_name?: string;

    patient_name?: string;
    patient_code?: string;
}

/** Input upload tài liệu mới */
export interface CreatePatientDocumentInput {
    patient_id: string;
    document_type_id: string;
    document_name: string;
    notes?: string;
}

/** Input cập nhật metadata tài liệu */
export interface UpdatePatientDocumentInput {
    document_type_id?: string;
    document_name?: string;
    notes?: string;
}

/** Kết quả phân trang tài liệu */
export interface PaginatedPatientDocuments {
    data: PatientDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/** Interface cho 1 phiên bản lịch sử tài liệu */
export interface DocumentVersion {
    version_id: string;
    document_id: string;
    version_number: number;
    file_url: string;
    file_format: string | null;
    file_size_bytes: number | null;
    uploaded_by: string | null;
    uploaded_at: string;
}

