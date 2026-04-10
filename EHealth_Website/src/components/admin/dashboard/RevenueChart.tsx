"use client";

interface RevenueData {
    month: string;
    value: number;
}

export function RevenueChart({ data }: { data: RevenueData[] }) {
    const maxVal = Math.max(...data.map((d) => d.value));
    const total = data.reduce((s, d) => s + d.value, 0);
    const totalFormatted = `${(total / 1000).toFixed(1)} Tỷ`;

    // So sánh 2 tháng cuối
    const lastMonth = data[data.length - 1];
    const prevMonth = data[data.length - 2];
    const changePercent = prevMonth ? Math.round(((lastMonth.value - prevMonth.value) / prevMonth.value) * 100) : 0;
    const isPositive = changePercent >= 0;

    // Tìm index tháng hiện tại (T8 = tháng 8 = index 7)
    const highlightIdx = 7; // tháng hiện tại

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex flex-col">
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-[#f0f1f3] dark:border-[#2d353e]">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                        <span className="material-symbols-outlined text-rose-500 text-[20px]">bar_chart</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">Doanh thu năm 2024</h3>
                        <p className="text-xs text-[#687582] dark:text-gray-500">Đơn vị: triệu VNĐ</p>
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="px-4 pt-2">
                <div className="flex items-end justify-between gap-2">
                    <div>
                        <p className="text-xs text-[#687582] dark:text-gray-500 mb-0.5">Tổng cộng</p>
                        <p className="text-2xl font-extrabold text-[#121417] dark:text-white">{totalFormatted}</p>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
                        <span className="material-symbols-outlined text-[14px]">{isPositive ? "trending_up" : "trending_down"}</span>
                        {isPositive ? "+" : ""}{changePercent}%
                        <span className="text-[#687582] dark:text-gray-500 font-normal ml-1">tháng cuối</span>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 px-4 pb-3 pt-2">
                <div className="h-28 flex items-end gap-[4px]">
                    {data.map((item, idx) => {
                        const pct = (item.value / maxVal) * 100;
                        const isHighlight = idx === highlightIdx || idx === highlightIdx + 1;
                        return (
                            <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                                {/* Tooltip */}
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1e242b] dark:bg-white text-white dark:text-[#121417] text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-medium">
                                    {item.value}Tr
                                </div>
                                <div
                                    className={`w-full rounded-t-sm transition-all duration-300 ${isHighlight
                                        ? "bg-gradient-to-t from-rose-500 to-orange-400 shadow-sm shadow-rose-200 dark:shadow-none"
                                        : "bg-rose-500/15 group-hover:bg-rose-500/30"
                                        }`}
                                    style={{ height: `${Math.max(pct, 5)}%` }}
                                />
                                <span className={`text-[10px] ${isHighlight ? "font-bold text-rose-500 dark:text-rose-400" : "text-[#687582] dark:text-gray-500"}`}>
                                    {item.month}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default RevenueChart;
