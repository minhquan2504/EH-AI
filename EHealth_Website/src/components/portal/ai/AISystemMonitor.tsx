'use client';

import { useState } from 'react';

// ============================================
// Types & Mock Data
// ============================================

interface Anomaly {
    type: 'performance' | 'security' | 'data' | 'availability';
    message: string;
    severity: 'critical' | 'warning' | 'info';
    time: string;
}

const MOCK_ANOMALIES: Anomaly[] = [
    { type: 'performance', message: 'API response time tăng 40% trong 2 giờ qua', severity: 'warning', time: '10:30' },
    { type: 'security', message: '3 lần đăng nhập thất bại từ IP 192.168.1.100', severity: 'info', time: '09:15' },
];

const SEVERITY_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    critical: { bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600', dot: 'bg-red-500', label: 'Nghiêm trọng' },
    warning: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-500', label: 'Cảnh báo' },
    info: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600', dot: 'bg-blue-500', label: 'Thông tin' },
};

const TYPE_ICON: Record<string, string> = {
    performance: 'speed',
    security: 'shield',
    data: 'database',
    availability: 'cloud',
};

// ============================================
// Component
// ============================================

export function AISystemMonitor() {
    const [anomalies] = useState<Anomaly[]>(MOCK_ANOMALIES);
    const [resolved, setResolved] = useState<Set<number>>(new Set());

    const visible = anomalies.filter((_, i) => !resolved.has(i));
    const hasIssues = visible.some(a => a.severity === 'critical' || a.severity === 'warning');

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${hasIssues ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-emerald-50 dark:bg-emerald-500/10'}`}>
                        <span className={`material-symbols-outlined text-[20px] ${hasIssues ? 'text-amber-600' : 'text-emerald-600'}`}>
                            monitor
                        </span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">AI Giám sát hệ thống</h3>
                        <p className="text-xs text-[#687582] dark:text-gray-500">
                            {visible.length === 0 ? 'Không phát hiện bất thường' : `${visible.length} sự kiện cần xem`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${hasIssues ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className={`text-[10px] font-bold ${hasIssues ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {hasIssues ? 'Cần xem xét' : 'Bình thường'}
                    </span>
                </div>
            </div>

            {/* Anomaly list */}
            <div className="p-4 space-y-2">
                {visible.length === 0 ? (
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                        <span className="material-symbols-outlined text-emerald-600 text-[28px]">verified</span>
                        <div>
                            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Hệ thống hoạt động bình thường</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-500">Không phát hiện bất thường nào.</p>
                        </div>
                    </div>
                ) : (
                    anomalies.map((anomaly, i) => {
                        if (resolved.has(i)) return null;
                        const cfg = SEVERITY_CONFIG[anomaly.severity];
                        return (
                            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${cfg.bg}`}>
                                <span className={`material-symbols-outlined text-[20px] mt-0.5 flex-shrink-0 ${cfg.text}`}>
                                    {TYPE_ICON[anomaly.type] ?? 'warning'}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text}`}>
                                            {cfg.label}
                                        </span>
                                        <span className="text-[10px] text-[#687582]">{anomaly.time}</span>
                                    </div>
                                    <p className={`text-xs ${cfg.text}`}>{anomaly.message}</p>
                                </div>
                                <button
                                    onClick={() => setResolved(prev => { const s = new Set(prev); s.add(i); return s; })}
                                    className="shrink-0 text-[10px] font-medium text-[#687582] hover:text-[#121417] dark:hover:text-white px-2 py-1 rounded-lg hover:bg-white/50 transition-colors"
                                >
                                    Xong
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
