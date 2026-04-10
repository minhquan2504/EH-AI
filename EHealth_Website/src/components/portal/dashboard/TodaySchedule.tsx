"use client";

import Link from "next/link";
import { UI_TEXT } from "@/constants/ui-text";
import { ROUTES } from "@/constants/routes";

interface ScheduleItem {
    id: string;
    time: string;
    title: string;
    location?: string;
    duration?: string;
    type?: string;
    status: string;
}

const STATUS_MAP: Record<string, { dot: string; text: string; label: string }> = {
    completed: { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", label: "Hoàn thành" },
    ongoing: { dot: "bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/30", text: "text-blue-600 dark:text-blue-400", label: "Đang diễn ra" },
    upcoming: { dot: "bg-gray-300 dark:bg-gray-600", text: "text-[#687582] dark:text-gray-500", label: "Sắp tới" },
};

const TYPE_ICONS: Record<string, string> = {
    meeting: "groups",
    examination: "stethoscope",
    break: "coffee",
    consultation: "forum",
};

export function TodaySchedule({ schedule }: { schedule: ScheduleItem[] }) {
    return (
        <div className="lg:col-span-1 bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <span className="material-symbols-outlined text-emerald-600 text-[20px]">event_note</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">
                            {UI_TEXT.DOCTOR.DASHBOARD.TODAY_SCHEDULE}
                        </h3>
                        <p className="text-xs text-[#687582] dark:text-gray-500">{schedule.length} hoạt động</p>
                    </div>
                </div>
                <Link href={ROUTES.PORTAL.DOCTOR.APPOINTMENTS} className="text-xs text-[#3C81C6] hover:underline font-medium">
                    {UI_TEXT.COMMON.VIEW_ALL}
                </Link>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto p-4 space-y-0">
                {schedule.map((item, idx) => {
                    const st = STATUS_MAP[item.status] || STATUS_MAP.upcoming;
                    const typeIcon = TYPE_ICONS[item.type || ""] || "event";
                    const isLast = idx === schedule.length - 1;

                    return (
                        <div key={item.id} className="flex gap-3 group">
                            {/* Timeline dot */}
                            <div className="flex flex-col items-center pt-1">
                                <div className={`w-2.5 h-2.5 rounded-full ${st.dot} ring-offset-white dark:ring-offset-[#1e242b] z-10`} />
                                {!isLast && <div className="w-[2px] flex-1 bg-[#e5e7eb] dark:bg-[#2d353e] mt-1" />}
                            </div>

                            {/* Content */}
                            <div className={`flex-1 ${!isLast ? "pb-4" : "pb-1"}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-[#121417] dark:text-white bg-[#f6f7f8] dark:bg-[#13191f] px-2 py-0.5 rounded">
                                        {item.time}
                                    </span>
                                    {item.status === "ongoing" && (
                                        <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded animate-pulse">
                                            Đang diễn ra
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className={`material-symbols-outlined text-[16px] mt-0.5 ${st.text}`}>{typeIcon}</span>
                                    <div>
                                        <p className={`text-sm font-medium ${item.status === "upcoming" ? "text-[#687582] dark:text-gray-500" : "text-[#121417] dark:text-white"}`}>
                                            {item.title}
                                        </p>
                                        {item.location && (
                                            <p className="text-[11px] text-[#687582] dark:text-gray-500 mt-0.5">
                                                📍 {item.location} • {item.duration}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default TodaySchedule;
