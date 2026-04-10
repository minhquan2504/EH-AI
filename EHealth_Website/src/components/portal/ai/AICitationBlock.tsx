'use client';

import { useState } from 'react';
import type { Citation } from '@/types';
import { AI_EVIDENCE_LEVEL_COLORS } from '@/constants/ai';

interface AICitationBlockProps {
    citations: Citation[];
    defaultExpanded?: boolean;
}

export function AICitationBlock({ citations, defaultExpanded = false }: AICitationBlockProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    if (citations.length === 0) return null;

    return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-yellow-100/50 dark:hover:bg-yellow-900/30 transition-colors"
            >
                <span className="text-sm">📚</span>
                <span className="text-xs font-semibold text-yellow-800 dark:text-yellow-200">
                    Nguồn tham khảo ({citations.length})
                </span>
                <span className="ml-auto text-xs text-yellow-600 dark:text-yellow-400">
                    {expanded ? '▲' : '▼'}
                </span>
            </button>

            {expanded && (
                <div className="border-t border-yellow-200 dark:border-yellow-800">
                    {citations.map((citation) => {
                        const levelColors = AI_EVIDENCE_LEVEL_COLORS[citation.evidenceLevel];
                        return (
                            <div
                                key={citation.id}
                                className="px-3 py-2.5 border-b last:border-b-0 border-yellow-100 dark:border-yellow-800/50"
                            >
                                <div className="flex items-start gap-2">
                                    <span className={`${levelColors.bg} ${levelColors.text} text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap mt-0.5`}>
                                        {levelColors.label}
                                    </span>
                                    <div className="min-w-0">
                                        <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                            {citation.source}
                                        </div>
                                        {citation.section && (
                                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                                {citation.section}: &quot;{citation.excerpt}&quot;
                                            </div>
                                        )}
                                        {citation.reference && (
                                            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                                                📖 {citation.reference}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
