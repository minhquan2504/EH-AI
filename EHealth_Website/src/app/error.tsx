"use client";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0d1117] px-4">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-5">
                    <span className="material-symbols-outlined text-red-500 text-4xl">error</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Đã xảy ra lỗi
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    {error.message || "Có lỗi không mong muốn xảy ra. Vui lòng thử lại."}
                </p>
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={reset}
                        className="px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold transition-colors"
                    >
                        Thử lại
                    </button>
                    <a
                        href="/"
                        className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors"
                    >
                        Về trang chủ
                    </a>
                </div>
            </div>
        </div>
    );
}
