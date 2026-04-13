"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { PatientNavbar } from "@/components/patient/PatientNavbar";
import { PatientFooter } from "@/components/patient/PatientFooter";
import { TimeSlotPicker } from "@/components/patient/TimeSlotPicker";
import { doctorService, type Doctor } from "@/services/doctorService";

const TABS = [
    { id: "about", label: "Giới thiệu", icon: "person" },
    { id: "schedule", label: "Lịch khám", icon: "calendar_month" },
    { id: "reviews", label: "Đánh giá", icon: "star" },
    { id: "services", label: "Dịch vụ", icon: "medical_services" },
];

export default function DoctorDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("about");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");

    useEffect(() => {
        if (id) loadDoctor();
    }, [id]);

    const loadDoctor = async () => {
        try {
            setLoading(true);
            const doc = await doctorService.getById(id);
            if (doc && doc.id) {
                setDoctor(doc);
            } else {
                setDoctor(null);
            }
        } catch {
            setDoctor(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/50">
                <PatientNavbar />
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="animate-pulse">
                        <div className="flex gap-6">
                            <div className="w-40 h-48 rounded-2xl bg-gray-200" />
                            <div className="flex-1 space-y-3">
                                <div className="h-6 bg-gray-200 rounded w-1/3" />
                                <div className="h-4 bg-gray-100 rounded w-1/4" />
                                <div className="h-4 bg-gray-100 rounded w-1/2" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!doctor) {
        return (
            <div className="min-h-screen bg-gray-50/50">
                <PatientNavbar />
                <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                    <span className="material-symbols-outlined text-gray-300 mb-4" style={{ fontSize: "80px" }}>person_off</span>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy bác sĩ</h2>
                    <p className="text-gray-500 mb-6">Bác sĩ không tồn tại hoặc đã bị xoá khỏi hệ thống.</p>
                    <Link href="/doctors" className="px-6 py-3 bg-[#3C81C6] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
                        ← Quay lại danh sách
                    </Link>
                </div>
                <PatientFooter />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <PatientNavbar />

            {/* Hero section */}
            <section className="relative bg-gradient-to-br from-[#0a1628] via-[#0f2744] to-[#1a3a5c] pt-8 pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#3C81C6]/15 rounded-full blur-[100px]" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link href="/doctors" className="inline-flex items-center gap-1.5 text-[#60a5fa] text-sm font-medium hover:text-white transition-colors mb-6">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span>
                        Quay lại danh sách bác sĩ
                    </Link>
                </div>
            </section>

            {/* Doctor profile card — overlapping hero */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                        {/* Profile card */}
                        <div className="bg-white rounded-2xl shadow-xl shadow-black/[0.04] border border-gray-100 p-6 md:p-8 mb-6">
                            <div className="flex flex-col sm:flex-row gap-6">
                                {/* Avatar */}
                                <div className="relative w-32 h-40 sm:w-36 sm:h-44 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 flex-shrink-0 mx-auto sm:mx-0">
                                    {doctor.avatar ? (
                                        <Image src={doctor.avatar} alt={doctor.fullName} fill className="object-cover" sizes="144px" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#3C81C6]/10 to-[#60a5fa]/10">
                                            <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "56px" }}>person</span>
                                        </div>
                                    )}
                                    <div className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-white ${doctor.status === "active" ? "bg-green-500" : "bg-gray-400"}`} />
                                </div>

                                {/* Info */}
                                <div className="flex-1 text-center sm:text-left">
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{doctor.fullName}</h1>
                                    {doctor.qualification && <p className="text-[#3C81C6] font-semibold text-sm mb-2">{doctor.qualification}</p>}
                                    <p className="text-gray-500 text-sm mb-4">{doctor.departmentName}</p>

                                    <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start mb-4">
                                        {doctor.experience && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>work_history</span>
                                                {doctor.experience} năm kinh nghiệm
                                            </span>
                                        )}
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-lg">
                                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>star</span>
                                            {doctor.rating?.toFixed(1) || "4.8"} ({150} đánh giá)
                                        </span>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg ${doctor.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{doctor.status === "active" ? "check_circle" : "cancel"}</span>
                                            {doctor.status === "active" ? "Đang hoạt động" : "Tạm nghỉ"}
                                        </span>
                                    </div>

                                    {/* CTA */}
                                    <div className="flex items-center gap-3 justify-center sm:justify-start">
                                        <Link href={`/booking?doctorId=${id}`}
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#3C81C6] to-[#2563eb] text-white font-semibold rounded-xl shadow-lg shadow-[#3C81C6]/25 hover:shadow-xl hover:shadow-[#3C81C6]/30 transition-all active:scale-[0.97]">
                                            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>calendar_month</span>
                                            Đặt lịch ngay
                                        </Link>
                                        <a href="tel:02812345678" className="inline-flex items-center gap-2 px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                                            <span className="material-symbols-outlined text-green-500" style={{ fontSize: "20px" }}>call</span>
                                            Gọi tư vấn
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="flex border-b border-gray-100 overflow-x-auto">
                                {TABS.map(tab => (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                                        ${activeTab === tab.id ? "border-[#3C81C6] text-[#3C81C6]" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{tab.icon}</span>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6">
                                {activeTab === "about" && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-3">Giới thiệu</h3>
                                            <p className="text-gray-600 text-sm leading-relaxed">
                                                {doctor.fullName} là chuyên gia hàng đầu tại khoa {doctor.departmentName} với {doctor.experience || 15}+ năm kinh nghiệm trong lĩnh vực {doctor.specialization || doctor.departmentName}.
                                                Bác sĩ đã điều trị thành công cho hàng nghìn bệnh nhân và được đánh giá cao bởi sự tận tâm và chuyên môn vững vàng.
                                            </p>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-3">Chuyên môn chính</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {(doctor.specialization || "Khám tổng quát,Tư vấn chuyên sâu,Điều trị nội khoa").split(",").map(s => (
                                                    <span key={s} className="px-3 py-1.5 bg-[#3C81C6]/[0.06] text-[#3C81C6] text-sm font-medium rounded-lg">{s.trim()}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-3">Học vấn & Chứng chỉ</h3>
                                            <ul className="space-y-2.5">
                                                {["Tốt nghiệp Đại học Y Dược TP.HCM", "Bác sĩ chuyên khoa II", "Chứng chỉ hành nghề Bộ Y tế"].map(item => (
                                                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                                                        <span className="material-symbols-outlined text-green-500 mt-0.5" style={{ fontSize: "16px" }}>check_circle</span>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "schedule" && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Lịch khám & khung giờ</h3>
                                        <TimeSlotPicker
                                            selectedDate={selectedDate}
                                            onDateChange={setSelectedDate}
                                            selectedTime={selectedTime}
                                            onTimeChange={setSelectedTime}
                                        />
                                        {selectedDate && selectedTime && (
                                            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-green-800">Bạn đã chọn: {selectedDate} lúc {selectedTime}</p>
                                                    <p className="text-xs text-green-600 mt-0.5">Nhấn &quot;Đặt lịch&quot; để tiếp tục</p>
                                                </div>
                                                <Link href={`/booking?doctorId=${id}&date=${selectedDate}&time=${selectedTime}`}
                                                    className="px-5 py-2.5 bg-green-600 text-white font-semibold text-sm rounded-xl hover:bg-green-700 transition-colors active:scale-[0.97]">
                                                    Đặt lịch →
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === "reviews" && (
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-bold text-gray-900">Đánh giá bệnh nhân</h3>
                                            <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg">
                                                <span className="material-symbols-outlined text-amber-500" style={{ fontSize: "18px" }}>star</span>
                                                <span className="text-lg font-bold text-amber-700">{doctor.rating?.toFixed(1) || "4.8"}</span>
                                                <span className="text-xs text-amber-600">/5</span>
                                            </div>
                                        </div>
                                        <div className="text-center py-12 text-gray-400">
                                            <span className="material-symbols-outlined mb-2" style={{ fontSize: "48px" }}>rate_review</span>
                                            <p className="text-sm">Chưa có đánh giá nào được hiển thị</p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "services" && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Dịch vụ & Gói khám</h3>
                                        <div className="space-y-3">
                                            {[
                                                { name: "Khám chuyên khoa", price: "400.000đ", desc: "Khám và tư vấn chuyên sâu" },
                                                { name: "Khám tổng quát", price: "1.500.000đ", desc: "Khám sức khoẻ toàn diện + xét nghiệm cơ bản" },
                                                { name: "Tư vấn online", price: "250.000đ", desc: "Tư vấn qua video call 30 phút" },
                                            ].map(svc => (
                                                <div key={svc.name} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-[#3C81C6]/20 transition-colors">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 text-sm">{svc.name}</h4>
                                                        <p className="text-xs text-gray-500 mt-0.5">{svc.desc}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-bold text-[#3C81C6]">{svc.price}</span>
                                                        <Link href={`/booking?doctorId=${id}`}
                                                            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#3C81C6] rounded-lg hover:bg-[#2a6da8] transition-colors">
                                                            Đặt lịch
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <aside className="w-full lg:w-80 flex-shrink-0">
                        <div className="sticky top-24 space-y-4">
                            {/* Quick booking card */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>event_available</span>
                                    Đặt lịch nhanh
                                </h3>
                                <Link href={`/booking?doctorId=${id}`}
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[#3C81C6] to-[#2563eb] text-white font-semibold rounded-xl shadow-md shadow-[#3C81C6]/20 hover:shadow-lg transition-all active:scale-[0.97] mb-3">
                                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>calendar_month</span>
                                    Chọn lịch ngay
                                </Link>
                                <a href="tel:02812345678" className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                                    <span className="material-symbols-outlined text-green-500" style={{ fontSize: "18px" }}>call</span>
                                    (028) 1234 5678
                                </a>
                            </div>

                            {/* Info card */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "20px" }}>payments</span>
                                    <div>
                                        <p className="text-xs text-gray-500">Giá khám</p>
                                        <p className="text-sm font-bold text-gray-900">400.000 — 500.000đ</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "20px" }}>location_on</span>
                                    <div>
                                        <p className="text-xs text-gray-500">Địa điểm khám</p>
                                        <p className="text-sm font-semibold text-gray-900">EHealth Hospital</p>
                                        <p className="text-xs text-gray-400">123 Nguyễn Văn Linh, Q.7, TP.HCM</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "20px" }}>schedule</span>
                                    <div>
                                        <p className="text-xs text-gray-500">Giờ làm việc</p>
                                        <p className="text-sm text-gray-700">T2 — T6: 7:00 — 17:00</p>
                                        <p className="text-sm text-gray-700">T7: 7:00 — 12:00</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            <div className="mt-12">
                <PatientFooter />
            </div>
        </div>
    );
}
