'use client';

import { useState } from 'react';
import type { Citation } from '@/types';
import { AIConfidenceBadge } from './AIConfidenceBadge';
import { AICitationBlock } from './AICitationBlock';

interface AISuggestionPanelProps {
    title: string;
    children: React.ReactNode;
    confidence?: number;
    citations?: Citation[];
    variant?: 'default' | 'warning' | 'critical';
    onDismiss?: () => void;
    defaultExpanded?: boolean;
}

const VARIANT_STYLES = {
    default: {
        container: 'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20 border-violet-200 dark:border-violet-800',
        border: 'border-l-violet-600',
        title: 'text-violet-700 dark:text-violet-300',
    },
    warning: {
        container: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200 dark:border-amber-800',
        border: 'border-l-amber-500',
        title: 'text-amber-700 dark:text-amber-300',
    },
    critical: {
        container: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/20 border-red-200 dark:border-red-800',
        border: 'border-l-red-600',
        title: 'text-red-700 dark:text-red-300',
    },
};

export function AISuggestionPanel({
    title,
    children,
    confidence,
    citations = [],
    variant = 'default',
    onDismiss,
    defaultExpanded = true,
}: AISuggestionPanelProps) {
    const [dismissed, setDismissed] = useState(false);
    const styles = VARIANT_STYLES[variant];

    if (dismissed) return null;

    const handleDismiss = () => {
        setDismissed(true);
        onDismiss?.();
    };

    return (
        <div className={`${styles.container} border ${styles.border} border-l-4 rounded-lg overflow-hidden`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🤖</span>
                    <span className={`text-sm font-semibold ${styles.title}`}>{title}</span>
                    {confidence !== undefined && (
                        <AIConfidenceBadge confidence={confidence} sourcesCount={citations.length || undefined} />
                    )}
                </div>
                {onDismiss && (
                    <button
                        onClick={handleDismiss}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        aria-label="Đóng"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="px-4 pb-3">
                {children}
            </div>

            {/* Citations */}
            {citations.length > 0 && (
                <div className="px-4 pb-3">
                    <AICitationBlock citations={citations} />
                </div>
            )}
        </div>
    );
}
