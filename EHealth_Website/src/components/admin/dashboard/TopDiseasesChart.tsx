"use client";

const TOP_DISEASES = [
    { name: "Viêm họng", value: 185, color: "#3C81C6" },
    { name: "Cao huyết áp", value: 142, color: "#60a5fa" },
    { name: "Tiểu đường", value: 98, color: "#f59e0b" },
    { name: "Viêm dạ dày", value: 76, color: "#10b981" },
    { name: "Viêm phế quản", value: 65, color: "#8b5cf6" },
];

function DonutChart({ data }: { data: typeof TOP_DISEASES }) {
    const total = data.reduce((s, d) => s + d.value, 0);
    let cumulative = 0;
    const size = 100;
    const strokeWidth = 22;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
                {data.map((d, i) => {
                    const pct = d.value / total;
                    const offset = (cumulative / total) * circumference;
                    cumulative += d.value;
                    return <circle key={i} cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={d.color}
                        strokeWidth={strokeWidth} strokeDasharray={`${pct * circumference} ${circumference}`} strokeDashoffset={-offset} />;
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-extrabold text-[#121417] dark:text-white">{total}</span>
                <span className="text-[9px] text-[#687582]">ca bệnh</span>
            </div>
        </div>
    );
}

export function TopDiseasesChart() {
    const total = TOP_DISEASES.reduce((s, d) => s + d.value, 0);
    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex flex-col">
            <div className="px-4 py-2.5 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center gap-2">
                <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="material-symbols-outlined text-blue-600 text-[18px]">coronavirus</span>
                </div>
                <h3 className="text-sm font-bold text-[#121417] dark:text-white">Top bệnh lý</h3>
            </div>
            <div className="flex-1 p-3 flex items-center gap-4">
                <DonutChart data={TOP_DISEASES} />
                <div className="flex-1 space-y-1.5">
                    {TOP_DISEASES.map((d) => (
                        <div key={d.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                                <span className="text-[11px] text-[#687582] dark:text-gray-400">{d.name}</span>
                            </div>
                            <span className="text-[11px] font-bold text-[#121417] dark:text-white">{d.value} <span className="font-normal text-[#687582]">({Math.round((d.value / total) * 100)}%)</span></span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default TopDiseasesChart;
