"use client";

import { UI_TEXT } from "@/constants/ui-text";

interface Announcement {
    id: string;
    type: string;
    title: string;
    content: string;
    time: string;
    department: string;
}

const TYPE_STYLES: Record<string, { bg: string; border: string; iconBg: string; iconColor: string; icon: string }> = {
    urgent: {
        bg: "bg-red-50/50 dark:bg-red-900/10",
        border: "border-red-200 dark:border-red-800/30",
        iconBg: "bg-red-100 dark:bg-red-900/30",
        iconColor: "text-red-500",
        icon: "priority_high",
    },
    info: {
        bg: "bg-blue-50/50 dark:bg-blue-900/10",
        border: "border-blue-200 dark:border-blue-800/30",
        iconBg: "bg-blue-100 dark:bg-blue-900/30",
        iconColor: "text-blue-500",
        icon: "info",
    },
};

export function HospitalAnnouncements({ announcements }: { announcements: Announcement[] }) {
    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <span className="material-symbols-outlined text-red-500 text-[20px]">campaign</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">
                            {UI_TEXT.DOCTOR.DASHBOARD.HOSPITAL_ANNOUNCEMENTS}
                        </h3>
                        <p className="text-xs text-[#687582] dark:text-gray-500">{announcements.length} thông báo mới</p>
                    </div>
                </div>
                <button className="text-xs text-[#687582] dark:text-gray-400 hover:text-[#3C81C6] font-medium transition-colors">
                    Đánh dấu đã đọc
                </button>
            </div>

            {/* Cards */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {announcements.map((ann) => {
                    const style = TYPE_STYLES[ann.type] || TYPE_STYLES.info;
                    return (
                        <div key={ann.id} className={`p-4 rounded-xl border ${style.border} ${style.bg} hover:shadow-md transition-shadow cursor-pointer`}>
                            <div className="flex items-start gap-3">
                                <div className={`p-1.5 rounded-lg ${style.iconBg} flex-shrink-0`}>
                                    <span className={`material-symbols-outlined text-[18px] ${style.iconColor}`}>{style.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-[#121417] dark:text-white mb-1">{ann.title}</h4>
                                    <p className="text-xs text-[#687582] dark:text-gray-400 line-clamp-2">{ann.content}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[10px] text-[#687582] dark:text-gray-500">{ann.time}</span>
                                        <span className="text-[10px] text-[#687582] dark:text-gray-500">•</span>
                                        <span className="text-[10px] font-medium text-[#3C81C6]">{ann.department}</span>
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

export default HospitalAnnouncements;
