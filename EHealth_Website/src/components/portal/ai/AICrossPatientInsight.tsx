'use client';

// ============================================
// Mock data
// ============================================

const MOCK_PATTERNS = [
    {
        pattern: '5 ca viêm phổi tuần này',
        insight: 'Có thể là dịch cúm mùa. Gợi ý: XN thêm CRP + cấy đàm cho BN tiếp theo.',
        severity: 'warning' as const,
        count: 5,
    },
    {
        pattern: 'Glucose tăng ở 3 BN THA',
        insight: 'BN THA có nguy cơ tiền ĐTĐ cao hơn. Gợi ý: HbA1c cho tất cả BN THA.',
        severity: 'info' as const,
        count: 3,
    },
];

const SEVERITY_CONFIG = {
    warning: {
        wrapper: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
        icon: 'warning',
        iconColor: 'text-amber-500 dark:text-amber-400',
        label: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
        text: 'text-amber-900 dark:text-amber-100',
        sub: 'text-amber-700 dark:text-amber-300',
    },
    info: {
        wrapper: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
        icon: 'info',
        iconColor: 'text-blue-500 dark:text-blue-400',
        label: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
        text: 'text-blue-900 dark:text-blue-100',
        sub: 'text-blue-700 dark:text-blue-300',
    },
};

// ============================================
// Component
// ============================================

export function AICrossPatientInsight() {
    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center gap-2.5">
                <div className="p-1.5 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                    <span className="material-symbols-outlined text-violet-600 text-[20px]">hub</span>
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-[#121417] dark:text-white">AI Cross-Patient Insight</h3>
                    <p className="text-xs text-[#687582] dark:text-gray-500">Xu hướng từ các bệnh nhân trong 7 ngày</p>
                </div>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-800">
                    <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                    AI
                </span>
            </div>

            {/* Patterns */}
            <div className="p-4 space-y-3">
                {MOCK_PATTERNS.map((p, i) => {
                    const cfg = SEVERITY_CONFIG[p.severity];
                    return (
                        <div key={i} className={`rounded-xl border p-3.5 ${cfg.wrapper}`}>
                            <div className="flex items-start gap-2.5">
                                <span className={`material-symbols-outlined text-[20px] flex-shrink-0 mt-0.5 ${cfg.iconColor}`}>
                                    {cfg.icon}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className={`text-sm font-semibold ${cfg.text}`}>{p.pattern}</p>
                                        <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${cfg.label}`}>
                                            {p.count} ca
                                        </span>
                                    </div>
                                    <p className={`text-xs leading-relaxed ${cfg.sub}`}>{p.insight}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Footer note */}
                <p className="text-[10px] text-[#687582] dark:text-gray-500 text-center pt-1">
                    Phân tích tự động — Dữ liệu demo mô phỏng
                </p>
            </div>
        </div>
    );
}

export default AICrossPatientInsight;
