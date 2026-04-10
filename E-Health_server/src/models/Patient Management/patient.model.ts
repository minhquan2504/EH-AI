/**
 * Interface Types cho Module 2.1 - Quản lý hồ sơ bệnh nhân (Patient Profile)
 */

/** Thông tin hồ sơ bệnh nhân */
export interface Patient {
    id: string;
    patient_code: string;
    account_id: string | null;
    full_name: string;
    date_of_birth: string;
    gender: string;
    phone_number: string | null;
    email: string | null;
    id_card_number: string | null;
    address: string | null;
    province_id: number | null;
    district_id: number | null;
    ward_id: number | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;

    account_email?: string;
    account_phone?: string;
}

/** Input tạo mới hồ sơ bệnh nhân */
export interface CreatePatientInput {
    full_name: string;
    date_of_birth: string;
    gender: string;
    phone_number?: string;
    email?: string;
    id_card_number?: string;
    address?: string;
    province_id?: number;
    district_id?: number;
    ward_id?: number;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
}

/** Input cập nhật thông tin hành chính bệnh nhân */
export interface UpdatePatientInput {
    full_name?: string;
    date_of_birth?: string;
    gender?: string;
    phone_number?: string;
    email?: string;
    id_card_number?: string;
    address?: string;
    province_id?: number;
    district_id?: number;
    ward_id?: number;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
}

/** Kết quả phân trang hồ sơ bệnh nhân */
export interface PaginatedPatients {
    data: Patient[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/** Kết quả tìm kiếm nhanh (autocomplete) – chỉ gồm thông tin tối thiểu */
export interface PatientQuickResult {
    id: string;
    patient_code: string;
    full_name: string;
    phone_number: string | null;
    date_of_birth: string;
    gender: string;
}

/** Tóm tắt hồ sơ bệnh nhân (aggregate) */
export interface PatientSummary {
    id: string;
    patient_code: string;
    full_name: string;
    date_of_birth: string;
    gender: string;
    phone_number: string | null;
    email: string | null;
    id_card_number: string | null;
    address: string | null;
    status: string;
    has_insurance: boolean;
    age: number;
    tag_count: number;
    insurance_count: number;
    medical_history_count: number;
    allergy_count: number;
}
