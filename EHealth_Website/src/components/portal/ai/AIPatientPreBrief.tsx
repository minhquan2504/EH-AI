'use client';

import { useState, useEffect } from 'react';
import { aiService } from '@/services/aiService';
import type { AIPatientSummary } from '@/types';

interface AIPatientPreBriefProps {
    patientId: string;
    patientName?: string;
}

// ── Loading skeleton ──────────────────────────────────────────
function PreBriefSkeleton() {
    return (
        <div className="px-3 py-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-lg border-l-[3px] border-l-violet-600 animate-pulse">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded bg-violet-200 dark:bg-violet-700" />
                <div className="h-3 w-32 rounded bg-violet-200 dark:bg-violet-700" />
            </div>
            <div className="space-y-1.5 pl-6">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-3 rounded bg-violet-100 dark:bg-violet-800/50" style={{ width: `${70 + i * 5}%` }} />
                ))}
            </div>
        </div>
    );
}

// ── Compliance color helper ───────────────────────────────────
function complianceColor(compliance?: string): string {
    if (!compliance) return 'text-gray-700 dark:text-gray-300';
    const lower = compliance.toLowerCase();
    if (lower.includes('kém') || lower.includes('poor') || lower.includes('thấp')) {
        return 'text-red-600 dark:text-red-400 font-medium';
    }
    if (lower.includes('trung bình') || lower.includes('fair') || lower.includes('moderate')) {
        return 'text-amber-600 dark:text-amber-400';
    }
    return 'text-green-600 dark:text-green-500';
}

// ── Main component ────────────────────────────────────────────
export function AIPatientPreBrief({ patientId, patientName }: AIPatientPreBriefProps) {
    const [summary, setSummary] = useState<AIPatientSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const fetchSummary = async () => {
            setLoading(true);
            try {
                const res = await aiService.summarizePatient(patientId);
                if (!cancelled) {
                    setSummary(res.data.summary);
                }
            } catch {
                // Show nothing on error
                if (!cancelled) setSummary(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchSummary();

        return () => {
            cancelled = true;
        };
    }, [patientId]);

    if (loading) return <PreBriefSkeleton />;
    if (!summary) return null;

    const visitCount = summary.citations?.length ?? 0;
    const displayName = patientName ?? summary.patientName ?? 'bệnh nhân';

    return (
        <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-lg border-l-[3px] border-l-violet-600">
            {/* Header – clickable to collapse */}
            <button
                type="button"
                onClick={() => setCollapsed((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                aria-expanded={!collapsed}
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm">🤖</span>
                    <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                        AI Tóm tắt nhanh
                        {displayName && (
                            <span className="font-normal text-violet-500 dark:text-violet-400">
                                {' '}· {displayName}
                            </span>
                        )}
                    </span>
                </div>
                <svg
                    className={`w-3.5 h-3.5 text-violet-500 transition-transform duration-200 ${collapsed ? '-rotate-90' : 'rotate-0'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Body */}
            {!collapsed && (
                <div className="px-3 pb-3">
                    <ul className="space-y-1.5 text-xs pl-1">

                        {/* Chẩn đoán gần nhất */}
                        {summary.recentDiagnosis && (
                            <li className="flex items-start gap-1.5">
                                <span className="mt-0.5 text-violet-400 select-none">•</span>
                                <span className="text-gray-700 dark:text-gray-300">
                                    <span className="font-medium text-gray-800 dark:text-gray-200">
                                        Chẩn đoán gần nhất:
                                    </span>{' '}
                                    <span className="font-mono text-violet-600 dark:text-violet-400">
                                        {summary.recentDiagnosis.icdCode}
                                    </span>{' '}
                                    {summary.recentDiagnosis.description}
                                    <span className="ml-1 text-gray-400 dark:text-gray-500">
                                        ({summary.recentDiagnosis.date})
                                    </span>
                                </span>
                            </li>
                        )}

                        {/* Thuốc hiện tại */}
                        {summary.currentMedications && summary.currentMedications.length > 0 && (
                            <li className="flex items-start gap-1.5">
                                <span className="mt-0.5 text-violet-400 select-none">•</span>
                                <div>
                                    <span className="font-medium text-gray-800 dark:text-gray-200">
                                        Thuốc hiện tại:
                                    </span>
                                    <ul className="mt-0.5 space-y-0.5 pl-3">
                                        {summary.currentMedications.map((med, idx) => (
                                            <li key={idx} className="flex items-center gap-1.5">
                                                <span className="text-gray-400">–</span>
                                                <span className="text-gray-700 dark:text-gray-300">
                                                    {med.name}{' '}
                                                    <span className="text-gray-500 dark:text-gray-400">
                                                        {med.dosage}
                                                    </span>
                                                </span>
                                                {med.compliance && (
                                                    <span className={`text-[10px] ${complianceColor(med.compliance)}`}>
                                                        [{med.compliance}]
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </li>
                        )}

                        {/* Red flags */}
                        {summary.redFlags && summary.redFlags.length > 0 && (
                            <li className="flex items-start gap-1.5">
                                <span className="mt-0.5 text-violet-400 select-none">•</span>
                                <div>
                                    <span className="font-medium text-red-600 dark:text-red-400">
                                        🚩 Red flags:
                                    </span>
                                    <ul className="mt-0.5 space-y-0.5 pl-3">
                                        {summary.redFlags.map((flag, idx) => (
                                            <li key={idx} className="flex items-center gap-1">
                                                <span className="text-red-400">–</span>
                                                <span className="text-red-600 dark:text-red-400 font-medium">
                                                    {flag}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </li>
                        )}

                        {/* Dị ứng */}
                        {summary.allergies && summary.allergies.length > 0 && (
                            <li className="flex items-start gap-1.5">
                                <span className="mt-0.5 text-violet-400 select-none">•</span>
                                <div className="flex flex-wrap items-center gap-1">
                                    <span className="font-medium text-gray-800 dark:text-gray-200">
                                        Dị ứng:
                                    </span>
                                    {summary.allergies.map((allergy, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                                        >
                                            {allergy}
                                        </span>
                                    ))}
                                </div>
                            </li>
                        )}

                    </ul>

                    {/* Footer */}
                    <p className="mt-2.5 pt-2 border-t border-violet-200 dark:border-violet-800 text-[10px] text-gray-400 dark:text-gray-500">
                        📚 Dữ liệu từ {visitCount > 0 ? visitCount : 'nhiều'} lần khám gần nhất | Cập nhật: vừa xong
                    </p>
                </div>
            )}
        </div>
    );
}
