/**
 * Interface Types cho Module 2.4 - Quản lý người thân bệnh nhân (Patient Contacts)
 */

/** Thông tin người thân bệnh nhân */
export interface PatientContact {
    patient_contacts_id: string;
    patient_id: string;
    relation_type_id: string;
    contact_name: string;
    phone_number: string;
    address: string | null;
    is_emergency_contact: boolean;
    is_legal_representative: boolean;
    medical_decision_note: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;

    /** Thông tin JOIN từ bảng relation_types */
    relation_type_code?: string;
    relation_type_name?: string;

    /** Thông tin JOIN từ bảng patients */
    patient_name?: string;
    patient_code?: string;
}

/** Input tạo mới người thân */
export interface CreatePatientContactInput {
    patient_id: string;
    relation_type_id: string;
    contact_name: string;
    phone_number: string;
    address?: string;
    is_emergency_contact?: boolean;
}

/** Input cập nhật thông tin người thân */
export interface UpdatePatientContactInput {
    relation_type_id?: string;
    contact_name?: string;
    phone_number?: string;
    address?: string;
    is_emergency_contact?: boolean;
}

/** Input cập nhật ghi chú quyền quyết định y tế */
export interface UpdateMedicalDecisionNoteInput {
    medical_decision_note: string;
}

/** Kết quả phân trang người thân */
export interface PaginatedPatientContacts {
    data: PatientContact[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
