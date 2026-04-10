'use client';

import { formatMd } from '@/lib/ai-copilot/chat-utils';
import type { CommandResult } from '@/lib/ai-copilot/commands';

// ============================================
// Types & config
// ============================================

interface CommandResultCardProps {
    result: CommandResult;
    onApply?: () => void;
}

interface TypeConfig {
    label: string;
    pillClass: string;
    icon: string;
}

const TYPE_CONFIG: Record<CommandResult['type'], TypeConfig> = {
    icd: {
        label: 'ICD-10',
        pillClass: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
        icon: 'search',
    },
    drug: {
        label: 'Thuốc',
        pillClass: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
        icon: 'medication',
    },
    diagnosis: {
        label: 'Chẩn đoán',
        pillClass: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
        icon: 'diagnosis',
    },
    summary: {
        label: 'Tóm tắt',
        pillClass: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
        icon: 'summarize',
    },
    protocol: {
        label: 'Phác đồ',
        pillClass: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
        icon: 'description',
    },
    interaction: {
        label: 'Tương tác',
        pillClass: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
        icon: 'compare_arrows',
    },
    text: {
        label: 'Thông tin',
        pillClass: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
        icon: 'info',
    },
};

// ============================================
// CommandResultCard
// ============================================

export default function CommandResultCard({ result, onApply }: CommandResultCardProps) {
    const config = TYPE_CONFIG[result.type] ?? TYPE_CONFIG.text;

    return (
        <div
            className="rounded-lg overflow-hidden
                       border border-violet-200 dark:border-violet-800/50
                       border-l-4 border-l-violet-500
                       bg-white dark:bg-[#1e242b]
                       text-sm"
            style={{ borderLeftColor: '#7c3aed', borderLeftWidth: '3px' }}
        >
            {/* ── Top: type badge ─────────────────────────────────────────── */}
            <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${config.pillClass}`}>
                    <span className="material-symbols-outlined text-[13px]">{config.icon}</span>
                    {config.label}
                </span>
                <span className="ml-auto text-gray-300 dark:text-gray-600 text-[10px] font-mono select-none">AI</span>
            </div>

            {/* ── Content ─────────────────────────────────────────────────── */}
            <div
                className="px-3 pb-2 text-gray-700 dark:text-gray-300 leading-relaxed
                           [&_strong]:font-semibold [&_strong]:text-gray-900 dark:[&_strong]:text-gray-100
                           [&_em]:italic [&_code]:font-mono [&_code]:text-xs
                           [&_br]:block [&_br]:mb-0.5"
                dangerouslySetInnerHTML={{ __html: formatMd(result.content) }}
            />

            {/* ── Citations ───────────────────────────────────────────────── */}
            {result.citations && result.citations.length > 0 && (
                <div className="px-3 pb-2 border-t border-gray-100 dark:border-gray-800 pt-1.5">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-snug">
                        <span className="font-medium">Nguồn: </span>
                        {result.citations.join(' · ')}
                    </p>
                </div>
            )}

            {/* ── Apply button ─────────────────────────────────────────────── */}
            {result.applyable && onApply && (
                <div className="px-3 pb-3 pt-1">
                    <button
                        onClick={onApply}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                   bg-violet-600 hover:bg-violet-700 active:bg-violet-800
                                   text-white
                                   transition-colors duration-150 shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[14px]">edit_note</span>
                        Áp dụng vào form
                    </button>
                </div>
            )}
        </div>
    );
}
