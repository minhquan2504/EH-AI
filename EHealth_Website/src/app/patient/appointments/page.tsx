"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppointmentStatusBadge } from "@/components/patient/AppointmentStatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { getAppointments, cancelAppointment, appointmentChangesService, type Appointment } from "@/services/appointmentService";
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

    // Cancel modal
    const [cancelModal, setCancelModal] = useState<{ id: string } | null>(null);
    const [cancelReason, setCancelReason] = useState("");
    const [cancelling, setCancelling] = useState(false);

    // Reschedule modal
    const [rescheduleModal, setRescheduleModal] = useState<{ id: string; doctorName: string } | null>(null);
    const [newDate, setNewDate] = useState("");
    const [newTime, setNewTime] = useState("");
    const [rescheduling, setRescheduling] = useState(false);
    const [minDate, setMinDate] = useState("");
    useEffect(() => {
        setMinDate(new Date().toISOString().split("T")[0]);
    }, []);

    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        loadAppointments();
    }, [activeTab, user?.id]);

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
            setAppointments(res.data && res.data.length > 0 ? res.data : []);
        } catch {
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!cancelModal) return;
        setCancelling(true);
        try {
            await cancelAppointment(cancelModal.id, cancelReason);
            setCancelModal(null);
            setCancelReason("");
            showToast("Đã hủy lịch hẹn thành công");
            await loadAppointments();
        } catch {
            showToast("Hủy lịch thất bại. Vui lòng thử lại.", "error");
        } finally {
            setCancelling(false);
        }
    };

    const handleReschedule = async () => {
        if (!rescheduleModal || !newDate || !newTime) {
            showToast("Vui lòng chọn ngày và giờ mới", "error"); return;
        }
        setRescheduling(true);
        try {
            await appointmentChangesService.request({
                appointmentId: rescheduleModal.id,
                newDate,
                newTime,
                reason: "Bệnh nhân yêu cầu dời lịch",
            });
            setRescheduleModal(null);
            setNewDate(""); setNewTime("");
            showToast("Đã gửi yêu cầu dời lịch. Chờ xác nhận.");
        } catch {
            showToast("Gửi yêu cầu dời lịch thất bại.", "error");
        } finally {
            setRescheduling(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Lịch hẹn của tôi</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Quản lý tất cả lịch hẹn khám bệnh</p>
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
                                        <button
                                            onClick={() => { setRescheduleModal({ id: apt.id, doctorName: apt.doctorName }); setNewDate(""); setNewTime(""); }}
                                            className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors">
                                            Dời lịch
                                        </button>
                                        <button
                                            onClick={() => { setCancelModal({ id: apt.id }); setCancelReason(""); }}
                                            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                                            Hủy lịch
                                        </button>
                                    </>
                                )}
                                {apt.status === "completed" && (
                                    <button
                                        onClick={() => alert("Tính năng đánh giá sẽ sớm có")}
                                        className="px-3 py-1.5 text-xs font-medium text-[#3C81C6] bg-[#3C81C6]/[0.06] border border-[#3C81C6]/20 rounded-lg hover:bg-[#3C81C6]/[0.12] transition-colors">
                                        Đánh giá
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Cancel Modal */}
            {cancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setCancelModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-red-600" style={{ fontSize: "22px" }}>warning</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Xác nhận hủy lịch</h3>
                                <p className="text-xs text-gray-500">Hành động này không thể hoàn tác</p>
                            </div>
                        </div>
                        <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                            placeholder="Lý do hủy lịch (không bắt buộc)..."
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm mb-4 bg-gray-50 min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-red-200" />
                        <div className="flex gap-3">
                            <button onClick={() => setCancelModal(null)}
                                className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                Quay lại
                            </button>
                            <button onClick={handleCancel} disabled={cancelling}
                                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors">
                                {cancelling ? "Đang xử lý..." : "Xác nhận hủy"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reschedule Modal */}
            {rescheduleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setRescheduleModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "22px" }}>event_repeat</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Dời lịch hẹn</h3>
                                <p className="text-xs text-gray-500">{rescheduleModal.doctorName}</p>
                            </div>
                        </div>
                        <div className="space-y-3 mb-4">
                            <div>
                                <label className="text-xs text-gray-500 font-medium mb-1 block">Ngày mới *</label>
                                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} min={minDate}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-gray-50" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-medium mb-1 block">Giờ mới *</label>
                                <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-gray-50" />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setRescheduleModal(null)}
                                className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                Quay lại
                            </button>
                            <button onClick={handleReschedule} disabled={rescheduling}
                                className="flex-1 py-2.5 text-sm font-semibold text-white bg-amber-500 rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors">
                                {rescheduling ? "Đang gửi..." : "Gửi yêu cầu"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
