/**
 * Inventory Service — Tồn kho dược phẩm
 * Swagger: /api/inventory/* + /api/stock-in/* + /api/stock-out/*
 * Backend: http://160.250.186.97:3000/api-docs
 */

import axiosClient from '@/api/axiosClient';
import { INVENTORY_ENDPOINTS, STOCK_IN_ENDPOINTS, STOCK_OUT_ENDPOINTS, WAREHOUSE_ENDPOINTS, SUPPLIER_ENDPOINTS } from '@/api/endpoints';

export const inventoryService = {
    // ---- Inventory ----
    getList: (params?: { page?: number; limit?: number; warehouseId?: string; drugId?: string }) =>
        axiosClient.get(INVENTORY_ENDPOINTS.LIST, { params }).then(r => r.data),

    getDetail: (batchId: string) =>
        axiosClient.get(INVENTORY_ENDPOINTS.DETAIL(batchId)).then(r => r.data?.data ?? r.data),

    getLowStock: () =>
        axiosClient.get(INVENTORY_ENDPOINTS.LOW_STOCK).then(r => r.data),

    getExpiring: () =>
        axiosClient.get(INVENTORY_ENDPOINTS.EXPIRING).then(r => r.data),

    // ---- Stock In (Nhập kho) ----
    getStockInList: (params?: { page?: number; limit?: number; status?: string }) =>
        axiosClient.get(STOCK_IN_ENDPOINTS.LIST, { params }).then(r => r.data),

    getStockInDetail: (orderId: string) =>
        axiosClient.get(STOCK_IN_ENDPOINTS.DETAIL(orderId)).then(r => r.data?.data ?? r.data),

    createStockIn: (data: Record<string, any>) =>
        axiosClient.post(STOCK_IN_ENDPOINTS.LIST, data).then(r => r.data?.data ?? r.data),

    confirmStockIn: (orderId: string) =>
        axiosClient.post(STOCK_IN_ENDPOINTS.CONFIRM(orderId), {}).then(r => r.data),

    receiveStockIn: (orderId: string, data?: Record<string, any>) =>
        axiosClient.post(STOCK_IN_ENDPOINTS.RECEIVE(orderId), data ?? {}).then(r => r.data),

    cancelStockIn: (orderId: string, reason?: string) =>
        axiosClient.post(STOCK_IN_ENDPOINTS.CANCEL(orderId), { reason }).then(r => r.data),

    // ---- Stock In Items ----
    getStockInItems: (orderId: string) =>
        axiosClient.get(STOCK_IN_ENDPOINTS.ITEMS(orderId)).then(r => r.data?.data ?? r.data ?? []),

    // ---- Stock Out (Xuất kho) ----
    getStockOutList: (params?: { page?: number; limit?: number; status?: string }) =>
        axiosClient.get(STOCK_OUT_ENDPOINTS.LIST, { params }).then(r => r.data),

    getStockOutDetail: (orderId: string) =>
        axiosClient.get(STOCK_OUT_ENDPOINTS.DETAIL(orderId)).then(r => r.data?.data ?? r.data),

    getStockOutItems: (orderId: string) =>
        axiosClient.get(STOCK_OUT_ENDPOINTS.ITEMS(orderId)).then(r => r.data?.data ?? r.data ?? []),

    createStockOut: (data: Record<string, any>) =>
        axiosClient.post(STOCK_OUT_ENDPOINTS.LIST, data).then(r => r.data?.data ?? r.data),

    confirmStockOut: (orderId: string) =>
        axiosClient.post(STOCK_OUT_ENDPOINTS.CONFIRM(orderId), {}).then(r => r.data),

    cancelStockOut: (orderId: string, reason?: string) =>
        axiosClient.post(STOCK_OUT_ENDPOINTS.CANCEL(orderId), { reason }).then(r => r.data),

    // ---- Warehouses ----
    getWarehouses: () =>
        axiosClient.get(WAREHOUSE_ENDPOINTS.LIST).then(r => r.data?.data ?? r.data ?? []),

    // ---- Suppliers ----
    getSuppliers: (params?: { page?: number; limit?: number; search?: string }) =>
        axiosClient.get(SUPPLIER_ENDPOINTS.LIST, { params }).then(r => r.data),
};
