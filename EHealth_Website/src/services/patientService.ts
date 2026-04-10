/**
 * Patient Service
 * Quản lý bệnh nhân — theo đúng Swagger API Backend
 *
 * Backend: http://160.250.186.97:3000/api-docs
 */

import axiosClient from '@/api/axiosClient';
import { PATIENT_ENDPOINTS } from '@/api/endpoints';

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
    status: PatientStatus;
    created_at: string;
    updated_at: string;
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

// ============================================
// API Functions
// ============================================

/**
 * Lấy danh sách bệnh nhân (phân trang + tìm kiếm)
 */
export const getPatients = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: PatientStatus;
    gender?: PatientGender;
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
        return response.data;
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
        return response.data;
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
export const updatePatient = async (patientId: string, data: UpdatePatientRequest): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosClient.put(PATIENT_ENDPOINTS.UPDATE(patientId), data);
        return response.data;
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
}): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosClient.post(PATIENT_ENDPOINTS.ADD_CONTACT(patientId), data);
        return response.data;
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Thêm liên hệ thất bại' };
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
 * Thêm thông tin người thân
 */
export const addRelation = async (patientId: string, data: {
    full_name: string;
    relationship: RelationType;
    phone_number: string;
    is_emergency?: boolean;
    has_legal_rights?: boolean;
}): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosClient.post(PATIENT_ENDPOINTS.ADD_RELATION(patientId), data);
        return response.data;
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
