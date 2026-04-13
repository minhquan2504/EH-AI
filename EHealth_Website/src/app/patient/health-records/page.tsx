"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePageAIContext } from "@/hooks/usePageAIContext";
import type { PatientProfile } from "@/types/patient-profile";
import type { VitalSign, HealthTimelineItem, MedicalHistoryItem, LabResult, Medication } from "@/types/patient-portal";
import { ehrService } from "@/services/ehrService";

const TABS = [
    { id: "overview", label: "Tổng quan", icon: "dashboard" },
    { id: "vitals", label: "Chỉ số sinh hiệu", icon: "monitor_heart" },
    { id: "history", label: "Tiền sử bệnh", icon: "history_edu" },
    { id: "lab", label: "Kết quả CLS", icon: "science" },
    { id: "medications", label: "Thuốc đang dùng", icon: "medication" },
    { id: "timeline", label: "Dòng thời gian", icon: "timeline" },
];

// ─── Adapter: chuyển dữ liệu API sang format UI ──────────────────────────────

function adaptVital(v: any): VitalSign {
    return {
        id: v.id ?? v._id ?? String(Math.random()),
        date: v.date ?? v.measuredAt ?? v.createdAt ?? "",
        bloodPressureSystolic: v.bloodPressureSystolic ?? v.systolic ?? v.bp_systolic ?? 0,
        bloodPressureDiastolic: v.bloodPressureDiastolic ?? v.diastolic ?? v.bp_diastolic ?? 0,
        heartRate: v.heartRate ?? v.heart_rate ?? v.pulse ?? 0,
        temperature: v.temperature ?? v.bodyTemperature ?? 36.5,
        weight: v.weight ?? 0,
        height: v.height ?? 0,
        bmi: v.bmi ?? (v.weight && v.height ? +(v.weight / ((v.height / 100) ** 2)).toFixed(1) : 0),
        bloodSugar: v.bloodSugar ?? v.blood_sugar ?? v.glucose,
        spo2: v.spo2 ?? v.oxygenSaturation ?? v.oxygen_saturation,
    };
}

function adaptTimeline(t: any): HealthTimelineItem {
    const typeMap: Record<string, HealthTimelineItem["type"]> = {
        examination: "examination", lab_result: "lab_result", prescription: "prescription",
        surgery: "surgery", vaccination: "vaccination", vital_check: "vital_check",
        lab: "lab_result", visit: "examination", vaccine: "vaccination",
    };
    return {
        id: t.id ?? t._id ?? String(Math.random()),
        date: t.date ?? t.createdAt ?? "",
        type: typeMap[t.type] ?? "examination",
        title: t.title ?? t.name ?? t.description ?? "Sự kiện sức khoẻ",
        description: t.description ?? t.summary ?? "",
        doctorName: t.doctorName ?? t.doctor_name ?? t.doctor?.name,
        department: t.department ?? t.speciality,
        status: t.status ?? "completed",
        icon: t.icon ?? "health_and_safety",
        color: t.color ?? "text-blue-500 bg-blue-50",
    };
}

function adaptMedHistory(m: any): MedicalHistoryItem {
    const typeMap: Record<string, MedicalHistoryItem["type"]> = {
        chronic: "chronic", allergy: "allergy", surgery: "surgery",
        family: "family", risk_factor: "risk_factor",
        chronic_disease: "chronic", allergic: "allergy",
    };
    return {
        id: m.id ?? m._id ?? String(Math.random()),
        type: typeMap[m.type] ?? "chronic",
        name: m.name ?? m.condition ?? m.diagnosis ?? "",
        details: m.details ?? m.description ?? m.notes ?? "",
        diagnosedDate: m.diagnosedDate ?? m.diagnosed_date ?? m.onset_date,
        status: m.status ?? "active",
    };
}

function adaptLabResult(r: any): LabResult {
    const items = r.results ?? r.items ?? r.parameters ?? [];
    return {
        id: r.id ?? r._id ?? String(Math.random()),
        date: r.date ?? r.performedAt ?? r.createdAt ?? "",
        testName: r.testName ?? r.test_name ?? r.name ?? "Xét nghiệm",
        category: r.category ?? r.type ?? "Xét nghiệm",
        doctorName: r.doctorName ?? r.doctor_name ?? r.doctor?.name ?? "",
        status: r.status ?? "completed",
        results: items.map((i: any) => ({
            name: i.name ?? i.parameter ?? "",
            value: String(i.value ?? ""),
            unit: i.unit ?? "",
            reference: i.reference ?? i.referenceRange ?? i.normal_range ?? "",
            status: i.status ?? (i.isNormal === false ? "high" : "normal"),
        })),
    };
}

function adaptMedication(m: any): Medication {
    return {
        id: m.id ?? m._id ?? String(Math.random()),
        name: m.name ?? m.drugName ?? m.drug_name ?? m.medication ?? "",
        dosage: m.dosage ?? m.dose ?? "",
        frequency: m.frequency ?? m.schedule ?? "",
        startDate: m.startDate ?? m.start_date ?? "",
        endDate: m.endDate ?? m.end_date,
        prescribedBy: m.prescribedBy ?? m.prescribed_by ?? m.doctor?.name ?? "",
        status: m.status ?? "active",
        notes: m.notes ?? m.instructions,
    };
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function Skeleton({ rows = 3 }: { rows?: number }) {
    return (
        <div className="space-y-4 animate-pulse">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                </div>
            ))}
        </div>
    );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] py-16 text-center">
            <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 mb-3" style={{ fontSize: "56px" }}>{icon}</span>
            <p className="text-sm text-[#687582]">{message}</p>
        </div>
    );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function HealthRecordsPage() {
    usePageAIContext({ pageKey: 'health-records' });
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("overview");
    const [selectedProfileId, setSelectedProfileId] = useState(user?.id ?? "");
    const profiles: PatientProfile[] = user ? [{
        id: user.id,
        userId: user.id,
        fullName: user.fullName || "Bệnh nhân",
        dob: "",
        gender: "other",
        phone: user.phone || "",
        relationship: "self",
        relationshipLabel: "Bản thân",
        isActive: true,
        isPrimary: true,
        createdAt: "",
        updatedAt: "",
    }] : [];

    // Track which tabs đã fetch rồi
    const [fetched, setFetched] = useState<Record<string, boolean>>({});

    // ── Data states ────────────────────────────────────────────────────
    const [latestVital, setLatestVital] = useState<VitalSign | null>(null);
    const [vitals, setVitals] = useState<VitalSign[]>([]);
    const [timeline, setTimeline] = useState<HealthTimelineItem[]>([]);
    const [medHistory, setMedHistory] = useState<MedicalHistoryItem[]>([]);
    const [labResults, setLabResults] = useState<LabResult[]>([]);
    const [medications, setMedications] = useState<Medication[]>([]);
    const [allergies, setAllergies] = useState<MedicalHistoryItem[]>([]);

    // ── Loading states per tab ─────────────────────────────────────────
    const [loadingVitals, setLoadingVitals] = useState(false);
    const [loadingTimeline, setLoadingTimeline] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [loadingLab, setLoadingLab] = useState(false);
    const [loadingMeds, setLoadingMeds] = useState(false);
    const [loadingOverview, setLoadingOverview] = useState(false);

    const patientId = user?.id ?? selectedProfileId;

    // ── Fetch functions ────────────────────────────────────────────────

    const fetchOverview = useCallback(async () => {
        if (fetched[`overview_${selectedProfileId}`]) return;
        setLoadingOverview(true);
        try {
            const [profileRes, medsRes, allergiesRes] = await Promise.allSettled([
                ehrService.getHealthProfile(patientId),
                ehrService.getCurrentMedications(patientId),
                ehrService.getAllergies(patientId),
            ]);

            if (medsRes.status === "fulfilled" && medsRes.value.data?.length) {
                setMedications(medsRes.value.data.map(adaptMedication));
            }
            if (allergiesRes.status === "fulfilled" && allergiesRes.value.data?.length) {
                setAllergies(allergiesRes.value.data.map((a: any) => adaptMedHistory({ ...a, type: "allergy" })));
            }
            setFetched(prev => ({ ...prev, [`overview_${selectedProfileId}`]: true }));
        } catch {
            // giữ fallback mock
        } finally {
            setLoadingOverview(false);
        }
    }, [patientId, selectedProfileId, fetched]);

    const fetchVitals = useCallback(async () => {
        if (fetched[`vitals_${selectedProfileId}`]) return;
        setLoadingVitals(true);
        try {
            const [latestRes, historyRes] = await Promise.allSettled([
                ehrService.getVitalLatest(patientId),
                ehrService.getVitalHistoryByProfile(patientId),
            ]);

            if (latestRes.status === "fulfilled" && latestRes.value) {
                setLatestVital(adaptVital(latestRes.value));
            }
            if (historyRes.status === "fulfilled" && historyRes.value.data?.length) {
                setVitals(historyRes.value.data.map(adaptVital));
            }
            setFetched(prev => ({ ...prev, [`vitals_${selectedProfileId}`]: true }));
        } catch {
            // giữ fallback mock
        } finally {
            setLoadingVitals(false);
        }
    }, [patientId, selectedProfileId, fetched]);

    const fetchHistory = useCallback(async () => {
        if (fetched[`history_${selectedProfileId}`]) return;
        setLoadingHistory(true);
        try {
            const res = await ehrService.getMedicalHistoryByProfile(patientId);
            if (res.data?.length) setMedHistory(res.data.map(adaptMedHistory));
            setFetched(prev => ({ ...prev, [`history_${selectedProfileId}`]: true }));
        } catch {
            // giữ fallback mock
        } finally {
            setLoadingHistory(false);
        }
    }, [patientId, selectedProfileId, fetched]);

    const fetchLab = useCallback(async () => {
        if (fetched[`lab_${selectedProfileId}`]) return;
        setLoadingLab(true);
        try {
            const res = await ehrService.getClinicalResults(patientId);
            if (res.data?.length) setLabResults(res.data.map(adaptLabResult));
            setFetched(prev => ({ ...prev, [`lab_${selectedProfileId}`]: true }));
        } catch {
            // giữ fallback mock
        } finally {
            setLoadingLab(false);
        }
    }, [patientId, selectedProfileId, fetched]);

    const fetchMedications = useCallback(async () => {
        if (fetched[`meds_${selectedProfileId}`]) return;
        setLoadingMeds(true);
        try {
            const res = await ehrService.getMedicationTreatments(patientId);
            if (res.data?.length) setMedications(res.data.map(adaptMedication));
            setFetched(prev => ({ ...prev, [`meds_${selectedProfileId}`]: true }));
        } catch {
            // giữ fallback mock
        } finally {
            setLoadingMeds(false);
        }
    }, [patientId, selectedProfileId, fetched]);

    const fetchTimeline = useCallback(async () => {
        if (fetched[`timeline_${selectedProfileId}`]) return;
        setLoadingTimeline(true);
        try {
            const res = await ehrService.getHealthTimeline(patientId);
            if (res.data?.length) setTimeline(res.data.map(adaptTimeline));
            setFetched(prev => ({ ...prev, [`timeline_${selectedProfileId}`]: true }));
        } catch {
            // giữ fallback mock
        } finally {
            setLoadingTimeline(false);
        }
    }, [patientId, selectedProfileId, fetched]);

    // Lazy load khi chuyển tab
    useEffect(() => {
        switch (activeTab) {
            case "overview": fetchOverview(); break;
            case "vitals": fetchVitals(); break;
            case "history": fetchHistory(); break;
            case "lab": fetchLab(); break;
            case "medications": fetchMedications(); break;
            case "timeline": fetchTimeline(); break;
        }
    }, [activeTab, selectedProfileId]);

    // Reset fetched khi đổi profile
    const handleProfileChange = (profileId: string) => {
        setSelectedProfileId(profileId);
        setFetched({});
        setLatestVital(null);
        setVitals([]);
        setTimeline([]);
        setMedHistory([]);
        setLabResults([]);
        setMedications([]);
        setAllergies([]);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#121417] dark:text-white">Hồ sơ sức khỏe điện tử</h1>
                <p className="text-sm text-[#687582] mt-0.5">Theo dõi toàn diện sức khỏe của bạn qua thời gian</p>
                <div className="flex items-center gap-2 mt-3">
                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>person</span>
                    <select value={selectedProfileId} onChange={e => handleProfileChange(e.target.value)}
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
                {activeTab === "overview" && (loadingOverview ? <Skeleton rows={2} /> : <OverviewTab vital={latestVital} allergies={allergies} medications={medications} recentTimeline={timeline} />)}
                {activeTab === "vitals" && (loadingVitals ? <Skeleton rows={2} /> : <VitalsTab vitals={vitals} />)}
                {activeTab === "history" && (loadingHistory ? <Skeleton /> : <MedicalHistoryTab items={medHistory} />)}
                {activeTab === "lab" && (loadingLab ? <Skeleton /> : <LabResultsTab results={labResults} />)}
                {activeTab === "medications" && (loadingMeds ? <Skeleton /> : <MedicationsTab medications={medications} />)}
                {activeTab === "timeline" && (loadingTimeline ? <Skeleton /> : <TimelineTab items={timeline} />)}
            </div>
        </div>
    );
}

// ─── Tab Components ───────────────────────────────────────────────────────────

function OverviewTab({
    vital, allergies, medications, recentTimeline
}: {
    vital: VitalSign | null;
    allergies: MedicalHistoryItem[];
    medications: Medication[];
    recentTimeline: HealthTimelineItem[];
}) {
    const healthCards = [
        { label: "Huyết áp", value: vital ? `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}` : "—", unit: "mmHg", icon: "bloodtype", color: "from-red-500 to-rose-600", ok: !vital || vital.bloodPressureSystolic <= 130 },
        { label: "Nhịp tim", value: vital ? `${vital.heartRate}` : "—", unit: "bpm", icon: "cardiology", color: "from-pink-500 to-red-500", ok: true },
        { label: "BMI", value: vital ? vital.bmi.toFixed(1) : "—", unit: "", icon: "monitor_weight", color: "from-blue-500 to-indigo-600", ok: !vital || (vital.bmi >= 18.5 && vital.bmi <= 25) },
        { label: "SpO2", value: vital ? `${vital.spo2 || "—"}` : "—", unit: "%", icon: "pulmonology", color: "from-cyan-500 to-teal-600", ok: true },
        { label: "Đường huyết", value: vital ? `${vital.bloodSugar || "—"}` : "—", unit: "mg/dL", icon: "water_drop", color: "from-amber-500 to-orange-500", ok: true },
        { label: "Nhiệt độ", value: vital ? vital.temperature.toFixed(1) : "—", unit: "°C", icon: "thermostat", color: "from-green-500 to-emerald-600", ok: true },
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
                    {allergies.length === 0 ? (
                        <p className="text-xs text-[#687582]">Không có thông tin dị ứng</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {allergies.map(a => (
                                <span key={a.id} className="px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-semibold rounded-lg border border-red-100 dark:border-red-500/20">{a.name}</span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5">
                    <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-green-500" style={{ fontSize: "20px" }}>medication</span>Thuốc đang dùng
                    </h3>
                    {medications.filter(m => m.status === "active").length === 0 ? (
                        <p className="text-xs text-[#687582]">Không có thuốc đang dùng</p>
                    ) : (
                        <div className="space-y-2">
                            {medications.filter(m => m.status === "active").map(m => (
                                <div key={m.id} className="flex items-center gap-2 p-2 bg-[#f6f7f8] dark:bg-[#13191f] rounded-lg">
                                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "16px" }}>pill</span>
                                    <div><p className="text-sm font-semibold text-[#121417] dark:text-white">{m.name}</p><p className="text-xs text-[#687582]">{m.frequency}</p></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5">
                <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "20px" }}>timeline</span>Hoạt động gần đây
                </h3>
                {recentTimeline.length === 0 ? (
                    <p className="text-xs text-[#687582] text-center py-4">Chưa có hoạt động nào</p>
                ) : (
                    <div className="space-y-3">
                        {recentTimeline.slice(0, 4).map(item => (
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
                )}
            </div>
        </div>
    );
}

function TimelineTab({ items }: { items: HealthTimelineItem[] }) {
    if (items.length === 0) return <EmptyState icon="timeline" message="Chưa có dữ liệu dòng thời gian" />;
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
                                        {item.doctorName && <p className="text-xs text-[#687582] mt-1">BS. {item.doctorName}{item.department && ` • ${item.department}`}</p>}
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
    if (items.length === 0) return <EmptyState icon="history_edu" message="Chưa có tiền sử bệnh" />;
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
                                        {item.diagnosedDate && <p className="text-xs text-[#687582]/70 mt-1">Phát hiện: {item.diagnosedDate}</p>}
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
    if (results.length === 0) return <EmptyState icon="science" message="Chưa có kết quả xét nghiệm" />;
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
                                    <span>{result.date}</span>
                                    {result.doctorName && <span>BS. {result.doctorName}</span>}
                                    <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 rounded-md font-medium">{result.category}</span>
                                </div>
                            </div>
                        </div>
                        <span className={`material-symbols-outlined text-[#687582] transition-transform ${expandedId === result.id ? "rotate-180" : ""}`} style={{ fontSize: "20px" }}>expand_more</span>
                    </button>
                    {expandedId === result.id && result.results.length > 0 && (
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
    if (medications.length === 0) return <EmptyState icon="medication" message="Chưa có thông tin thuốc" />;
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-green-500" style={{ fontSize: "20px" }}>medication</span>Đang sử dụng ({active.length})
                </h3>
                {active.length === 0 ? (
                    <p className="text-xs text-[#687582]">Không có thuốc đang sử dụng</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {active.map(m => (
                            <div key={m.id} className="bg-white dark:bg-[#1e242b] rounded-2xl border-2 border-green-200 dark:border-green-500/20 p-5">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center"><span className="material-symbols-outlined text-green-600" style={{ fontSize: "22px" }}>pill</span></div>
                                    <div>
                                        <h4 className="text-sm font-bold text-[#121417] dark:text-white">{m.name}</h4>
                                        <p className="text-xs text-green-700 dark:text-green-400 font-medium mt-0.5">{m.frequency}</p>
                                        <p className="text-xs text-[#687582] mt-1">Từ {m.startDate}{m.prescribedBy && ` • BS. ${m.prescribedBy}`}</p>
                                        {m.notes && <p className="text-xs text-[#687582] mt-1 italic">{m.notes}</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {done.length > 0 && (
                <div>
                    <h3 className="text-sm font-bold text-[#687582] flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>history</span>Đã hoàn thành ({done.length})
                    </h3>
                    {done.map(m => (
                        <div key={m.id} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-4 opacity-70 flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-[#687582]" style={{ fontSize: "20px" }}>pill</span>
                            <div className="flex-1"><p className="text-sm font-semibold text-[#121417] dark:text-white">{m.name}</p><p className="text-xs text-[#687582]">{m.startDate}{m.endDate ? ` → ${m.endDate}` : ""}{m.prescribedBy ? ` • ${m.prescribedBy}` : ""}</p></div>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 dark:bg-gray-700 text-[#687582]">Hoàn thành</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function VitalsTab({ vitals }: { vitals: VitalSign[] }) {
    if (vitals.length === 0) return <EmptyState icon="monitor_heart" message="Chưa có dữ liệu sinh hiệu" />;
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
                                <td className="py-3 text-center text-[#121417] dark:text-white">{v.spo2 ?? "—"}%</td>
                                <td className="py-3 text-center text-[#121417] dark:text-white">{v.weight ? `${v.weight}kg` : "—"}</td>
                                <td className="py-3 text-center text-[#121417] dark:text-white">{v.bmi ? v.bmi.toFixed(1) : "—"}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
