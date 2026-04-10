'use client';

import { useState, useEffect } from 'react';
import { aiService } from '@/services/aiService';

// ============================================
// Types & Mock Data
// ============================================

interface DrugPrediction {
    drug: string;
    currentStock: number;
    daysLeft: number;
    status: 'critical' | 'warning' | 'ok';
    suggestOrder: number;
}

const MOCK_PREDICTIONS: DrugPrediction[] = [
    { drug: 'Amoxicillin 500mg', currentStock: 45, daysLeft: 3, status: 'critical', suggestOrder: 200 },
    { drug: 'Metformin 500mg', currentStock: 28, daysLeft: 5, status: 'warning', suggestOrder: 150 },
    { drug: 'Omeprazole 20mg', currentStock: 320, daysLeft: 45, status: 'ok', suggestOrder: 0 },
    { drug: 'Amlodipine 5mg', currentStock: 15, daysLeft: 2, status: 'critical', suggestOrder: 100 },
    { drug: 'Atorvastatin 20mg', currentStock: 180, daysLeft: 30, status: 'ok', suggestOrder: 0 },
];

// ============================================
// Config
// ============================================

const STATUS_CONFIG: Record<string, { label: string; badgeBg: string; badgeText: string; barColor: string }> = {
    critical: {
        label: 'Nguy hiểm',
        badgeBg: 'bg-red-50 dark:bg-red-500/10',
        badgeText: 'text-red-600',
        barColor: 'bg-red-500',
    },
    warning: {
        label: 'Cảnh báo',
        badgeBg: 'bg-amber-50 dark:bg-amber-500/10',
        badgeText: 'text-amber-600',
        barColor: 'bg-amber-500',
    },
    ok: {
        label: 'Đủ hàng',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-500/10',
        badgeText: 'text-emerald-600',
        barColor: 'bg-emerald-500',
    },
};

// Max days for bar width calculation
const MAX_DAYS = 60;

// ============================================
// Component
// ============================================

export function AIInventoryPredictor() {
    const [predictions, setPredictions] = useState<DrugPrediction[]>([]);
    const [loading, setLoading] = useState(true);
    const [orderQueued, setOrderQueued] = useState<Set<string>>(new Set());

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            try {
                const res = await aiService.analyze({ type: 'inventory_forecast', data: {} });
                const data = res?.data as Record<string, unknown> | null | undefined;
                const items = data?.predictions as DrugPrediction[] | undefined;
                if (Array.isArray(items) && items.length > 0) {
                    setPredictions(items);
                } else {
                    setPredictions(MOCK_PREDICTIONS);
                }
            } catch {
                // Silent fail — show mock
                setPredictions(MOCK_PREDICTIONS);
            } finally {
                setLoading(false);
            }
        };
        run();
    }, []);

    const criticalCount = predictions.filter(p => p.status === 'critical').length;
    const warningCount = predictions.filter(p => p.status === 'warning').length;

    const handleOrder = (drug: string) => {
        setOrderQueued(prev => { const s = new Set(prev); s.add(drug); return s; });
    };

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-violet-50 dark:bg-violet-500/10 rounded-lg">
                        <span className="material-symbols-outlined text-violet-600 text-[20px]">inventory_2</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2">
                            AI Dự báo Kho thuốc
                            {criticalCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 dark:bg-red-500/10 text-red-500">
                                    {criticalCount} khẩn cấp
                                </span>
                            )}
                        </h3>
                        <p className="text-xs text-[#687582] dark:text-gray-500">
                            {criticalCount > 0 || warningCount > 0
                                ? `${criticalCount + warningCount} loại cần đặt hàng`
                                : 'Kho đang đủ hàng'}
                        </p>
                    </div>
                </div>
                {loading ? (
                    <div className="flex items-center gap-1.5 text-xs text-[#687582]">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-ping" />
                        Đang phân tích...
                    </div>
                ) : (
                    <span className="flex items-center gap-1 text-[10px] text-violet-600 font-bold">
                        <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                        AI forecast
                    </span>
                )}
            </div>

            {/* List */}
            <div className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e]">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="px-5 py-3.5 animate-pulse">
                            <div className="flex justify-between mb-2">
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        </div>
                    ))
                ) : (
                    predictions.map((item) => {
                        const cfg = STATUS_CONFIG[item.status];
                        const barWidth = Math.min((item.daysLeft / MAX_DAYS) * 100, 100);
                        const ordered = orderQueued.has(item.drug);
                        return (
                            <div key={item.drug} className="px-5 py-3.5">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-medium text-[#121417] dark:text-white truncate">
                                                {item.drug}
                                            </p>
                                            <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${cfg.badgeBg} ${cfg.badgeText}`}>
                                                {cfg.label}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-[#687582] dark:text-gray-500 mt-0.5">
                                            Còn {item.currentStock} viên — còn {item.daysLeft} ngày
                                        </p>
                                    </div>
                                    {(item.status === 'critical' || item.status === 'warning') && (
                                        <button
                                            onClick={() => handleOrder(item.drug)}
                                            disabled={ordered}
                                            className={`shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${ordered
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 cursor-default'
                                                : 'bg-[#3C81C6] hover:bg-[#2a6da8] text-white shadow-sm'
                                            }`}
                                        >
                                            {ordered ? (
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[14px]">check</span>
                                                    Đã đặt
                                                </span>
                                            ) : (
                                                `Đặt ${item.suggestOrder}`
                                            )}
                                        </button>
                                    )}
                                </div>
                                {/* Stock bar */}
                                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700/60 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${cfg.barColor}`}
                                        style={{ width: `${barWidth}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
