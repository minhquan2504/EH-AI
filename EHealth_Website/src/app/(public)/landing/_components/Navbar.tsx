"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { NAV_ITEMS } from "./data";

export function LandingNavbar({ activeSection, scrollTo }: { activeSection: string; scrollTo: (id: string) => void }) {
    const [mobileMenu, setMobileMenu] = useState(false);
    const { user, isAuthenticated, logout } = useAuth();
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const handleNav = (item: typeof NAV_ITEMS[number]) => {
        setMobileMenu(false);
        const href = (item as any).href;
        if (href && typeof href === "string" && href.startsWith("/")) {
            window.location.href = href;
        } else if (!href) {
            scrollTo(item.id);
        }
    };

    return (
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100/80 shadow-sm" aria-label="Main navigation">
            <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3" aria-label="EHealth - Trang chủ">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#1d4ed8] flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <span className="material-symbols-outlined text-white text-[22px]">local_hospital</span>
                    </div>
                    <div>
                        <span className="text-xl font-black text-[#121417] tracking-tight">E<span className="text-[#3C81C6]">Health</span></span>
                        <p className="text-[9px] text-[#687582] -mt-0.5 tracking-[0.2em] uppercase font-semibold">Hospital &amp; Clinic</p>
                    </div>
                </Link>

                <div className="hidden xl:flex items-center gap-0.5 text-[13px] font-extrabold text-[#1a202c] flex-nowrap">
                    {NAV_ITEMS.map(n => (
                        <button key={n.id} onClick={() => handleNav(n)}
                            className={`px-2.5 py-2 rounded-lg hover:text-[#3C81C6] hover:bg-blue-50/80 transition-all whitespace-nowrap ${activeSection === n.id ? "text-[#3C81C6] bg-blue-50/80 shadow-sm" : ""}`}
                            aria-label={`Đi đến ${n.label}`}>{n.label}</button>
                    ))}
                </div>

                <div className="flex items-center gap-3 ml-4">
                    {isAuthenticated && user ? (
                        <div className="relative">
                            <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center text-white text-sm font-bold">
                                    {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                                </div>
                                <span className="text-sm font-medium text-[#4a5568] max-w-[120px] truncate">{user.fullName}</span>
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
                                        <Link href="/patient" onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>dashboard</span>
                                            Cổng bệnh nhân
                                        </Link>
                                        <Link href="/patient/appointments" onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>calendar_month</span>
                                            Lịch hẹn của tôi
                                        </Link>
                                        <Link href="/patient/patient-profiles" onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>family_restroom</span>
                                            Hồ sơ bệnh nhân
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
                        <Link href="/login" className="hidden sm:flex items-center gap-1.5 text-[13px] font-extrabold text-[#1a202c] hover:text-[#3C81C6] transition-colors px-2.5 py-2 rounded-lg hover:bg-blue-50/80">
                            <span className="material-symbols-outlined text-[18px]">person</span>Đăng nhập
                        </Link>
                    )}
                    <a href="/booking" className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] hover:from-[#2a6da8] hover:to-[#1e40af] text-white rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 shadow-lg shadow-blue-500/25 active:scale-95"
                        aria-label="Đặt lịch khám">
                        <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                        Đặt lịch khám
                    </a>
                    <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label={mobileMenu ? "Đóng menu" : "Mở menu"} aria-expanded={mobileMenu}>
                        <span className="material-symbols-outlined text-[24px] text-[#121417]">{mobileMenu ? "close" : "menu"}</span>
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            <div className={`lg:hidden bg-white border-t border-gray-100 shadow-lg overflow-hidden transition-all duration-300 ${mobileMenu ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="px-6 py-4 space-y-1">
                    {NAV_ITEMS.map(n => (
                        <button key={n.id} onClick={() => handleNav(n)} className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-[#4a5568] hover:bg-blue-50 hover:text-[#3C81C6] transition-colors">{n.label}</button>
                    ))}
                    <div className="pt-3 space-y-2 border-t border-gray-100 mt-2">
                        {isAuthenticated && user ? (
                            <>
                                <Link href="/patient" className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-[#3C81C6] bg-blue-50">
                                    <span className="material-symbols-outlined text-[18px]">dashboard</span>Cổng bệnh nhân
                                </Link>
                                <button onClick={() => { setMobileMenu(false); logout(); }}
                                    className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50">
                                    <span className="material-symbols-outlined text-[18px]">logout</span>Đăng xuất
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-[#4a5568] hover:bg-blue-50">
                                    <span className="material-symbols-outlined text-[18px]">person</span>Đăng nhập
                                </Link>
                                <a href="/booking" className="w-full py-3 bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] text-white rounded-xl text-sm font-bold active:scale-95 flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>Đặt lịch khám
                                </a>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}