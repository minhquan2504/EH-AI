"use client";

import Link from "next/link";
import { SettingsDropdown } from "./settings-dropdown";

export function PatientHeader() {
    return (
        <header className="h-16 border-b border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#1e242b] flex items-center justify-between px-6 shrink-0">
            {/* Search */}
            <div className="flex items-center gap-3 flex-1">
                <div className="relative max-w-md w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#687582]" style={{ fontSize: "20px" }}>
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Tìm lịch hẹn, bác sĩ..."
                        className="w-full pl-10 pr-4 py-2 bg-[#f6f7f8] dark:bg-[#13191f] border border-transparent focus:border-[#3C81C6] rounded-lg text-sm text-[#121417] dark:text-white placeholder-[#687582] outline-none transition-colors"
                    />
                </div>
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-2">
                <button className="relative p-2 rounded-lg hover:bg-[#f6f7f8] dark:hover:bg-[#13191f] transition-colors">
                    <span className="material-symbols-outlined text-[#687582]" style={{ fontSize: "22px" }}>
                        notifications
                    </span>
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                <Link href="/booking"
                    className="flex items-center gap-2 px-3 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-lg text-sm font-medium transition-colors">
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                        calendar_month
                    </span>
                    <span className="hidden sm:inline">Đặt lịch khám</span>
                </Link>

                <SettingsDropdown />
            </div>
        </header>
    );
}
