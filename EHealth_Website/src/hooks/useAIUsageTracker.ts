'use client';

import { useState, useCallback, useEffect } from 'react';

// ============================================
// Types
// ============================================

export interface AIUsageStats {
    totalInteractions: number;
    suggestionsAccepted: number;
    suggestionsDeclined: number;
    commandsUsed: number;
    voiceInputUsed: number;
    currentStreak: number; // consecutive days
    lastActiveDate: string; // YYYY-MM-DD
    badges: string[]; // earned badge IDs
}

export type InteractionType =
    | 'chat'
    | 'command'
    | 'voice'
    | 'suggestion_accepted'
    | 'suggestion_declined';

// ============================================
// Badge definitions
// ============================================

export interface BadgeDefinition {
    id: string;
    icon: string;
    name: string;
    description: string;
    requirement: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
    {
        id: 'first_command',
        icon: 'terminal',
        name: 'Commander',
        description: 'Dùng lệnh AI lần đầu tiên',
        requirement: '1 lệnh',
    },
    {
        id: 'power_user',
        icon: 'bolt',
        name: 'Power User',
        description: 'Tương tác với AI 50 lần',
        requirement: '50 tương tác',
    },
    {
        id: 'voice_master',
        icon: 'mic',
        name: 'Voice Master',
        description: 'Dùng nhập liệu giọng nói 10 lần',
        requirement: '10 lần giọng nói',
    },
    {
        id: 'streak_5',
        icon: 'local_fire_department',
        name: 'Streak 5 ngày',
        description: 'Dùng AI 5 ngày liên tiếp',
        requirement: '5 ngày liên tiếp',
    },
    {
        id: 'ai_expert',
        icon: 'workspace_premium',
        name: 'AI Expert',
        description: 'Chấp nhận 100 gợi ý từ AI',
        requirement: '100 gợi ý chấp nhận',
    },
];

// ============================================
// Storage helpers
// ============================================

const STORAGE_KEY = 'ehealth_ai_usage_stats';

function getToday(): string {
    return new Date().toISOString().split('T')[0];
}

function loadStats(): AIUsageStats {
    if (typeof window === 'undefined') return defaultStats();
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as AIUsageStats;
    } catch { /* */ }
    return defaultStats();
}

function saveStats(stats: AIUsageStats): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch { /* */ }
}

function defaultStats(): AIUsageStats {
    return {
        totalInteractions: 0,
        suggestionsAccepted: 0,
        suggestionsDeclined: 0,
        commandsUsed: 0,
        voiceInputUsed: 0,
        currentStreak: 0,
        lastActiveDate: '',
        badges: [],
    };
}

// ============================================
// Check badges
// ============================================

function checkBadges(stats: AIUsageStats): string[] {
    const earned: string[] = [...stats.badges];

    const add = (id: string) => {
        if (!earned.includes(id)) earned.push(id);
    };

    if (stats.commandsUsed >= 1) add('first_command');
    if (stats.totalInteractions >= 50) add('power_user');
    if (stats.voiceInputUsed >= 10) add('voice_master');
    if (stats.currentStreak >= 5) add('streak_5');
    if (stats.suggestionsAccepted >= 100) add('ai_expert');

    return earned;
}

// ============================================
// Hook
// ============================================

export function useAIUsageTracker() {
    const [stats, setStats] = useState<AIUsageStats>(loadStats);

    // Update streak on mount
    useEffect(() => {
        setStats(prev => {
            const today = getToday();
            if (prev.lastActiveDate === today) return prev;

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yStr = yesterday.toISOString().split('T')[0];

            const newStreak = prev.lastActiveDate === yStr
                ? prev.currentStreak + 1
                : 1;

            const next = { ...prev, lastActiveDate: today, currentStreak: newStreak };
            next.badges = checkBadges(next);
            saveStats(next);
            return next;
        });
    }, []);

    const trackInteraction = useCallback((type: InteractionType) => {
        setStats(prev => {
            const today = getToday();
            const next: AIUsageStats = { ...prev };

            // Update last active + streak
            if (next.lastActiveDate !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yStr = yesterday.toISOString().split('T')[0];
                next.currentStreak = next.lastActiveDate === yStr ? next.currentStreak + 1 : 1;
                next.lastActiveDate = today;
            }

            next.totalInteractions++;

            switch (type) {
                case 'command':
                    next.commandsUsed++;
                    break;
                case 'voice':
                    next.voiceInputUsed++;
                    break;
                case 'suggestion_accepted':
                    next.suggestionsAccepted++;
                    break;
                case 'suggestion_declined':
                    next.suggestionsDeclined++;
                    break;
                default:
                    break;
            }

            next.badges = checkBadges(next);
            saveStats(next);
            return next;
        });
    }, []);

    const getAcceptanceRate = useCallback((): number => {
        const total = stats.suggestionsAccepted + stats.suggestionsDeclined;
        if (total === 0) return 0;
        return Math.round((stats.suggestionsAccepted / total) * 100);
    }, [stats]);

    const resetStats = useCallback(() => {
        const fresh = defaultStats();
        saveStats(fresh);
        setStats(fresh);
    }, []);

    return { stats, trackInteraction, getAcceptanceRate, resetStats };
}
