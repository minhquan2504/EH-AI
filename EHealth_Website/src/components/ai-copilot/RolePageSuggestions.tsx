'use client';

import { useEffect, useRef, useState } from 'react';
import { useAICopilot } from '@/contexts/AICopilotContext';
import { getSuggestionSpec, type Suggestion } from '@/lib/ai-copilot/role-suggestions';

// ============================================
// Skeleton card
// ============================================

function SkeletonCard() {
    return (
        <div className="animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800 p-3 flex gap-2.5">
            <div className="w-7 h-7 rounded-md bg-gray-200 dark:bg-gray-700 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
                <div className="h-3 rounded bg-gray-200 dark:bg-gray-700 w-3/4" />
                <div className="h-2.5 rounded bg-gray-200 dark:bg-gray-700 w-full" />
            </div>
        </div>
    );
}

// ============================================
// Hint card (empty state)
// ============================================

function HintCard() {
    return (
        <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-3 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[18px] text-gray-400 dark:text-gray-500 shrink-0">
                smart_toy
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 italic leading-snug">
                AI đang theo dõi...
            </span>
        </div>
    );
}

// ============================================
// Suggestion card
// ============================================

interface SuggestionCardProps {
    suggestion: Suggestion;
    onApply?: (payload: Record<string, unknown>) => void;
}

function SuggestionCard({ suggestion, onApply }: SuggestionCardProps) {
    const hasConfidence =
        typeof suggestion.confidence === 'number' && suggestion.confidence > 0;

    return (
        <div
            className="rounded-lg bg-gray-50 dark:bg-gray-800/60
                       border border-gray-100 dark:border-gray-700/60
                       p-3 flex gap-2.5 group"
        >
            {/* Icon */}
            <div className="w-7 h-7 rounded-md bg-violet-50 dark:bg-violet-900/30 shrink-0 mt-0.5 flex items-center justify-center">
                <span className="material-symbols-outlined text-[15px] text-violet-600 dark:text-violet-400">
                    {suggestion.icon}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-snug truncate">
                    {suggestion.title}
                </p>
                {suggestion.description && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug line-clamp-2">
                        {suggestion.description}
                    </p>
                )}

                {/* Confidence bar */}
                {hasConfidence && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                        <div className="flex-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-violet-500 dark:bg-violet-400 transition-all duration-500"
                                style={{ width: `${suggestion.confidence}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 shrink-0">
                            {suggestion.confidence}%
                        </span>
                    </div>
                )}

                {/* Apply button */}
                {suggestion.applyable && onApply && suggestion.applyPayload && (
                    <button
                        onClick={() => onApply(suggestion.applyPayload!)}
                        className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium
                                   bg-violet-100 dark:bg-violet-900/40 hover:bg-violet-200 dark:hover:bg-violet-800/60
                                   text-violet-700 dark:text-violet-300
                                   transition-colors duration-150"
                    >
                        <span className="material-symbols-outlined text-[12px]">edit_note</span>
                        Áp dụng
                    </button>
                )}
            </div>
        </div>
    );
}

// ============================================
// RolePageSuggestions
// ============================================

export default function RolePageSuggestions() {
    const { role, pageContext, triggerAutoFill } = useAICopilot();

    const pageKey = pageContext?.pageKey ?? '';
    const currentStep = pageContext?.currentStep;

    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(false);

    // Debounce timer ref
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Track whether the component is still mounted
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const spec = getSuggestionSpec(role, pageKey);
        if (!spec) {
            setSuggestions([]);
            return;
        }

        // Clear any pending debounce
        if (timerRef.current) clearTimeout(timerRef.current);

        setLoading(true);

        timerRef.current = setTimeout(async () => {
            try {
                const results = await spec.fetchFn(pageContext);
                if (!mountedRef.current) return;
                setSuggestions(results.slice(0, 3));
            } catch {
                // Error: hide (show nothing)
                if (!mountedRef.current) return;
                setSuggestions([]);
            } finally {
                if (mountedRef.current) setLoading(false);
            }
        }, 2000);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
        // Re-fetch when pageKey or currentStep changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role, pageKey, currentStep]);

    const spec = getSuggestionSpec(role, pageKey);

    // If no spec exists for this role+page, render nothing
    if (!spec) return null;

    return (
        <section className="px-3 pt-2 pb-1">
            {/* Section header */}
            <div className="flex items-center gap-1.5 mb-2">
                <span className="material-symbols-outlined text-[15px] text-violet-500 dark:text-violet-400">
                    {spec.icon}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 select-none">
                    {spec.title}
                </span>
                {loading && (
                    <span className="ml-auto">
                        <span
                            className="inline-block w-3 h-3 rounded-full border-2
                                       border-violet-400 border-t-transparent animate-spin"
                        />
                    </span>
                )}
            </div>

            {/* List */}
            <div
                className="flex flex-col gap-2 overflow-y-auto pr-0.5"
                style={{ maxHeight: '200px' }}
            >
                {/* Loading skeletons */}
                {loading && suggestions.length === 0 && (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                )}

                {/* Suggestion cards */}
                {!loading &&
                    suggestions.length > 0 &&
                    suggestions.map((s) => (
                        <SuggestionCard
                            key={s.id}
                            suggestion={s}
                            onApply={triggerAutoFill}
                        />
                    ))}

                {/* Empty state */}
                {!loading && suggestions.length === 0 && <HintCard />}
            </div>
        </section>
    );
}
