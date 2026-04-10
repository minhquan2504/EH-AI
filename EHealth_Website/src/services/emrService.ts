import axiosClient from '@/api/axiosClient';
import {
    EMR_ENDPOINTS,
    PRESCRIPTION_ENDPOINTS,
} from '@/api/endpoints';

export const emrService = {
    getList: (params?: Record<string, any>) =>
        axiosClient.get(EMR_ENDPOINTS.LIST, { params }),

    getDetail: (id: string) =>
        axiosClient.get(EMR_ENDPOINTS.DETAIL(id)),

    getByPatient: (patientId: string) =>
        axiosClient.get(EMR_ENDPOINTS.BY_PATIENT(patientId)),

    create: (data: Record<string, any>) =>
        axiosClient.post(EMR_ENDPOINTS.CREATE, data),

    update: (id: string, data: Record<string, any>) =>
        axiosClient.put(EMR_ENDPOINTS.UPDATE(id), data),

    saveDraft: (id: string, data: Record<string, any>) =>
        axiosClient.put(EMR_ENDPOINTS.SAVE_DRAFT(id), data),

    sign: (id: string) =>
        axiosClient.post(EMR_ENDPOINTS.SIGN(id)),

    lock: (id: string) =>
        axiosClient.post(EMR_ENDPOINTS.LOCK(id)),

    updateVitalSigns: (emrId: string, data: Record<string, any>) =>
        axiosClient.put(EMR_ENDPOINTS.VITAL_SIGNS(emrId), data),

    addDiagnosis: (emrId: string, data: Record<string, any>) =>
        axiosClient.post(EMR_ENDPOINTS.DIAGNOSES(emrId), data),

    createPrescription: (data: Record<string, any>) =>
        axiosClient.post(PRESCRIPTION_ENDPOINTS.CREATE, data),
};
