/**
 * Doctor Service
 * Quản lý bác sĩ — đồng bộ Swagger API
 * Backend: http://160.250.186.97:3000/api-docs
 * Endpoints: /api/doctors/*
 */

import axiosClient from '@/api/axiosClient';
import { DOCTOR_ENDPOINTS } from '@/api/endpoints';

export interface Doctor {
    id: string;
    code: string;
    fullName: string;
    specialization?: string;
    departmentId?: string;
    departmentName: string;
    phone?: string;
    email?: string;
    rating: number;
    status: 'active' | 'inactive' | 'on_leave';
    avatar?: string;
    experience?: number;
    qualification?: string;
    createdAt?: string;
}

export interface DoctorListResponse {
    data: Doctor[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export const doctorService = {
    getList: (params?: { page?: number; limit?: number; search?: string; departmentId?: string; status?: string }): Promise<DoctorListResponse> =>
        axiosClient.get(DOCTOR_ENDPOINTS.LIST, { params }).then(r => r.data),

    getById: (id: string): Promise<Doctor> =>
        axiosClient.get(DOCTOR_ENDPOINTS.DETAIL(id)).then(r => r.data?.data ?? r.data),

    create: (data: Partial<Doctor>): Promise<Doctor> =>
        axiosClient.post(DOCTOR_ENDPOINTS.CREATE, data).then(r => r.data?.data ?? r.data),

    update: (id: string, data: Partial<Doctor>): Promise<Doctor> =>
        axiosClient.put(DOCTOR_ENDPOINTS.UPDATE(id), data).then(r => r.data?.data ?? r.data),

    delete: (id: string): Promise<void> =>
        axiosClient.delete(DOCTOR_ENDPOINTS.DELETE(id)).then(() => {}),

    getByDepartment: (departmentId: string): Promise<Doctor[]> =>
        axiosClient.get(DOCTOR_ENDPOINTS.BY_DEPARTMENT(departmentId)).then(r => r.data?.data ?? r.data ?? []),

    getSchedule: (doctorId: string): Promise<any[]> =>
        axiosClient.get(DOCTOR_ENDPOINTS.SCHEDULE(doctorId)).then(r => r.data?.data ?? r.data ?? []),
};
