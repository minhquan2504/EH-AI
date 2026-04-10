"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { MOCK_DEPARTMENTS } from "@/lib/mock-data/admin";
import { DEPARTMENT_STATUS } from "@/constants/status";
import type { Department } from "@/types";

const TABS = [
    { key: "info", label: "Thông tin", icon: "info" },
    { key: "staff", label: "Nhân sự", icon: "groups" },
];

// Mock doctors for the department
const MOCK_DEPT_DOCTORS = [
    { id: "1", name: "BS. Nguyễn Văn An", position: "Trưởng khoa", specialization: "Nội tổng quát", experience: 15, status: "active", avatar: null },
    { id: "2", name: "BS. Trần Thị Bình", position: "Phó khoa", specialization: "Tim mạch", experience: 12, status: "active", avatar: null },
    { id: "3", name: "BS. Lê Văn Cường", position: "Bác sĩ điều trị", specialization: "Nội tổng quát", experience: 8, status: "active", avatar: null },
    { id: "4", name: "BS. Phạm Thị Dung", position: "Bác sĩ điều trị", specialization: "Siêu âm tim", experience: 6, status: "on_leave", avatar: null },
    { id: "5", name: "BS. Hoàng Văn Em", position: "Bác sĩ nội trú", specialization: "Nội tổng quát", experience: 2, status: "active", avatar: null },
];

const MOCK_EQUIPMENT = [
    { name: "Máy siêu âm GE Vivid", quantity: 2, status: "active" },
    { name: "Máy điện tim 12 cần", quantity: 3, status: "active" },
    { name: "Máy đo SpO2", quantity: 5, status: "active" },
    { name: "Máy monitor theo dõi", quantity: 8, status: "maintenance" },
    { name: "Máy thở CPAP", quantity: 2, status: "active" },
];

export default function DepartmentDetailPage() {
    const router = useRouter();
    const params = useParams();
    const deptId = params.id as string;
    const [activeTab, setActiveTab] = useState("info");
    const [department, setDepartment] = useState<Department | null>(null);

    useEffect(() => {
        const found = MOCK_DEPARTMENTS.find((d) => d.id === deptId);
        setDepartment(found || null);
    }, [deptId]);

    if (!department) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">domain_disabled</span>
                <p className="text-lg text-gray-500 mb-4">Không tìm thấy chuyên khoa</p>
                <button onClick={() => router.back()} className="px-5 py-2.5 bg-[#3C81C6] text-white rounded-xl text-sm font-bold hover:bg-[#2a6da8] transition-colors">Quay lại</button>
            </div>
        );
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case DEPARTMENT_STATUS.ACTIVE: return { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", dot: "bg-green-500", label: "Hoạt động" };
            case DEPARTMENT_STATUS.INACTIVE: return { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-600 dark:text-gray-400", dot: "bg-gray-400", label: "Tạm ngưng" };
            case DEPARTMENT_STATUS.MAINTENANCE: return { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", dot: "bg-orange-500", label: "Bảo trì" };
            default: return { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400", label: status };
        }
    };

    const statusStyle = getStatusStyle(department.status);
    const loadPercent = department.capacity ? Math.min(100, Math.round(((department.appointmentToday || 0) / department.capacity) * 100)) : 0;

    return (
        <>
            {/* Breadcrumb + Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/admin/departments" className="hover:text-[#3C81C6] transition-colors">Chuyên khoa</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">{department.name}</span>
                </div>
                <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    Quay lại
                </button>
            </div>

            {/* Header Card */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm overflow-hidden">
                <div className="h-28 bg-gradient-to-r from-[#3C81C6] via-[#60a5fa] to-[#93c5fd] relative">
                    <div className="absolute -bottom-10 left-8">
                        <div className="w-20 h-20 rounded-2xl bg-white dark:bg-[#1e242b] border-4 border-white dark:border-[#1e242b] shadow-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl text-[#3C81C6]">{department.icon || "local_hospital"}</span>
                        </div>
                    </div>
                </div>
                <div className="pt-14 pb-4 px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-black text-[#121417] dark:text-white">{department.name}</h1>
                            <p className="text-sm text-[#687582] dark:text-gray-400 mt-0.5">{department.code} {department.location && `• ${department.location}`}</p>
                            <div className="flex items-center gap-3 mt-2">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                                    {statusStyle.label}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Tabs */}
                <div className="px-8 border-t border-[#dde0e4] dark:border-[#2d353e]">
                    <div className="flex gap-1 -mb-px">
                        {TABS.map((tab) => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all ${activeTab === tab.key
                                    ? "border-[#3C81C6] text-[#3C81C6]"
                                    : "border-transparent text-[#687582] hover:text-[#3C81C6] hover:border-gray-300"
                                }`}>
                                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="stethoscope" iconBg="bg-blue-50 dark:bg-blue-900/20 text-blue-600" label="Bác sĩ" value={department.doctorCount} />
                <StatCard icon="personal_injury" iconBg="bg-teal-50 dark:bg-teal-900/20 text-teal-600" label="Bệnh nhân hôm nay" value={department.patientCount || 0} />
                <StatCard icon="event_seat" iconBg="bg-purple-50 dark:bg-purple-900/20 text-purple-600" label="Sức chứa" value={department.capacity || 0} />
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-[#687582] dark:text-gray-400">Tải hiện tại</p>
                        <p className="text-sm font-bold text-[#121417] dark:text-white">{loadPercent}%</p>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div className={`h-3 rounded-full transition-all ${loadPercent > 80 ? "bg-red-500" : loadPercent > 50 ? "bg-orange-500" : "bg-green-500"}`} style={{ width: `${loadPercent}%` }} />
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === "info" && <InfoTab department={department} />}
            {activeTab === "staff" && <StaffTab />}
        </>
    );
}

function StatCard({ icon, iconBg, label, value }: { icon: string; iconBg: string; label: string; value: number }) {
    return (
        <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBg}`}>
                <span className="material-symbols-outlined">{icon}</span>
            </div>
            <div>
                <p className="text-sm text-[#687582] dark:text-gray-400">{label}</p>
                <p className="text-xl font-bold text-[#121417] dark:text-white">{value}</p>
            </div>
        </div>
    );
}

function InfoTab({ department }: { department: Department }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mô tả */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">description</span>
                    Mô tả
                </h2>
                <p className="text-sm text-[#687582] dark:text-gray-400 leading-relaxed">
                    {department.description || "Khoa chuyên khám và điều trị các bệnh lý liên quan. Đội ngũ bác sĩ giàu kinh nghiệm với trang thiết bị y tế hiện đại, đảm bảo chất lượng khám chữa bệnh tốt nhất cho bệnh nhân."}
                </p>

                <h3 className="text-sm font-bold text-[#121417] dark:text-white mt-6 mb-3">Dịch vụ</h3>
                <div className="flex flex-wrap gap-2">
                    {["Khám tổng quát", "Siêu âm", "Xét nghiệm", "Tư vấn chuyên khoa", "Khám sức khỏe định kỳ"].map((svc) => (
                        <span key={svc} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-[#687582] dark:text-gray-400">
                            {svc}
                        </span>
                    ))}
                </div>
            </div>

            {/* Trang thiết bị */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">devices</span>
                    Trang thiết bị
                </h2>
                <div className="space-y-3">
                    {MOCK_EQUIPMENT.map((eq, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#3C81C6]/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[16px] text-[#3C81C6]">medical_services</span>
                                </div>
                                <span className="text-sm font-medium text-[#121417] dark:text-white">{eq.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-[#687582]">SL: {eq.quantity}</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${eq.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"}`}>
                                    {eq.status === "active" ? "Hoạt động" : "Bảo trì"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StaffTab() {
    return (
        <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#dde0e4] dark:border-[#2d353e] flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">groups</span>
                    Danh sách nhân sự ({MOCK_DEPT_DOCTORS.length})
                </h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-[#dde0e4] dark:border-[#2d353e]">
                        <tr>
                            <th className="py-3 px-6 text-xs font-semibold text-[#687582] uppercase">Bác sĩ</th>
                            <th className="py-3 px-6 text-xs font-semibold text-[#687582] uppercase">Chức vụ</th>
                            <th className="py-3 px-6 text-xs font-semibold text-[#687582] uppercase">Chuyên ngành</th>
                            <th className="py-3 px-6 text-xs font-semibold text-[#687582] uppercase">Kinh nghiệm</th>
                            <th className="py-3 px-6 text-xs font-semibold text-[#687582] uppercase">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dde0e4] dark:divide-[#2d353e]">
                        {MOCK_DEPT_DOCTORS.map((doc) => (
                            <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#3C81C6]/10 flex items-center justify-center text-[#3C81C6]">
                                            <span className="material-symbols-outlined">person</span>
                                        </div>
                                        <span className="text-sm font-bold text-[#121417] dark:text-white">{doc.name}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <span className={`text-sm font-medium ${doc.position.includes("Trưởng") ? "text-[#3C81C6]" : "text-[#121417] dark:text-white"}`}>
                                        {doc.position}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-sm text-[#687582] dark:text-gray-400">{doc.specialization}</td>
                                <td className="py-4 px-6 text-sm text-[#121417] dark:text-white">{doc.experience} năm</td>
                                <td className="py-4 px-6">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${doc.status === "active" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${doc.status === "active" ? "bg-green-500" : "bg-orange-500"}`} />
                                        {doc.status === "active" ? "Đang làm" : "Nghỉ phép"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
