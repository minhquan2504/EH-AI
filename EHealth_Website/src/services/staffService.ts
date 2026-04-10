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
    status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
    avatar?: string;
    rating?: number;
    experience?: number;
    createdAt?: string;
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
