/**
 * API Endpoints Configuration
 * Tập trung tất cả các endpoint API — đồng bộ với Swagger docs
 * 
 * Backend: http://160.250.186.97:3000/api-docs
 * @description Dễ dàng quản lý và thay đổi endpoints
 * @lastSync 2026-03-08
 */

// ============================================
// 1.2 Authentication Endpoints
// ✅ Đã khớp Swagger API
// ============================================
export const AUTH_ENDPOINTS = {
    LOGIN_EMAIL: '/api/auth/login/email',
    LOGIN_PHONE: '/api/auth/login/phone',
    REGISTER_EMAIL: '/api/auth/register/email',
    REGISTER_PHONE: '/api/auth/register/phone',
    LOGOUT: '/api/auth/logout',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    VERIFY_EMAIL: '/api/auth/verify-email',
    UNLOCK_ACCOUNT: '/api/auth/unlock-account',

    // 1.2.2 Session management
    SESSIONS: '/api/auth/sessions',
    SESSION_DELETE: (sessionId: string) => `/api/auth/sessions/${sessionId}`,
    SESSIONS_LOGOUT_ALL: '/api/auth/sessions/logout-all',    // POST: đăng xuất tất cả phiên

    // 1.3.7 User context — lấy role/menu/quyền sau khi đăng nhập
    ME_ROLES: '/api/auth/me/roles',
    ME_MENUS: '/api/auth/me/menus',
    ME_PERMISSIONS: '/api/auth/me/permissions',
};

// ============================================
// 1.6 Profile Endpoints
// ✅ Đã khớp Swagger: /api/profile/*
// ============================================
export const PROFILE_ENDPOINTS = {
    ME: '/api/profile/me',                    // GET: lấy profile, PUT: cập nhật profile
    CHANGE_PASSWORD: '/api/profile/password',  // PUT: đổi mật khẩu
    SESSIONS: '/api/profile/sessions',         // GET: xem lịch sử/thiết bị đăng nhập
    SESSIONS_LOGOUT_ALL: '/api/profile/sessions',         // DELETE: đăng xuất tất cả thiết bị khác
    SESSION_DELETE: (sessionId: string) => `/api/profile/sessions/${sessionId}`, // DELETE: đăng xuất thiết bị cụ thể
    SETTINGS: '/api/profile/settings',         // PUT: cài đặt cá nhân
};

// ============================================
// 1.1 User Management Endpoints
// ✅ Đã bổ sung đầy đủ theo Swagger
// ============================================
export const USER_ENDPOINTS = {
    // 1.1.1 Quản lý User
    ACCOUNT_STATUS: '/api/users/account-status', // GET: danh sách trạng thái tài khoản
    LIST: '/api/users',                           // GET: danh sách users
    CREATE: '/api/users',                         // POST: tạo user
    SEARCH: '/api/users/search',                  // GET: tìm kiếm user
    DETAIL: (id: string) => `/api/users/${id}`,   // GET: chi tiết user

    // 1.1.2 Khóa / mở khóa tài khoản
    LOCK: (id: string) => `/api/users/${id}/lock`,     // PATCH: khóa tài khoản
    UNLOCK: (id: string) => `/api/users/${id}/unlock`, // PATCH: mở khóa tài khoản

    // 1.1.3 Quản lý trạng thái tài khoản
    STATUS: (id: string) => `/api/users/${id}/status`,               // PATCH: cập nhật trạng thái
    STATUS_HISTORY: (id: string) => `/api/users/${id}/status-history`, // GET: lịch sử trạng thái

    // 1.1.4 Reset mật khẩu người dùng
    RESET_PASSWORD: (id: string) => `/api/users/${id}/reset-password`,   // POST: admin reset pw
    CHANGE_PASSWORD: (id: string) => `/api/users/${id}/change-password`, // POST: admin đổi pw

    // 1.1.5 Gán vai trò cho người dùng
    ROLES: (id: string) => `/api/users/${id}/roles`,                         // GET/POST
    ROLE_DELETE: (userId: string, roleId: string) => `/api/users/${userId}/roles/${roleId}`, // DELETE

    // 1.1.6 Gán người dùng vào cơ sở y tế
    FACILITIES: (id: string) => `/api/users/${id}/facilities`,                                         // GET/POST
    FACILITY_UPDATE: (userId: string, facilityId: string) => `/api/users/${userId}/facilities/${facilityId}`, // PUT
    FACILITY_DELETE: (userId: string, facilityId: string) => `/api/users/${userId}/facilities/${facilityId}`, // DELETE

    // 1.1.7 Import người dùng hàng loạt
    IMPORT: '/api/users/import',                   // POST: import users
    IMPORT_VALIDATE: '/api/users/import/validate', // POST: validate import file
    IMPORT_HISTORY: '/api/users/import/history',   // GET: lịch sử import

    // 1.1.8 Export danh sách người dùng
    EXPORT: '/api/users/export',                   // GET/POST: export users
};

// ============================================
// 1.1.9 Facility Endpoints (dropdown)
// ✅ Đã khớp Swagger
// ============================================
export const FACILITY_ENDPOINTS = {
    LIST: '/api/facilities',                // GET: dropdown danh sách cơ sở y tế
};

// ============================================
// 1.3 Role & Permission Management
// ✅ Bổ sung đầy đủ theo Swagger
// ============================================

// 1.3.1 Role Management
export const ROLE_ENDPOINTS = {
    LIST: '/api/roles',                                           // GET: danh sách roles
    CREATE: '/api/roles',                                         // POST: tạo role
    DETAIL: (roleId: string) => `/api/roles/${roleId}`,           // GET: chi tiết role
    UPDATE: (roleId: string) => `/api/roles/${roleId}`,           // PATCH: cập nhật role
    DELETE: (roleId: string) => `/api/roles/${roleId}`,           // DELETE: xóa role
    STATUS: (roleId: string) => `/api/roles/${roleId}/status`,    // PATCH: bật/tắt role

    // 1.3.3 Gán quyền cho vai trò
    PERMISSIONS: (roleId: string) => `/api/roles/${roleId}/permissions`,     // GET/PUT/POST
    PERMISSION_DELETE: (roleId: string, permId: string) => `/api/roles/${roleId}/permissions/${permId}`, // DELETE

    // 1.3.5 Menu theo vai trò
    MENUS: (roleId: string) => `/api/roles/${roleId}/menus`,                 // GET/POST
    MENU_DELETE: (roleId: string, menuId: string) => `/api/roles/${roleId}/menus/${menuId}`, // DELETE

    // 1.3.6 API theo vai trò
    API_PERMISSIONS: (roleId: string) => `/api/roles/${roleId}/api-permissions`,     // GET/POST
    API_PERMISSION_DELETE: (roleId: string, apiId: string) => `/api/roles/${roleId}/api-permissions/${apiId}`, // DELETE
};

// 1.3.2 Permission Management
export const PERMISSION_ENDPOINTS = {
    LIST: '/api/permissions',                                             // GET: danh sách permissions
    CREATE: '/api/permissions',                                           // POST: tạo permission
    DETAIL: (permId: string) => `/api/permissions/${permId}`,             // GET: chi tiết
    UPDATE: (permId: string) => `/api/permissions/${permId}`,             // PATCH: cập nhật
    DELETE: (permId: string) => `/api/permissions/${permId}`,             // DELETE: xóa
};

// 1.3.4 Module Management
export const MODULE_ENDPOINTS = {
    LIST: '/api/modules',                                                    // GET: danh sách modules
    PERMISSIONS: (moduleName: string) => `/api/modules/${moduleName}/permissions`, // GET: quyền theo module
};

// 1.3.5 Menu Management
export const MENU_ENDPOINTS = {
    LIST: '/api/menus',                                             // GET: danh sách menus
    CREATE: '/api/menus',                                           // POST: tạo menu
    UPDATE: (menuId: string) => `/api/menus/${menuId}`,             // PATCH: cập nhật
    DELETE: (menuId: string) => `/api/menus/${menuId}`,             // DELETE: xóa
};

// 1.3.6 API Permissions
export const API_PERMISSION_ENDPOINTS = {
    LIST: '/api/api-permissions',                                    // GET: danh sách API endpoints
    CREATE: '/api/api-permissions',                                  // POST: tạo API endpoint
    UPDATE: (apiId: string) => `/api/api-permissions/${apiId}`,      // PATCH: cập nhật
    DELETE: (apiId: string) => `/api/api-permissions/${apiId}`,      // DELETE: xóa
};

// ============================================
// 1.4 System Configuration Endpoints
// ✅ Mới — đầy đủ theo Swagger
// ============================================
export const SYSTEM_CONFIG_ENDPOINTS = {
    // 1.4.1 Thông tin cơ sở y tế
    FACILITY_INFO: '/api/system/facility-info',          // GET/PUT
    FACILITY_LOGO: '/api/system/facility-info/logo',     // POST: upload logo

    // 1.4.2 Thời gian làm việc
    WORKING_HOURS: '/api/system/working-hours',               // GET/PUT
    SLOT_CONFIG: '/api/system/working-hours/slot-config',     // GET/PUT

    // 1.4.3 Quy định nghiệp vụ
    BUSINESS_RULES: '/api/system/business-rules',                               // GET: tất cả
    BUSINESS_RULES_BULK: '/api/system/business-rules/bulk',                     // PUT: cập nhật nhiều
    BUSINESS_RULE: (key: string) => `/api/system/business-rules/${key}`,        // GET/PUT

    // 1.4.4 Bảo mật
    SECURITY_SETTINGS: '/api/system/security-settings',       // GET/PUT

    // 1.4.5 Đa ngôn ngữ
    I18N: '/api/system/i18n',                                 // GET/PUT
    I18N_SUPPORTED: '/api/system/i18n/supported',             // GET

    // 1.4.6 Email/SMS
    NOTIFICATION_CONFIG_EMAIL: '/api/system/notification-config/email', // GET/PUT
    NOTIFICATION_CONFIG_SMS: '/api/system/notification-config/sms',     // GET/PUT
    NOTIFICATION_CONFIG_TEST: '/api/system/notification-config/test',   // POST

    // 1.4.7 Tham số hệ thống
    SETTINGS: '/api/system/settings',                                      // GET/POST
    SETTINGS_MODULES: '/api/system/settings/modules',                      // GET: dropdown
    SETTING_BY_KEY: (key: string) => `/api/system/settings/${key}`,        // GET/PUT/DELETE

    // 1.4.8 Phân quyền cấu hình
    CONFIG_PERMISSIONS: '/api/system/config-permissions',   // GET/PUT
};

// ============================================
// 1.5.1 Specialty Endpoints
// ✅ Mới — theo Swagger
// ============================================
export const SPECIALTY_ENDPOINTS = {
    LIST: '/api/specialties',                                    // GET: danh sách chuyên khoa
    CREATE: '/api/specialties',                                  // POST: tạo chuyên khoa
    DETAIL: (id: string) => `/api/specialties/${id}`,            // GET: chi tiết
    UPDATE: (id: string) => `/api/specialties/${id}`,            // PUT: cập nhật
    DELETE: (id: string) => `/api/specialties/${id}`,            // DELETE: xóa mềm
};

// ============================================
// 1.5.2 Master Data Endpoints
// ✅ Đã bổ sung items export/import
// ============================================
export const MASTER_DATA_ENDPOINTS = {
    // Categories
    CATEGORIES_LIST: '/api/master-data/categories',
    CATEGORIES_CREATE: '/api/master-data/categories',
    CATEGORIES_DETAIL: (id: string) => `/api/master-data/categories/${id}`,
    CATEGORIES_UPDATE: (id: string) => `/api/master-data/categories/${id}`,
    CATEGORIES_DELETE: (id: string) => `/api/master-data/categories/${id}`,
    CATEGORIES_EXPORT: '/api/master-data/categories/export',
    CATEGORIES_IMPORT: '/api/master-data/categories/import',

    // Items within a category
    ITEMS_LIST: (categoryCode: string) => `/api/master-data/categories/${categoryCode}/items`,
    ITEMS_CREATE: (categoryCode: string) => `/api/master-data/categories/${categoryCode}/items`,
    ITEMS_EXPORT: (categoryCode: string) => `/api/master-data/categories/${categoryCode}/items/export`,
    ITEMS_IMPORT: (categoryCode: string) => `/api/master-data/categories/${categoryCode}/items/import`,

    // Items direct
    ITEMS_ALL: '/api/master-data/items',                        // GET: tất cả items (Admin)
    ITEMS_UPDATE: (id: string) => `/api/master-data/items/${id}`,
    ITEMS_DELETE: (id: string) => `/api/master-data/items/${id}`,
};

// ============================================
// 1.5.3 Pharmacy Endpoints
// ✅ Đã bổ sung PATCH status
// ============================================
export const PHARMACY_ENDPOINTS = {
    // --- Drug Categories ---
    CATEGORIES_LIST: '/api/pharmacy/categories',
    CATEGORIES_CREATE: '/api/pharmacy/categories',
    CATEGORIES_DETAIL: (id: string) => `/api/pharmacy/categories/${id}`,
    CATEGORIES_UPDATE: (id: string) => `/api/pharmacy/categories/${id}`,
    CATEGORIES_DELETE: (id: string) => `/api/pharmacy/categories/${id}`,
    CATEGORIES_EXPORT: '/api/pharmacy/categories/export',
    CATEGORIES_IMPORT: '/api/pharmacy/categories/import',
    CATEGORIES_STATUS: (id: string) => `/api/pharmacy/categories/${id}/status`, // PATCH: bật/tắt

    // --- Drugs (Danh mục thuốc) ---
    DRUGS_LIST: '/api/pharmacy/drugs',
    DRUGS_CREATE: '/api/pharmacy/drugs',
    DRUGS_DETAIL: (id: string) => `/api/pharmacy/drugs/${id}`,
    DRUGS_UPDATE: (id: string) => `/api/pharmacy/drugs/${id}`,
    DRUGS_DELETE: (id: string) => `/api/pharmacy/drugs/${id}`,
    DRUGS_ACTIVE: '/api/pharmacy/drugs/active',     // GET: danh sách thuốc active (cho dropdown)
    DRUGS_EXPORT: '/api/pharmacy/drugs/export',     // GET: xuất Excel
    DRUGS_IMPORT: '/api/pharmacy/drugs/import',     // POST: nhập từ Excel
    DRUGS_STATUS: (id: string) => `/api/pharmacy/drugs/${id}/status`, // PATCH: bật/tắt
};

// Backward compatibility — giữ tên cũ, map sang mới
export const MEDICINE_ENDPOINTS = {
    LIST: PHARMACY_ENDPOINTS.DRUGS_LIST,
    DETAIL: (id: string) => PHARMACY_ENDPOINTS.DRUGS_DETAIL(id),
    CREATE: PHARMACY_ENDPOINTS.DRUGS_CREATE,
    UPDATE: (id: string) => PHARMACY_ENDPOINTS.DRUGS_UPDATE(id),
    DELETE: (id: string) => PHARMACY_ENDPOINTS.DRUGS_DELETE(id),
    ACTIVE: PHARMACY_ENDPOINTS.DRUGS_ACTIVE,
    EXPORT: PHARMACY_ENDPOINTS.DRUGS_EXPORT,
    IMPORT: PHARMACY_ENDPOINTS.DRUGS_IMPORT,
};

// ============================================
// 1.5.4-1.5.5 Medical Services Endpoints
// ✅ Đã khớp Swagger
// ============================================
export const MEDICAL_SERVICE_ENDPOINTS = {
    // Master services (dịch vụ gốc)
    MASTER_LIST: '/api/medical-services/master',
    MASTER_CREATE: '/api/medical-services/master',
    MASTER_DETAIL: (id: string) => `/api/medical-services/master/${id}`,
    MASTER_UPDATE: (id: string) => `/api/medical-services/master/${id}`,
    MASTER_DELETE: (id: string) => `/api/medical-services/master/${id}`,
    MASTER_STATUS: (id: string) => `/api/medical-services/master/${id}/status`,

    // Facility services (dịch vụ theo cơ sở)
    FACILITY_SERVICES: (facilityId: string) => `/api/medical-services/facilities/${facilityId}/services`,
    FACILITY_ACTIVE_SERVICES: (facilityId: string) => `/api/medical-services/facilities/${facilityId}/active-services`,
};

// ============================================
// 1.7 Notification Endpoints
// ✅ Bổ sung CRUD categories, templates, role-configs
// ============================================
export const NOTIFICATION_ENDPOINTS = {
    // 1.7.1 Categories
    CATEGORIES: '/api/notifications/categories',                                    // GET/POST
    CATEGORY_UPDATE: (id: string) => `/api/notifications/categories/${id}`,          // PUT
    CATEGORY_DELETE: (id: string) => `/api/notifications/categories/${id}`,          // DELETE

    // 1.7.2 Templates
    TEMPLATES: '/api/notifications/templates',                                       // GET/POST
    TEMPLATE_UPDATE: (id: string) => `/api/notifications/templates/${id}`,            // PUT
    TEMPLATE_DELETE: (id: string) => `/api/notifications/templates/${id}`,            // DELETE

    // 1.7.3 Role-based config
    ROLE_CONFIGS: '/api/notifications/role-configs',                                  // GET: ma trận
    ROLE_CONFIG_UPDATE: (roleId: string, categoryId: string) =>
        `/api/notifications/role-configs/${roleId}/${categoryId}`,                     // PUT

    // 1.7.4 Broadcast
    ADMIN_BROADCAST: '/api/notifications/inbox/admin-broadcast',                      // POST

    // 1.7.5 User Inbox
    INBOX: '/api/notifications/inbox',                                                // GET
    MARK_READ: (id: string) => `/api/notifications/inbox/${id}/read`,                 // PUT
    MARK_ALL_READ: '/api/notifications/inbox/read-all',                               // PUT
};

// ============================================
// 1.8 Audit Log Endpoints
// ✅ Đã khớp Swagger
// ============================================
export const AUDIT_LOG_ENDPOINTS = {
    LIST: '/api/system/audit-logs',
    DETAIL: (id: string) => `/api/system/audit-logs/${id}`,
    EXPORT_EXCEL: '/api/system/audit-logs/export-excel',
};

// ============================================
// 1.1.x Staff Management Endpoints (Nhân sự y tế)
// ✅ Swagger: GET /api/staff — trả về bác sĩ, y tá, dược sĩ, v.v. (KHÔNG bao gồm PATIENT)
// ============================================
export const STAFF_ENDPOINTS = {
    LIST: '/api/staff',                               // GET: danh sách nhân sự (loại trừ PATIENT)
    DETAIL: (id: string) => `/api/staff/${id}`,       // GET: chi tiết nhân sự
    CREATE: '/api/staff',                             // POST: thêm nhân sự mới
    UPDATE: (id: string) => `/api/staff/${id}`,       // PUT: cập nhật
    DELETE: (id: string) => `/api/staff/${id}`,       // DELETE: xóa
    STATUS: (id: string) => `/api/staff/${id}/status`, // PATCH: bật/tắt
};

// ============================================
// Các endpoint chưa có trong Swagger — giữ nguyên cho tương lai
// ============================================

export const DOCTOR_ENDPOINTS = {
    LIST: '/api/doctors',
    DETAIL: (id: string) => `/api/doctors/${id}`,
    CREATE: '/api/doctors',
    UPDATE: (id: string) => `/api/doctors/${id}`,
    DELETE: (id: string) => `/api/doctors/${id}`,
    BY_DEPARTMENT: (departmentId: string) => `/api/doctors/department/${departmentId}`,
    SCHEDULE: (doctorId: string) => `/api/doctors/${doctorId}/schedule`,
};

export const PATIENT_ENDPOINTS = {
    LIST: '/api/patients',
    DETAIL: (id: string) => `/api/patients/${id}`,
    CREATE: '/api/patients',
    UPDATE: (id: string) => `/api/patients/${id}`,
    STATUS: (id: string) => `/api/patients/${id}/status`,
    LINK: '/api/patients/link',
    UPDATE_CONTACT: (patientId: string) => `/api/patients/${patientId}/contact`,
    ADD_CONTACT: (patientId: string) => `/api/patients/${patientId}/contacts`,
    EDIT_CONTACT: (patientId: string, contactId: string) => `/api/patients/${patientId}/contacts/${contactId}`,
    DELETE_CONTACT: (patientId: string, contactId: string) => `/api/patients/${patientId}/contacts/${contactId}`,
    ADD_RELATION: (patientId: string) => `/api/patients/${patientId}/relations`,
    EDIT_RELATION: (patientId: string, relationId: string) => `/api/patients/${patientId}/relations/${relationId}`,
    DELETE_RELATION: (patientId: string, relationId: string) => `/api/patients/${patientId}/relations/${relationId}`,
    MEDICAL_RECORDS: (patientId: string) => `/api/patients/${patientId}/medical-records`,
    PRESCRIPTIONS: (patientId: string) => `/api/patients/${patientId}/prescriptions`,
};

export const APPOINTMENT_ENDPOINTS = {
    LIST: '/api/appointments',
    DETAIL: (id: string) => `/api/appointments/${id}`,
    CREATE: '/api/appointments',
    UPDATE: (id: string) => `/api/appointments/${id}`,
    CANCEL: (id: string) => `/api/appointments/${id}/cancel`,
    CONFIRM: (id: string) => `/api/appointments/${id}/confirm`,
    BY_DOCTOR: (doctorId: string) => `/api/appointments/doctor/${doctorId}`,
    BY_PATIENT: (patientId: string) => `/api/appointments/patient/${patientId}`,
};

export const DEPARTMENT_ENDPOINTS = {
    LIST: '/api/departments',
    DETAIL: (id: string) => `/api/departments/${id}`,
    CREATE: '/api/departments',
    UPDATE: (id: string) => `/api/departments/${id}`,
    DELETE: (id: string) => `/api/departments/${id}`,
};

// ✅ Corrected từ Swagger thực tế
export const PRESCRIPTION_ENDPOINTS = {
    // Lấy đơn thuốc theo encounter (phiên khám)
    BY_ENCOUNTER: (encounterId: string) => `/api/prescriptions/${encounterId}`,
    SUMMARY: (encounterId: string) => `/api/prescriptions/${encounterId}/summary`,
    BY_DOCTOR: (doctorId: string) => `/api/prescriptions/by-doctor/${doctorId}`,
    BY_PATIENT: (patientId: string) => `/api/prescriptions/by-patient/${patientId}`,
    SEARCH: '/api/prescriptions/search',
    SEARCH_DRUGS: '/api/prescriptions/search-drugs',
    DETAILS: (prescriptionId: string) => `/api/prescriptions/${prescriptionId}/details`,
    UPDATE: (prescriptionId: string) => `/api/prescriptions/${prescriptionId}/update`,
    CANCEL: (prescriptionId: string) => `/api/prescriptions/${prescriptionId}/cancel`,
    CONFIRM: (prescriptionId: string) => `/api/prescriptions/${prescriptionId}/confirm`,
    // Backward compat — các endpoint cũ giữ lại
    LIST: '/api/prescriptions/by-doctor',
    CREATE: '/api/prescriptions',
    DETAIL: (id: string) => `/api/prescriptions/${id}`,
    DISPENSE: (id: string) => `/api/dispensing/${id}`,  // ✅ FIX: dùng /api/dispensing
};

// ✅ Corrected: /api/schedules không tồn tại — dùng /api/staff-schedules
export const SCHEDULE_ENDPOINTS = {
    LIST: '/api/staff-schedules',
    CREATE: '/api/staff-schedules',
    UPDATE: (id: string) => `/api/staff-schedules/${id}`,
    DELETE: (id: string) => `/api/staff-schedules/${id}`,
    BY_STAFF: (staffId: string) => `/api/staff-schedules/staff/${staffId}`,
    BY_DATE: (date: string) => `/api/staff-schedules/date/${date}`,
    CALENDAR: '/api/staff-schedules/calendar',
    SUSPEND: (id: string) => `/api/staff-schedules/${id}/suspend`,
    RESUME: (id: string) => `/api/staff-schedules/${id}/resume`,
    // Backward compat
    BY_DOCTOR: (doctorId: string) => `/api/staff-schedules/staff/${doctorId}`,
};

export const REPORT_ENDPOINTS = {
    DASHBOARD: '/api/reports/dashboard',
    REVENUE: '/api/reports/revenue',
    PATIENTS: '/api/reports/patients',
    APPOINTMENTS: '/api/reports/appointments',
    EXPORT_EXCEL: '/api/reports/export/excel',
    EXPORT_PDF: '/api/reports/export/pdf',
};

// ✅ Corrected: /api/emr không tồn tại — dùng /api/encounters + /api/medical-records
export const EMR_ENDPOINTS = {
    // Encounter (phiên khám)
    LIST: '/api/encounters',
    DETAIL: (id: string) => `/api/encounters/${id}`,
    CREATE: '/api/encounters',
    UPDATE: (id: string) => `/api/encounters/${id}`,
    BY_PATIENT: (patientId: string) => `/api/encounters/by-patient/${patientId}`,
    BY_APPOINTMENT: (appointmentId: string) => `/api/encounters/by-appointment/${appointmentId}`,
    STATUS: (id: string) => `/api/encounters/${id}/status`,
    // Medical records
    SIGN: (encounterId: string) => `/api/medical-records/${encounterId}/sign`,
    LOCK: (encounterId: string) => `/api/medical-records/${encounterId}/finalize`,
    SAVE_DRAFT: (encounterId: string) => `/api/medical-records/${encounterId}`,
    // Clinical examination (vitals, diagnosis)
    VITAL_SIGNS: (encounterId: string) => `/api/clinical-examinations/${encounterId}/vitals`,
    DIAGNOSES: (encounterId: string) => `/api/diagnoses/${encounterId}`,
    FINALIZE: (encounterId: string) => `/api/clinical-examinations/${encounterId}/finalize`,
};

export const DOCUMENT_ENDPOINTS = {
    LIST: (patientId: string) => `/api/patients/${patientId}/documents`,
    UPLOAD: (patientId: string) => `/api/patients/${patientId}/documents`,
    DETAIL: (patientId: string, docId: string) => `/api/patients/${patientId}/documents/${docId}`,
    DELETE: (patientId: string, docId: string) => `/api/patients/${patientId}/documents/${docId}`,
    VERSIONS: (patientId: string, docId: string) => `/api/patients/${patientId}/documents/${docId}/versions`,
};

// ✅ Corrected: PAY sử dụng /api/billing/payments, không phải /api/billing/invoices/{id}/pay
export const BILLING_ENDPOINTS = {
    // Invoices
    LIST: '/api/billing/invoices',
    DETAIL: (id: string) => `/api/billing/invoices/${id}`,
    CREATE: '/api/billing/invoices',
    BY_PATIENT: (patientId: string) => `/api/billing/invoices/by-patient/${patientId}`,
    BY_ENCOUNTER: (encounterId: string) => `/api/billing/invoices/by-encounter/${encounterId}`,
    GENERATE: (encounterId: string) => `/api/billing/invoices/generate/${encounterId}`,
    CANCEL: (id: string) => `/api/billing/invoices/${id}/cancel`,
    ITEMS: (id: string) => `/api/billing/invoices/${id}/items`,
    // Payments ✅ FIX
    PAY: '/api/billing/offline/pay',
    PAY_ONLINE: '/api/billing/payments',
    PAYMENTS: '/api/billing/payments',
    PAYMENT_DETAIL: (id: string) => `/api/billing/payments/${id}`,
    REFUND: (id: string) => `/api/billing/payments/${id}/refund`,
    // Transactions
    TRANSACTIONS: '/api/billing/offline/transactions',
    // Reconciliation
    RECONCILIATION: '/api/billing/reconciliation/sessions',
};

export const AI_ENDPOINTS = {
    CHAT: '/api/ai/chat',
    SYMPTOM_CHECK: '/api/ai/symptom-check',
    SUGGEST_APPOINTMENT: '/api/ai/suggest-appointment',
    SUMMARIZE_RECORD: (recordId: string) => `/api/ai/summarize/${recordId}`,
    ANALYZE: '/api/ai/analyze',
    LOGS: '/api/ai/logs',
};

// ✅ Corrected: /api/telemedicine không tồn tại — dùng /api/teleconsultation
export const TELEMEDICINE_ENDPOINTS = {
    // Booking
    LIST: '/api/teleconsultation/booking/my-bookings',
    BOOK: '/api/teleconsultation/booking',
    DETAIL: (id: string) => `/api/teleconsultation/booking/${id}`,
    CANCEL: (id: string) => `/api/teleconsultation/booking/${id}/cancel`,
    CONFIRM: (id: string) => `/api/teleconsultation/booking/${id}/confirm`,
    DOCTORS: '/api/teleconsultation/booking/doctors',
    SLOTS: '/api/teleconsultation/booking/slots',
    // Room
    ROOM: (id: string) => `/api/teleconsultation/room/${id}`,
    JOIN: (id: string) => `/api/teleconsultation/room/${id}/join`,
    LEAVE: (id: string) => `/api/teleconsultation/room/${id}/leave`,
    CLOSE_ROOM: (id: string) => `/api/teleconsultation/room/${id}/close`,
    ROOM_MESSAGES: (id: string) => `/api/teleconsultation/room/${id}/messages`,
    // Backward compat aliases
    CREATE: '/api/teleconsultation/booking',
    START: (id: string) => `/api/teleconsultation/room/${id}/join`,
    END: (id: string) => `/api/teleconsultation/room/${id}/leave`,
    CHAT: (id: string) => `/api/teleconsultation/room/${id}/messages`,
    SHARE_DOCUMENT: (id: string) => `/api/teleconsultation/room/${id}/files`,
    // Stats
    STATS: '/api/teleconsultation/stats',
    TYPES: '/api/teleconsultation/types',
};

// ✅ Corrected: /api/ehr/{patientId}/... → /api/ehr/patients/{patientId}/...
export const EHR_ENDPOINTS = {
    SUMMARY: (patientId: string) => `/api/ehr/patients/${patientId}/health-summary`,
    VITAL_HISTORY: (patientId: string) => `/api/ehr/patients/${patientId}/vitals`,
    VITALS_LATEST: (patientId: string) => `/api/ehr/patients/${patientId}/vitals/latest`,
    VITALS_TRENDS: (patientId: string) => `/api/ehr/patients/${patientId}/vitals/trends`,
    TREATMENT_HISTORY: (patientId: string) => `/api/ehr/patients/${patientId}/treatment-records`,
    TIMELINE: (patientId: string) => `/api/ehr/patients/${patientId}/timeline`,
    MEDICAL_HISTORY: (patientId: string) => `/api/ehr/patients/${patientId}/medical-histories`,
    ALLERGIES: (patientId: string) => `/api/ehr/patients/${patientId}/allergies`,
    CURRENT_MEDICATIONS: (patientId: string) => `/api/ehr/patients/${patientId}/current-medications`,
    DIAGNOSIS_HISTORY: (patientId: string) => `/api/ehr/patients/${patientId}/diagnosis-history`,
    PROFILE: (patientId: string) => `/api/ehr/patients/${patientId}/profile`,
    RISK_FACTORS: (patientId: string) => `/api/ehr/patients/${patientId}/risk-factors`,
    NOTES: (patientId: string) => `/api/ehr/patients/${patientId}/notes`,
};

// ============================================
// Encounter (Phiên khám bệnh)
// ✅ Swagger: /api/encounters/*
// ============================================
export const ENCOUNTER_ENDPOINTS = {
    LIST: '/api/encounters',
    ACTIVE: '/api/encounters/active',
    DETAIL: (id: string) => `/api/encounters/${id}`,
    CREATE: '/api/encounters',
    CREATE_FROM_APPOINTMENT: (appointmentId: string) => `/api/encounters/from-appointment/${appointmentId}`,
    BY_APPOINTMENT: (appointmentId: string) => `/api/encounters/by-appointment/${appointmentId}`,
    BY_PATIENT: (patientId: string) => `/api/encounters/by-patient/${patientId}`,
    STATUS: (id: string) => `/api/encounters/${id}/status`,
    ASSIGN_DOCTOR: (id: string) => `/api/encounters/${id}/assign-doctor`,
    ASSIGN_ROOM: (id: string) => `/api/encounters/${id}/assign-room`,
};

// ============================================
// Clinical Examination (Khám lâm sàng)
// ✅ Swagger: /api/clinical-examinations/*
// ============================================
export const CLINICAL_EXAM_ENDPOINTS = {
    BY_PATIENT: (patientId: string) => `/api/clinical-examinations/by-patient/${patientId}`,
    DETAIL: (encounterId: string) => `/api/clinical-examinations/${encounterId}`,
    VITALS: (encounterId: string) => `/api/clinical-examinations/${encounterId}/vitals`,
    SUMMARY: (encounterId: string) => `/api/clinical-examinations/${encounterId}/summary`,
    FINALIZE: (encounterId: string) => `/api/clinical-examinations/${encounterId}/finalize`,
};

// ============================================
// Diagnoses (Chẩn đoán)
// ✅ Swagger: /api/diagnoses/*
// ============================================
export const DIAGNOSIS_ENDPOINTS = {
    BY_ENCOUNTER: (encounterId: string) => `/api/diagnoses/${encounterId}`,
    BY_PATIENT: (patientId: string) => `/api/diagnoses/by-patient/${patientId}`,
    DETAIL: (diagnosisId: string) => `/api/diagnoses/${diagnosisId}`,
    UPDATE_TYPE: (diagnosisId: string) => `/api/diagnoses/${diagnosisId}/type`,
    CONCLUSION: (encounterId: string) => `/api/diagnoses/${encounterId}/conclusion`,
    SEARCH_ICD: '/api/diagnoses/search-icd',
};

// ============================================
// Medical Orders (Chỉ định xét nghiệm/dịch vụ)
// ✅ Swagger: /api/medical-orders/*
// ============================================
export const MEDICAL_ORDER_ENDPOINTS = {
    BY_ENCOUNTER: (encounterId: string) => `/api/medical-orders/${encounterId}`,
    BY_PATIENT: (patientId: string) => `/api/medical-orders/by-patient/${patientId}`,
    PENDING: '/api/medical-orders/pending',
    DETAIL: (orderId: string) => `/api/medical-orders/detail/${orderId}`,
    SUMMARY: (encounterId: string) => `/api/medical-orders/${encounterId}/summary`,
    UPDATE: (orderId: string) => `/api/medical-orders/${orderId}`,
    CANCEL: (orderId: string) => `/api/medical-orders/${orderId}/cancel`,
    START: (orderId: string) => `/api/medical-orders/${orderId}/start`,
    RESULT: (orderId: string) => `/api/medical-orders/${orderId}/result`,
    SEARCH_SERVICES: '/api/medical-orders/search-services',
};

// ============================================
// Medical Records (Hồ sơ bệnh án)
// ✅ Swagger: /api/medical-records/*
// ============================================
export const MEDICAL_RECORD_ENDPOINTS = {
    BY_PATIENT: (patientId: string) => `/api/medical-records/by-patient/${patientId}`,
    TIMELINE: (patientId: string) => `/api/medical-records/by-patient/${patientId}/timeline`,
    STATS: (patientId: string) => `/api/medical-records/by-patient/${patientId}/statistics`,
    DETAIL: (encounterId: string) => `/api/medical-records/${encounterId}`,
    SNAPSHOT: (encounterId: string) => `/api/medical-records/snapshot/${encounterId}`,
    FINALIZE: (encounterId: string) => `/api/medical-records/${encounterId}/finalize`,
    SIGN: (encounterId: string) => `/api/medical-records/${encounterId}/sign`,
    EXPORT: (encounterId: string) => `/api/medical-records/export/${encounterId}`,
    COMPLETENESS: (encounterId: string) => `/api/medical-records/${encounterId}/completeness`,
    SEARCH: '/api/medical-records/search',
};

// ============================================
// Dispensing (Cấp phát thuốc)
// ✅ Swagger: /api/dispensing/*
// ============================================
export const DISPENSING_ENDPOINTS = {
    DISPENSE: (prescriptionId: string) => `/api/dispensing/${prescriptionId}`,
    CANCEL: (dispenseOrderId: string) => `/api/dispensing/${dispenseOrderId}/cancel`,
    HISTORY: '/api/dispensing/history',
    BY_PHARMACIST: (pharmacistId: string) => `/api/dispensing/by-pharmacist/${pharmacistId}`,
    INVENTORY_CHECK: (drugId: string) => `/api/dispensing/inventory/${drugId}/check`,
    INVENTORY: (drugId: string) => `/api/dispensing/inventory/${drugId}`,
};

// ============================================
// Inventory (Tồn kho dược)
// ✅ Swagger: /api/inventory/*
// ============================================
export const INVENTORY_ENDPOINTS = {
    LIST: '/api/inventory',
    DETAIL: (batchId: string) => `/api/inventory/${batchId}`,
    LOW_STOCK: '/api/inventory/alerts/low-stock',
    EXPIRING: '/api/inventory/alerts/expiring',
};

// ============================================
// Stock In / Stock Out (Nhập/Xuất kho)
// ✅ Swagger: /api/stock-in/* /api/stock-out/*
// ============================================
export const STOCK_IN_ENDPOINTS = {
    LIST: '/api/stock-in',
    DETAIL: (orderId: string) => `/api/stock-in/${orderId}`,
    CONFIRM: (orderId: string) => `/api/stock-in/${orderId}/confirm`,
    RECEIVE: (orderId: string) => `/api/stock-in/${orderId}/receive`,
    CANCEL: (orderId: string) => `/api/stock-in/${orderId}/cancel`,
    ITEMS: (orderId: string) => `/api/stock-in/${orderId}/items`,
};

export const STOCK_OUT_ENDPOINTS = {
    LIST: '/api/stock-out',
    DETAIL: (orderId: string) => `/api/stock-out/${orderId}`,
    CONFIRM: (orderId: string) => `/api/stock-out/${orderId}/confirm`,
    CANCEL: (orderId: string) => `/api/stock-out/${orderId}/cancel`,
    ITEMS: (orderId: string) => `/api/stock-out/${orderId}/items`,
};

// ============================================
// Appointment Status / Queue (Hàng đợi khám)
// ✅ Swagger: /api/appointment-status/*
// ============================================
export const APPOINTMENT_STATUS_ENDPOINTS = {
    QUEUE_TODAY: '/api/appointment-status/queue/today',
    DASHBOARD_TODAY: '/api/appointment-status/dashboard/today',
    DASHBOARD_DATE: (date: string) => `/api/appointment-status/dashboard/${date}`,
    ROOM_STATUS: '/api/appointment-status/room-status',
    SETTINGS: '/api/appointment-status/settings',
    CHECK_IN: (id: string) => `/api/appointment-status/${id}/check-in`,
    START_EXAM: (id: string) => `/api/appointment-status/${id}/start-exam`,
    COMPLETE_EXAM: (id: string) => `/api/appointment-status/${id}/complete-exam`,
    NO_SHOW: (id: string) => `/api/appointment-status/${id}/no-show`,
    SKIP: (id: string) => `/api/appointment-status/${id}/skip`,
    RECALL: (id: string) => `/api/appointment-status/${id}/recall`,
    GENERATE_QR: (id: string) => `/api/appointment-status/generate-qr/${id}`,
    CHECK_IN_QR: '/api/appointment-status/check-in-qr',
};

// ============================================
// Appointment Confirmations (Xác nhận lịch hẹn)
// ✅ Swagger: /api/appointment-confirmations/*
// ============================================
export const APPOINTMENT_CONFIRMATION_ENDPOINTS = {
    CONFIRM: (id: string) => `/api/appointment-confirmations/${id}/confirm`,
    CHECK_IN: (id: string) => `/api/appointment-confirmations/${id}/check-in`,
    SEND_REMINDER: (id: string) => `/api/appointment-confirmations/${id}/send-reminder`,
    BATCH_CONFIRM: '/api/appointment-confirmations/batch-confirm',
    BATCH_REMINDER: '/api/appointment-confirmations/batch-send-reminder',
    REMINDER_SETTINGS: '/api/appointment-confirmations/reminder-settings',
};

// ============================================
// Branches (Chi nhánh)
// ✅ Swagger: /api/branches/*
// ============================================
export const BRANCH_ENDPOINTS = {
    LIST: '/api/branches',
    DROPDOWN: '/api/branches/dropdown',
    DETAIL: (id: string) => `/api/branches/${id}`,
    STATUS: (id: string) => `/api/branches/${id}/status`,
};

// ============================================
// Medical Rooms (Phòng khám)
// ✅ Swagger: /api/medical-rooms/*
// ============================================
export const MEDICAL_ROOM_ENDPOINTS = {
    LIST: '/api/medical-rooms',
    DROPDOWN: '/api/medical-rooms/dropdown',
    DETAIL: (id: string) => `/api/medical-rooms/${id}`,
    STATUS: (id: string) => `/api/medical-rooms/${id}/status`,
    SERVICES: (roomId: string) => `/api/medical-rooms/${roomId}/services`,
};

// ============================================
// Patient Insurance (Bảo hiểm bệnh nhân)
// ✅ Swagger: /api/patient-insurances/*
// ============================================
export const PATIENT_INSURANCE_ENDPOINTS = {
    LIST: '/api/patient-insurances',
    ACTIVE: '/api/patient-insurances/active',
    DETAIL: (id: string) => `/api/patient-insurances/${id}`,
    HISTORY: (id: string) => `/api/patient-insurances/${id}/history`,
};

// ============================================
// Leaves (Nghỉ phép nhân sự)
// ✅ Swagger: /api/leaves/*
// ============================================
export const LEAVE_ENDPOINTS = {
    LIST: '/api/leaves',
    DETAIL: (id: string) => `/api/leaves/${id}`,
    APPROVE: (id: string) => `/api/leaves/${id}/approve`,
    REJECT: (id: string) => `/api/leaves/${id}/reject`,
};

// ============================================
// Warehouses + Suppliers (Kho + Nhà cung cấp)
// ✅ Swagger: /api/warehouses/* /api/suppliers/*
// ============================================
export const WAREHOUSE_ENDPOINTS = {
    LIST: '/api/warehouses',
    DETAIL: (id: string) => `/api/warehouses/${id}`,
    TOGGLE: (id: string) => `/api/warehouses/${id}/toggle`,
};

export const SUPPLIER_ENDPOINTS = {
    LIST: '/api/suppliers',
    DETAIL: (id: string) => `/api/suppliers/${id}`,
};

// ============================================
// Treatment Plans (Kế hoạch điều trị)
// ✅ Swagger: /api/treatment-plans/*
// ============================================
export const TREATMENT_PLAN_ENDPOINTS = {
    LIST: '/api/treatment-plans',
    BY_PATIENT: (patientId: string) => `/api/treatment-plans/by-patient/${patientId}`,
    DETAIL: (planId: string) => `/api/treatment-plans/${planId}`,
    STATUS: (planId: string) => `/api/treatment-plans/${planId}/status`,
    SUMMARY: (planId: string) => `/api/treatment-plans/${planId}/summary`,
};

// ============================================
// Sign Off (Ký duyệt hồ sơ)
// ✅ Swagger: /api/sign-off/*
// ============================================
export const SIGN_OFF_ENDPOINTS = {
    PENDING: '/api/sign-off/by-doctor/pending',
    DRAFT_SIGN: (encounterId: string) => `/api/sign-off/${encounterId}/draft-sign`,
    OFFICIAL_SIGN: (encounterId: string) => `/api/sign-off/${encounterId}/official-sign`,
    COMPLETE: (encounterId: string) => `/api/sign-off/${encounterId}/complete`,
    REVOKE: (encounterId: string) => `/api/sign-off/${encounterId}/revoke`,
    VERIFY: (encounterId: string) => `/api/sign-off/${encounterId}/verify`,
    SIGNATURES: (encounterId: string) => `/api/sign-off/${encounterId}/signatures`,
    AUDIT_LOG: (encounterId: string) => `/api/sign-off/${encounterId}/audit-log`,
};
