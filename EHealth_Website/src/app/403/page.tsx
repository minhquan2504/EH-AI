"use client";

import { useRouter } from "next/navigation";

export default function ForbiddenPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0f2744] to-[#1a3a5c] flex items-center justify-center p-4">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-500/10 rounded-full blur-[120px]" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            <div className="relative z-10 text-center max-w-md">
                {/* Icon */}
                <div className="w-24 h-24 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-6 animate-pulse">
                    <span className="material-symbols-outlined text-red-400" style={{ fontSize: '48px' }}>
                        shield_lock
                    </span>
                </div>

                {/* Error code */}
                <h1 className="text-7xl font-bold text-white mb-3 tracking-tight">403</h1>

                {/* Title */}
                <h2 className="text-xl font-semibold text-[#94a3b8] mb-3">
                    Không có quyền truy cập
                </h2>

                {/* Description */}
                <p className="text-[#64748b] text-sm mb-8 leading-relaxed">
                    Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên
                    nếu bạn cho rằng đây là lỗi.
                </p>

                {/* Actions */}
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-[#94a3b8] hover:bg-white/[0.1] hover:text-white transition-all text-sm font-medium flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                        Quay lại
                    </button>
                    <button
                        onClick={() => router.push("/login")}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3C81C6] to-[#2563eb] text-white font-medium text-sm hover:shadow-lg hover:shadow-[#3C81C6]/25 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>login</span>
                        Đăng nhập
                    </button>
                </div>
            </div>
        </div>
    );
}
