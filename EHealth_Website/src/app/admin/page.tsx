"use client";

import { useState, useEffect } from "react";
import {
    MOCK_DASHBOARD_STATS,
    MOCK_PATIENT_GROWTH,
    MOCK_REVENUE_DATA,
    MOCK_DOCTOR_DISTRIBUTION,
    MOCK_UPCOMING_APPOINTMENTS,
    MOCK_PATIENT_QUEUE,
    MOCK_MEDICINE_ALERTS_LIST,
} from "@/lib/mock-data/admin";

import {
    PageHeader,
    StatsCards,
    PatientGrowthChart,
    DepartmentStatus,
    PatientQueue,
    UpcomingAppointments,
    MedicineAlerts,
    RevenueChart,
} from "@/components/admin/dashboard";
import { reportService } from "@/services/reportService";
import { usePageAIContext } from "@/hooks/usePageAIContext";
import { AISystemMonitor, AIPredictiveAnalytics, AIStaffingOptimizer, AIRevenueInsight } from "@/components/portal/ai";

const ACTIVITY_FEED = [
    { time: "09:15", icon: "person_add", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20", text: "BN Nguyễn Văn An vừa được tiếp nhận" },
    { time: "09:10", icon: "check_circle", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20", text: "BS. Trần Minh hoàn thành khám ca #47" },
    { time: "09:05", icon: "medication", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20", text: "Đơn thuốc DT-003 đã cấp phát thành công" },
    { time: "08:55", icon: "warning", color: "text-red-500 bg-red-50 dark:bg-red-900/20", text: "Amoxicillin 500mg sắp hết tồn kho (45 viên)" },
    { time: "08:40", icon: "event_available", color: "text-violet-600 bg-violet-50 dark:bg-violet-900/20", text: "12 lịch hẹn mới được xác nhận cho ngày mai" },
    { time: "08:30", icon: "login", color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20", text: "DS. Trần Văn Dược đăng nhập ca sáng" },
];

const TOP_DISEASES = [
    { name: "Tăng huyết áp", count: 156, pct: 95 },
    { name: "Đái tháo đường type 2", count: 128, pct: 78 },
    { name: "Viêm phổi", count: 87, pct: 53 },
    { name: "Viêm dạ dày", count: 72, pct: 44 },
    { name: "Viêm khớp", count: 54, pct: 33 },
];

export default function AdminDashboard() {
    usePageAIContext({ pageKey: 'admin-dashboard' });
    const [stats, setStats] = useState(MOCK_DASHBOARD_STATS);
    const [patientGrowth, setPatientGrowth] = useState(MOCK_PATIENT_GROWTH);
    const [revenueData, setRevenueData] = useState(MOCK_REVENUE_DATA);
    const [doctorDistribution, setDoctorDistribution] = useState(MOCK_DOCTOR_DISTRIBUTION);
    const [appointments, setAppointments] = useState(MOCK_UPCOMING_APPOINTMENTS);
    const [patientQueue, setPatientQueue] = useState(MOCK_PATIENT_QUEUE);
    const [medicineAlerts, setMedicineAlerts] = useState(MOCK_MEDICINE_ALERTS_LIST);
    const [fillRate, setFillRate] = useState(82);

    useEffect(() => {
        reportService.getDashboard()
            .then((res: any) => {
                const d = res?.data ?? res;
                if (!d) return;
                if (d.stats) setStats((prev: any) => ({ ...prev, ...d.stats }));
                if (Array.isArray(d.patientGrowth) && d.patientGrowth.length > 0) setPatientGrowth(d.patientGrowth);
                if (Array.isArray(d.revenueData) && d.revenueData.length > 0) setRevenueData(d.revenueData);
                if (Array.isArray(d.departments) && d.departments.length > 0) setDoctorDistribution(d.departments);
                if (Array.isArray(d.upcomingAppointments) && d.upcomingAppointments.length > 0) setAppointments(d.upcomingAppointments);
                if (Array.isArray(d.patientQueue) && d.patientQueue.length > 0) setPatientQueue(d.patientQueue);
                if (Array.isArray(d.medicineAlerts) && d.medicineAlerts.length > 0) setMedicineAlerts(d.medicineAlerts);
                if (d.fillRate !== undefined) setFillRate(d.fillRate);
            })
            .catch(() => {/* keep mock */});
    }, []);

    return (
        <div className="space-y-4">
            <PageHeader />
            <StatsCards stats={stats} />

            {/* Row 2: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-7"><PatientGrowthChart data={patientGrowth} /></div>
                <div className="lg:col-span-5"><RevenueChart data={revenueData} /></div>
            </div>

            {/* Row 3: Activity Feed + Top Diseases + Fill Rate */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Activity Feed */}
                <div className="lg:col-span-5 bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                    <div className="px-5 py-3.5 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center gap-2.5">
                        <div className="p-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <span className="material-symbols-outlined text-green-600 text-[20px]">timeline</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[#121417] dark:text-white">Hoạt động gần đây</h3>
                            <p className="text-xs text-[#687582]">Real-time feed</p>
                        </div>
                        <span className="ml-auto flex items-center gap-1 text-[10px] text-green-600 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Live</span>
                    </div>
                    <div className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e] max-h-[320px] overflow-y-auto">
                        {ACTIVITY_FEED.map((a, i) => (
                            <div key={i} className="px-5 py-3 flex items-start gap-3 hover:bg-[#f6f7f8] dark:hover:bg-[#13191f] transition-colors">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${a.color}`}>
                                    <span className="material-symbols-outlined text-[16px]">{a.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-[#121417] dark:text-white">{a.text}</p>
                                    <p className="text-[10px] text-[#687582] mt-0.5">{a.time} hôm nay</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Diseases */}
                <div className="lg:col-span-4 bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                    <div className="px-5 py-3.5 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center gap-2.5">
                        <div className="p-1.5 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                            <span className="material-symbols-outlined text-rose-500 text-[20px]">analytics</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[#121417] dark:text-white">Top bệnh lý tháng</h3>
                            <p className="text-xs text-[#687582]">Thống kê chẩn đoán</p>
                        </div>
                    </div>
                    <div className="p-5 space-y-3.5">
                        {TOP_DISEASES.map((d, i) => (
                            <div key={d.name}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-[#121417] dark:text-white font-medium">{i + 1}. {d.name}</span>
                                    <span className="text-xs font-bold text-[#3C81C6]">{d.count}</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-gradient-to-r from-[#3C81C6] to-[#60a5fa] transition-all duration-1000" style={{ width: `${d.pct}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Appointment Fill Rate */}
                <div className="lg:col-span-3 bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex flex-col">
                    <div className="px-5 py-3.5 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center gap-2.5">
                        <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                            <span className="material-symbols-outlined text-indigo-600 text-[20px]">pie_chart</span>
                        </div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">Tỷ lệ lấp đầy</h3>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center p-5 gap-4">
                        <div className="relative w-32 h-32">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="42" fill="none" stroke="#f0f1f3" strokeWidth="10" className="dark:stroke-gray-800" />
                                <circle cx="50" cy="50" r="42" fill="none" stroke="url(#grad)" strokeWidth="10" strokeLinecap="round"
                                    strokeDasharray={`${fillRate * 2.64} ${264 - fillRate * 2.64}`} />
                                <defs><linearGradient id="grad"><stop stopColor="#3C81C6" /><stop offset="1" stopColor="#60a5fa" /></linearGradient></defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <p className="text-2xl font-black text-[#121417] dark:text-white">{fillRate}%</p>
                                    <p className="text-[10px] text-[#687582]">đã đặt</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-[#121417] dark:text-white font-medium">Lịch hẹn hôm nay</p>
                            <p className="text-xs text-[#687582]">41/50 slot đã được đặt</p>
                        </div>
                        <div className="w-full grid grid-cols-2 gap-2 mt-auto">
                            <div className="text-center p-2 bg-[#f6f7f8] dark:bg-[#13191f] rounded-lg">
                                <p className="text-base font-bold text-emerald-600">41</p>
                                <p className="text-[10px] text-[#687582]">Đã đặt</p>
                            </div>
                            <div className="text-center p-2 bg-[#f6f7f8] dark:bg-[#13191f] rounded-lg">
                                <p className="text-base font-bold text-amber-500">9</p>
                                <p className="text-[10px] text-[#687582]">Còn trống</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 4: Queue + Department */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <PatientQueue data={patientQueue} />
                <DepartmentStatus departments={doctorDistribution} />
            </div>

            {/* Row 5: Appointments + Medicine */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <UpcomingAppointments data={appointments} />
                <MedicineAlerts data={medicineAlerts} />
            </div>

            {/* Row 6: AI Dashboard Widgets (2x2) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <AISystemMonitor />
                <AIPredictiveAnalytics />
                <AIStaffingOptimizer />
                <AIRevenueInsight />
            </div>
        </div>
    );
}

