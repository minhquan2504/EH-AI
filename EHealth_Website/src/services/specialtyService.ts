/**
 * Specialty Service
 * Quản lý danh mục chuyên khoa — đồng bộ Swagger API
 * 
 * Backend: http://160.250.186.97:3000/api-docs
 * Section: 1.5.1
 */

import axiosClient from '@/api/axiosClient';
import { SPECIALTY_ENDPOINTS } from '@/api/endpoints';

// ============================================
// Types
// ============================================

export interface Specialty {
    id: string;
    code: string;
    name: string;
    description?: string;
    isActive?: boolean;
    createdAt: string;
    updatedAt: string;
}

// ============================================
// Service Functions
// ============================================

/** Unwrap specialties từ các kiểu response khác nhau */
export function unwrapSpecialties(res: any): Specialty[] {
    const raw = res?.data?.data ?? res?.data?.items ?? res?.data ?? res?.items ?? res ?? [];
    if (!Array.isArray(raw)) return [];
    return raw.map((s: any): Specialty => ({
        id: s.id ?? '',
        code: s.code ?? '',
        name: s.name ?? '',
        description: s.description ?? '',
        isActive: s.isActive ?? s.is_active ?? true,
        createdAt: s.createdAt ?? s.created_at ?? '',
        updatedAt: s.updatedAt ?? s.updated_at ?? '',
    }));
}

/** GET /api/specialties — Lấy danh sách chuyên khoa */
export const getSpecialties = async (params?: {
    page?: number;
    limit?: number;
    searchKeyword?: string;
    search?: string;
    isActive?: boolean;
}): Promise<{ data: Specialty[]; pagination?: any }> => {
    try {
        const response = await axiosClient.get(SPECIALTY_ENDPOINTS.LIST, { params });
        // Unwrap nhiều kiểu response
        const raw = response.data;
        const items = unwrapSpecialties(raw);
        const pagination = raw?.data?.pagination ?? raw?.pagination ?? undefined;
        return { data: items, pagination };
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách chuyên khoa thất bại');
    }
};

/** POST /api/specialties — Tạo mới chuyên khoa */
export const createSpecialty = async (data: {
    code: string;
    name: string;
    description?: string;
}): Promise<Specialty> => {
    try {
        const response = await axiosClient.post(SPECIALTY_ENDPOINTS.CREATE, data);
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Tạo chuyên khoa thất bại');
    }
};

/** GET /api/specialties/{id} — Chi tiết chuyên khoa */
export const getSpecialtyById = async (id: string): Promise<Specialty> => {
    try {
        const response = await axiosClient.get(SPECIALTY_ENDPOINTS.DETAIL(id));
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy chi tiết chuyên khoa thất bại');
    }
};

/** PUT /api/specialties/{id} — Cập nhật chuyên khoa */
export const updateSpecialty = async (id: string, data: Partial<Specialty>): Promise<Specialty> => {
    try {
        const response = await axiosClient.put(SPECIALTY_ENDPOINTS.UPDATE(id), data);
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật chuyên khoa thất bại');
    }
};

/** DELETE /api/specialties/{id} — Xóa chuyên khoa (xóa mềm) */
export const deleteSpecialty = async (id: string): Promise<void> => {
    try {
        await axiosClient.delete(SPECIALTY_ENDPOINTS.DELETE(id));
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Xóa chuyên khoa thất bại');
    }
};

export default {
    getSpecialties,
    createSpecialty,
    getSpecialtyById,
    updateSpecialty,
    deleteSpecialty,
};
