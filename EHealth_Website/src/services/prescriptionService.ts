import axiosClient from '@/api/axiosClient';
import { PRESCRIPTION_ENDPOINTS, PATIENT_ENDPOINTS } from '@/api/endpoints';

export const prescriptionService = {
    // GET /api/prescriptions/search — danh sách đơn thuốc (dược sĩ dùng)
    search: (params?: { status?: string; limit?: number; page?: number; patientId?: string; doctorId?: string }) =>
        axiosClient.get(PRESCRIPTION_ENDPOINTS.SEARCH, { params }).then(r => r.data),

    // GET /api/prescriptions/by-doctor/{doctorId}
    getByDoctor: (doctorId: string) =>
        axiosClient.get(PRESCRIPTION_ENDPOINTS.BY_DOCTOR(doctorId)).then(r => r.data),

    // GET /api/prescriptions/{encounterId}
    getByEncounter: (encounterId: string) =>
        axiosClient.get(PRESCRIPTION_ENDPOINTS.BY_ENCOUNTER(encounterId)).then(r => r.data?.data ?? r.data),

    getByPatient: (patientId: string) =>
        axiosClient.get(PATIENT_ENDPOINTS.PRESCRIPTIONS(patientId)).then(r => r.data),

    getDetail: (id: string) =>
        axiosClient.get(PRESCRIPTION_ENDPOINTS.DETAIL(id)).then(r => r.data?.data ?? r.data),

    create: (data: Record<string, any>) =>
        axiosClient.post(PRESCRIPTION_ENDPOINTS.CREATE, data).then(r => r.data?.data ?? r.data),

    update: (id: string, data: Record<string, any>) =>
        axiosClient.put(PRESCRIPTION_ENDPOINTS.UPDATE(id), data).then(r => r.data),

    dispense: (id: string, data: Record<string, any>) =>
        axiosClient.post(PRESCRIPTION_ENDPOINTS.DISPENSE(id), data).then(r => r.data),

    // Backward-compat alias
    getList: (params?: Record<string, any>) =>
        axiosClient.get(PRESCRIPTION_ENDPOINTS.SEARCH, { params }).then(r => r.data),
};
