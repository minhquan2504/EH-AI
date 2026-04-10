/**
 * Dispensing Service — Cấp phát thuốc
 * Swagger: /api/dispensing/*
 * Backend: http://160.250.186.97:3000/api-docs
 */

import axiosClient from '@/api/axiosClient';
import { DISPENSING_ENDPOINTS } from '@/api/endpoints';

export const dispensingService = {
    /**
     * GET /api/dispensing/history — Lịch sử cấp phát
     */
    getHistory: (params?: { page?: number; limit?: number; pharmacistId?: string; from?: string; to?: string }) =>
        axiosClient.get(DISPENSING_ENDPOINTS.HISTORY, { params }).then(r => r.data),

    /**
     * GET /api/dispensing/by-pharmacist/:pharmacistId — Theo dược sĩ
     */
    getByPharmacist: (pharmacistId: string) =>
        axiosClient.get(DISPENSING_ENDPOINTS.BY_PHARMACIST(pharmacistId)).then(r => r.data),

    /**
     * GET /api/dispensing/{prescriptionId} — Chi tiết + cấp phát đơn thuốc
     */
    getPrescription: (prescriptionId: string) =>
        axiosClient.get(DISPENSING_ENDPOINTS.DISPENSE(prescriptionId)).then(r => r.data?.data ?? r.data),

    /**
     * POST /api/dispensing/{prescriptionId} — Xác nhận cấp phát
     */
    dispense: (prescriptionId: string, data: { items?: any[]; note?: string }) =>
        axiosClient.post(DISPENSING_ENDPOINTS.DISPENSE(prescriptionId), data).then(r => r.data?.data ?? r.data),

    /**
     * POST /api/dispensing/{dispenseOrderId}/cancel — Hủy cấp phát
     */
    cancel: (dispenseOrderId: string, reason?: string) =>
        axiosClient.post(DISPENSING_ENDPOINTS.CANCEL(dispenseOrderId), { reason }).then(r => r.data),

    /**
     * GET /api/dispensing/inventory/{drugId}/check — Kiểm tra tồn kho
     */
    checkInventory: (drugId: string) =>
        axiosClient.get(DISPENSING_ENDPOINTS.INVENTORY_CHECK(drugId)).then(r => r.data?.data ?? r.data),
};
