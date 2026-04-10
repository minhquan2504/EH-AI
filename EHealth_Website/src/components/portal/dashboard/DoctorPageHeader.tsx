"use client";

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

export function DoctorPageHeader() {
    return (
        <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-[#687582] dark:text-gray-500 mb-3">
                <span className="material-symbols-outlined text-[14px]">home</span>
                <span>Trang chủ</span>
                <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                <span className="text-[#121417] dark:text-white font-medium">Bảng điều khiển</span>
            </div>

            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-[#121417] dark:text-white">
                        {getGreeting()}, <span className="text-[#3C81C6]">BS. Nguyễn Văn Minh</span> 🩺
                    </h1>
                    <p className="text-[#687582] dark:text-gray-400 mt-0.5 text-sm">
                        Khoa Nội Tổng Quát — Phòng khám 302
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#687582] dark:text-gray-400">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                    <span>{getCurrentDate()}</span>
                </div>
            </div>
        </div>
    );
}

export default DoctorPageHeader;
