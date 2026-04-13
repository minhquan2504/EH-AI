"use client";

import { useState, useEffect } from "react";
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


export default function AdminDashboard() {
    usePageAIContext({ pageKey: 'admin-dashboard' });
    const [stats, setStats] = useState<any>(null);
    const [patientGrowth, setPatientGrowth] = useState<any[]>([]);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [doctorDistribution, setDoctorDistribution] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [patientQueue, setPatientQueue] = useState<any[]>([]);
    const [medicineAlerts, setMedicineAlerts] = useState<any[]>([]);
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
            .catch(() => { /* API không khả dụng, hiển thị trống */ });
    }, []);

    return (
        <div className="space-y-4">
            <h1 className="sr-only">Bảng điều khiển quản trị</h1>
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
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">inbox</span>
                            <p className="text-sm text-[#687582] dark:text-gray-400">Chưa có dữ liệu</p>
                        </div>
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
                    <div className="p-5 flex flex-col items-center justify-center py-10 text-center">
                        <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">inbox</span>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Chưa có dữ liệu</p>
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

