"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAppointments, confirmAppointment, cancelAppointment } from "@/services/appointmentService";
import { appointmentStatusService } from "@/services/appointmentStatusService";
import { usePageAIContext } from "@/hooks/usePageAIContext";


const STATUS_MAP: Record<string, { label: string; class: string }> = {
    confirmed: { label: "Đã xác nhận", class: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" },
    pending: { label: "Chờ xác nhận", class: "bg-amber-50 dark:bg-amber-500/10 text-amber-600" },
    cancelled: { label: "Đã hủy", class: "bg-red-50 dark:bg-red-500/10 text-red-500" },
    completed: { label: "Hoàn thành", class: "bg-blue-50 dark:bg-blue-500/10 text-blue-600" },
    checked_in: { label: "Đã tiếp nhận", class: "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600" },
};

type AptItem = {
    id: string; patient: string; phone: string; doctor: string; dept: string;
    date: string; time: string; type: string; status: string; note: string;
};

export default function ReceptionistAppointments() {
    usePageAIContext({ pageKey: 'appointments' });
    const router = useRouter();
    const [appointments, setAppointments] = useState<AptItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [cancelModal, setCancelModal] = useState<{ id: string; patient: string } | null>(null);
    const [cancelReason, setCancelReason] = useState("");
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [deptFilter, setDeptFilter] = useState("all");

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadAppointments = async () => {
        try {
            setLoading(true);
            const res = await getAppointments({ limit: 100 });
            const items: any[] = res?.data ?? [];
            const mapped = items.map((a: any) => ({
                id: a.id ?? "", patient: a.patientName ?? a.patient_name ?? "",
                phone: a.phone ?? a.contact?.phone ?? "", doctor: a.doctorName ?? a.doctor_name ?? "",
                dept: a.departmentName ?? a.department_name ?? "", date: a.date ?? "",
                time: a.time ?? "", type: a.type ?? "", status: a.status ?? "pending", note: a.reason ?? a.notes ?? "",
            }));
            setAppointments(mapped);
        } catch {
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAppointments(); }, []);

    const handleConfirm = async (id: string) => {
        setActionLoading(id + "-confirm");
        try {
            await confirmAppointment(id);
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "confirmed" } : a));
            showToast("Đã xác nhận lịch hẹn");
        } catch {
            showToast("Xác nhận thất bại", "error");
        } finally {
            setActionLoading(null);
        }
    };

    const handleCheckIn = async (id: string) => {
        setActionLoading(id + "-checkin");
        try {
            await appointmentStatusService.checkIn(id);
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "checked_in" } : a));
            showToast("Đã tiếp nhận bệnh nhân");
        } catch {
            showToast("Tiếp nhận thất bại", "error");
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancelConfirm = async () => {
        if (!cancelModal) return;
        setActionLoading(cancelModal.id + "-cancel");
        try {
            await cancelAppointment(cancelModal.id, cancelReason);
            setAppointments(prev => prev.map(a => a.id === cancelModal.id ? { ...a, status: "cancelled" } : a));
            showToast("Đã hủy lịch hẹn");
        } catch {
            showToast("Hủy lịch thất bại", "error");
        } finally {
            setActionLoading(null);
            setCancelModal(null);
            setCancelReason("");
        }
    };

    const filtered = useMemo(() => {
        return appointments.filter((apt) => {
            const matchSearch = apt.patient.toLowerCase().includes(searchQuery.toLowerCase())
                || apt.id.toLowerCase().includes(searchQuery.toLowerCase())
                || apt.phone.includes(searchQuery);
            const matchStatus = statusFilter === "all" || apt.status === statusFilter;
            const matchDept = deptFilter === "all" || apt.dept === deptFilter;
            return matchSearch && matchStatus && matchDept;
        });
    }, [appointments, searchQuery, statusFilter, deptFilter]);

    const departments = Array.from(new Set(appointments.map((a) => a.dept).filter(Boolean)));

    return (
        <div className="p-6 md:p-8">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg transition-all ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
                    {toast.msg}
                </div>
            )}

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#121417] dark:text-white">Quản lý Lịch hẹn</h1>
                        <p className="text-sm text-[#687582] mt-1">Xem và quản lý lịch hẹn khám bệnh của bệnh nhân</p>
                    </div>
                    <button
                        onClick={() => router.push('/portal/receptionist/appointments/new')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-[#3C81C6]/20"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                        Tạo lịch hẹn mới
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {[
                        { label: "Tổng lịch hẹn", value: appointments.length, icon: "calendar_month", color: "text-blue-600" },
                        { label: "Đã xác nhận", value: appointments.filter((a) => a.status === "confirmed").length, icon: "check_circle", color: "text-emerald-600" },
                        { label: "Chờ xác nhận", value: appointments.filter((a) => a.status === "pending").length, icon: "pending", color: "text-amber-600" },
                        { label: "Đã hủy", value: appointments.filter((a) => a.status === "cancelled").length, icon: "cancel", color: "text-red-500" },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-4 flex items-center gap-4">
                            <span className={`material-symbols-outlined ${stat.color}`} style={{ fontSize: "28px" }}>{stat.icon}</span>
                            <div>
                                <p className="text-xl font-bold text-[#121417] dark:text-white">{stat.value}</p>
                                <p className="text-xs text-[#687582]">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    {/* Filters */}
                    <div className="p-4 border-b border-[#dde0e4] dark:border-[#2d353e] flex flex-col sm:flex-row gap-3 items-center">
                        <div className="relative flex-1 w-full sm:max-w-xs">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#687582]" style={{ fontSize: "20px" }}>search</span>
                            <input
                                type="text"
                                placeholder="Tìm theo tên, mã, SĐT..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm outline-none focus:border-[#3C81C6] transition-colors"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm outline-none focus:border-[#3C81C6]"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="confirmed">Đã xác nhận</option>
                            <option value="pending">Chờ xác nhận</option>
                            <option value="checked_in">Đã tiếp nhận</option>
                            <option value="cancelled">Đã hủy</option>
                            <option value="completed">Hoàn thành</option>
                        </select>
                        <select
                            value={deptFilter}
                            onChange={(e) => setDeptFilter(e.target.value)}
                            className="px-3 py-2 bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm outline-none focus:border-[#3C81C6]"
                        >
                            <option value="all">Tất cả khoa</option>
                            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    {/* Table Content */}
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="w-8 h-8 border-2 border-[#3C81C6] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-sm text-[#687582]">Đang tải dữ liệu...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-[#dde0e4] dark:border-[#2d353e]">
                                        <th className="px-4 py-3 text-xs font-semibold text-[#687582] uppercase">Mã</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-[#687582] uppercase">Bệnh nhân</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-[#687582] uppercase">Giờ hẹn</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-[#687582] uppercase">Bác sĩ</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-[#687582] uppercase">Loại</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-[#687582] uppercase">Trạng thái</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-[#687582] uppercase">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-12 text-center text-[#687582]">
                                                <span className="material-symbols-outlined text-4xl block mb-2">search_off</span>
                                                Không có lịch hẹn nào
                                            </td>
                                        </tr>
                                    ) : filtered.map((apt) => (
                                        <tr key={apt.id} className="border-b border-[#dde0e4] dark:border-[#2d353e] hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-4 py-3 text-sm font-mono text-[#3C81C6] font-medium">{apt.id?.slice(0, 8).toUpperCase() || apt.id}</td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-semibold text-[#121417] dark:text-white">{apt.patient}</p>
                                                <p className="text-xs text-[#687582]">{apt.phone}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-semibold text-[#121417] dark:text-white">{apt.time}</p>
                                                <p className="text-xs text-[#687582]">{apt.date}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm text-[#121417] dark:text-white">{apt.doctor}</p>
                                                <p className="text-xs text-[#687582]">{apt.dept}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${apt.type === "Tái khám" || apt.type === "re_examination" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600" : "bg-violet-50 dark:bg-violet-500/10 text-violet-600"}`}>
                                                    {apt.type === "first_visit" ? "Khám mới" : apt.type === "re_examination" ? "Tái khám" : apt.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_MAP[apt.status]?.class ?? "bg-gray-100 text-gray-500"}`}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                    {STATUS_MAP[apt.status]?.label ?? apt.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    {apt.status === "pending" && (
                                                        <button
                                                            onClick={() => handleConfirm(apt.id)}
                                                            disabled={actionLoading === apt.id + "-confirm"}
                                                            className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-600 transition-colors disabled:opacity-50" title="Xác nhận">
                                                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check_circle</span>
                                                        </button>
                                                    )}
                                                    {(apt.status === "confirmed" || apt.status === "pending") && (
                                                        <button
                                                            onClick={() => handleCheckIn(apt.id)}
                                                            disabled={actionLoading === apt.id + "-checkin"}
                                                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-600 transition-colors disabled:opacity-50" title="Tiếp nhận check-in">
                                                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>how_to_reg</span>
                                                        </button>
                                                    )}
                                                    {apt.status !== "cancelled" && apt.status !== "completed" && (
                                                        <button
                                                            onClick={() => { setCancelModal({ id: apt.id, patient: apt.patient }); setCancelReason(""); }}
                                                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors" title="Hủy">
                                                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="p-4 border-t border-[#dde0e4] dark:border-[#2d353e] flex items-center justify-between text-sm text-[#687582]">
                        <span>Hiển thị {filtered.length}/{appointments.length} lịch hẹn</span>
                    </div>
                </div>
            </div>

            {/* Cancel Confirmation Modal */}
            {cancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setCancelModal(null)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-red-600" style={{ fontSize: "22px" }}>warning</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Xác nhận hủy lịch</h3>
                                <p className="text-xs text-gray-500">BN: {cancelModal.patient}</p>
                            </div>
                        </div>
                        <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                            placeholder="Lý do hủy lịch (không bắt buộc)..."
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm mb-4 bg-gray-50 dark:bg-gray-800 dark:text-white min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-red-200" />
                        <div className="flex gap-3">
                            <button onClick={() => setCancelModal(null)}
                                className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                Quay lại
                            </button>
                            <button onClick={handleCancelConfirm} disabled={actionLoading !== null}
                                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors">
                                {actionLoading ? "Đang xử lý..." : "Xác nhận hủy"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
