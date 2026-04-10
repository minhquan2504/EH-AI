import axiosClient from '@/api/axiosClient';
import { AUDIT_LOG_ENDPOINTS } from '@/api/endpoints';

export const auditService = {
    getLogs: (params?: Record<string, any>) =>
        axiosClient.get(AUDIT_LOG_ENDPOINTS.LIST, { params }),

    getDetail: (id: string) =>
        axiosClient.get(AUDIT_LOG_ENDPOINTS.DETAIL(id)),

    exportExcel: (params?: Record<string, any>) =>
        axiosClient.get(AUDIT_LOG_ENDPOINTS.EXPORT_EXCEL, {
            params,
            responseType: 'blob',
        }),
};
