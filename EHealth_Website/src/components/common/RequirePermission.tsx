/**
 * RequirePermission Component
 * HOC bảo vệ route/component theo quyền
 * 
 * @usage
 * <RequirePermission permission="user:create">
 *   <CreateUserButton />
 * </RequirePermission>
 * 
 * <RequirePermission roles={["ADMIN", "DOCTOR"]} fallback={<AccessDenied />}>
 *   <ProtectedContent />
 * </RequirePermission>
 */

"use client";

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission, Permission } from '@/hooks/usePermission';
import { Role } from '@/constants/roles';

// ============================================
// Types
// ============================================

interface RequirePermissionProps {
    /** Quyền cần thiết (kiểm tra 1 quyền) */
    permission?: Permission;
    /** Danh sách quyền cần thiết (kiểm tra TẤT CẢ) */
    permissions?: Permission[];
    /** Vai trò được phép (kiểm tra 1 trong các vai trò) */
    roles?: Role[];
    /** Nội dung hiển thị nếu có quyền */
    children: ReactNode;
    /** Nội dung hiển thị nếu không có quyền (mặc định: ẩn) */
    fallback?: ReactNode;
    /** Chuyển hướng đến URL nếu không có quyền */
    redirectTo?: string;
    /** Ẩn hoàn toàn nếu không có quyền (mặc định: true) */
    hideIfDenied?: boolean;
}

// ============================================
// Component
// ============================================

export function RequirePermission({
    permission,
    permissions,
    roles,
    children,
    fallback,
    redirectTo,
    hideIfDenied = true,
}: RequirePermissionProps) {
    const router = useRouter();
    const { hasPermission, canAccess, hasAnyRole } = usePermission();

    // Kiểm tra quyền
    let hasAccess = true;

    if (permission) {
        hasAccess = hasPermission(permission);
    }

    if (permissions && permissions.length > 0) {
        hasAccess = hasAccess && canAccess(permissions);
    }

    if (roles && roles.length > 0) {
        hasAccess = hasAnyRole(roles);
    }

    // Nếu có quyền → render children
    if (hasAccess) {
        return <>{children}</>;
    }

    // Nếu không có quyền → redirect
    if (redirectTo) {
        router.push(redirectTo);
        return null;
    }

    // Nếu có fallback → render fallback
    if (fallback) {
        return <>{fallback}</>;
    }

    // Mặc định: ẩn
    if (hideIfDenied) {
        return null;
    }

    return null;
}

// ============================================
// RequireAuth — Yêu cầu đăng nhập
// ============================================

interface RequireAuthProps {
    children: ReactNode;
    fallback?: ReactNode;
}

export function RequireAuth({ children, fallback }: RequireAuthProps) {
    const { hasPermission } = usePermission();

    // Nếu có bất kỳ quyền nào → đã đăng nhập
    // (permissions array sẽ rỗng nếu chưa đăng nhập)
    const isLoggedIn = usePermission().permissions.length > 0;

    if (!isLoggedIn) {
        if (fallback) return <>{fallback}</>;
        return null;
    }

    return <>{children}</>;
}

export default RequirePermission;
