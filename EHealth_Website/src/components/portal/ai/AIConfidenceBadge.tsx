'use client';

import { getConfidenceTier, AI_CONFIDENCE_COLORS } from '@/constants/ai';

interface AIConfidenceBadgeProps {
    confidence: number;
    sourcesCount?: number;
    size?: 'sm' | 'md';
}

export function AIConfidenceBadge({ confidence, sourcesCount, size = 'sm' }: AIConfidenceBadgeProps) {
    const tier = getConfidenceTier(confidence);
    const colors = AI_CONFIDENCE_COLORS[tier];

    return (
        <span className={`inline-flex items-center gap-1 ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'} rounded-full text-white ${colors.badge}`}>
            {confidence}%{sourcesCount !== undefined && ` · ${sourcesCount} nguồn`}
        </span>
    );
}
