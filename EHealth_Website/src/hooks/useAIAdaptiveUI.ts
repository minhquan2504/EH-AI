'use client';

import { useState, useEffect } from 'react';

// ============================================
// Types
// ============================================

export interface AIAdaptiveUIState {
    isNightMode: boolean;
    isFatigueMode: boolean;
    compactMode: boolean;
}

// ============================================
// Session storage helpers
// ============================================

const SESSION_START_KEY = 'ehealth_session_start';
const DISMISSED_COUNT_KEY = 'ehealth_dismissed_suggestions';

function getSessionStart(): number {
    if (typeof window === 'undefined') return Date.now();
    try {
        const stored = sessionStorage.getItem(SESSION_START_KEY);
        if (stored) return Number(stored);
        const now = Date.now();
        sessionStorage.setItem(SESSION_START_KEY, String(now));
        return now;
    } catch {
        return Date.now();
    }
}

function getDismissedCount(): number {
    if (typeof window === 'undefined') return 0;
    try {
        return Number(sessionStorage.getItem(DISMISSED_COUNT_KEY) || '0');
    } catch {
        return 0;
    }
}

// ============================================
// Hook
// ============================================

export function useAIAdaptiveUI(): AIAdaptiveUIState {
    const [state, setState] = useState<AIAdaptiveUIState>({
        isNightMode: false,
        isFatigueMode: false,
        compactMode: false,
    });

    useEffect(() => {
        const compute = () => {
            const hour = new Date().getHours();
            const isNightMode = hour >= 20 || hour < 6;

            const sessionStart = getSessionStart();
            const sessionHours = (Date.now() - sessionStart) / (1000 * 60 * 60);
            const isFatigueMode = sessionHours >= 6;

            const dismissedCount = getDismissedCount();
            const compactMode = dismissedCount > 5;

            setState({ isNightMode, isFatigueMode, compactMode });
        };

        compute();
        // Re-check every 5 minutes
        const interval = setInterval(compute, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return state;
}

// ============================================
// Helper: increment dismissed count
// ============================================

export function incrementDismissedSuggestions(): void {
    try {
        const prev = Number(sessionStorage.getItem(DISMISSED_COUNT_KEY) || '0');
        sessionStorage.setItem(DISMISSED_COUNT_KEY, String(prev + 1));
    } catch { /* */ }
}
