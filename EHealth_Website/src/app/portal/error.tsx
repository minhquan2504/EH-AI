"use client";

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
                </div>
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-2">Đã xảy ra lỗi</h2>
                <p className="text-sm text-[#687582] mb-5">{error.message || "Vui lòng thử lại hoặc liên hệ quản trị viên."}</p>
                <button onClick={reset} className="px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold transition-colors">
                    Thử lại
                </button>
            </div>
        </div>
    );
}
