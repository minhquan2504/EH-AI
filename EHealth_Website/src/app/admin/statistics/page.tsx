"use client";

import { useState, useMemo, useEffect } from "react";
import {
    TopDiseasesChart,
    GenderDistribution,
    HourlyVisitsChart,
} from "@/components/admin/dashboard";
import { reportService } from "@/services/reportService";
import { unwrap } from "@/api/response";
import { usePageAIContext } from "@/hooks/usePageAIContext";

const EMPTY_SUMMARY = { revenue: 0, revenueChange: 0, patients: 0, patientsChange: 0, avgVisit: 0, visitChange: 0, rating: 0, ratingTrend: "flat" };

type Period = "month" | "quarter" | "year";

/* ──────────────────────────────────────────────────────────────
   COMPONENT
   ────────────────────────────────────────────────────────────── */
export default function StatisticsPage() {
    usePageAIContext({ pageKey: 'statistics' });
    const [timeRange, setTimeRange] = useState<Period>("month");
    const [summary, setSummary] = useState(EMPTY_SUMMARY);
    const [chartData, setChartData] = useState<{ label: string; value: number }[]>([]);
    const [departments, setDepartments] = useState<{ name: string; patients: number; revenue: number; color: string }[]>([]);
    const [topDoctors, setTopDoctors] = useState<{ name: string; dept: string; patients: number; rating: number }[]>([]);

    useEffect(() => {
        reportService.getDashboard()
            .then((res: any) => {
                const d = unwrap<any>(res);
                if (!d) return;
                const revenue       = Number(d.totalRevenue ?? d.revenue ?? 0) / 1_000_000;
                const patients      = Number(d.totalPatients ?? d.patients ?? 0);
                const avgVisit      = Number(d.avgDailyVisits ?? d.avgVisit ?? 0);
                const revenueChange = Number(d.revenueGrowth ?? d.revenueChange ?? 0);
                const patChange     = Number(d.patientGrowth ?? d.patientChange ?? 0);
                const visitChange   = Number(d.visitGrowth ?? d.visitChange ?? 0);
                if (revenue > 0 || patients > 0) {
                    setSummary(prev => ({
                        ...prev,
                        ...(revenue  > 0 ? { revenue }        : {}),
                        ...(patients > 0 ? { patients }       : {}),
                        ...(avgVisit > 0 ? { avgVisit }       : {}),
                        ...(revenueChange !== 0 ? { revenueChange } : {}),
                        ...(patChange     !== 0 ? { patientsChange: patChange } : {}),
                        ...(visitChange   !== 0 ? { visitChange }   : {}),
                    }));
                }
            })
            .catch(() => { /* API không khả dụng */ });

        reportService.getRevenue({ period: timeRange })
            .then((res: any) => {
                const d = unwrap<any>(res);
                if (!d) return;
                if (Array.isArray(d.byDepartment) && d.byDepartment.length > 0) {
                    const DEPT_COLORS = ["#3C81C6", "#22c55e", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6"];
                    setDepartments(d.byDepartment.map((dep: any, i: number) => ({
                        name: dep.departmentName ?? dep.name ?? "",
                        patients: Number(dep.patientCount ?? dep.patients ?? 0),
                        revenue: Number(dep.revenue ?? dep.amount ?? 0) / 1_000_000,
                        color: DEPT_COLORS[i % DEPT_COLORS.length],
                    })));
                }
                if (Array.isArray(d.chartData) && d.chartData.length > 0) {
                    setChartData(d.chartData.map((c: any) => ({ label: c.label ?? "", value: Number(c.value ?? 0) })));
                }
                if (Array.isArray(d.topDoctors) && d.topDoctors.length > 0) {
                    setTopDoctors(d.topDoctors.map((doc: any) => ({
                        name: doc.name ?? doc.fullName ?? "",
                        dept: doc.department ?? doc.dept ?? "",
                        patients: Number(doc.patientCount ?? doc.patients ?? 0),
                        rating: Number(doc.rating ?? 0),
                    })));
                }
            })
            .catch(() => { /* API không khả dụng */ });
    }, [timeRange]);

    const totalPatients = departments.reduce((s, d) => s + d.patients, 0);
    const maxChartValue = chartData.length > 0 ? Math.max(...chartData.map(d => d.value)) : 0;

    const periodLabel = timeRange === "month" ? "tháng trước" : timeRange === "quarter" ? "quý trước" : "năm trước";
    const chartTitle = timeRange === "month" ? "Doanh thu theo tháng (Triệu VND)" : timeRange === "quarter" ? "Doanh thu theo quý (Triệu VND)" : "Doanh thu theo năm (Triệu VND)";

    // Export handler — includes all current data
    const handleExport = () => {
        const periodName = timeRange === "month" ? "THÁNG" : timeRange === "quarter" ? "QUÝ" : "NĂM";
        const lines = [
            `BÁO CÁO THỐNG KÊ - THEO ${periodName}`,
            `Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`,
            "",
            `Tổng doanh thu: ${summary.revenue} Triệu VND`,
            `Tổng bệnh nhân: ${summary.patients.toLocaleString("vi-VN")}`,
            `Lượt khám TB/ngày: ${summary.avgVisit}`,
            `Đánh giá trung bình: ${summary.rating}/5`,
            "",
            "DOANH THU CHI TIẾT",
            "Kỳ,Doanh thu (Triệu VND)",
            ...chartData.map(d => `${d.label},${d.value}`),
            "",
            "PHÂN BỐ THEO KHOA",
            "Khoa,Bệnh nhân,Doanh thu (Triệu VND)",
            ...departments.map(d => `${d.name},${d.patients},${d.revenue}`),
            "",
            "TOP BÁC SĨ",
            "Bác sĩ,Khoa,Bệnh nhân,Đánh giá",
            ...topDoctors.map(d => `${d.name},${d.dept},${d.patients},${d.rating}`),
        ];
        const csv = lines.join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `thongke_${timeRange}_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <>
            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-[#121417] dark:text-white">
                        Thống kê & Báo cáo
                    </h1>
                    <p className="text-[#687582] dark:text-gray-400">
                        Tổng quan hoạt động và hiệu suất phòng khám
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Time range filter */}
                    <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {(["month", "quarter", "year"] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${timeRange === range ? "bg-[#3C81C6] text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                            >
                                {range === "month" ? "Tháng" : range === "quarter" ? "Quý" : "Năm"}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] text-[#121417] dark:text-white rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">download</span>
                        Xuất báo cáo
                    </button>
                </div>
            </div>

            {/* ── AI Insight Card ── */}
            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-[#3C81C6]/5 to-indigo-500/5 border border-[#3C81C6]/20 dark:border-[#3C81C6]/30 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3C81C6] to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-[#3C81C6]/20">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: "20px" }}>auto_awesome</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-1.5 mb-1">
                        AI phân tích thống kê
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#3C81C6] text-white rounded-md">AI</span>
                    </p>
                    <p className="text-sm text-[#374151] dark:text-[#d1d5db] leading-relaxed">
                        Doanh thu giảm 8% do giảm khám ngoại trú trong tháng. Khoa Tim mạch có tỷ lệ tái khám cao nhất (65%). <strong className="text-[#3C81C6]">Gợi ý:</strong> Tăng slot khám online và triển khai chương trình tái khám nhắc nhở tự động để cải thiện doanh thu.
                    </p>
                </div>
                <span className="text-xs text-[#687582] whitespace-nowrap">AI phân tích</span>
            </div>

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                    label="Tổng doanh thu"
                    value={summary.revenue >= 1000 ? `${(summary.revenue / 1000).toFixed(1)} Tỷ` : `${summary.revenue} Tr`}
                    change={`+${summary.revenueChange}% so với ${periodLabel}`}
                    changeColor="text-green-600"
                    icon="payments"
                    iconBg="bg-green-50 dark:bg-green-900/20"
                    iconColor="text-green-600"
                    trendIcon="trending_up"
                />
                <SummaryCard
                    label="Tổng bệnh nhân"
                    value={summary.patients.toLocaleString("vi-VN")}
                    change={`+${summary.patientsChange}% so với ${periodLabel}`}
                    changeColor="text-blue-600"
                    icon="group"
                    iconBg="bg-blue-50 dark:bg-blue-900/20"
                    iconColor="text-blue-600"
                    trendIcon="trending_up"
                />
                <SummaryCard
                    label="Lượt khám TB/ngày"
                    value={summary.avgVisit.toString()}
                    change={`+${summary.visitChange}% so với ${periodLabel}`}
                    changeColor="text-orange-600"
                    icon="vital_signs"
                    iconBg="bg-orange-50 dark:bg-orange-900/20"
                    iconColor="text-orange-600"
                    trendIcon="trending_up"
                />
                <SummaryCard
                    label="Đánh giá trung bình"
                    value={`${summary.rating}/5`}
                    change={summary.ratingTrend === "up" ? "+0.1 so với kỳ trước" : "Ổn định"}
                    changeColor={summary.ratingTrend === "up" ? "text-yellow-600" : "text-yellow-600"}
                    icon="star"
                    iconBg="bg-yellow-50 dark:bg-yellow-900/20"
                    iconColor="text-yellow-600"
                    trendIcon={summary.ratingTrend === "up" ? "trending_up" : "trending_flat"}
                />
            </div>

            {/* ── Analysis charts ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <TopDiseasesChart />
                <GenderDistribution />
                <HourlyVisitsChart />
            </div>

            {/* ── Revenue Chart + Department Distribution ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Bar Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-[#1e242b] p-6 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white">{chartTitle}</h3>
                        <span className="text-xs text-[#687582] px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            Tổng: {chartData.reduce((s, d) => s + d.value, 0).toLocaleString("vi-VN")} Tr
                        </span>
                    </div>
                    <div className="h-64 flex items-end justify-between gap-2">
                        {chartData.map((item, index) => (
                            <div key={item.label} className="group flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                <div className="relative w-full">
                                    <div
                                        className={`w-full rounded-t transition-all duration-500 ${index === chartData.length - 1 ? "bg-gradient-to-t from-[#3C81C6] to-[#60a5fa]" : "bg-[#3C81C6]/25 group-hover:bg-[#3C81C6]/60"}`}
                                        style={{ height: `${(item.value / maxChartValue) * 200}px` }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                            {item.value.toLocaleString("vi-VN")} Tr
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400 font-medium">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Department Distribution */}
                <div className="bg-white dark:bg-[#1e242b] p-6 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                    <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-6">Phân bố theo khoa</h3>
                    <div className="space-y-4">
                        {departments.map((dept) => (
                            <div key={dept.name} className="space-y-1.5">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-[#121417] dark:text-white">{dept.name}</span>
                                    <span className="text-[#687582]">{dept.patients.toLocaleString("vi-VN")} BN</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${(dept.patients / totalPatients) * 100}%`, backgroundColor: dept.color }}
                                    ></div>
                                </div>
                                <p className="text-[10px] text-[#687582]">Doanh thu: {dept.revenue} Tr</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Top Doctors Table ── */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e] flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#121417] dark:text-white">
                        Bác sĩ có hiệu suất cao nhất
                        <span className="text-xs font-normal text-[#687582] ml-2">
                            ({timeRange === "month" ? "Tháng này" : timeRange === "quarter" ? "Quý này" : "Năm nay"})
                        </span>
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-[#dde0e4] dark:border-[#2d353e]">
                            <tr>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">Xếp hạng</th>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">Bác sĩ</th>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">Khoa</th>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">Bệnh nhân</th>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">Đánh giá</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dde0e4] dark:divide-[#2d353e]">
                            {topDoctors.map((doc, index) => (
                                <tr key={doc.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="py-4 px-6">
                                        <span className={`w-8 h-8 rounded-full inline-flex items-center justify-center text-sm font-bold ${index === 0 ? "bg-yellow-100 text-yellow-700" : index === 1 ? "bg-gray-100 text-gray-600" : index === 2 ? "bg-orange-100 text-orange-700" : "bg-gray-50 text-gray-500"}`}>
                                            {index + 1}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#3C81C6]/10 flex items-center justify-center text-[#3C81C6]">
                                                <span className="material-symbols-outlined">person</span>
                                            </div>
                                            <span className="text-sm font-bold text-[#121417] dark:text-white">{doc.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-sm text-[#687582] dark:text-gray-400">{doc.dept}</td>
                                    <td className="py-4 px-6 text-sm font-semibold text-[#121417] dark:text-white">{doc.patients}</td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-yellow-500 text-[18px]">star</span>
                                            <span className="text-sm font-medium text-[#121417] dark:text-white">{doc.rating}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

/* ──────── Summary Card Component ──────── */
function SummaryCard({ label, value, change, changeColor, icon, iconBg, iconColor, trendIcon }: {
    label: string; value: string; change: string; changeColor: string;
    icon: string; iconBg: string; iconColor: string; trendIcon: string;
}) {
    return (
        <div className="bg-white dark:bg-[#1e242b] p-5 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-[#687582] dark:text-gray-400">{label}</p>
                    <p className="text-2xl font-bold text-[#121417] dark:text-white mt-1">{value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${iconBg} flex items-center justify-center ${iconColor}`}>
                    <span className="material-symbols-outlined">{icon}</span>
                </div>
            </div>
            <div className={`mt-3 flex items-center text-xs ${changeColor}`}>
                <span className="material-symbols-outlined text-[14px] mr-1">{trendIcon}</span>
                {change}
            </div>
        </div>
    );
}
