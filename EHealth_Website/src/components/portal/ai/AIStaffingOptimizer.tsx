'use client';

import { useState } from 'react';

// ============================================
// Types & Mock Data
// ============================================

interface StaffingAlert {
    day: string;
    department: string;
    shortage: number;
    suggestion: string;
}

const MOCK_STAFFING: StaffingAlert[] = [
    { day: 'T4 chiều', department: 'Tim mạch', shortage: 2, suggestion: 'Điều phối BS. Lê Văn C từ Nội tổng quát' },
    { day: 'T6 sáng', department: 'Cấp cứu', shortage: 1, suggestion: 'Bổ sung 1 BS trực thêm' },
];

const DEPT_COLOR: Record<string, string> = {
    'Tim mạch': 'bg-red-50 dark:bg-red-500/10 text-red-600',
    'Cấp cứu': 'bg-orange-50 dark:bg-orange-500/10 text-orange-600',
    'Nội khoa': 'bg-blue-50 dark:bg-blue-500/10 text-blue-600',
};

function getDeptColor(dept: string): string {
    return DEPT_COLOR[dept] ?? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600';
}

// ============================================
// Component
// ============================================

export function AIStaffingOptimizer() {
    const [applied, setApplied] = useState<Set<number>>(new Set());

    const handleApply = (i: number) => {
        setApplied(prev => { const s = new Set(prev); s.add(i); return s; });
    };

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                        <span className="material-symbols-outlined text-[#3C81C6] text-[20px]">groups</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">AI Tối ưu nhân sự</h3>
                        <p className="text-xs text-[#687582] dark:text-gray-500">
                            {MOCK_STAFFING.length} gợi ý điều phối
                        </p>
                    </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] text-[#3C81C6] font-bold">
                    <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                    AI optimize
                </span>
            </div>

            {/* Staffing alerts */}
            <div className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e]">
                {MOCK_STAFFING.map((item, i) => {
                    const isApplied = applied.has(i);
                    return (
                        <div key={i} className="px-5 py-4">
                            <div className="flex items-start gap-3 mb-2">
                                {/* Department badge + day */}
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${getDeptColor(item.department)}`}>
                                            {item.department}
                                        </span>
                                        <span className="text-xs text-[#687582] dark:text-gray-500">{item.day}</span>
                                    </div>

                                    {/* Shortage indicator */}
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        {Array.from({ length: item.shortage }).map((_, j) => (
                                            <div key={j} className="w-5 h-5 rounded-full bg-red-50 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-500/30 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-red-500 text-[11px]">person</span>
                                            </div>
                                        ))}
                                        <span className="text-xs text-red-500 font-medium">thiếu {item.shortage} BS</span>
                                    </div>

                                    {/* Suggestion */}
                                    <p className="text-xs text-[#687582] dark:text-gray-400 leading-relaxed">
                                        <span className="font-medium text-[#3C81C6]">Gợi ý:</span> {item.suggestion}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleApply(i)}
                                disabled={isApplied}
                                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${isApplied
                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 cursor-default'
                                    : 'bg-[#3C81C6] hover:bg-[#2a6da8] text-white shadow-sm'
                                }`}
                            >
                                {isApplied ? (
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">check</span>
                                        Đã áp dụng
                                    </span>
                                ) : 'Áp dụng gợi ý'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
