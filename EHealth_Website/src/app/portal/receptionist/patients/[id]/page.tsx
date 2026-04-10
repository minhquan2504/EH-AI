"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPatientDetail } from "@/services/patientService";

const MOCK_PATIENT = {
    id: "BN001", name: "Nguyễn Văn An", dob: "15/03/1980", age: 45, gender: "Nam",
    phone: "0901234567", email: "an.nguyen@email.com", cccd: "012345678901",
    address: "123 Nguyễn Huệ, P. Bến Nghé, Q.1, TP.HCM",
    insurance: "HC4012345678", insuranceExpiry: "31/12/2025",
    bloodType: "O+", allergies: "Penicillin", chronicDiseases: "Tăng huyết áp, Tiểu đường type 2",
    emergencyContact: "Nguyễn Thị Lan - 0912345678 (Vợ)",
    status: "active", registeredDate: "15/01/2023",
};

const MOCK_VISITS = [
    { id: "KH001", date: "20/02/2025", doctor: "BS. Trần Văn Minh", department: "Tim mạch", diagnosis: "Tăng huyết áp - I10", status: "completed" },
    { id: "KH002", date: "15/01/2025", doctor: "BS. Lê Thị Hoa", department: "Nội tiết", diagnosis: "Tiểu đường type 2 - E11", status: "completed" },
    { id: "KH003", date: "10/12/2024", doctor: "BS. Trần Văn Minh", department: "Tim mạch", diagnosis: "Kiểm tra định kỳ", status: "completed" },
    { id: "KH004", date: "05/11/2024", doctor: "BS. Phạm Chí Thanh", department: "Nội tổng quát", diagnosis: "Viêm dạ dày - K29", status: "completed" },
];

const MOCK_PRESCRIPTIONS = [
    { id: "DT001", date: "20/02/2025", doctor: "BS. Trần Văn Minh", medicines: "Amlodipine 5mg, Metformin 500mg", status: "dispensed" },
    { id: "DT002", date: "15/01/2025", doctor: "BS. Lê Thị Hoa", medicines: "Metformin 500mg, Glimepiride 2mg", status: "dispensed" },
];

const MOCK_DOCUMENTS = [
    { id: "TL001", name: "Kết quả xét nghiệm máu", type: "Xét nghiệm", date: "20/02/2025", size: "1.2 MB" },
    { id: "TL002", name: "X-quang ngực", type: "Hình ảnh", date: "15/01/2025", size: "3.5 MB" },
    { id: "TL003", name: "Siêu âm bụng", type: "Hình ảnh", date: "10/12/2024", size: "2.8 MB" },
];

export default function PatientDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("info");
    const [patient, setPatient] = useState(MOCK_PATIENT);

    useEffect(() => {
        if (!params.id) return;
        getPatientDetail(params.id)
            .then(res => {
                const d = res?.data as any;
                if (d) setPatient({
                    id: d.patient_code ?? d.patient_id ?? params.id,
                    name: d.full_name ?? "",
                    dob: d.date_of_birth ?? "",
                    age: d.date_of_birth ? new Date().getFullYear() - new Date(d.date_of_birth).getFullYear() : 0,
                    gender: d.gender === "MALE" ? "Nam" : d.gender === "FEMALE" ? "Nữ" : d.gender ?? "",
                    phone: d.contact?.phone_number ?? "",
                    email: d.contact?.email ?? "",
                    cccd: d.identity_number ?? "",
                    address: d.contact?.street_address ?? "",
                    insurance: d.insurance_number ?? "",
                    insuranceExpiry: d.insurance_expiry ?? "",
                    bloodType: d.blood_type ?? "",
                    allergies: d.allergies ?? "",
                    chronicDiseases: d.chronic_diseases ?? "",
                    emergencyContact: d.emergency_contact ?? "",
                    status: d.status?.toLowerCase() ?? "active",
                    registeredDate: d.created_at?.split("T")[0] ?? "",
                });
            })
            .catch(() => {/* keep mock */});
    }, [params.id]);

    const tabs = [
        { key: "info", label: "Thông tin", icon: "person" },
        { key: "history", label: "Lịch sử khám", icon: "history" },
        { key: "prescriptions", label: "Đơn thuốc", icon: "medication" },
        { key: "documents", label: "Tài liệu", icon: "folder" },
    ];

    return (
        <div className="p-6 md:p-8"><div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-[#687582]">arrow_back</span>
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-[#121417] dark:text-white">{patient.name}</h1>
                    <p className="text-sm text-[#687582]">Mã BN: {patient.id} • {patient.gender} • {patient.age} tuổi</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${patient.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {patient.status === "active" ? "Đang theo dõi" : "Ngưng"}
                </span>
            </div>

            {/* Patient Quick Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { icon: "call", label: "Điện thoại", value: patient.phone },
                    { icon: "badge", label: "CCCD", value: patient.cccd },
                    { icon: "health_and_safety", label: "BHYT", value: patient.insurance || "Không có" },
                    { icon: "bloodtype", label: "Nhóm máu", value: patient.bloodType },
                ].map((item) => (
                    <div key={item.label} className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400" style={{ fontSize: "20px" }}>{item.icon}</span>
                        </div>
                        <div>
                            <p className="text-xs text-[#687582]">{item.label}</p>
                            <p className="text-sm font-semibold text-[#121417] dark:text-white">{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                <div className="flex border-b border-[#dde0e4] dark:border-[#2d353e] overflow-x-auto">
                    {tabs.map((tab) => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key
                                    ? "border-[#3C81C6] text-[#3C81C6]"
                                    : "border-transparent text-[#687582] hover:text-[#121417] dark:hover:text-white"
                                }`}>
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {/* Tab: Thông tin */}
                    {activeTab === "info" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-[#121417] dark:text-white uppercase tracking-wider">Thông tin cá nhân</h3>
                                {[
                                    { l: "Họ tên", v: patient.name }, { l: "Ngày sinh", v: patient.dob },
                                    { l: "Giới tính", v: patient.gender }, { l: "CCCD/CMND", v: patient.cccd },
                                    { l: "Số điện thoại", v: patient.phone }, { l: "Email", v: patient.email },
                                    { l: "Địa chỉ", v: patient.address },
                                ].map((f) => (
                                    <div key={f.l} className="flex items-start gap-2">
                                        <span className="text-sm text-[#687582] w-32 flex-shrink-0">{f.l}:</span>
                                        <span className="text-sm font-medium text-[#121417] dark:text-white">{f.v}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-[#121417] dark:text-white uppercase tracking-wider">Thông tin y tế</h3>
                                {[
                                    { l: "Nhóm máu", v: patient.bloodType },
                                    { l: "Dị ứng", v: patient.allergies, danger: true },
                                    { l: "Bệnh mãn tính", v: patient.chronicDiseases },
                                    { l: "Số BHYT", v: patient.insurance }, { l: "Hạn BHYT", v: patient.insuranceExpiry },
                                    { l: "LH khẩn cấp", v: patient.emergencyContact },
                                    { l: "Ngày đăng ký", v: patient.registeredDate },
                                ].map((f) => (
                                    <div key={f.l} className="flex items-start gap-2">
                                        <span className="text-sm text-[#687582] w-32 flex-shrink-0">{f.l}:</span>
                                        <span className={`text-sm font-medium ${"danger" in f && f.danger ? "text-red-600" : "text-[#121417] dark:text-white"}`}>{f.v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tab: Lịch sử khám */}
                    {activeTab === "history" && (
                        <div className="space-y-3">
                            {MOCK_VISITS.map((v) => (
                                <div key={v.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#f6f7f8] dark:bg-[#13191f] hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-blue-600" style={{ fontSize: "20px" }}>stethoscope</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-[#121417] dark:text-white">{v.diagnosis}</p>
                                        <p className="text-xs text-[#687582]">{v.doctor} • {v.department}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-sm text-[#121417] dark:text-white">{v.date}</p>
                                        <span className="text-xs text-green-600">Hoàn thành</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tab: Đơn thuốc */}
                    {activeTab === "prescriptions" && (
                        <div className="space-y-3">
                            {MOCK_PRESCRIPTIONS.map((p) => (
                                <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#f6f7f8] dark:bg-[#13191f]">
                                    <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-teal-600" style={{ fontSize: "20px" }}>medication</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-[#121417] dark:text-white">{p.medicines}</p>
                                        <p className="text-xs text-[#687582]">{p.doctor} • Mã đơn: {p.id}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-sm text-[#121417] dark:text-white">{p.date}</p>
                                        <span className="text-xs text-green-600">Đã cấp phát</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tab: Tài liệu */}
                    {activeTab === "documents" && (
                        <div>
                            <div className="flex justify-end mb-4">
                                <button className="flex items-center gap-2 px-4 py-2 bg-[#3C81C6] text-white rounded-lg text-sm font-medium hover:bg-[#2a6da8] transition-colors">
                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>upload_file</span>
                                    Tải lên tài liệu
                                </button>
                            </div>
                            <div className="space-y-3">
                                {MOCK_DOCUMENTS.map((d) => (
                                    <div key={d.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#f6f7f8] dark:bg-[#13191f]">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-orange-600" style={{ fontSize: "20px" }}>description</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-[#121417] dark:text-white">{d.name}</p>
                                            <p className="text-xs text-[#687582]">{d.type} • {d.size}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-[#687582]">{d.date}</span>
                                            <button className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-[#687582]" title="Tải xuống">
                                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>download</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div></div>
    );
}
