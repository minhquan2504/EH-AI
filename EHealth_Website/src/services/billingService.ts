import axiosClient from '@/api/axiosClient';
import { BILLING_ENDPOINTS } from '@/api/endpoints';

export const billingService = {
    getInvoices: (params?: Record<string, any>) =>
        axiosClient.get(BILLING_ENDPOINTS.LIST, { params }),

    getDetail: (id: string) =>
        axiosClient.get(BILLING_ENDPOINTS.DETAIL(id)),

    createInvoice: (data: Record<string, any>) =>
        axiosClient.post(BILLING_ENDPOINTS.CREATE, data),

    pay: (id: string, data: Record<string, any>) =>
        axiosClient.post(BILLING_ENDPOINTS.PAY, { invoiceId: id, ...data }),

    refund: (id: string, data: Record<string, any>) =>
        axiosClient.post(BILLING_ENDPOINTS.REFUND(id), data),

    getTransactions: (params?: Record<string, any>) =>
        axiosClient.get(BILLING_ENDPOINTS.TRANSACTIONS, { params }),

    reconcile: (params?: Record<string, any>) =>
        axiosClient.get(BILLING_ENDPOINTS.RECONCILIATION, { params }),
};
