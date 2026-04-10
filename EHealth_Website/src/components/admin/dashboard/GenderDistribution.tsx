"use client";

const GENDER_DATA = [
    { label: "Nam", value: 580, color: "#3C81C6", icon: "male" },
    { label: "Nữ", value: 520, color: "#ec4899", icon: "female" },
    { label: "Trẻ em", value: 140, color: "#f59e0b", icon: "child_care" },
];

export function GenderDistribution() {
    const total = GENDER_DATA.reduce((s, d) => s + d.value, 0);
    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex flex-col">
            <div className="px-4 py-2.5 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center gap-2">
                <div className="p-1 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                    <span className="material-symbols-outlined text-pink-500 text-[18px]">wc</span>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-[#121417] dark:text-white">Giới tính BN</h3>
                    <p className="text-[10px] text-[#687582] dark:text-gray-500">Tổng: {total.toLocaleString()}</p>
                </div>
            </div>
            <div className="flex-1 p-3">
                <div className="w-full h-3 rounded-full overflow-hidden flex mb-3">
                    {GENDER_DATA.map((g) => (
                        <div key={g.label} className="h-full first:rounded-l-full last:rounded-r-full"
                            style={{ width: `${(g.value / total) * 100}%`, backgroundColor: g.color }} />
                    ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {GENDER_DATA.map((g) => (
                        <div key={g.label} className="text-center p-2 rounded-lg bg-[#f6f7f8] dark:bg-[#13191f]">
                            <span className="material-symbols-outlined text-[20px]" style={{ color: g.color }}>{g.icon}</span>
                            <p className="text-base font-extrabold text-[#121417] dark:text-white">{g.value}</p>
                            <p className="text-[9px] text-[#687582]">{g.label} ({Math.round((g.value / total) * 100)}%)</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default GenderDistribution;
