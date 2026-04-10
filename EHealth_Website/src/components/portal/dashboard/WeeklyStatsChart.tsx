"use client";

import { UI_TEXT } from "@/constants/ui-text";

interface WeeklyData {
    day: string;
    count: number;
    percentage: number;
}

export function WeeklyStatsChart({ data, todayIndex = 2 }: { data: WeeklyData[]; todayIndex?: number }) {
    const maxCount = Math.max(...data.map((d) => d.count));
    const totalWeek = data.reduce((s, d) => s + d.count, 0);

    return (
        <div className="lg:col-span-2 bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <span className="material-symbols-outlined text-blue-600 text-[20px]">monitoring</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">
                            {UI_TEXT.DOCTOR.DASHBOARD.WEEKLY_STATS}
                        </h3>
                        <p className="text-xs text-[#687582] dark:text-gray-500">
                            Tổng tuần: <b className="text-[#121417] dark:text-white">{totalWeek}</b> ca khám
                        </p>
                    </div>
                </div>
                <select className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#13191f] text-[#687582] dark:text-gray-300 px-2.5 py-1.5">
                    <option>Tuần hiện tại</option>
                    <option>Tuần trước</option>
                </select>
            </div>

            {/* Chart */}
            <div className="flex-1 px-5 pb-5 pt-6">
                <div className="relative h-52">
                    {/* Y-axis grid */}
                    {[0, 25, 50, 75, 100].map((pct) => (
                        <div key={pct} className="absolute left-0 right-0 border-t border-dashed border-gray-100 dark:border-gray-800" style={{ bottom: `${pct}%` }}>
                            {pct > 0 && (
                                <span className="absolute -top-2.5 -left-0 text-[9px] text-[#687582] dark:text-gray-600">
                                    {Math.round((pct / 100) * maxCount)}
                                </span>
                            )}
                        </div>
                    ))}

                    <div className="absolute inset-0 flex items-end gap-3 pl-6">
                        {data.map((item, index) => {
                            const pct = (item.count / maxCount) * 100;
                            const isToday = index === todayIndex;
                            return (
                                <div key={item.day} className="group relative flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                    {/* Tooltip */}
                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1e242b] dark:bg-white text-white dark:text-[#1e242b] text-[10px] py-0.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-medium">
                                        {item.count} ca
                                    </div>
                                    <div
                                        className={`w-full rounded-t-[3px] transition-all duration-300 ${isToday
                                            ? "bg-gradient-to-t from-[#3C81C6] to-[#60a5fa] shadow-sm shadow-blue-200 dark:shadow-none"
                                            : "bg-[#3C81C6]/12 group-hover:bg-[#3C81C6]/25"
                                            }`}
                                        style={{ height: `${Math.max(pct, 5)}%` }}
                                    />
                                    <span className={`text-[11px] ${isToday ? "font-bold text-[#3C81C6]" : "text-[#687582] dark:text-gray-500"}`}>
                                        {item.day}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#f0f1f3] dark:border-[#2d353e]">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-[#3C81C6] to-[#60a5fa]" />
                        <span className="text-[11px] text-[#687582] dark:text-gray-500">Hôm nay</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-[#3C81C6]/15" />
                        <span className="text-[11px] text-[#687582] dark:text-gray-500">Ca khám trong tuần</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WeeklyStatsChart;
