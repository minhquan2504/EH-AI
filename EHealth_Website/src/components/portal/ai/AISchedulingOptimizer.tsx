'use client';

import { useState, useEffect } from 'react';

// ============================================
// Types & Mock Data
// ============================================

interface TimeSlot {
    time: string;
    doctor: string;
    match: number;
    specialty: string;
    available: boolean;
}

const MOCK_SLOTS: TimeSlot[] = [
    { time: '14:30', doctor: 'BS. Nguyễn Văn An', match: 95, specialty: 'Tim mạch', available: true },
    { time: '15:00', doctor: 'BS. Trần Thị Bình', match: 82, specialty: 'Tim mạch', available: true },
    { time: '16:00', doctor: 'BS. Lê Văn Cường', match: 70, specialty: 'Nội tổng quát', available: true },
];

const SPECIALTY_COLORS: Record<string, string> = {
    'Tim mạch': 'bg-red-50 dark:bg-red-500/10 text-red-600',
    'Nội khoa': 'bg-blue-50 dark:bg-blue-500/10 text-blue-600',
    'Nội tổng quát': 'bg-blue-50 dark:bg-blue-500/10 text-blue-600',
    'Da liễu': 'bg-orange-50 dark:bg-orange-500/10 text-orange-600',
    'Nhi khoa': 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600',
};

function getSpecialtyColor(specialty: string): string {
    return SPECIALTY_COLORS[specialty] ?? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600';
}

function getMatchColor(match: number): string {
    if (match >= 90) return 'bg-emerald-500';
    if (match >= 75) return 'bg-blue-500';
    return 'bg-amber-500';
}

// ============================================
// Component
// ============================================

interface AISchedulingOptimizerProps {
    department?: string;
    reason?: string;
}

export function AISchedulingOptimizer({ department, reason }: AISchedulingOptimizerProps) {
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<string | null>(null);

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            // Simulate AI scheduling analysis
            await new Promise(r => setTimeout(r, 800));
            // In production: call aiService.analyze({ type: 'scheduling_optimize', department, reason })
            // For now: use mock with slight variation based on input
            if (department?.toLowerCase().includes('tim') || reason?.toLowerCase().includes('tim') || reason?.toLowerCase().includes('đau ngực')) {
                setSlots(MOCK_SLOTS);
            } else {
                setSlots([
                    { time: '09:00', doctor: 'BS. Phạm Văn Đức', match: 88, specialty: 'Nội khoa', available: true },
                    { time: '10:30', doctor: 'BS. Nguyễn Thị Mai', match: 76, specialty: 'Nội tổng quát', available: true },
                    { time: '14:00', doctor: 'BS. Lê Hoàng Nam', match: 65, specialty: 'Nội khoa', available: true },
                ]);
            }
            setLoading(false);
        };
        run();
    }, [department, reason]);

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                        <span className="material-symbols-outlined text-emerald-600 text-[20px]">event_available</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">AI Gợi ý lịch khám</h3>
                        <p className="text-xs text-[#687582] dark:text-gray-500">
                            {department ? `Khoa ${department}` : 'Xếp lịch tối ưu'}
                        </p>
                    </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                    <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                    AI match
                </span>
            </div>

            {/* Slots list */}
            <div className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e]">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="px-5 py-3.5 animate-pulse flex items-center gap-4">
                            <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-full" />
                            </div>
                            <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                        </div>
                    ))
                ) : (
                    slots.map((slot, idx) => (
                        <div
                            key={slot.time}
                            className={`px-5 py-3.5 flex items-center gap-4 transition-colors ${selected === slot.time ? 'bg-blue-50/50 dark:bg-blue-500/5' : 'hover:bg-[#f6f7f8] dark:hover:bg-[#13191f]'}`}
                        >
                            {/* Rank */}
                            <div className="w-7 h-7 rounded-lg bg-[#f6f7f8] dark:bg-[#13191f] flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-[#687582]">#{idx + 1}</span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                    <span className="text-sm font-bold text-[#121417] dark:text-white">{slot.time}</span>
                                    <span className="text-sm text-[#121417] dark:text-white">{slot.doctor}</span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getSpecialtyColor(slot.specialty)}`}>
                                        {slot.specialty}
                                    </span>
                                </div>
                                {/* Match bar */}
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${getMatchColor(slot.match)}`}
                                            style={{ width: `${slot.match}%` }}
                                        />
                                    </div>
                                    <span className="text-[11px] font-bold text-[#687582] shrink-0">{slot.match}%</span>
                                </div>
                            </div>

                            {/* Select button */}
                            <button
                                onClick={() => setSelected(slot.time)}
                                disabled={!slot.available}
                                className={`shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${selected === slot.time
                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                                    : 'bg-[#3C81C6] hover:bg-[#2a6da8] text-white shadow-sm'
                                }`}
                            >
                                {selected === slot.time ? (
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">check</span>
                                        Đã chọn
                                    </span>
                                ) : 'Chọn'}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
