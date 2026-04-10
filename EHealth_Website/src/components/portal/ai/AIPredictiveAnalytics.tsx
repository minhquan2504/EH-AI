'use client';

import { useState } from 'react';

// ============================================
// Types & Mock Data
// ============================================

interface ForecastDay {
    day: string;
    actual: number;
    predicted: number;
}

const MOCK_FORECAST: ForecastDay[] = [
    { day: 'T2', actual: 120, predicted: 125 },
    { day: 'T3', actual: 135, predicted: 140 },
    { day: 'T4', actual: 0, predicted: 155 },
    { day: 'T5', actual: 0, predicted: 148 },
    { day: 'T6', actual: 0, predicted: 160 },
];

const MAX_VALUE = Math.max(...MOCK_FORECAST.map(d => Math.max(d.actual, d.predicted)));

// ============================================
// Component
// ============================================

export function AIPredictiveAnalytics() {
    const [forecast] = useState<ForecastDay[]>(MOCK_FORECAST);

    const avgPredicted = Math.round(forecast.reduce((s, d) => s + d.predicted, 0) / forecast.length);
    const avgActual = Math.round(forecast.filter(d => d.actual > 0).reduce((s, d) => s + d.actual, 0) / forecast.filter(d => d.actual > 0).length);
    const changePercent = avgActual ? Math.round(((avgPredicted - avgActual) / avgActual) * 100) : 15;

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-violet-50 dark:bg-violet-500/10 rounded-lg">
                        <span className="material-symbols-outlined text-violet-600 text-[20px]">insights</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">AI Dự báo bệnh nhân</h3>
                        <p className="text-xs text-[#687582] dark:text-gray-500">Dự báo 5 ngày tới</p>
                    </div>
                </div>
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${changePercent > 0 ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'}`}>
                    <span className="material-symbols-outlined text-[14px]">
                        {changePercent > 0 ? 'trending_up' : 'trending_down'}
                    </span>
                    {changePercent > 0 ? '+' : ''}{changePercent}%
                </span>
            </div>

            {/* Insight text */}
            <div className="px-5 pt-4 pb-2">
                <p className="text-xs text-[#121417] dark:text-white font-medium">
                    Dự báo: Lượng BN <span className="text-amber-500 font-bold">tăng ~{Math.abs(changePercent)}%</span> tuần tới
                </p>
                <p className="text-xs text-[#687582] dark:text-gray-500">Đặc biệt cao vào T4 (~155 BN) và T6 (~160 BN)</p>
            </div>

            {/* Bar chart */}
            <div className="px-5 pb-5 pt-2">
                <div className="flex items-end gap-2 h-28">
                    {forecast.map((d) => {
                        const isFuture = d.actual === 0;
                        const barHeight = (d.predicted / MAX_VALUE) * 100;
                        const actualHeight = isFuture ? 0 : (d.actual / MAX_VALUE) * 100;

                        return (
                            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full flex items-end gap-0.5 h-24">
                                    {/* Actual bar */}
                                    {!isFuture && (
                                        <div className="flex-1 flex flex-col justify-end">
                                            <div
                                                className="w-full rounded-t-sm bg-[#3C81C6]"
                                                style={{ height: `${actualHeight}%` }}
                                                title={`Thực tế: ${d.actual}`}
                                            />
                                        </div>
                                    )}
                                    {/* Predicted bar */}
                                    <div className="flex-1 flex flex-col justify-end">
                                        <div
                                            className={`w-full rounded-t-sm ${isFuture ? 'bg-violet-400 dark:bg-violet-500' : 'bg-violet-200 dark:bg-violet-600/40'}`}
                                            style={{ height: `${barHeight}%` }}
                                            title={`Dự báo: ${d.predicted}`}
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] font-medium text-[#687582] dark:text-gray-500">{d.day}</p>
                                {isFuture && (
                                    <p className="text-[9px] text-violet-500 font-bold">{d.predicted}</p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-[10px] text-[#687582]">
                        <span className="w-3 h-2 rounded-sm bg-[#3C81C6]" />Thực tế
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-[#687582]">
                        <span className="w-3 h-2 rounded-sm bg-violet-400" />Dự báo
                    </span>
                </div>
            </div>
        </div>
    );
}
