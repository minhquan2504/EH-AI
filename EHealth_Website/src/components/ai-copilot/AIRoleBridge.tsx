'use client';

/**
 * Shows context summaries when data transfers between roles.
 * A small scrollable card in the copilot sidebar.
 */

const MOCK_BRIDGES = [
    {
        from: 'Lễ tân',
        to: 'Bác sĩ',
        patient: 'Nguyễn Văn An',
        summary: 'BN 52t, THA, đau đầu dữ dội từ sáng',
        time: '08:15',
        icon: 'swap_horiz',
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-100 dark:border-blue-800',
    },
    {
        from: 'Bác sĩ',
        to: 'Dược sĩ',
        patient: 'Trần Thị Bình',
        summary: 'Đơn thuốc #DT045 — Lưu ý dị ứng Penicillin',
        time: '09:30',
        icon: 'medication',
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        border: 'border-emerald-100 dark:border-emerald-800',
    },
];

export default function AIRoleBridge() {
    return (
        <div className="px-3 pb-2">
            {/* Section header */}
            <div className="flex items-center gap-1.5 mb-2">
                <span className="material-symbols-outlined text-[14px] text-indigo-500 dark:text-indigo-400">
                    share
                </span>
                <span className="text-[11px] font-semibold text-[#687582] dark:text-[#9faab5] uppercase tracking-wide">
                    Chuyển giao vai trò
                </span>
            </div>

            {/* Bridge list */}
            <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-0.5">
                {MOCK_BRIDGES.map((bridge, i) => (
                    <div
                        key={i}
                        className={`rounded-lg border p-2.5 ${bridge.bg} ${bridge.border}`}
                    >
                        {/* From → To badge */}
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className={`material-symbols-outlined text-[14px] ${bridge.color}`}>
                                {bridge.icon}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wide ${bridge.color}`}>
                                {bridge.from} → {bridge.to}
                            </span>
                            <span className="ml-auto text-[10px] text-[#687582] dark:text-gray-500 font-medium">
                                {bridge.time}
                            </span>
                        </div>

                        {/* Patient name */}
                        <p className="text-[11px] font-semibold text-[#121417] dark:text-white mb-0.5">
                            {bridge.patient}
                        </p>

                        {/* Summary */}
                        <p className="text-[11px] text-[#687582] dark:text-gray-400 leading-snug">
                            {bridge.summary}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
