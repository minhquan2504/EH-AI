import { useEffect } from 'react';
import { useAICopilot, type PageContext, type AutoFillCallback } from '@/contexts/AICopilotContext';

/**
 * Hook for pages to push their context to the AI Copilot.
 * Also provides auto-fill registration.
 *
 * @example
 * const { updateContext, registerAutoFill } = usePageAIContext({
 *   pageKey: 'examination',
 *   patientId: patient?.id,
 * });
 *
 * // Update context when step changes
 * useEffect(() => { updateContext({ currentStep: 'vitals' }); }, [step]);
 *
 * // Register auto-fill callback
 * useEffect(() => registerAutoFill((fields) => {
 *   if (fields.diagnosis) setDiagnosis(fields.diagnosis as string);
 * }), []);
 */
export function usePageAIContext(initialCtx: PageContext) {
    const { setPageContext, updatePageContext, registerAutoFill } = useAICopilot();

    useEffect(() => {
        setPageContext(initialCtx);
        return () => setPageContext(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // only on mount/unmount

    return {
        updateContext: updatePageContext,
        registerAutoFill,
    };
}
