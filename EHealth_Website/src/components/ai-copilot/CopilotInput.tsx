'use client';

import {
    useState,
    useRef,
    useEffect,
    type KeyboardEvent,
    type ChangeEvent,
} from 'react';
import { useAICopilot } from '@/contexts/AICopilotContext';
import { getCommandsForRole } from '@/lib/ai-copilot/commands';
import type { Command } from '@/lib/ai-copilot/commands';
import AIVoiceInputButton from '@/components/ai-copilot/AIVoiceInputButton';

// ============================================
// Per-role placeholder text
// ============================================

const PLACEHOLDERS: Record<string, string> = {
    doctor: 'Nhập câu hỏi hoặc /icd, /drug, /diagnose...',
    pharmacist: 'Hỏi về thuốc hoặc /drug, /interaction...',
    receptionist: 'Hỏi về lịch hẹn hoặc /summary...',
    patient: 'Hỏi về sức khỏe, triệu chứng...',
    admin: 'Hỏi về thống kê, hệ thống...',
};

// ============================================
// Props
// ============================================

interface Props {
    onSend: (text: string) => void;
    disabled?: boolean;
}

// ============================================
// Component
// ============================================

export default function CopilotInput({ onSend, disabled = false }: Props) {
    const { role, copilotCollapsed, toggleCopilot, setCommandPaletteOpen } = useAICopilot();

    const [value, setValue] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownHighlight, setDropdownHighlight] = useState(0);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const placeholder = PLACEHOLDERS[role] ?? 'Nhập câu hỏi...';
    const availableCommands: Command[] = getCommandsForRole(role);

    // Filter commands based on what the user has typed after "/"
    const filteredCommands = value.startsWith('/')
        ? availableCommands.filter(c =>
            c.trigger.startsWith(value.split(' ')[0]) || c.trigger.includes(value.split(' ')[0])
        )
        : [];

    // Show dropdown when input starts with "/" and there are matches
    useEffect(() => {
        if (value.startsWith('/') && filteredCommands.length > 0) {
            setShowDropdown(true);
            setDropdownHighlight(0);
        } else {
            setShowDropdown(false);
        }
    }, [value, filteredCommands.length]);

    // Auto-resize textarea
    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        ta.style.height = `${Math.min(ta.scrollHeight, 96)}px`;
    }, [value]);

    function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
        setValue(e.target.value);
    }

    function handleSelectCommand(cmd: Command) {
        setValue(cmd.trigger + ' ');
        setShowDropdown(false);
        textareaRef.current?.focus();
    }

    function handleSend() {
        const trimmed = value.trim();
        if (!trimmed || disabled) return;
        onSend(trimmed);
        setValue('');
        setShowDropdown(false);
    }

    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
        if (showDropdown) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setDropdownHighlight(h => Math.min(h + 1, filteredCommands.length - 1));
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setDropdownHighlight(h => Math.max(h - 1, 0));
                return;
            }
            if (e.key === 'Tab' || e.key === 'Enter') {
                if (filteredCommands[dropdownHighlight]) {
                    e.preventDefault();
                    handleSelectCommand(filteredCommands[dropdownHighlight]);
                    return;
                }
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                setShowDropdown(false);
                return;
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    /* ── Collapsed state: just a small icon button ── */
    if (copilotCollapsed) {
        return (
            <div className="flex items-center justify-center h-12 border-t border-[#dde0e4] dark:border-[#2d353e] bg-white dark:bg-[#1e242b] flex-shrink-0">
                <button
                    onClick={toggleCopilot}
                    title="Mở AI Copilot"
                    className="
                        flex items-center justify-center w-8 h-8 rounded-full
                        bg-[#3C81C6] hover:bg-[#2f6fb5]
                        text-white transition-colors
                    "
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        edit
                    </span>
                </button>
            </div>
        );
    }

    /* ── Expanded state ── */
    return (
        <div className="flex-shrink-0 border-t border-[#dde0e4] dark:border-[#2d353e] bg-white dark:bg-[#1e242b] relative">
            {/* Command dropdown */}
            {showDropdown && filteredCommands.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="
                        absolute bottom-full left-0 right-0
                        bg-white dark:bg-[#1e242b]
                        border border-[#dde0e4] dark:border-[#2d353e]
                        rounded-t-lg shadow-lg overflow-hidden z-10
                        max-h-48 overflow-y-auto
                    "
                >
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-[#687582] dark:text-gray-400 uppercase tracking-wide border-b border-[#dde0e4] dark:border-[#2d353e]">
                        Lệnh có sẵn
                    </div>
                    {filteredCommands.map((cmd, i) => (
                        <button
                            key={cmd.trigger}
                            onClick={() => handleSelectCommand(cmd)}
                            className={`
                                w-full flex items-start gap-2.5 px-3 py-2 text-left
                                transition-colors
                                ${i === dropdownHighlight
                                    ? 'bg-violet-50 dark:bg-violet-950/30'
                                    : 'hover:bg-gray-50 dark:hover:bg-white/5'
                                }
                            `}
                        >
                            <span
                                className="material-symbols-outlined text-violet-500 flex-shrink-0 mt-0.5"
                                style={{ fontSize: 16 }}
                            >
                                {cmd.icon}
                            </span>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 font-mono">
                                        {cmd.trigger}
                                    </span>
                                    <span className="text-[10px] text-[#687582] dark:text-gray-400">
                                        {cmd.label}
                                    </span>
                                </div>
                                <span className="text-[10px] text-[#687582] dark:text-gray-500 truncate block">
                                    {cmd.description}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Input row */}
            <div className="flex items-end gap-2 px-3 py-2">
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={1}
                    className="
                        flex-1 resize-none bg-[#f6f7f8] dark:bg-[#13191f]
                        border border-[#dde0e4] dark:border-[#2d353e]
                        rounded-xl px-3 py-2
                        text-xs text-gray-800 dark:text-gray-200
                        placeholder:text-[#687582] dark:placeholder:text-gray-500
                        focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 focus:border-[#3C81C6]
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-colors leading-relaxed
                        min-h-[36px] max-h-24
                    "
                    style={{ overflow: 'hidden' }}
                />

                {/* Voice input button */}
                <AIVoiceInputButton
                    size="sm"
                    onTranscript={(text) => setValue(prev => prev ? `${prev} ${text}` : text)}
                />

                {/* Send button */}
                <button
                    onClick={handleSend}
                    disabled={disabled || !value.trim()}
                    title="Gửi (Enter)"
                    className="
                        flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0
                        bg-[#3C81C6] hover:bg-[#2f6fb5]
                        disabled:opacity-40 disabled:cursor-not-allowed
                        text-white transition-colors
                    "
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        send
                    </span>
                </button>
            </div>

            {/* Bottom hint: Cmd+K */}
            <div className="flex items-center justify-end px-3 pb-1.5">
                <button
                    onClick={() => setCommandPaletteOpen(true)}
                    className="flex items-center gap-1 text-[10px] text-[#687582] dark:text-gray-500 hover:text-[#3C81C6] dark:hover:text-[#3C81C6] transition-colors"
                    title="Mở Command Palette"
                >
                    <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-[9px] border border-[#dde0e4] dark:border-[#2d353e]">
                        ⌘K
                    </kbd>
                    <span>palette</span>
                </button>
            </div>
        </div>
    );
}
