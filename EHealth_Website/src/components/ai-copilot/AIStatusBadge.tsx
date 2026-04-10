'use client';

import { useAICopilot } from '@/contexts/AICopilotContext';
import AIPulseIndicator from '@/components/shared/AIPulseIndicator';

// ============================================
// AIStatusBadge
// ============================================

/**
 * Header widget that shows AI engine status and alert count.
 * Clicking it expands the copilot sidebar if collapsed.
 */
export default function AIStatusBadge() {
    const { engineStatus, alertCount, setCopilotCollapsed, copilotCollapsed } = useAICopilot();

    const handleClick = () => {
        if (copilotCollapsed) {
            setCopilotCollapsed(false);
        }
    };

    // ── Determine what to render ──────────────────────────────────────────

    let content: React.ReactNode;

    if (engineStatus === 'analyzing') {
        content = (
            <>
                <AIPulseIndicator size="sm" color="violet" />
                <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
                    AI phân tích...
                </span>
            </>
        );
    } else if (alertCount > 0) {
        content = (
            <>
                <AIPulseIndicator size="sm" color="amber" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                    {alertCount} cảnh báo
                </span>
            </>
        );
    } else if (engineStatus === 'ready') {
        content = (
            <>
                <AIPulseIndicator size="sm" color="green" />
                <span className="text-xs font-medium text-green-700 dark:text-green-300">
                    AI sẵn sàng
                </span>
            </>
        );
    } else {
        // idle
        content = (
            <>
                <span className="material-symbols-outlined text-[16px] text-[#687582] dark:text-[#9faab5]">
                    smart_toy
                </span>
                <span className="text-xs font-medium text-[#687582] dark:text-[#9faab5]">
                    AI
                </span>
            </>
        );
    }

    return (
        <button
            onClick={handleClick}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                       bg-white/70 dark:bg-[#2d353e]/70
                       border border-[#dde0e4] dark:border-[#3d454e]
                       hover:bg-[#f5f6f7] dark:hover:bg-[#363d47]
                       transition-colors duration-150 cursor-pointer"
            title="AI Copilot"
        >
            {content}
        </button>
    );
}
