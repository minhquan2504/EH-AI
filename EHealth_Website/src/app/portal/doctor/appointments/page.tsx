"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UI_TEXT } from "@/constants/ui-text";
import {
    MOCK_APPOINTMENTS,
    MOCK_PENDING_APPOINTMENTS,
} from "@/lib/mock-data/doctor";
import * as appointmentService from "@/services/appointmentService";
import { useAuth } from "@/contexts/AuthContext";
import { AIAppointmentTriage } from "@/components/portal/ai";
import { usePageAIContext } from "@/hooks/usePageAIContext";

type ViewMode = "day" | "week" | "month";

export default function AppointmentsPage() {
    usePageAIContext({ pageKey: 'appointments' });
    const router = useRouter();
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState<ViewMode>("week");
    const [appointments, setAppointments] = useState<any[]>(MOCK_APPOINTMENTS);
    const [pendingRequests, setPendingRequests] = useState<any[]>(MOCK_PENDING_APPOINTMENTS);
    const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
    const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

    const daysOfWeek = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8:00 - 17:00

    // Compute the Monday of the current week offset
    const getWeekDates = (offset: number) => {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setDate(now.getDate() + mondayOffset + offset * 7);
        const dates = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d;
        });
        return dates;
    };

    const weekDates = getWeekDates(currentWeekOffset);
    const formatWeekLabel = (dates: Date[]) => {
        const fmt = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
        const monday = dates[0];
        const sunday = dates[6];
        return `Tuần ${fmt(monday)} - ${fmt(sunday)}/${sunday.getFullYear()}`;
    };

    useEffect(() => {
        if (!user?.id) return;
        appointmentService.getAppointmentsByDoctor(user.id)
            .then(res => {
                const data = (res as any)?.data?.data ?? (res as any)?.data;
                if (Array.isArray(data) && data.length > 0) {
                    setAppointments(data);
                    setPendingRequests(data.filter((a: any) => a.status === 'PENDING'));
                }
            })
            .catch(() => { /* keep mock data */ });
    }, [user?.id]);

    const handleAcceptRequest = async (requestId: string) => {
        try {
            await appointmentService.confirmAppointment(requestId);
            setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
        } catch {
            alert("Chấp nhận yêu cầu lịch hẹn thất bại. Vui lòng thử lại.");
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        if (!confirm("Bạn có chắc chắn muốn từ chối yêu cầu này?")) return;
        try {
            await appointmentService.cancelAppointment(requestId);
            setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
        } catch {
            setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
            alert("Đã từ chối yêu cầu!");
        }
    };

    const handleAppointmentClick = (appointment: typeof MOCK_APPOINTMENTS[0]) => {
        setSelectedAppointment(appointment);
    };

    return (
        <div className="p-6 md:p-8 h-full">
            <div className="max-w-7xl mx-auto flex flex-col h-full gap-6">
                {/* AI Appointment Triage */}
                {user?.id && (
                    <AIAppointmentTriage
                        pendingRequests={pendingRequests.map((r: any) => ({
                            id: r.id,
                            patientName: r.patientName ?? r.patient ?? "",
                            reason: r.reason ?? r.visitReason ?? "",
                            patientAge: r.patientAge ?? r.age,
                        }))}
                        doctorId={user.id}
                    />
                )}

                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-[#121417] dark:text-white">
                            {UI_TEXT.DOCTOR.APPOINTMENTS.TITLE}
                        </h2>
                        <p className="text-sm text-[#687582] dark:text-gray-400">
                            {UI_TEXT.DOCTOR.APPOINTMENTS.SUBTITLE}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/portal/doctor/appointments/manage-slots')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] text-[#121417] dark:text-white rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                schedule
                            </span>
                            {UI_TEXT.DOCTOR.APPOINTMENTS.MANAGE_SLOTS}
                        </button>
                        <button
                            onClick={() => router.push('/portal/doctor/appointments/new')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all transform hover:-translate-y-0.5"
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                add
                            </span>
                            {UI_TEXT.DOCTOR.APPOINTMENTS.NEW_APPOINTMENT}
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
                    {/* Calendar */}
                    <div className="lg:col-span-3 bg-white dark:bg-[#1e242b] rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm flex flex-col overflow-hidden">
                        {/* Calendar Header */}
                        <div className="p-4 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px] text-[#687582]">
                                        chevron_left
                                    </span>
                                </button>
                                <h3 className="text-lg font-bold text-[#121417] dark:text-white">
                                    {formatWeekLabel(weekDates)}
                                </h3>
                                <button
                                    onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px] text-[#687582]">
                                        chevron_right
                                    </span>
                                </button>
                            </div>
                            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                                {(["day", "week", "month"] as ViewMode[]).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === mode
                                            ? "bg-white dark:bg-[#1e242b] text-[#121417] dark:text-white shadow-sm"
                                            : "text-[#687582] dark:text-gray-400 hover:text-[#121417] dark:hover:text-white"
                                            }`}
                                    >
                                        {mode === "day"
                                            ? "Ngày"
                                            : mode === "week"
                                                ? "Tuần"
                                                : "Tháng"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="flex-1 overflow-auto">
                            <div className="min-w-[800px]">
                                {/* Days Header */}
                                <div className="grid grid-cols-8 border-b border-[#e5e7eb] dark:border-[#2d353e] sticky top-0 bg-gray-50 dark:bg-gray-800/50 z-10">
                                    <div className="p-3 text-xs font-medium text-[#687582] dark:text-gray-400"></div>
                                    {daysOfWeek.map((day, index) => {
                                        const today = new Date();
                                        const dateForDay = weekDates[index];
                                        const isToday =
                                            dateForDay.getFullYear() === today.getFullYear() &&
                                            dateForDay.getMonth() === today.getMonth() &&
                                            dateForDay.getDate() === today.getDate();
                                        return (
                                            <div
                                                key={day}
                                                className={`p-3 text-center ${isToday
                                                    ? "bg-[#3C81C6]/10"
                                                    : ""
                                                    }`}
                                            >
                                                <span
                                                    className={`text-xs font-medium ${isToday
                                                        ? "text-[#3C81C6]"
                                                        : "text-[#687582] dark:text-gray-400"
                                                        }`}
                                                >
                                                    {day}
                                                </span>
                                                <p
                                                    className={`text-lg font-bold ${isToday
                                                        ? "text-[#3C81C6]"
                                                        : "text-[#121417] dark:text-white"
                                                        }`}
                                                >
                                                    {dateForDay.getDate()}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Time Slots */}
                                {hours.map((hour) => (
                                    <div
                                        key={hour}
                                        className="grid grid-cols-8 border-b border-[#e5e7eb] dark:border-[#2d353e] min-h-[60px]"
                                    >
                                        <div className="p-2 text-xs text-[#687582] dark:text-gray-400 text-right pr-3">
                                            {String(hour).padStart(2, "0")}:00
                                        </div>
                                        {daysOfWeek.map((day, dayIndex) => {
                                            const isToday = dayIndex === 0;
                                            const slot = appointments.find(
                                                (apt) =>
                                                    apt.dayOfWeek === dayIndex &&
                                                    apt.startTime.startsWith(String(hour).padStart(2, "0"))
                                            );

                                            return (
                                                <div
                                                    key={`${day}-${hour}`}
                                                    className={`p-1 border-l border-[#e5e7eb] dark:border-[#2d353e] ${isToday ? "bg-[#3C81C6]/5" : ""
                                                        }`}
                                                >
                                                    {slot && (
                                                        <div
                                                            className={`rounded-lg p-2 text-xs h-full cursor-pointer hover:shadow-md transition-shadow ${slot.type === "online"
                                                                ? "bg-purple-100 border-l-4 border-purple-500"
                                                                : "bg-blue-100 border-l-4 border-blue-500"
                                                                }`}
                                                        >
                                                            <p className="font-semibold text-[#121417] truncate">
                                                                {slot.patientName}
                                                            </p>
                                                            <p className="text-[#687582] truncate">
                                                                {slot.startTime} - {slot.endTime}
                                                            </p>
                                                            <span
                                                                className={`inline-flex items-center gap-1 mt-1 text-[10px] font-medium ${slot.type === "online"
                                                                    ? "text-purple-700"
                                                                    : "text-blue-700"
                                                                    }`}
                                                            >
                                                                <span className="material-symbols-outlined text-[12px]">
                                                                    {slot.type === "online"
                                                                        ? "videocam"
                                                                        : "meeting_room"}
                                                                </span>
                                                                {slot.type === "online"
                                                                    ? "Online"
                                                                    : "Trực tiếp"}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Pending Requests Sidebar */}
                    <div className="lg:col-span-1 bg-white dark:bg-[#1e242b] rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-[#e5e7eb] dark:border-[#2d353e]">
                            <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-orange-500 text-[20px]">
                                    pending_actions
                                </span>
                                {UI_TEXT.DOCTOR.APPOINTMENTS.PENDING_REQUESTS}
                                <span className="ml-auto bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {pendingRequests.length}
                                </span>
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                            {pendingRequests.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">
                                        event_available
                                    </span>
                                    <p className="text-sm text-[#687582] dark:text-gray-400">
                                        Không có yêu cầu chờ
                                    </p>
                                </div>
                            ) : (
                                pendingRequests.map((request) => (
                                    <div
                                        key={request.id}
                                        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-[#e5e7eb] dark:border-[#2d353e]"
                                    >
                                        <div className="flex items-start gap-2">
                                            <div
                                                className="size-9 rounded-full bg-cover bg-center border border-gray-200 bg-gray-100 shrink-0"
                                                style={{
                                                    backgroundImage: request.patientAvatar
                                                        ? `url('${request.patientAvatar}')`
                                                        : undefined,
                                                }}
                                            >
                                                {!request.patientAvatar && (
                                                    <div className="size-full flex items-center justify-center text-gray-400">
                                                        <span className="material-symbols-outlined text-[18px]">
                                                            person
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1">
                                                    <p className="text-sm font-bold text-[#121417] dark:text-white truncate">
                                                        {request.patientName}
                                                    </p>
                                                    {request.isReturning && (
                                                        <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                                                            Tái khám
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-[#687582] dark:text-gray-400">
                                                    {request.gender}, {request.age} tuổi
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-2 flex items-center gap-2 text-xs text-[#687582] dark:text-gray-400">
                                            <span className="material-symbols-outlined text-[14px]">
                                                calendar_today
                                            </span>
                                            {request.date} • {request.startTime} - {request.endTime}
                                        </div>

                                        <div className="mt-1 flex items-center gap-1 text-xs">
                                            <span
                                                className={`material-symbols-outlined text-[14px] ${request.type === "online"
                                                    ? "text-purple-600"
                                                    : "text-blue-600"
                                                    }`}
                                            >
                                                {request.type === "online"
                                                    ? "videocam"
                                                    : "meeting_room"}
                                            </span>
                                            <span
                                                className={
                                                    request.type === "online"
                                                        ? "text-purple-600"
                                                        : "text-blue-600"
                                                }
                                            >
                                                {request.type === "online"
                                                    ? "Tư vấn Online"
                                                    : "Khám trực tiếp"}
                                            </span>
                                        </div>

                                        {request.reason && (
                                            <p className="mt-2 text-xs text-[#687582] dark:text-gray-400 line-clamp-2 italic">
                                                &quot;{request.reason}&quot;
                                            </p>
                                        )}

                                        <div className="mt-3 flex items-center gap-2">
                                            <button
                                                onClick={() => handleAcceptRequest(request.id)}
                                                className="flex-1 py-1.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white text-xs font-medium rounded-lg transition-colors"
                                            >
                                                {UI_TEXT.DOCTOR.APPOINTMENTS.ACCEPT}
                                            </button>
                                            <button
                                                onClick={() => handleRejectRequest(request.id)}
                                                className="flex-1 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg transition-colors"
                                            >
                                                {UI_TEXT.DOCTOR.APPOINTMENTS.REJECT}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Appointment Detail Modal */}
            {selectedAppointment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedAppointment(null)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center justify-between">
                            <h3 className="text-lg font-bold text-[#121417] dark:text-white">
                                Chi tiết lịch hẹn
                            </h3>
                            <button
                                onClick={() => setSelectedAppointment(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-xs text-[#687582] mb-1">Bệnh nhân</p>
                                <p className="font-medium text-[#121417] dark:text-white">{selectedAppointment.patientName}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-[#687582] mb-1">Thời gian</p>
                                    <p className="font-medium text-[#121417] dark:text-white">{selectedAppointment.startTime} - {selectedAppointment.endTime}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[#687582] mb-1">Hình thức</p>
                                    <span className={`inline-flex items-center gap-1 text-sm font-medium ${selectedAppointment.type === 'online' ? 'text-purple-600' : 'text-blue-600'}`}>
                                        <span className="material-symbols-outlined text-[16px]">
                                            {selectedAppointment.type === 'online' ? 'videocam' : 'meeting_room'}
                                        </span>
                                        {selectedAppointment.type === 'online' ? 'Online' : 'Trực tiếp'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-[#687582] mb-1">Lý do khám</p>
                                <p className="font-medium text-[#121417] dark:text-white">{selectedAppointment.reason}</p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#e5e7eb] dark:border-[#2d353e] flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    handleRejectRequest(selectedAppointment.id);
                                    setSelectedAppointment(null);
                                }}
                                className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors"
                            >
                                Hủy lịch
                            </button>
                            <button
                                onClick={() => setSelectedAppointment(null)}
                                className="px-4 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
