"use client";

import { useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { UI_TEXT } from "@/constants/ui-text";

// Types
interface Activity {
    id: string;
    time: string;
    userName: string;
    userAvatar?: string;
    action: string;
    status: "SUCCESS" | "PENDING" | "FAILED";
}

interface RecentActivitiesProps {
    activities: Activity[];
}

const STATUS_CONFIG = {
    SUCCESS: { className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400", label: "Thành công", icon: "check_circle" },
    PENDING: { className: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400", label: "Đang xử lý", icon: "schedule" },
    FAILED: { className: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400", label: "Thất bại", icon: "cancel" },
};

type FilterKey = "ALL" | "SUCCESS" | "PENDING" | "FAILED";

const FILTER_TABS: { key: FilterKey; label: string }[] = [
    { key: "ALL", label: "Tất cả" },
    { key: "SUCCESS", label: "Thành công" },
    { key: "PENDING", label: "Đang xử lý" },
    { key: "FAILED", label: "Thất bại" },
];

export function RecentActivities({ activities }: RecentActivitiesProps) {
    const [filter, setFilter] = useState<FilterKey>("ALL");

    const filtered = filter === "ALL" ? activities : activities.filter((a) => a.status === filter);

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <span className="material-symbols-outlined text-purple-600 text-[20px]">history</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">
                            {UI_TEXT.ADMIN.DASHBOARD.RECENT_ACTIVITIES}
                        </h3>
                        <p className="text-xs text-[#687582] dark:text-gray-500">{activities.length} hoạt động gần đây</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Filter tabs */}
                    <div className="flex bg-[#f6f7f8] dark:bg-[#13191f] rounded-lg p-[3px]">
                        {FILTER_TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key)}
                                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${filter === tab.key
                                    ? "bg-white dark:bg-[#1e242b] text-[#121417] dark:text-white shadow-sm"
                                    : "text-[#687582] dark:text-gray-500 hover:text-[#121417] dark:hover:text-white"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <Link
                        href={ROUTES.ADMIN.ACTIVITY_LOGS}
                        className="text-xs text-[#3C81C6] font-medium hover:underline"
                    >
                        {UI_TEXT.COMMON.VIEW_ALL}
                    </Link>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-[#f9fafb] dark:bg-[#13191f]">
                        <tr>
                            {["Thời gian", "Người thực hiện", "Hành động", "Trạng thái"].map((h) => (
                                <th key={h} className="py-2.5 px-5 text-[10px] font-semibold text-[#687582] dark:text-gray-500 uppercase tracking-wider">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e]">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-8 text-center text-sm text-[#687582] dark:text-gray-500">
                                    Không có hoạt động nào
                                </td>
                            </tr>
                        ) : (
                            filtered.map((activity) => {
                                const cfg = STATUS_CONFIG[activity.status];
                                return (
                                    <tr key={activity.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="py-3 px-5 text-xs text-[#687582] dark:text-gray-400 whitespace-nowrap">
                                            {activity.time}
                                        </td>
                                        <td className="py-3 px-5">
                                            <div className="flex items-center gap-2.5">
                                                {activity.userAvatar ? (
                                                    <div
                                                        className="w-7 h-7 rounded-full bg-cover bg-center flex-shrink-0"
                                                        style={{ backgroundImage: `url('${activity.userAvatar}')` }}
                                                    />
                                                ) : (
                                                    <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 font-bold text-[10px] flex-shrink-0">
                                                        SYS
                                                    </div>
                                                )}
                                                <span className="text-xs font-medium text-[#121417] dark:text-white whitespace-nowrap">
                                                    {activity.userName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-5 text-xs text-[#121417] dark:text-gray-300 max-w-xs truncate">
                                            {activity.action}
                                        </td>
                                        <td className="py-3 px-5">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${cfg.className}`}>
                                                <span className="material-symbols-outlined text-[12px]">{cfg.icon}</span>
                                                {cfg.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default RecentActivities;
