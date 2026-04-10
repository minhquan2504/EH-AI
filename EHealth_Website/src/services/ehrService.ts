import axiosClient from '@/api/axiosClient';
import { EHR_ENDPOINTS } from '@/api/endpoints';

export const ehrService = {
    getSummary: (patientId: string) =>
        axiosClient.get(EHR_ENDPOINTS.SUMMARY(patientId)),

    getVitalHistory: (patientId: string, params?: Record<string, any>) =>
        axiosClient.get(EHR_ENDPOINTS.VITAL_HISTORY(patientId), { params }),

    getTreatmentHistory: (patientId: string, params?: Record<string, any>) =>
        axiosClient.get(EHR_ENDPOINTS.TREATMENT_HISTORY(patientId), { params }),

    getTimeline: (patientId: string, params?: Record<string, any>) =>
        axiosClient.get(EHR_ENDPOINTS.TIMELINE(patientId), { params }),

    getMedicalHistory: (patientId: string) =>
        axiosClient.get(EHR_ENDPOINTS.MEDICAL_HISTORY(patientId)),
};
