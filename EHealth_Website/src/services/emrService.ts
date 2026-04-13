import axiosClient from '@/api/axiosClient';
import {
    EMR_ENDPOINTS,
    PRESCRIPTION_ENDPOINTS,
    MEDICAL_RECORD_ENDPOINTS,
} from '@/api/endpoints';

export const emrService = {
    getList: (params?: Record<string, any>) =>
        axiosClient.get(EMR_ENDPOINTS.LIST, { params }).then(r => r.data),

    getDetail: (id: string) =>
        axiosClient.get(EMR_ENDPOINTS.DETAIL(id)),

    getByPatient: (patientId: string) =>
        axiosClient.get(EMR_ENDPOINTS.BY_PATIENT(patientId)),

    create: (data: Record<string, any>) =>
        axiosClient.post(EMR_ENDPOINTS.CREATE, data).then(r => r.data?.data ?? r.data),

    update: (id: string, data: Record<string, any>) =>
        axiosClient.put(EMR_ENDPOINTS.UPDATE(id), data).then(r => r.data?.data ?? r.data),

    saveDraft: (id: string, data: Record<string, any>) =>
        axiosClient.put(EMR_ENDPOINTS.SAVE_DRAFT(id), data).then(r => r.data),

    sign: (id: string) =>
        axiosClient.post(EMR_ENDPOINTS.SIGN(id)).then(r => r.data),

    lock: (id: string) =>
        axiosClient.post(EMR_ENDPOINTS.LOCK(id)).then(r => r.data),

    updateVitalSigns: (emrId: string, data: Record<string, any>) =>
        axiosClient.put(EMR_ENDPOINTS.VITAL_SIGNS(emrId), data),

    addDiagnosis: (emrId: string, data: Record<string, any>) =>
        axiosClient.post(EMR_ENDPOINTS.DIAGNOSES(emrId), data),

    createPrescription: (data: Record<string, any>) =>
        axiosClient.post(PRESCRIPTION_ENDPOINTS.CREATE, data).then(r => r.data?.data ?? r.data),

    // Medical Records HSBA
    getMedicalRecords: (params?: Record<string, any>) =>
        axiosClient.get(MEDICAL_RECORD_ENDPOINTS.DETAIL('search'), { params }).then(r => r.data?.data ?? r.data ?? []),

    getMedicalRecordsByPatient: (patientId: string) =>
        axiosClient.get(MEDICAL_RECORD_ENDPOINTS.BY_PATIENT(patientId)).then(r => r.data?.data ?? r.data ?? []),

    searchMedicalRecords: (params?: Record<string, any>) =>
        axiosClient.get(MEDICAL_RECORD_ENDPOINTS.SEARCH, { params }).then(r => r.data?.data ?? r.data ?? []),
};
