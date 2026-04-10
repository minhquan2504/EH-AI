"use client";

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import {
    MOCK_DOCTOR_DASHBOARD_STATS,
    MOCK_WEEKLY_EXAM_STATS,
    MOCK_TODAY_SCHEDULE,
    MOCK_HOSPITAL_ANNOUNCEMENTS,
    MOCK_PATIENT_QUEUE,
} from "@/lib/mock-data/doctor";
import { getAppointments } from "@/services/appointmentService";
import { useAuth } from "@/contexts/AuthContext";

// Import dashboard components
import {
    DoctorPageHeader,
    DoctorStatsCards,
    WeeklyStatsChart,
    TodaySchedule,
    HospitalAnnouncements,
} from "@/components/portal/dashboard";

// ==================== QUICK ACTIONS ====================
const QUICK_ACTIONS = [
    { icon: "clinical_notes", label: "Khám bệnh", desc: "Bắt đầu khám", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-500/10", href: ROUTES.PORTAL.DOCTOR.EXAMINATION },
    { icon: "medication", label: "Kê đơn", desc: "Tạo đơn thuốc", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10", href: ROUTES.PORTAL.DOCTOR.PRESCRIPTIONS },
    { icon: "folder_shared", label: "Hồ sơ BN", desc: "Tra cứu", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/10", href: ROUTES.PORTAL.DOCTOR.MEDICAL_RECORDS },
    { icon: "event_available", label: "Lịch hẹn", desc: "Quản lý", color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-500/10", href: ROUTES.PORTAL.DOCTOR.APPOINTMENTS },
];

export default function DoctorDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(MOCK_DOCTOR_DASHBOARD_STATS);
    const weeklyStats = MOCK_WEEKLY_EXAM_STATS;
    const schedule = MOCK_TODAY_SCHEDULE;
    const announcements = MOCK_HOSPITAL_ANNOUNCEMENTS;
    const [waitingPatients, setWaitingPatients] = useState(MOCK_PATIENT_QUEUE.filter((p) => p.status === "waiting"));

    useEffect(() => {
        if (!user?.id) return;
        const today = new Date().toISOString().split("T")[0];
        getAppointments({ doctorId: user.id, date: today, limit: 100 })
            .then(res => {
                const items: any[] = res?.data ?? [];
                if (items.length > 0) {
                    const waiting = items.filter((a: any) => a.status === "confirmed" || a.status === "pending");
                    const completed = items.filter((a: any) => a.status === "completed");
                    setStats(prev => ({
                        ...prev,
                        todayExams: completed.length,
                        totalExamsToday: items.length,
                        waitingPatients: waiting.length,
                    }));
                    setWaitingPatients(waiting.map((a: any) => ({
                        ...MOCK_PATIENT_QUEUE[0],
                        id: a.id, fullName: a.patientName ?? "", status: "waiting",
                        phone: a.phone ?? "", gender: a.gender ?? "", dob: a.dob ?? "",
                        reason: a.reason ?? "", priority: "normal", waitTime: "—",
                        appointmentTime: a.time ?? "",
                    })) as typeof MOCK_PATIENT_QUEUE);
                }
            })
            .catch(() => {/* keep mock */});
    }, [user?.id]);

    const nextPatient = waitingPatients[0];
    const dayProgress = stats.todayExams;
    const dayTotal = stats.totalExamsToday;

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-5">
                {/* Page Header */}
                <DoctorPageHeader />

                {/* Stats Cards */}
                <DoctorStatsCards stats={stats} />

                {/* Row 2: Bệnh nhân tiếp theo (4/12) + Biểu đồ tuần (5/12) + Quick Actions (3/12) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Bệnh nhân tiếp theo */}
                    <div className="lg:col-span-4 bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <span className="material-symbols-outlined text-blue-600 text-[20px]">person</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-[#121417] dark:text-white">Bệnh nhân tiếp theo</h3>
                                    <p className="text-xs text-[#687582] dark:text-gray-500">{waitingPatients.length} BN đang chờ</p>
                                </div>
                            </div>
                            <Link href={ROUTES.PORTAL.DOCTOR.QUEUE} className="text-xs text-[#3C81C6] hover:underline font-medium">
                                Xem hàng đợi
                            </Link>
                        </div>
                        {nextPatient ? (
                            <div className="p-5">
                                {/* Patient Info */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center text-white font-bold text-lg">
                                        {nextPatient.fullName.charAt(nextPatient.fullName.lastIndexOf(" ") + 1)}
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-[#121417] dark:text-white">{nextPatient.fullName}</p>
                                        <p className="text-xs text-[#687582] dark:text-gray-500">{nextPatient.gender}, {nextPatient.age} tuổi • {nextPatient.id}</p>
                                    </div>
                                </div>

                                {/* Reason */}
                                <div className="bg-[#f6f7f8] dark:bg-[#13191f] rounded-xl p-3 mb-3">
                                    <p className="text-[10px] text-[#687582] dark:text-gray-500 uppercase tracking-wider font-semibold mb-1">Lý do khám</p>
                                    <p className="text-sm text-[#121417] dark:text-white">{nextPatient.reason}</p>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div className="bg-[#f6f7f8] dark:bg-[#13191f] rounded-lg p-2.5">
                                        <p className="text-[10px] text-[#687582] dark:text-gray-500 uppercase tracking-wider font-semibold">Giờ đến</p>
                                        <p className="text-sm font-bold text-[#121417] dark:text-white">{nextPatient.checkInTime}</p>
                                    </div>
                                    <div className="bg-[#f6f7f8] dark:bg-[#13191f] rounded-lg p-2.5">
                                        <p className="text-[10px] text-[#687582] dark:text-gray-500 uppercase tracking-wider font-semibold">STT</p>
                                        <p className="text-sm font-bold text-[#121417] dark:text-white">#{nextPatient.queueNumber}</p>
                                    </div>
                                </div>

                                {/* Allergies */}
                                {nextPatient.allergies && nextPatient.allergies.length > 0 && (
                                    <div className="flex items-center gap-1.5 mb-4 px-2.5 py-1.5 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20">
                                        <span className="material-symbols-outlined text-red-500 text-[16px]">warning</span>
                                        <span className="text-xs text-red-600 dark:text-red-400 font-medium">Dị ứng: {nextPatient.allergies.join(", ")}</span>
                                    </div>
                                )}

                                {/* Action Button */}
                                <Link
                                    href={ROUTES.PORTAL.DOCTOR.EXAMINATION}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-200 dark:shadow-none hover:-translate-y-0.5"
                                >
                                    <span className="material-symbols-outlined text-[18px]">clinical_notes</span>
                                    Bắt đầu khám
                                </Link>
                            </div>
                        ) : (
                            <div className="p-8 flex flex-col items-center justify-center text-center">
                                <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">check_circle</span>
                                <p className="text-sm text-[#687582] dark:text-gray-400">Không có bệnh nhân chờ</p>
                            </div>
                        )}
                    </div>

                    {/* Biểu đồ lượt khám tuần + Thống kê ngày */}
                    <div className="lg:col-span-5 space-y-5">
                        <WeeklyStatsChart data={weeklyStats} />

                        {/* Thống kê nhanh ngày */}
                        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#3C81C6] text-[18px]">trending_up</span>
                                    Tiến độ hôm nay
                                </h3>
                                <span className="text-xs font-bold text-[#3C81C6]">{dayProgress}/{dayTotal} ca</span>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-3">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#3C81C6] to-[#60a5fa] transition-all duration-500"
                                    style={{ width: `${(dayProgress / dayTotal) * 100}%` }}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center">
                                    <p className="text-lg font-bold text-[#121417] dark:text-white">{dayProgress}</p>
                                    <p className="text-[10px] text-[#687582] dark:text-gray-500 uppercase tracking-wider">Đã khám</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-amber-500">{stats.waitingPatients}</p>
                                    <p className="text-[10px] text-[#687582] dark:text-gray-500 uppercase tracking-wider">Đang chờ</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-emerald-500">{stats.avgWaitTime}p</p>
                                    <p className="text-[10px] text-[#687582] dark:text-gray-500 uppercase tracking-wider">TB chờ</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="lg:col-span-3 bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                        <div className="px-5 py-3.5 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center gap-2.5">
                            <div className="p-1.5 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                                <span className="material-symbols-outlined text-violet-600 text-[20px]">bolt</span>
                            </div>
                            <h3 className="text-sm font-bold text-[#121417] dark:text-white">Thao tác nhanh</h3>
                        </div>
                        <div className="p-4 space-y-2.5">
                            {QUICK_ACTIONS.map((a) => (
                                <Link
                                    key={a.icon}
                                    href={a.href}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-[#f6f7f8] dark:bg-[#13191f] hover:bg-[#eef0f2] dark:hover:bg-[#1a2030] transition-colors group"
                                >
                                    <div className={`w-10 h-10 rounded-xl ${a.bg} ${a.color} flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
                                        <span className="material-symbols-outlined text-[20px]">{a.icon}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[#121417] dark:text-white">{a.label}</p>
                                        <p className="text-[11px] text-[#687582] dark:text-gray-500">{a.desc}</p>
                                    </div>
                                    <span className="material-symbols-outlined text-[16px] text-gray-300 dark:text-gray-600 ml-auto group-hover:text-[#3C81C6] transition-colors">
                                        chevron_right
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Row 3: Lịch hôm nay (8/12) + Thông báo (4/12) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="lg:col-span-8">
                        <TodaySchedule schedule={schedule} />
                    </div>
                    <div className="lg:col-span-4">
                        <HospitalAnnouncements announcements={announcements} />
                    </div>
                </div>
            </div>
        </div>
    );
}
