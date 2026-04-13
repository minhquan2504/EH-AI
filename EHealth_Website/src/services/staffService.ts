/**
 * Staff Service — Quản lý nhân sự y tế
 * Swagger: GET /api/staff
 *
 * Lấy danh sách hồ sơ nhân sự (Bác sĩ, Y tá, Dược sĩ, Nhân viên kho...).
 * KHÔNG bao gồm role PATIENT.
 *
 * Backend: http://160.250.186.97:3000/api-docs
 */

import axiosClient from '@/api/axiosClient';
import { STAFF_ENDPOINTS } from '@/api/endpoints';

export interface StaffMember {
    id: string;
    code?: string;
    fullName: string;
    email?: string;
    phone?: string;
    role: string;           // DOCTOR | NURSE | PHARMACIST | STAFF | ...
    roleName?: string;
    departmentId?: string;
    departmentName?: string;
    specialization?: string;
    qualification?: string;
    gender?: string;
    dateOfBirth?: string;
    licenseNumber?: string;
    bio?: string;
    status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
    avatar?: string;
    rating?: number;
    experience?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface StaffListResponse {
    success: boolean;
    data: StaffMember[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/** Unwrap dữ liệu từ các kiểu response khác nhau của backend */
export function unwrapStaffList(res: any): StaffMember[] {
    const raw = res?.data?.data ?? res?.data?.items ?? res?.data ?? res?.items ?? res ?? [];
    if (!Array.isArray(raw)) return [];
    return raw.map((d: any): StaffMember => ({
        id: d.id ?? d.staff_id ?? '',
        code: d.code ?? d.staff_code ?? d.employee_code ?? '',
        fullName: d.fullName ?? d.full_name ?? d.name ?? '',
        email: d.email ?? '',
        phone: d.phone ?? d.phone_number ?? '',
        role: d.role ?? 'DOCTOR',
        roleName: d.roleName ?? d.role_name ?? '',
        departmentId: d.departmentId ?? d.department_id ?? d.department?.id ?? '',
        departmentName: d.departmentName ?? d.department_name ?? d.department?.name ?? '',
        specialization: d.specialization ?? d.specialty ?? '',
        qualification: d.qualification ?? d.degree ?? '',
        gender: d.gender ?? '',
        dateOfBirth: d.dateOfBirth ?? d.date_of_birth ?? '',
        licenseNumber: d.licenseNumber ?? d.license_number ?? '',
        bio: d.bio ?? d.description ?? '',
        status: d.status ?? 'ACTIVE',
        avatar: d.avatar ?? d.avatar_url ?? '',
        rating: d.rating ?? 0,
        experience: d.experience ?? d.years_of_experience ?? 0,
        createdAt: d.createdAt ?? d.created_at ?? '',
        updatedAt: d.updatedAt ?? d.updated_at ?? '',
    }));
}

export const staffService = {
    /**
     * GET /api/staff
     * Lấy danh sách nhân sự y tế (loại trừ PATIENT)
     * Params: page, limit, search, status (ACTIVE|INACTIVE|BANNED), role (DOCTOR|NURSE|...)
     */
    getList: (params?: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        role?: string;
        departmentId?: string;
    }): Promise<StaffListResponse> =>
        axiosClient.get(STAFF_ENDPOINTS.LIST, { params }).then(r => r.data),

    getById: (id: string): Promise<StaffMember> =>
        axiosClient.get(STAFF_ENDPOINTS.DETAIL(id)).then(r => r.data?.data ?? r.data),

    create: (data: Partial<StaffMember> & { password?: string }): Promise<StaffMember> =>
        axiosClient.post(STAFF_ENDPOINTS.CREATE, data).then(r => r.data?.data ?? r.data),

    update: (id: string, data: Partial<StaffMember>): Promise<StaffMember> =>
        axiosClient.put(STAFF_ENDPOINTS.UPDATE(id), data).then(r => r.data?.data ?? r.data),

    delete: (id: string): Promise<void> =>
        axiosClient.delete(STAFF_ENDPOINTS.DELETE(id)).then(() => {}),

    setStatus: (id: string, status: 'ACTIVE' | 'INACTIVE' | 'BANNED'): Promise<any> =>
        axiosClient.patch(STAFF_ENDPOINTS.STATUS(id), { status }).then(r => r.data),
};
