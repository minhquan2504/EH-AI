'use client';

import { useState } from 'react';

// ============================================
// Types & Mock Data
// ============================================

interface HealthTip {
    id: string;
    icon: string;
    text: string;
    time: string;
    category: 'medication' | 'monitor' | 'exercise' | 'diet';
}

const MOCK_TIPS: HealthTip[] = [
    { id: '1', icon: 'medication', text: 'Nhắc: Uống Metformin 500mg trước bữa ăn 30 phút', time: '07:30', category: 'medication' },
    { id: '2', icon: 'monitor_heart', text: 'Đo huyết áp hàng ngày vào buổi sáng trước khi uống thuốc', time: '06:00', category: 'monitor' },
    { id: '3', icon: 'fitness_center', text: 'Gợi ý: Đi bộ 30 phút mỗi ngày giúp kiểm soát đường huyết', time: '', category: 'exercise' },
    { id: '4', icon: 'restaurant', text: 'Hạn chế muối <5g/ngày để kiểm soát huyết áp', time: '', category: 'diet' },
];

const CATEGORY_CONFIG: Record<string, { bg: string; text: string }> = {
    medication: { bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-600' },
    monitor: { bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-500' },
    exercise: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600' },
    diet: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600' },
};

// ============================================
// Component
// ============================================

export function AIHealthCoach() {
    const [tips, setTips] = useState<HealthTip[]>(MOCK_TIPS);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    const handleDismiss = (id: string) => {
        setDismissed(prev => { const s = new Set(prev); s.add(id); return s; });
    };

    const visibleTips = tips.filter(t => !dismissed.has(t.id));

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                        <span className="material-symbols-outlined text-emerald-600 text-[20px]">health_and_safety</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">AI Huấn luyện sức khoẻ</h3>
                        <p className="text-xs text-[#687582] dark:text-gray-500">
                            {visibleTips.length} gợi ý hôm nay
                        </p>
                    </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Cá nhân hoá
                </span>
            </div>

            {/* Tip list — scrollable */}
            <div className="max-h-64 overflow-y-auto">
                {visibleTips.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-8 text-center px-5">
                        <span className="material-symbols-outlined text-[36px] text-emerald-500">check_circle</span>
                        <p className="text-sm font-medium text-[#121417] dark:text-white">Tuyệt vời!</p>
                        <p className="text-xs text-[#687582]">Bạn đã xem hết gợi ý hôm nay.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e]">
                        {visibleTips.map(tip => {
                            const cfg = CATEGORY_CONFIG[tip.category];
                            return (
                                <div key={tip.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-[#f6f7f8] dark:hover:bg-[#13191f] transition-colors">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                                        <span className={`material-symbols-outlined text-[18px] ${cfg.text}`}>{tip.icon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-[#121417] dark:text-white leading-snug">{tip.text}</p>
                                        {tip.time && (
                                            <p className="text-[11px] text-[#687582] dark:text-gray-500 mt-0.5 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[13px]">schedule</span>
                                                {tip.time}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDismiss(tip.id)}
                                        className="shrink-0 p-1 rounded-lg text-[#687582] hover:text-[#121417] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        title="Bỏ qua"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
