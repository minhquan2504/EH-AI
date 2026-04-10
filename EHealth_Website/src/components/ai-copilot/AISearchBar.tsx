'use client';

import {
    useState,
    useRef,
    useEffect,
    useCallback,
    type KeyboardEvent,
    type ChangeEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { useAICopilot } from '@/contexts/AICopilotContext';
import { aiService } from '@/services/aiService';

// ============================================
// Types
// ============================================

interface SearchResult {
    id: string;
    type: 'patient' | 'medicine' | 'appointment' | 'record';
    title: string;
    subtitle: string;
    href: string;
}

// ============================================
// Config
// ============================================

const TYPE_CONFIG: Record<
    SearchResult['type'],
    { icon: string; label: string; colorClass: string; badgeClass: string }
> = {
    patient: {
        icon: 'person',
        label: 'Bệnh nhân',
        colorClass: 'text-blue-500',
        badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    },
    medicine: {
        icon: 'medication',
        label: 'Thuốc',
        colorClass: 'text-green-500',
        badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    },
    appointment: {
        icon: 'calendar_month',
        label: 'Lịch hẹn',
        colorClass: 'text-violet-500',
        badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    },
    record: {
        icon: 'folder_open',
        label: 'Hồ sơ',
        colorClass: 'text-amber-500',
        badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    },
};

const TYPE_ORDER: SearchResult['type'][] = ['patient', 'appointment', 'medicine', 'record'];

// ============================================
// Mock fallback
// ============================================

function getMockResults(query: string): SearchResult[] {
    return [
        {
            id: '1',
            type: 'patient',
            title: `BN: ${query}`,
            subtitle: 'Tìm kiếm bệnh nhân...',
            href: '#',
        },
        {
            id: '2',
            type: 'appointment',
            title: `Lịch hẹn: ${query}`,
            subtitle: 'Tìm kiếm lịch hẹn...',
            href: '#',
        },
    ];
}

// ============================================
// Component
// ============================================

export default function AISearchBar() {
    const router = useRouter();
    const { role } = useAICopilot();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [highlightIdx, setHighlightIdx] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Search logic ──────────────────────────────────────────────────────

    const runSearch = useCallback(
        async (q: string) => {
            if (!q.trim()) {
                setResults([]);
                setIsOpen(false);
                return;
            }

            setIsLoading(true);
            setIsOpen(true);

            try {
                const res = await aiService.chat({
                    message: q,
                    context: { type: 'search', role },
                });

                // The AI chat endpoint returns a free-text message.
                // We try to extract structured results; if not possible,
                // fall back to mock data.
                const data = res.data as unknown as { results?: SearchResult[] };
                if (data && data.results) {
                    setResults(data.results);
                } else {
                    setResults(getMockResults(q));
                }
            } catch {
                setResults(getMockResults(q));
            } finally {
                setIsLoading(false);
                setHighlightIdx(0);
            }
        },
        [role]
    );

    // ── Debounce input ────────────────────────────────────────────────────

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            runSearch(val);
        }, 300);
    };

    // ── Select result ─────────────────────────────────────────────────────

    const handleSelect = useCallback(
        (result: SearchResult) => {
            setQuery('');
            setIsOpen(false);
            setResults([]);
            if (result.href && result.href !== '#') {
                router.push(result.href);
            }
        },
        [router]
    );

    // ── Keyboard navigation ───────────────────────────────────────────────

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen || results.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightIdx(i => Math.min(i + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIdx(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (results[highlightIdx]) handleSelect(results[highlightIdx]);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setIsOpen(false);
        }
    };

    // ── Close on outside click ────────────────────────────────────────────

    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    // ── Group results by type ─────────────────────────────────────────────

    const grouped = TYPE_ORDER.reduce<Record<string, SearchResult[]>>((acc, type) => {
        const items = results.filter(r => r.type === type);
        if (items.length > 0) acc[type] = items;
        return acc;
    }, {});

    // Flat ordered list for keyboard nav index
    const flatResults = TYPE_ORDER.flatMap(type => grouped[type] ?? []);

    // ── Render ─────────────────────────────────────────────────────────────

    return (
        <div className="relative w-72 hidden md:block">
            {/* Input */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {isLoading ? (
                        <span
                            className="material-symbols-outlined text-violet-400 animate-spin"
                            style={{ fontSize: 18 }}
                        >
                            progress_activity
                        </span>
                    ) : (
                        <span
                            className="material-symbols-outlined text-violet-400"
                            style={{ fontSize: 18 }}
                        >
                            smart_toy
                        </span>
                    )}
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (results.length > 0) setIsOpen(true);
                    }}
                    placeholder="🤖 Tìm kiếm thông minh..."
                    className="
                        block w-full pl-10 pr-3 py-2 text-sm
                        bg-[#f6f7f8] dark:bg-[#13191f]
                        border border-[#e5e7eb] dark:border-[#2d353e]
                        rounded-xl text-[#121417] dark:text-white
                        placeholder-[#94a3b8] dark:placeholder-[#687582]
                        focus:outline-none focus:ring-2 focus:ring-violet-400/40
                        focus:border-violet-400 dark:focus:border-violet-500
                        transition-colors
                    "
                />
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="
                        absolute top-full left-0 right-0 mt-1 z-50
                        bg-white dark:bg-[#1e242b]
                        border border-[#e5e7eb] dark:border-[#2d353e]
                        rounded-xl shadow-xl overflow-hidden
                        max-h-80 overflow-y-auto
                    "
                >
                    {isLoading && results.length === 0 ? (
                        <div className="px-4 py-3 text-xs text-[#687582] dark:text-gray-400 flex items-center gap-2">
                            <span
                                className="material-symbols-outlined text-violet-400 animate-spin"
                                style={{ fontSize: 14 }}
                            >
                                progress_activity
                            </span>
                            AI đang tìm kiếm...
                        </div>
                    ) : flatResults.length === 0 ? (
                        <div className="px-4 py-3 text-xs text-[#687582] dark:text-gray-400">
                            Không tìm thấy kết quả
                        </div>
                    ) : (
                        TYPE_ORDER.map(type => {
                            const items = grouped[type];
                            if (!items) return null;
                            const cfg = TYPE_CONFIG[type];

                            return (
                                <div key={type}>
                                    {/* Group header */}
                                    <div className="px-3 pt-2 pb-1 flex items-center gap-1.5">
                                        <span
                                            className={`material-symbols-outlined ${cfg.colorClass}`}
                                            style={{ fontSize: 13 }}
                                        >
                                            {cfg.icon}
                                        </span>
                                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#687582] dark:text-gray-400">
                                            {cfg.label}
                                        </span>
                                    </div>

                                    {/* Items */}
                                    {items.map(result => {
                                        const flatIdx = flatResults.indexOf(result);
                                        const isHighlighted = flatIdx === highlightIdx;

                                        return (
                                            <button
                                                key={result.id}
                                                onMouseEnter={() => setHighlightIdx(flatIdx)}
                                                onClick={() => handleSelect(result)}
                                                className={`
                                                    w-full flex items-center gap-2.5 px-3 py-2 text-left
                                                    transition-colors
                                                    ${isHighlighted
                                                        ? 'bg-violet-50 dark:bg-violet-950/30'
                                                        : 'hover:bg-gray-50 dark:hover:bg-white/5'
                                                    }
                                                `}
                                            >
                                                <span
                                                    className={`material-symbols-outlined flex-shrink-0 ${cfg.colorClass}`}
                                                    style={{ fontSize: 16 }}
                                                >
                                                    {cfg.icon}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-medium text-[#121417] dark:text-white truncate">
                                                            {result.title}
                                                        </span>
                                                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${cfg.badgeClass}`}>
                                                            {cfg.label}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-[#687582] dark:text-gray-400 truncate block">
                                                        {result.subtitle}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
