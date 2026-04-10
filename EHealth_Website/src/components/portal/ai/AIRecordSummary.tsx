'use client';

import { useState, useEffect, useCallback } from 'react';
import { aiService } from '@/services/aiService';
import { useAIPreferences } from '@/hooks/useAIPreferences';
import { AICitationBlock } from './AICitationBlock';
import type { AIPatientSummary } from '@/types';

interface AIRecordSummaryProps {
    patientId: string;
    patientName?: string;
}

// ── Loading skeleton ──────────────────────────────────────────
function RecordSummarySkeleton() {
    return (
        <div className="w-full rounded-xl overflow-hidden border border-violet-200 dark:border-violet-800 animate-pulse">
            {/* Header */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20 px-5 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-violet-200 dark:bg-violet-700" />
                        <div className="h-4 w-64 rounded bg-violet-200 dark:bg-violet-700" />
                    </div>
                    <div className="h-7 w-24 rounded-md bg-violet-200 dark:bg-violet-700" />
                </div>
            </div>
            {/* Body */}
            <div className="bg-white dark:bg-gray-900 px-5 py-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[0, 1].map((i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                            <div className="h-3 w-full rounded bg-gray-100 dark:bg-gray-800" />
                            <div className="h-3 w-5/6 rounded bg-gray-100 dark:bg-gray-800" />
                            <div className="h-3 w-4/6 rounded bg-gray-100 dark:bg-gray-800" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────
export function AIRecordSummary({ patientId, patientName }: AIRecordSummaryProps) {
    const { preferences } = useAIPreferences();
    const [summary, setSummary] = useState<AIPatientSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [collapsed, setCollapsed] = useState(false);
    const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

    const fetchSummary = useCallback(async () => {
        setLoading(true);
        try {
            const res = await aiService.summarizePatient(patientId);
            setSummary(res.data.summary);
            setGeneratedAt(new Date());
        } catch {
            // Silently fail — show nothing on error
            setSummary(null);
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    // Gate: AI features disabled
    if (!preferences.enableExamSuggestions) return null;

    // Loading state
    if (loading) return <RecordSummarySkeleton />;

    // Silently fail — nothing to show on error
    if (!summary) return null;

    const displayName = patientName ?? summary.patientName ?? patientId;
    const timeLabel = generatedAt
        ? generatedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : '--:--';

    return (
        <div className="w-full rounded-xl overflow-hidden border border-violet-200 dark:border-violet-800 shadow-sm">
            {/* Header */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20 px-5 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">🤖</span>
                        <span className="text-sm font-semibold text-violet-700 dark:text-violet-300 truncate">
                            AI Tóm tắt lịch sử bệnh — {displayName}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {/* Refresh button */}
                        <button
                            onClick={fetchSummary}
                            title="Tạo lại"
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-violet-600 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors border border-violet-200 dark:border-violet-700"
                            aria-label="Tạo lại tóm tắt"
                        >
                            <span>⟳</span>
                            <span>Tạo lại</span>
                        </button>

                        {/* Collapse toggle */}
                        <button
                            onClick={() => setCollapsed((c) => !c)}
                            title={collapsed ? 'Mở rộng' : 'Thu gọn'}
                            className="p-1.5 rounded-md text-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
                            aria-label={collapsed ? 'Mở rộng' : 'Thu gọn'}
                        >
                            <span className="text-xs">{collapsed ? '▼' : '▲'}</span>
                        </button>
                    </div>
                </div>

                {/* Sub-header */}
                <p className="mt-0.5 text-xs text-violet-500 dark:text-violet-400">
                    Được tạo lúc {timeLabel}
                </p>
            </div>

            {/* Collapsible body */}
            {!collapsed && (
                <div className="bg-white dark:bg-gray-900 px-5 py-4 space-y-4">
                    {/* 2-column grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left: Chronic conditions */}
                        <div>
                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                🏥 Bệnh mãn tính
                            </h4>
                            {summary.chronicConditions.length === 0 ? (
                                <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                                    Không có bệnh mãn tính được ghi nhận
                                </p>
                            ) : (
                                <ul className="space-y-1">
                                    {summary.chronicConditions.map((condition, idx) => (
                                        <li
                                            key={idx}
                                            className="flex items-start gap-1.5 text-sm text-gray-700 dark:text-gray-300"
                                        >
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-400 dark:bg-violet-500 shrink-0" />
                                            {condition}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Right: Current medications */}
                        <div>
                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                💊 Thuốc đang dùng
                            </h4>
                            {summary.currentMedications.length === 0 ? (
                                <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                                    Không có thuốc đang sử dụng
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {summary.currentMedications.map((med, idx) => {
                                        const isPoorCompliance =
                                            med.compliance?.toLowerCase() === 'kém' ||
                                            med.compliance?.toLowerCase() === 'poor';
                                        return (
                                            <li key={idx} className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                        {med.name}
                                                    </span>
                                                    {med.dosage && (
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                                            — {med.dosage}
                                                        </span>
                                                    )}
                                                </div>
                                                {med.compliance && (
                                                    <span
                                                        className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 font-medium ${
                                                            isPoorCompliance
                                                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                        }`}
                                                    >
                                                        {med.compliance}
                                                    </span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Red flags */}
                    {summary.redFlags.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <span className="text-sm">⚠️</span>
                                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                                    Dấu hiệu cần lưu ý
                                </span>
                            </div>
                            <ul className="space-y-1">
                                {summary.redFlags.map((flag, idx) => (
                                    <li
                                        key={idx}
                                        className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-1.5"
                                    >
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                        {flag}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Citations */}
                    {summary.citations.length > 0 && (
                        <AICitationBlock citations={summary.citations} />
                    )}
                </div>
            )}
        </div>
    );
}
