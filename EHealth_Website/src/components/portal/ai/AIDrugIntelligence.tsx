'use client';

import { useEffect, useRef, useState } from 'react';
import type { AIDrugCheck, Citation } from '@/types';
import { aiService } from '@/services/aiService';
import type { AIDrugInteractionResponse } from '@/services/aiService';
import { AI_DRUG_SEVERITY_COLORS } from '@/constants/ai';
import { useAIPreferences } from '@/hooks/useAIPreferences';
import { AICitationBlock } from './AICitationBlock';
import { AIStatusIndicator } from './AIStatusIndicator';

// ============================================
// Props
// ============================================

interface AIDrugIntelligenceProps {
    drugs: { name: string; dosage: string }[];
    allergies?: string[];
    patientProfile?: { weight?: number; age?: number; eGFR?: number };
    diagnosis?: string;
    onDismiss?: () => void;
}

// ============================================
// Loading skeleton
// ============================================

function Skeleton() {
    return (
        <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
        </div>
    );
}

// ============================================
// Interaction matrix table
// ============================================

function InteractionMatrix({ interactions }: { interactions: AIDrugCheck[] }) {
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    if (interactions.length === 0) {
        return (
            <div className="text-xs text-[#687582] dark:text-gray-400 px-1 py-2">
                Không phát hiện tương tác thuốc đáng kể.
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-[10px] font-semibold uppercase tracking-wide text-[#687582] dark:text-gray-400">
                <span>Thuốc A</span>
                <span>Thuốc B</span>
                <span>Mức độ</span>
                <span />
            </div>

            {interactions.map((item, index) => {
                const sev = AI_DRUG_SEVERITY_COLORS[item.severity];
                const isExpanded = expandedRow === index;

                return (
                    <div
                        key={index}
                        className={`border-t border-gray-100 dark:border-gray-800 ${sev.bg}`}
                    >
                        {/* Row */}
                        <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center px-3 py-2">
                            <span className="text-xs font-medium text-[#121417] dark:text-gray-100 truncate">
                                {item.drugA}
                            </span>
                            <span className="text-xs font-medium text-[#121417] dark:text-gray-100 truncate">
                                {item.drugB}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${sev.badge}`}>
                                {sev.label}
                            </span>
                            <button
                                onClick={() => setExpandedRow(isExpanded ? null : index)}
                                className="text-xs text-[#687582] dark:text-gray-400 hover:text-[#121417] dark:hover:text-gray-200"
                                aria-label="Chi tiết"
                            >
                                {isExpanded ? '▲' : '▼'}
                            </button>
                        </div>

                        {/* Expanded row */}
                        {isExpanded && (
                            <div className="px-3 pb-3 space-y-2 border-t border-gray-100 dark:border-gray-800/60">
                                <p className="text-xs text-[#121417] dark:text-gray-200 leading-relaxed mt-2">
                                    {item.detail}
                                </p>
                                {item.citations.length > 0 ? (
                                    <AICitationBlock citations={item.citations} />
                                ) : (
                                    <p className="text-[10px] text-[#687582] dark:text-gray-500 italic">
                                        Không tìm thấy guideline phù hợp
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ============================================
// Allergy cross-check
// ============================================

function AllergyCheck({
    conflicts,
}: {
    conflicts: AIDrugInteractionResponse['allergyConflicts'];
}) {
    if (conflicts.length === 0) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <span className="text-base">✅</span>
                <span className="text-xs font-medium text-green-700 dark:text-green-300">
                    Không phát hiện dị ứng thuốc
                </span>
            </div>
        );
    }

    return (
        <div className="space-y-1.5">
            {conflicts.map((conflict, i) => (
                <div
                    key={i}
                    className="flex items-start gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg"
                >
                    <span className="text-base shrink-0">⚠️</span>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-red-800 dark:text-red-200">
                            {conflict.drug} — Dị ứng: {conflict.allergy}
                        </p>
                        {conflict.citations.length > 0 && (
                            <p className="text-[10px] text-[#687582] dark:text-gray-400 mt-0.5">
                                📚 {conflict.citations.map((c) => c.source).join(', ')}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================
// Dosage hint per drug
// ============================================

interface DosageHint {
    drug: string;
    hints: string[];
}

function buildDosageHints(
    drugs: { name: string; dosage: string }[],
    patientProfile?: AIDrugIntelligenceProps['patientProfile'],
): DosageHint[] {
    if (!patientProfile) return [];
    const hints: DosageHint[] = [];

    for (const drug of drugs) {
        const hintLines: string[] = [];

        if (patientProfile.weight && patientProfile.weight > 0) {
            hintLines.push(`Cân nặng ${patientProfile.weight} kg — kiểm tra liều mg/kg nếu áp dụng.`);
        }

        if (patientProfile.eGFR !== undefined) {
            if (patientProfile.eGFR < 30) {
                hintLines.push(`eGFR ${patientProfile.eGFR} mL/min — giảm liều hoặc kéo dài khoảng cách dùng theo khuyến cáo.`);
            } else if (patientProfile.eGFR < 60) {
                hintLines.push(`eGFR ${patientProfile.eGFR} mL/min — cân nhắc hiệu chỉnh liều.`);
            }
        }

        if (patientProfile.age && patientProfile.age >= 65) {
            hintLines.push(`Bệnh nhân cao tuổi (${patientProfile.age} tuổi) — thận trọng với tích lũy thuốc.`);
        }

        if (hintLines.length > 0) {
            hints.push({ drug: drug.name, hints: hintLines });
        }
    }

    return hints;
}

// ============================================
// Serious-interaction banner requiring acknowledge
// ============================================

function SeriousBanner({
    interactions,
    onAcknowledge,
}: {
    interactions: AIDrugCheck[];
    onAcknowledge: () => void;
}) {
    if (interactions.length === 0) return null;

    return (
        <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-400 dark:border-red-600 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">🚨</span>
                <div>
                    <p className="text-sm font-bold text-red-800 dark:text-red-200">
                        Phát hiện {interactions.length} tương tác nguy hiểm / chống chỉ định
                    </p>
                    <ul className="mt-1.5 space-y-1">
                        {interactions.map((ix, i) => (
                            <li key={i} className="text-xs text-red-700 dark:text-red-300 flex items-center gap-1.5">
                                <span
                                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${AI_DRUG_SEVERITY_COLORS[ix.severity].badge}`}
                                >
                                    {AI_DRUG_SEVERITY_COLORS[ix.severity].label}
                                </span>
                                <span>
                                    {ix.drugA} + {ix.drugB}: {ix.detail}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <button
                onClick={onAcknowledge}
                className="w-full py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
                Tôi đã xem xét và xác nhận tiếp tục ❗
            </button>
        </div>
    );
}

// ============================================
// Collect all citations
// ============================================

function collectAllCitations(result: AIDrugInteractionResponse): Citation[] {
    const all: Citation[] = [];
    for (const ix of result.interactions) {
        all.push(...ix.citations);
    }
    for (const c of result.allergyConflicts) {
        all.push(...c.citations);
    }
    // Deduplicate by id
    const seen = new Set<string>();
    return all.filter((c) => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
    });
}

// ============================================
// Main component
// ============================================

export function AIDrugIntelligence({
    drugs,
    allergies = [],
    patientProfile,
    onDismiss,
}: AIDrugIntelligenceProps) {
    const { preferences } = useAIPreferences();

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AIDrugInteractionResponse | null>(null);
    const [acknowledged, setAcknowledged] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    const prevDrugsRef = useRef<string>('');

    useEffect(() => {
        if (!preferences.enableDrugInteractionCheck) return;
        if (drugs.length < 2) {
            // Need at least 2 drugs to check interactions
            setResult(null);
            return;
        }

        const serialised = JSON.stringify(drugs);
        if (serialised === prevDrugsRef.current) return;
        prevDrugsRef.current = serialised;

        let cancelled = false;

        async function check() {
            setLoading(true);
            setAcknowledged(false);
            try {
                const res = await aiService.checkDrugInteraction({
                    drugs,
                    allergies,
                    patientProfile,
                });
                if (!cancelled) setResult(res.data);
            } catch {
                // Graceful failure
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        check();
        return () => {
            cancelled = true;
        };
    }, [drugs, allergies, patientProfile, preferences.enableDrugInteractionCheck]);

    const handleDismiss = () => {
        setDismissed(true);
        onDismiss?.();
    };

    if (!preferences.enableDrugInteractionCheck) return null;
    if (dismissed) return null;
    if (drugs.length < 2 && !result) return null;

    const seriousInteractions = result?.interactions.filter(
        (ix) => ix.severity === 'serious' || ix.severity === 'contraindicated',
    ) ?? [];

    const dosageHints = buildDosageHints(drugs, patientProfile);
    const allCitations = result ? collectAllCitations(result) : [];
    const noCitations = result !== null && allCitations.length === 0;

    return (
        <div className="bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/20 border border-rose-200 dark:border-rose-800 border-l-4 border-l-rose-600 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-rose-100/60 dark:bg-rose-900/30">
                <div className="flex items-center gap-2">
                    <span className="text-lg">💊</span>
                    <span className="text-sm font-semibold text-rose-800 dark:text-rose-200">
                        AI Kiểm tra Tương tác Thuốc
                    </span>
                    {loading && <AIStatusIndicator status="loading" />}
                </div>
                <button
                    onClick={handleDismiss}
                    className="text-[#687582] dark:text-gray-400 hover:text-[#121417] dark:hover:text-gray-200 transition-colors text-sm"
                    aria-label="Đóng"
                >
                    ✕
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Loading skeleton */}
                {loading && <Skeleton />}

                {/* Serious interaction banner — shown before the rest and requires acknowledge */}
                {!loading && result && seriousInteractions.length > 0 && !acknowledged && (
                    <SeriousBanner
                        interactions={seriousInteractions}
                        onAcknowledge={() => setAcknowledged(true)}
                    />
                )}

                {/* Main content (visible after acknowledging serious interactions, or when none) */}
                {!loading && result && (seriousInteractions.length === 0 || acknowledged) && (
                    <>
                        {/* Interaction matrix */}
                        <div>
                            <p className="text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase tracking-wide mb-2">
                                Ma trận tương tác thuốc
                            </p>
                            <InteractionMatrix interactions={result.interactions} />
                        </div>

                        {/* Allergy cross-check */}
                        <div>
                            <p className="text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase tracking-wide mb-2">
                                Kiểm tra dị ứng
                            </p>
                            <AllergyCheck conflicts={result.allergyConflicts} />
                        </div>

                        {/* Dosage hints */}
                        {dosageHints.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase tracking-wide mb-2">
                                    Gợi ý hiệu chỉnh liều
                                </p>
                                <div className="space-y-1.5">
                                    {dosageHints.map((hint, i) => (
                                        <div
                                            key={i}
                                            className="px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg"
                                        >
                                            <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-1">
                                                💊 {hint.drug}
                                            </p>
                                            <ul className="space-y-0.5">
                                                {hint.hints.map((h, j) => (
                                                    <li key={j} className="text-xs text-[#687582] dark:text-gray-400 flex items-start gap-1.5">
                                                        <span className="shrink-0 mt-0.5">•</span>
                                                        <span>{h}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Citations */}
                        {noCitations ? (
                            <p className="text-xs text-[#687582] dark:text-gray-400 italic">
                                Không tìm thấy guideline phù hợp
                            </p>
                        ) : (
                            allCitations.length > 0 && (
                                <AICitationBlock citations={allCitations} />
                            )
                        )}
                    </>
                )}

                {/* Not enough drugs */}
                {!loading && drugs.length < 2 && (
                    <p className="text-xs text-[#687582] dark:text-gray-400 italic text-center py-2">
                        Cần ít nhất 2 thuốc để kiểm tra tương tác.
                    </p>
                )}
            </div>

            <div className="px-4 pb-2 text-[10px] text-[#687582] dark:text-gray-500">
                Dữ liệu tham khảo: DrugBank, FDA, BYT VN. Kết quả AI chỉ hỗ trợ lâm sàng, không thay thế phán quyết của bác sĩ.
            </div>
        </div>
    );
}
