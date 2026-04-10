/**
 * System Configuration Service
 * Quản lý cấu hình hệ thống — đồng bộ Swagger API
 * 
 * Backend: http://160.250.186.97:3000/api-docs
 * Section: 1.4.1–1.4.8
 */

import axiosClient from '@/api/axiosClient';
import { SYSTEM_CONFIG_ENDPOINTS } from '@/api/endpoints';

// ============================================
// 1.4.1 Thông tin cơ sở y tế
// ============================================

/** GET /api/system/facility-info */
export const getFacilityInfo = async (): Promise<any> => {
    try {
        const response = await axiosClient.get(SYSTEM_CONFIG_ENDPOINTS.FACILITY_INFO);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy thông tin cơ sở thất bại');
    }
};

/** PUT /api/system/facility-info */
export const updateFacilityInfo = async (data: any): Promise<any> => {
    try {
        const response = await axiosClient.put(SYSTEM_CONFIG_ENDPOINTS.FACILITY_INFO, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật thông tin cơ sở thất bại');
    }
};

/** POST /api/system/facility-info/logo */
export const uploadFacilityLogo = async (file: File): Promise<any> => {
    try {
        const formData = new FormData();
        formData.append('logo', file);
        const response = await axiosClient.post(SYSTEM_CONFIG_ENDPOINTS.FACILITY_LOGO, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Upload logo thất bại');
    }
};

// ============================================
// 1.4.2 Thời gian làm việc
// ============================================

/** GET /api/system/working-hours */
export const getWorkingHours = async (): Promise<any> => {
    try {
        const response = await axiosClient.get(SYSTEM_CONFIG_ENDPOINTS.WORKING_HOURS);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy giờ làm việc thất bại');
    }
};

/** PUT /api/system/working-hours */
export const updateWorkingHours = async (data: any): Promise<any> => {
    try {
        const response = await axiosClient.put(SYSTEM_CONFIG_ENDPOINTS.WORKING_HOURS, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật giờ làm việc thất bại');
    }
};

/** GET /api/system/working-hours/slot-config */
export const getSlotConfig = async (): Promise<any> => {
    try {
        const response = await axiosClient.get(SYSTEM_CONFIG_ENDPOINTS.SLOT_CONFIG);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy cấu hình slot thất bại');
    }
};

/** PUT /api/system/working-hours/slot-config */
export const updateSlotConfig = async (data: any): Promise<any> => {
    try {
        const response = await axiosClient.put(SYSTEM_CONFIG_ENDPOINTS.SLOT_CONFIG, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật slot thất bại');
    }
};

// ============================================
// 1.4.3 Quy định nghiệp vụ
// ============================================

/** GET /api/system/business-rules */
export const getBusinessRules = async (): Promise<any> => {
    try {
        const response = await axiosClient.get(SYSTEM_CONFIG_ENDPOINTS.BUSINESS_RULES);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy quy định nghiệp vụ thất bại');
    }
};

/** PUT /api/system/business-rules/bulk */
export const updateBusinessRulesBulk = async (data: any): Promise<any> => {
    try {
        const response = await axiosClient.put(SYSTEM_CONFIG_ENDPOINTS.BUSINESS_RULES_BULK, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật quy định thất bại');
    }
};

/** GET /api/system/business-rules/{key} */
export const getBusinessRule = async (key: string): Promise<any> => {
    try {
        const response = await axiosClient.get(SYSTEM_CONFIG_ENDPOINTS.BUSINESS_RULE(key));
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy quy định thất bại');
    }
};

/** PUT /api/system/business-rules/{key} */
export const updateBusinessRule = async (key: string, data: any): Promise<any> => {
    try {
        const response = await axiosClient.put(SYSTEM_CONFIG_ENDPOINTS.BUSINESS_RULE(key), data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật quy định thất bại');
    }
};

// ============================================
// 1.4.4 Bảo mật
// ============================================

/** GET /api/system/security-settings */
export const getSecuritySettings = async (): Promise<any> => {
    try {
        const response = await axiosClient.get(SYSTEM_CONFIG_ENDPOINTS.SECURITY_SETTINGS);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy cấu hình bảo mật thất bại');
    }
};

/** PUT /api/system/security-settings */
export const updateSecuritySettings = async (data: any): Promise<any> => {
    try {
        const response = await axiosClient.put(SYSTEM_CONFIG_ENDPOINTS.SECURITY_SETTINGS, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật bảo mật thất bại');
    }
};

// ============================================
// 1.4.5 Đa ngôn ngữ
// ============================================

/** GET /api/system/i18n/supported */
export const getSupportedLanguages = async (): Promise<any> => {
    try {
        const response = await axiosClient.get(SYSTEM_CONFIG_ENDPOINTS.I18N_SUPPORTED);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy ngôn ngữ hỗ trợ thất bại');
    }
};

/** GET /api/system/i18n */
export const getI18nConfig = async (): Promise<any> => {
    try {
        const response = await axiosClient.get(SYSTEM_CONFIG_ENDPOINTS.I18N);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy cấu hình ngôn ngữ thất bại');
    }
};

/** PUT /api/system/i18n */
export const updateI18nConfig = async (data: any): Promise<any> => {
    try {
        const response = await axiosClient.put(SYSTEM_CONFIG_ENDPOINTS.I18N, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật ngôn ngữ thất bại');
    }
};

// ============================================
// 1.4.6 Email/SMS
// ============================================

/** GET /api/system/notification-config/email */
export const getEmailConfig = async (): Promise<any> => {
    try {
        const response = await axiosClient.get(SYSTEM_CONFIG_ENDPOINTS.NOTIFICATION_CONFIG_EMAIL);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy cấu hình email thất bại');
    }
};

/** PUT /api/system/notification-config/email */
export const updateEmailConfig = async (data: any): Promise<any> => {
    try {
        const response = await axiosClient.put(SYSTEM_CONFIG_ENDPOINTS.NOTIFICATION_CONFIG_EMAIL, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật cấu hình email thất bại');
    }
};

/** GET /api/system/notification-config/sms */
export const getSmsConfig = async (): Promise<any> => {
    try {
        const response = await axiosClient.get(SYSTEM_CONFIG_ENDPOINTS.NOTIFICATION_CONFIG_SMS);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy cấu hình SMS thất bại');
    }
};

/** PUT /api/system/notification-config/sms */
export const updateSmsConfig = async (data: any): Promise<any> => {
    try {
        const response = await axiosClient.put(SYSTEM_CONFIG_ENDPOINTS.NOTIFICATION_CONFIG_SMS, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật cấu hình SMS thất bại');
    }
};

/** POST /api/system/notification-config/test */
export const testNotificationConfig = async (data: { type: 'email' | 'sms'; to: string }): Promise<any> => {
    try {
        const response = await axiosClient.post(SYSTEM_CONFIG_ENDPOINTS.NOTIFICATION_CONFIG_TEST, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Gửi thử email/SMS thất bại');
    }
};

// ============================================
// 1.4.7 Tham số hệ thống
// ============================================

/** GET /api/system/settings/modules */
export const getSettingsModules = async (): Promise<any> => {
    try {
        const response = await axiosClient.get(SYSTEM_CONFIG_ENDPOINTS.SETTINGS_MODULES);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách modules thất bại');
    }
};

/** GET /api/system/settings */
export const getSystemSettings = async (params?: {
    page?: number;
    limit?: number;
    module?: string;
}): Promise<any> => {
    try {
        const response = await axiosClient.get(SYSTEM_CONFIG_ENDPOINTS.SETTINGS, { params });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy tham số hệ thống thất bại');
    }
};

/** POST /api/system/settings */
export const createSystemSetting = async (data: {
    key: string;
    value: string;
    module?: string;
    description?: string;
}): Promise<any> => {
    try {
        const response = await axiosClient.post(SYSTEM_CONFIG_ENDPOINTS.SETTINGS, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Tạo tham số thất bại');
    }
};

/** GET /api/system/settings/{key} */
export const getSystemSetting = async (key: string): Promise<any> => {
    try {
        const response = await axiosClient.get(SYSTEM_CONFIG_ENDPOINTS.SETTING_BY_KEY(key));
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy tham số thất bại');
    }
};

/** PUT /api/system/settings/{key} */
export const updateSystemSetting = async (key: string, data: { value: string }): Promise<any> => {
    try {
        const response = await axiosClient.put(SYSTEM_CONFIG_ENDPOINTS.SETTING_BY_KEY(key), data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật tham số thất bại');
    }
};

/** DELETE /api/system/settings/{key} */
export const deleteSystemSetting = async (key: string): Promise<any> => {
    try {
        const response = await axiosClient.delete(SYSTEM_CONFIG_ENDPOINTS.SETTING_BY_KEY(key));
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Xóa tham số thất bại');
    }
};

// ============================================
// 1.4.8 Phân quyền cấu hình
// ============================================

/** GET /api/system/config-permissions */
export const getConfigPermissions = async (): Promise<any> => {
    try {
        const response = await axiosClient.get(SYSTEM_CONFIG_ENDPOINTS.CONFIG_PERMISSIONS);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy phân quyền cấu hình thất bại');
    }
};

/** PUT /api/system/config-permissions */
export const updateConfigPermissions = async (data: any): Promise<any> => {
    try {
        const response = await axiosClient.put(SYSTEM_CONFIG_ENDPOINTS.CONFIG_PERMISSIONS, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật phân quyền thất bại');
    }
};

export default {
    // 1.4.1
    getFacilityInfo, updateFacilityInfo, uploadFacilityLogo,
    // 1.4.2
    getWorkingHours, updateWorkingHours, getSlotConfig, updateSlotConfig,
    // 1.4.3
    getBusinessRules, updateBusinessRulesBulk, getBusinessRule, updateBusinessRule,
    // 1.4.4
    getSecuritySettings, updateSecuritySettings,
    // 1.4.5
    getSupportedLanguages, getI18nConfig, updateI18nConfig,
    // 1.4.6
    getEmailConfig, updateEmailConfig, getSmsConfig, updateSmsConfig, testNotificationConfig,
    // 1.4.7
    getSettingsModules, getSystemSettings, createSystemSetting,
    getSystemSetting, updateSystemSetting, deleteSystemSetting,
    // 1.4.8
    getConfigPermissions, updateConfigPermissions,
};
