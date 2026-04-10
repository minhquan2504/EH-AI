/**
 * usePermission Hook
 * Kiểm tra quyền truy cập dựa trên vai trò và permissions
 * 
 * @description
 * - hasPermission(permission) — kiểm tra 1 quyền cụ thể
 * - hasRole(role) — kiểm tra vai trò
 * - hasAnyRole(roles) — kiểm tra thuộc 1 trong các vai trò
 * - canAccess(requiredPermissions) — kiểm tra có ĐỦ quyền
 */

"use client";

import { useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ROLES, Role } from '@/constants/roles';

// ============================================
// Permission definitions
// Các quyền trong hệ thống
// ============================================

export const PERMISSIONS = {
    // Quản lý người dùng
    USER_VIEW: 'user:view',
    USER_CREATE: 'user:create',
    USER_UPDATE: 'user:update',
    USER_DELETE: 'user:delete',
    USER_LOCK: 'user:lock',
    USER_RESET_PASSWORD: 'user:reset_password',
    USER_ASSIGN_ROLE: 'user:assign_role',
    USER_IMPORT_EXPORT: 'user:import_export',

    // Quản lý bác sĩ
    DOCTOR_VIEW: 'doctor:view',
    DOCTOR_CREATE: 'doctor:create',
    DOCTOR_UPDATE: 'doctor:update',
    DOCTOR_DELETE: 'doctor:delete',

    // Quản lý chuyên khoa
    DEPARTMENT_VIEW: 'department:view',
    DEPARTMENT_CREATE: 'department:create',
    DEPARTMENT_UPDATE: 'department:update',
    DEPARTMENT_DELETE: 'department:delete',

    // Quản lý thuốc
    MEDICINE_VIEW: 'medicine:view',
    MEDICINE_CREATE: 'medicine:create',
    MEDICINE_UPDATE: 'medicine:update',
    MEDICINE_DELETE: 'medicine:delete',

    // Lịch hẹn
    APPOINTMENT_VIEW: 'appointment:view',
    APPOINTMENT_CREATE: 'appointment:create',
    APPOINTMENT_UPDATE: 'appointment:update',
    APPOINTMENT_CANCEL: 'appointment:cancel',
    APPOINTMENT_CONFIRM: 'appointment:confirm',

    // Bệnh nhân
    PATIENT_VIEW: 'patient:view',
    PATIENT_CREATE: 'patient:create',
    PATIENT_UPDATE: 'patient:update',
    PATIENT_DELETE: 'patient:delete',

    // Hồ sơ bệnh án (EMR)
    EMR_VIEW: 'emr:view',
    EMR_CREATE: 'emr:create',
    EMR_UPDATE: 'emr:update',
    EMR_SIGN: 'emr:sign',

    // Đơn thuốc
    PRESCRIPTION_VIEW: 'prescription:view',
    PRESCRIPTION_CREATE: 'prescription:create',
    PRESCRIPTION_DISPENSE: 'prescription:dispense',

    // Kho thuốc
    INVENTORY_VIEW: 'inventory:view',
    INVENTORY_MANAGE: 'inventory:manage',

    // Thanh toán
    BILLING_VIEW: 'billing:view',
    BILLING_CREATE: 'billing:create',
    BILLING_REFUND: 'billing:refund',

    // Báo cáo & Thống kê
    REPORT_VIEW: 'report:view',
    REPORT_EXPORT: 'report:export',

    // Cài đặt hệ thống
    SETTINGS_VIEW: 'settings:view',
    SETTINGS_UPDATE: 'settings:update',

    // Nhật ký hoạt động
    ACTIVITY_LOG_VIEW: 'activity_log:view',

    // AI
    AI_ACCESS: 'ai:access',

    // Khám từ xa
    TELEMEDICINE_VIEW: 'telemedicine:view',
    TELEMEDICINE_CONDUCT: 'telemedicine:conduct',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ============================================
// Role → Permissions mapping (mặc định)
// Trong thực tế sẽ lấy từ API
// ============================================

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    [ROLES.ADMIN]: Object.values(PERMISSIONS), // Admin có tất cả quyền

    [ROLES.DOCTOR]: [
        PERMISSIONS.APPOINTMENT_VIEW,
        PERMISSIONS.APPOINTMENT_UPDATE,
        PERMISSIONS.APPOINTMENT_CONFIRM,
        PERMISSIONS.PATIENT_VIEW,
        PERMISSIONS.EMR_VIEW,
        PERMISSIONS.EMR_CREATE,
        PERMISSIONS.EMR_UPDATE,
        PERMISSIONS.EMR_SIGN,
        PERMISSIONS.PRESCRIPTION_VIEW,
        PERMISSIONS.PRESCRIPTION_CREATE,
        PERMISSIONS.MEDICINE_VIEW,
        PERMISSIONS.REPORT_VIEW,
        PERMISSIONS.REPORT_EXPORT,
        PERMISSIONS.AI_ACCESS,
        PERMISSIONS.TELEMEDICINE_VIEW,
        PERMISSIONS.TELEMEDICINE_CONDUCT,
        PERMISSIONS.SETTINGS_VIEW,
    ],

    [ROLES.PHARMACIST]: [
        PERMISSIONS.PRESCRIPTION_VIEW,
        PERMISSIONS.PRESCRIPTION_DISPENSE,
        PERMISSIONS.MEDICINE_VIEW,
        PERMISSIONS.INVENTORY_VIEW,
        PERMISSIONS.INVENTORY_MANAGE,
        PERMISSIONS.REPORT_VIEW,
        PERMISSIONS.REPORT_EXPORT,
        PERMISSIONS.SETTINGS_VIEW,
    ],

    [ROLES.STAFF]: [
        PERMISSIONS.APPOINTMENT_VIEW,
        PERMISSIONS.APPOINTMENT_CREATE,
        PERMISSIONS.APPOINTMENT_UPDATE,
        PERMISSIONS.APPOINTMENT_CANCEL,
        PERMISSIONS.APPOINTMENT_CONFIRM,
        PERMISSIONS.PATIENT_VIEW,
        PERMISSIONS.PATIENT_CREATE,
        PERMISSIONS.PATIENT_UPDATE,
        PERMISSIONS.BILLING_VIEW,
        PERMISSIONS.BILLING_CREATE,
        PERMISSIONS.BILLING_REFUND,
        PERMISSIONS.REPORT_VIEW,
        PERMISSIONS.SETTINGS_VIEW,
    ],

    [ROLES.PATIENT]: [
        PERMISSIONS.APPOINTMENT_VIEW,
        PERMISSIONS.APPOINTMENT_CREATE,
        PERMISSIONS.APPOINTMENT_CANCEL,
        PERMISSIONS.EMR_VIEW,
        PERMISSIONS.PRESCRIPTION_VIEW,
        PERMISSIONS.AI_ACCESS,
        PERMISSIONS.TELEMEDICINE_VIEW,
    ],
};

// ============================================
// Hook
// ============================================

export function usePermission() {
    const { user } = useAuth();

    // Lấy danh sách quyền của user hiện tại
    const userPermissions = useMemo(() => {
        if (!user?.role) return [];
        const roleKey = user.role.toUpperCase();
        return ROLE_PERMISSIONS[roleKey] || [];
    }, [user?.role]);

    // Kiểm tra 1 quyền cụ thể
    const hasPermission = useCallback((permission: Permission): boolean => {
        return userPermissions.includes(permission);
    }, [userPermissions]);

    // Kiểm tra vai trò
    const hasRole = useCallback((role: Role): boolean => {
        if (!user?.role) return false;
        return user.role.toUpperCase() === role;
    }, [user?.role]);

    // Kiểm tra thuộc 1 trong các vai trò
    const hasAnyRole = useCallback((roles: Role[]): boolean => {
        if (!user?.role) return false;
        return roles.includes(user.role.toUpperCase() as Role);
    }, [user?.role]);

    // Kiểm tra có ĐỦ tất cả quyền
    const canAccess = useCallback((requiredPermissions: Permission[]): boolean => {
        return requiredPermissions.every(p => userPermissions.includes(p));
    }, [userPermissions]);

    // Kiểm tra có ÍT NHẤT 1 quyền trong danh sách
    const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
        return permissions.some(p => userPermissions.includes(p));
    }, [userPermissions]);

    return {
        permissions: userPermissions,
        hasPermission,
        hasRole,
        hasAnyRole,
        canAccess,
        hasAnyPermission,
        isAdmin: user?.role?.toUpperCase() === ROLES.ADMIN,
    };
}

export default usePermission;
