'use client';

// ============================================
// Mock data
// ============================================

const MOCK_SIMILAR = [
    {
        diagnosis: 'THA cấp cứu (I16.1)',
        protocol: 'Nicardipine IV 5mg/h',
        outcome: 'HA ổn sau 24h',
        outcomeType: 'success' as const,
        count: 2,
    },
    {
        diagnosis: 'THA cấp cứu (I16.1)',
        protocol: 'Labetalol IV 20mg',
        outcome: 'Cần tăng liều, ổn sau 48h',
        outcomeType: 'partial' as const,
        count: 1,
    },
];

const OUTCOME_CONFIG = {
    success: {
        badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
    },
    partial: {
        badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
    },
};

// ============================================
// Component
// ============================================

export function AISimilarCases() {
    const totalCases = MOCK_SIMILAR.reduce((sum, c) => sum + c.count, 0);

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center gap-2">
                <div className="p-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <span className="material-symbols-outlined text-indigo-600 text-[18px]">cases</span>
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-[#121417] dark:text-white">Ca tương tự</h3>
                    <p className="text-xs text-[#687582] dark:text-gray-500">{totalCases} ca tương tự trong 30 ngày qua</p>
                </div>
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                    AI
                </span>
            </div>

            {/* Cases */}
            <div className="p-3 space-y-2.5">
                {MOCK_SIMILAR.map((c, i) => {
                    const cfg = OUTCOME_CONFIG[c.outcomeType];
                    return (
                        <div
                            key={i}
                            className="rounded-lg bg-[#f6f7f8] dark:bg-[#13191f] border border-[#e5e7eb] dark:border-[#2d353e] p-3"
                        >
                            {/* Diagnosis + count */}
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                                    <p className="text-xs font-semibold text-[#121417] dark:text-white">{c.diagnosis}</p>
                                </div>
                                <span className="text-[10px] text-[#687582] dark:text-gray-500 font-medium">
                                    {c.count} ca
                                </span>
                            </div>

                            {/* Protocol */}
                            <div className="flex items-start gap-1.5 mb-1.5">
                                <span className="material-symbols-outlined text-[13px] text-[#687582] dark:text-gray-500 flex-shrink-0 mt-0.5">medication</span>
                                <p className="text-[11px] text-[#687582] dark:text-gray-400">
                                    Phác đồ: <span className="font-medium text-[#121417] dark:text-gray-200">{c.protocol}</span>
                                </p>
                            </div>

                            {/* Outcome badge */}
                            <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[13px] text-[#687582] dark:text-gray-500 flex-shrink-0">check_circle</span>
                                <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md border ${cfg.badge}`}>
                                    {c.outcome}
                                </span>
                            </div>
                        </div>
                    );
                })}

                <p className="text-[10px] text-[#687582] dark:text-gray-500 text-center pt-0.5">
                    Dữ liệu mô phỏng — phục vụ demo
                </p>
            </div>
        </div>
    );
}

export default AISimilarCases;
