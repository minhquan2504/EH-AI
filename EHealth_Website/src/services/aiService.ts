import axiosClient from '@/api/axiosClient';
import { AI_ENDPOINTS } from '@/api/endpoints';

export const aiService = {
    chat: (data: { message: string; context?: Record<string, any> }) =>
        axiosClient.post(AI_ENDPOINTS.CHAT, data),

    checkSymptoms: (data: { symptoms: string[]; patientId?: string }) =>
        axiosClient.post(AI_ENDPOINTS.SYMPTOM_CHECK, data),

    suggestAppointment: (data: Record<string, any>) =>
        axiosClient.post(AI_ENDPOINTS.SUGGEST_APPOINTMENT, data),

    summarizeRecord: (recordId: string) =>
        axiosClient.get(AI_ENDPOINTS.SUMMARIZE_RECORD(recordId)),

    analyze: (data: Record<string, any>) =>
        axiosClient.post(AI_ENDPOINTS.ANALYZE, data),

    getLogs: (params?: Record<string, any>) =>
        axiosClient.get(AI_ENDPOINTS.LOGS, { params }),
};
