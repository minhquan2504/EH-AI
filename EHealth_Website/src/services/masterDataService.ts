/**
 * Master Data Service
 * ICD-10, Countries, Ethnicities, Units
 *
 * Backend: http://160.250.186.97:3000
 * Endpoints không có trong endpoints.ts → dùng local constants
 */

import axiosClient from '@/api/axiosClient';
import { unwrap, unwrapList } from '@/api/response';

// ============================================
// Local endpoint constants
// ============================================
const MD = {
    ICD10: '/api/master-data/icd10',
    COUNTRIES: '/api/master-data/countries',
    ETHNICITIES: '/api/master-data/ethnicities',
    UNITS: '/api/master-data/units',
};

// ============================================
// Types
// ============================================

export interface ICD10Item {
    id: string;
    code: string;
    name: string;
    nameVi?: string;
    category?: string;
    description?: string;
}

export interface Country {
    id: string;
    code: string;
    name: string;
    nameVi?: string;
    dialCode?: string;
    flag?: string;
}

export interface Ethnicity {
    id: string;
    code: string;
    name: string;
    nameVi?: string;
}

export interface Unit {
    id: string;
    code: string;
    name: string;
    nameVi?: string;
    type?: string; // 'weight' | 'volume' | 'count' | etc.
}

// ============================================
// Service methods
// ============================================

/** GET /api/master-data/icd10 — Tra cứu mã ICD-10 */
export const getICD10 = async (params?: {
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
}): Promise<{ data: ICD10Item[]; pagination?: any }> => {
    try {
        const response = await axiosClient.get(MD.ICD10, { params });
        return unwrapList<ICD10Item>(response);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Tra cứu ICD-10 thất bại');
    }
};

/** GET /api/master-data/countries — Lấy danh sách quốc gia */
export const getCountries = async (params?: {
    search?: string;
    page?: number;
    limit?: number;
}): Promise<{ data: Country[]; pagination?: any }> => {
    try {
        const response = await axiosClient.get(MD.COUNTRIES, { params });
        return unwrapList<Country>(response);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách quốc gia thất bại');
    }
};

/** GET /api/master-data/ethnicities — Lấy danh sách dân tộc */
export const getEthnicities = async (params?: {
    search?: string;
    page?: number;
    limit?: number;
}): Promise<{ data: Ethnicity[]; pagination?: any }> => {
    try {
        const response = await axiosClient.get(MD.ETHNICITIES, { params });
        return unwrapList<Ethnicity>(response);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách dân tộc thất bại');
    }
};

/** GET /api/master-data/units — Lấy danh sách đơn vị tính */
export const getUnits = async (params?: {
    search?: string;
    type?: string;
    page?: number;
    limit?: number;
}): Promise<{ data: Unit[]; pagination?: any }> => {
    try {
        const response = await axiosClient.get(MD.UNITS, { params });
        return unwrapList<Unit>(response);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách đơn vị tính thất bại');
    }
};

/** Tìm kiếm ICD-10 theo từ khóa (shorthand) */
export const searchICD10 = async (query: string, limit = 20): Promise<ICD10Item[]> => {
    const result = await getICD10({ search: query, limit });
    return result.data;
};

/** Lấy tất cả quốc gia (không phân trang) */
export const getAllCountries = async (): Promise<Country[]> => {
    const result = await getCountries({ limit: 300 });
    return result.data;
};

/** Lấy tất cả dân tộc */
export const getAllEthnicities = async (): Promise<Ethnicity[]> => {
    const result = await getEthnicities({ limit: 200 });
    return result.data;
};

export default {
    getICD10,
    getCountries,
    getEthnicities,
    getUnits,
    searchICD10,
    getAllCountries,
    getAllEthnicities,
};
