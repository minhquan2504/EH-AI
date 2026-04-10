"use client";

import { UI_TEXT } from "@/constants/ui-text";

interface PageHeaderProps {
    title?: string;
    subtitle?: string;
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
}

function getCurrentDate(): string {
    const now = new Date();
    const dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const day = dayNames[now.getDay()];
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    return `${day}, ${dd}/${mm}/${yyyy}`;
}

export function PageHeader({
    subtitle = UI_TEXT.ADMIN.DASHBOARD.SUBTITLE,
}: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-[#687582] dark:text-gray-500">
                    <span className="material-symbols-outlined text-[14px]">home</span>
                    <span>Trang chủ</span>
                    <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Bảng điều khiển</span>
                </div>
                <span className="text-[#dde0e4] dark:text-[#2d353e]">|</span>
                <h1 className="text-lg font-black tracking-tight text-[#121417] dark:text-white">
                    {getGreeting()}, <span className="text-[#3C81C6]">Admin</span> 👋
                </h1>
                <span className="text-xs text-[#687582] dark:text-gray-400 hidden md:inline">{subtitle}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#687582] dark:text-gray-400">
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                <span>{getCurrentDate()}</span>
            </div>
        </div>
    );
}

export default PageHeader;
