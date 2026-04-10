"use client";

import { useState, useMemo, useEffect } from "react";
import {
    TopDiseasesChart,
    GenderDistribution,
    HourlyVisitsChart,
} from "@/components/admin/dashboard";
import { reportService } from "@/services/reportService";
import { usePageAIContext } from "@/hooks/usePageAIContext";

/* ──────────────────────────────────────────────────────────────
   MOCK DATA — Đầy đủ cho 3 kỳ: Tháng, Quý, Năm
   ────────────────────────────────────────────────────────────── */

// ── Doanh thu theo từng tháng (Triệu VND) ──
const MONTHLY_ALL = [
    { label: "T1", value: 450 }, { label: "T2", value: 520 }, { label: "T3", value: 480 },
    { label: "T4", value: 610 }, { label: "T5", value: 580 }, { label: "T6", value: 720 },
    { label: "T7", value: 680 }, { label: "T8", value: 850 }, { label: "T9", value: 780 },
    { label: "T10", value: 920 }, { label: "T11", value: 880 }, { label: "T12", value: 1050 },
];

// ── Doanh thu theo quý ──
const QUARTERLY_ALL = [
    { label: "Q1/2024", value: 1450 },
    { label: "Q2/2024", value: 1910 },
    { label: "Q3/2024", value: 2310 },
    { label: "Q4/2024", value: 2850 },
];

// ── Doanh thu theo năm ──
const YEARLY_ALL = [
    { label: "2020", value: 4500 },
    { label: "2021", value: 5200 },
    { label: "2022", value: 6800 },
    { label: "2023", value: 7500 },
    { label: "2024", value: 8520 },
];

// ── Summary cards: dữ liệu thay đổi theo kỳ ──
const SUMMARY_DATA = {
    month: { revenue: 1050, revenueChange: 19.3, patients: 1240, patientsChange: 8.3, avgVisit: 56, visitChange: 5.2, rating: 4.8, ratingTrend: "flat" },
    quarter: { revenue: 2850, revenueChange: 23.4, patients: 3650, patientsChange: 12.1, avgVisit: 148, visitChange: 7.5, rating: 4.8, ratingTrend: "up" },
    year: { revenue: 8520, revenueChange: 13.6, patients: 14200, patientsChange: 9.8, avgVisit: 156, visitChange: 5.2, rating: 4.8, ratingTrend: "flat" },
};

// ── Khoa phân bố — thay đổi theo kỳ ──
const DEPT_BY_PERIOD = {
    month: [
        { name: "Khoa Nội", patients: 320, revenue: 120, color: "#3C81C6" },
        { name: "Khoa Ngoại", patients: 250, revenue: 140, color: "#22c55e" },
        { name: "Khoa Nhi", patients: 220, revenue: 75, color: "#f59e0b" },
        { name: "Khoa Sản", patients: 185, revenue: 95, color: "#ec4899" },
        { name: "Khoa Tim mạch", patients: 160, revenue: 165, color: "#8b5cf6" },
        { name: "Khoa Da liễu", patients: 105, revenue: 55, color: "#14b8a6" },
    ],
    quarter: [
        { name: "Khoa Nội", patients: 950, revenue: 340, color: "#3C81C6" },
        { name: "Khoa Ngoại", patients: 740, revenue: 395, color: "#22c55e" },
        { name: "Khoa Nhi", patients: 640, revenue: 210, color: "#f59e0b" },
        { name: "Khoa Sản", patients: 540, revenue: 285, color: "#ec4899" },
        { name: "Khoa Tim mạch", patients: 480, revenue: 470, color: "#8b5cf6" },
        { name: "Khoa Da liễu", patients: 300, revenue: 150, color: "#14b8a6" },
    ],
    year: [
        { name: "Khoa Nội", patients: 3800, revenue: 1350, color: "#3C81C6" },
        { name: "Khoa Ngoại", patients: 2960, revenue: 1560, color: "#22c55e" },
        { name: "Khoa Nhi", patients: 2550, revenue: 840, color: "#f59e0b" },
        { name: "Khoa Sản", patients: 2160, revenue: 1140, color: "#ec4899" },
        { name: "Khoa Tim mạch", patients: 1920, revenue: 1860, color: "#8b5cf6" },
        { name: "Khoa Da liễu", patients: 810, revenue: 420, color: "#14b8a6" },
    ],
};

// ── Top Bác sĩ — thay đổi theo kỳ ──
const TOP_DOCTORS_BY_PERIOD = {
    month: [
        { name: "BS. Nguyễn Văn An", dept: "Khoa Tim mạch", patients: 68, rating: 4.9 },
        { name: "BS. Trần Thị Bình", dept: "Khoa Ngoại", patients: 62, rating: 4.8 },
        { name: "BS. Lê Văn Cường", dept: "Khoa Nội", patients: 55, rating: 4.9 },
        { name: "BS. Phạm Thị Dung", dept: "Khoa Sản", patients: 48, rating: 4.7 },
        { name: "BS. Hoàng Văn Em", dept: "Khoa Nhi", patients: 45, rating: 4.8 },
    ],
    quarter: [
        { name: "BS. Nguyễn Văn An", dept: "Khoa Tim mạch", patients: 195, rating: 4.9 },
        { name: "BS. Trần Thị Bình", dept: "Khoa Ngoại", patients: 178, rating: 4.8 },
        { name: "BS. Lê Văn Cường", dept: "Khoa Nội", patients: 162, rating: 4.9 },
        { name: "BS. Phạm Thị Dung", dept: "Khoa Sản", patients: 140, rating: 4.7 },
        { name: "BS. Hoàng Văn Em", dept: "Khoa Nhi", patients: 128, rating: 4.8 },
    ],
    year: [
        { name: "BS. Nguyễn Văn An", dept: "Khoa Tim mạch", patients: 780, rating: 4.9 },
        { name: "BS. Trần Thị Bình", dept: "Khoa Ngoại", patients: 712, rating: 4.8 },
        { name: "BS. Lê Văn Cường", dept: "Khoa Nội", patients: 648, rating: 4.9 },
        { name: "BS. Phạm Thị Dung", dept: "Khoa Sản", patients: 560, rating: 4.7 },
        { name: "BS. Hoàng Văn Em", dept: "Khoa Nhi", patients: 512, rating: 4.8 },
    ],
};

type Period = "month" | "quarter" | "year";

/* ──────────────────────────────────────────────────────────────
   COMPONENT
   ────────────────────────────────────────────────────────────── */
export default function StatisticsPage() {
    usePageAIContext({ pageKey: 'statistics' });
    const [timeRange, setTimeRange] = useState<Period>("month");

    // Fetch real report data — overlay onto mock if available
    useEffect(() => {
        reportService.getDashboard().catch(() => { /* fallback to mock data */ });
        reportService.getRevenue({ period: timeRange }).catch(() => { /* fallback */ });
    }, [timeRange]);

    // Dynamic data based on selected period
    const summary = SUMMARY_DATA[timeRange];
    const chartData = useMemo(() => {
        if (timeRange === "month") return MONTHLY_ALL;
        if (timeRange === "quarter") return QUARTERLY_ALL;
        return YEARLY_ALL;
    }, [timeRange]);
    const departments = DEPT_BY_PERIOD[timeRange];
    const topDoctors = TOP_DOCTORS_BY_PERIOD[timeRange];
    const totalPatients = departments.reduce((s, d) => s + d.patients, 0);
    const maxChartValue = Math.max(...chartData.map(d => d.value));

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
            `Tổng bệnh nhân: ${summary.patients.toLocaleString()}`,
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
                    value={summary.patients.toLocaleString()}
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
                            Tổng: {chartData.reduce((s, d) => s + d.value, 0).toLocaleString()} Tr
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
                                            {item.value.toLocaleString()} Tr
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
                                    <span className="text-[#687582]">{dept.patients.toLocaleString()} BN</span>
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
