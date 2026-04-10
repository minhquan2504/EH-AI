'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAICopilot } from '@/contexts/AICopilotContext';
import { getCommandsForRole, type Command } from '@/lib/ai-copilot/commands';

// ============================================
// CommandPalette
// ============================================

export default function CommandPalette() {
    const {
        role,
        commandPaletteOpen,
        setCommandPaletteOpen,
        copilotCollapsed,
        toggleCopilot,
        triggerAutoFill,
    } = useAICopilot();

    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    const searchRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const commands = getCommandsForRole(role);

    const filtered = query.trim()
        ? commands.filter(
              (cmd) =>
                  cmd.trigger.toLowerCase().includes(query.toLowerCase()) ||
                  cmd.label.toLowerCase().includes(query.toLowerCase()) ||
                  cmd.description.toLowerCase().includes(query.toLowerCase())
          )
        : commands;

    // Reset state when opening
    useEffect(() => {
        if (commandPaletteOpen) {
            setQuery('');
            setSelectedIndex(0);
            // Defer focus so the DOM is painted
            setTimeout(() => searchRef.current?.focus(), 50);
        }
    }, [commandPaletteOpen]);

    // Keep selected item visible
    useEffect(() => {
        const list = listRef.current;
        if (!list) return;
        const item = list.children[selectedIndex] as HTMLElement | undefined;
        item?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    // Reset selection when filter changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const selectCommand = useCallback(
        (cmd: Command) => {
            setCommandPaletteOpen(false);
            if (copilotCollapsed) toggleCopilot();
            // Small delay so the sidebar expands before auto-fill fires
            setTimeout(() => {
                triggerAutoFill({ __commandTrigger: cmd.trigger });
            }, 150);
        },
        [copilotCollapsed, setCommandPaletteOpen, toggleCopilot, triggerAutoFill]
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const cmd = filtered[selectedIndex];
                if (cmd) selectCommand(cmd);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setCommandPaletteOpen(false);
            }
        },
        [filtered, selectedIndex, selectCommand, setCommandPaletteOpen]
    );

    if (!commandPaletteOpen) return null;

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) setCommandPaletteOpen(false);
            }}
        >
            {/* Modal */}
            <div
                className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl
                           bg-white dark:bg-[#1e242b]
                           border border-gray-200 dark:border-[#2d353e]"
                onKeyDown={handleKeyDown}
                role="dialog"
                aria-modal
                aria-label="AI Commands"
            >
                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-[#2d353e]">
                    <span className="text-violet-500 font-bold text-base select-none">⌘K</span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 mr-2 shrink-0">
                        AI Commands
                    </span>
                    <input
                        ref={searchRef}
                        type="text"
                        placeholder="Tìm lệnh..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-sm
                                   text-gray-800 dark:text-gray-100
                                   placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                    <button
                        onClick={() => setCommandPaletteOpen(false)}
                        className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                                   p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Đóng"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>

                {/* ── Command list ────────────────────────────────────────── */}
                <ul
                    ref={listRef}
                    className="overflow-y-auto"
                    style={{ maxHeight: '336px' }} /* ~6 items × 56px */
                    role="listbox"
                >
                    {filtered.length === 0 && (
                        <li className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                            Không tìm thấy lệnh phù hợp
                        </li>
                    )}
                    {filtered.map((cmd, idx) => {
                        const isSelected = idx === selectedIndex;
                        return (
                            <li
                                key={cmd.trigger}
                                role="option"
                                aria-selected={isSelected}
                                onMouseEnter={() => setSelectedIndex(idx)}
                                onClick={() => selectCommand(cmd)}
                                className={`
                                    flex items-start gap-3 px-4 py-3 cursor-pointer
                                    transition-colors duration-100 select-none
                                    ${
                                        isSelected
                                            ? 'bg-violet-50 dark:bg-violet-900/25'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                    }
                                `}
                            >
                                {/* Icon */}
                                <div
                                    className={`
                                        flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5
                                        ${isSelected ? 'bg-violet-100 dark:bg-violet-800/40' : 'bg-gray-100 dark:bg-gray-800'}
                                    `}
                                >
                                    <span
                                        className={`material-symbols-outlined text-[18px]
                                            ${isSelected ? 'text-violet-600 dark:text-violet-400' : 'text-gray-500 dark:text-gray-400'}`}
                                    >
                                        {cmd.icon}
                                    </span>
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <code
                                            className={`
                                                text-xs font-mono px-1.5 py-0.5 rounded
                                                ${
                                                    isSelected
                                                        ? 'bg-violet-100 dark:bg-violet-800/50 text-violet-700 dark:text-violet-300'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-violet-600 dark:text-violet-400'
                                                }
                                            `}
                                        >
                                            {cmd.trigger}
                                        </code>
                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                            {cmd.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                        {cmd.description}
                                    </p>
                                </div>

                                {/* Selected arrow */}
                                {isSelected && (
                                    <span className="material-symbols-outlined text-[16px] text-violet-500 mt-1 flex-shrink-0">
                                        keyboard_return
                                    </span>
                                )}
                            </li>
                        );
                    })}
                </ul>

                {/* ── Footer ─────────────────────────────────────────────── */}
                <div
                    className="flex items-center gap-4 px-4 py-2.5
                               border-t border-gray-100 dark:border-[#2d353e]
                               bg-gray-50 dark:bg-[#181d23]"
                >
                    {[
                        { key: '↑↓', label: 'điều hướng' },
                        { key: 'Enter', label: 'chọn' },
                        { key: 'Esc', label: 'đóng' },
                    ].map(({ key, label }) => (
                        <span key={key} className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                            <kbd
                                className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600
                                           bg-white dark:bg-gray-800 font-mono text-[11px] text-gray-600 dark:text-gray-300"
                            >
                                {key}
                            </kbd>
                            {label}
                        </span>
                    ))}
                    <span className="ml-auto text-xs text-gray-400 dark:text-gray-600">
                        {filtered.length} lệnh
                    </span>
                </div>
            </div>
        </div>
    );
}
