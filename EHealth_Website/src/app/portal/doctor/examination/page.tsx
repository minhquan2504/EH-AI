"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MOCK_PATIENT_QUEUE } from "@/lib/mock-data/doctor";
import { emrService } from "@/services/emrService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { validateBloodPressure, validateVitalSign } from "@/utils/validation";
import { AIVitalAlertBanner, AISymptomAnalyzer, AIDrugIntelligence, AIExaminationSummary } from "@/components/portal/ai";
import AISimilarCases from "@/components/portal/ai/AISimilarCases";
import type { AIAuditEntry } from "@/types";
import { usePageAIContext } from "@/hooks/usePageAIContext";
import { useAIAmbientEngine } from "@/hooks/useAIAmbientEngine";

/* ──────── Steps Config ──────── */
const STEPS = [
    { key: "vitals", label: "Sinh hiệu", icon: "monitor_heart" },
    { key: "symptoms", label: "Triệu chứng", icon: "symptoms" },
    { key: "lab", label: "Xét nghiệm", icon: "biotech" },
    { key: "diagnosis", label: "Chẩn đoán", icon: "diagnosis" },
    { key: "prescription", label: "Đơn thuốc", icon: "medication" },
    { key: "summary", label: "Kết luận", icon: "task_alt" },
] as const;

const VITAL_FIELDS = [
    { key: "bloodPressure", label: "Huyết áp", unit: "mmHg", icon: "bloodtype", placeholder: "120/80", color: "text-red-500" },
    { key: "heartRate", label: "Nhịp tim", unit: "bpm", icon: "monitor_heart", placeholder: "80", color: "text-pink-500" },
    { key: "temperature", label: "Nhiệt độ", unit: "°C", icon: "thermostat", placeholder: "36.5", color: "text-orange-500" },
    { key: "spO2", label: "SpO₂", unit: "%", icon: "spo2", placeholder: "98", color: "text-blue-500" },
    { key: "respiratoryRate", label: "Nhịp thở", unit: "/phút", icon: "pulmonology", placeholder: "18", color: "text-teal-500" },
    { key: "weight", label: "Cân nặng", unit: "kg", icon: "fitness_center", placeholder: "70", color: "text-indigo-500" },
    { key: "height", label: "Chiều cao", unit: "cm", icon: "height", placeholder: "170", color: "text-violet-500" },
] as const;

const LAB_TESTS = [
    { id: "blood", name: "Xét nghiệm máu tổng quát (CBC)", category: "Máu", icon: "bloodtype" },
    { id: "biochem", name: "Sinh hoá máu (Glucose, Lipid, Gan, Thận)", category: "Máu", icon: "science" },
    { id: "urine", name: "Tổng phân tích nước tiểu", category: "Nước tiểu", icon: "water_drop" },
    { id: "xray", name: "X-quang ngực thẳng", category: "Hình ảnh", icon: "radiology" },
    { id: "ultrasound", name: "Siêu âm bụng tổng quát", category: "Hình ảnh", icon: "ecg" },
    { id: "ecg", name: "Điện tâm đồ (ECG)", category: "Tim mạch", icon: "monitor_heart" },
    { id: "echo", name: "Siêu âm tim", category: "Tim mạch", icon: "cardiology" },
    { id: "ct", name: "CT Scan", category: "Hình ảnh", icon: "scanner" },
];

const PAIN_LOCATIONS = ["Đầu", "Ngực", "Bụng", "Lưng", "Tay", "Chân", "Khớp", "Cổ", "Họng", "Toàn thân"];

/* ──────── Component ──────── */
export default function ExaminationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const patientId = searchParams.get("patient");
    const appointmentId = searchParams.get("appointment");
    const { user } = useAuth();
    const toast = useToast();

    // Try real API first, fall back to mock
    const [patient, setPatient] = useState<typeof MOCK_PATIENT_QUEUE[0] | null>(() => {
        if (!patientId) return null;
        return MOCK_PATIENT_QUEUE.find(p => p.id === patientId) || null;
    });
    const [emrId, setEmrId] = useState<string | null>(null);

    const [activeStep, setActiveStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [vitalErrors, setVitalErrors] = useState<Record<string, string>>({});

    // Form state
    const [vitals, setVitals] = useState({
        bloodPressure: "", heartRate: "", temperature: "",
        weight: "", height: "", spO2: "", respiratoryRate: "",
    });
    const [symptoms, setSymptoms] = useState("");
    const [painLevel, setPainLevel] = useState(0);
    const [painLocations, setPainLocations] = useState<string[]>([]);
    const [onsetTime, setOnsetTime] = useState("");
    const [selectedLabs, setSelectedLabs] = useState<string[]>([]);
    const [labNote, setLabNote] = useState("");
    const [labResults, setLabResults] = useState<Record<string, string>>({});
    const [diagnosis, setDiagnosis] = useState("");
    const [icdCode, setIcdCode] = useState("");
    const [treatment, setTreatment] = useState("");
    const [meds, setMeds] = useState<{ name: string; dosage: string; frequency: string; duration: string; note: string }[]>([]);
    const [newMed, setNewMed] = useState({ name: "", dosage: "", frequency: "", duration: "", note: "" });
    const [followUp, setFollowUp] = useState("");
    const [doctorNote, setDoctorNote] = useState("");
    const [sendToPharmacy, setSendToPharmacy] = useState(false);

    // AI state
    const [aiAuditEntries, setAiAuditEntries] = useState<AIAuditEntry[]>([]);
    const [aiSuggestedLabs, setAiSuggestedLabs] = useState<string[]>([]);

    const addAuditEntry = (step: string, aiAction: string, doctorResponse: AIAuditEntry["doctorResponse"]) => {
        setAiAuditEntries(prev => [...prev, {
            timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
            step, aiAction, doctorResponse, citations: [],
        }]);
    };

    const handleAIDiagnosisSelect = (icdCodeVal: string, description: string) => {
        setIcdCode(icdCodeVal);
        setDiagnosis(description);
        addAuditEntry("Triệu chứng", `AI gợi ý chẩn đoán: ${description} (${icdCodeVal})`, "accepted");
    };

    const handleAISuggestLabs = (labIds: string[]) => {
        setAiSuggestedLabs(labIds);
        setSelectedLabs(prev => Array.from(new Set([...prev, ...labIds])));
        addAuditEntry("Triệu chứng", `AI gợi ý ${labIds.length} xét nghiệm`, "accepted");
    };

    const handleAISummaryGenerated = (summary: string) => {
        setDoctorNote(summary);
        addAuditEntry("Kết luận", "AI tạo tóm tắt SOAP", "accepted");
    };

    // AI Copilot context — push state to copilot sidebar
    const { updateContext, registerAutoFill: regAutoFill } = usePageAIContext({
        pageKey: "examination",
        patientId: patientId || undefined,
        patientName: patient?.fullName,
        currentStep: STEPS[0].key,
    });

    // Ambient engine: proactively watches vitals/symptoms and pushes AI alerts
    useAIAmbientEngine();

    // Push form data changes to copilot (debounced)
    useEffect(() => {
        const t = setTimeout(() => {
            updateContext({
                currentStep: STEPS[activeStep].key,
                formData: { vitals, symptoms, diagnosis, icdCode, meds: meds.map(m => m.name) },
                patientId: patientId || undefined,
                patientName: patient?.fullName,
            });
        }, 400);
        return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeStep, vitals, symptoms, diagnosis, icdCode, meds.length]);

    // Register auto-fill callback for copilot
    useEffect(() => {
        return regAutoFill((fields) => {
            if (fields.diagnosis) setDiagnosis(fields.diagnosis as string);
            if (fields.icdCode) setIcdCode(fields.icdCode as string);
            if (fields.treatment) setTreatment(fields.treatment as string);
            if (fields.selectedLabs && Array.isArray(fields.selectedLabs)) {
                setSelectedLabs(prev => Array.from(new Set([...prev, ...(fields.selectedLabs as string[])])));
            }
            if (fields.doctorNote) setDoctorNote(fields.doctorNote as string);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Computed
    const bmi = useMemo(() => {
        const w = parseFloat(vitals.weight);
        const h = parseFloat(vitals.height) / 100;
        return w && h ? (w / (h * h)).toFixed(1) : "—";
    }, [vitals.weight, vitals.height]);

    const canProceed = useMemo(() => {
        switch (activeStep) {
            case 0: {
                if (!vitals.bloodPressure || !vitals.heartRate || !vitals.temperature) return false;
                if (!validateBloodPressure(vitals.bloodPressure).valid) return false;
                if (!validateVitalSign(vitals.heartRate, "heartRate").valid) return false;
                if (!validateVitalSign(vitals.temperature, "temperature").valid) return false;
                if (vitals.spO2 && !validateVitalSign(vitals.spO2, "spO2").valid) return false;
                if (vitals.respiratoryRate && !validateVitalSign(vitals.respiratoryRate, "respiratoryRate").valid) return false;
                if (vitals.weight && !validateVitalSign(vitals.weight, "weight").valid) return false;
                if (vitals.height && !validateVitalSign(vitals.height, "height").valid) return false;
                return true;
            }
            case 1: return symptoms.trim().length > 0;
            case 2: return true; // Lab is optional
            case 3: return diagnosis.trim().length > 0;
            case 4: return true;
            case 5: return true;
            default: return true;
        }
    }, [activeStep, vitals, symptoms, diagnosis]);

    // Handlers
    const addMed = () => {
        if (!newMed.name.trim()) return;
        setMeds(prev => [...prev, { ...newMed }]);
        setNewMed({ name: "", dosage: "", frequency: "", duration: "", note: "" });
    };
    const removeMed = (idx: number) => setMeds(prev => prev.filter((_, i) => i !== idx));
    const goNext = () => { if (canProceed && activeStep < STEPS.length - 1) setActiveStep(prev => prev + 1); };
    const goBack = () => { if (activeStep > 0) setActiveStep(prev => prev - 1); };

    const toggleLab = (labId: string) => {
        setSelectedLabs(prev => prev.includes(labId) ? prev.filter(l => l !== labId) : [...prev, labId]);
    };

    const togglePainLocation = (loc: string) => {
        setPainLocations(prev => prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]);
    };

    const buildEmrPayload = () => ({
        patientId,
        appointmentId,
        doctorId: user?.id,
        vitalSigns: vitals,
        chiefComplaint: symptoms,
        painLevel,
        painLocations,
        onsetTime,
        labTests: selectedLabs,
        labNote,
        labResults,
        diagnosis,
        icdCode,
        treatment,
        prescriptions: meds,
        followUpDate: followUp,
        doctorNote,
        sendToPharmacy,
    });

    const handleSaveDraft = async () => {
        setSaving(true);
        try {
            const payload = buildEmrPayload();
            if (emrId) {
                await emrService.saveDraft(emrId, payload);
            } else {
                const res = await emrService.create({ ...payload, status: "DRAFT" });
                if (res?.data?.id) setEmrId(res.data.id);
            }
            toast.success("Đã lưu nháp thành công!");
        } catch {
            // API thất bại — giữ nguyên dữ liệu local, không báo sai
        } finally {
            setSaving(false);
        }
    };

    const handleComplete = async () => {
        if (!confirm("Xác nhận hoàn thành khám bệnh và ký kết quả?")) return;
        setSaving(true);
        try {
            const payload = buildEmrPayload();
            let currentEmrId = emrId;
            if (!currentEmrId) {
                const res = await emrService.create({ ...payload, status: "COMPLETED" });
                currentEmrId = res?.data?.id || null;
                if (currentEmrId) setEmrId(currentEmrId);
            } else {
                await emrService.update(currentEmrId, { ...payload, status: "COMPLETED" });
            }
            if (currentEmrId) {
                await emrService.sign(currentEmrId);
                if (sendToPharmacy && meds.length > 0) {
                    await emrService.createPrescription({
                        emrId: currentEmrId,
                        patientId,
                        doctorId: user?.id,
                        items: meds,
                    });
                }
            }
            if (sendToPharmacy && meds.length > 0) {
                toast.success("Đã hoàn thành khám bệnh và gửi đơn thuốc đến quầy dược!");
            } else {
                toast.success("Đã hoàn thành khám bệnh!");
            }
            router.push("/portal/doctor/queue");
        } catch {
            toast.error("Có lỗi khi lưu kết quả khám. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    const handleExit = () => {
        if (confirm("Bạn muốn thoát? Dữ liệu chưa lưu sẽ bị mất.")) {
            router.push("/portal/doctor/queue");
        }
    };

    const simulateLabResults = () => {
        const mockResults: Record<string, string> = {};
        selectedLabs.forEach(labId => {
            switch (labId) {
                case "blood": mockResults[labId] = "WBC: 7.2 K/µL | RBC: 4.8 M/µL | Hb: 14.5 g/dL | Plt: 250 K/µL — Bình thường"; break;
                case "biochem": mockResults[labId] = "Glucose: 95 mg/dL | Cholesterol: 210 mg/dL | ALT: 25 U/L | Creatinine: 0.9 mg/dL"; break;
                case "urine": mockResults[labId] = "pH: 6.0 | Protein: (-) | Glucose: (-) | WBC: 2-3 — Bình thường"; break;
                case "xray": mockResults[labId] = "Phổi sáng, bóng tim trong giới hạn, không thấy tổn thương."; break;
                case "ecg": mockResults[labId] = "Nhịp xoang đều, tần số 78 lần/phút, trục trung gian, không ST chênh."; break;
                default: mockResults[labId] = "Kết quả trong giới hạn bình thường."; break;
            }
        });
        setLabResults(mockResults);
    };

    if (!patient) {
        return (
            <div className="p-6 md:p-8">
                <div className="max-w-2xl mx-auto text-center py-20">
                    <div className="w-20 h-20 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-5">
                        <span className="material-symbols-outlined text-orange-500 text-4xl">person_off</span>
                    </div>
                    <h1 className="text-xl font-bold text-[#121417] dark:text-white mb-2">Chưa chọn bệnh nhân</h1>
                    <p className="text-sm text-[#687582] mb-6">Vui lòng chọn bệnh nhân từ hàng đợi để bắt đầu khám.</p>
                    <Link href="/portal/doctor/queue" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all">
                        <span className="material-symbols-outlined text-[18px]">groups</span>Về hàng đợi
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto space-y-5">
                {/* Top Bar */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs text-[#687582]">
                        <Link href="/portal/doctor" className="hover:text-[#3C81C6]">Trang chủ</Link>
                        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                        <Link href="/portal/doctor/queue" className="hover:text-[#3C81C6]">Hàng đợi</Link>
                        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                        <span className="text-[#121417] dark:text-white font-medium">Khám bệnh — {patient.fullName}</span>
                    </div>
                    <div className="ml-auto">
                        <button onClick={handleExit} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#687582] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[16px]">close</span>Thoát
                        </button>
                    </div>
                </div>

                {/* Patient Banner */}
                <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-4">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden border border-gray-200 bg-gray-100"
                            style={patient.avatar ? { backgroundImage: `url('${patient.avatar}')`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
                            {!patient.avatar && <div className="w-full h-full flex items-center justify-center text-gray-400"><span className="material-symbols-outlined text-2xl">person</span></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg font-bold text-[#121417] dark:text-white">{patient.fullName}</h1>
                                <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full font-medium">{patient.id}</span>
                                <span className="text-xs px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-full font-medium">STT: {patient.queueNumber}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-[#687582] flex-wrap">
                                <span>{patient.gender}, {patient.age} tuổi</span><span>•</span>
                                <span>Ngày sinh: {patient.birthDate}</span><span>•</span>
                                <span>SĐT: {patient.phone}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {patient.allergies && patient.allergies.length > 0 && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <span className="material-symbols-outlined text-red-500 text-[16px]">warning</span>
                                    <span className="text-xs font-medium text-red-600 dark:text-red-400">Dị ứng: {patient.allergies.join(", ")}</span>
                                </div>
                            )}
                            {patient.medicalHistory && patient.medicalHistory.length > 0 && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                    <span className="material-symbols-outlined text-amber-500 text-[16px]">history</span>
                                    <span className="text-xs font-medium text-amber-700 dark:text-amber-400">{patient.medicalHistory.join(", ")}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    {patient.reason && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-[#687582]"><strong className="text-[#121417] dark:text-gray-300">Lý do khám:</strong> {patient.reason}</p>
                        </div>
                    )}
                </div>

                {/* Steps Progress */}
                <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] px-5 py-4">
                    <div className="flex items-center gap-0">
                        {STEPS.map((step, i) => {
                            const isDone = i < activeStep;
                            const isCurrent = i === activeStep;
                            return (
                                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                                    <button
                                        onClick={() => i <= activeStep && setActiveStep(i)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${isCurrent
                                            ? "bg-[#3C81C6] text-white shadow-md shadow-blue-200 dark:shadow-none"
                                            : isDone
                                                ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer"
                                                : "text-[#b0b8c1] cursor-default"
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">{isDone ? "check_circle" : step.icon}</span>
                                        <span className="hidden sm:inline">{step.label}</span>
                                    </button>
                                    {i < STEPS.length - 1 && (
                                        <div className={`flex-1 h-[2px] mx-1 rounded transition-colors ${isDone ? "bg-green-400" : "bg-gray-200 dark:bg-gray-700"}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Step Content */}
                <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] overflow-hidden">
                    <div className="p-5 border-b border-[#eee] dark:border-[#2d353e]">
                        <h2 className="text-base font-bold text-[#121417] dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6] text-[20px]">{STEPS[activeStep].icon}</span>
                            {STEPS[activeStep].label}
                            <span className="text-xs font-normal text-[#b0b8c1] ml-1">Bước {activeStep + 1}/{STEPS.length}</span>
                        </h2>
                    </div>

                    <div className="p-5">
                        {/* Step 0: Vitals */}
                        {activeStep === 0 && (
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {VITAL_FIELDS.map((f) => (
                                        <div key={f.key} className="bg-[#f8f9fa] dark:bg-[#13191f] rounded-xl p-3.5 border border-transparent hover:border-[#3C81C6]/20 transition-colors">
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <span className={`material-symbols-outlined text-[16px] ${f.color}`}>{f.icon}</span>
                                                <span className="text-xs font-medium text-[#687582]">{f.label}</span>
                                            </div>
                                            <div className="flex items-baseline gap-1">
                                                <input type="text" value={vitals[f.key as keyof typeof vitals]} onChange={(e) => {
                                                    const val = e.target.value;
                                                    setVitals(prev => ({ ...prev, [f.key]: val }));
                                                    if (f.key === "bloodPressure") {
                                                        const res = validateBloodPressure(val);
                                                        setVitalErrors(prev => ({ ...prev, [f.key]: res.valid ? "" : res.message }));
                                                    } else {
                                                        const res = validateVitalSign(val, f.key);
                                                        setVitalErrors(prev => ({ ...prev, [f.key]: res.valid ? "" : res.message }));
                                                    }
                                                }}
                                                    placeholder={f.placeholder} className={`w-full text-lg font-bold text-[#121417] dark:text-white bg-transparent outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600 ${vitalErrors[f.key] ? "text-red-500" : ""}`} />
                                                <span className="text-xs text-[#b0b8c1] flex-shrink-0">{f.unit}</span>
                                            </div>
                                            {vitalErrors[f.key] && <p className="text-[10px] text-red-500 mt-1">{vitalErrors[f.key]}</p>}
                                        </div>
                                    ))}
                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-3.5 border border-indigo-100 dark:border-indigo-800">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <span className="material-symbols-outlined text-[16px] text-indigo-500">calculate</span>
                                            <span className="text-xs font-medium text-indigo-500">BMI</span>
                                        </div>
                                        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{bmi}</p>
                                    </div>
                                </div>

                                {/* AI Vital Alert */}
                                <AIVitalAlertBanner
                                    vitals={vitals}
                                    patientAge={patient.age}
                                    onDismiss={() => addAuditEntry("Sinh hiệu", "AI cảnh báo sinh hiệu", "dismissed")}
                                />
                            </div>
                        )}

                        {/* Step 1: Symptoms (enhanced) */}
                        {activeStep === 1 && (
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Mô tả triệu chứng *</label>
                                    <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)}
                                        rows={4} placeholder="Mô tả chi tiết triệu chứng, thời gian bắt đầu, mức độ..."
                                        className="w-full px-4 py-3 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 resize-none dark:text-white" />
                                </div>

                                {/* Structured symptoms */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Pain Scale */}
                                    <div className="bg-[#f8f9fa] dark:bg-[#13191f] rounded-xl p-4 border border-[#dde0e4] dark:border-[#2d353e]">
                                        <h4 className="text-xs font-bold text-[#687582] uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[16px] text-red-500">vital_signs</span>
                                            Thang đau (0-10)
                                        </h4>
                                        <div className="flex items-center gap-1.5">
                                            {Array.from({ length: 11 }, (_, i) => (
                                                <button key={i} onClick={() => setPainLevel(i)}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${painLevel === i
                                                        ? i <= 3 ? "bg-green-500 text-white" : i <= 6 ? "bg-yellow-500 text-white" : "bg-red-500 text-white"
                                                        : "bg-gray-100 dark:bg-gray-800 text-[#687582] hover:bg-gray-200 dark:hover:bg-gray-700"
                                                    }`}>
                                                    {i}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-[#687582] mt-2 text-center">
                                            {painLevel === 0 ? "Không đau" : painLevel <= 3 ? "Đau nhẹ" : painLevel <= 6 ? "Đau vừa" : painLevel <= 8 ? "Đau nặng" : "Đau dữ dội"}
                                        </p>
                                    </div>

                                    {/* Pain Location */}
                                    <div className="bg-[#f8f9fa] dark:bg-[#13191f] rounded-xl p-4 border border-[#dde0e4] dark:border-[#2d353e]">
                                        <h4 className="text-xs font-bold text-[#687582] uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[16px] text-orange-500">location_on</span>
                                            Vị trí đau
                                        </h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {PAIN_LOCATIONS.map((loc) => (
                                                <button key={loc} onClick={() => togglePainLocation(loc)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${painLocations.includes(loc)
                                                        ? "bg-[#3C81C6] text-white" : "bg-gray-100 dark:bg-gray-800 text-[#687582] hover:bg-gray-200"
                                                    }`}>
                                                    {loc}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Onset Time */}
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Thời gian khởi phát</label>
                                    <input type="text" value={onsetTime} onChange={(e) => setOnsetTime(e.target.value)}
                                        placeholder="VD: 3 ngày trước, sáng nay, từ 2 tuần nay..."
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>

                                {/* Context cards */}
                                {patient.reason && (
                                    <div className="flex items-start gap-3 p-3.5 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50">
                                        <span className="material-symbols-outlined text-blue-500 text-[20px] mt-0.5">description</span>
                                        <div><p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-0.5">Lý do khám (từ tiếp nhận)</p><p className="text-sm text-blue-800 dark:text-blue-300">{patient.reason}</p></div>
                                    </div>
                                )}

                                {/* AI Symptom Analyzer */}
                                <AISymptomAnalyzer
                                    symptoms={symptoms}
                                    vitals={vitals}
                                    onSelectDiagnosis={handleAIDiagnosisSelect}
                                    onSuggestLabs={handleAISuggestLabs}
                                />
                            </div>
                        )}

                        {/* Step 2: Lab Orders (NEW) */}
                        {activeStep === 2 && (
                            <div className="space-y-5">
                                <p className="text-sm text-[#687582]">Chọn các xét nghiệm cần chỉ định. Bước này không bắt buộc.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {LAB_TESTS.map((lab) => {
                                        const isSelected = selectedLabs.includes(lab.id);
                                        const hasResult = labResults[lab.id];
                                        const isAISuggested = aiSuggestedLabs.includes(lab.id);
                                        return (
                                            <button key={lab.id} onClick={() => toggleLab(lab.id)}
                                                className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${isSelected
                                                    ? "border-[#3C81C6] bg-[#3C81C6]/5 dark:bg-[#3C81C6]/10"
                                                    : isAISuggested
                                                        ? "border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-900/10"
                                                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                                }`}>
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-[#3C81C6]/10 text-[#3C81C6]" : "bg-gray-100 dark:bg-gray-800 text-[#687582]"}`}>
                                                    <span className="material-symbols-outlined text-[20px]">{lab.icon}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium ${isSelected ? "text-[#3C81C6]" : "text-[#121417] dark:text-white"}`}>
                                                        {lab.name}
                                                        {isAISuggested && !isSelected && (
                                                            <span className="ml-1.5 text-[10px] text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-1.5 py-0.5 rounded">🤖 AI gợi ý</span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-[#687582] mt-0.5">{lab.category}</p>
                                                    {hasResult && (
                                                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                                            <p className="text-xs text-green-700 dark:text-green-400">{hasResult}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected ? "border-[#3C81C6] bg-[#3C81C6]" : "border-gray-300 dark:border-gray-600"}`}>
                                                    {isSelected && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                {selectedLabs.length > 0 && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ghi chú chỉ định</label>
                                            <input type="text" value={labNote} onChange={(e) => setLabNote(e.target.value)}
                                                placeholder="VD: Nhịn ăn sáng trước khi lấy máu..."
                                                className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={simulateLabResults}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold transition-colors shadow-md shadow-teal-200 dark:shadow-none">
                                                <span className="material-symbols-outlined text-[18px]">science</span>
                                                Mô phỏng kết quả XN
                                            </button>
                                            <span className="text-xs text-[#687582]">Đã chọn {selectedLabs.length} xét nghiệm</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Diagnosis */}
                        {activeStep === 3 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Mã ICD-10</label>
                                        <input type="text" value={icdCode} onChange={(e) => setIcdCode(e.target.value)} placeholder="VD: I10, J06.9..."
                                            className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Chẩn đoán *</label>
                                        <input type="text" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Tên bệnh / chẩn đoán..."
                                            className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                    </div>
                                </div>
                                {/* Show lab results summary if available */}
                                {Object.keys(labResults).length > 0 && (
                                    <div className="p-4 bg-teal-50 dark:bg-teal-900/10 rounded-xl border border-teal-200 dark:border-teal-800">
                                        <h4 className="text-xs font-bold text-teal-700 dark:text-teal-400 mb-2 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[16px]">biotech</span>Tóm tắt kết quả xét nghiệm
                                        </h4>
                                        <div className="space-y-1.5">
                                            {Object.entries(labResults).map(([labId, result]) => {
                                                const lab = LAB_TESTS.find(l => l.id === labId);
                                                return (
                                                    <div key={labId} className="text-xs text-teal-800 dark:text-teal-300">
                                                        <strong>{lab?.name}:</strong> {result}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Phương án điều trị</label>
                                    <textarea value={treatment} onChange={(e) => setTreatment(e.target.value)} rows={3} placeholder="Mô tả hướng xử lý..."
                                        className="w-full px-4 py-3 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 resize-none dark:text-white" />
                                </div>

                                {/* AI Similar Cases */}
                                <AISimilarCases />
                            </div>
                        )}

                        {/* Step 4: Prescription */}
                        {activeStep === 4 && (
                            <div className="space-y-4">
                                {meds.length > 0 && (
                                    <div className="space-y-2">
                                        {meds.map((m, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 bg-[#f8f9fa] dark:bg-[#13191f] rounded-xl group">
                                                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                                                    <span className="material-symbols-outlined text-teal-600 text-[18px]">medication</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-[#121417] dark:text-white">{m.name}</p>
                                                    <p className="text-xs text-[#687582] truncate">{[m.dosage, m.frequency, m.duration, m.note].filter(Boolean).join(" • ")}</p>
                                                </div>
                                                <button onClick={() => removeMed(i)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all">
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {meds.length === 0 && (
                                    <div className="text-center py-6 text-[#b0b8c1]">
                                        <span className="material-symbols-outlined text-4xl mb-2 block">medication</span>
                                        <p className="text-sm">Chưa có thuốc nào. Thêm thuốc bên dưới.</p>
                                    </div>
                                )}
                                <div className="p-4 border-2 border-dashed border-[#dde0e4] dark:border-[#2d353e] rounded-xl space-y-3">
                                    <p className="text-xs font-bold text-[#687582] uppercase tracking-wide">Thêm thuốc mới</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        <input type="text" value={newMed.name} onChange={(e) => setNewMed(p => ({ ...p, name: e.target.value }))} placeholder="Tên thuốc *"
                                            className="px-3 py-2 bg-white dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm outline-none focus:border-[#3C81C6] dark:text-white" />
                                        <input type="text" value={newMed.dosage} onChange={(e) => setNewMed(p => ({ ...p, dosage: e.target.value }))} placeholder="Liều lượng"
                                            className="px-3 py-2 bg-white dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm outline-none focus:border-[#3C81C6] dark:text-white" />
                                        <input type="text" value={newMed.frequency} onChange={(e) => setNewMed(p => ({ ...p, frequency: e.target.value }))} placeholder="Tần suất"
                                            className="px-3 py-2 bg-white dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm outline-none focus:border-[#3C81C6] dark:text-white" />
                                        <input type="text" value={newMed.duration} onChange={(e) => setNewMed(p => ({ ...p, duration: e.target.value }))} placeholder="Số ngày"
                                            className="px-3 py-2 bg-white dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm outline-none focus:border-[#3C81C6] dark:text-white" />
                                        <input type="text" value={newMed.note} onChange={(e) => setNewMed(p => ({ ...p, note: e.target.value }))} placeholder="Ghi chú"
                                            className="px-3 py-2 bg-white dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm outline-none focus:border-[#3C81C6] dark:text-white" />
                                        <button onClick={addMed} className="px-4 py-2 bg-[#3C81C6] text-white rounded-lg text-sm font-medium hover:bg-[#2a6da8] flex items-center justify-center gap-1.5 transition-colors">
                                            <span className="material-symbols-outlined text-[16px]">add</span>Thêm thuốc
                                        </button>
                                    </div>
                                </div>

                                {/* AI Drug Intelligence */}
                                {meds.length > 0 && (
                                    <AIDrugIntelligence
                                        drugs={meds.map(m => ({ name: m.name, dosage: m.dosage }))}
                                        allergies={patient.allergies}
                                        patientProfile={{
                                            weight: vitals.weight ? parseFloat(vitals.weight) : undefined,
                                            age: patient.age,
                                        }}
                                        diagnosis={diagnosis}
                                        onDismiss={() => addAuditEntry("Kê đơn", "AI kiểm tra tương tác thuốc", "dismissed")}
                                    />
                                )}
                            </div>
                        )}

                        {/* Step 5: Summary */}
                        {activeStep === 5 && (
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <SummaryCard title="Sinh hiệu" icon="monitor_heart" color="text-pink-500">
                                        {vitals.bloodPressure && <p>HA: <strong>{vitals.bloodPressure}</strong> mmHg</p>}
                                        {vitals.heartRate && <p>Nhịp tim: <strong>{vitals.heartRate}</strong> bpm</p>}
                                        {vitals.temperature && <p>Nhiệt độ: <strong>{vitals.temperature}</strong>°C</p>}
                                        {vitals.spO2 && <p>SpO₂: <strong>{vitals.spO2}</strong>%</p>}
                                        {vitals.weight && <p>Cân nặng: {vitals.weight}kg • BMI: {bmi}</p>}
                                    </SummaryCard>
                                    <SummaryCard title="Triệu chứng" icon="symptoms" color="text-amber-500">
                                        <p>{symptoms || <span className="text-[#b0b8c1] italic">Chưa nhập</span>}</p>
                                        {painLevel > 0 && <p className="mt-1">Đau: <strong>{painLevel}/10</strong> — {painLocations.join(", ") || "Chưa xác định"}</p>}
                                        {onsetTime && <p>Khởi phát: {onsetTime}</p>}
                                    </SummaryCard>
                                    {selectedLabs.length > 0 && (
                                        <SummaryCard title={`Xét nghiệm (${selectedLabs.length})`} icon="biotech" color="text-teal-500">
                                            {selectedLabs.map(labId => {
                                                const lab = LAB_TESTS.find(l => l.id === labId);
                                                return <p key={labId}>• {lab?.name}</p>;
                                            })}
                                        </SummaryCard>
                                    )}
                                    <SummaryCard title="Chẩn đoán" icon="diagnosis" color="text-blue-500">
                                        {icdCode && <p className="text-xs font-mono text-blue-500 mb-1">{icdCode}</p>}
                                        <p className="font-medium">{diagnosis || <span className="text-[#b0b8c1] italic">Chưa nhập</span>}</p>
                                        {treatment && <p className="text-[#687582] mt-1">{treatment}</p>}
                                    </SummaryCard>
                                    <SummaryCard title={`Đơn thuốc (${meds.length})`} icon="medication" color="text-teal-500">
                                        {meds.length === 0 ? <p className="text-[#b0b8c1] italic">Không kê đơn</p> : (
                                            <div className="space-y-1">{meds.map((m, i) => <p key={i}>• <strong>{m.name}</strong> {m.dosage && `— ${m.dosage}`}</p>)}</div>
                                        )}
                                    </SummaryCard>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Lịch tái khám</label>
                                        <input type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Lời dặn bác sĩ</label>
                                        <input type="text" value={doctorNote} onChange={(e) => setDoctorNote(e.target.value)} placeholder="Chế độ ăn, sinh hoạt..."
                                            className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                    </div>
                                </div>
                                {/* AI Examination Summary & Audit Trail */}
                                <AIExaminationSummary
                                    vitals={vitals}
                                    symptoms={symptoms}
                                    diagnosis={diagnosis}
                                    icdCode={icdCode}
                                    treatment={treatment}
                                    meds={meds}
                                    auditEntries={aiAuditEntries}
                                    onGenerateSummary={handleAISummaryGenerated}
                                />

                                {meds.length > 0 && (
                                    <label className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-800 cursor-pointer">
                                        <input type="checkbox" checked={sendToPharmacy} onChange={(e) => setSendToPharmacy(e.target.checked)}
                                            className="w-4 h-4 rounded text-green-600 border-gray-300" />
                                        <div>
                                            <p className="text-sm font-medium text-green-700 dark:text-green-400">Gửi đơn thuốc đến quầy dược</p>
                                            <p className="text-xs text-green-600 dark:text-green-500">Đơn thuốc sẽ được chuyển tự động sang Pharmacist portal</p>
                                        </div>
                                    </label>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-4">
                    <button onClick={goBack} disabled={activeStep === 0}
                        className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-[#687582] disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>Quay lại
                    </button>
                    <div className="flex items-center gap-2.5">
                        <button onClick={handleSaveDraft} disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-[#687582] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
                            <span className="material-symbols-outlined text-[18px]">save</span>Lưu nháp
                        </button>
                        {activeStep < STEPS.length - 1 ? (
                            <button onClick={goNext} disabled={!canProceed}
                                className="flex items-center gap-1.5 px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-40 shadow-md shadow-blue-200 dark:shadow-none">
                                Tiếp theo<span className="material-symbols-outlined text-[18px]">chevron_right</span>
                            </button>
                        ) : (
                            <button onClick={handleComplete} disabled={saving}
                                className="flex items-center gap-1.5 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shadow-md shadow-green-200 dark:shadow-none">
                                {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang xử lý...</> : <><span className="material-symbols-outlined text-[18px]">verified</span> Hoàn thành &amp; Ký</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ title, icon, color, children }: { title: string; icon: string; color: string; children: React.ReactNode }) {
    return (
        <div className="bg-[#f8f9fa] dark:bg-[#13191f] rounded-xl p-4 border border-[#eee] dark:border-[#2d353e]">
            <h4 className="text-xs font-bold uppercase tracking-wide text-[#687582] mb-2.5 flex items-center gap-1.5">
                <span className={`material-symbols-outlined text-[16px] ${color}`}>{icon}</span>{title}
            </h4>
            <div className="text-sm text-[#121417] dark:text-gray-300 space-y-0.5">{children}</div>
        </div>
    );
}
