'use client';

import { useState, useEffect, useRef } from 'react';
import { aiService } from '@/services/aiService';

// ============================================
// Types & constants
// ============================================

type UrgencyLevel = 'urgent' | 'routine' | 'elective';

const URGENT_KEYWORDS = ['đau ngực', 'khó thở', 'co giật', 'bất tỉnh', 'xuất huyết', 'ngã', 'tai nạn', 'sốt cao', 'liệt'];
const ROUTINE_KEYWORDS = ['đau đầu', 'sốt', 'ho', 'cảm', 'mệt', 'đau bụng', 'nôn', 'tiêu chảy', 'đau lưng'];

const URGENCY_CONFIG: Record<UrgencyLevel, {
    label: string; icon: string;
    bg: string; text: string; border: string;
    dept: string;
}> = {
    urgent: {
        label: 'Khẩn cấp',
        icon: 'emergency',
        bg: 'bg-red-50 dark:bg-red-500/10',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-200 dark:border-red-500/30',
        dept: 'Cấp cứu',
    },
    routine: {
        label: 'Thường',
        icon: 'schedule',
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-500/30',
        dept: 'Nội khoa',
    },
    elective: {
        label: 'Chọn lọc',
        icon: 'event_available',
        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-500/30',
        dept: 'Nội tổng quát',
    },
};

// ============================================
// Client-side keyword triage
// ============================================

function clientSideTriage(reason: string): UrgencyLevel {
    const lower = reason.toLowerCase();
    if (URGENT_KEYWORDS.some(kw => lower.includes(kw))) return 'urgent';
    if (ROUTINE_KEYWORDS.some(kw => lower.includes(kw))) return 'routine';
    return 'elective';
}

// ============================================
// Component
// ============================================

interface AITriageAssistantProps {
    reason: string;
    onUrgencyResult?: (urgency: string) => void;
}

export function AITriageAssistant({ reason, onUrgencyResult }: AITriageAssistantProps) {
    const [urgency, setUrgency] = useState<UrgencyLevel | null>(null);
    const [reasoning, setReasoning] = useState('');
    const [loading, setLoading] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!reason || reason.trim().length < 5) {
            setUrgency(null);
            setReasoning('');
            return;
        }

        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(async () => {
            // Client-side fast check first
            const clientResult = clientSideTriage(reason);
            setUrgency(clientResult);
            setLoading(true);

            try {
                const res = await aiService.triageAssessment({ reason });
                const data = (res?.data as unknown) as Record<string, unknown> | null | undefined;
                if (data?.urgency) {
                    const u = data.urgency as UrgencyLevel;
                    setUrgency(u);
                    setReasoning(String(data.reasoning ?? ''));
                    onUrgencyResult?.(u);
                } else {
                    // Mock reasoning based on client result
                    setReasoning(getMockReasoning(clientResult, reason));
                    onUrgencyResult?.(clientResult);
                }
            } catch {
                // Silent fail — use client-side result
                setReasoning(getMockReasoning(clientResult, reason));
                onUrgencyResult?.(clientResult);
            } finally {
                setLoading(false);
            }
        }, 1000);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reason]);

    if (!urgency && !loading) return null;

    const cfg = urgency ? URGENCY_CONFIG[urgency] : null;

    return (
        <div className={`rounded-xl border p-4 transition-all ${cfg ? `${cfg.bg} ${cfg.border}` : 'bg-gray-50 dark:bg-gray-700/20 border-gray-200 dark:border-gray-700'}`}>
            <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded-lg ${cfg?.bg ?? 'bg-gray-100'} flex-shrink-0`}>
                    {loading ? (
                        <span className="material-symbols-outlined text-[20px] text-[#3C81C6] animate-spin">autorenew</span>
                    ) : (
                        <span className={`material-symbols-outlined text-[20px] ${cfg?.text ?? 'text-gray-500'}`}>
                            {cfg?.icon ?? 'smart_toy'}
                        </span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-bold text-[#121417] dark:text-white">AI Phân loại ưu tiên</p>
                        {urgency && !loading && (
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${cfg?.bg} ${cfg?.text}`}>
                                {cfg?.label}
                            </span>
                        )}
                        {loading && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 dark:bg-gray-700 text-[#687582]">
                                Đang phân tích...
                            </span>
                        )}
                    </div>
                    {reasoning && !loading && (
                        <p className={`text-xs mt-1 ${cfg?.text ?? 'text-[#687582]'}`}>{reasoning}</p>
                    )}
                    {urgency && !loading && cfg && (
                        <p className="text-xs text-[#687582] dark:text-gray-500 mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">local_hospital</span>
                            Gợi ý khoa: <span className="font-semibold">{cfg.dept}</span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function getMockReasoning(urgency: UrgencyLevel, reason: string): string {
    if (urgency === 'urgent') return `Phát hiện từ khóa khẩn cấp trong lý do khám. Cần ưu tiên tiếp nhận ngay và chuyển cấp cứu.`;
    if (urgency === 'routine') return `Triệu chứng phổ biến, cần được khám trong ngày. Không có dấu hiệu nguy hiểm tức thì.`;
    return `Tình trạng ổn định, có thể đặt lịch khám theo thời gian phù hợp.`;
}
