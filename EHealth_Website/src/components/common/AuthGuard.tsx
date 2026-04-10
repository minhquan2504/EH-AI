/**
 * Auth Guard Component
 * Chặn truy cập trái phép bằng cách kiểm tra role từ localStorage
 * Nếu user chưa đăng nhập → redirect về /login
 * Nếu user không đúng role → redirect về /403
 */

"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AUTH_CONFIG } from "@/config";

interface AuthGuardProps {
    children: ReactNode;
    allowedRoles: string[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            try {
                const token = localStorage.getItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);
                const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);

                // Chưa đăng nhập → về login
                if (!token || !userStr) {
                    router.replace("/login");
                    return;
                }

                const user = JSON.parse(userStr);
                const userRole = (user.role || "").toLowerCase();

                // Không đúng role → về 403
                if (!allowedRoles.includes(userRole)) {
                    router.replace("/403");
                    return;
                }

                setIsAuthorized(true);
            } catch {
                router.replace("/login");
            } finally {
                setIsChecking(false);
            }
        };

        checkAuth();
    }, [pathname, allowedRoles, router]);

    if (isChecking) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-[#111518]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Đang kiểm tra quyền truy cập...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) return null;

    return <>{children}</>;
}
