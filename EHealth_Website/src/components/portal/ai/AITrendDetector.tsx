'use client';

import { useState, useEffect, useCallback } from 'react';
import { aiService } from '@/services/aiService';
import type { AITrendAlert, Citation } from '@/types';

interface AITrendDetectorProps {
    patientId: string;
    onTrendsLoaded?: (trends: AITrendAlert[]) => void;
}

// ── Trend direction config ────────────────────────────────────
const TREND_CONFIG: Record<
    AITrendAlert['trend'],
    { label: string; icon: string; barColor: string; textColor: string }
> = {
    increasing: {
        label: 'Tăng dần',
        icon: '↑',
        barColor: 'bg-red-400 dark:bg-red-500',
        textColor: 'text-red-600 dark:text-red-400',
    },
    decreasing: {
        label: 'Giảm dần',
        icon: '↓',
        barColor: 'bg-blue-400 dark:bg-blue-500',
        textColor: 'text-blue-600 dark:text-blue-400',
    },
    fluctuating: {
        label: 'Biến động',
        icon: '↕',
        barColor: 'bg-amber-400 dark:bg-amber-500',
        textColor: 'text-amber-600 dark:text-amber-400',
    },
};

// ── Mini bar chart ────────────────────────────────────────────
function MiniBarChart({
    values,
    barColor,
}: {
    values: { date: string; value: number }[];
    barColor: string;
}) {
    if (values.length === 0) return null;

    const nums = values.map((v) => v.value);
    const max = Math.max(...nums);
    const min = Math.min(...nums);
    const range = max - min || 1;

    const BAR_MAX_HEIGHT = 40; // px

    return (
        <div className="flex items-end gap-1">
            {values.map((point, idx) => {
                const heightPct = ((point.value - min) / range) * BAR_MAX_HEIGHT + 4;
                return (
                    <div key={idx} className="flex flex-col items-center gap-0.5">
                        <div
                            className={`w-5 rounded-t-sm ${barColor} opacity-80`}
                            style={{ height: `${heightPct}px` }}
                            title={`${point.value} (${point.date})`}
                        />
                        <span className="text-[9px] text-gray-500 dark:text-gray-400 leading-none">
                            {point.value}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// ── Single trend card ─────────────────────────────────────────
function TrendCard({ trend }: { trend: AITrendAlert }) {
    const config = TREND_CONFIG[trend.trend];
    const firstCitation: Citation | undefined = trend.citations?.[0];

    const sortedValues = [...trend.values].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const latestValue = sortedValues[sortedValues.length - 1];
    const earliestValue = sortedValues[0];

    return (
        <div className="bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-3">
            {/* Top row: parameter + trend direction */}
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 capitalize">
                        {trend.parameter.replace(/_/g, ' ')}
                    </span>
                </div>
                <span
                    className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 ${config.textColor} shrink-0`}
                >
                    <span>{config.icon}</span>
                    <span>{config.label}</span>
                </span>
            </div>

            {/* Values with dates */}
            {sortedValues.length > 0 && (
                <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                    {earliestValue && (
                        <span>
                            <span className="text-gray-400 dark:text-gray-500">Từ </span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {earliestValue.value}
                            </span>
                            <span className="text-gray-400 dark:text-gray-500">
                                {' '}({earliestValue.date})
                            </span>
                        </span>
                    )}
                    {sortedValues.length > 1 && latestValue && (
                        <>
                            <span className="text-gray-300 dark:text-gray-600">→</span>
                            <span>
                                <span className="text-gray-400 dark:text-gray-500">Đến </span>
                                <span className={`font-bold ${config.textColor}`}>
                                    {latestValue.value}
                                </span>
                                <span className="text-gray-400 dark:text-gray-500">
                                    {' '}({latestValue.date})
                                </span>
                            </span>
                        </>
                    )}
                </div>
            )}

            {/* Mini bar chart */}
            {sortedValues.length > 1 && (
                <MiniBarChart values={sortedValues} barColor={config.barColor} />
            )}

            {/* Clinical significance */}
            {trend.clinicalSignificance && (
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed border-t border-amber-100 dark:border-amber-900/30 pt-2">
                    {trend.clinicalSignificance}
                </p>
            )}

            {/* Citation text */}
            {firstCitation && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700 pt-1.5">
                    📚 {firstCitation.source}
                    {firstCitation.section ? ` · ${firstCitation.section}` : ''}
                    {firstCitation.excerpt ? ` — "${firstCitation.excerpt}"` : ''}
                </p>
            )}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────
export function AITrendDetector({ patientId, onTrendsLoaded }: AITrendDetectorProps) {
    const [trends, setTrends] = useState<AITrendAlert[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTrends = useCallback(async () => {
        setLoading(true);
        try {
            const res = await aiService.detectTrends({ patientId });
            const fetched = res.data.trends ?? [];
            setTrends(fetched);
            onTrendsLoaded?.(fetched);
        } catch {
            // Silently fail — show nothing on error
            setTrends([]);
            onTrendsLoaded?.([]);
        } finally {
            setLoading(false);
        }
    }, [patientId, onTrendsLoaded]);

    useEffect(() => {
        fetchTrends();
    }, [fetchTrends]);

    // While loading, show nothing (inline component — avoid layout shift)
    if (loading) return null;

    // No trends or error — show nothing
    if (trends.length === 0) return null;

    return (
        <div className="w-full rounded-xl overflow-hidden border border-amber-200 dark:border-amber-800 shadow-sm">
            {/* Header */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 px-5 py-3">
                <div className="flex items-center gap-2">
                    <span className="text-base">📈</span>
                    <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                        AI Phát hiện xu hướng bất thường
                    </span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-medium">
                        {trends.length} xu hướng
                    </span>
                </div>
                <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                    Phân tích dựa trên dữ liệu xét nghiệm theo thời gian
                </p>
            </div>

            {/* Trend cards */}
            <div className="bg-white dark:bg-gray-900 px-5 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {trends.map((trend) => (
                        <TrendCard key={trend.id} trend={trend} />
                    ))}
                </div>
            </div>
        </div>
    );
}
