"use client";

import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { UI_TEXT } from "@/constants/ui-text";

interface PatientGrowthData {
    month: string;
    value: number;
}

export function PatientGrowthChart({ data, highlightIndex = 7 }: { data: PatientGrowthData[]; highlightIndex?: number }) {
    const maxVal = Math.max(...data.map((d) => d.value));
    const total = data.reduce((s, d) => s + d.value, 0);

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex flex-col">
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <span className="material-symbols-outlined text-blue-600 text-[20px]">monitoring</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">
                            {UI_TEXT.ADMIN.DASHBOARD.PATIENT_GROWTH}
                        </h3>
                        <p className="text-xs text-[#687582] dark:text-gray-500">
                            Lượng bệnh nhân mới theo tháng — Tổng: <b className="text-[#121417] dark:text-white">{total.toLocaleString("vi-VN")}</b>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <select className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#13191f] text-[#687582] dark:text-gray-300 focus:ring-[#3C81C6] focus:border-[#3C81C6] px-2.5 py-1.5">
                        <option>2024</option>
                        <option>2023</option>
                    </select>
                    <Link
                        href={ROUTES.ADMIN.STATISTICS}
                        className="text-xs text-[#3C81C6] hover:underline font-medium"
                    >
                        {UI_TEXT.COMMON.VIEW_DETAILS}
                    </Link>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 px-4 pb-3 pt-3">
                {/* Grid lines */}
                <div className="relative h-36">
                    {/* Y-axis reference lines */}
                    {[0, 25, 50, 75, 100].map((pct) => (
                        <div
                            key={pct}
                            className="absolute left-0 right-0 border-t border-dashed border-gray-100 dark:border-gray-800"
                            style={{ bottom: `${pct}%` }}
                        >
                            {pct > 0 && (
                                <span className="absolute -top-2.5 -left-0 text-[9px] text-[#687582] dark:text-gray-600">
                                    {Math.round((pct / 100) * maxVal)}
                                </span>
                            )}
                        </div>
                    ))}

                    {/* Bars */}
                    <div className="absolute inset-0 flex items-end gap-2 pl-6">
                        {data.map((item, index) => {
                            const pct = (item.value / maxVal) * 100;
                            const isHighlighted = index === highlightIndex;
                            return (
                                <div key={item.month} className="group relative flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                    {/* Tooltip */}
                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1e242b] dark:bg-white text-white dark:text-[#1e242b] text-[10px] py-0.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-medium">
                                        {item.value.toLocaleString()} BN
                                    </div>
                                    <div
                                        className={`w-full rounded-t-[3px] relative transition-all duration-300 ${isHighlighted
                                            ? "bg-gradient-to-t from-[#3C81C6] to-[#60a5fa] shadow-sm shadow-blue-200 dark:shadow-none"
                                            : "bg-[#3C81C6]/12 group-hover:bg-[#3C81C6]/25"
                                            }`}
                                        style={{ height: `${Math.max(pct, 4)}%` }}
                                    />
                                    <span className={`text-[10px] ${isHighlighted ? "font-bold text-[#3C81C6]" : "text-[#687582] dark:text-gray-500"}`}>
                                        {item.month}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-2 pt-2 border-t border-[#f0f1f3] dark:border-[#2d353e]">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-[#3C81C6] to-[#60a5fa]" />
                        <span className="text-[11px] text-[#687582] dark:text-gray-500">Cao nhất</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-[#3C81C6]/15" />
                        <span className="text-[11px] text-[#687582] dark:text-gray-500">Bệnh nhân mới</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PatientGrowthChart;
