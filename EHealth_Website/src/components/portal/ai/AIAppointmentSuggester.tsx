'use client';

import { useState } from 'react';

// ============================================
// Types & Mock Data
// ============================================

interface AppointmentSuggestion {
    specialty: string;
    reason: string;
    dueDate: string;
    urgency: 'urgent' | 'routine' | 'elective';
}

const MOCK_SUGGESTIONS: AppointmentSuggestion[] = [
    { specialty: 'Tim mạch', reason: 'Tái khám THA — 14 ngày kể từ lần khám cuối', dueDate: '2026-04-25', urgency: 'routine' },
    { specialty: 'Nội tiết', reason: 'Kiểm tra HbA1c (3 tháng/lần)', dueDate: '2026-05-15', urgency: 'routine' },
];

const URGENCY_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
    urgent: { bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600', label: 'Khẩn' },
    routine: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600', label: 'Thường' },
    elective: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600', label: 'Chọn lọc' },
};

const SPECIALTY_COLORS: Record<string, string> = {
    'Tim mạch': 'bg-red-50 dark:bg-red-500/10 text-red-600',
    'Nội tiết': 'bg-blue-50 dark:bg-blue-500/10 text-blue-600',
    'Nội khoa': 'bg-blue-50 dark:bg-blue-500/10 text-blue-600',
};

function getSpecialtyColor(s: string): string {
    return SPECIALTY_COLORS[s] ?? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600';
}

function formatDueDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return dateStr; }
}

function getDaysUntil(dateStr: string): number {
    const due = new Date(dateStr);
    const now = new Date();
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ============================================
// Component
// ============================================

export function AIAppointmentSuggester() {
    const [booked, setBooked] = useState<Set<number>>(new Set());

    const handleBook = (idx: number) => {
        setBooked(prev => { const s = new Set(prev); s.add(idx); return s; });
    };

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                        <span className="material-symbols-outlined text-[#3C81C6] text-[20px]">calendar_clock</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">AI Gợi ý tái khám</h3>
                        <p className="text-xs text-[#687582] dark:text-gray-500">{MOCK_SUGGESTIONS.length} lịch khám sắp đến</p>
                    </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] text-[#3C81C6] font-bold">
                    <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                    AI suggest
                </span>
            </div>

            {/* Suggestions */}
            <div className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e]">
                {MOCK_SUGGESTIONS.map((s, i) => {
                    const urgCfg = URGENCY_CONFIG[s.urgency];
                    const isBooked = booked.has(i);
                    const daysLeft = getDaysUntil(s.dueDate);

                    return (
                        <div key={i} className="px-5 py-4 flex items-start gap-4">
                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getSpecialtyColor(s.specialty)}`}>
                                <span className="material-symbols-outlined text-[20px]">
                                    {s.specialty === 'Tim mạch' ? 'cardiology' : 'biotech'}
                                </span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${getSpecialtyColor(s.specialty)}`}>
                                        {s.specialty}
                                    </span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${urgCfg.bg} ${urgCfg.text}`}>
                                        {urgCfg.label}
                                    </span>
                                </div>
                                <p className="text-xs text-[#121417] dark:text-white mb-1">{s.reason}</p>
                                <p className="text-[11px] text-[#687582] dark:text-gray-500 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                                    {formatDueDate(s.dueDate)}
                                    {daysLeft > 0 && (
                                        <span className={`ml-1 font-medium ${daysLeft <= 7 ? 'text-amber-500' : 'text-[#687582]'}`}>
                                            (còn {daysLeft} ngày)
                                        </span>
                                    )}
                                </p>
                            </div>

                            {/* Book button */}
                            <a
                                href="/booking"
                                onClick={e => { e.preventDefault(); handleBook(i); }}
                                className={`shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${isBooked
                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 cursor-default'
                                    : 'bg-[#3C81C6] hover:bg-[#2a6da8] text-white shadow-sm'
                                }`}
                            >
                                {isBooked ? (
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">check</span>
                                        Đã đặt
                                    </span>
                                ) : 'Đặt lịch'}
                            </a>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
