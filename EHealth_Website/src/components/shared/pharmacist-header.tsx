"use client";

import { SettingsDropdown } from "./settings-dropdown";
import AIStatusBadge from '@/components/ai-copilot/AIStatusBadge';
import AISearchBar from '@/components/ai-copilot/AISearchBar';
import AIGamificationBadge from '@/components/ai-copilot/AIGamificationBadge';

export function PharmacistHeader() {
    return (
        <header className="h-16 border-b border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#1e242b] flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-3 flex-1">
                <AISearchBar />
            </div>
            <div className="flex items-center gap-2">
                <AIGamificationBadge />
                <AIStatusBadge />
                <button className="relative p-2 rounded-lg hover:bg-[#f6f7f8] dark:hover:bg-[#13191f] transition-colors">
                    <span className="material-symbols-outlined text-[#687582]" style={{ fontSize: "22px" }}>notifications</span>
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </button>
                <SettingsDropdown />
            </div>
        </header>
    );
}
