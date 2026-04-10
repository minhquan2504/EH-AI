'use client';

// ============================================
// Types & Mock Data
// ============================================

const MOCK_REVENUE = {
    currentMonth: 850_000_000,
    lastMonth: 920_000_000,
    change: -7.6,
    topReason: 'Giảm 15% khám ngoại trú do nghỉ lễ',
    suggestion: 'Tăng slot khám online để bù đắp',
};

// ============================================
// Helpers
// ============================================

function formatVND(amount: number): string {
    if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)} tỷ`;
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)} tr`;
    return amount.toLocaleString('vi-VN');
}

// ============================================
// Component
// ============================================

export function AIRevenueInsight() {
    const { currentMonth, lastMonth, change, topReason, suggestion } = MOCK_REVENUE;
    const isPositive = change >= 0;

    // Mini sparkline-style bar (mock data)
    const bars = [88, 92, 95, 87, 90, 85, 92, 86, 88, 85].map(v => v / 100);

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                        <span className="material-symbols-outlined text-emerald-600 text-[20px]">payments</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">AI Phân tích doanh thu</h3>
                        <p className="text-xs text-[#687582] dark:text-gray-500">Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}</p>
                    </div>
                </div>
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-red-50 dark:bg-red-500/10 text-red-500'}`}>
                    <span className="material-symbols-outlined text-[14px]">
                        {isPositive ? 'trending_up' : 'trending_down'}
                    </span>
                    {isPositive ? '+' : ''}{change}%
                </span>
            </div>

            <div className="p-5 space-y-4">
                {/* Revenue amounts */}
                <div className="flex items-end gap-6">
                    <div>
                        <p className="text-xs text-[#687582] mb-0.5">Tháng này</p>
                        <p className="text-2xl font-black text-[#121417] dark:text-white">{formatVND(currentMonth)}</p>
                    </div>
                    <div className="pb-0.5">
                        <p className="text-xs text-[#687582] mb-0.5">Tháng trước</p>
                        <p className="text-sm font-bold text-[#687582]">{formatVND(lastMonth)}</p>
                    </div>
                </div>

                {/* Mini bar chart (sparkline) */}
                <div className="flex items-end gap-1 h-12">
                    {bars.map((v, i) => (
                        <div key={i} className="flex-1 flex flex-col justify-end">
                            <div
                                className={`w-full rounded-t-sm ${i === bars.length - 1 ? (isPositive ? 'bg-emerald-400' : 'bg-red-400') : 'bg-gray-200 dark:bg-gray-600'}`}
                                style={{ height: `${v * 100}%` }}
                            />
                        </div>
                    ))}
                </div>

                {/* Reason */}
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20">
                    <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-amber-600 text-[18px] mt-0.5 flex-shrink-0">lightbulb</span>
                        <div>
                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-0.5">Nguyên nhân chính</p>
                            <p className="text-xs text-amber-600 dark:text-amber-500">{topReason}</p>
                        </div>
                    </div>
                </div>

                {/* Suggestion */}
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
                    <span className="material-symbols-outlined text-[#3C81C6] text-[18px] mt-0.5 flex-shrink-0">tips_and_updates</span>
                    <div>
                        <p className="text-xs font-semibold text-[#3C81C6] mb-0.5">Gợi ý AI</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">{suggestion}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
