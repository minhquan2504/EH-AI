'use client';

import { useEffect, useRef } from 'react';
import { useAICopilot } from '@/contexts/AICopilotContext';
import { formatMd } from '@/lib/ai-copilot/chat-utils';
import type { CommandResult } from '@/lib/ai-copilot/commands';

// ============================================
// Types
// ============================================

export interface ChatMessage {
    id: number;
    role: 'user' | 'ai';
    text: string;
    time: string;
    commandResult?: CommandResult;
}

interface Props {
    messages: ChatMessage[];
    typing: boolean;
}

// ============================================
// Result type config
// ============================================

const RESULT_TYPE_CONFIG: Record<
    string,
    { label: string; icon: string; badgeClass: string }
> = {
    icd: {
        label: 'ICD-10',
        icon: 'search',
        badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    },
    drug: {
        label: 'Thuốc',
        icon: 'medication',
        badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    },
    diagnosis: {
        label: 'Chẩn đoán',
        icon: 'diagnosis',
        badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    },
    summary: {
        label: 'Tóm tắt',
        icon: 'summarize',
        badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    },
    protocol: {
        label: 'Phác đồ',
        icon: 'description',
        badgeClass: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    },
    interaction: {
        label: 'Tương tác',
        icon: 'compare_arrows',
        badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    },
    text: {
        label: 'Thông tin',
        icon: 'info',
        badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    },
};

// ============================================
// Sub-components
// ============================================

function CommandResultCard({
    result,
    onApply,
}: {
    result: CommandResult;
    onApply?: (payload: Record<string, unknown>) => void;
}) {
    const config = RESULT_TYPE_CONFIG[result.type] ?? RESULT_TYPE_CONFIG.text;

    return (
        <div
            className="
                mt-1 rounded-lg overflow-hidden
                border border-[#dde0e4] dark:border-[#2d353e]
                border-l-4 border-l-violet-500
                bg-white dark:bg-[#13191f]
            "
        >
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[#dde0e4] dark:border-[#2d353e]">
                <span
                    className={`
                        inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
                        text-[10px] font-semibold ${config.badgeClass}
                    `}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 11 }}>
                        {config.icon}
                    </span>
                    {config.label}
                </span>
            </div>

            {/* Content */}
            <div
                className="px-3 py-2 text-xs text-gray-800 dark:text-gray-200 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatMd(result.content) }}
            />

            {/* Citations */}
            {result.citations && result.citations.length > 0 && (
                <div className="px-3 pb-2 flex flex-wrap gap-1">
                    {result.citations.map((c, i) => (
                        <span
                            key={i}
                            className="
                                text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800
                                text-[#687582] dark:text-gray-400 font-mono
                            "
                        >
                            [{i + 1}] {c}
                        </span>
                    ))}
                </div>
            )}

            {/* Apply button */}
            {result.applyable && result.applyPayload && onApply && (
                <div className="px-3 pb-3">
                    <button
                        onClick={() => onApply(result.applyPayload!)}
                        className="
                            flex items-center gap-1.5 px-3 py-1.5 rounded-md
                            bg-[#3C81C6] hover:bg-[#2f6fb5]
                            text-white text-xs font-medium
                            transition-colors
                        "
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                            auto_fix_high
                        </span>
                        Áp dụng
                    </button>
                </div>
            )}
        </div>
    );
}

function TypingIndicator() {
    return (
        <div className="flex items-end gap-2 px-4 py-2">
            {/* AI avatar */}
            <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
                <span
                    className="material-symbols-outlined text-violet-500"
                    style={{ fontSize: 14 }}
                >
                    smart_toy
                </span>
            </div>

            {/* Bouncing dots */}
            <div className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e]">
                {[0, 1, 2].map(i => (
                    <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-[#687582] dark:bg-gray-400 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                    />
                ))}
            </div>
        </div>
    );
}

// ============================================
// Main Component
// ============================================

export default function CopilotChatArea({ messages, typing }: Props) {
    const { copilotCollapsed, triggerAutoFill } = useAICopilot();
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom whenever messages or typing changes
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typing]);

    if (copilotCollapsed) return null;

    return (
        <div className="flex-1 overflow-y-auto py-3 space-y-1 min-h-0">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
                        <span
                            className="material-symbols-outlined text-violet-400"
                            style={{ fontSize: 28 }}
                        >
                            smart_toy
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Xin chào! Tôi là AI Copilot
                        </p>
                        <p className="text-xs text-[#687582] dark:text-gray-400 mt-1">
                            Hỏi tôi bất cứ điều gì hoặc dùng lệnh /
                        </p>
                    </div>
                </div>
            )}

            {messages.map(msg => (
                <div
                    key={msg.id}
                    className={`flex items-end gap-2 px-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                    {/* AI Avatar */}
                    {msg.role === 'ai' && (
                        <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0 mb-0.5">
                            <span
                                className="material-symbols-outlined text-violet-500"
                                style={{ fontSize: 14 }}
                            >
                                smart_toy
                            </span>
                        </div>
                    )}

                    {/* Bubble */}
                    <div className={`max-w-[80%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {msg.commandResult ? (
                            /* Command result card */
                            <CommandResultCard
                                result={msg.commandResult}
                                onApply={triggerAutoFill}
                            />
                        ) : (
                            /* Plain text bubble */
                            <div
                                className={`
                                    px-3 py-2 rounded-2xl text-xs leading-relaxed
                                    ${msg.role === 'user'
                                        ? 'bg-[#3C81C6] text-white rounded-br-sm'
                                        : 'bg-white dark:bg-[#1e242b] text-gray-800 dark:text-gray-200 border border-[#dde0e4] dark:border-[#2d353e] rounded-bl-sm'
                                    }
                                `}
                                dangerouslySetInnerHTML={{ __html: formatMd(msg.text) }}
                            />
                        )}

                        {/* Timestamp */}
                        <span className="text-[10px] text-[#687582] dark:text-gray-500 mt-0.5 px-1">
                            {msg.time}
                        </span>
                    </div>
                </div>
            ))}

            {/* Typing indicator */}
            {typing && <TypingIndicator />}

            {/* Scroll anchor */}
            <div ref={bottomRef} />
        </div>
    );
}
