/**
 * Telemedicine Service
 * Quản lý phiên khám trực tuyến — đồng bộ Swagger API
 * Backend: http://160.250.186.97:3000/api-docs
 * Endpoints: /api/telemedicine/sessions/*
 */

import axiosClient from '@/api/axiosClient';
import { TELEMEDICINE_ENDPOINTS } from '@/api/endpoints';

export interface TelemedicineSession {
    id: string;
    patient: string;
    patientId: string;
    doctor: string;
    doctorId?: string;
    date: string;
    time: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    department?: string;
    reason?: string;
    roomUrl?: string;
    createdAt?: string;
}

export interface TelemedicineListResponse {
    data: TelemedicineSession[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export const telemedicineService = {
    getList: (params?: { page?: number; limit?: number; doctorId?: string; status?: string; from?: string; to?: string }): Promise<TelemedicineListResponse> =>
        axiosClient.get(TELEMEDICINE_ENDPOINTS.LIST, { params }).then(r => r.data),

    getById: (id: string): Promise<TelemedicineSession> =>
        axiosClient.get(TELEMEDICINE_ENDPOINTS.DETAIL(id)).then(r => r.data?.data ?? r.data),

    create: (data: Partial<TelemedicineSession>): Promise<TelemedicineSession> =>
        axiosClient.post(TELEMEDICINE_ENDPOINTS.CREATE, data).then(r => r.data?.data ?? r.data),

    start: (id: string): Promise<{ roomUrl?: string }> =>
        axiosClient.post(TELEMEDICINE_ENDPOINTS.START(id)).then(r => r.data?.data ?? r.data),

    end: (id: string): Promise<void> =>
        axiosClient.post(TELEMEDICINE_ENDPOINTS.END(id)).then(() => {}),

    sendChat: (sessionId: string, message: string): Promise<any> =>
        axiosClient.post(TELEMEDICINE_ENDPOINTS.CHAT(sessionId), { message }).then(r => r.data?.data ?? r.data),

    shareDocument: (sessionId: string, file: File): Promise<any> => {
        const formData = new FormData();
        formData.append('file', file);
        return axiosClient.post(TELEMEDICINE_ENDPOINTS.SHARE_DOCUMENT(sessionId), formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then(r => r.data?.data ?? r.data);
    },
};
