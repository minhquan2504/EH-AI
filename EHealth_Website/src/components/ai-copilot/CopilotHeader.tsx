'use client';

import { useAICopilot } from '@/contexts/AICopilotContext';
import { ROLE_LABELS, ROLE_ICONS } from '@/lib/ai-copilot/chat-utils';

const ROLE_BADGE_COLORS: Record<string, string> = {
    doctor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    pharmacist: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    receptionist: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    patient: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    admin: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

export default function CopilotHeader() {
    const { copilotCollapsed, toggleCopilot, role } = useAICopilot();

    const roleLabel = ROLE_LABELS[role] ?? role;
    const roleIcon = ROLE_ICONS[role] ?? 'smart_toy';
    const badgeColor = ROLE_BADGE_COLORS[role] ?? 'bg-gray-100 text-gray-700';

    return (
        <div
            className={`
                flex items-center border-b border-[#dde0e4] dark:border-[#2d353e]
                bg-white dark:bg-[#1e242b] flex-shrink-0
                ${copilotCollapsed ? 'h-[52px] justify-center px-0' : 'h-[52px] justify-between px-3'}
            `}
        >
            {copilotCollapsed ? (
                /* Collapsed: center the robot icon + toggle stacked */
                <div className="flex flex-col items-center gap-0.5 w-full">
                    <span
                        className="material-symbols-outlined text-[#3C81C6]"
                        style={{ fontSize: 22 }}
                        title="AI Copilot"
                    >
                        smart_toy
                    </span>
                    <button
                        onClick={toggleCopilot}
                        title="Mở rộng AI Copilot"
                        className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <span
                            className="material-symbols-outlined text-[#687582] dark:text-gray-400"
                            style={{ fontSize: 16 }}
                        >
                            chevron_left
                        </span>
                    </button>
                </div>
            ) : (
                <>
                    {/* Left: icon + title + badge */}
                    <div className="flex items-center gap-2 min-w-0">
                        <span
                            className="material-symbols-outlined text-[#3C81C6] flex-shrink-0"
                            style={{ fontSize: 22 }}
                        >
                            smart_toy
                        </span>
                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                            AI Copilot
                        </span>
                        <span
                            className={`
                                inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium
                                flex-shrink-0 ${badgeColor}
                            `}
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{ fontSize: 11 }}
                            >
                                {roleIcon}
                            </span>
                            {roleLabel}
                        </span>
                    </div>

                    {/* Right: collapse button */}
                    <button
                        onClick={toggleCopilot}
                        title="Thu gọn AI Copilot"
                        className="
                            flex items-center justify-center w-7 h-7 rounded-md
                            hover:bg-gray-100 dark:hover:bg-white/10
                            transition-colors flex-shrink-0
                        "
                    >
                        <span
                            className="material-symbols-outlined text-[#687582] dark:text-gray-400"
                            style={{ fontSize: 18 }}
                        >
                            chevron_right
                        </span>
                    </button>
                </>
            )}
        </div>
    );
}
