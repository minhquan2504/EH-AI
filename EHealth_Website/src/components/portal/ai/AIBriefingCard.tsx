'use client';

import { useState, useEffect, useCallback } from 'react';
import { aiService } from '@/services/aiService';
import { useAIPreferences } from '@/hooks/useAIPreferences';
import type { AIBriefingItem, Citation } from '@/types';

const SESSION_KEY = 'ai_briefing_dismissed';

interface AIBriefingCardProps {
    doctorId: string;
}

interface BriefingData {
    items: AIBriefingItem[];
    generatedAt: string;
}

// ── Item type config ─────────────────────────────────────────
const ITEM_TYPE_CONFIG: Record<
    AIBriefingItem['type'],
    { border: string; icon: string; titleColor: string; bgColor: string }
> = {
    allergy_warning: {
        border: 'border-l-red-500',
        icon: '⚠️',
        titleColor: 'text-red-700 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-950/20',
    },
    follow_up_alert: {
        border: 'border-l-amber-500',
        icon: '🔄',
        titleColor: 'text-amber-700 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    },
    performance: {
        border: 'border-l-blue-500',
        icon: '📊',
        titleColor: 'text-blue-700 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    },
    anomaly: {
        border: 'border-l-red-500',
        icon: '⚠️',
        titleColor: 'text-red-700 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-950/20',
    },
};

// ── Loading skeleton ──────────────────────────────────────────
function BriefingSkeleton() {
    return (
        <div className="w-full rounded-xl overflow-hidden border border-violet-200 dark:border-violet-800 animate-pulse">
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20 px-5 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-violet-200 dark:bg-violet-700" />
                        <div className="h-4 w-40 rounded bg-violet-200 dark:bg-violet-700" />
                    </div>
                    <div className="flex gap-2">
                        <div className="h-7 w-7 rounded bg-violet-200 dark:bg-violet-700" />
                        <div className="h-7 w-7 rounded bg-violet-200 dark:bg-violet-700" />
                    </div>
                </div>
                <div className="mt-1 h-3 w-56 rounded bg-violet-100 dark:bg-violet-800/50" />
            </div>
            <div className="bg-white dark:bg-gray-900 px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-3 w-full rounded bg-gray-100 dark:bg-gray-800" />
                        <div className="h-3 w-5/6 rounded bg-gray-100 dark:bg-gray-800" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Single briefing item card ─────────────────────────────────
function BriefingItemCard({ item }: { item: AIBriefingItem }) {
    const config = ITEM_TYPE_CONFIG[item.type];
    const primaryCitation: Citation | undefined = item.citations?.[0];

    return (
        <div
            className={`${config.bgColor} border border-l-4 ${config.border} border-gray-200 dark:border-gray-700 rounded-lg p-3 flex flex-col gap-1.5`}
        >
            <div className={`text-sm font-bold ${config.titleColor} flex items-center gap-1.5`}>
                <span>{config.icon}</span>
                <span>{item.title}</span>
            </div>

            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                {item.content}
            </p>

            {item.patientName && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    👤 {item.patientName}
                </span>
            )}

            {primaryCitation && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-auto pt-1 border-t border-gray-200 dark:border-gray-700">
                    📚 {primaryCitation.source}
                    {primaryCitation.section ? ` · ${primaryCitation.section}` : ''}
                </p>
            )}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────
export function AIBriefingCard({ doctorId }: AIBriefingCardProps) {
    const { preferences } = useAIPreferences();
    const [briefing, setBriefing] = useState<BriefingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dismissed, setDismissed] = useState(false);
    const [fetchedAt, setFetchedAt] = useState<Date | null>(null);

    // Check session storage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = sessionStorage.getItem(SESSION_KEY);
            if (stored === 'true') setDismissed(true);
        }
    }, []);

    const fetchBriefing = useCallback(async () => {
        setLoading(true);
        try {
            const res = await aiService.getDailyBriefing(doctorId);
            setBriefing(res.data);
            setFetchedAt(new Date());
        } catch {
            // Silently fail
            setBriefing(null);
        } finally {
            setLoading(false);
        }
    }, [doctorId]);

    useEffect(() => {
        if (preferences.enableDashboardBriefing && !dismissed) {
            fetchBriefing();
        } else {
            setLoading(false);
        }
    }, [preferences.enableDashboardBriefing, dismissed, fetchBriefing]);

    const handleDismiss = () => {
        setDismissed(true);
        if (typeof window !== 'undefined') {
            sessionStorage.setItem(SESSION_KEY, 'true');
        }
    };

    const handleRefresh = () => {
        fetchBriefing();
    };

    // Gate: preference disabled
    if (!preferences.enableDashboardBriefing) return null;

    // Gate: dismissed
    if (dismissed) return null;

    // Loading state
    if (loading) return <BriefingSkeleton />;

    // Silently fail – nothing to show
    if (!briefing) return null;

    // Format time
    const timeLabel = fetchedAt
        ? fetchedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : '--:--';

    const appointmentCount = briefing.items.length;

    return (
        <div className="w-full rounded-xl overflow-hidden border border-violet-200 dark:border-violet-800 shadow-sm">
            {/* Header */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20 px-5 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🤖</span>
                        <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                            AI Briefing hôm nay
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {/* Refresh button */}
                        <button
                            onClick={handleRefresh}
                            title="Làm mới"
                            className="p-1.5 rounded-md text-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
                            aria-label="Làm mới briefing"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                        </button>

                        {/* Dismiss button */}
                        <button
                            onClick={handleDismiss}
                            title="Đóng"
                            className="p-1.5 rounded-md text-gray-400 hover:bg-violet-100 dark:hover:bg-violet-900/40 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            aria-label="Đóng briefing"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Sub-header */}
                <p className="mt-0.5 text-xs text-violet-500 dark:text-violet-400">
                    Cập nhật: {timeLabel} | Dựa trên {appointmentCount} lịch hẹn
                </p>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-gray-900 px-5 py-4">
                {briefing.items.length === 0 ? (
                    <div className="flex items-center gap-2 py-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="text-green-500">✅</span>
                        <span>Không có cảnh báo nào hôm nay</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {briefing.items.map((item) => (
                            <BriefingItemCard key={item.id} item={item} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
