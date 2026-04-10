"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppointmentStatusBadge } from "@/components/patient/AppointmentStatusBadge";
import { getAppointmentById, cancelAppointment, type Appointment } from "@/services/appointmentService";
import { getMockAppointmentById } from "@/data/patient-mock";

const STATUS_TIMELINE = [
    { status: "pending", label: "Đã đặt lịch", icon: "edit_calendar" },
    { status: "confirmed", label: "Đã xác nhận", icon: "check_circle" },
    { status: "waiting", label: "Đang chờ khám", icon: "groups" },
    { status: "examining", label: "Đang khám", icon: "stethoscope" },
    { status: "completed", label: "Hoàn thành", icon: "task_alt" },
];

export default function AppointmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewText, setReviewText] = useState("");

    useEffect(() => {
        if (id) loadAppointment();
    }, [id]);

    const loadAppointment = async () => {
        try {
            setLoading(true);
            const apt = await getAppointmentById(id);
            if (apt && apt.id) {
                setAppointment(apt);
            } else {
                setAppointment(getMockAppointmentById(id));
            }
        } catch {
            setAppointment(getMockAppointmentById(id));
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        try {
            setCancelling(true);
            await cancelAppointment(id, cancelReason);
            setShowCancelModal(false);
            await loadAppointment();
        } catch { /* silent */ } finally {
            setCancelling(false);
        }
    };

    const getTimelineIndex = (status: string): number => {
        const idx = STATUS_TIMELINE.findIndex(s => s.status === status);
        return idx >= 0 ? idx : 0;
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
                    <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                </div>
            </div>
        );
    }

    if (!appointment) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
                <span className="material-symbols-outlined text-gray-300 mb-4" style={{ fontSize: "64px" }}>event_busy</span>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Không tìm thấy lịch hẹn</h3>
                <Link href="/patient/appointments" className="text-[#3C81C6] text-sm font-medium hover:underline">← Quay lại danh sách</Link>
            </div>
        );
    }

    const currentStep = getTimelineIndex(appointment.status);
    const isCancellable = appointment.status === "pending" || appointment.status === "confirmed";
    const isCompleted = appointment.status === "completed";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/patient/appointments"
                        className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>arrow_back</span>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Chi tiết lịch hẹn</h1>
                        <p className="text-xs text-gray-400 mt-0.5">Mã: #{appointment.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                </div>
                <AppointmentStatusBadge status={appointment.status} size="md" />
            </div>

            {/* Status Timeline */}
            {appointment.status !== "cancelled" && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-5 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>timeline</span>
                        Trạng thái lịch hẹn
                    </h3>
                    <div className="flex items-center justify-between relative">
                        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 mx-8">
                            <div className="h-full bg-gradient-to-r from-[#3C81C6] to-[#2563eb] transition-all duration-700"
                                style={{ width: `${(currentStep / (STATUS_TIMELINE.length - 1)) * 100}%` }} />
                        </div>
                        {STATUS_TIMELINE.map((step, i) => {
                            const isPast = i <= currentStep;
                            const isCurrent = i === currentStep;
                            return (
                                <div key={step.status} className="relative z-10 flex flex-col items-center" style={{ flex: 1 }}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all
                                        ${isPast ? "bg-gradient-to-br from-[#3C81C6] to-[#2563eb] text-white shadow-md" : "bg-gray-100 text-gray-400"}
                                        ${isCurrent ? "ring-4 ring-[#3C81C6]/20 scale-110" : ""}`}>
                                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                                            {isPast && !isCurrent ? "check" : step.icon}
                                        </span>
                                    </div>
                                    <span className={`mt-2 text-[10px] font-medium text-center max-w-[70px]
                                        ${isCurrent ? "text-[#3C81C6] font-semibold" : isPast ? "text-gray-700" : "text-gray-400"}`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Cancelled banner */}
            {appointment.status === "cancelled" && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
                    <span className="material-symbols-outlined text-red-500 mt-0.5" style={{ fontSize: "20px" }}>cancel</span>
                    <div>
                        <h3 className="text-sm font-bold text-red-800">Lịch hẹn đã bị hủy</h3>
                        <p className="text-xs text-red-600 mt-0.5">Lý do: {appointment.notes || "Không có"}</p>
                    </div>
                </div>
            )}

            {/* Appointment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Doctor & Specialty */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>person</span>
                        Thông tin bác sĩ
                    </h3>
                    <div className="space-y-3">
                        <InfoRow icon="person" label="Bác sĩ" value={appointment.doctorName} />
                        <InfoRow icon="medical_services" label="Chuyên khoa" value={appointment.departmentName} />
                        <InfoRow icon="location_on" label="Địa điểm" value="EHealth Hospital — 123 Nguyễn Văn Linh, Q.7" />
                    </div>
                </div>

                {/* Schedule */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>calendar_month</span>
                        Thời gian
                    </h3>
                    <div className="space-y-3">
                        <InfoRow icon="event" label="Ngày khám" value={appointment.date} />
                        <InfoRow icon="schedule" label="Giờ khám" value={appointment.time} />
                        <InfoRow icon="category" label="Loại khám" value={
                            appointment.type === "first_visit" ? "Khám lần đầu" : appointment.type === "re_examination" ? "Tái khám" : "Tư vấn"
                        } />
                    </div>
                </div>
            </div>

            {/* Symptoms / Reason */}
            {appointment.reason && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>description</span>
                        Triệu chứng / Lý do khám
                    </h3>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">{appointment.reason}</p>
                </div>
            )}

            {/* Medical results — only if completed */}
            {isCompleted && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>labs</span>
                        Kết quả khám
                    </h3>
                    <div className="space-y-3">
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-400 mb-1">Chẩn đoán</p>
                            <p className="text-sm font-medium text-gray-800">Kết quả sẽ được bác sĩ cập nhật</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-400 mb-1">Đơn thuốc</p>
                            <p className="text-sm text-gray-600">Chưa có đơn thuốc</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Review form — only if completed */}
            {isCompleted && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>rate_review</span>
                        Đánh giá trải nghiệm
                    </h3>
                    <div className="flex items-center gap-1 mb-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <button key={i} onClick={() => setReviewRating(i + 1)}
                                className="transition-transform hover:scale-110 active:scale-95">
                                <span className={`material-symbols-outlined ${i < reviewRating ? "text-amber-400" : "text-gray-200"}`}
                                    style={{ fontSize: "32px" }}>star</span>
                            </button>
                        ))}
                        {reviewRating > 0 && <span className="text-sm text-gray-500 ml-2">{reviewRating}/5</span>}
                    </div>
                    <textarea value={reviewText} onChange={e => setReviewText(e.target.value)}
                        placeholder="Chia sẻ trải nghiệm khám bệnh của bạn..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 bg-gray-50 min-h-[80px] resize-none mb-3" />
                    <button className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#2563eb] rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.97]">
                        Gửi đánh giá
                    </button>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
                {isCancellable && (
                    <>
                        <Link href={`/booking?reschedule=${appointment.id}`}
                            className="px-5 py-2.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>event_repeat</span>
                            Dời lịch
                        </Link>
                        <button onClick={() => setShowCancelModal(true)}
                            className="px-5 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>event_busy</span>
                            Hủy lịch
                        </button>
                    </>
                )}
            </div>

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowCancelModal(false)}>
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
                            <button onClick={() => setShowCancelModal(false)}
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
        </div>
    );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-gray-400 mt-0.5" style={{ fontSize: "16px" }}>{icon}</span>
            <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value}</p>
            </div>
        </div>
    );
}
