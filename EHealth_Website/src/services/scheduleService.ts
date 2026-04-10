/**
 * Schedule Service
 * Quản lý lịch làm việc bác sĩ — đồng bộ Swagger API
 * Backend: http://160.250.186.97:3000/api-docs
 * Endpoints: /api/schedules/*
 */

import axiosClient from '@/api/axiosClient';
import { SCHEDULE_ENDPOINTS } from '@/api/endpoints';

export interface Schedule {
    id: string;
    doctorId: string;
    doctorName: string;
    departmentId?: string;
    department: string;
    shift: 'MORNING' | 'AFTERNOON' | 'NIGHT';
    date: string;
    status: 'SCHEDULED' | 'ON_DUTY' | 'COMPLETED' | 'ABSENT' | 'LEAVE';
    avatar?: string;
    createdAt?: string;
}

export interface ScheduleListResponse {
    data: Schedule[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export const scheduleService = {
    getList: (params?: { page?: number; limit?: number; from?: string; to?: string; doctorId?: string; status?: string }): Promise<ScheduleListResponse> =>
        axiosClient.get(SCHEDULE_ENDPOINTS.LIST, { params }).then(r => r.data),

    create: (data: Partial<Schedule>): Promise<Schedule> =>
        axiosClient.post(SCHEDULE_ENDPOINTS.CREATE, data).then(r => r.data?.data ?? r.data),

    update: (id: string, data: Partial<Schedule>): Promise<Schedule> =>
        axiosClient.put(SCHEDULE_ENDPOINTS.UPDATE(id), data).then(r => r.data?.data ?? r.data),

    delete: (id: string): Promise<void> =>
        axiosClient.delete(SCHEDULE_ENDPOINTS.DELETE(id)).then(() => {}),

    getByDoctor: (doctorId: string, params?: { from?: string; to?: string }): Promise<Schedule[]> =>
        axiosClient.get(SCHEDULE_ENDPOINTS.BY_DOCTOR(doctorId), { params }).then(r => r.data?.data ?? r.data ?? []),
};
