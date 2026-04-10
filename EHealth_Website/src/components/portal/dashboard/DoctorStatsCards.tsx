"use client";

import Link from "next/link";
import { ROUTES } from "@/constants/routes";

// Types
interface DoctorStats {
    todayExams: number;
    totalExamsToday: number;
    progressPercent: number;
    waitingPatients: number;
    avgWaitTime: number;
    personalRevenue: number;
    revenueChange: number;
}

function formatCurrency(num: number): string {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}tr`;
    return num.toLocaleString("vi-VN");
}

function MiniSparkline({ color }: { color: string }) {
    const heights = [35, 55, 40, 70, 50, 75, 60, 85, 65, 80, 55, 90];
    return (
        <div className="flex items-end gap-[2px] h-7">
            {heights.map((h, i) => (
                <div key={i} className={`w-[3px] rounded-full ${color} opacity-60`} style={{ height: `${h}%` }} />
            ))}
        </div>
    );
}

function StatCard({
    icon, iconBg, iconColor, label, value, footer, href,
}: {
    icon: string; iconBg: string; iconColor: string;
    label: string; value: string; footer: React.ReactNode; href?: string;
}) {
    const cls = "bg-white dark:bg-[#1e242b] p-5 rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-[#3C81C6]/40 dark:hover:border-[#3C81C6]/30 transition-all cursor-pointer";
    const inner = (
        <>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-[#687582] dark:text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wider">{label}</p>
                    <h3 className="text-[28px] font-extrabold text-[#121417] dark:text-white leading-none">{value}</h3>
                </div>
                <div className={`p-2.5 ${iconBg} rounded-xl ${iconColor} group-hover:scale-110 transition-transform flex-shrink-0`}>
                    <span className="material-symbols-outlined text-[22px]">{icon}</span>
                </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#f0f1f3] dark:border-[#2d353e]">{footer}</div>
        </>
    );
    if (href) return <Link href={href} className={cls}>{inner}</Link>;
    return <div className={cls}>{inner}</div>;
}

export function DoctorStatsCards({ stats }: { stats: DoctorStats }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {/* Lượt khám hôm nay */}
            <StatCard
                icon="medical_services"
                iconBg="bg-blue-50 dark:bg-blue-900/20"
                iconColor="text-blue-600"
                label="Lượt khám hôm nay"
                value={`${stats.todayExams}/${stats.totalExamsToday}`}
                href={ROUTES.PORTAL.DOCTOR.QUEUE}
                footer={
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
                                {stats.progressPercent}%
                            </span>
                            <span className="text-xs text-[#687582] dark:text-gray-500">tiến độ</span>
                        </div>
                        {/* Progress bar nhỏ */}
                        <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats.progressPercent}%` }} />
                        </div>
                    </div>
                }
            />

            {/* BN đang chờ */}
            <StatCard
                icon="groups"
                iconBg="bg-amber-50 dark:bg-amber-900/20"
                iconColor="text-amber-600"
                label="Bệnh nhân chờ"
                value={String(stats.waitingPatients)}
                href={ROUTES.PORTAL.DOCTOR.QUEUE}
                footer={
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-md">
                            <span className="material-symbols-outlined text-[12px] mr-0.5">schedule</span>
                            TB: {stats.avgWaitTime}p
                        </span>
                        <span className="text-xs text-[#687582] dark:text-gray-500">thời gian chờ</span>
                    </div>
                }
            />

            {/* Doanh thu cá nhân */}
            <StatCard
                icon="payments"
                iconBg="bg-emerald-50 dark:bg-emerald-900/20"
                iconColor="text-emerald-600"
                label="Doanh thu tháng"
                value={formatCurrency(stats.personalRevenue)}
                href={ROUTES.PORTAL.DOCTOR.DASHBOARD}
                footer={
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md">
                                ↑ {stats.revenueChange}%
                            </span>
                            <span className="text-xs text-[#687582] dark:text-gray-500">so với tuần trước</span>
                        </div>
                        <MiniSparkline color="bg-emerald-500" />
                    </div>
                }
            />

            {/* Đánh giá */}
            <StatCard
                icon="star"
                iconBg="bg-violet-50 dark:bg-violet-900/20"
                iconColor="text-violet-600"
                label="Đánh giá bệnh nhân"
                value="4.8"
                footer={
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <span key={s} className={`material-symbols-outlined text-[14px] ${s <= 4 ? "text-amber-400" : "text-amber-400/50"}`}>star</span>
                            ))}
                        </div>
                        <span className="text-xs text-[#687582] dark:text-gray-500">156 đánh giá</span>
                    </div>
                }
            />
        </div>
    );
}

export default DoctorStatsCards;
