"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ROLE_LABELS, ROLE_COLORS, type Role } from "@/constants/roles";
import { USER_STATUS } from "@/constants/status";
import type { User } from "@/types";
import * as userService from "@/services/userService";

const TABS = [
    { key: "overview", label: "Tổng quan", icon: "person" },
    { key: "professional", label: "Chuyên môn", icon: "workspace_premium" },
    { key: "schedule", label: "Lịch làm việc", icon: "calendar_month" },
    { key: "education", label: "Học vấn & KN", icon: "school" },
    { key: "activity", label: "Hoạt động", icon: "history" },
];

export default function UserDetailPage() {
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;

    const [user, setUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;
        setIsLoading(true);
        setError(null);
        userService.getUserById(userId)
            .then((data: any) => {
                const d = data?.data ?? data;
                if (d) {
                    setUser({
                        id: d.users_id ?? d.id ?? userId,
                        fullName: d.profile?.full_name ?? d.full_name ?? d.fullName ?? d.email ?? "",
                        email: d.email ?? "",
                        phone: d.phone ?? d.phone_number ?? "",
                        role: Array.isArray(d.roles) && d.roles.length > 0 ? d.roles[0].toLowerCase() : (d.role ?? "staff"),
                        status: (d.status ?? "ACTIVE") as User["status"],
                        avatar: d.profile?.avatar_url ?? d.avatar ?? "",
                        createdAt: d.created_at ?? d.createdAt ?? "",
                        gender: d.gender,
                        dob: d.dob ?? d.date_of_birth,
                        address: d.address,
                        phoneNumber: d.phone ?? d.phone_number,
                    } as unknown as User);
                } else {
                    setError("Không tìm thấy người dùng");
                }
            })
            .catch((err: any) => {
                setError(err?.message || "Lấy thông tin người dùng thất bại");
            })
            .finally(() => setIsLoading(false));
    }, [userId]);

    const handleLockToggle = async () => {
        if (!user) return;
        const isLocked = user.status === USER_STATUS.LOCKED;
        setActionLoading(isLocked ? "unlock" : "lock");
        try {
            if (isLocked) {
                await userService.unlockUser(user.id);
            } else {
                await userService.lockUser(user.id);
            }
            setUser((prev) => prev ? { ...prev, status: isLocked ? USER_STATUS.ACTIVE as User["status"] : USER_STATUS.LOCKED as User["status"] } : prev);
        } catch (err: any) {
            alert(err?.message || "Thao tác thất bại. Vui lòng thử lại.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleResetPassword = async () => {
        if (!user) return;
        if (!confirm("Reset mật khẩu về EHealth@123 cho người dùng này?")) return;
        setActionLoading("reset");
        try {
            await userService.adminResetPassword(user.id);
            alert("Đã reset mật khẩu thành công. Mật khẩu mới: EHealth@123");
        } catch (err: any) {
            alert(err?.message || "Reset mật khẩu thất bại.");
        } finally {
            setActionLoading(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#3C81C6] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[#687582]">Đang tải thông tin người dùng...</p>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">person_off</span>
                <p className="text-lg text-gray-500 mb-2">{error || "Không tìm thấy người dùng"}</p>
                <button
                    onClick={() => router.back()}
                    className="px-5 py-2.5 bg-[#3C81C6] text-white rounded-xl text-sm font-bold hover:bg-[#2a6da8] transition-colors"
                >
                    Quay lại
                </button>
            </div>
        );
    }

    const roleColor = ROLE_COLORS[user.role as Role] || { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" };
    const isActive = user.status === USER_STATUS.ACTIVE;

    return (
        <>
            {/* Breadcrumb + Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/admin/users" className="hover:text-[#3C81C6] transition-colors">
                        Người dùng
                    </Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">{user.fullName}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={handleResetPassword}
                        disabled={actionLoading === "reset"}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-amber-200 dark:shadow-none disabled:opacity-50"
                    >
                        {actionLoading === "reset" ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[18px]">lock_reset</span>}
                        Reset mật khẩu
                    </button>
                    <button
                        onClick={handleLockToggle}
                        disabled={actionLoading === "lock" || actionLoading === "unlock"}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${user.status === USER_STATUS.LOCKED ? "bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-200 dark:shadow-none" : "bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-200 dark:shadow-none"}`}
                    >
                        {(actionLoading === "lock" || actionLoading === "unlock") ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[18px]">{user.status === USER_STATUS.LOCKED ? "lock_open" : "lock"}</span>}
                        {user.status === USER_STATUS.LOCKED ? "Mở khóa" : "Khóa tài khoản"}
                    </button>
                    <button
                        onClick={() => router.push(`/admin/users/${userId}/edit`)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#3C81C6] text-white rounded-xl text-sm font-bold hover:bg-[#2a6da8] transition-all shadow-md shadow-blue-200 dark:shadow-none"
                    >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Chỉnh sửa
                    </button>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Quay lại
                    </button>
                </div>
            </div>

            {/* Profile Header Card */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm overflow-hidden">
                {/* Banner gradient */}
                <div className="h-32 bg-gradient-to-r from-[#3C81C6] via-[#60a5fa] to-[#93c5fd] relative">
                    <div className="absolute -bottom-12 left-8">
                        <div className="w-24 h-24 rounded-2xl bg-white dark:bg-[#1e242b] border-4 border-white dark:border-[#1e242b] shadow-lg flex items-center justify-center">
                            {user.avatar ? (
                                <div className="w-full h-full rounded-xl bg-cover bg-center" style={{ backgroundImage: `url('${user.avatar}')` }} />
                            ) : (
                                <span className="material-symbols-outlined text-4xl text-[#3C81C6]">person</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="pt-16 pb-6 px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-[#121417] dark:text-white">{user.fullName}</h1>
                            <p className="text-[#687582] dark:text-gray-400 mt-1">{user.email}</p>
                            <div className="flex items-center gap-3 mt-3">
                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${roleColor.bg} ${roleColor.text}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${roleColor.dot} mr-1.5`} />
                                    {ROLE_LABELS[user.role as Role] || user.role}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${isActive ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`} />
                                    {isActive ? "Đang hoạt động" : "Đã khóa"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="px-8 border-t border-[#dde0e4] dark:border-[#2d353e]">
                    <div className="flex gap-1 -mb-px overflow-x-auto">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                                    activeTab === tab.key
                                        ? "border-[#3C81C6] text-[#3C81C6]"
                                        : "border-transparent text-[#687582] hover:text-[#3C81C6] hover:border-gray-300"
                                }`}
                            >
                                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && <OverviewTab user={user} roleColor={roleColor} isActive={isActive} />}
            {activeTab === "professional" && <ProfessionalTab />}
            {activeTab === "schedule" && <ScheduleTab />}
            {activeTab === "education" && <EducationTab />}
            {activeTab === "activity" && <ActivityTab />}
        </>
    );
}

/* ─── Tab: Tổng quan ─── */
function OverviewTab({ user, roleColor, isActive }: { user: User; roleColor: { bg: string; text: string; dot: string }; isActive: boolean }) {
    const u = user as any;
    const genderLabel = u.gender === "MALE" ? "Nam" : u.gender === "FEMALE" ? "Nữ" : (u.gender || "—");
    const dobFormatted = u.dob ? new Date(u.dob).toLocaleDateString("vi-VN") : (u.date_of_birth ? new Date(u.date_of_birth).toLocaleDateString("vi-VN") : "—");
    const phoneDisplay = u.phoneNumber ?? u.phone ?? u.phone_number ?? "—";
    const createdAtFormatted = user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "—";
    const lastAccessFormatted = (user as any).lastAccess ? new Date((user as any).lastAccess).toLocaleDateString("vi-VN") : "—";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">badge</span>
                    Thông tin cá nhân
                </h2>
                <div className="space-y-4">
                    <InfoRow label="Họ và tên" value={user.fullName || "—"} icon="person" />
                    <InfoRow label="Email" value={user.email || "—"} icon="email" />
                    <InfoRow label="Vai trò" value={ROLE_LABELS[user.role as Role] || user.role || "—"} icon="shield_person" />
                    <InfoRow label="Số điện thoại" value={phoneDisplay} icon="phone" />
                    <InfoRow label="Giới tính" value={genderLabel} icon="wc" />
                    <InfoRow label="Ngày sinh" value={dobFormatted} icon="cake" />
                    {u.address && <InfoRow label="Địa chỉ" value={u.address} icon="location_on" />}
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">manage_accounts</span>
                    Thông tin tài khoản
                </h2>
                <div className="space-y-4">
                    <InfoRow label="Mã người dùng" value={user.id || "—"} icon="fingerprint" />
                    <InfoRow label="Ngày tạo tài khoản" value={createdAtFormatted} icon="event" />
                    <InfoRow label="Truy cập cuối" value={lastAccessFormatted} icon="schedule" />
                    <InfoRow label="Trạng thái" value={isActive ? "Đang hoạt động" : (user.status === "LOCKED" ? "Đã khóa" : user.status || "—")} icon="toggle_on" />
                    {u.department && <InfoRow label="Khoa / Phòng ban" value={u.department} icon="domain" />}
                    {u.facility && <InfoRow label="Chi nhánh" value={u.facility} icon="location_city" />}
                </div>
            </div>
        </div>
    );
}

/* ─── Tab: Chuyên môn ─── */
function ProfessionalTab() {
    const certifications = [
        { name: "Chứng chỉ hành nghề y", number: "CCHN-2020-001234", issued: "15/03/2020", expiry: "15/03/2025", status: "active" },
        { name: "Chứng chỉ cấp cứu nâng cao (ACLS)", number: "ACLS-2022-056", issued: "10/08/2022", expiry: "10/08/2025", status: "active" },
        { name: "Chứng chỉ siêu âm tim", number: "SAT-2021-089", issued: "20/01/2021", expiry: "20/01/2024", status: "expired" },
    ];

    return (
        <div className="space-y-6">
            {/* Chuyên khoa */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">stethoscope</span>
                    Chuyên khoa & Kỹ năng
                </h2>
                <div className="flex flex-wrap gap-2">
                    {["Nội tổng quát", "Tim mạch", "Siêu âm", "Nội soi"].map((skill) => (
                        <span key={skill} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-[#3C81C6]/10 text-[#3C81C6]">
                            {skill}
                        </span>
                    ))}
                </div>
            </div>

            {/* Giấy phép & Chứng chỉ */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">verified</span>
                    Giấy phép & Chứng chỉ
                </h2>
                <div className="space-y-3">
                    {certifications.map((cert, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cert.status === "active" ? "bg-green-100 dark:bg-green-900/20 text-green-600" : "bg-red-100 dark:bg-red-900/20 text-red-600"}`}>
                                    <span className="material-symbols-outlined text-[20px]">{cert.status === "active" ? "verified" : "gpp_bad"}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[#121417] dark:text-white">{cert.name}</p>
                                    <p className="text-xs text-[#687582] dark:text-gray-400">Số: {cert.number} • Cấp: {cert.issued}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cert.status === "active" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`}>
                                    {cert.status === "active" ? "Còn hiệu lực" : "Hết hạn"}
                                </span>
                                <p className="text-xs text-[#687582] mt-1">HSD: {cert.expiry}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cơ sở y tế */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">domain</span>
                    Cơ sở y tế & Phân công
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoRow label="Cơ sở làm việc" value="E-Health Quận 1" icon="location_city" />
                    <InfoRow label="Khoa / Phòng ban" value="Khoa Nội Tổng Quát" icon="domain" />
                    <InfoRow label="Chức vụ" value="Bác sĩ điều trị" icon="work" />
                    <InfoRow label="Ngày vào làm" value="01/06/2020" icon="event" />
                </div>
            </div>
        </div>
    );
}

/* ─── Tab: Lịch làm việc ─── */
function ScheduleTab() {
    const days = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    const shifts = [
        { name: "Ca sáng", time: "7:00 - 12:00", color: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800" },
        { name: "Ca chiều", time: "13:00 - 18:00", color: "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
        { name: "Ca đêm", time: "19:00 - 7:00", color: "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800" },
    ];
    // Mock: which shifts are assigned on which days
    const assignments: Record<string, number[]> = {
        "T2": [0], "T3": [0], "T4": [1], "T5": [1], "T6": [0], "T7": [], "CN": [],
    };

    return (
        <div className="space-y-6">
            {/* Legend */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">calendar_month</span>
                    Lịch làm việc mặc định
                </h2>
                <div className="flex gap-4 mb-6">
                    {shifts.map((shift) => (
                        <span key={shift.name} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${shift.color}`}>
                            {shift.name} <span className="opacity-70">({shift.time})</span>
                        </span>
                    ))}
                </div>

                {/* Schedule Grid */}
                <div className="overflow-x-auto">
                    <div className="grid grid-cols-7 gap-2 min-w-[600px]">
                        {days.map((day) => (
                            <div key={day} className="text-center">
                                <div className="text-xs font-bold text-[#687582] dark:text-gray-400 uppercase mb-2 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    {day}
                                </div>
                                <div className="space-y-1.5">
                                    {shifts.map((shift, idx) => {
                                        const isAssigned = assignments[day]?.includes(idx);
                                        return (
                                            <div
                                                key={idx}
                                                className={`py-2.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                                                    isAssigned
                                                        ? shift.color
                                                        : "border-dashed border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600"
                                                }`}
                                            >
                                                {isAssigned ? shift.name.replace("Ca ", "") : "—"}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                        <span className="material-symbols-outlined">schedule</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Tổng giờ/tuần</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">40h</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                        <span className="material-symbols-outlined">event_available</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Ngày làm/tuần</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">5 ngày</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600">
                        <span className="material-symbols-outlined">event_busy</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Ngày phép còn lại</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">8 ngày</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Tab: Học vấn & KN ─── */
function EducationTab() {
    const education = [
        { degree: "Tiến sĩ Y khoa", school: "Đại học Y Dược TP.HCM", year: "2018 - 2022", icon: "school" },
        { degree: "Thạc sĩ Y học", school: "Đại học Y Hà Nội", year: "2015 - 2018", icon: "school" },
        { degree: "Bác sĩ Đa khoa", school: "Đại học Y Dược TP.HCM", year: "2009 - 2015", icon: "school" },
    ];
    const experience = [
        { position: "Bác sĩ điều trị — Khoa Nội", company: "E-Health Quận 1", period: "06/2020 - Hiện tại", current: true },
        { position: "Bác sĩ nội trú", company: "Bệnh viện Chợ Rẫy", period: "01/2018 - 05/2020", current: false },
        { position: "Bác sĩ thực tập", company: "Bệnh viện Đại học Y Dược", period: "06/2015 - 12/2017", current: false },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Học vấn */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">school</span>
                    Học vấn
                </h2>
                <div className="relative space-y-0">
                    {education.map((edu, i) => (
                        <div key={i} className="relative pl-8 pb-6 last:pb-0">
                            {/* Timeline line */}
                            {i < education.length - 1 && (
                                <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                            )}
                            {/* Timeline dot */}
                            <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-[#3C81C6]/10 flex items-center justify-center">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#3C81C6]" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[#121417] dark:text-white">{edu.degree}</p>
                                <p className="text-sm text-[#687582] dark:text-gray-400">{edu.school}</p>
                                <p className="text-xs text-[#687582] dark:text-gray-500 mt-0.5">{edu.year}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Kinh nghiệm */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">work_history</span>
                    Kinh nghiệm làm việc
                </h2>
                <div className="relative space-y-0">
                    {experience.map((exp, i) => (
                        <div key={i} className="relative pl-8 pb-6 last:pb-0">
                            {i < experience.length - 1 && (
                                <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                            )}
                            <div className="absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: exp.current ? "rgba(60,129,198,0.1)" : "rgba(107,114,128,0.1)" }}>
                                <div className={`w-2.5 h-2.5 rounded-full ${exp.current ? "bg-[#3C81C6]" : "bg-gray-400"}`} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-[#121417] dark:text-white">{exp.position}</p>
                                    {exp.current && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Hiện tại</span>
                                    )}
                                </div>
                                <p className="text-sm text-[#687582] dark:text-gray-400">{exp.company}</p>
                                <p className="text-xs text-[#687582] dark:text-gray-500 mt-0.5">{exp.period}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ─── Tab: Hoạt động ─── */
function ActivityTab() {
    const activities = [
        { action: "Đăng nhập hệ thống", time: "Hôm nay, 08:30", icon: "login", color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600" },
        { action: "Cập nhật hồ sơ bệnh nhân #BN12345", time: "Hôm qua, 15:20", icon: "edit_note", color: "bg-green-50 dark:bg-green-900/20 text-green-600" },
        { action: "Tạo lịch hẹn khám mới", time: "Hôm qua, 10:15", icon: "calendar_add_on", color: "bg-purple-50 dark:bg-purple-900/20 text-purple-600" },
        { action: "Xuất báo cáo tháng 02/2026", time: "01/03/2026, 09:00", icon: "download", color: "bg-orange-50 dark:bg-orange-900/20 text-orange-600" },
        { action: "Đổi mật khẩu tài khoản", time: "25/02/2026, 14:30", icon: "lock_reset", color: "bg-red-50 dark:bg-red-900/20 text-red-600" },
        { action: "Cập nhật thông tin cá nhân", time: "20/02/2026, 11:00", icon: "person", color: "bg-teal-50 dark:bg-teal-900/20 text-teal-600" },
        { action: "Kê đơn thuốc cho bệnh nhân #BN12300", time: "18/02/2026, 16:45", icon: "medication", color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" },
        { action: "Hoàn thành ca trực chiều", time: "18/02/2026, 18:00", icon: "check_circle", color: "bg-green-50 dark:bg-green-900/20 text-green-600" },
    ];

    return (
        <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3C81C6]">history</span>
                Hoạt động gần đây
            </h2>
            <div className="space-y-2">
                {activities.map((activity, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${activity.color}`}>
                            <span className="material-symbols-outlined text-[18px]">{activity.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#121417] dark:text-white">{activity.action}</p>
                            <p className="text-xs text-[#687582] dark:text-gray-400">{activity.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Shared component ─── */
function InfoRow({ label, value, icon }: { label: string; value: string; icon: string }) {
    return (
        <div className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <span className="material-symbols-outlined text-[18px] text-[#687582]">{icon}</span>
            <div className="flex-1">
                <p className="text-xs text-[#687582] dark:text-gray-400">{label}</p>
                <p className="text-sm font-medium text-[#121417] dark:text-white">{value}</p>
            </div>
        </div>
    );
}
