"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePageAIContext } from "@/hooks/usePageAIContext";
import { MOCK_PATIENT_PROFILES, getProfilesByUserId, type PatientProfile } from "@/data/patient-profiles-mock";
import {
    MOCK_VITAL_SIGNS, MOCK_HEALTH_TIMELINE, MOCK_MEDICAL_HISTORY,
    MOCK_LAB_RESULTS, MOCK_MEDICATIONS,
    type VitalSign, type HealthTimelineItem, type MedicalHistoryItem, type LabResult, type Medication,
} from "@/data/patient-portal-mock";

const TABS = [
    { id: "overview", label: "Tổng quan", icon: "dashboard" },
    { id: "timeline", label: "Dòng thời gian", icon: "timeline" },
    { id: "history", label: "Tiền sử bệnh", icon: "history_edu" },
    { id: "lab", label: "Kết quả CLS", icon: "science" },
    { id: "medications", label: "Thuốc đang dùng", icon: "medication" },
    { id: "vitals", label: "Chỉ số sinh hiệu", icon: "monitor_heart" },
];

export default function HealthRecordsPage() {
    usePageAIContext({ pageKey: 'health-records' });
    const [activeTab, setActiveTab] = useState("overview");
    const [selectedProfileId, setSelectedProfileId] = useState("pp-001");
    const profiles = getProfilesByUserId("patient-001");
    const latestVital = MOCK_VITAL_SIGNS[0];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#121417] dark:text-white">Hồ sơ sức khỏe điện tử</h1>
                <p className="text-sm text-[#687582] mt-0.5">Theo dõi toàn diện sức khỏe của bạn qua thời gian</p>
                <div className="flex items-center gap-2 mt-3">
                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>person</span>
                    <select value={selectedProfileId} onChange={e => setSelectedProfileId(e.target.value)}
                        className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-[#1e242b] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 font-medium">
                        {profiles.map(p => <option key={p.id} value={p.id}>{p.fullName} — {p.relationshipLabel}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                        ${activeTab === tab.id ? "bg-[#3C81C6] text-white shadow-sm shadow-[#3C81C6]/20" : "bg-white dark:bg-[#1e242b] text-[#687582] hover:bg-gray-50 dark:hover:bg-[#252d36] border border-[#e5e7eb] dark:border-[#2d353e]"}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div>
                {activeTab === "overview" && <OverviewTab vital={latestVital} />}
                {activeTab === "timeline" && <TimelineTab items={MOCK_HEALTH_TIMELINE} />}
                {activeTab === "history" && <MedicalHistoryTab items={MOCK_MEDICAL_HISTORY} />}
                {activeTab === "lab" && <LabResultsTab results={MOCK_LAB_RESULTS} />}
                {activeTab === "medications" && <MedicationsTab medications={MOCK_MEDICATIONS} />}
                {activeTab === "vitals" && <VitalsTab vitals={MOCK_VITAL_SIGNS} />}
            </div>
        </div>
    );
}

function OverviewTab({ vital }: { vital: VitalSign }) {
    const healthCards = [
        { label: "Huyết áp", value: `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}`, unit: "mmHg", icon: "bloodtype", color: "from-red-500 to-rose-600", ok: vital.bloodPressureSystolic <= 130 },
        { label: "Nhịp tim", value: `${vital.heartRate}`, unit: "bpm", icon: "cardiology", color: "from-pink-500 to-red-500", ok: true },
        { label: "BMI", value: vital.bmi.toFixed(1), unit: "", icon: "monitor_weight", color: "from-blue-500 to-indigo-600", ok: vital.bmi >= 18.5 && vital.bmi <= 25 },
        { label: "SpO2", value: `${vital.spo2 || 98}`, unit: "%", icon: "pulmonology", color: "from-cyan-500 to-teal-600", ok: true },
        { label: "Đường huyết", value: `${vital.bloodSugar || 95}`, unit: "mg/dL", icon: "water_drop", color: "from-amber-500 to-orange-500", ok: true },
        { label: "Nhiệt độ", value: vital.temperature.toFixed(1), unit: "°C", icon: "thermostat", color: "from-green-500 to-emerald-600", ok: true },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {healthCards.map(c => (
                    <div key={c.label} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5 hover:shadow-lg hover:border-[#3C81C6]/20 transition-all">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center shadow-lg`}>
                                <span className="material-symbols-outlined text-white" style={{ fontSize: "20px" }}>{c.icon}</span>
                            </div>
                            <span className="text-xs font-semibold text-[#687582] uppercase tracking-wider">{c.label}</span>
                        </div>
                        <div className="flex items-end gap-1.5">
                            <span className="text-2xl font-bold text-[#121417] dark:text-white">{c.value}</span>
                            {c.unit && <span className="text-sm text-[#687582] mb-0.5">{c.unit}</span>}
                        </div>
                        <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.ok ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400" : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>{c.ok ? "check_circle" : "warning"}</span>
                            {c.ok ? "Bình thường" : "Cao nhẹ"}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5">
                    <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-red-500" style={{ fontSize: "20px" }}>warning</span>Dị ứng
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {MOCK_MEDICAL_HISTORY.filter(h => h.type === "allergy").map(a => (
                            <span key={a.id} className="px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-semibold rounded-lg border border-red-100 dark:border-red-500/20">{a.name}</span>
                        ))}
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5">
                    <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-green-500" style={{ fontSize: "20px" }}>medication</span>Thuốc đang dùng
                    </h3>
                    <div className="space-y-2">
                        {MOCK_MEDICATIONS.filter(m => m.status === "active").map(m => (
                            <div key={m.id} className="flex items-center gap-2 p-2 bg-[#f6f7f8] dark:bg-[#13191f] rounded-lg">
                                <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "16px" }}>pill</span>
                                <div><p className="text-sm font-semibold text-[#121417] dark:text-white">{m.name}</p><p className="text-xs text-[#687582]">{m.frequency}</p></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5">
                <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "20px" }}>timeline</span>Hoạt động gần đây
                </h3>
                <div className="space-y-3">
                    {MOCK_HEALTH_TIMELINE.slice(0, 4).map(item => (
                        <div key={item.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#f6f7f8] dark:hover:bg-[#13191f] transition-colors">
                            <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0`}>
                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{item.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[#121417] dark:text-white truncate">{item.title}</p>
                                <p className="text-xs text-[#687582] truncate">{item.description}</p>
                            </div>
                            <span className="text-xs text-[#687582] whitespace-nowrap">{item.date}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function TimelineTab({ items }: { items: HealthTimelineItem[] }) {
    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-6">
            <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-6">Dòng thời gian sức khỏe</h3>
            <div className="relative">
                <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-[#e5e7eb] dark:bg-[#2d353e]" />
                <div className="space-y-6">
                    {items.map(item => (
                        <div key={item.id} className="relative flex gap-4">
                            <div className={`relative z-10 w-9 h-9 rounded-full ${item.color} flex items-center justify-center flex-shrink-0 ring-4 ring-white dark:ring-[#1e242b]`}>
                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{item.icon}</span>
                            </div>
                            <div className="flex-1 pb-6">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h4 className="text-sm font-bold text-[#121417] dark:text-white">{item.title}</h4>
                                        <p className="text-xs text-[#687582] mt-0.5">{item.description}</p>
                                        {item.doctorName && <p className="text-xs text-[#687582] mt-1">👨‍⚕️ {item.doctorName}{item.department && ` • ${item.department}`}</p>}
                                    </div>
                                    <span className="text-xs text-[#687582] whitespace-nowrap bg-[#f6f7f8] dark:bg-[#13191f] px-2 py-1 rounded-md">{item.date}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function MedicalHistoryTab({ items }: { items: MedicalHistoryItem[] }) {
    const cfg: Record<string, { label: string; icon: string; color: string }> = {
        chronic: { label: "Bệnh mãn tính", icon: "medical_information", color: "text-red-500 bg-red-50 dark:bg-red-500/10" },
        allergy: { label: "Dị ứng", icon: "warning", color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10" },
        surgery: { label: "Phẫu thuật", icon: "surgical", color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10" },
        family: { label: "Tiền sử gia đình", icon: "group", color: "text-purple-500 bg-purple-50 dark:bg-purple-500/10" },
        risk_factor: { label: "Yếu tố nguy cơ", icon: "report", color: "text-orange-500 bg-orange-50 dark:bg-orange-500/10" },
    };
    const grouped = items.reduce((acc, item) => { (acc[item.type] ||= []).push(item); return acc; }, {} as Record<string, MedicalHistoryItem[]>);

    return (
        <div className="space-y-4">
            {Object.entries(grouped).map(([type, group]) => {
                const c = cfg[type] || { label: type, icon: "info", color: "text-gray-500 bg-gray-50" };
                return (
                    <div key={type} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5">
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-4">
                            <div className={`w-8 h-8 rounded-lg ${c.color} flex items-center justify-center`}>
                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{c.icon}</span>
                            </div>
                            {c.label}
                            <span className="ml-auto text-xs bg-[#f6f7f8] dark:bg-[#13191f] text-[#687582] px-2 py-0.5 rounded-full">{group.length}</span>
                        </h3>
                        <div className="space-y-3">
                            {group.map(item => (
                                <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-[#f6f7f8] dark:bg-[#13191f]">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-[#121417] dark:text-white">{item.name}</p>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${item.status === "active" ? "bg-red-100 dark:bg-red-500/10 text-red-600" : item.status === "resolved" ? "bg-green-100 dark:bg-green-500/10 text-green-600" : "bg-blue-100 dark:bg-blue-500/10 text-blue-600"}`}>
                                                {item.status === "active" ? "Hoạt động" : item.status === "resolved" ? "Đã xử lý" : "Theo dõi"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-[#687582] mt-1">{item.details}</p>
                                        {item.diagnosedDate && <p className="text-xs text-[#687582]/70 mt-1">📅 Phát hiện: {item.diagnosedDate}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function LabResultsTab({ results }: { results: LabResult[] }) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    return (
        <div className="space-y-4">
            {results.map(result => (
                <div key={result.id} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] overflow-hidden">
                    <button onClick={() => setExpandedId(expandedId === result.id ? null : result.id)}
                        className="w-full flex items-center justify-between p-5 hover:bg-[#f6f7f8] dark:hover:bg-[#13191f] transition-colors text-left">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-purple-500" style={{ fontSize: "22px" }}>science</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-[#121417] dark:text-white">{result.testName}</h4>
                                <div className="flex items-center gap-3 text-xs text-[#687582] mt-0.5">
                                    <span>📅 {result.date}</span><span>👨‍⚕️ {result.doctorName}</span>
                                    <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 rounded-md font-medium">{result.category}</span>
                                </div>
                            </div>
                        </div>
                        <span className={`material-symbols-outlined text-[#687582] transition-transform ${expandedId === result.id ? "rotate-180" : ""}`} style={{ fontSize: "20px" }}>expand_more</span>
                    </button>
                    {expandedId === result.id && (
                        <div className="px-5 pb-5 border-t border-[#e5e7eb] dark:border-[#2d353e]">
                            <table className="w-full mt-4 text-sm">
                                <thead><tr className="text-xs font-semibold text-[#687582] uppercase">
                                    <th className="text-left py-2">Chỉ số</th><th className="text-center py-2">Kết quả</th><th className="text-center py-2">Đ.vị</th><th className="text-center py-2">Tham chiếu</th><th className="text-right py-2">Đánh giá</th>
                                </tr></thead>
                                <tbody>{result.results.map((r, i) => (
                                    <tr key={i} className="border-t border-[#e5e7eb]/50 dark:border-[#2d353e]/50">
                                        <td className="py-2.5 font-medium text-[#121417] dark:text-white">{r.name}</td>
                                        <td className={`py-2.5 text-center font-bold ${r.status === "normal" ? "text-green-600" : "text-red-600"}`}>{r.value}</td>
                                        <td className="py-2.5 text-xs text-[#687582] text-center">{r.unit}</td>
                                        <td className="py-2.5 text-xs text-[#687582] text-center">{r.reference}</td>
                                        <td className="py-2.5 text-right">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === "normal" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                {r.status === "normal" ? "BT" : "Cao"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function MedicationsTab({ medications }: { medications: Medication[] }) {
    const active = medications.filter(m => m.status === "active");
    const done = medications.filter(m => m.status !== "active");
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-green-500" style={{ fontSize: "20px" }}>medication</span>Đang sử dụng ({active.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {active.map(m => (
                        <div key={m.id} className="bg-white dark:bg-[#1e242b] rounded-2xl border-2 border-green-200 dark:border-green-500/20 p-5">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center"><span className="material-symbols-outlined text-green-600" style={{ fontSize: "22px" }}>pill</span></div>
                                <div>
                                    <h4 className="text-sm font-bold text-[#121417] dark:text-white">{m.name}</h4>
                                    <p className="text-xs text-green-700 dark:text-green-400 font-medium mt-0.5">{m.frequency}</p>
                                    <p className="text-xs text-[#687582] mt-1">📅 Từ {m.startDate} • 👨‍⚕️ {m.prescribedBy}</p>
                                    {m.notes && <p className="text-xs text-[#687582] mt-1 italic">{m.notes}</p>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {done.length > 0 && (
                <div>
                    <h3 className="text-sm font-bold text-[#687582] flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>history</span>Đã hoàn thành ({done.length})
                    </h3>
                    {done.map(m => (
                        <div key={m.id} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-4 opacity-70 flex items-center gap-3">
                            <span className="material-symbols-outlined text-[#687582]" style={{ fontSize: "20px" }}>pill</span>
                            <div className="flex-1"><p className="text-sm font-semibold text-[#121417] dark:text-white">{m.name}</p><p className="text-xs text-[#687582]">{m.startDate} → {m.endDate} • {m.prescribedBy}</p></div>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 dark:bg-gray-700 text-[#687582]">Hoàn thành</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function VitalsTab({ vitals }: { vitals: VitalSign[] }) {
    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-6">
                <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-5">
                    <span className="material-symbols-outlined text-red-500" style={{ fontSize: "20px" }}>bloodtype</span>Biểu đồ huyết áp
                </h3>
                <div className="flex items-end gap-3 h-40">
                    {vitals.slice().reverse().map(v => (
                        <div key={v.id} className="flex-1 flex flex-col items-center gap-1 group">
                            <div className="flex gap-1 items-end w-full justify-center" style={{ height: "120px" }}>
                                <div className="w-3 bg-gradient-to-t from-red-500 to-rose-400 rounded-t-md" style={{ height: `${(v.bloodPressureSystolic / 160) * 100}%` }} />
                                <div className="w-3 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-md" style={{ height: `${(v.bloodPressureDiastolic / 160) * 100}%` }} />
                            </div>
                            <span className="text-[10px] text-[#687582]">{v.date.slice(5)}</span>
                        </div>
                    ))}
                </div>
                <div className="flex justify-center gap-6 mt-4 text-xs text-[#687582]">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gradient-to-r from-red-500 to-rose-400" />Tâm thu</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gradient-to-r from-blue-500 to-cyan-400" />Tâm trương</span>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-6">
                <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "20px" }}>table_chart</span>Lịch sử đo chi tiết
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="text-xs font-semibold text-[#687582] uppercase border-b border-[#e5e7eb] dark:border-[#2d353e]">
                            <th className="text-left py-3">Ngày</th><th className="text-center py-3">HA</th><th className="text-center py-3">Nhịp tim</th><th className="text-center py-3">SpO2</th><th className="text-center py-3">Cân nặng</th><th className="text-center py-3">BMI</th>
                        </tr></thead>
                        <tbody>{vitals.map(v => (
                            <tr key={v.id} className="border-b border-[#e5e7eb]/50 dark:border-[#2d353e]/50 hover:bg-[#f6f7f8] dark:hover:bg-[#13191f]">
                                <td className="py-3 font-medium text-[#121417] dark:text-white">{v.date}</td>
                                <td className={`py-3 text-center ${v.bloodPressureSystolic > 130 ? "text-red-600 font-bold" : "text-[#121417] dark:text-white"}`}>{v.bloodPressureSystolic}/{v.bloodPressureDiastolic}</td>
                                <td className="py-3 text-center text-[#121417] dark:text-white">{v.heartRate}</td>
                                <td className="py-3 text-center text-[#121417] dark:text-white">{v.spo2}%</td>
                                <td className="py-3 text-center text-[#121417] dark:text-white">{v.weight}kg</td>
                                <td className="py-3 text-center text-[#121417] dark:text-white">{v.bmi.toFixed(1)}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
