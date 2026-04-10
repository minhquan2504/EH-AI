'use client';

import { useAICopilot } from '@/contexts/AICopilotContext';
import type { AIProactiveAlert } from '@/types';

// ============================================
// Severity config
// ============================================

const SEVERITY_CONFIG = {
    critical: {
        wrapper: 'bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-800',
        icon:    'text-red-600 dark:text-red-400',
        text:    'text-red-800 dark:text-red-200',
        apply:   'bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-600',
        dismiss: 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200',
    },
    warning: {
        wrapper: 'bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800',
        icon:    'text-amber-600 dark:text-amber-400',
        text:    'text-amber-800 dark:text-amber-200',
        apply:   'bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-700 dark:hover:bg-amber-600',
        dismiss: 'text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-200',
    },
    info: {
        wrapper: 'bg-blue-50 border-blue-300 dark:bg-blue-950/30 dark:border-blue-800',
        icon:    'text-blue-600 dark:text-blue-400',
        text:    'text-blue-800 dark:text-blue-200',
        apply:   'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-600',
        dismiss: 'text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200',
    },
};

// ============================================
// Single alert item
// ============================================

interface AlertItemProps {
    alert: AIProactiveAlert;
    onApply: (alert: AIProactiveAlert) => void;
    onDismiss: (id: string) => void;
}

function AlertItem({ alert, onApply, onDismiss }: AlertItemProps) {
    const cfg = SEVERITY_CONFIG[alert.severity];

    return (
        <div className={`flex flex-col gap-1.5 p-2.5 rounded-lg border text-xs ${cfg.wrapper}`}>
            {/* Icon + message */}
            <div className="flex items-start gap-2">
                <span className={`material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5 ${cfg.icon}`}>
                    {alert.icon}
                </span>
                <p className={`leading-snug flex-1 ${cfg.text}`}>{alert.message}</p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 justify-end">
                {alert.autoFillPayload && (
                    <button
                        onClick={() => onApply(alert)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${cfg.apply}`}
                    >
                        Áp dụng
                    </button>
                )}
                <button
                    onClick={() => onDismiss(alert.id)}
                    className={`text-[11px] font-medium transition-colors ${cfg.dismiss}`}
                >
                    Bỏ qua
                </button>
            </div>
        </div>
    );
}

// ============================================
// AIProactiveNotifications (default export)
// ============================================

/**
 * Renders undismissed proactive AI alerts inside the copilot sidebar.
 * Placed above RolePageSuggestions.
 */
export default function AIProactiveNotifications() {
    const { proactiveAlerts, dismissAlert, triggerAutoFill } = useAICopilot();

    const visible = proactiveAlerts.filter(a => !a.dismissed);

    if (visible.length === 0) return null;

    const handleApply = (alert: AIProactiveAlert) => {
        if (alert.autoFillPayload) {
            triggerAutoFill(alert.autoFillPayload);
        }
        dismissAlert(alert.id);
    };

    return (
        <div className="px-3 pb-2">
            {/* Section header */}
            <div className="flex items-center gap-1.5 mb-2">
                <span className="material-symbols-outlined text-[14px] text-violet-600 dark:text-violet-400">
                    notifications_active
                </span>
                <span className="text-[11px] font-semibold text-[#687582] dark:text-[#9faab5] uppercase tracking-wide">
                    Cảnh báo AI ({visible.length})
                </span>
            </div>

            {/* Alert list — max height 200px */}
            <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-0.5">
                {visible.map(alert => (
                    <AlertItem
                        key={alert.id}
                        alert={alert}
                        onApply={handleApply}
                        onDismiss={dismissAlert}
                    />
                ))}
            </div>
        </div>
    );
}
