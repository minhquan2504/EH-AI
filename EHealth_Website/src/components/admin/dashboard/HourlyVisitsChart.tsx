"use client";

const HOURLY_DATA = [
    { hour: "7h", value: 12 }, { hour: "8h", value: 45 }, { hour: "9h", value: 78 },
    { hour: "10h", value: 95 }, { hour: "11h", value: 68 }, { hour: "12h", value: 25 },
    { hour: "13h", value: 42 }, { hour: "14h", value: 72 }, { hour: "15h", value: 85 },
    { hour: "16h", value: 60 }, { hour: "17h", value: 30 },
];

export function HourlyVisitsChart() {
    const maxVal = Math.max(...HOURLY_DATA.map((d) => d.value));
    const total = HOURLY_DATA.reduce((s, d) => s + d.value, 0);
    const peakHour = HOURLY_DATA.reduce((max, d) => d.value > max.value ? d : max, HOURLY_DATA[0]);

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex flex-col">
            <div className="px-4 py-2.5 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <span className="material-symbols-outlined text-emerald-600 text-[18px]">schedule</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">Khám theo giờ</h3>
                        <p className="text-[10px] text-[#687582] dark:text-gray-500">
                            Tổng: <b className="text-[#121417] dark:text-white">{total}</b> • Cao điểm: <b className="text-emerald-600">{peakHour.hour}</b>
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex-1 px-4 pb-3 pt-2">
                <div className="relative h-28">
                    {[0, 50, 100].map((pct) => (
                        <div key={pct} className="absolute left-0 right-0 border-t border-dashed border-gray-100 dark:border-gray-800" style={{ bottom: `${pct}%` }} />
                    ))}
                    <div className="absolute inset-0 flex items-end gap-1 pl-1">
                        {HOURLY_DATA.map((item) => {
                            const pct = (item.value / maxVal) * 100;
                            const isPeak = item.value === maxVal;
                            return (
                                <div key={item.hour} className="group relative flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#1e242b] dark:bg-white text-white dark:text-[#121417] text-[9px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-medium">
                                        {item.value}
                                    </div>
                                    <div className={`w-full rounded-t-sm transition-all duration-300 ${isPeak ? "bg-gradient-to-t from-emerald-500 to-emerald-300" : "bg-emerald-500/12 group-hover:bg-emerald-500/25"}`}
                                        style={{ height: `${Math.max(pct, 4)}%` }} />
                                    <span className={`text-[8px] ${isPeak ? "font-bold text-emerald-600" : "text-[#687582]"}`}>{item.hour}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HourlyVisitsChart;
