'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { aiService } from '@/services/aiService';
import type { AITriageResponse } from '@/services/aiService';
import type { Citation } from '@/types';
import { AI_TRIAGE_COLORS, AI_WAIT_TIME_THRESHOLD, AI_QUEUE_POLL_INTERVAL } from '@/constants/ai';
import { useAIPreferences } from '@/hooks/useAIPreferences';
import { AICitationBlock } from './AICitationBlock';

// ============================================
// Types
// ============================================

interface QueuePatient {
    id: string;
    fullName: string;
    age?: number;
    reason: string;
    status: string;
    waitTime?: string;
    checkInTime?: string;
}

interface AIQueuePriorityProps {
    queue: QueuePatient[];
    onReorderSuggestion?: (patientId: string) => void;
}

interface UrgencyEntry {
    urgency: 'urgent' | 'routine' | 'elective';
    reasoning: string;
    citations: Citation[];
    confidence: number;
}

interface AnomalyAlert {
    patientId: string;
    name: string;
    waitMinutes: number;
    reason: string;
    citations: Citation[];
}

// ============================================
// Helpers
// ============================================

function parseWaitMinutes(waitTime?: string): number {
    if (!waitTime) return 0;
    // Accept formats: "45 phút", "1 giờ 20 phút", "90"
    const hourMatch = waitTime.match(/(\d+)\s*gi[oờ]/i);
    const minMatch = waitTime.match(/(\d+)\s*(ph[uúù]t|min|m\b)/i);
    const rawNum = waitTime.match(/^(\d+)$/);

    let total = 0;
    if (hourMatch) total += parseInt(hourMatch[1]) * 60;
    if (minMatch) total += parseInt(minMatch[1]);
    if (!hourMatch && !minMatch && rawNum) total = parseInt(rawNum[1]);
    return total;
}

// ============================================
// Sub-components
// ============================================

function UrgencyBadge({ urgency }: { urgency: 'urgent' | 'routine' | 'elective' }) {
    const cfg = AI_TRIAGE_COLORS[urgency];
    return (
        <span
            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}
        >
            🤖 {cfg.label}
        </span>
    );
}

function AnomalyAlertBanner({
    alert,
    onPrioritize,
    onDismiss,
}: {
    alert: AnomalyAlert;
    onPrioritize: (id: string) => void;
    onDismiss: (id: string) => void;
}) {
    const [citationExpanded, setCitationExpanded] = useState(false);

    return (
        <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-amber-100 dark:bg-amber-900/40">
                <div className="flex items-center gap-2">
                    <span>🤖</span>
                    <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                        Cảnh báo Thời gian Chờ Bất thường
                    </span>
                </div>
                <button
                    onClick={() => onDismiss(alert.patientId)}
                    className="text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 transition-colors text-sm leading-none"
                    aria-label="Đóng cảnh báo"
                >
                    ✕
                </button>
            </div>

            {/* Body */}
            <div className="px-4 py-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 truncate">
                            {alert.name}
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                            Chờ: <span className="font-bold">{alert.waitMinutes} phút</span>
                            {' · '}
                            Lý do: {alert.reason}
                        </p>
                    </div>
                    <button
                        onClick={() => onPrioritize(alert.patientId)}
                        className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                    >
                        Ưu tiên
                    </button>
                </div>

                {/* Citations toggle */}
                {alert.citations.length > 0 && (
                    <div>
                        <button
                            onClick={() => setCitationExpanded((v) => !v)}
                            className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline"
                        >
                            {citationExpanded ? '▲ Ẩn nguồn' : '▼ Xem nguồn tham khảo'}
                        </button>
                        {citationExpanded && (
                            <div className="mt-2">
                                <AICitationBlock citations={alert.citations} defaultExpanded />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================
// Main component
// ============================================

export function AIQueuePriority({ queue, onReorderSuggestion }: AIQueuePriorityProps) {
    const { preferences } = useAIPreferences();

    const [priorityMode, setPriorityMode] = useState(false);
    const [urgencyMap, setUrgencyMap] = useState<Map<string, UrgencyEntry>>(new Map());
    const [loading, setLoading] = useState(false);
    const [anomalyAlerts, setAnomalyAlerts] = useState<AnomalyAlert[]>([]);
    const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

    const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ----------------------------------------
    // Triage batch fetch
    // ----------------------------------------
    const runTriageBatch = useCallback(async (patients: QueuePatient[]) => {
        if (patients.length === 0) return;
        setLoading(true);

        try {
            const waiting = patients.filter((p) => p.status === 'waiting' || p.status === 'Đang chờ');
            const results = await Promise.allSettled(
                waiting.map((p) =>
                    aiService.triageAssessment({ reason: p.reason, patientAge: p.age })
                )
            );

            const newMap = new Map<string, UrgencyEntry>();
            results.forEach((result, idx) => {
                if (result.status === 'fulfilled') {
                    const data: AITriageResponse = result.value.data;
                    newMap.set(waiting[idx].id, {
                        urgency: data.urgency,
                        reasoning: data.reasoning,
                        citations: data.citations,
                        confidence: data.confidence,
                    });
                }
            });

            setUrgencyMap(newMap);

            // Detect wait-time anomalies: urgent patients waiting > threshold
            const alerts: AnomalyAlert[] = [];
            waiting.forEach((p, idx) => {
                const waitMins = parseWaitMinutes(p.waitTime);
                const entry = newMap.get(p.id);
                if (
                    entry?.urgency === 'urgent' &&
                    waitMins >= AI_WAIT_TIME_THRESHOLD
                ) {
                    alerts.push({
                        patientId: p.id,
                        name: p.fullName,
                        waitMinutes: waitMins,
                        reason: p.reason,
                        citations: entry.citations,
                    });
                }
            });
            setAnomalyAlerts(alerts);
        } catch {
            // Graceful failure — AI không chặn workflow
        } finally {
            setLoading(false);
        }
    }, []);

    // ----------------------------------------
    // Toggle priority mode
    // ----------------------------------------
    const handleToggle = useCallback(async () => {
        const next = !priorityMode;
        setPriorityMode(next);

        if (next) {
            await runTriageBatch(queue);

            // Set up polling
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            pollTimerRef.current = setInterval(() => {
                runTriageBatch(queue);
            }, AI_QUEUE_POLL_INTERVAL);
        } else {
            // Clear state when turning off
            setUrgencyMap(new Map());
            setAnomalyAlerts([]);
            if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
            }
        }
    }, [priorityMode, queue, runTriageBatch]);

    // Re-run triage when queue changes while mode is active
    useEffect(() => {
        if (!priorityMode) return;
        runTriageBatch(queue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queue]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        };
    }, []);

    // ----------------------------------------
    // Anomaly alert handlers
    // ----------------------------------------
    const handleDismissAlert = useCallback((patientId: string) => {
        setDismissedAlerts((prev) => {
            const next = new Set(prev);
            next.add(patientId);
            return next;
        });
    }, []);

    const handlePrioritize = useCallback(
        (patientId: string) => {
            onReorderSuggestion?.(patientId);
            handleDismissAlert(patientId);
        },
        [onReorderSuggestion, handleDismissAlert]
    );

    // ----------------------------------------
    // Exposed helper: get urgency badge for a patient
    // ----------------------------------------
    const getUrgencyBadge = useCallback(
        (patientId: string) => {
            if (!priorityMode) return null;
            const entry = urgencyMap.get(patientId);
            if (!entry) return null;
            return <UrgencyBadge urgency={entry.urgency} />;
        },
        [priorityMode, urgencyMap]
    );

    const visibleAlerts = anomalyAlerts.filter((a) => !dismissedAlerts.has(a.patientId));

    return (
        <div className="space-y-3">
            {/* Toggle button */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleToggle}
                    disabled={loading}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                        priorityMode
                            ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-200 dark:shadow-violet-900'
                            : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                    aria-pressed={priorityMode}
                >
                    <span>🤖</span>
                    <span>AI Priority Mode</span>
                    {loading && (
                        <span className="ml-1 h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    )}
                    {priorityMode && !loading && (
                        <span className="ml-1 h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                    )}
                </button>

                {priorityMode && !loading && (
                    <span className="text-xs text-violet-600 dark:text-violet-400">
                        Đã phân loại {urgencyMap.size} bệnh nhân
                    </span>
                )}
            </div>

            {/* Anomaly banners */}
            {priorityMode && visibleAlerts.length > 0 && (
                <div className="space-y-2">
                    {visibleAlerts.map((alert) => (
                        <AnomalyAlertBanner
                            key={alert.patientId}
                            alert={alert}
                            onPrioritize={handlePrioritize}
                            onDismiss={handleDismissAlert}
                        />
                    ))}
                </div>
            )}

            {/* Urgency legend (shown when active) */}
            {priorityMode && urgencyMap.size > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                    <span>Phân loại AI:</span>
                    {(['urgent', 'routine', 'elective'] as const).map((u) => (
                        <span
                            key={u}
                            className={`px-2 py-0.5 rounded-full ${AI_TRIAGE_COLORS[u].bg} ${AI_TRIAGE_COLORS[u].text}`}
                        >
                            {AI_TRIAGE_COLORS[u].label}
                        </span>
                    ))}
                </div>
            )}

            {/* Disclaimer */}
            {priorityMode && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    Kết quả AI chỉ mang tính hỗ trợ. Bác sĩ chịu trách nhiệm quyết định lâm sàng.
                </p>
            )}
        </div>
    );
}

// Export helper type so consumers can type the render-prop pattern
export type { UrgencyEntry };
