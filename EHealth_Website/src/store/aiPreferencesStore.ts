import type { AIPreferences } from '@/types';
import { DEFAULT_AI_PREFERENCES, AI_PREFERENCES_KEY } from '@/constants/ai';

/**
 * AI Preferences Store — localStorage-backed
 * Phase 1: Chỉ dùng localStorage, không cần backend
 * Phase 4: Tùy chọn sync với backend qua aiService.savePreferences
 */

function loadPreferences(): AIPreferences {
    if (typeof window === 'undefined') return { ...DEFAULT_AI_PREFERENCES };
    try {
        const stored = localStorage.getItem(AI_PREFERENCES_KEY);
        if (stored) {
            return { ...DEFAULT_AI_PREFERENCES, ...JSON.parse(stored) };
        }
    } catch {
        // Ignore parse errors
    }
    return { ...DEFAULT_AI_PREFERENCES };
}

function savePreferences(prefs: AIPreferences): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(AI_PREFERENCES_KEY, JSON.stringify(prefs));
    } catch {
        // Ignore storage errors
    }
}

let currentPreferences: AIPreferences = loadPreferences();
const listeners = new Set<() => void>();

export const aiPreferencesStore = {
    getPreferences(): AIPreferences {
        return currentPreferences;
    },

    updatePreferences(partial: Partial<AIPreferences>): void {
        currentPreferences = { ...currentPreferences, ...partial };
        savePreferences(currentPreferences);
        listeners.forEach((listener) => listener());
    },

    resetPreferences(): void {
        currentPreferences = { ...DEFAULT_AI_PREFERENCES };
        savePreferences(currentPreferences);
        listeners.forEach((listener) => listener());
    },

    subscribe(listener: () => void): () => void {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
};
