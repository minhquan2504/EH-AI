/**
 * Medicine / Pharmacy Service
 * Xử lý các chức năng liên quan đến thuốc — đồng bộ Swagger API
 * 
 * Backend: http://160.250.186.97:3000/api-docs
 * Endpoints: /api/pharmacy/drugs/*, /api/pharmacy/categories/*
 */

import axiosClient from '@/api/axiosClient';
import { PHARMACY_ENDPOINTS } from '@/api/endpoints';

// ============================================
// Types — Drug
// ============================================

export interface Drug {
    id: string;
    name: string;
    genericName: string;
    category: string;
    categoryId?: string;
    unit: string;
    price: number;
    quantity: number;
    minQuantity: number;
    manufacturer: string;
    expiryDate: string;
    description?: string;
    sideEffects?: string;
    activeIngredient?: string;
    status: 'available' | 'low_stock' | 'out_of_stock';
    createdAt: string;
    updatedAt: string;
}

// Backward compatibility
export type Medicine = Drug;

export interface CreateDrugData {
    name: string;
    genericName?: string;
    category?: string;
    categoryId?: string;
    unit: string;
    price: number;
    quantity?: number;
    minQuantity?: number;
    manufacturer?: string;
    expiryDate?: string;
    description?: string;
    sideEffects?: string;
    activeIngredient?: string;
}

export type CreateMedicineData = CreateDrugData;

export interface DrugListResponse {
    success: boolean;
    data: Drug[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export type MedicineListResponse = DrugListResponse;

// ============================================
// Types — Drug Category
// ============================================

export interface DrugCategory {
    id: string;
    name: string;
    code: string;
    description?: string;
    drugCount?: number;
    status?: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
}

// ============================================
// Drug API Functions
// Sử dụng: /api/pharmacy/drugs/*
// ============================================

/**
 * Lấy danh sách thuốc (Admin view)
 */
export const getDrugs = async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    search?: string;
}): Promise<DrugListResponse> => {
    try {
        const response = await axiosClient.get(PHARMACY_ENDPOINTS.DRUGS_LIST, { params });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách thuốc thất bại');
    }
};

// Backward compatibility
export const getMedicines = getDrugs;

/**
 * Lấy chi tiết thuốc
 */
export const getDrugById = async (id: string): Promise<Drug> => {
    try {
        const response = await axiosClient.get(PHARMACY_ENDPOINTS.DRUGS_DETAIL(id));
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy thông tin thuốc thất bại');
    }
};

export const getMedicineById = getDrugById;

/**
 * Tạo thuốc mới
 */
export const createDrug = async (data: CreateDrugData): Promise<Drug> => {
    try {
        const response = await axiosClient.post(PHARMACY_ENDPOINTS.DRUGS_CREATE, {
            name: data.name,
            generic_name: data.genericName,
            category: data.category,
            category_id: data.categoryId,
            unit: data.unit,
            price: data.price,
            quantity: data.quantity,
            min_quantity: data.minQuantity,
            manufacturer: data.manufacturer,
            expiry_date: data.expiryDate,
            description: data.description,
            side_effects: data.sideEffects,
            active_ingredient: data.activeIngredient,
        });
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Tạo thuốc thất bại');
    }
};

export const createMedicine = createDrug;

/**
 * Cập nhật thuốc
 */
export const updateDrug = async (id: string, data: Partial<CreateDrugData>): Promise<Drug> => {
    try {
        const response = await axiosClient.put(PHARMACY_ENDPOINTS.DRUGS_UPDATE(id), {
            name: data.name,
            generic_name: data.genericName,
            category: data.category,
            category_id: data.categoryId,
            unit: data.unit,
            price: data.price,
            quantity: data.quantity,
            min_quantity: data.minQuantity,
            manufacturer: data.manufacturer,
            expiry_date: data.expiryDate,
            description: data.description,
            side_effects: data.sideEffects,
            active_ingredient: data.activeIngredient,
        });
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật thuốc thất bại');
    }
};

export const updateMedicine = updateDrug;

/**
 * Xóa thuốc
 */
export const deleteDrug = async (id: string): Promise<void> => {
    try {
        await axiosClient.delete(PHARMACY_ENDPOINTS.DRUGS_DELETE(id));
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Xóa thuốc thất bại');
    }
};

export const deleteMedicine = deleteDrug;

/**
 * Lấy danh sách thuốc active (cho dropdown/tìm kiếm nhanh)
 * Swagger: GET /api/pharmacy/drugs/active
 */
export const getActiveDrugs = async (params?: {
    search?: string;
}): Promise<Drug[]> => {
    try {
        const response = await axiosClient.get(PHARMACY_ENDPOINTS.DRUGS_ACTIVE, { params });
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Tìm kiếm thuốc thất bại');
    }
};

// Backward compatibility
export const searchMedicines = async (query: string): Promise<Drug[]> => {
    return getActiveDrugs({ search: query });
};

/**
 * Xuất danh sách thuốc ra Excel
 * Swagger: GET /api/pharmacy/drugs/export
 */
export const exportDrugs = async (): Promise<Blob> => {
    try {
        const response = await axiosClient.get(PHARMACY_ENDPOINTS.DRUGS_EXPORT, {
            responseType: 'blob',
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Xuất file Excel thất bại');
    }
};

/**
 * Nhập thuốc từ Excel
 * Swagger: POST /api/pharmacy/drugs/import
 */
export const importDrugs = async (file: File): Promise<{ success: boolean; message: string; imported?: number }> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosClient.post(PHARMACY_ENDPOINTS.DRUGS_IMPORT, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Nhập file Excel thất bại');
    }
};

// ============================================
// Drug Category API Functions
// Sử dụng: /api/pharmacy/categories/*
// ============================================

/**
 * Lấy danh sách nhóm thuốc
 */
export const getDrugCategories = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
}): Promise<{ data: DrugCategory[]; pagination?: any }> => {
    try {
        const response = await axiosClient.get(PHARMACY_ENDPOINTS.CATEGORIES_LIST, { params });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách nhóm thuốc thất bại');
    }
};

/**
 * Lấy chi tiết nhóm thuốc
 */
export const getDrugCategoryById = async (id: string): Promise<DrugCategory> => {
    try {
        const response = await axiosClient.get(PHARMACY_ENDPOINTS.CATEGORIES_DETAIL(id));
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy thông tin nhóm thuốc thất bại');
    }
};

/**
 * Tạo nhóm thuốc mới
 */
export const createDrugCategory = async (data: {
    name: string;
    code?: string;
    description?: string;
}): Promise<DrugCategory> => {
    try {
        const response = await axiosClient.post(PHARMACY_ENDPOINTS.CATEGORIES_CREATE, data);
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Tạo nhóm thuốc thất bại');
    }
};

/**
 * Cập nhật nhóm thuốc
 */
export const updateDrugCategory = async (id: string, data: {
    name?: string;
    description?: string;
}): Promise<DrugCategory> => {
    try {
        const response = await axiosClient.put(PHARMACY_ENDPOINTS.CATEGORIES_UPDATE(id), data);
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật nhóm thuốc thất bại');
    }
};

/**
 * Xóa nhóm thuốc
 */
export const deleteDrugCategory = async (id: string): Promise<void> => {
    try {
        await axiosClient.delete(PHARMACY_ENDPOINTS.CATEGORIES_DELETE(id));
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Xóa nhóm thuốc thất bại');
    }
};

/**
 * Xuất nhóm thuốc ra Excel
 */
export const exportDrugCategories = async (): Promise<Blob> => {
    try {
        const response = await axiosClient.get(PHARMACY_ENDPOINTS.CATEGORIES_EXPORT, {
            responseType: 'blob',
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Xuất file Excel thất bại');
    }
};

/**
 * Nhập nhóm thuốc từ Excel
 */
export const importDrugCategories = async (file: File): Promise<{ success: boolean; message: string }> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosClient.post(PHARMACY_ENDPOINTS.CATEGORIES_IMPORT, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Nhập file Excel thất bại');
    }
};

// ============================================
// PATCH Status — Bật/tắt trạng thái
// Swagger: PATCH /api/pharmacy/drugs/{id}/status
// Swagger: PATCH /api/pharmacy/categories/{id}/status
// ============================================

/**
 * Bật/tắt trạng thái thuốc
 * Swagger: PATCH /api/pharmacy/drugs/{id}/status
 */
export const toggleDrugStatus = async (id: string, data: { isActive: boolean }): Promise<any> => {
    try {
        const response = await axiosClient.patch(PHARMACY_ENDPOINTS.DRUGS_STATUS(id), data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật trạng thái thuốc thất bại');
    }
};

/**
 * Bật/tắt trạng thái nhóm thuốc
 * Swagger: PATCH /api/pharmacy/categories/{id}/status
 */
export const toggleDrugCategoryStatus = async (id: string, data: { isActive: boolean }): Promise<any> => {
    try {
        const response = await axiosClient.patch(PHARMACY_ENDPOINTS.CATEGORIES_STATUS(id), data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật trạng thái nhóm thuốc thất bại');
    }
};
