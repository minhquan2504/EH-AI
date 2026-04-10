'use client';

import { useAICopilot } from '@/contexts/AICopilotContext';
import { getPageLabel } from '@/lib/ai-copilot/page-context-inference';

const PAGE_ICONS: Record<string, string> = {
    dashboard: 'home',
    examination: 'clinical_notes',
    'prescriptions.new': 'edit_note',
    prescriptions: 'receipt_long',
    queue: 'queue',
    appointments: 'calendar_month',
    'medical-records': 'folder_shared',
    'ai-assistant': 'smart_toy',
    telemedicine: 'video_call',
    dispensing: 'local_pharmacy',
    inventory: 'inventory_2',
    reception: 'meeting_room',
    billing: 'payments',
    patients: 'group',
    'health-records': 'health_and_safety',
    'medication-reminders': 'alarm',
    'ai-consult': 'psychology',
    statistics: 'analytics',
    'activity-logs': 'history',
    settings: 'settings',
    users: 'manage_accounts',
    departments: 'apartment',
    medicines: 'medication',
    hospitals: 'local_hospital',
    schedules: 'schedule',
    doctors: 'stethoscope',
    unknown: 'help_outline',
};

const STEP_LABELS: Record<string, string> = {
    vitals: 'Sinh hiệu',
    symptoms: 'Triệu chứng',
    diagnosis: 'Chẩn đoán',
    prescription: 'Kê đơn',
    notes: 'Ghi chú',
    review: 'Xem lại',
};

export default function CopilotContextBanner() {
    const { pageContext, copilotCollapsed } = useAICopilot();

    const pageKey = pageContext?.pageKey ?? null;
    const pageIcon = pageKey ? (PAGE_ICONS[pageKey] ?? 'description') : null;
    const pageLabel = pageKey ? getPageLabel(pageKey) : null;
    const patientName = pageContext?.patientName ?? null;
    const currentStep = pageContext?.currentStep ?? null;
    const stepLabel = currentStep ? (STEP_LABELS[currentStep] ?? currentStep) : null;

    /* Collapsed: show only page icon */
    if (copilotCollapsed) {
        return (
            <div className="flex items-center justify-center h-9 border-b border-[#dde0e4] dark:border-[#2d353e] bg-violet-50 dark:bg-violet-950/20">
                {pageIcon ? (
                    <span
                        className="material-symbols-outlined text-violet-500 dark:text-violet-400"
                        style={{ fontSize: 18 }}
                        title={pageLabel ?? ''}
                    >
                        {pageIcon}
                    </span>
                ) : (
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                )}
            </div>
        );
    }

    return (
        <div
            className="
                flex items-center gap-2 h-9 px-3 flex-shrink-0
                border-b border-[#dde0e4] dark:border-[#2d353e]
                bg-violet-50 dark:bg-violet-950/20
                overflow-hidden
            "
        >
            {pageContext && pageIcon ? (
                <>
                    {/* Page icon + label */}
                    <span
                        className="material-symbols-outlined text-violet-500 dark:text-violet-400 flex-shrink-0"
                        style={{ fontSize: 16 }}
                    >
                        {pageIcon}
                    </span>
                    <span className="text-xs font-medium text-violet-700 dark:text-violet-300 truncate flex-shrink-0">
                        {pageLabel}
                    </span>

                    {/* Patient name chip */}
                    {patientName && (
                        <span
                            className="
                                inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
                                bg-violet-100 dark:bg-violet-900/40
                                text-violet-700 dark:text-violet-300
                                text-[10px] font-medium flex-shrink-0
                            "
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{ fontSize: 11 }}
                            >
                                person
                            </span>
                            {patientName}
                        </span>
                    )}

                    {/* Step indicator */}
                    {stepLabel && (
                        <span
                            className="
                                inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
                                bg-white dark:bg-[#1e242b] border border-violet-200 dark:border-violet-800
                                text-[#687582] dark:text-gray-400
                                text-[10px] font-medium flex-shrink-0 ml-auto
                            "
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{ fontSize: 11 }}
                            >
                                linear_scale
                            </span>
                            {stepLabel}
                        </span>
                    )}
                </>
            ) : (
                /* No context: navigating */
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse flex-shrink-0" />
                    <span className="text-xs text-[#687582] dark:text-gray-400 italic">
                        Đang điều hướng...
                    </span>
                </div>
            )}
        </div>
    );
}
