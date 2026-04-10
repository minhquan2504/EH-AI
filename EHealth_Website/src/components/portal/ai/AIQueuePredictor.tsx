'use client';

import { useState, useEffect, useRef } from 'react';

// ============================================
// Types
// ============================================

type Trend = 'up' | 'down' | 'stable';

interface QueuePrediction {
    waitMinutes: number;
    trend: Trend;
    queueLength: number;
    updatedAt: string;
}

// ============================================
// Helpers
// ============================================

function getWaitColor(min: number): { bg: string; text: string; border: string } {
    if (min < 20) return { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-200 dark:border-emerald-500/30' };
    if (min <= 45) return { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-200 dark:border-amber-500/30' };
    return { bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600', border: 'border-red-200 dark:border-red-500/30' };
}

const TREND_CONFIG: Record<Trend, { icon: string; label: string; color: string }> = {
    up: { icon: 'trending_up', label: 'Đang tăng', color: 'text-red-500' },
    down: { icon: 'trending_down', label: 'Đang giảm', color: 'text-emerald-500' },
    stable: { icon: 'trending_flat', label: 'Ổn định', color: 'text-blue-500' },
};

function generateMockPrediction(): QueuePrediction {
    const hour = new Date().getHours();
    // Busier in morning, quieter in afternoon
    const baseWait = hour < 11 ? 30 : hour < 14 ? 20 : 15;
    const jitter = Math.floor(Math.random() * 10) - 5;
    const waitMinutes = Math.max(5, baseWait + jitter);
    const trends: Trend[] = ['up', 'down', 'stable'];
    const trend = trends[Math.floor(Math.random() * 3)];
    return {
        waitMinutes,
        trend,
        queueLength: Math.floor(waitMinutes / 5) + 2,
        updatedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
}

// ============================================
// Component
// ============================================

export function AIQueuePredictor() {
    const [prediction, setPrediction] = useState<QueuePrediction | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const refresh = () => {
        // In production: call aiService.analyze({ type: 'queue_predict' })
        // Silent fail → show mock
        setPrediction(generateMockPrediction());
    };

    useEffect(() => {
        refresh(); // initial
        intervalRef.current = setInterval(refresh, 60_000); // every 60s
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    if (!prediction) {
        return (
            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-5 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            </div>
        );
    }

    const { waitMinutes, trend, queueLength, updatedAt } = prediction;
    const colors = getWaitColor(waitMinutes);
    const trendCfg = TREND_CONFIG[trend];

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-cyan-50 dark:bg-cyan-500/10 rounded-lg">
                        <span className="material-symbols-outlined text-cyan-600 text-[20px]">avg_time</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">AI Dự báo hàng chờ</h3>
                        <p className="text-xs text-[#687582] dark:text-gray-500">Cập nhật lúc {updatedAt}</p>
                    </div>
                </div>
                <button
                    onClick={refresh}
                    className="p-1.5 rounded-lg text-[#687582] hover:text-[#3C81C6] hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                    title="Làm mới"
                >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                </button>
            </div>

            {/* Body */}
            <div className="p-5">
                {/* Main wait time */}
                <div className={`flex items-center gap-4 p-4 rounded-xl border ${colors.bg} ${colors.border} mb-4`}>
                    <span className={`material-symbols-outlined text-[36px] ${colors.text}`}>schedule</span>
                    <div>
                        <p className="text-xs text-[#687582] dark:text-gray-500 mb-0.5">Thời gian chờ dự kiến</p>
                        <p className={`text-3xl font-black ${colors.text}`}>
                            ~{waitMinutes} <span className="text-base font-normal">phút</span>
                        </p>
                    </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-3">
                    {/* Queue length */}
                    <div className="flex-1 bg-[#f6f7f8] dark:bg-[#13191f] rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{queueLength}</p>
                        <p className="text-[10px] text-[#687582] dark:text-gray-500">BN đang chờ</p>
                    </div>

                    {/* Trend */}
                    <div className={`flex-1 rounded-xl p-3 text-center ${trendCfg.color.includes('red') ? 'bg-red-50 dark:bg-red-500/10' : trendCfg.color.includes('emerald') ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-blue-50 dark:bg-blue-500/10'}`}>
                        <span className={`material-symbols-outlined text-[22px] ${trendCfg.color}`}>{trendCfg.icon}</span>
                        <p className={`text-[10px] font-bold ${trendCfg.color}`}>{trendCfg.label}</p>
                    </div>

                    {/* Status */}
                    <div className={`flex-1 ${colors.bg} rounded-xl p-3 text-center border ${colors.border}`}>
                        <p className={`text-xs font-bold ${colors.text}`}>
                            {waitMinutes < 20 ? 'Ít chờ' : waitMinutes <= 45 ? 'Bình thường' : 'Đông'}
                        </p>
                        <p className="text-[10px] text-[#687582] dark:text-gray-500 mt-0.5">Tình trạng</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
