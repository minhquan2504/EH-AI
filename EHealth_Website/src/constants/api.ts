/**
 * API Endpoints constants
 * Định nghĩa tất cả API endpoints — đồng bộ với Swagger docs
 * 
 * Backend: http://160.250.186.97:3000/api-docs
 * KHÔNG hard-code endpoint strings trong components
 * @lastSync 2026-03-08
 */

export const API = {
    // =============================================
    // 1.2 Auth endpoints — ✅ khớp Swagger
    // =============================================
    AUTH: {
        LOGIN_EMAIL: "/api/auth/login/email",
        LOGIN_PHONE: "/api/auth/login/phone",
        REGISTER_EMAIL: "/api/auth/register/email",
        REGISTER_PHONE: "/api/auth/register/phone",
        LOGOUT: "/api/auth/logout",
        REFRESH: "/api/auth/refresh-token",
        FORGOT_PASSWORD: "/api/auth/forgot-password",
        VERIFY_EMAIL: "/api/auth/verify-email",
        RESET_PASSWORD: "/api/auth/reset-password",
        UNLOCK_ACCOUNT: "/api/auth/unlock-account",
        SESSIONS: "/api/auth/sessions",
        SESSION_DELETE: (id: string) => `/api/auth/sessions/${id}`,
        SESSIONS_DELETE_OTHER: "/api/auth/sessions/other",
        ME_ROLES: "/api/auth/me/roles",
        ME_MENUS: "/api/auth/me/menus",
        ME_PERMISSIONS: "/api/auth/me/permissions",
    },

    // =============================================
    // 1.6 Profile — ✅ khớp Swagger
    // =============================================
    PROFILE: {
        ME: "/api/profile/me",
        CHANGE_PASSWORD: "/api/profile/password",
        SESSIONS: "/api/profile/sessions",
        SESSION_DELETE: (sessionId: string) => `/api/profile/sessions/${sessionId}`,
        SETTINGS: "/api/profile/settings",
    },

    // =============================================
    // 1.1 Users management — ✅ bổ sung đầy đủ
    // =============================================
    USERS: {
        ACCOUNT_STATUS: "/api/users/account-status",
        LIST: "/api/users",
        CREATE: "/api/users",
        SEARCH: "/api/users/search",
        DETAIL: (id: string) => `/api/users/${id}`,
        UPDATE: (id: string) => `/api/users/${id}`,
        DELETE: (id: string) => `/api/users/${id}`,
        UNLOCK: (id: string) => `/api/users/${id}/unlock`,
        STATUS: (id: string) => `/api/users/${id}/status`,
        STATUS_HISTORY: (id: string) => `/api/users/${id}/status-history`,
        RESET_PASSWORD: (id: string) => `/api/users/${id}/reset-password`,
        CHANGE_PASSWORD: (id: string) => `/api/users/${id}/change-password`,
        ROLES: (id: string) => `/api/users/${id}/roles`,
        ROLE_DELETE: (userId: string, roleId: string) => `/api/users/${userId}/roles/${roleId}`,
        FACILITIES: (id: string) => `/api/users/${id}/facilities`,
        FACILITY_UPDATE: (userId: string, facilityId: string) => `/api/users/${userId}/facilities/${facilityId}`,
        FACILITY_DELETE: (userId: string, facilityId: string) => `/api/users/${userId}/facilities/${facilityId}`,
        IMPORT: "/api/users/import",
        IMPORT_VALIDATE: "/api/users/import/validate",
        IMPORT_HISTORY: "/api/users/import/history",
        EXPORT: "/api/users/export",
    },

    // =============================================
    // 1.1.9 Facilities — dropdown
    // =============================================
    FACILITIES: {
        LIST: "/api/facilities",
    },

    // =============================================
    // 1.3 Role & Permission Management
    // =============================================
    ROLES: {
        LIST: "/api/roles",
        CREATE: "/api/roles",
        DETAIL: (id: string) => `/api/roles/${id}`,
        UPDATE: (id: string) => `/api/roles/${id}`,         // PATCH
        DELETE: (id: string) => `/api/roles/${id}`,
        STATUS: (id: string) => `/api/roles/${id}/status`,   // PATCH
        PERMISSIONS: (id: string) => `/api/roles/${id}/permissions`,
        PERMISSION_DELETE: (roleId: string, permId: string) => `/api/roles/${roleId}/permissions/${permId}`,
        MENUS: (id: string) => `/api/roles/${id}/menus`,
        MENU_DELETE: (roleId: string, menuId: string) => `/api/roles/${roleId}/menus/${menuId}`,
        API_PERMISSIONS: (id: string) => `/api/roles/${id}/api-permissions`,
        API_PERMISSION_DELETE: (roleId: string, apiId: string) => `/api/roles/${roleId}/api-permissions/${apiId}`,
    },

    PERMISSIONS: {
        LIST: "/api/permissions",
        CREATE: "/api/permissions",
        DETAIL: (id: string) => `/api/permissions/${id}`,
        UPDATE: (id: string) => `/api/permissions/${id}`,   // PATCH
        DELETE: (id: string) => `/api/permissions/${id}`,
    },

    MODULES: {
        LIST: "/api/modules",
        PERMISSIONS: (name: string) => `/api/modules/${name}/permissions`,
    },

    MENUS: {
        LIST: "/api/menus",
        CREATE: "/api/menus",
        UPDATE: (id: string) => `/api/menus/${id}`,         // PATCH
        DELETE: (id: string) => `/api/menus/${id}`,
    },

    API_PERMISSIONS: {
        LIST: "/api/api-permissions",
        CREATE: "/api/api-permissions",
        UPDATE: (id: string) => `/api/api-permissions/${id}`, // PATCH
        DELETE: (id: string) => `/api/api-permissions/${id}`,
    },

    // =============================================
    // 1.4 System Configuration
    // =============================================
    SYSTEM: {
        FACILITY_INFO: "/api/system/facility-info",
        FACILITY_LOGO: "/api/system/facility-info/logo",
        WORKING_HOURS: "/api/system/working-hours",
        SLOT_CONFIG: "/api/system/working-hours/slot-config",
        BUSINESS_RULES: "/api/system/business-rules",
        BUSINESS_RULES_BULK: "/api/system/business-rules/bulk",
        BUSINESS_RULE: (key: string) => `/api/system/business-rules/${key}`,
        SECURITY_SETTINGS: "/api/system/security-settings",
        I18N: "/api/system/i18n",
        I18N_SUPPORTED: "/api/system/i18n/supported",
        NOTIFICATION_CONFIG_EMAIL: "/api/system/notification-config/email",
        NOTIFICATION_CONFIG_SMS: "/api/system/notification-config/sms",
        NOTIFICATION_CONFIG_TEST: "/api/system/notification-config/test",
        SETTINGS: "/api/system/settings",
        SETTINGS_MODULES: "/api/system/settings/modules",
        SETTING_BY_KEY: (key: string) => `/api/system/settings/${key}`,
        CONFIG_PERMISSIONS: "/api/system/config-permissions",
    },

    // =============================================
    // 1.5.1 Specialties
    // =============================================
    SPECIALTIES: {
        LIST: "/api/specialties",
        CREATE: "/api/specialties",
        DETAIL: (id: string) => `/api/specialties/${id}`,
        UPDATE: (id: string) => `/api/specialties/${id}`,
        DELETE: (id: string) => `/api/specialties/${id}`,
    },

    // =============================================
    // 1.5.2 Master Data
    // =============================================
    MASTER_DATA: {
        CATEGORIES_LIST: "/api/master-data/categories",
        CATEGORIES_CREATE: "/api/master-data/categories",
        CATEGORIES_DETAIL: (id: string) => `/api/master-data/categories/${id}`,
        CATEGORIES_UPDATE: (id: string) => `/api/master-data/categories/${id}`,
        CATEGORIES_DELETE: (id: string) => `/api/master-data/categories/${id}`,
        CATEGORIES_EXPORT: "/api/master-data/categories/export",
        CATEGORIES_IMPORT: "/api/master-data/categories/import",
        ITEMS_LIST: (code: string) => `/api/master-data/categories/${code}/items`,
        ITEMS_CREATE: (code: string) => `/api/master-data/categories/${code}/items`,
        ITEMS_EXPORT: (code: string) => `/api/master-data/categories/${code}/items/export`,
        ITEMS_IMPORT: (code: string) => `/api/master-data/categories/${code}/items/import`,
        ITEMS_ALL: "/api/master-data/items",
        ITEMS_UPDATE: (id: string) => `/api/master-data/items/${id}`,
        ITEMS_DELETE: (id: string) => `/api/master-data/items/${id}`,
    },

    // =============================================
    // 1.5.3 Pharmacy
    // =============================================
    PHARMACY: {
        CATEGORIES_LIST: "/api/pharmacy/categories",
        CATEGORIES_CREATE: "/api/pharmacy/categories",
        CATEGORIES_DETAIL: (id: string) => `/api/pharmacy/categories/${id}`,
        CATEGORIES_UPDATE: (id: string) => `/api/pharmacy/categories/${id}`,
        CATEGORIES_DELETE: (id: string) => `/api/pharmacy/categories/${id}`,
        CATEGORIES_EXPORT: "/api/pharmacy/categories/export",
        CATEGORIES_IMPORT: "/api/pharmacy/categories/import",
        CATEGORIES_STATUS: (id: string) => `/api/pharmacy/categories/${id}/status`,
        DRUGS_LIST: "/api/pharmacy/drugs",
        DRUGS_CREATE: "/api/pharmacy/drugs",
        DRUGS_DETAIL: (id: string) => `/api/pharmacy/drugs/${id}`,
        DRUGS_UPDATE: (id: string) => `/api/pharmacy/drugs/${id}`,
        DRUGS_DELETE: (id: string) => `/api/pharmacy/drugs/${id}`,
        DRUGS_ACTIVE: "/api/pharmacy/drugs/active",
        DRUGS_EXPORT: "/api/pharmacy/drugs/export",
        DRUGS_IMPORT: "/api/pharmacy/drugs/import",
        DRUGS_STATUS: (id: string) => `/api/pharmacy/drugs/${id}/status`,
    },

    // =============================================
    // 1.5.4-1.5.5 Medical Services
    // =============================================
    MEDICAL_SERVICES: {
        MASTER_LIST: "/api/medical-services/master",
        MASTER_CREATE: "/api/medical-services/master",
        MASTER_DETAIL: (id: string) => `/api/medical-services/master/${id}`,
        MASTER_UPDATE: (id: string) => `/api/medical-services/master/${id}`,
        MASTER_DELETE: (id: string) => `/api/medical-services/master/${id}`,
        MASTER_STATUS: (id: string) => `/api/medical-services/master/${id}/status`,
        FACILITY_SERVICES: (fId: string) => `/api/medical-services/facilities/${fId}/services`,
        FACILITY_ACTIVE: (fId: string) => `/api/medical-services/facilities/${fId}/active-services`,
    },

    // =============================================
    // 1.7 Notifications
    // =============================================
    NOTIFICATIONS: {
        CATEGORIES: "/api/notifications/categories",
        CATEGORY_UPDATE: (id: string) => `/api/notifications/categories/${id}`,
        CATEGORY_DELETE: (id: string) => `/api/notifications/categories/${id}`,
        TEMPLATES: "/api/notifications/templates",
        TEMPLATE_UPDATE: (id: string) => `/api/notifications/templates/${id}`,
        TEMPLATE_DELETE: (id: string) => `/api/notifications/templates/${id}`,
        ROLE_CONFIGS: "/api/notifications/role-configs",
        ROLE_CONFIG_UPDATE: (roleId: string, categoryId: string) =>
            `/api/notifications/role-configs/${roleId}/${categoryId}`,
        INBOX: "/api/notifications/inbox",
        MARK_READ: (id: string) => `/api/notifications/inbox/${id}/read`,
        MARK_ALL_READ: "/api/notifications/inbox/read-all",
        ADMIN_BROADCAST: "/api/notifications/inbox/admin-broadcast",
    },

    // =============================================
    // 1.8 Audit Logs
    // =============================================
    AUDIT_LOGS: {
        LIST: "/api/system/audit-logs",
        DETAIL: (id: string) => `/api/system/audit-logs/${id}`,
        EXPORT_EXCEL: "/api/system/audit-logs/export-excel",
    },

    // =============================================
    // Chưa có trong Swagger — giữ nguyên
    // =============================================
    DOCTORS: {
        LIST: "/api/doctors",
        DETAIL: (id: string) => `/api/doctors/${id}`,
        CREATE: "/api/doctors",
        UPDATE: (id: string) => `/api/doctors/${id}`,
        DELETE: (id: string) => `/api/doctors/${id}`,
        SCHEDULES: (id: string) => `/api/doctors/${id}/schedule`,
    },

    DEPARTMENTS: {
        LIST: "/api/departments",
        DETAIL: (id: string) => `/api/departments/${id}`,
        CREATE: "/api/departments",
        UPDATE: (id: string) => `/api/departments/${id}`,
        DELETE: (id: string) => `/api/departments/${id}`,
    },

    APPOINTMENTS: {
        LIST: "/api/appointments",
        DETAIL: (id: string) => `/api/appointments/${id}`,
        CREATE: "/api/appointments",
        UPDATE: (id: string) => `/api/appointments/${id}`,
        APPROVE: (id: string) => `/api/appointments/${id}/confirm`,
        CANCEL: (id: string) => `/api/appointments/${id}/cancel`,
        CHECK_IN: (id: string) => `/api/appointments/${id}/check-in`,
    },

    PATIENTS: {
        LIST: "/api/patients",
        DETAIL: (id: string) => `/api/patients/${id}`,
        CREATE: "/api/patients",
        UPDATE: (id: string) => `/api/patients/${id}`,
        EMR: (id: string) => `/api/patients/${id}/emr`,
        VISITS: (id: string) => `/api/patients/${id}/visits`,
    },

    PRESCRIPTIONS: {
        LIST: "/api/prescriptions",
        DETAIL: (id: string) => `/api/prescriptions/${id}`,
        CREATE: "/api/prescriptions",
        DISPENSE: (id: string) => `/api/prescriptions/${id}/dispense`,
    },

    STATISTICS: {
        DASHBOARD: "/api/reports/dashboard",
        REVENUE: "/api/reports/revenue",
        PATIENTS: "/api/reports/patients",
        DEPARTMENTS: "/api/reports/departments",
    },
} as const;
