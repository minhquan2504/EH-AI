'use client';

interface AIHintTooltipProps {
    hint: string;
    citation?: string;
    loading?: boolean;
}

export function AIHintTooltip({ hint, citation, loading = false }: AIHintTooltipProps) {
    if (loading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-lg border-l-3 border-l-violet-600 animate-pulse">
                <span className="text-sm">🤖</span>
                <span className="text-xs text-violet-600 dark:text-violet-400">AI đang phân tích...</span>
            </div>
        );
    }

    return (
        <div className="px-3 py-2 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-lg border-l-[3px] border-l-violet-600">
            <div className="flex items-start gap-2">
                <span className="text-sm mt-0.5">🤖</span>
                <div className="min-w-0">
                    <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                        {hint}
                    </div>
                    {citation && (
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                            📚 {citation}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
