'use client';

import { AICopilotProvider, type CopilotRole } from '@/contexts/AICopilotContext';
import AICopilotSidebar from '@/components/ai-copilot/AICopilotSidebar';
import AIOnboardingModal from '@/components/ai-copilot/AIOnboardingModal';
import AIWeeklySummary from '@/components/ai-copilot/AIWeeklySummary';

interface PortalShellProps {
    children: React.ReactNode;
    leftSidebar: React.ReactNode;
    header: React.ReactNode;
    role: CopilotRole;
}

/**
 * Shared layout wrapper for all 5 portals.
 * Injects the AI Copilot sidebar on the right side.
 */
export function PortalShell({ children, leftSidebar, header, role }: PortalShellProps) {
    return (
        <AICopilotProvider role={role}>
            <div className="bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-gray-100 font-display overflow-hidden h-screen flex">
                {leftSidebar}
                <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#f6f7f8] dark:bg-[#13191f] relative min-w-0">
                    {header}
                    <div className="flex-1 overflow-y-auto">{children}</div>
                </main>
                <AICopilotSidebar />
                <AIOnboardingModal />
                <AIWeeklySummary />
            </div>
        </AICopilotProvider>
    );
}
