'use client';

import type { ReactNode } from 'react';
import AIPulseIndicator from '@/components/shared/AIPulseIndicator';

// ============================================
// Props
// ============================================

export interface AIFormFieldEnhancerProps {
    children: ReactNode;
    isAnalyzing?: boolean;
    hasSuggestion?: boolean;
    suggestionValue?: string;
    onAcceptSuggestion?: () => void;
}

// ============================================
// Component
// ============================================

export function AIFormFieldEnhancer({
    children,
    isAnalyzing = false,
    hasSuggestion = false,
    suggestionValue,
    onAcceptSuggestion,
}: AIFormFieldEnhancerProps) {
    const showSuggestion = hasSuggestion && !!suggestionValue;

    return (
        <div className="relative w-full">
            {/* Field wrapper — violet ring when suggestion is available */}
            <div
                className={`
                    relative
                    ${showSuggestion
                        ? 'ring-2 ring-violet-400 dark:ring-violet-500 rounded-lg'
                        : ''
                    }
                `}
            >
                {children}

                {/* AI analyzing indicator — absolute on the right side */}
                {isAnalyzing && (
                    <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                        <AIPulseIndicator size="sm" color="violet" />
                    </div>
                )}
            </div>

            {/* Suggestion ghost text + accept button */}
            {showSuggestion && (
                <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-xs text-violet-600 dark:text-violet-400 flex-1 truncate">
                        💡 {suggestionValue}
                    </span>
                    <button
                        type="button"
                        onClick={onAcceptSuggestion}
                        className="
                            flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold
                            bg-violet-100 dark:bg-violet-900/40
                            text-violet-700 dark:text-violet-300
                            hover:bg-violet-200 dark:hover:bg-violet-800/50
                            border border-violet-200 dark:border-violet-700
                            transition-colors flex-shrink-0 animate-pulse
                        "
                        title="Chấp nhận gợi ý AI"
                    >
                        Enter
                        <span className="material-symbols-outlined" style={{ fontSize: 11 }}>
                            check
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}
