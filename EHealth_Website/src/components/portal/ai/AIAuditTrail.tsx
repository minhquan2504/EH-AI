'use client';

import type { AIAuditEntry } from '@/types';

interface AIAuditTrailProps {
    entries: AIAuditEntry[];
}

const RESPONSE_BADGE = {
    accepted: { className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', label: 'BS chấp nhận ✓' },
    dismissed: { className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', label: 'BS bỏ qua' },
    modified: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', label: 'BS chỉnh sửa' },
} as const;

export function AIAuditTrail({ entries }: AIAuditTrailProps) {
    if (entries.length === 0) return null;

    return (
        <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
                <span>🤖</span>
                <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                    AI Audit Trail — Truy vết quyết định
                </span>
            </div>

            <div className="space-y-2">
                {entries.map((entry, index) => {
                    const badge = RESPONSE_BADGE[entry.doctorResponse];
                    return (
                        <div key={index} className="flex gap-3 items-start text-xs">
                            <span className="text-gray-400 dark:text-gray-500 whitespace-nowrap min-w-[40px]">
                                {entry.timestamp}
                            </span>
                            <div className="flex-1 text-gray-700 dark:text-gray-300">
                                <strong>{entry.step}:</strong> {entry.aiAction}
                                {entry.citations.length > 0 && (
                                    <span className="text-gray-400 dark:text-gray-500">
                                        {' | '}{entry.citations.map((c) => c.source).join(', ')}
                                    </span>
                                )}
                            </div>
                            <span className={`${badge.className} text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap`}>
                                {badge.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-3 pt-2 border-t border-violet-200 dark:border-violet-800">
                Audit trail được lưu vào hồ sơ bệnh án. Phục vụ kiểm tra chất lượng và pháp lý y khoa.
            </div>
        </div>
    );
}
