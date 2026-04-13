/**
 * Patient Service
 * Quản lý bệnh nhân — theo đúng Swagger API Backend
 *
 * Backend: http://160.250.186.97:3000/api-docs
 */

import axiosClient from '@/api/axiosClient';
import { PATIENT_ENDPOINTS, DOCUMENT_ENDPOINTS, EMR_ENDPOINTS, PRESCRIPTION_ENDPOINTS } from '@/api/endpoints';

// ============================================
// Types — theo đúng schema backend
// ============================================

export type PatientGender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
export type PatientStatus = 'ACTIVE' | 'INACTIVE' | 'DECEASED';
export type IdentityType = 'CCCD' | 'PASSPORT' | 'OTHER';
export type RelationType = 'PARENT' | 'SPOUSE' | 'CHILD' | 'SIBLING' | 'OTHER';

export interface Patient {
    patient_id: string;
    patient_code: string;
    full_name: string;
    date_of_birth: string;
    gender: PatientGender;
    identity_type?: IdentityType;
    identity_number?: string;
    nationality?: string;
    blood_type?: string;
    allergies?: string;
    chronic_diseases?: string;
    status: PatientStatus;
    created_at: string;
    updated_at: string;
    // Joined fields (có thể có)
    contact?: PatientContact;
    contacts?: PatientContact[];
    insurance?: PatientInsurance[];
}

export interface CreatePatientRequest {
    full_name: string;
    date_of_birth: string; // format: YYYY-MM-DD
    gender?: PatientGender;
    identity_type?: IdentityType;
    identity_number?: string;
    nationality?: string;
    contact: {
        phone_number: string;
        email?: string;
        street_address?: string;
        ward?: string;
        province?: string;
    };
}

export interface UpdatePatientRequest {
    full_name?: string;
    date_of_birth?: string;
    gender?: PatientGender;
    identity_type?: IdentityType;
    identity_number?: string;
    nationality?: string;
    blood_type?: string;
    allergies?: string;
    chronic_diseases?: string;
}

export interface PatientContact {
    contact_id: string;
    patient_id: string;
    phone_number: string;
    email?: string;
    street_address?: string;
    ward?: string;
    province?: string;
    is_primary: boolean;
    created_at: string;
    updated_at: string;
}

export interface PatientInsurance {
    insurance_id: string;
    patient_id: string;
    insurance_number: string;
    provider?: string;
    expiry_date?: string;
    issued_date?: string;
    is_active: boolean;
    created_at: string;
}

export interface PatientDocument {
    document_id: string;
    patient_id: string;
    file_name: string;
    file_type?: string;
    file_size?: number;
    file_url?: string;
    document_type?: string;
    description?: string;
    uploaded_by?: string;
    created_at: string;
}

export interface PatientRelation {
    relation_id: string;
    patient_id: string;
    full_name: string;
    relationship: RelationType;
    phone_number: string;
    is_emergency: boolean;
    has_legal_rights: boolean;
    created_at: string;
    updated_at: string;
}

export interface MedicalRecord {
    encounter_id?: string;
    record_id?: string;
    visit_date?: string;
    created_at?: string;
    doctor_name?: string;
    department_name?: string;
    diagnosis?: string;
    chief_complaint?: string;
    status?: string;
}

export interface PaginationInfo {
    total_items: number;
    total_pages: number;
    current_page: number;
    limit: number;
}

export interface PatientListResponse {
    success: boolean;
    message?: string;
    data?: {
        items: Patient[];
        pagination: PaginationInfo;
    };
}

// Helper unwrap pattern
function unwrap<T>(res: any): T | undefined {
    return res?.data?.data ?? res?.data ?? res;
}

// ============================================
// API Functions — Patients
// ============================================

/**
 * Lấy danh sách bệnh nhân (phân trang + tìm kiếm nâng cao)
 */
export const getPatients = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: PatientStatus;
    gender?: PatientGender;
    ageFrom?: number;
    ageTo?: number;
    tag?: string;
    hasInsurance?: boolean;
    createdFrom?: string;
    createdTo?: string;
}): Promise<PatientListResponse> => {
    try {
        const response = await axiosClient.get(PATIENT_ENDPOINTS.LIST, { params });
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Lấy danh sách bệnh nhân thất bại',
        };
    }
};

/**
 * Lấy chi tiết một bệnh nhân
 */
export const getPatientDetail = async (patientId: string): Promise<{ success: boolean; data?: Patient; message?: string }> => {
    try {
        const response = await axiosClient.get(PATIENT_ENDPOINTS.DETAIL(patientId));
        const raw = response.data;
        const data = raw?.data ?? raw;
        return { success: true, data };
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Bệnh nhân không tồn tại',
        };
    }
};

/**
 * Tạo hồ sơ bệnh nhân mới
 */
export const createPatient = async (data: CreatePatientRequest): Promise<{ success: boolean; data?: Patient; message?: string }> => {
    try {
        const response = await axiosClient.post(PATIENT_ENDPOINTS.CREATE, data);
        const raw = response.data;
        const patient = raw?.data ?? raw;
        return { success: true, data: patient };
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Tạo hồ sơ thất bại',
        };
    }
};

/**
 * Cập nhật thông tin hành chính bệnh nhân
 */
export const updatePatient = async (patientId: string, data: UpdatePatientRequest): Promise<{ success: boolean; data?: Patient; message?: string }> => {
    try {
        const response = await axiosClient.put(PATIENT_ENDPOINTS.UPDATE(patientId), data);
        const raw = response.data;
        const patient = raw?.data ?? raw;
        return { success: true, data: patient };
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Cập nhật thất bại',
        };
    }
};

/**
 * Cập nhật trạng thái hồ sơ bệnh nhân
 */
export const updatePatientStatus = async (
    patientId: string,
    status: PatientStatus,
    statusReason?: string
): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosClient.patch(PATIENT_ENDPOINTS.STATUS(patientId), {
            status,
            ...(statusReason && { status_reason: statusReason }),
        });
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Cập nhật trạng thái thất bại',
        };
    }
};

/**
 * Liên kết hồ sơ bệnh nhân
 */
export const linkPatient = async (patientCode: string, identityNumber: string): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosClient.post(PATIENT_ENDPOINTS.LINK, {
            patient_code: patientCode,
            identity_number: identityNumber,
        });
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Liên kết thất bại',
        };
    }
};

// ============================================
// Contact Management
// ============================================

/**
 * Lấy danh sách liên hệ của bệnh nhân
 */
export const getContacts = async (patientId: string): Promise<{ success: boolean; data?: PatientContact[]; message?: string }> => {
    try {
        const response = await axiosClient.get(PATIENT_ENDPOINTS.ADD_CONTACT(patientId));
        const raw = response.data;
        const data: PatientContact[] = raw?.data?.items ?? raw?.data ?? raw ?? [];
        return { success: true, data };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Lấy liên hệ thất bại' };
    }
};

/**
 * Cập nhật thông tin liên hệ chính
 */
export const updateContact = async (patientId: string, data: {
    phone_number?: string;
    email?: string;
    street_address?: string;
    ward?: string;
    province?: string;
}): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosClient.put(PATIENT_ENDPOINTS.UPDATE_CONTACT(patientId), data);
        return response.data;
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Cập nhật liên hệ thất bại' };
    }
};

/**
 * Thêm liên hệ phụ
 */
export const addContact = async (patientId: string, data: {
    phone_number: string;
    email?: string;
    street_address?: string;
    ward?: string;
    province?: string;
}): Promise<{ success: boolean; data?: PatientContact; message?: string }> => {
    try {
        const response = await axiosClient.post(PATIENT_ENDPOINTS.ADD_CONTACT(patientId), data);
        const raw = response.data;
        return { success: true, data: raw?.data ?? raw };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Thêm liên hệ thất bại' };
    }
};

/**
 * Cập nhật liên hệ phụ
 */
export const editContact = async (patientId: string, contactId: string, data: {
    phone_number?: string;
    email?: string;
    street_address?: string;
    ward?: string;
    province?: string;
}): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosClient.put(PATIENT_ENDPOINTS.EDIT_CONTACT(patientId, contactId), data);
        return response.data;
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Cập nhật liên hệ thất bại' };
    }
};

/**
 * Xóa liên hệ phụ
 */
export const deleteContact = async (patientId: string, contactId: string): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosClient.delete(PATIENT_ENDPOINTS.DELETE_CONTACT(patientId, contactId));
        return response.data;
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Xóa liên hệ thất bại' };
    }
};

// ============================================
// Relations Management (Người thân)
// ============================================

/**
 * Lấy danh sách người thân
 */
export const getRelations = async (patientId: string): Promise<{ success: boolean; data?: PatientRelation[]; message?: string }> => {
    try {
        const response = await axiosClient.get(PATIENT_ENDPOINTS.ADD_RELATION(patientId));
        const raw = response.data;
        const data: PatientRelation[] = raw?.data?.items ?? raw?.data ?? raw ?? [];
        return { success: true, data };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Lấy người thân thất bại' };
    }
};

/**
 * Thêm thông tin người thân
 */
export const addRelation = async (patientId: string, data: {
    full_name: string;
    relationship: RelationType;
    phone_number: string;
    is_emergency?: boolean;
    has_legal_rights?: boolean;
}): Promise<{ success: boolean; data?: PatientRelation; message?: string }> => {
    try {
        const response = await axiosClient.post(PATIENT_ENDPOINTS.ADD_RELATION(patientId), data);
        const raw = response.data;
        return { success: true, data: raw?.data ?? raw };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Thêm người thân thất bại' };
    }
};

/**
 * Sửa thông tin người thân
 */
export const updateRelation = async (patientId: string, relationId: string, data: {
    full_name?: string;
    relationship?: RelationType;
    phone_number?: string;
    is_emergency?: boolean;
    has_legal_rights?: boolean;
}): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosClient.put(PATIENT_ENDPOINTS.EDIT_RELATION(patientId, relationId), data);
        return response.data;
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Cập nhật người thân thất bại' };
    }
};

/**
 * Xóa thông tin người thân
 */
export const deleteRelation = async (patientId: string, relationId: string): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosClient.delete(PATIENT_ENDPOINTS.DELETE_RELATION(patientId, relationId));
        return response.data;
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Xóa người thân thất bại' };
    }
};

// ============================================
// Medical Records
// ============================================

/**
 * Lấy lịch sử khám (encounters) theo bệnh nhân
 */
export const getMedicalHistory = async (patientId: string): Promise<{ success: boolean; data?: MedicalRecord[]; message?: string }> => {
    try {
        const response = await axiosClient.get(EMR_ENDPOINTS.BY_PATIENT(patientId));
        const raw = response.data;
        const data: MedicalRecord[] = raw?.data?.items ?? raw?.data ?? raw ?? [];
        return { success: true, data };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Lấy lịch sử khám thất bại' };
    }
};

/**
 * Lấy đơn thuốc theo bệnh nhân
 */
export const getPrescriptions = async (patientId: string): Promise<{ success: boolean; data?: any[]; message?: string }> => {
    try {
        const response = await axiosClient.get(PRESCRIPTION_ENDPOINTS.BY_PATIENT(patientId));
        const raw = response.data;
        const data: any[] = raw?.data?.items ?? raw?.data ?? raw ?? [];
        return { success: true, data };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Lấy đơn thuốc thất bại' };
    }
};

// ============================================
// Documents
// ============================================

/**
 * Lấy danh sách tài liệu của bệnh nhân
 */
export const getDocuments = async (patientId: string): Promise<{ success: boolean; data?: PatientDocument[]; message?: string }> => {
    try {
        const response = await axiosClient.get(DOCUMENT_ENDPOINTS.LIST(patientId));
        const raw = response.data;
        const data: PatientDocument[] = raw?.data?.items ?? raw?.data ?? raw ?? [];
        return { success: true, data };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Lấy tài liệu thất bại' };
    }
};

/**
 * Upload tài liệu bệnh nhân (FormData)
 */
export const uploadDocument = async (patientId: string, formData: FormData): Promise<{ success: boolean; data?: PatientDocument; message?: string }> => {
    try {
        const response = await axiosClient.post(DOCUMENT_ENDPOINTS.UPLOAD(patientId), formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        const raw = response.data;
        return { success: true, data: raw?.data ?? raw };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Tải lên tài liệu thất bại' };
    }
};

/**
 * Xóa tài liệu bệnh nhân
 */
export const deleteDocument = async (patientId: string, docId: string): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosClient.delete(DOCUMENT_ENDPOINTS.DELETE(patientId, docId));
        return response.data;
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Xóa tài liệu thất bại' };
    }
};
