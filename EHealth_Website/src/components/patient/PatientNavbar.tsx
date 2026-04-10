"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/constants/routes";

const NAV_LINKS = [
    { href: ROUTES.PUBLIC.LANDING, label: "Trang chủ", icon: "home" },
    { href: ROUTES.PUBLIC.SPECIALTIES, label: "Chuyên khoa", icon: "local_hospital" },
    { href: ROUTES.PUBLIC.DOCTORS, label: "Bác sĩ", icon: "person_search" },
    { href: ROUTES.PUBLIC.BOOKING, label: "Đặt lịch", icon: "calendar_month" },
];

export function PatientNavbar() {
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const isActive = (href: string) => {
        if (href === ROUTES.PUBLIC.LANDING) return pathname === href || pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-lg shadow-lg shadow-black/[0.04]" : "bg-white"}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 lg:h-[72px]">
                        {/* Logo */}
                        <Link href={ROUTES.PUBLIC.LANDING} className="flex items-center gap-2.5 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#2563eb] flex items-center justify-center shadow-lg shadow-[#3C81C6]/20 group-hover:shadow-[#3C81C6]/30 transition-shadow">
                                <span className="material-symbols-outlined text-white" style={{ fontSize: "24px" }}>local_hospital</span>
                            </div>
                            <div className="hidden sm:block">
                                <span className="text-xl font-bold text-gray-900 tracking-tight">EHealth</span>
                                <span className="block text-[10px] text-[#3C81C6] font-medium -mt-0.5 tracking-wide">HOSPITAL</span>
                            </div>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden lg:flex items-center gap-1">
                            {NAV_LINKS.map(link => (
                                <Link key={link.href} href={link.href}
                                    className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2
                                    ${isActive(link.href) ? "text-[#3C81C6] bg-[#3C81C6]/[0.08]" : "text-gray-600 hover:text-[#3C81C6] hover:bg-gray-50"}`}>
                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{link.icon}</span>
                                    {link.label}
                                    {isActive(link.href) && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#3C81C6] rounded-full" />}
                                </Link>
                            ))}
                        </div>

                        {/* Right actions */}
                        <div className="flex items-center gap-3">
                            {/* Hotline */}
                            <a href="tel:02812345678" className="hidden md:flex items-center gap-2 text-sm text-gray-600 hover:text-[#3C81C6] transition-colors">
                                <span className="material-symbols-outlined text-green-500" style={{ fontSize: "18px" }}>call</span>
                                <span className="font-semibold">1900 1234</span>
                            </a>

                            <div className="hidden md:block w-px h-6 bg-gray-200" />

                            {isAuthenticated && user ? (
                                <div className="relative">
                                    <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="flex items-center gap-2.5 py-1.5 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center text-white text-sm font-bold">
                                            {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                                        </div>
                                        <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">{user.fullName}</span>
                                        <span className="material-symbols-outlined text-gray-400" style={{ fontSize: "18px" }}>expand_more</span>
                                    </button>

                                    {userMenuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                                                <div className="px-4 py-2.5 border-b border-gray-100">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName}</p>
                                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                </div>
                                                <Link href={ROUTES.PATIENT.APPOINTMENTS} onClick={() => setUserMenuOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>calendar_month</span>
                                                    Lịch hẹn của tôi
                                                </Link>
                                                <Link href={ROUTES.PATIENT.PROFILE} onClick={() => setUserMenuOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>person</span>
                                                    Hồ sơ bệnh nhân
                                                </Link>
                                                <Link href={ROUTES.PATIENT.MEDICAL_RECORDS} onClick={() => setUserMenuOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>folder_shared</span>
                                                    Kết quả khám
                                                </Link>
                                                <div className="border-t border-gray-100 my-1" />
                                                <button onClick={() => { setUserMenuOpen(false); logout(); }}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>logout</span>
                                                    Đăng xuất
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link href={ROUTES.PUBLIC.LOGIN}
                                        className="hidden md:flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#3C81C6] transition-colors">
                                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>login</span>
                                        Đăng nhập
                                    </Link>
                                    <Link href="/register"
                                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#3C81C6] to-[#2563eb] text-white text-sm font-semibold rounded-xl shadow-md shadow-[#3C81C6]/20 hover:shadow-lg hover:shadow-[#3C81C6]/30 transition-all active:scale-[0.97]">
                                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>person_add</span>
                                        <span className="hidden sm:inline">Đăng ký</span>
                                    </Link>
                                </div>
                            )}

                            {/* Mobile menu button */}
                            <button onClick={() => setMobileOpen(!mobileOpen)}
                                className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors">
                                <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>{mobileOpen ? "close" : "menu"}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileOpen && (
                    <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg">
                        <div className="px-4 py-3 space-y-1">
                            {NAV_LINKS.map(link => (
                                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
                                    ${isActive(link.href) ? "text-[#3C81C6] bg-[#3C81C6]/[0.08]" : "text-gray-600 hover:bg-gray-50"}`}>
                                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{link.icon}</span>
                                    {link.label}
                                </Link>
                            ))}
                            {!isAuthenticated && (
                                <div className="pt-3 mt-2 border-t border-gray-100 space-y-2">
                                    <Link href={ROUTES.PUBLIC.LOGIN} onClick={() => setMobileOpen(false)}
                                        className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50">
                                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>login</span> Đăng nhập
                                    </Link>
                                    <Link href="/register" onClick={() => setMobileOpen(false)}
                                        className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#2563eb] rounded-xl">
                                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>person_add</span> Đăng ký
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </nav>
            {/* Spacer */}
            <div className="h-16 lg:h-[72px]" />
        </>
    );
}
