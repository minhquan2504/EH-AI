"use client";

import Link from "next/link";
import { ROUTES } from "@/constants/routes";

interface DashboardStats {
    totalRevenue: number;
    revenueChange: number;
    todayVisits: number;
    visitsChange: number;
    doctorsOnDuty: number;
    totalDoctors: number;
    medicineAlerts: number;
}

interface StatsCardsProps {
    stats: DashboardStats;
}

function formatNumber(num: number): string {
    return num.toLocaleString("vi-VN");
}

function formatCurrency(num: number): string {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)} Tỷ`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(0)} Tr`;
    return formatNumber(num);
}

function StatCard({ icon, iconBg, iconColor, label, value, footer, href }: {
    icon: string; iconBg: string; iconColor: string;
    label: string; value: string; footer: React.ReactNode; href?: string;
}) {
    const cls = "bg-white dark:bg-[#1e242b] p-3.5 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-[#3C81C6]/40 dark:hover:border-[#3C81C6]/30 transition-all cursor-pointer";

    const inner = (
        <>
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <p className="text-[#687582] dark:text-gray-400 text-[10px] font-medium mb-1 uppercase tracking-wider">{label}</p>
                    <h3 className="text-[22px] font-extrabold text-[#121417] dark:text-white leading-none">{value}</h3>
                </div>
                <div className={`p-2 ${iconBg} rounded-lg ${iconColor} group-hover:scale-110 transition-transform flex-shrink-0`}>
                    <span className="material-symbols-outlined text-[18px]">{icon}</span>
                </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#f0f1f3] dark:border-[#2d353e]">{footer}</div>
        </>
    );

    if (href) return <Link href={href} className={cls}>{inner}</Link>;
    return <div className={cls}>{inner}</div>;
}

function TrendBadge({ value, label, color }: { value: string; label: string; color: string }) {
    const cm: Record<string, { bg: string; text: string }> = {
        green: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-600" },
        blue: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600" },
        red: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600" },
    };
    const c = cm[color] || cm.green;
    return (
        <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center text-[10px] font-bold ${c.text} ${c.bg} px-1.5 py-0.5 rounded`}>{value}</span>
            <span className="text-[10px] text-[#687582] dark:text-gray-500">{label}</span>
        </div>
    );
}

function MiniSparkline({ color }: { color: string }) {
    const heights = [25, 45, 30, 60, 40, 65, 50, 75, 55, 70, 45, 80];
    return (
        <div className="flex items-end gap-[2px] h-6">
            {heights.map((h, i) => (
                <div key={i} className={`w-[3px] rounded-[1px] ${color}`} style={{ height: `${h}%` }} />
            ))}
        </div>
    );
}

export function StatsCards({ stats }: StatsCardsProps) {
    const avatarColors = ["from-blue-400 to-blue-600", "from-emerald-400 to-teal-500", "from-amber-400 to-orange-500", "from-violet-400 to-purple-500"];

    return (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <StatCard icon="vital_signs" iconBg="bg-blue-50 dark:bg-blue-900/20" iconColor="text-blue-600"
                label="Lượt khám hôm nay" value={formatNumber(stats.todayVisits)} href={ROUTES.ADMIN.STATISTICS}
                footer={<div className="flex items-center justify-between"><TrendBadge value={`↑ ${stats.visitsChange}%`} label="so với hôm qua" color="green" /><MiniSparkline color="bg-blue-400" /></div>} />

            <StatCard icon="stethoscope" iconBg="bg-emerald-50 dark:bg-emerald-900/20" iconColor="text-emerald-600"
                label="Bác sĩ đang trực" value={`${stats.doctorsOnDuty}/${stats.totalDoctors}`} href={ROUTES.ADMIN.DOCTORS}
                footer={
                    <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-1">
                            {avatarColors.map((c, i) => (
                                <div key={i} className={`w-5 h-5 rounded-full border-[1.5px] border-white dark:border-[#1e242b] bg-gradient-to-br ${c} flex items-center justify-center text-[8px] text-white font-bold`}>
                                    {String.fromCharCode(65 + i)}
                                </div>
                            ))}
                            <div className="w-5 h-5 rounded-full border-[1.5px] border-white dark:border-[#1e242b] bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[8px] text-gray-600 font-bold">+{stats.doctorsOnDuty - 4}</div>
                        </div>
                        <span className="text-[10px] text-[#687582] dark:text-gray-500">Đang hoạt động</span>
                    </div>
                } />

            <StatCard icon="payments" iconBg="bg-violet-50 dark:bg-violet-900/20" iconColor="text-violet-600"
                label="Doanh thu tháng" value={formatCurrency(stats.totalRevenue)} href={ROUTES.ADMIN.STATISTICS}
                footer={<div className="flex items-center justify-between"><TrendBadge value={`↑ ${stats.revenueChange}%`} label="so với tháng trước" color="green" /><MiniSparkline color="bg-violet-400" /></div>} />

            <StatCard icon="warning" iconBg="bg-red-50 dark:bg-red-900/20" iconColor="text-red-500"
                label="Cảnh báo thuốc" value={String(stats.medicineAlerts).padStart(2, "0")} href={ROUTES.ADMIN.MEDICINES}
                footer={
                    <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">Cần xử lý</span>
                        <span className="text-[10px] text-[#687582] dark:text-gray-500">Hết hạn / tồn kho thấp</span>
                    </div>
                } />
        </div>
    );
}

export default StatsCards;
