import { useSyncExternalStore, useCallback } from 'react';
import { aiPreferencesStore } from '@/store/aiPreferencesStore';
import type { AIPreferences } from '@/types';

/**
 * Hook để đọc và cập nhật AI Preferences
 *
 * @example
 * const { preferences, updatePreferences } = useAIPreferences();
 * if (preferences.enableAutoSymptomAnalysis) { ... }
 */
export function useAIPreferences() {
    const preferences = useSyncExternalStore(
        aiPreferencesStore.subscribe,
        aiPreferencesStore.getPreferences,
        aiPreferencesStore.getPreferences // server snapshot
    );

    const updatePreferences = useCallback((partial: Partial<AIPreferences>) => {
        aiPreferencesStore.updatePreferences(partial);
    }, []);

    const resetPreferences = useCallback(() => {
        aiPreferencesStore.resetPreferences();
    }, []);

    return { preferences, updatePreferences, resetPreferences };
}
