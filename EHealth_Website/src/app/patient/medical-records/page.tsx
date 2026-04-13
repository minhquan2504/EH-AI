"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import axiosClient from "@/api/axiosClient";
import { MEDICAL_RECORD_ENDPOINTS, EHR_ENDPOINTS } from "@/api/endpoints";
import { unwrap, unwrapList } from "@/api/response";
import { usePageAIContext } from "@/hooks/usePageAIContext";
import { AIResultExplainer } from "@/components/portal/ai";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MedicalRecord {
    id: string;
    date: string;
    doctorName: string;
    department: string;
    diagnosis: string;
    status: string;
    encounterId?: string;
}

interface TimelineItem {
    id: string;
    date: string;
    type: string;
    title: string;
    description: string;
    doctorName?: string;
    department?: string;
    status: string;
    icon: string;
    color: string;
}

// ─── Adapters ─────────────────────────────────────────────────────────────────

function adaptRecord(r: any): MedicalRecord {
    return {
        id: r.id ?? r._id ?? r.encounterId ?? String(Math.random()),
        date: r.date ?? r.visitDate ?? r.createdAt ?? "",
        doctorName: r.doctorName ?? r.doctor_name ?? r.doctor?.name ?? r.doctor?.fullName ?? "",
        department: r.department ?? r.speciality ?? r.departmentName ?? "",
        diagnosis: r.diagnosis ?? r.mainDiagnosis ?? r.conclusion ?? "",
        status: r.status ?? "completed",
        encounterId: r.encounterId ?? r.encounter_id ?? r.id,
    };
}

function adaptTimeline(t: any): TimelineItem {
    const iconMap: Record<string, string> = {
        examination: "stethoscope", lab_result: "science", prescription: "medication",
        surgery: "surgical", vaccination: "vaccines", vital_check: "monitor_heart",
        lab: "science", visit: "stethoscope", vaccine: "vaccines",
    };
    const colorMap: Record<string, string> = {
        examination: "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
        lab_result: "text-purple-500 bg-purple-50 dark:bg-purple-500/10",
        prescription: "text-green-500 bg-green-50 dark:bg-green-500/10",
        surgery: "text-orange-500 bg-orange-50 dark:bg-orange-500/10",
        vaccination: "text-amber-500 bg-amber-50 dark:bg-amber-500/10",
        vital_check: "text-red-500 bg-red-50 dark:bg-red-500/10",
    };
    const type = t.type ?? "examination";
    return {
        id: t.id ?? t._id ?? String(Math.random()),
        date: t.date ?? t.createdAt ?? "",
        type,
        title: t.title ?? t.name ?? "Sự kiện y tế",
        description: t.description ?? t.summary ?? "",
        doctorName: t.doctorName ?? t.doctor?.name ?? t.doctor?.fullName,
        department: t.department ?? t.speciality,
        status: t.status ?? "completed",
        icon: t.icon ?? iconMap[type] ?? "health_and_safety",
        color: t.color ?? colorMap[type] ?? "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
    };
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; cls: string }> = {
        completed: { label: "Hoàn thành", cls: "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400" },
        finalized: { label: "Đã ký duyệt", cls: "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400" },
        pending: { label: "Chờ xử lý", cls: "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400" },
        in_progress: { label: "Đang khám", cls: "bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400" },
    };
    const cfg = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-600" };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${cfg.cls}`}>{cfg.label}</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ViewMode = "list" | "timeline";

export default function MedicalRecordsPage() {
    usePageAIContext({ pageKey: 'medical-records' });
    const { user } = useAuth();
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingTimeline, setLoadingTimeline] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
    const [timelineFetched, setTimelineFetched] = useState(false);

    useEffect(() => {
        loadRecords();
    }, [user?.id]);

    const loadRecords = async () => {
        try {
            setLoading(true);
            if (user?.id) {
                const res = await axiosClient.get(MEDICAL_RECORD_ENDPOINTS.BY_PATIENT(user.id));
                const raw = unwrapList<any>(res);
                const data = raw.data?.length ? raw.data : (res.data?.data ?? res.data ?? []);
                setRecords(Array.isArray(data) ? data.map(adaptRecord) : []);
            }
        } catch {
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    const loadTimeline = async () => {
        if (timelineFetched || !user?.id) return;
        setLoadingTimeline(true);
        try {
            const res = await axiosClient.get(EHR_ENDPOINTS.TIMELINE(user.id));
            const raw = unwrapList<any>(res);
            if (raw.data?.length) {
                setTimeline(raw.data.map(adaptTimeline));
            }
            setTimelineFetched(true);
        } catch {
            // giữ trống
        } finally {
            setLoadingTimeline(false);
        }
    };

    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode);
        if (mode === "timeline") loadTimeline();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#121417] dark:text-white">Kết quả khám bệnh</h1>
                    <p className="text-sm text-[#687582] mt-0.5">Xem lại kết quả khám, đơn thuốc và xét nghiệm</p>
                </div>
                <div className="flex items-center gap-1 p-1 bg-[#f6f7f8] dark:bg-[#13191f] rounded-xl border border-[#e5e7eb] dark:border-[#2d353e]">
                    {(["list", "timeline"] as ViewMode[]).map(mode => (
                        <button key={mode} onClick={() => handleViewModeChange(mode)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${viewMode === mode ? "bg-white dark:bg-[#1e242b] text-[#121417] dark:text-white shadow-sm" : "text-[#687582] hover:text-[#121417] dark:hover:text-white"}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{mode === "list" ? "list" : "timeline"}</span>
                            {mode === "list" ? "Danh sách" : "Dòng thời gian"}
                        </button>
                    ))}
                </div>
            </div>

            {/* AI Result Explainer */}
            <AIResultExplainer />

            {/* ── List View ── */}
            {viewMode === "list" && (
                <>
                    {loading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5 animate-pulse">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
                                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3 mb-2" />
                                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : records.length === 0 ? (
                        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] py-16 text-center">
                            <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 mb-4" style={{ fontSize: "64px" }}>folder_open</span>
                            <h3 className="text-lg font-semibold text-[#121417] dark:text-white mb-1">Chưa có kết quả khám</h3>
                            <p className="text-sm text-[#687582] mb-6">Kết quả sẽ được cập nhật sau mỗi lần khám tại EHealth</p>
                            <Link href="/booking"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#3C81C6] to-[#2563eb] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>calendar_month</span>
                                Đặt lịch khám
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {records.map(record => (
                                <div key={record.id}
                                    className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] hover:border-[#3C81C6]/20 hover:shadow-md transition-all p-5 cursor-pointer"
                                    onClick={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3C81C6]/10 to-[#60a5fa]/10 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "24px" }}>description</span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-[#121417] dark:text-white">{record.department || "Kết quả khám"}</h3>
                                                {record.doctorName && <p className="text-sm text-[#687582] mt-0.5">BS. {record.doctorName}</p>}
                                                <div className="flex items-center gap-3 mt-2 text-xs text-[#687582]">
                                                    {record.date && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>event</span>
                                                            {record.date}
                                                        </span>
                                                    )}
                                                    <StatusBadge status={record.status} />
                                                </div>
                                                {record.diagnosis && (
                                                    <p className="text-sm text-[#687582] mt-2 p-2 bg-[#f6f7f8] dark:bg-[#13191f] rounded-lg">
                                                        <span className="font-medium text-[#121417] dark:text-white">Chẩn đoán:</span> {record.diagnosis}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`material-symbols-outlined text-[#687582] transition-transform ${selectedRecord?.id === record.id ? "rotate-180" : ""}`} style={{ fontSize: "20px" }}>expand_more</span>
                                        </div>
                                    </div>

                                    {/* Detail panel */}
                                    {selectedRecord?.id === record.id && (
                                        <div className="mt-4 pt-4 border-t border-[#e5e7eb] dark:border-[#2d353e] space-y-3">
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div className="bg-[#f6f7f8] dark:bg-[#13191f] rounded-xl p-3">
                                                    <p className="text-xs text-[#687582] mb-1">Bác sĩ phụ trách</p>
                                                    <p className="font-semibold text-[#121417] dark:text-white">{record.doctorName || "—"}</p>
                                                </div>
                                                <div className="bg-[#f6f7f8] dark:bg-[#13191f] rounded-xl p-3">
                                                    <p className="text-xs text-[#687582] mb-1">Khoa / Phòng</p>
                                                    <p className="font-semibold text-[#121417] dark:text-white">{record.department || "—"}</p>
                                                </div>
                                                <div className="bg-[#f6f7f8] dark:bg-[#13191f] rounded-xl p-3">
                                                    <p className="text-xs text-[#687582] mb-1">Ngày khám</p>
                                                    <p className="font-semibold text-[#121417] dark:text-white">{record.date || "—"}</p>
                                                </div>
                                                <div className="bg-[#f6f7f8] dark:bg-[#13191f] rounded-xl p-3">
                                                    <p className="text-xs text-[#687582] mb-1">Trạng thái</p>
                                                    <StatusBadge status={record.status} />
                                                </div>
                                            </div>
                                            {record.diagnosis && (
                                                <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-3">
                                                    <p className="text-xs text-[#687582] mb-1">Chẩn đoán / Kết luận</p>
                                                    <p className="text-sm text-[#121417] dark:text-white font-medium">{record.diagnosis}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ── Timeline View ── */}
            {viewMode === "timeline" && (
                <>
                    {loadingTimeline ? (
                        <div className="space-y-4 animate-pulse">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                                    <div className="flex-1 bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-4 space-y-2">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                                        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : timeline.length === 0 ? (
                        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] py-16 text-center">
                            <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 mb-3" style={{ fontSize: "56px" }}>timeline</span>
                            <p className="text-sm text-[#687582]">Chưa có dữ liệu dòng thời gian</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-6">
                            <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-6">Lịch sử khám bệnh</h3>
                            <div className="relative">
                                <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-[#e5e7eb] dark:bg-[#2d353e]" />
                                <div className="space-y-6">
                                    {timeline.map(item => (
                                        <div key={item.id} className="relative flex gap-4">
                                            <div className={`relative z-10 w-9 h-9 rounded-full ${item.color} flex items-center justify-center flex-shrink-0 ring-4 ring-white dark:ring-[#1e242b]`}>
                                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{item.icon}</span>
                                            </div>
                                            <div className="flex-1 pb-6">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-[#121417] dark:text-white">{item.title}</h4>
                                                        <p className="text-xs text-[#687582] mt-0.5">{item.description}</p>
                                                        {item.doctorName && (
                                                            <p className="text-xs text-[#687582] mt-1">
                                                                BS. {item.doctorName}{item.department && ` • ${item.department}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="text-xs text-[#687582] whitespace-nowrap bg-[#f6f7f8] dark:bg-[#13191f] px-2 py-1 rounded-md">{item.date}</span>
                                                        <StatusBadge status={item.status} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
