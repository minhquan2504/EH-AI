"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PatientNavbar } from "@/components/patient/PatientNavbar";
import { PatientFooter } from "@/components/patient/PatientFooter";
import { BookingStepIndicator } from "@/components/patient/BookingStepIndicator";
import { TimeSlotPicker } from "@/components/patient/TimeSlotPicker";
import { DoctorCard } from "@/components/patient/DoctorCard";
import { getSpecialties, type Specialty } from "@/services/specialtyService";
import { doctorService, type Doctor } from "@/services/doctorService";
import { createAppointment, doctorAvailabilityService } from "@/services/appointmentService";
import { useAuth } from "@/contexts/AuthContext";
import { validateName, validatePhone, validateAppointmentDate } from "@/utils/validation";

// Kiểu dữ liệu cho patient profile (local, vì backend chưa có endpoint riêng)
interface PatientProfile {
    id: string;
    fullName: string;
    phone: string;
    dob: string;
    gender: "male" | "female" | "other";
    idNumber?: string;
    insuranceNumber?: string;
    address?: string;
    relationship: "self" | "parent" | "child" | "sibling" | "spouse" | "other";
    relationshipLabel: string;
    isPrimary: boolean;
}

const STEPS = [
    { label: "Hình thức", icon: "category" },
    { label: "Ngày giờ", icon: "calendar_month" },
    { label: "Thông tin", icon: "person" },
    { label: "Xác nhận", icon: "fact_check" },
    { label: "Hoàn tất", icon: "check_circle" },
];

interface PatientForm {
    fullName: string;
    phone: string;
    dob: string;
    gender: string;
    idNumber: string;
    insuranceNumber: string;
    address: string;
    symptoms: string;
    bookingFor: "self" | "relative";
    relativeName: string;
    relativePhone: string;
    relativeRelation: string;
}

const emptyForm: PatientForm = {
    fullName: "", phone: "", dob: "", gender: "", idNumber: "", insuranceNumber: "",
    address: "", symptoms: "", bookingFor: "self", relativeName: "", relativePhone: "", relativeRelation: "",
};

function BookingPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isAuthenticated } = useAuth();

    const initDoctorId = searchParams.get("doctorId") || "";
    const initDoctorName = searchParams.get("doctorName") || "";
    const initSpecialtyId = searchParams.get("specialtyId") || "";
    const initSpecialtyName = searchParams.get("specialtyName") || "";
    const initServiceId = searchParams.get("serviceId") || "";
    const initDate = searchParams.get("date") || "";
    const initTime = searchParams.get("time") || "";

    const [step, setStep] = useState(1);
    const [bookingType, setBookingType] = useState<"specialty" | "doctor" | "service">(
        initDoctorId || initDoctorName ? "doctor" : initServiceId ? "service" : "specialty"
    );
    const [consultType, setConsultType] = useState<"in-person" | "online">("in-person");
    const [selectedSpecialty, setSelectedSpecialty] = useState(initSpecialtyId);
    const [selectedDoctor, setSelectedDoctor] = useState(initDoctorId);
    const [selectedService, setSelectedService] = useState(initServiceId);
    const [selectedDate, setSelectedDate] = useState(initDate);
    const [selectedTime, setSelectedTime] = useState(initTime);
    const [form, setForm] = useState<PatientForm>(emptyForm);
    const [agreedTerms, setAgreedTerms] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [bookingCode, setBookingCode] = useState("");
    const [selectedProfileId, setSelectedProfileId] = useState<string>("");

    // Data
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDoctorObj, setSelectedDoctorObj] = useState<Doctor | null>(null);
    const [patientProfiles, setPatientProfiles] = useState<PatientProfile[]>([]);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);

    useEffect(() => { loadSpecialties(); }, []);
    useEffect(() => { if (selectedSpecialty) loadDoctors(); }, [selectedSpecialty]);
    useEffect(() => { if (initDoctorId) loadSelectedDoctor(initDoctorId); }, [initDoctorId]);
    // Load available slots when doctor + date change (Step 2)
    useEffect(() => {
        if (selectedDoctor && selectedDate) {
            doctorAvailabilityService.getSlots({ doctorId: selectedDoctor, date: selectedDate })
                .then((slots: any[]) => {
                    if (slots.length > 0) {
                        const times = slots
                            .filter((s: any) => s.available !== false)
                            .map((s: any) => s.startTime ?? s.time ?? "")
                            .filter(Boolean);
                        setAvailableSlots(times);
                    } else {
                        setAvailableSlots([]);
                    }
                })
                .catch(() => setAvailableSlots([]));
        }
    }, [selectedDoctor, selectedDate]);
    useEffect(() => {
        if (initDoctorName) {
            // Tìm bác sĩ theo tên qua API
            doctorService.getList({ search: initDoctorName, limit: 1 })
                .then(res => {
                    const data = res?.data ?? [];
                    if (data.length > 0) {
                        setSelectedDoctorObj(data[0]);
                        setSelectedDoctor(data[0].id);
                    }
                })
                .catch(() => {});
        }
    }, [initDoctorName]);
    useEffect(() => {
        if (initSpecialtyName && specialties.length > 0) {
            const found = specialties.find(s => s.name === initSpecialtyName);
            if (found) setSelectedSpecialty(found.id);
        }
    }, [initSpecialtyName, specialties]);
    useEffect(() => {
        if (user && isAuthenticated) {
            setForm(prev => ({ ...prev, fullName: user.fullName || "", phone: user.phone || "" }));
            // Backend chưa có endpoint profiles — khởi tạo profile từ thông tin user hiện tại
            const selfProfile: PatientProfile = {
                id: "self",
                fullName: user.fullName || "",
                phone: user.phone || "",
                dob: "",
                gender: "male",
                relationship: "self",
                relationshipLabel: "Bản thân",
                isPrimary: true,
            };
            setPatientProfiles([selfProfile]);
            setSelectedProfileId("self");
        }
    }, [user, isAuthenticated]);

    const loadSpecialties = async () => {
        try {
            const res = await getSpecialties({ limit: 50 });
            setSpecialties(res.data ?? []);
        } catch { setSpecialties([]); }
    };
    const loadDoctors = async () => {
        try {
            const res = await doctorService.getList({ limit: 20, departmentId: selectedSpecialty });
            setDoctors(res.data ?? []);
        } catch {
            setDoctors([]);
        }
    };
    const loadSelectedDoctor = async (docId: string) => {
        try {
            const doc = await doctorService.getById(docId);
            if (doc && doc.id) { setSelectedDoctorObj(doc); setSelectedDoctor(docId); }
        } catch {
            // Không tìm thấy bác sĩ — bỏ qua, người dùng tự chọn
        }
    };

    // When service is selected
    const handleServiceSelect = (svcId: string) => {
        setSelectedService(svcId);
    };

    // Apply profile to form
    const applyProfile = (profileId: string) => {
        setSelectedProfileId(profileId);
        const profile = patientProfiles.find(p => p.id === profileId);
        if (profile) {
            setForm(prev => ({
                ...prev,
                fullName: profile.fullName,
                phone: profile.phone,
                dob: profile.dob,
                gender: profile.gender,
                idNumber: profile.idNumber || "",
                insuranceNumber: profile.insuranceNumber || "",
                address: profile.address || "",
                bookingFor: profile.relationship === "self" ? "self" : "relative",
            }));
        }
    };

    const nextStep = () => setStep(s => Math.min(s + 1, 5));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const canProceedStep1 =
        (bookingType === "doctor" && selectedDoctor) ||
        (bookingType === "specialty" && selectedSpecialty) ||
        (bookingType === "service" && selectedService && selectedSpecialty);
    const canProceedStep2 = selectedDate && selectedTime && validateAppointmentDate(selectedDate).valid;
    const canProceedStep3 = form.fullName && form.phone && form.gender
        && validateName(form.fullName).valid && validatePhone(form.phone).valid;
    const canProceedStep4 = agreedTerms;

    const [submitError, setSubmitError] = useState("");

    const handleSubmit = async () => {
        setSubmitting(true);
        setSubmitError("");
        try {
            const patientId = user?.id || "guest";
            await createAppointment({
                patientId,
                doctorId: selectedDoctor,
                date: selectedDate,
                time: selectedTime,
                type: "first_visit",
                reason: form.symptoms,
            });
            setBookingCode(`EH-${Date.now().toString(36).toUpperCase()}`);
            setStep(5);
        } catch {
            setSubmitError("Đặt lịch thất bại. Vui lòng kiểm tra lại thông tin và thử lại.");
        } finally {
            setSubmitting(false);
        }
    };

    const updateForm = (key: keyof PatientForm, value: string) => setForm(prev => ({ ...prev, [key]: value }));

    return (
        <div className="min-h-screen bg-gray-50/50">
            <PatientNavbar />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Đặt lịch khám</h1>
                    <p className="text-gray-500 text-sm">Hoàn thành các bước bên dưới để đặt lịch khám bệnh</p>
                </div>

                {/* Steps */}
                <div className="mb-8">
                    <BookingStepIndicator currentStep={step} steps={STEPS} />
                </div>

                {/* Step content */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">

                    {/* ========== STEP 1 ========== */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "22px" }}>category</span>
                                Chọn hình thức khám
                            </h2>

                            {/* Booking type — 3 options */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { type: "specialty" as const, icon: "medical_services", label: "Theo chuyên khoa", desc: "Chọn chuyên khoa trước, rồi lọc bác sĩ" },
                                    { type: "doctor" as const, icon: "person_search", label: "Theo bác sĩ", desc: "Chọn trực tiếp bác sĩ bạn muốn" },
                                    { type: "service" as const, icon: "health_and_safety", label: "Theo dịch vụ", desc: "Chọn dịch vụ, hệ thống gợi ý phù hợp" },
                                ].map(opt => (
                                    <button key={opt.type} onClick={() => { setBookingType(opt.type); setSelectedService(""); setSelectedSpecialty(initSpecialtyId); setSelectedDoctor(initDoctorId); }}
                                        className={`text-left p-4 rounded-xl border-2 transition-all
                                        ${bookingType === opt.type ? "border-[#3C81C6] bg-[#3C81C6]/[0.04] shadow-sm" : "border-gray-100 hover:border-gray-200"}`}>
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bookingType === opt.type ? "bg-[#3C81C6] text-white" : "bg-gray-100 text-gray-500"}`}>
                                                <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>{opt.icon}</span>
                                            </div>
                                            <span className="font-semibold text-gray-900 text-sm">{opt.label}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 ml-[52px]">{opt.desc}</p>
                                    </button>
                                ))}
                            </div>

                            {/* Consultation type */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">Hình thức khám</label>
                                <div className="flex gap-3">
                                    {[
                                        { t: "in-person" as const, icon: "person", label: "Trực tiếp tại viện" },
                                        { t: "online" as const, icon: "videocam", label: "Tư vấn online" },
                                    ].map(c => (
                                        <button key={c.t} onClick={() => setConsultType(c.t)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all
                                            ${consultType === c.t ? "border-[#3C81C6] bg-[#3C81C6]/[0.04] text-[#3C81C6]" : "border-gray-100 text-gray-600 hover:border-gray-200"}`}>
                                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{c.icon}</span>
                                            {c.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ===== BY SPECIALTY ===== */}
                            {bookingType === "specialty" && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Chọn chuyên khoa</label>
                                        <select value={selectedSpecialty} onChange={e => { setSelectedSpecialty(e.target.value); setSelectedDoctor(""); setSelectedDoctorObj(null); }}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 focus:border-[#3C81C6]/30 bg-gray-50">
                                            <option value="">— Chọn chuyên khoa —</option>
                                            {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    {/* Optional: filter doctor */}
                                    {selectedSpecialty && doctors.length > 0 && (
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-gray-400" style={{ fontSize: "16px" }}>person_search</span>
                                                Chọn bác sĩ <span className="text-xs text-gray-400 font-normal">(tùy chọn)</span>
                                            </label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                                                {doctors.map(doc => (
                                                    <button key={doc.id} onClick={() => { setSelectedDoctor(doc.id); setSelectedDoctorObj(doc); }}
                                                        className={`text-left p-3 rounded-xl border transition-all ${selectedDoctor === doc.id ? "border-[#3C81C6] bg-[#3C81C6]/[0.04]" : "border-gray-100 hover:border-gray-200"}`}>
                                                        <p className="text-sm font-semibold text-gray-900 truncate">{doc.fullName}</p>
                                                        <p className="text-xs text-gray-500 truncate">{doc.specialization}</p>
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <span className="material-symbols-outlined text-amber-400" style={{ fontSize: "14px", fontVariationSettings: "'FILL' 1" }}>star</span>
                                                            <span className="text-xs font-bold text-gray-700">{doc.rating}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {/* Ghi chú: dịch vụ sẽ được tư vấn tại quầy */}
                                </div>
                            )}

                            {/* ===== BY DOCTOR ===== */}
                            {bookingType === "doctor" && (
                                <div className="space-y-4">
                                    {selectedDoctorObj ? (
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Bác sĩ đã chọn</label>
                                            <DoctorCard id={selectedDoctorObj.id} fullName={selectedDoctorObj.fullName} department={selectedDoctorObj.departmentName}
                                                rating={selectedDoctorObj.rating} avatar={selectedDoctorObj.avatar} compact />
                                            <button onClick={() => { setSelectedDoctor(""); setSelectedDoctorObj(null); }}
                                                className="mt-2 text-xs text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1">
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>close</span> Đổi bác sĩ
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500 text-sm mb-3">Chưa chọn bác sĩ</p>
                                            <Link href="/doctors" className="px-4 py-2 text-sm font-medium text-[#3C81C6] bg-[#3C81C6]/10 rounded-xl hover:bg-[#3C81C6]/20 transition-colors">
                                                Tìm bác sĩ →
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ===== BY SERVICE ===== */}
                            {bookingType === "service" && (
                                <div className="space-y-4">
                                    <div className="p-5 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                                        <span className="material-symbols-outlined text-[#3C81C6] mt-0.5" style={{ fontSize: "22px" }}>medical_services</span>
                                        <div>
                                            <p className="text-sm font-semibold text-blue-900 mb-1">Đặt lịch theo dịch vụ</p>
                                            <p className="text-xs text-blue-700">Vui lòng mô tả nhu cầu của bạn. Nhân viên y tế sẽ tư vấn và gợi ý dịch vụ phù hợp nhất khi bạn đến khám.</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Chuyên khoa bạn cần</label>
                                        <select value={selectedSpecialty} onChange={e => setSelectedSpecialty(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 bg-gray-50">
                                            <option value="">— Chọn chuyên khoa (tùy chọn) —</option>
                                            {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========== STEP 2 ========== */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "22px" }}>calendar_month</span>
                                Chọn ngày giờ khám
                            </h2>
                            <TimeSlotPicker
                                selectedDate={selectedDate}
                                onDateChange={setSelectedDate}
                                selectedTime={selectedTime}
                                onTimeChange={setSelectedTime}
                            />
                            {selectedDate && !validateAppointmentDate(selectedDate).valid && (
                                <p className="text-sm text-red-500 mt-2 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>error</span>
                                    {validateAppointmentDate(selectedDate).message}
                                </p>
                            )}
                        </div>
                    )}

                    {/* ========== STEP 3 ========== */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "22px" }}>person</span>
                                Thông tin bệnh nhân
                            </h2>

                            {/* Patient profile selector */}
                            {isAuthenticated && patientProfiles.length > 0 && (
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "16px" }}>family_restroom</span>
                                        Chọn hồ sơ bệnh nhân
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                                        {patientProfiles.map(profile => (
                                            <button key={profile.id} onClick={() => applyProfile(profile.id)}
                                                className={`p-3 rounded-xl border-2 text-left transition-all ${selectedProfileId === profile.id
                                                    ? "border-[#3C81C6] bg-[#3C81C6]/[0.04]"
                                                    : "border-gray-100 hover:border-gray-200"}`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${selectedProfileId === profile.id ? "bg-[#3C81C6]" : "bg-gray-300"}`}>
                                                        {profile.fullName.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-gray-900 truncate">{profile.fullName}</p>
                                                        <p className="text-[10px] text-gray-500">{profile.relationshipLabel}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                        <Link href="/patient/patient-profiles"
                                            className="p-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#3C81C6] flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#3C81C6] transition-colors">
                                            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add</span>
                                            <span className="text-[10px] font-medium">Thêm mới</span>
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Booking for */}
                            {!isAuthenticated && (
                                <div className="flex gap-3">
                                    {[
                                        { v: "self" as const, l: "Đặt cho bản thân" },
                                        { v: "relative" as const, l: "Đặt cho người thân" },
                                    ].map(opt => (
                                        <button key={opt.v} onClick={() => updateForm("bookingFor", opt.v)}
                                            className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                                            ${form.bookingFor === opt.v ? "border-[#3C81C6] bg-[#3C81C6]/[0.04] text-[#3C81C6]" : "border-gray-100 text-gray-600"}`}>
                                            {opt.l}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <FormField label="Họ và tên *" icon="person" value={form.fullName} onChange={v => updateForm("fullName", v)} placeholder="Nguyễn Văn A" />
                                    {form.fullName && !validateName(form.fullName).valid && <p className="text-xs text-red-500 mt-1">{validateName(form.fullName).message}</p>}
                                </div>
                                <div>
                                    <FormField label="Số điện thoại *" icon="call" value={form.phone} onChange={v => updateForm("phone", v)} placeholder="0901 234 567" type="tel" />
                                    {form.phone && !validatePhone(form.phone).valid && <p className="text-xs text-red-500 mt-1">{validatePhone(form.phone).message}</p>}
                                </div>
                                <FormField label="Ngày sinh" icon="cake" value={form.dob} onChange={v => updateForm("dob", v)} type="date" />
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Giới tính *</label>
                                    <div className="flex gap-2">
                                        {[{ v: "male", l: "Nam" }, { v: "female", l: "Nữ" }, { v: "other", l: "Khác" }].map(g => (
                                            <button key={g.v} onClick={() => updateForm("gender", g.v)}
                                                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all
                                                ${form.gender === g.v ? "border-[#3C81C6] bg-[#3C81C6]/[0.06] text-[#3C81C6]" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                                                {g.l}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <FormField label="CCCD" icon="badge" value={form.idNumber} onChange={v => updateForm("idNumber", v)} placeholder="001234567890" />
                                <FormField label="Số BHYT" icon="health_and_safety" value={form.insuranceNumber} onChange={v => updateForm("insuranceNumber", v)} placeholder="HS4010..." />
                            </div>

                            <FormField label="Địa chỉ" icon="location_on" value={form.address} onChange={v => updateForm("address", v)} placeholder="Số nhà, đường, quận, TP" full />

                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Triệu chứng / Lý do khám</label>
                                <textarea value={form.symptoms} onChange={e => updateForm("symptoms", e.target.value)}
                                    placeholder="Mô tả triệu chứng hoặc lý do bạn muốn khám..."
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 bg-gray-50 min-h-[100px] resize-none" />
                            </div>

                            {!isAuthenticated && form.bookingFor === "relative" && (
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <h4 className="text-sm font-bold text-blue-900 mb-3">Thông tin người thân</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <FormField label="Họ tên người thân" icon="person" value={form.relativeName} onChange={v => updateForm("relativeName", v)} />
                                        <FormField label="SĐT người thân" icon="call" value={form.relativePhone} onChange={v => updateForm("relativePhone", v)} />
                                    </div>
                                </div>
                            )}

                            {!isAuthenticated && (
                                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
                                    <span className="material-symbols-outlined text-amber-500 mt-0.5" style={{ fontSize: "16px" }}>info</span>
                                    <p className="text-xs text-amber-700">
                                        <Link href="/login" className="font-bold text-[#3C81C6] hover:underline">Đăng nhập</Link> để quản lý hồ sơ bệnh nhân và đặt lịch nhanh hơn cho cả gia đình.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========== STEP 4 ========== */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "22px" }}>fact_check</span>
                                Xác nhận lịch hẹn
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SummaryItem icon="medical_services" label="Chuyên khoa" value={specialties.find(s => s.id === selectedSpecialty)?.name || selectedDoctorObj?.departmentName || "—"} />
                                <SummaryItem icon="person" label="Bác sĩ" value={selectedDoctorObj?.fullName || "Hệ thống sẽ phân bổ"} />
                                <SummaryItem icon="calendar_today" label="Ngày khám" value={selectedDate ? new Date(selectedDate + "T00:00:00").toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "—"} />
                                <SummaryItem icon="schedule" label="Giờ khám" value={selectedTime || "—"} />
                                <SummaryItem icon="location_on" label="Địa điểm" value={consultType === "online" ? "Tư vấn online (Video call)" : "EHealth Hospital — 123 Nguyễn Văn Linh, Q.7"} />
                                <SummaryItem icon="payments" label="Phí khám (dự kiến)" value="400.000 — 500.000đ" />
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Thông tin bệnh nhân</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><span className="text-gray-400">Họ tên:</span> <span className="font-medium text-gray-700">{form.fullName}</span></div>
                                    <div><span className="text-gray-400">SĐT:</span> <span className="font-medium text-gray-700">{form.phone}</span></div>
                                    {form.dob && <div><span className="text-gray-400">Ngày sinh:</span> <span className="font-medium text-gray-700">{new Date(form.dob + "T00:00:00").toLocaleDateString("vi-VN")}</span></div>}
                                    {form.insuranceNumber && <div><span className="text-gray-400">BHYT:</span> <span className="font-medium text-gray-700">{form.insuranceNumber}</span></div>}
                                    {form.symptoms && <div className="col-span-2"><span className="text-gray-400">Triệu chứng:</span> <span className="text-gray-700">{form.symptoms}</span></div>}
                                </div>
                            </div>

                            {/* Policy */}
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>info</span>
                                    Chính sách lịch hẹn
                                </h4>
                                <ul className="text-xs text-amber-700 space-y-1">
                                    <li>• Đến sớm 15 phút trước giờ hẹn để hoàn tất thủ tục</li>
                                    <li>• Hủy lịch trước 2 giờ để tránh mất phí</li>
                                    <li>• Mang theo CCCD/CMND và thẻ BHYT (nếu có)</li>
                                </ul>
                            </div>

                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input type="checkbox" checked={agreedTerms} onChange={e => setAgreedTerms(e.target.checked)} className="sr-only peer" />
                                <div className="w-5 h-5 rounded border-2 border-gray-300 peer-checked:bg-[#3C81C6] peer-checked:border-[#3C81C6] flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors">
                                    {agreedTerms && <span className="material-symbols-outlined text-white" style={{ fontSize: "16px" }}>check</span>}
                                </div>
                                <span className="text-sm text-gray-600">Tôi đã đọc và đồng ý với <a href="#" className="text-[#3C81C6] font-medium hover:underline">chính sách bảo mật</a> và <a href="#" className="text-[#3C81C6] font-medium hover:underline">điều khoản sử dụng</a></span>
                            </label>
                        </div>
                    )}

                    {/* ========== STEP 5 — Success ========== */}
                    {step === 5 && (
                        <div className="text-center py-8 space-y-6">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-green-500/25 animate-bounce">
                                <span className="material-symbols-outlined text-white" style={{ fontSize: "40px" }}>check_circle</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Đặt lịch thành công!</h2>
                                <p className="text-gray-500">Lịch hẹn của bạn đã được ghi nhận. Chúng tôi sẽ xác nhận qua SMS trong vòng 30 phút.</p>
                            </div>

                            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-50 rounded-xl">
                                <span className="text-sm text-gray-500">Mã lịch hẹn:</span>
                                <span className="text-lg font-bold text-[#3C81C6]">{bookingCode}</span>
                            </div>

                            <div className="flex items-center justify-center gap-3 flex-wrap">
                                <Link href="/patient/appointments"
                                    className="px-5 py-3 bg-[#3C81C6] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.97]">
                                    Xem lịch hẹn của tôi
                                </Link>
                                <button onClick={() => { setStep(1); setSelectedDate(""); setSelectedTime(""); setForm(emptyForm); setAgreedTerms(false); }}
                                    className="px-5 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                                    Đặt lịch khác
                                </button>
                            </div>

                            <div className="max-w-md mx-auto text-left p-5 bg-blue-50 border border-blue-100 rounded-xl">
                                <h4 className="text-sm font-bold text-blue-900 mb-2">📋 Hướng dẫn trước khi đến khám</h4>
                                <ul className="text-xs text-blue-700 space-y-1.5">
                                    <li>• Mang theo CCCD/CMND bản gốc</li>
                                    <li>• Mang theo thẻ BHYT (nếu có)</li>
                                    <li>• Nhịn ăn 8 tiếng nếu có xét nghiệm máu</li>
                                    <li>• Đến trước giờ hẹn 15 phút</li>
                                    <li>• Mang theo kết quả khám trước đó (nếu có)</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Navigation buttons */}
                    {step < 5 && (
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                            <button onClick={prevStep} disabled={step === 1}
                                className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5">
                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span>
                                Quay lại
                            </button>

                            {step < 4 ? (
                                <button onClick={nextStep}
                                    disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2) || (step === 3 && !canProceedStep3)}
                                    className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#2563eb] rounded-xl shadow-md shadow-[#3C81C6]/20 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.97] flex items-center gap-1.5">
                                    Tiếp tục
                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_forward</span>
                                </button>
                            ) : (
                                <div className="flex flex-col items-end gap-2">
                                    {submitError && (
                                        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 max-w-xs text-right">{submitError}</p>
                                    )}
                                    <button onClick={handleSubmit} disabled={!canProceedStep4 || submitting}
                                        className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-md shadow-green-500/20 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.97] flex items-center gap-1.5">
                                        {submitting ? (
                                            <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Đang xử lý...</>
                                        ) : (
                                            <>Xác nhận đặt lịch <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check</span></>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <PatientFooter />
        </div>
    );
}

// ——— Helper components ———

function FormField({ label, icon, value, onChange, placeholder, type = "text", full = false }: {
    label: string; icon: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; full?: boolean;
}) {
    return (
        <div className={full ? "col-span-full" : ""}>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{label}</label>
            <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400" style={{ fontSize: "18px" }}>{icon}</span>
                <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 focus:border-[#3C81C6]/30 bg-gray-50 placeholder-gray-400" />
            </div>
        </div>
    );
}

export default function BookingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#3C81C6]/20 border-t-[#3C81C6] rounded-full animate-spin" /></div>}>
            <BookingPageInner />
        </Suspense>
    );
}

function SummaryItem({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
            <span className="material-symbols-outlined text-[#3C81C6] mt-0.5" style={{ fontSize: "18px" }}>{icon}</span>
            <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-gray-900">{value}</p>
            </div>
        </div>
    );
}
