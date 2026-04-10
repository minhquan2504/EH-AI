'use client';

import { useState } from 'react';
import { useAICopilot } from '@/contexts/AICopilotContext';

/**
 * Shows when multiple users are viewing the same patient (simulated for demo).
 * Appears as a small info banner in the copilot sidebar.
 */
export default function AICollaborativeAlert() {
    const { pageContext } = useAICopilot();
    const [dismissed, setDismissed] = useState(false);

    // Only show when a patient is in context
    if (!pageContext?.patientId || dismissed) return null;

    return (
        <div className="mx-3 mb-2 flex items-start gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
            {/* Avatar placeholder */}
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
                TM
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-[11px] text-blue-800 dark:text-blue-200 leading-snug">
                    <span className="font-semibold">BS. Trần Văn Minh</span> cũng đang xem bệnh nhân này — liên hệ trước khi kê đơn
                </p>
            </div>

            <button
                onClick={() => setDismissed(true)}
                className="flex-shrink-0 text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300 transition-colors"
                aria-label="Đóng"
            >
                <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
        </div>
    );
}
