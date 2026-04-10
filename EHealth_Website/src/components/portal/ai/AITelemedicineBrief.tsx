'use client';

import { useState, useEffect, useRef } from 'react';
import { aiService } from '@/services/aiService';
import type { AIPatientSummary } from '@/types';
import { AICitationBlock } from './AICitationBlock';

// ============================================
// Types
// ============================================

interface AITelemedicineBriefProps {
    patientId: string;
    patientName: string;
    sessionReason: string;
    visible: boolean;
    onAcknowledge: () => void;
    onClose: () => void;
}

// ============================================
// Sub-components
// ============================================

function BriefSkeleton() {
    return (
        <div className="animate-pulse space-y-3 py-2">
            {/* Patient info block skeleton */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-3 space-y-2">
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-3 rounded bg-gray-200 dark:bg-gray-700"
                        style={{ width: `${80 - i * 8}%` }}
                    />
                ))}
            </div>
            {/* Suggestions skeleton */}
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-1.5">
                {[0, 1].map((i) => (
                    <div key={i} className="h-3 rounded bg-amber-200 dark:bg-amber-800" style={{ width: `${70 + i * 10}%` }} />
                ))}
            </div>
        </div>
    );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-2 text-xs">
            <span className="shrink-0 font-semibold text-gray-600 dark:text-gray-400 w-28">
                {label}
            </span>
            <div className="text-gray-800 dark:text-gray-200 min-w-0">{children}</div>
        </div>
    );
}

// ============================================
// Main component
// ============================================

export function AITelemedicineBrief({
    patientId,
    patientName,
    sessionReason,
    visible,
    onAcknowledge,
    onClose,
}: AITelemedicineBriefProps) {
    const [summary, setSummary] = useState<AIPatientSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const fetchedRef = useRef<string | null>(null);

    // ----------------------------------------
    // Fetch summary when modal becomes visible
    // ----------------------------------------
    useEffect(() => {
        if (!visible) return;
        // Avoid re-fetching if already loaded for this patient
        if (fetchedRef.current === patientId && summary) return;

        let cancelled = false;

        const fetchSummary = async () => {
            setLoading(true);
            setError(false);
            try {
                const res = await aiService.summarizePatient(patientId);
                if (!cancelled) {
                    setSummary(res.data.summary);
                    fetchedRef.current = patientId;
                }
            } catch {
                if (!cancelled) {
                    setError(true);
                    setSummary(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchSummary();

        return () => {
            cancelled = true;
        };
    }, [visible, patientId, summary]);

    // ----------------------------------------
    // Trap focus when modal is open
    // ----------------------------------------
    useEffect(() => {
        if (!visible) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [visible, onClose]);

    if (!visible) return null;

    return (
        /* Overlay */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tele-brief-title"
            onClick={(e) => {
                // Close on backdrop click
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* Modal card */}
            <div className="relative w-full max-w-lg rounded-xl shadow-2xl bg-white dark:bg-gray-900 overflow-hidden">
                {/* Violet top border */}
                <div className="h-1.5 w-full bg-violet-600" />

                {/* Close button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Đóng"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Content */}
                <div className="px-5 pt-4 pb-5 space-y-4 max-h-[80vh] overflow-y-auto">
                    {/* Header */}
                    <div>
                        <p id="tele-brief-title" className="text-base font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
                            <span>🤖</span>
                            AI Briefing trước phiên khám
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Phiên telemedicine · {patientName} · {sessionReason}
                        </p>
                    </div>

                    {/* Loading state */}
                    {loading && <BriefSkeleton />}

                    {/* Error state */}
                    {!loading && error && (
                        <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-xs text-amber-800 dark:text-amber-200 space-y-1">
                            <p className="font-semibold">⚠️ Không tải được AI Briefing</p>
                            <p>
                                Dịch vụ AI tạm thời không phản hồi. Bạn vẫn có thể tiếp tục vào phòng khám — hãy
                                kiểm tra hồ sơ thủ công trước khi khám.
                            </p>
                        </div>
                    )}

                    {/* Summary content */}
                    {!loading && summary && (
                        <>
                            {/* Patient info block */}
                            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-3.5 space-y-2">
                                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    Thông tin bệnh nhân
                                </p>

                                <InfoRow label="Họ tên">
                                    <span className="font-semibold">{summary.patientName || patientName}</span>
                                </InfoRow>

                                <InfoRow label="Lý do khám">
                                    <span>{sessionReason}</span>
                                </InfoRow>

                                {summary.chronicConditions && summary.chronicConditions.length > 0 && (
                                    <InfoRow label="Bệnh mãn tính">
                                        <div className="flex flex-wrap gap-1">
                                            {summary.chronicConditions.map((cond, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                                >
                                                    {cond}
                                                </span>
                                            ))}
                                        </div>
                                    </InfoRow>
                                )}

                                {summary.currentMedications && summary.currentMedications.length > 0 && (
                                    <InfoRow label="Đang dùng thuốc">
                                        <ul className="space-y-0.5">
                                            {summary.currentMedications.map((med, idx) => (
                                                <li key={idx} className="flex items-center gap-1.5">
                                                    <span className="text-gray-400">–</span>
                                                    <span>
                                                        {med.name}{' '}
                                                        <span className="text-gray-500 dark:text-gray-400">
                                                            {med.dosage}
                                                        </span>
                                                    </span>
                                                    {med.compliance && (
                                                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                                            [{med.compliance}]
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </InfoRow>
                                )}

                                {summary.allergies && summary.allergies.length > 0 && (
                                    <InfoRow label="Dị ứng">
                                        <div className="flex flex-wrap gap-1">
                                            {summary.allergies.map((allergy, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                                                >
                                                    {allergy}
                                                </span>
                                            ))}
                                        </div>
                                    </InfoRow>
                                )}

                                {summary.redFlags && summary.redFlags.length > 0 && (
                                    <InfoRow label="🚩 Red flags">
                                        <ul className="space-y-0.5">
                                            {summary.redFlags.map((flag, idx) => (
                                                <li key={idx} className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                                                    <span className="text-red-400">–</span>
                                                    {flag}
                                                </li>
                                            ))}
                                        </ul>
                                    </InfoRow>
                                )}
                            </div>

                            {/* AI discussion suggestions */}
                            <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 space-y-1.5">
                                <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                                    <span>💡</span>
                                    Gợi ý hỏi thêm trong phiên khám
                                </p>
                                <ul className="space-y-1">
                                    {summary.chronicConditions && summary.chronicConditions.length > 0 ? (
                                        summary.chronicConditions.map((cond, idx) => (
                                            <li key={idx} className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                                                <span className="mt-0.5 text-amber-500">•</span>
                                                Kiểm tra tiến triển {cond} và tuân thủ điều trị
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                                            <span className="mt-0.5 text-amber-500">•</span>
                                            Hỏi về triệu chứng hiện tại và mức độ ảnh hưởng đến sinh hoạt
                                        </li>
                                    )}
                                    {summary.redFlags && summary.redFlags.length > 0 && (
                                        <li className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                                            <span className="mt-0.5 text-amber-500">•</span>
                                            Đánh giá lại các dấu hiệu cảnh báo đã ghi nhận
                                        </li>
                                    )}
                                </ul>
                            </div>

                            {/* Citations */}
                            {summary.citations && summary.citations.length > 0 && (
                                <AICitationBlock citations={summary.citations} />
                            )}
                        </>
                    )}

                    {/* Acknowledge button */}
                    <button
                        type="button"
                        onClick={onAcknowledge}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-semibold text-sm transition-colors shadow-sm shadow-violet-200 dark:shadow-violet-900 disabled:opacity-60"
                        disabled={loading}
                    >
                        ✅ Đã đọc — Vào phòng khám
                    </button>

                    {/* Disclaimer */}
                    <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
                        Tóm tắt này do AI tạo ra chỉ mang tính hỗ trợ. Bác sĩ chịu trách nhiệm về mọi quyết định lâm sàng.
                    </p>
                </div>
            </div>
        </div>
    );
}
