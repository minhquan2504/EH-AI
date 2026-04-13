"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { getAppointments } from "@/services/appointmentService";
import { getPatients } from "@/services/patientService";
import { useAuth } from "@/contexts/AuthContext";
import { usePageAIContext } from "@/hooks/usePageAIContext";
import { AIQueuePredictor } from "@/components/portal/ai";

const STATS_CONFIG = [
    { label: "Lịch hẹn hôm nay", icon: "calendar_month", bg: "bg-blue-50 dark:bg-blue-900/20", color: "text-blue-600", badgeColor: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
    { label: "Đã tiếp nhận", icon: "how_to_reg", bg: "bg-emerald-50 dark:bg-emerald-900/20", color: "text-emerald-600", badgeColor: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" },
    { label: "Đang chờ khám", icon: "schedule", bg: "bg-amber-50 dark:bg-amber-900/20", color: "text-amber-600", badgeColor: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
    { label: "Tổng bệnh nhân", icon: "person_add", bg: "bg-violet-50 dark:bg-violet-900/20", color: "text-violet-600", badgeColor: "text-violet-600 bg-violet-50 dark:bg-violet-900/20" },
];

const QUICK_ACTIONS = [
    { icon: "person_add", label: "Đăng ký BN mới", desc: "Tiếp nhận", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-500/10", href: ROUTES.PORTAL.STAFF.PATIENTS },
    { icon: "event_available", label: "Đặt lịch hẹn", desc: "Tạo mới", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10", href: ROUTES.PORTAL.STAFF.APPOINTMENTS },
    { icon: "qr_code_scanner", label: "Tiếp nhận", desc: "Quét mã", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/10", href: ROUTES.PORTAL.STAFF.QUEUE },
    { icon: "receipt_long", label: "Thanh toán", desc: "Xử lý", color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-500/10", href: ROUTES.PORTAL.STAFF.BILLING },
];

// ==================== HELPERS ====================
function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "Chào buổi sáng";
    if (h < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
}

function getCurrentDate(): string {
    const now = new Date();
    const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    return `${days[now.getDay()]}, ${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
}

// ==================== PAGE ====================
type AptDash = { id: string; patient: string; time: string; doctor: string; dept: string; status: string; phone: string };
type StatItem = { label: string; value: string; icon: string; bg: string; color: string; badge: string; badgeColor: string };

export default function ReceptionistDashboard() {
    const { user } = useAuth();
    usePageAIContext({ pageKey: 'dashboard' });
    const [filter, setFilter] = useState<"all" | "waiting" | "checked_in">("all");
    const [appointments, setAppointments] = useState<AptDash[]>([]);
    const [loadingApts, setLoadingApts] = useState(true);
    const [stats, setStats] = useState<StatItem[]>(STATS_CONFIG.map(s => ({ ...s, value: "—", badge: "Đang tải..." })));

    useEffect(() => {
        const today = new Date().toISOString().split("T")[0];
        // Lấy lịch hẹn hôm nay
        getAppointments({ date: today, limit: 100 })
            .then(res => {
                const raw = (res as any);
                const items: any[] = raw?.data?.data ?? raw?.data?.items ?? raw?.data ?? [];
                const mapped: AptDash[] = items.map((a: any) => ({
                    id: a.id ?? a.appointment_id ?? "",
                    patient: a.patientName ?? a.patient_name ?? a.full_name ?? "",
                    time: a.time ?? a.appointment_time ?? a.start_time ?? "",
                    doctor: a.doctorName ?? a.doctor_name ?? "",
                    dept: a.departmentName ?? a.department_name ?? "",
                    status: (a.status === "confirmed" || a.status === "CONFIRMED") ? "waiting"
                        : (a.status === "checked_in" || a.status === "CHECKED_IN") ? "checked_in"
                        : a.status,
                    phone: a.phone ?? a.phone_number ?? "",
                }));
                setAppointments(mapped);
                const waiting = mapped.filter(a => a.status === "waiting").length;
                const checkedIn = mapped.filter(a => a.status === "checked_in").length;
                setStats(prev => prev.map((s, i) => {
                    if (i === 0) return { ...s, value: String(items.length), badge: `${items.length} lịch hôm nay` };
                    if (i === 1) return { ...s, value: String(checkedIn), badge: `${items.length > 0 ? Math.round(checkedIn / items.length * 100) : 0}% hoàn thành` };
                    if (i === 2) return { ...s, value: String(waiting), badge: "Đang chờ" };
                    return s;
                }));
            })
            .catch(() => {
                setStats(prev => prev.map(s => ({ ...s, value: "—", badge: "Không tải được" })));
            })
            .finally(() => setLoadingApts(false));

        // Lấy tổng số bệnh nhân đăng ký
        getPatients({ limit: 1 })
            .then(res => {
                const total = (res as any)?.data?.pagination?.total_items ?? (res as any)?.data?.total;
                if (total !== undefined) {
                    setStats(prev => prev.map((s, i) => i === 3 ? { ...s, value: String(total), badge: "Tổng hồ sơ" } : s));
                }
            })
            .catch(() => {});
    }, []);

    const filtered = filter === "all" ? appointments : appointments.filter((a) => a.status === filter);

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* ===== HEADER ===== */}
                <div>
                    <div className="flex items-center gap-1.5 text-xs text-[#687582] dark:text-gray-500 mb-3">
                        <span className="material-symbols-outlined text-[14px]">home</span>
                        <span>Trang chủ</span>
                        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                        <span className="text-[#121417] dark:text-white font-medium">Bảng điều khiển</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-[#121417] dark:text-white">
                                {getGreeting()}, <span className="text-[#3C81C6]">{user?.fullName || "Lễ tân"}</span>
                            </h1>
                            <p className="text-[#687582] dark:text-gray-400 mt-0.5 text-sm">Quầy tiếp nhận — Ca sáng</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm text-[#687582] dark:text-gray-400">
                                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                                <span>{getCurrentDate()}</span>
                            </div>
                            <Link href="/portal/receptionist/reception" className="flex items-center gap-2 px-4 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-[#3C81C6]/20">
                                <span className="material-symbols-outlined text-[18px]">person_add</span>
                                Tiếp nhận BN mới
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ===== STATS ===== */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    {stats.map((s) => (
                        <div key={s.label} className="bg-white dark:bg-[#1e242b] p-5 rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-[#3C81C6]/40 dark:hover:border-[#3C81C6]/30 transition-all cursor-pointer">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[#687582] dark:text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wider">{s.label}</p>
                                    <h3 className="text-[28px] font-extrabold text-[#121417] dark:text-white leading-none">{s.value}</h3>
                                </div>
                                <div className={`p-2.5 ${s.bg} rounded-xl ${s.color} group-hover:scale-110 transition-transform flex-shrink-0`}>
                                    <span className="material-symbols-outlined text-[22px]">{s.icon}</span>
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-[#f0f1f3] dark:border-[#2d353e]">
                                <span className={`inline-flex items-center text-xs font-bold ${s.badgeColor} px-2 py-0.5 rounded-md`}>
                                    {s.badge}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ===== AI QUEUE PREDICTOR ===== */}
                <AIQueuePredictor />

                {/* ===== MAIN GRID ===== */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Lịch hẹn */}
                    <div className="lg:col-span-2 bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                        <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <span className="material-symbols-outlined text-blue-600 text-[20px]">event_note</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-[#121417] dark:text-white">Lịch hẹn sắp tới</h3>
                                    <p className="text-xs text-[#687582] dark:text-gray-500">{filtered.length} bệnh nhân</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Link href={ROUTES.PORTAL.STAFF.APPOINTMENTS} className="text-xs text-[#3C81C6] hover:underline font-medium mr-2">
                                    Xem tất cả
                                </Link>
                                {[
                                    { key: "all" as const, label: "Tất cả" },
                                    { key: "waiting" as const, label: "Chờ đến" },
                                    { key: "checked_in" as const, label: "Đã nhận" },
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setFilter(tab.key)}
                                        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${filter === tab.key ? "bg-[#3C81C6] text-white" : "text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e]">
                            {loadingApts ? (
                                <div className="px-5 py-8 text-center text-sm text-[#687582]">
                                    <div className="w-6 h-6 border-2 border-[#3C81C6]/20 border-t-[#3C81C6] rounded-full animate-spin mx-auto mb-2" />
                                    Đang tải lịch hẹn...
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="px-5 py-10 text-center text-sm text-[#687582]">
                                    <span className="material-symbols-outlined text-[36px] mb-2 block">event_busy</span>
                                    Không có lịch hẹn nào hôm nay
                                </div>
                            ) : (
                                filtered.map((apt) => (
                                    <div key={apt.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-[#f6f7f8] dark:hover:bg-[#13191f] transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center min-w-[50px]">
                                                <p className="text-lg font-bold text-[#121417] dark:text-white">{apt.time}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[#121417] dark:text-white">{apt.patient}</p>
                                                <p className="text-xs text-[#687582] dark:text-gray-500">{apt.doctor} • {apt.dept}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${apt.status === "checked_in"
                                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600"
                                                : "bg-amber-50 dark:bg-amber-500/10 text-amber-600"
                                                }`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                {apt.status === "checked_in" ? "Đã tiếp nhận" : "Chờ đến"}
                                            </span>
                                            {apt.status === "waiting" && (
                                                <button onClick={() => setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, status: "checked_in" } : a))} className="p-1.5 rounded-lg bg-[#3C81C6]/10 text-[#3C81C6] hover:bg-[#3C81C6]/20 transition-colors" title="Tiếp nhận">
                                                    <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Cột phải */}
                    <div className="space-y-6">
                        {/* Thao tác nhanh */}
                        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                            <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center gap-2.5">
                                <div className="p-1.5 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                                    <span className="material-symbols-outlined text-violet-600 text-[20px]">bolt</span>
                                </div>
                                <h3 className="text-sm font-bold text-[#121417] dark:text-white">Thao tác nhanh</h3>
                            </div>
                            <div className="p-4 grid grid-cols-2 gap-3">
                                {QUICK_ACTIONS.map((a) => (
                                    <Link key={a.icon} href={a.href} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#f6f7f8] dark:bg-[#13191f] hover:bg-[#eef0f2] dark:hover:bg-[#1a2030] transition-colors group">
                                        <div className={`w-10 h-10 rounded-xl ${a.bg} ${a.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                            <span className="material-symbols-outlined text-[20px]">{a.icon}</span>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-semibold text-[#121417] dark:text-white">{a.label}</p>
                                            <p className="text-[10px] text-[#687582] dark:text-gray-500">{a.desc}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Hàng đợi hôm nay */}
                        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-5 flex flex-col items-center justify-center gap-3 min-h-[120px]">
                            <span className="material-symbols-outlined text-[#3C81C6] text-[32px]">queue</span>
                            <p className="text-sm font-semibold text-[#121417] dark:text-white">Xem hàng đợi theo thời gian thực</p>
                            <Link href={ROUTES.PORTAL.STAFF.QUEUE} className="px-4 py-2 bg-[#3C81C6] text-white text-xs font-semibold rounded-xl hover:bg-[#2a6da8] transition-colors">
                                Mở màn hình hàng đợi
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
