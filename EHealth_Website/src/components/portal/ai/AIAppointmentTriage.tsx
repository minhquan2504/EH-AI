'use client';

import { useState, useEffect, useCallback } from 'react';
import { aiService } from '@/services/aiService';
import type { AITriageResponse, AIAnalyzeResponse } from '@/services/aiService';
import type { Citation, AISuggestion } from '@/types';
import { AI_TRIAGE_COLORS } from '@/constants/ai';
import { AICitationBlock } from './AICitationBlock';

// ============================================
// Types
// ============================================

export interface PendingRequest {
    id: string;
    patientName: string;
    reason: string;
    patientAge?: number;
}

interface AIAppointmentTriageProps {
    pendingRequests: PendingRequest[];
    doctorId: string;
}

interface TriageEntry {
    urgency: 'urgent' | 'routine' | 'elective';
    reasoning: string;
    citations: Citation[];
    confidence: number;
}

interface FollowUpEntry {
    patientName: string;
    daysOverdue: number;
    originalCondition: string;
    citations: Citation[];
}

// ============================================
// Sub-components
// ============================================

function TriageSpinner() {
    return (
        <span
            className="inline-block h-3.5 w-3.5 rounded-full border-2 border-violet-400 border-t-transparent animate-spin align-middle"
            aria-label="Đang phân loại AI..."
        />
    );
}

function UrgencyBadgeWithTooltip({
    entry,
    requestId,
}: {
    entry: TriageEntry;
    requestId: string;
}) {
    const [showTooltip, setShowTooltip] = useState(false);
    const cfg = AI_TRIAGE_COLORS[entry.urgency];

    return (
        <div className="relative inline-flex items-center gap-1">
            <span
                id={`triage-badge-${requestId}`}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onFocus={() => setShowTooltip(true)}
                onBlur={() => setShowTooltip(false)}
                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full cursor-default select-none ${cfg.bg} ${cfg.text}`}
                tabIndex={0}
                aria-describedby={`triage-tip-${requestId}`}
            >
                🤖 {cfg.label}
            </span>

            {showTooltip && (
                <div
                    id={`triage-tip-${requestId}`}
                    role="tooltip"
                    className="absolute bottom-full left-0 mb-1.5 z-50 w-56 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg p-2.5"
                >
                    <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-100 mb-1">
                        Lý do phân loại AI
                    </p>
                    <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed">
                        {entry.reasoning}
                    </p>
                    <p className="mt-1.5 text-[10px] text-violet-500 dark:text-violet-400">
                        Độ tin cậy: {entry.confidence}%
                    </p>
                </div>
            )}
        </div>
    );
}

function FollowUpBanner({ followUps }: { followUps: FollowUpEntry[] }) {
    const [expanded, setExpanded] = useState(false);
    const [citationExpanded, setCitationExpanded] = useState<Set<number>>(new Set());

    const toggleCitation = (idx: number) => {
        setCitationExpanded((prev) => {
            const next = new Set(prev);
            next.has(idx) ? next.delete(idx) : next.add(idx);
            return next;
        });
    };

    return (
        <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 overflow-hidden">
            {/* Header */}
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200/60 dark:hover:bg-amber-900/60 transition-colors text-left"
                aria-expanded={expanded}
            >
                <div className="flex items-center gap-2">
                    <span>⏰</span>
                    <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                        AI Theo dõi tái khám —{' '}
                        <span className="font-bold">{followUps.length}</span> trường hợp quá hạn
                    </span>
                </div>
                <svg
                    className={`w-3.5 h-3.5 text-amber-600 dark:text-amber-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {expanded && (
                <div className="divide-y divide-amber-200 dark:divide-amber-800">
                    {followUps.map((fu, idx) => (
                        <div key={idx} className="px-4 py-3 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5 min-w-0">
                                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 truncate">
                                        {fu.patientName}
                                    </p>
                                    <p className="text-xs text-amber-700 dark:text-amber-300">
                                        <span className="font-bold text-red-600 dark:text-red-400">
                                            +{fu.daysOverdue} ngày
                                        </span>
                                        {' · '}
                                        {fu.originalCondition}
                                    </p>
                                </div>
                                {fu.citations.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => toggleCitation(idx)}
                                        className="shrink-0 text-[10px] text-amber-600 dark:text-amber-400 hover:underline"
                                    >
                                        {citationExpanded.has(idx) ? '▲ Ẩn nguồn' : '▼ Xem nguồn'}
                                    </button>
                                )}
                            </div>
                            {citationExpanded.has(idx) && fu.citations.length > 0 && (
                                <AICitationBlock citations={fu.citations} defaultExpanded />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================
// Main component
// ============================================

export function AIAppointmentTriage({ pendingRequests, doctorId }: AIAppointmentTriageProps) {
    const [triageMap, setTriageMap] = useState<Map<string, TriageEntry>>(new Map());
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
    const [followUps, setFollowUps] = useState<FollowUpEntry[]>([]);

    // ----------------------------------------
    // Batch triage on mount
    // ----------------------------------------
    const runBatchTriage = useCallback(async (requests: PendingRequest[]) => {
        if (requests.length === 0) return;

        // Mark all as loading
        setLoadingIds(new Set(requests.map((r) => r.id)));

        try {
            const results = await Promise.allSettled(
                requests.map((r) =>
                    aiService.triageAssessment({
                        reason: r.reason,
                        patientAge: r.patientAge,
                    })
                )
            );

            const newMap = new Map<string, TriageEntry>(triageMap);
            const loadedIds = new Set<string>();

            results.forEach((result, idx) => {
                const requestId = requests[idx].id;
                loadedIds.add(requestId);
                if (result.status === 'fulfilled') {
                    const data: AITriageResponse = result.value.data;
                    newMap.set(requestId, {
                        urgency: data.urgency,
                        reasoning: data.reasoning,
                        citations: data.citations,
                        confidence: data.confidence,
                    });
                }
                // Silent fail: unfulfilled requests just won't appear in map
            });

            setTriageMap(newMap);
            setLoadingIds((prev) => {
                const next = new Set(prev);
                loadedIds.forEach((id) => next.delete(id));
                return next;
            });
        } catch {
            // Silent fail — do not block the appointments workflow
            setLoadingIds(new Set());
        }
    }, [triageMap]);

    // ----------------------------------------
    // Follow-up tracking on mount
    // ----------------------------------------
    const fetchFollowUps = useCallback(async () => {
        try {
            const res = await aiService.trackFollowUps(doctorId);
            const data: AIAnalyzeResponse<AISuggestion> = res.data;

            // Map suggestions → FollowUpEntry heuristically
            const entries: FollowUpEntry[] = (data.suggestions ?? []).map((s) => ({
                patientName: (s as unknown as Record<string, string>).patientName ?? 'Bệnh nhân',
                daysOverdue: Number((s as unknown as Record<string, unknown>).daysOverdue ?? 0),
                originalCondition: (s as unknown as Record<string, string>).condition ?? s.content ?? '',
                citations: (s as unknown as { citations?: Citation[] }).citations ?? data.citations ?? [],
            }));

            setFollowUps(entries);
        } catch {
            // Silent fail
        }
    }, [doctorId]);

    useEffect(() => {
        runBatchTriage(pendingRequests);
        fetchFollowUps();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Re-run when new requests appear
    useEffect(() => {
        const newRequests = pendingRequests.filter((r) => !triageMap.has(r.id) && !loadingIds.has(r.id));
        if (newRequests.length > 0) {
            runBatchTriage(newRequests);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingRequests]);

    // ----------------------------------------
    // Exposed helper: get triage badge for a request ID
    // ----------------------------------------
    const getTriageBadge = useCallback(
        (requestId: string): React.ReactNode => {
            if (loadingIds.has(requestId)) {
                return <TriageSpinner />;
            }
            const entry = triageMap.get(requestId);
            if (!entry) return null;
            return <UrgencyBadgeWithTooltip entry={entry} requestId={requestId} />;
        },
        [triageMap, loadingIds]
    );

    return (
        <div className="space-y-3" data-testid="ai-appointment-triage">
            {/* Follow-up overdue banner */}
            {followUps.length > 0 && <FollowUpBanner followUps={followUps} />}

            {/* Triage badges inline per request */}
            {pendingRequests.length > 0 && (
                <div className="space-y-1.5">
                    {pendingRequests.map((req) => (
                        <div
                            key={req.id}
                            className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
                        >
                            <span className="truncate max-w-[160px] font-medium text-gray-800 dark:text-gray-200">
                                {req.patientName}
                            </span>
                            {getTriageBadge(req.id)}
                        </div>
                    ))}
                </div>
            )}

            {/* Disclaimer */}
            {triageMap.size > 0 && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    🤖 Phân loại AI chỉ mang tính hỗ trợ. Bác sĩ chịu trách nhiệm quyết định lâm sàng.
                </p>
            )}
        </div>
    );
}

// Export helper so consumers can integrate badge rendering
export type { TriageEntry };
