'use client';

import { useEffect, useCallback, useState } from 'react';
import { useAICopilot } from '@/contexts/AICopilotContext';
import { aiService } from '@/services/aiService';
import { getNow } from '@/lib/ai-copilot/chat-utils';
import { parseCommand } from '@/lib/ai-copilot/commands';

import CopilotHeader from './CopilotHeader';
import CopilotContextBanner from './CopilotContextBanner';
import CopilotChatArea, { type ChatMessage } from './CopilotChatArea';
import CopilotInput from './CopilotInput';
import RolePageSuggestions from './RolePageSuggestions';
import CommandPalette from './CommandPalette';
import AIProactiveNotifications from './AIProactiveNotifications';
import AICollaborativeAlert from './AICollaborativeAlert';
import AIRoleBridge from './AIRoleBridge';
import type { CommandResult } from '@/lib/ai-copilot/commands';

// ============================================
// Message history builder (for AI service)
// ============================================

function toHistory(messages: ChatMessage[]) {
    return messages.slice(-10).map(m => ({
        role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
    }));
}

// ============================================
// AICopilotSidebar
// ============================================

let _msgId = 1;
function nextId() {
    return _msgId++;
}

export default function AICopilotSidebar() {
    const {
        copilotCollapsed,
        setCopilotCollapsed,
        setCommandPaletteOpen,
        pageContext,
        role,
    } = useAICopilot();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [typing, setTyping] = useState(false);

    // ── Cmd+K global shortcut ──────────────────────────────────────────────
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (copilotCollapsed) setCopilotCollapsed(false);
                setCommandPaletteOpen(true);
            }
        },
        [copilotCollapsed, setCopilotCollapsed, setCommandPaletteOpen]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown as EventListener);
        return () => window.removeEventListener('keydown', handleKeyDown as EventListener);
    }, [handleKeyDown]);

    // ── Send handler ───────────────────────────────────────────────────────
    const handleSend = useCallback(
        async (text: string) => {
            const userMsg: ChatMessage = {
                id: nextId(),
                role: 'user',
                text,
                time: getNow(),
            };
            setMessages(prev => [...prev, userMsg]);
            setTyping(true);

            try {
                // Check if it's a slash command
                const parsed = parseCommand(text);

                if (parsed) {
                    const [cmd, args] = parsed;
                    const result: CommandResult = await cmd.execute(args, pageContext);

                    const aiMsg: ChatMessage = {
                        id: nextId(),
                        role: 'ai',
                        text: result.content,
                        time: getNow(),
                        commandResult: result,
                    };
                    setMessages(prev => [...prev, aiMsg]);
                } else {
                    // Free-form chat
                    const res = await aiService.chat({
                        message: text,
                        context: pageContext
                            ? {
                                  role,
                                  pageKey: pageContext.pageKey,
                                  patientId: pageContext.patientId,
                                  patientName: pageContext.patientName,
                                  currentStep: pageContext.currentStep,
                              }
                            : { role },
                        history: toHistory(messages),
                    });

                    const data = res?.data as any;
                    const reply: string =
                        data?.message || data?.content || data?.reply || 'Xin lỗi, tôi không hiểu. Thử lại nhé.';

                    const aiMsg: ChatMessage = {
                        id: nextId(),
                        role: 'ai',
                        text: reply,
                        time: getNow(),
                    };
                    setMessages(prev => [...prev, aiMsg]);
                }
            } catch (err) {
                const errMsg: ChatMessage = {
                    id: nextId(),
                    role: 'ai',
                    text: 'Có lỗi xảy ra. Vui lòng thử lại sau.',
                    time: getNow(),
                };
                setMessages(prev => [...prev, errMsg]);
            } finally {
                setTyping(false);
            }
        },
        [pageContext, role, messages]
    );

    // ── Layout ─────────────────────────────────────────────────────────────
    return (
        <aside
            className={`
                flex flex-col flex-shrink-0 h-full
                border-l border-[#dde0e4] dark:border-[#2d353e]
                bg-white dark:bg-[#1e242b]
                transition-all duration-300 ease-in-out
                z-20 overflow-hidden
                ${copilotCollapsed ? 'w-[52px]' : 'w-80'}
            `}
        >
            {/* ── Header ── */}
            <CopilotHeader />

            {/* ── Context Banner ── */}
            {!copilotCollapsed && <CopilotContextBanner />}

            {/* ── Collaborative Alert (multi-user viewing same patient) ── */}
            {!copilotCollapsed && <AICollaborativeAlert />}

            {/* ── Proactive AI Alerts ── */}
            {!copilotCollapsed && <AIProactiveNotifications />}

            {/* ── Role Bridge (handoff summaries) ── */}
            {!copilotCollapsed && <AIRoleBridge />}

            {/* ── Role/Page Proactive Suggestions ── */}
            {!copilotCollapsed && <RolePageSuggestions />}

            {/* ── Command Palette Modal ── */}
            <CommandPalette />

            {/* ── Chat Area ── */}
            <CopilotChatArea messages={messages} typing={typing} />

            {/* ── Input (renders differently when collapsed) ── */}
            <CopilotInput onSend={handleSend} disabled={typing} />
        </aside>
    );
}
