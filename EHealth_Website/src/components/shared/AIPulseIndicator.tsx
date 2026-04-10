'use client';

// ============================================
// AIPulseIndicator
// ============================================

interface AIPulseIndicatorProps {
    size?: 'sm' | 'md';
    color?: 'violet' | 'amber' | 'green' | 'red';
}

const COLOR_MAP = {
    violet: { ring: 'bg-violet-400', dot: 'bg-violet-500' },
    amber:  { ring: 'bg-amber-400',  dot: 'bg-amber-500'  },
    green:  { ring: 'bg-green-400',  dot: 'bg-green-500'  },
    red:    { ring: 'bg-red-400',    dot: 'bg-red-500'    },
};

export default function AIPulseIndicator({
    size = 'sm',
    color = 'violet',
}: AIPulseIndicatorProps) {
    const { ring, dot } = COLOR_MAP[color];
    const wrapClass   = size === 'sm' ? 'w-2 h-2'   : 'w-3 h-3';
    const ringClass   = size === 'sm' ? 'w-2 h-2'   : 'w-3 h-3';
    const innerClass  = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

    return (
        <span className={`relative flex items-center justify-center flex-shrink-0 ${wrapClass}`}>
            <span
                className={`animate-ping absolute inline-flex rounded-full opacity-75 ${ringClass} ${ring}`}
            />
            <span
                className={`relative inline-flex rounded-full ${innerClass} ${dot}`}
            />
        </span>
    );
}
