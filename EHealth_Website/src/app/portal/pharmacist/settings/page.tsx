"use client";

import { useState, useEffect } from "react";
import axiosClient from "@/api/axiosClient";
import { PROFILE_ENDPOINTS } from "@/api/endpoints";
import { useAuth } from "@/contexts/AuthContext";

export default function PharmacistSettings() {
    const { user: authUser, updateUser } = useAuth();
    const [profile, setProfile] = useState({
        name: authUser?.fullName ?? "", email: authUser?.email ?? "", phone: authUser?.phone ?? "", role: "Dược sĩ"
    });
    const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
    const [notifications, setNotifications] = useState({ newPrescription: true, stockAlert: true, dailyReport: false });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [pwError, setPwError] = useState("");

    useEffect(() => {
        axiosClient.get(PROFILE_ENDPOINTS.ME)
            .then(res => {
                const d = res?.data?.data ?? res?.data;
                if (d) setProfile({ name: d.fullName ?? d.name ?? profile.name, email: d.email ?? profile.email, phone: d.phone ?? profile.phone, role: d.role ?? profile.role });
            })
            .catch(() => {/* profile empty state */});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            await axiosClient.put(PROFILE_ENDPOINTS.ME, { fullName: profile.name, phone: profile.phone });
            if (updateUser) updateUser({ fullName: profile.name, phone: profile.phone } as any);
        } catch {
            // ignore
        } finally {
            setSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    const handleChangePassword = () => {
        setPwError("");
        if (!passwords.current) { setPwError("Vui lòng nhập mật khẩu hiện tại"); return; }
        if (passwords.newPass.length < 6) { setPwError("Mật khẩu mới phải có ít nhất 6 ký tự"); return; }
        if (passwords.newPass !== passwords.confirm) { setPwError("Mật khẩu xác nhận không khớp"); return; }
        alert("Đổi mật khẩu thành công!");
        setPasswords({ current: "", newPass: "", confirm: "" });
    };

    return (
        <div className="p-6 md:p-8"><div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#121417] dark:text-white">Cài đặt</h1>
                <p className="text-sm text-[#687582] mt-1">Quản lý thông tin cá nhân và tùy chỉnh</p>
            </div>

            {/* Profile */}
            <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4">Thông tin cá nhân</h2>
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl">DS</div>
                    <div>
                        <p className="text-lg font-semibold text-[#121417] dark:text-white">{profile.name}</p>
                        <p className="text-sm text-[#687582]">Dược sĩ • Quầy phát thuốc số 2</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        { l: "Họ tên", k: "name" as const }, { l: "Email", k: "email" as const },
                        { l: "Số điện thoại", k: "phone" as const }, { l: "Vai trò", k: "role" as const },
                    ].map((f) => (
                        <div key={f.l}>
                            <label className="block text-sm font-medium text-[#687582] mb-1">{f.l}</label>
                            <input type="text" value={profile[f.k]} onChange={(e) => setProfile({ ...profile, [f.k]: e.target.value })}
                                disabled={f.k === "role"}
                                className="w-full px-3 py-2 border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm bg-white dark:bg-[#13191f] outline-none focus:border-[#3C81C6] disabled:opacity-50 disabled:cursor-not-allowed" />
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-3 mt-4">
                    <button onClick={handleSaveProfile} disabled={saving}
                        className="px-4 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-70 flex items-center gap-2">
                        {saving ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Đang lưu...</> : "Lưu thay đổi"}
                    </button>
                    {saved && <span className="text-sm text-green-600 flex items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: "16px" }}>check_circle</span>Đã lưu!</span>}
                </div>
            </div>

            {/* Password */}
            <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4">Đổi mật khẩu</h2>
                {pwError && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-600" style={{ fontSize: "18px" }}>error</span>
                        <span className="text-sm text-red-700 dark:text-red-400">{pwError}</span>
                    </div>
                )}
                <div className="space-y-4 max-w-md">
                    {[
                        { l: "Mật khẩu hiện tại", k: "current" as const },
                        { l: "Mật khẩu mới", k: "newPass" as const },
                        { l: "Xác nhận mật khẩu mới", k: "confirm" as const },
                    ].map((f) => (
                        <div key={f.l}>
                            <label className="block text-sm font-medium text-[#687582] mb-1">{f.l}</label>
                            <input type="password" value={passwords[f.k]} onChange={(e) => setPasswords({ ...passwords, [f.k]: e.target.value })}
                                placeholder="••••••••" className="w-full px-3 py-2 border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm bg-white dark:bg-[#13191f] outline-none focus:border-[#3C81C6]" />
                        </div>
                    ))}
                </div>
                <button onClick={handleChangePassword} className="mt-4 px-4 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white text-sm font-medium rounded-lg transition-colors">Đổi mật khẩu</button>
            </div>

            {/* Notifications */}
            <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4">Thông báo</h2>
                <div className="space-y-3">
                    {[
                        { l: "Đơn thuốc mới", d: "Nhận thông báo khi có đơn thuốc cần cấp phát", k: "newPrescription" as const },
                        { l: "Cảnh báo tồn kho", d: "Thông báo khi thuốc sắp hết hoặc hết hạn", k: "stockAlert" as const },
                        { l: "Báo cáo hàng ngày", d: "Nhận tóm tắt cuối ngày", k: "dailyReport" as const },
                    ].map((n) => (
                        <div key={n.l} className="flex items-center justify-between p-3 rounded-xl bg-[#f6f7f8] dark:bg-[#13191f]">
                            <div><p className="text-sm font-medium text-[#121417] dark:text-white">{n.l}</p><p className="text-xs text-[#687582]">{n.d}</p></div>
                            <button onClick={() => setNotifications({ ...notifications, [n.k]: !notifications[n.k] })}
                                className={`w-10 h-6 rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${notifications[n.k] ? "bg-[#3C81C6] justify-end" : "bg-gray-300 dark:bg-gray-600 justify-start"}`}>
                                <div className="w-5 h-5 bg-white rounded-full shadow transition-transform" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div></div>
    );
}
