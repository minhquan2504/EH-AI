"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { emrService } from "@/services/emrService";
import { useAuth } from "@/contexts/AuthContext";
import { AIRecordSummary, AITrendDetector } from "@/components/portal/ai";
import { usePageAIContext } from "@/hooks/usePageAIContext";

const MOCK_TIMELINE = [
    { id: 1, date: "20/02/2025", type: "visit", title: "Khám Tim mạch", doctor: "BS. Trần Văn Minh", department: "Tim mạch", details: "Tăng huyết áp - I10. Điều chỉnh liều thuốc.", vitalSigns: { bp: "140/90", hr: "78" } },
    { id: 2, date: "20/02/2025", type: "lab", title: "Xét nghiệm máu", details: "Glucose: 7.2 mmol/L (cao), HbA1c: 6.8%, Cholesterol: 5.5 mmol/L" },
    { id: 3, date: "15/01/2025", type: "visit", title: "Khám Nội tiết", doctor: "BS. Lê Thị Hoa", department: "Nội tiết", details: "Tiểu đường type 2, kiểm soát tốt", vitalSigns: { bp: "130/85", hr: "72" } },
    { id: 4, date: "15/01/2025", type: "prescription", title: "Đơn thuốc #DT002", details: "Metformin 500mg (2 viên/ngày), Glimepiride 2mg (1 viên/ngày)" },
    { id: 5, date: "10/12/2024", type: "visit", title: "Kiểm tra định kỳ", doctor: "BS. Trần Văn Minh", department: "Tim mạch", details: "Huyết áp ổn định. Duy trì phác đồ hiện tại.", vitalSigns: { bp: "125/80", hr: "70" } },
    { id: 6, date: "10/12/2024", type: "imaging", title: "X-quang ngực", details: "Bóng tim bình thường, phổi sạch, không thấy bất thường." },
    { id: 7, date: "05/11/2024", type: "visit", title: "Khám Nội tổng quát", doctor: "BS. Phạm Chí Thanh", department: "Nội tổng quát", details: "Viêm dạ dày - K29. Kê thuốc điều trị 14 ngày." },
    { id: 8, date: "05/11/2024", type: "prescription", title: "Đơn thuốc #DT003", details: "Omeprazole 20mg (1 viên/sáng trước ăn), Sucralfate 1g (3 viên/ngày)" },
];

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
    usePageAIContext({ pageKey: "medical-records", patientId: "BN001", patientName: "Nguyễn Văn An" });
    const [timeline, setTimeline] = useState(MOCK_TIMELINE);

    useEffect(() => {
        if (!user?.id) return;
        emrService.getList({ doctorId: user.id, limit: 50 })
            .then(res => {
                const items: any[] = res?.data?.data ?? res?.data ?? [];
                if (items.length > 0) {
                    const mapped = items.map((e: any) => ({
                        id: e.id,
                        date: e.visitDate ?? e.createdAt?.split("T")[0] ?? "",
                        type: "visit",
                        title: `Khám ${e.departmentName ?? ""}`,
                        doctor: e.doctorName ?? "",
                        department: e.departmentName ?? "",
                        details: e.diagnosis ?? e.chiefComplaint ?? "",
                        vitalSigns: e.vitalSigns,
                    }));
                    setTimeline(mapped);
                }
            })
            .catch(() => {/* keep mock */});
    }, [user?.id]);

    const filtered = timeline.filter((item) => filterType === "all" || item.type === filterType);

    // Group by date
    const grouped = filtered.reduce((acc, item) => {
        if (!acc[item.date]) acc[item.date] = [];
        acc[item.date].push(item);
        return acc;
    }, {} as Record<string, typeof timeline>);

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
            <div className="flex gap-2 flex-wrap">
                {[{ k: "all", l: "Tất cả" }, ...Object.entries(typeConfig).map(([k, v]) => ({ k, l: v.label }))].map((f) => (
                    <button key={f.k} onClick={() => setFilterType(f.k)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === f.k ? "bg-[#3C81C6] text-white" : "bg-white dark:bg-[#1e242b] text-[#687582] border border-[#dde0e4] dark:border-[#2d353e]"}`}>
                        {f.l}
                    </button>
                ))}
            </div>

            {/* Timeline */}
            <div className="space-y-6">
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
