'use client';

import { createContext, useContext, useState, useCallback, useRef, useMemo, type ReactNode } from 'react';
import type { AIProactiveAlert, AIAlertSeverity, AIEngineStatus } from '@/types';

// ============================================
// Types
// ============================================

export type CopilotRole = 'doctor' | 'pharmacist' | 'receptionist' | 'patient' | 'admin';

export interface PageContext {
    pageKey: string;
    patientId?: string;
    patientName?: string;
    patientAge?: number;
    currentStep?: string;
    formData?: Record<string, unknown>;
    extra?: Record<string, unknown>;
}

export type AutoFillCallback = (fields: Record<string, unknown>) => void;

interface AICopilotContextType {
    // Layout
    copilotCollapsed: boolean;
    toggleCopilot: () => void;
    setCopilotCollapsed: (collapsed: boolean) => void;

    // Role
    role: CopilotRole;

    // Page context
    pageContext: PageContext | null;
    setPageContext: (ctx: PageContext | null) => void;
    updatePageContext: (partial: Partial<PageContext>) => void;

    // Auto-fill
    registerAutoFill: (callback: AutoFillCallback) => () => void;
    triggerAutoFill: (fields: Record<string, unknown>) => void;

    // Command palette
    commandPaletteOpen: boolean;
    setCommandPaletteOpen: (open: boolean) => void;

    // Proactive alert bus
    proactiveAlerts: AIProactiveAlert[];
    pushAlert: (alert: Omit<AIProactiveAlert, 'id' | 'timestamp' | 'dismissed'>) => void;
    dismissAlert: (id: string) => void;
    clearAlerts: () => void;
    engineStatus: AIEngineStatus;
    setEngineStatus: (status: AIEngineStatus) => void;
    alertCount: number;
}

// ============================================
// Context
// ============================================

const AICopilotContext = createContext<AICopilotContextType | undefined>(undefined);

const COPILOT_COLLAPSED_KEY = 'ehealth_copilot_collapsed';

function loadCollapsedState(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        return localStorage.getItem(COPILOT_COLLAPSED_KEY) === 'true';
    } catch {
        return false;
    }
}

// ============================================
// Provider
// ============================================

export function AICopilotProvider({ children, role }: { children: ReactNode; role: CopilotRole }) {
    const [copilotCollapsed, setCopilotCollapsedState] = useState(loadCollapsedState);
    const [pageContext, setPageContextState] = useState<PageContext | null>(null);
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const autoFillRef = useRef<AutoFillCallback | null>(null);
    const [proactiveAlerts, setProactiveAlerts] = useState<AIProactiveAlert[]>([]);
    const [engineStatus, setEngineStatus] = useState<AIEngineStatus>('idle');

    const toggleCopilot = useCallback(() => {
        setCopilotCollapsedState(prev => {
            const next = !prev;
            try { localStorage.setItem(COPILOT_COLLAPSED_KEY, String(next)); } catch { /* */ }
            return next;
        });
    }, []);

    const setCopilotCollapsed = useCallback((collapsed: boolean) => {
        setCopilotCollapsedState(collapsed);
        try { localStorage.setItem(COPILOT_COLLAPSED_KEY, String(collapsed)); } catch { /* */ }
    }, []);

    const setPageContext = useCallback((ctx: PageContext | null) => {
        setPageContextState(ctx);
    }, []);

    const updatePageContext = useCallback((partial: Partial<PageContext>) => {
        setPageContextState(prev => prev ? { ...prev, ...partial } : { pageKey: 'unknown', ...partial });
    }, []);

    const registerAutoFill = useCallback((cb: AutoFillCallback) => {
        autoFillRef.current = cb;
        return () => { autoFillRef.current = null; };
    }, []);

    const triggerAutoFill = useCallback((fields: Record<string, unknown>) => {
        autoFillRef.current?.(fields);
    }, []);

    const pushAlert = useCallback((alert: Omit<AIProactiveAlert, 'id' | 'timestamp' | 'dismissed'>) => {
        setProactiveAlerts(prev => {
            // Deduplicate by sourceField + severity
            if (alert.sourceField) {
                const existing = prev.find(
                    a => a.sourceField === alert.sourceField && a.severity === alert.severity && !a.dismissed
                );
                if (existing) return prev;
            }
            const newAlert: AIProactiveAlert = {
                ...alert,
                id: `alert-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                timestamp: Date.now(),
                dismissed: false,
            };
            return [...prev, newAlert];
        });
    }, []);

    const dismissAlert = useCallback((id: string) => {
        setProactiveAlerts(prev =>
            prev.map(a => a.id === id ? { ...a, dismissed: true } : a)
        );
    }, []);

    const clearAlerts = useCallback(() => {
        setProactiveAlerts([]);
    }, []);

    const alertCount = useMemo(
        () => proactiveAlerts.filter(a => !a.dismissed).length,
        [proactiveAlerts]
    );

    return (
        <AICopilotContext.Provider value={{
            copilotCollapsed, toggleCopilot, setCopilotCollapsed,
            role,
            pageContext, setPageContext, updatePageContext,
            registerAutoFill, triggerAutoFill,
            commandPaletteOpen, setCommandPaletteOpen,
            proactiveAlerts, pushAlert, dismissAlert, clearAlerts,
            engineStatus, setEngineStatus, alertCount,
        }}>
            {children}
        </AICopilotContext.Provider>
    );
}

// ============================================
// Hook
// ============================================

export function useAICopilot() {
    const ctx = useContext(AICopilotContext);
    if (!ctx) throw new Error('useAICopilot must be used inside AICopilotProvider');
    return ctx;
}
