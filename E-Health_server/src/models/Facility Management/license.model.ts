// src/models/Facility Management/license.model.ts

/**
 * Entity đầy đủ của bảng user_licenses
 */
export interface UserLicense {
    licenses_id: string;
    user_id: string;
    license_type: string;
    license_number: string;
    issue_date: string;
    expiry_date: string | null;
    issued_by: string | null;
    document_url: string | null;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;

    full_name?: string;

    days_remaining?: number | null;
    is_expired?: boolean;
}

/**
 * DTO tạo giấy phép mới
 */
export interface CreateLicenseInput {
    user_id: string;
    license_type: string;
    license_number: string;
    issue_date: string;
    expiry_date?: string | null;
    issued_by?: string | null;
    document_url?: string | null;
}

/**
 * DTO cập nhật giấy phép
 */
export interface UpdateLicenseInput {
    license_type?: string;
    license_number?: string;
    issue_date?: string;
    expiry_date?: string | null;
    issued_by?: string | null;
    document_url?: string | null;
}
