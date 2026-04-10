'use client';

import { useState, useCallback } from 'react';
import { aiService } from '@/services/aiService';
import { AISuggestionPanel } from './AISuggestionPanel';
import type { AIPrescriptionAuditResponse } from '@/services/aiService';
import type { Citation } from '@/types';

type AuditIssue = AIPrescriptionAuditResponse['issues'][number];

interface AIPrescriptionAuditProps {
    prescriptions: {
        id: string;
        patientName: string;
        medicines: string;
        status: string;
    }[];
    onDismiss?: () => void;
}

// ── Severity config ───────────────────────────────────────────
const SEVERITY_CONFIG: Record<
    AuditIssue['severity'],
    {
        border: string;
        badgeBg: string;
        badgeText: string;
        label: string;
        panelVariant: 'default' | 'warning' | 'critical';
    }
> = {
    serious: {
        border: 'border-l-red-500',
        badgeBg: 'bg-red-100 dark:bg-red-900/40',
        badgeText: 'text-red-700 dark:text-red-400',
        label: 'Nghiêm trọng',
        panelVariant: 'critical',
    },
    caution: {
        border: 'border-l-amber-500',
        badgeBg: 'bg-amber-100 dark:bg-amber-900/40',
        badgeText: 'text-amber-700 dark:text-amber-400',
        label: 'Cần thận trọng',
        panelVariant: 'warning',
    },
    info: {
        border: 'border-l-blue-500',
        badgeBg: 'bg-blue-100 dark:bg-blue-900/40',
        badgeText: 'text-blue-700 dark:text-blue-400',
        label: 'Thông tin',
        panelVariant: 'default',
    },
};

// ── Derive worst severity for overall panel variant ────────────
function getWorstVariant(issues: AuditIssue[]): 'default' | 'warning' | 'critical' {
    if (issues.some((i) => i.severity === 'serious')) return 'critical';
    if (issues.some((i) => i.severity === 'caution')) return 'warning';
    return 'default';
}

// ── Single issue card ─────────────────────────────────────────
function IssueCard({ issue }: { issue: AuditIssue }) {
    const config = SEVERITY_CONFIG[issue.severity];
    const firstCitation: Citation | undefined = issue.citations?.[0];

    return (
        <div
            className={`border border-l-4 ${config.border} border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 space-y-2`}
        >
            {/* Severity badge + title */}
            <div className="flex items-start gap-2 flex-wrap">
                <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.badgeBg} ${config.badgeText} shrink-0`}
                >
                    {config.label}
                </span>
                <span className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-snug">
                    {issue.title}
                </span>
            </div>

            {/* Detail text */}
            {issue.detail && (
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {issue.detail}
                </p>
            )}

            {/* Citation text */}
            {firstCitation && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded px-3 py-2">
                    <p className="text-[10px] text-yellow-800 dark:text-yellow-300">
                        📚 {firstCitation.source}
                        {firstCitation.section ? ` · ${firstCitation.section}` : ''}
                        {firstCitation.excerpt ? `: "${firstCitation.excerpt}"` : ''}
                    </p>
                </div>
            )}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────
export function AIPrescriptionAudit({ prescriptions, onDismiss }: AIPrescriptionAuditProps) {
    const [issues, setIssues] = useState<AuditIssue[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [panelVisible, setPanelVisible] = useState(false);

    const runAudit = useCallback(async () => {
        setLoading(true);
        setError(false);
        setPanelVisible(true);

        try {
            const res = await aiService.auditPrescription({
                prescriptions: prescriptions as unknown as Record<string, unknown>[],
            });
            setIssues(res.data.issues ?? []);
        } catch {
            setError(true);
            setIssues(null);
        } finally {
            setLoading(false);
        }
    }, [prescriptions]);

    const handleDismiss = useCallback(() => {
        setPanelVisible(false);
        setIssues(null);
        setError(false);
        onDismiss?.();
    }, [onDismiss]);

    const worstVariant = issues && issues.length > 0 ? getWorstVariant(issues) : 'default';

    return (
        <div className="space-y-3">
            {/* Trigger button */}
            <div className="flex items-center gap-2">
                <button
                    onClick={runAudit}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
                    aria-label="Kiểm tra an toàn đơn thuốc bằng AI"
                >
                    <span>🤖</span>
                    <span>{loading ? 'Đang kiểm tra...' : 'Kiểm tra an toàn AI'}</span>
                </button>
            </div>

            {/* Results panel */}
            {panelVisible && (
                <>
                    {/* Loading state */}
                    {loading && (
                        <div className="w-full rounded-xl overflow-hidden border border-violet-200 dark:border-violet-800 animate-pulse">
                            <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20 px-5 py-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded bg-violet-200 dark:bg-violet-700" />
                                    <div className="h-4 w-48 rounded bg-violet-200 dark:bg-violet-700" />
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-900 px-5 py-4 space-y-3">
                                {[0, 1].map((i) => (
                                    <div
                                        key={i}
                                        className="h-20 rounded-lg bg-gray-100 dark:bg-gray-800"
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Error state */}
                    {!loading && error && (
                        <div className="w-full rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="bg-gray-50 dark:bg-gray-800 px-5 py-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">⚠️</span>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        AI tạm không khả dụng
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={runAudit}
                                        className="text-xs px-3 py-1.5 rounded-md border border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors font-medium"
                                    >
                                        Thử lại
                                    </button>
                                    <button
                                        onClick={handleDismiss}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                        aria-label="Đóng"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Success state */}
                    {!loading && !error && issues !== null && (
                        <AISuggestionPanel
                            title="Kết quả kiểm tra an toàn đơn thuốc"
                            variant={worstVariant}
                            onDismiss={handleDismiss}
                        >
                            {issues.length === 0 ? (
                                /* No issues found */
                                <div className="flex items-center gap-2 py-2">
                                    <span className="text-lg">✅</span>
                                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                        Không phát hiện vấn đề an toàn nào trong các đơn thuốc
                                    </span>
                                </div>
                            ) : (
                                /* Issues found */
                                <div className="space-y-3 pt-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Phát hiện{' '}
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                                            {issues.length}
                                        </span>{' '}
                                        vấn đề cần xem xét:
                                    </p>
                                    {issues.map((issue, idx) => (
                                        <IssueCard key={`${issue.prescriptionId}-${idx}`} issue={issue} />
                                    ))}
                                </div>
                            )}
                        </AISuggestionPanel>
                    )}
                </>
            )}
        </div>
    );
}
