'use client';

interface AIStatusIndicatorProps {
    status: 'loading' | 'ready' | 'error' | 'no-evidence';
}

const STATUS_CONFIG = {
    loading: {
        className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
        icon: '⏳',
        label: 'AI đang phân tích...',
        animate: true,
    },
    ready: {
        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        icon: '✓',
        label: 'AI sẵn sàng',
        animate: false,
    },
    error: {
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        icon: '⚠',
        label: 'AI tạm không khả dụng',
        animate: false,
    },
    'no-evidence': {
        className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        icon: 'ℹ',
        label: 'Không tìm thấy guideline',
        animate: false,
    },
} as const;

export function AIStatusIndicator({ status }: AIStatusIndicatorProps) {
    const config = STATUS_CONFIG[status];

    return (
        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${config.className} ${config.animate ? 'animate-pulse' : ''}`}>
            <span>{config.icon}</span>
            {config.label}
        </span>
    );
}
