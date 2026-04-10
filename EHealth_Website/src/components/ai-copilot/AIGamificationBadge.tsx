'use client';

import { useState } from 'react';
import { useAIUsageTracker, BADGE_DEFINITIONS } from '@/hooks/useAIUsageTracker';

/**
 * Small header widget showing streak + latest badge.
 * Click to expand full badge grid.
 */
export default function AIGamificationBadge() {
    const { stats } = useAIUsageTracker();
    const [open, setOpen] = useState(false);

    const latestBadge = stats.badges.length > 0
        ? BADGE_DEFINITIONS.find(b => b.id === stats.badges[stats.badges.length - 1])
        : null;

    return (
        <div className="relative">
            {/* Trigger button */}
            <button
                onClick={() => setOpen(prev => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/20 dark:hover:bg-violet-900/30 border border-violet-200 dark:border-violet-800 transition-colors"
                title="Thành tích AI"
            >
                {/* Streak */}
                <span className="text-sm">🔥</span>
                <span className="text-xs font-bold text-violet-700 dark:text-violet-300">
                    {stats.currentStreak} ngày
                </span>

                {/* Latest badge icon */}
                {latestBadge && (
                    <>
                        <span className="text-violet-300 dark:text-violet-600 text-xs">·</span>
                        <span className="material-symbols-outlined text-[15px] text-violet-500 dark:text-violet-400">
                            {latestBadge.icon}
                        </span>
                    </>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-xl overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-[#f0f1f3] dark:border-[#2d353e] bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-[#121417] dark:text-white">Thành tích AI</h3>
                                    <p className="text-xs text-[#687582] dark:text-gray-400 mt-0.5">
                                        {stats.badges.length}/{BADGE_DEFINITIONS.length} huy hiệu đã mở
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-violet-600 dark:text-violet-400">🔥 {stats.currentStreak}</p>
                                    <p className="text-[10px] text-[#687582] dark:text-gray-500">ngày liên tiếp</p>
                                </div>
                            </div>

                            {/* Stats row */}
                            <div className="grid grid-cols-3 gap-2 mt-3">
                                <div className="text-center">
                                    <p className="text-sm font-bold text-[#121417] dark:text-white">{stats.totalInteractions}</p>
                                    <p className="text-[10px] text-[#687582] dark:text-gray-500">Tương tác</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{stats.suggestionsAccepted}</p>
                                    <p className="text-[10px] text-[#687582] dark:text-gray-500">Gợi ý OK</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{stats.commandsUsed}</p>
                                    <p className="text-[10px] text-[#687582] dark:text-gray-500">Lệnh</p>
                                </div>
                            </div>
                        </div>

                        {/* Badge grid */}
                        <div className="p-3 grid grid-cols-5 gap-2">
                            {BADGE_DEFINITIONS.map(badge => {
                                const earned = stats.badges.includes(badge.id);
                                return (
                                    <div
                                        key={badge.id}
                                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all cursor-default group relative ${
                                            earned
                                                ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800'
                                                : 'bg-gray-50 dark:bg-[#13191f] border-gray-200 dark:border-gray-800 opacity-40'
                                        }`}
                                        title={badge.description}
                                    >
                                        <span className={`material-symbols-outlined text-[22px] ${earned ? 'text-violet-500 dark:text-violet-400' : 'text-gray-400 dark:text-gray-600'}`}>
                                            {badge.icon}
                                        </span>
                                        <span className={`text-[9px] font-semibold text-center leading-tight ${earned ? 'text-violet-700 dark:text-violet-300' : 'text-gray-400 dark:text-gray-600'}`}>
                                            {badge.name}
                                        </span>

                                        {/* Tooltip on hover */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 px-2 py-1.5 bg-[#121417] dark:bg-white text-white dark:text-[#121417] text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 text-center shadow-lg">
                                            <p className="font-semibold">{badge.name}</p>
                                            <p className="text-gray-300 dark:text-gray-600">{badge.requirement}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
