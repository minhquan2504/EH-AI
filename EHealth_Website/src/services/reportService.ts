import axiosClient from '@/api/axiosClient';
import { REPORT_ENDPOINTS } from '@/api/endpoints';

export const reportService = {
    getDashboard: (params?: Record<string, any>) =>
        axiosClient.get(REPORT_ENDPOINTS.DASHBOARD, { params }),

    getRevenue: (params?: Record<string, any>) =>
        axiosClient.get(REPORT_ENDPOINTS.REVENUE, { params }),

    getPatients: (params?: Record<string, any>) =>
        axiosClient.get(REPORT_ENDPOINTS.PATIENTS, { params }),

    getAppointments: (params?: Record<string, any>) =>
        axiosClient.get(REPORT_ENDPOINTS.APPOINTMENTS, { params }),

    exportExcel: (params?: Record<string, any>) =>
        axiosClient.get(REPORT_ENDPOINTS.EXPORT_EXCEL, {
            params,
            responseType: 'blob',
        }),

    exportPdf: (params?: Record<string, any>) =>
        axiosClient.get(REPORT_ENDPOINTS.EXPORT_PDF, {
            params,
            responseType: 'blob',
        }),
};
