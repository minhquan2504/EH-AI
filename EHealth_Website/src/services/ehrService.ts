import axiosClient from '@/api/axiosClient';
import { EHR_ENDPOINTS } from '@/api/endpoints';
import { unwrap, unwrapList } from '@/api/response';

export const ehrService = {
    // ── Legacy (giữ nguyên) ────────────────────────────────────────────
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

    // ── Health Profile ─────────────────────────────────────────────────
    /**
     * Lấy hồ sơ sức khoẻ tổng hợp (overview + dị ứng + mô tả sức khỏe)
     * GET /api/ehr/patients/:patientId/profile
     */
    getHealthProfile: async (patientId: string) => {
        const res = await axiosClient.get(EHR_ENDPOINTS.PROFILE(patientId));
        return unwrap<any>(res);
    },

    /**
     * Lấy cảnh báo y tế của hồ sơ
     * GET /api/ehr/patients/:patientId/risk-factors
     */
    getAlerts: async (patientId: string) => {
        const res = await axiosClient.get(EHR_ENDPOINTS.RISK_FACTORS(patientId));
        return unwrap<any[]>(res);
    },

    // ── Vital Signs ────────────────────────────────────────────────────
    /**
     * Lấy chỉ số sinh hiệu mới nhất
     * GET /api/ehr/patients/:patientId/vitals/latest
     */
    getVitalLatest: async (patientId: string) => {
        const res = await axiosClient.get(EHR_ENDPOINTS.VITALS_LATEST(patientId));
        return unwrap<any>(res);
    },

    /**
     * Lấy lịch sử sinh hiệu (có phân trang/filter)
     * GET /api/ehr/patients/:patientId/vitals
     */
    getVitalHistoryByProfile: async (patientId: string, params?: Record<string, any>) => {
        const res = await axiosClient.get(EHR_ENDPOINTS.VITAL_HISTORY(patientId), { params });
        return unwrapList<any>(res);
    },

    // ── Medical History ────────────────────────────────────────────────
    /**
     * Lấy tiền sử bệnh
     * GET /api/ehr/patients/:patientId/medical-histories
     */
    getMedicalHistoryByProfile: async (patientId: string) => {
        const res = await axiosClient.get(EHR_ENDPOINTS.MEDICAL_HISTORY(patientId));
        return unwrapList<any>(res);
    },

    // ── Clinical Results ───────────────────────────────────────────────
    /**
     * Lấy kết quả xét nghiệm / cận lâm sàng
     * GET /api/ehr/patients/:patientId/diagnosis-history
     */
    getClinicalResults: async (patientId: string, params?: Record<string, any>) => {
        const res = await axiosClient.get(EHR_ENDPOINTS.DIAGNOSIS_HISTORY(patientId), { params });
        return unwrapList<any>(res);
    },

    // ── Medication / Treatment ─────────────────────────────────────────
    /**
     * Lấy danh sách thuốc / điều trị đang dùng
     * GET /api/ehr/patients/:patientId/current-medications
     */
    getCurrentMedications: async (patientId: string) => {
        const res = await axiosClient.get(EHR_ENDPOINTS.CURRENT_MEDICATIONS(patientId));
        return unwrapList<any>(res);
    },

    /**
     * Lấy lịch sử điều trị đầy đủ
     * GET /api/ehr/patients/:patientId/treatment-records
     */
    getMedicationTreatments: async (patientId: string, params?: Record<string, any>) => {
        const res = await axiosClient.get(EHR_ENDPOINTS.TREATMENT_HISTORY(patientId), { params });
        return unwrapList<any>(res);
    },

    // ── Allergies ──────────────────────────────────────────────────────
    /**
     * Lấy danh sách dị ứng
     * GET /api/ehr/patients/:patientId/allergies
     */
    getAllergies: async (patientId: string) => {
        const res = await axiosClient.get(EHR_ENDPOINTS.ALLERGIES(patientId));
        return unwrapList<any>(res);
    },

    // ── Health Timeline ────────────────────────────────────────────────
    /**
     * Lấy dòng thời gian sức khoẻ
     * GET /api/ehr/patients/:patientId/timeline
     */
    getHealthTimeline: async (patientId: string, params?: Record<string, any>) => {
        const res = await axiosClient.get(EHR_ENDPOINTS.TIMELINE(patientId), { params });
        return unwrapList<any>(res);
    },
};
