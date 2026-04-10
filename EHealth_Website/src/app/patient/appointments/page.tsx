"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MOCK_PATIENT_PROFILES, getProfilesByUserId, type PatientProfile } from "@/data/patient-profiles-mock";
import { AppointmentStatusBadge } from "@/components/patient/AppointmentStatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { getAppointments, type Appointment } from "@/services/appointmentService";
import { filterMockAppointments } from "@/data/patient-mock";
import { usePageAIContext } from "@/hooks/usePageAIContext";
import { AIAppointmentSuggester } from "@/components/portal/ai";

const TABS = [
    { id: "upcoming", label: "Sắp tới", icon: "event_upcoming" },
    { id: "completed", label: "Đã khám", icon: "task_alt" },
    { id: "cancelled", label: "Đã hủy", icon: "event_busy" },
];

export default function AppointmentsPage() {
    usePageAIContext({ pageKey: 'appointments' });
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("upcoming");
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProfileId, setSelectedProfileId] = useState("pp-001");
    const profiles = getProfilesByUserId("patient-001");

    useEffect(() => {
        loadAppointments();
    }, [activeTab]);

    const loadAppointments = async () => {
        const statusMap: Record<string, string> = {
            upcoming: "pending,confirmed",
            completed: "completed",
            cancelled: "cancelled",
        };
        try {
            setLoading(true);
            const res = await getAppointments({
                patientId: user?.id,
                status: statusMap[activeTab],
                limit: 20,
            });
            if (res.data && res.data.length > 0) {
                setAppointments(res.data);
            } else {
                setAppointments(filterMockAppointments(statusMap[activeTab]));
            }
        } catch {
            setAppointments(filterMockAppointments(statusMap[activeTab]));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Lịch hẹn của tôi</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Quản lý tất cả lịch hẹn khám bệnh</p>
                    <div className="flex items-center gap-2 mt-3">
                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>person</span>
                        <select value={selectedProfileId} onChange={e => setSelectedProfileId(e.target.value)}
                            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-[#1e242b] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 font-medium">
                            {profiles.map(p => <option key={p.id} value={p.id}>{p.fullName} — {p.relationshipLabel}</option>)}
                        </select>
                    </div>
                </div>
                <Link href="/booking"
                    className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#3C81C6] to-[#2563eb] text-white text-sm font-semibold rounded-xl shadow-md shadow-[#3C81C6]/20 hover:shadow-lg transition-all active:scale-[0.97]">
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                    Đặt lịch mới
                </Link>
            </div>

            {/* AI Appointment Suggester */}
            <AIAppointmentSuggester />

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all
                        ${activeTab === tab.id ? "bg-white text-[#3C81C6] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{tab.icon}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gray-200" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : appointments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
                    <span className="material-symbols-outlined text-gray-300 mb-4" style={{ fontSize: "64px" }}>
                        {activeTab === "upcoming" ? "event_upcoming" : activeTab === "completed" ? "task_alt" : "event_busy"}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">
                        {activeTab === "upcoming" ? "Chưa có lịch hẹn sắp tới" : activeTab === "completed" ? "Chưa có lịch khám hoàn thành" : "Không có lịch hẹn đã hủy"}
                    </h3>
                    <p className="text-sm text-gray-400 mb-6">
                        {activeTab === "upcoming" ? "Đặt lịch khám ngay để bắt đầu chăm sóc sức khoẻ" : ""}
                    </p>
                    {activeTab === "upcoming" && (
                        <Link href="/booking"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#3C81C6] to-[#2563eb] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>calendar_month</span>
                            Đặt lịch ngay
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {appointments.map(apt => (
                        <div key={apt.id} className="bg-white rounded-2xl border border-gray-100 hover:border-[#3C81C6]/20 hover:shadow-md transition-all p-5 group">
                            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                {/* Date badge */}
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#3C81C6]/10 to-[#60a5fa]/10 flex flex-col items-center justify-center flex-shrink-0">
                                    <span className="text-lg font-bold text-[#3C81C6] leading-none">{apt.date?.split("-")[2] || "--"}</span>
                                    <span className="text-[10px] text-[#3C81C6]/70 font-medium">T{apt.date?.split("-")[1] || "--"}</span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 group-hover:text-[#3C81C6] transition-colors">{apt.doctorName || "Bác sĩ"}</h3>
                                            <p className="text-sm text-gray-500 mt-0.5">{apt.departmentName || "Chuyên khoa"}</p>
                                        </div>
                                        <AppointmentStatusBadge status={apt.status} />
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-xs text-gray-400">
                                        <span className="inline-flex items-center gap-1">
                                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>schedule</span>
                                            {apt.time || "--:--"}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>location_on</span>
                                            EHealth Hospital
                                        </span>
                                    </div>

                                    {apt.notes && (
                                        <p className="text-xs text-gray-400 mt-2 line-clamp-1">
                                            <span className="material-symbols-outlined align-middle mr-1" style={{ fontSize: "12px" }}>notes</span>
                                            {apt.notes}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                                <Link href={`/patient/appointments/${apt.id}`}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    Xem chi tiết
                                </Link>
                                {(apt.status === "pending" || apt.status === "confirmed") && (
                                    <>
                                        <button className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors">
                                            Dời lịch
                                        </button>
                                        <button className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                                            Hủy lịch
                                        </button>
                                    </>
                                )}
                                {apt.status === "completed" && (
                                    <button className="px-3 py-1.5 text-xs font-medium text-[#3C81C6] bg-[#3C81C6]/[0.06] border border-[#3C81C6]/20 rounded-lg hover:bg-[#3C81C6]/[0.12] transition-colors">
                                        Đánh giá
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
