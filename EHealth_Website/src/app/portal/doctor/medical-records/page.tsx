"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { emrService } from "@/services/emrService";
import { encounterService } from "@/services/encounterService";
import { useAuth } from "@/contexts/AuthContext";
import { AIRecordSummary, AITrendDetector } from "@/components/portal/ai";
import { usePageAIContext } from "@/hooks/usePageAIContext";

const typeConfig: Record<string, { icon: string; color: string; label: string }> = {
    visit: { icon: "stethoscope", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400", label: "Lượt khám" },
    lab: { icon: "science", color: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400", label: "Xét nghiệm" },
    prescription: { icon: "medication", color: "bg-teal-100 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400", label: "Đơn thuốc" },
    imaging: { icon: "radiology", color: "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400", label: "Hình ảnh" },
};

export default function MedicalRecordsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [filterType, setFilterType] = useState("all");
    const [patientFilter, setPatientFilter] = useState("");
    const [loading, setLoading] = useState(false);
    usePageAIContext({ pageKey: "medical-records" });
    const [timeline, setTimeline] = useState<any[]>([]);

    useEffect(() => {
        if (!user?.id) return;
        setLoading(true);
        // Thử load từ encounters API (medical records theo doctor)
        encounterService.getList({ doctorId: user.id, limit: 50 })
            .then(res => {
                const items: any[] = res?.data?.items ?? res?.data ?? res ?? [];
                if (items.length > 0) {
                    const mapped = items.map((e: any) => ({
                        id: e.id,
                        date: e.visitDate
                            ? new Date(e.visitDate).toLocaleDateString("vi-VN")
                            : e.createdAt
                                ? new Date(e.createdAt).toLocaleDateString("vi-VN")
                                : "",
                        type: "visit",
                        title: `Khám ${e.departmentName ?? e.specialty ?? ""}`.trim(),
                        doctor: e.doctorName ?? e.doctor?.fullName ?? "",
                        department: e.departmentName ?? e.specialty ?? "",
                        details: e.diagnosis ?? e.chiefComplaint ?? e.reason ?? "",
                        vitalSigns: e.vitalSigns
                            ? { bp: e.vitalSigns.bloodPressure ?? "", hr: String(e.vitalSigns.heartRate ?? "") }
                            : undefined,
                        patientId: e.patientId,
                        patientName: e.patientName ?? e.patient?.fullName ?? "",
                    }));
                    setTimeline(mapped as any);
                }
            })
            .catch(() => { setTimeline([]); })
            .finally(() => setLoading(false));
    }, [user?.id]);

    const filtered = timeline.filter((item) => {
        if (filterType !== "all" && item.type !== filterType) return false;
        if (patientFilter.trim()) {
            const q = patientFilter.toLowerCase();
            const name = (item as any).patientName?.toLowerCase() ?? "";
            const pId = (item as any).patientId?.toLowerCase() ?? "";
            if (!name.includes(q) && !pId.includes(q)) return false;
        }
        return true;
    });

    // Group by date
    const grouped: Record<string, any[]> = filtered.reduce((acc: Record<string, any[]>, item) => {
        if (!acc[item.date]) acc[item.date] = [];
        acc[item.date].push(item);
        return acc;
    }, {});

    return (
        <div className="p-6 md:p-8"><div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#121417] dark:text-white">Hồ sơ sức khỏe điện tử (EHR)</h1>
                    <p className="text-sm text-[#687582] mt-1">Lộ trình sức khỏe — Nguyễn Văn An (BN001)</p>
                </div>
            </div>

            {/* Patient Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                    { l: "Chẩn đoán hiện tại", v: "Tăng HA + ĐTĐ2", i: "medical_information", c: "from-red-500 to-red-600" },
                    { l: "Lần khám gần nhất", v: "20/02/2025", i: "event", c: "from-blue-500 to-blue-600" },
                    { l: "Tổng lượt khám", v: "12", i: "history", c: "from-green-500 to-green-600" },
                    { l: "Dị ứng", v: "Penicillin", i: "warning", c: "from-amber-500 to-amber-600" },
                ].map((s) => (
                    <div key={s.l} className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.c} flex items-center justify-center`}>
                            <span className="material-symbols-outlined text-white" style={{ fontSize: "20px" }}>{s.i}</span>
                        </div>
                        <div><p className="text-sm font-bold text-[#121417] dark:text-white">{s.v}</p><p className="text-xs text-[#687582]">{s.l}</p></div>
                    </div>
                ))}
            </div>

            {/* AI Record Summary */}
            <AIRecordSummary patientId="BN001" patientName="Nguyễn Văn An" />

            {/* AI Trend Detector */}
            <AITrendDetector patientId="BN001" />

            {/* Vital Signs Trend (simplified) */}
            <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-5">
                <h3 className="text-sm font-semibold text-[#121417] dark:text-white mb-3">Biểu đồ theo dõi huyết áp</h3>
                <div className="flex items-end gap-4 h-40">
                    {[
                        { date: "11/2024", val: 130, color: "bg-green-500" },
                        { date: "12/2024", val: 125, color: "bg-green-500" },
                        { date: "01/2025", val: 135, color: "bg-amber-500" },
                        { date: "02/2025", val: 140, color: "bg-red-500" },
                    ].map((d) => (
                        <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                            <div className="relative w-full flex justify-center">
                                <div className={`w-8 rounded-t-md ${d.color} transition-all`} style={{ height: `${(d.val - 100) * 3}px` }} />
                                <span className="absolute -top-5 text-xs font-bold text-[#121417] dark:text-white">{d.val}</span>
                            </div>
                            <span className="text-[10px] text-[#687582]">{d.date}</span>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#dde0e4] dark:border-[#2d353e]">
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500" /><span className="text-xs text-[#687582]">Bình thường</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500" /><span className="text-xs text-[#687582]">Cảnh báo</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500" /><span className="text-xs text-[#687582]">Cao</span></div>
                </div>
            </div>

            {/* Filter */}
            <div className="space-y-3">
                {/* Search patient */}
                <div className="relative max-w-sm">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#b0b8c1] text-[18px]">search</span>
                    <input
                        type="text"
                        value={patientFilter}
                        onChange={(e) => setPatientFilter(e.target.value)}
                        placeholder="Tìm theo tên hoặc mã bệnh nhân..."
                        className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                    />
                </div>
                {/* Type filter */}
                <div className="flex gap-2 flex-wrap items-center">
                    {[{ k: "all", l: "Tất cả" }, ...Object.entries(typeConfig).map(([k, v]) => ({ k, l: v.label }))].map((f) => (
                        <button key={f.k} onClick={() => setFilterType(f.k)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === f.k ? "bg-[#3C81C6] text-white" : "bg-white dark:bg-[#1e242b] text-[#687582] border border-[#dde0e4] dark:border-[#2d353e]"}`}>
                            {f.l}
                        </button>
                    ))}
                    {loading && <div className="w-4 h-4 border-2 border-[#3C81C6] border-t-transparent rounded-full animate-spin ml-2" />}
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-6">
                {Object.keys(grouped).length === 0 && !loading && (
                    <div className="text-center py-16">
                        <span className="material-symbols-outlined text-4xl text-[#b0b8c1] block mb-3">folder_open</span>
                        <p className="text-sm text-[#687582]">Không tìm thấy hồ sơ phù hợp</p>
                    </div>
                )}
                {Object.entries(grouped).map(([date, items]) => (
                    <div key={date}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-[#3C81C6] flex items-center justify-center">
                                <span className="material-symbols-outlined text-white" style={{ fontSize: "16px" }}>calendar_today</span>
                            </div>
                            <h3 className="text-sm font-bold text-[#121417] dark:text-white">{date}</h3>
                        </div>
                        <div className="ml-4 pl-7 border-l-2 border-[#dde0e4] dark:border-[#2d353e] space-y-3">
                            {items.map((item) => {
                                const config = typeConfig[item.type];
                                return (
                                    <div key={item.id} className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-4 hover:shadow-md transition-shadow relative">
                                        {/* Dot */}
                                        <div className="absolute -left-[calc(1.75rem+5px)] top-5 w-3 h-3 rounded-full bg-white dark:bg-[#1e242b] border-2 border-[#3C81C6]" />
                                        <div className="flex items-start gap-3">
                                            <div className={`w-9 h-9 rounded-lg ${config.color} flex items-center justify-center flex-shrink-0`}>
                                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{config.icon}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-sm font-bold text-[#121417] dark:text-white">{item.title}</p>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${config.color}`}>{config.label}</span>
                                                </div>
                                                {"doctor" in item && <p className="text-xs text-[#687582] mb-1">{item.doctor} • {item.department}</p>}
                                                <p className="text-sm text-[#687582]">{item.details}</p>
                                                {"vitalSigns" in item && item.vitalSigns && (
                                                    <div className="flex gap-3 mt-2">
                                                        <span className="text-xs bg-[#f6f7f8] dark:bg-[#13191f] px-2 py-1 rounded">HA: {item.vitalSigns.bp} mmHg</span>
                                                        <span className="text-xs bg-[#f6f7f8] dark:bg-[#13191f] px-2 py-1 rounded">Mạch: {item.vitalSigns.hr} bpm</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div></div>
    );
}
