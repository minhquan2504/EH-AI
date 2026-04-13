/**
 * Services Index
 * Export tập trung tất cả services — đồng bộ Swagger API
 */

// Authentication
export * from './authService';

// User management & Profile
// Note: Re-export explicit để tránh conflict với authService (getProfileSessions, deleteProfileSession)
export {
    getAccountStatuses,
    getUsers,
    searchUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    lockUser,
    unlockUser,
    updateUserStatus,
    getUserStatusHistory,
    adminResetPassword,
    adminChangePassword,
    getUserRoles,
    assignUserRole,
    removeUserRole,
    getUserFacilities,
    assignUserFacility,
    updateUserFacility,
    removeUserFacility,
    validateUserImport,
    importUsers,
    getImportHistory,
    exportUsers,
    exportUsersWithFilters,
    getProfile,
    updateProfile,
    changePassword,
    logoutAllProfileSessions,
    updateProfileSettings,
} from './userService';

// Appointments
export * from './appointmentService';

// Medicines / Pharmacy
export * from './medicineService';

// Departments
export * from './departmentService';

// Permissions, Roles, Modules, Menus
export * from './permissionService';

// Patients
export * from './patientService';

// Specialties (mới)
export * from './specialtyService';

// System Configuration (mới)
export * from './systemConfigService';

// Notifications (mới)
export * from './notificationService';

// EMR — Electronic Medical Records
export * from './emrService';

// Prescriptions
export * from './prescriptionService';

// Billing & Invoices
export * from './billingService';

// Audit Logs
export * from './auditService';

// Reports & Statistics
export * from './reportService';

// AI Assistant
export * from './aiService';

// EHR — Electronic Health Records
export * from './ehrService';

// Master Data (ICD-10, Countries, Ethnicities, Units)
export * from './masterDataService';
