"use client";

import { useState } from "react";

interface ResultItem {
    test: string;
    value: string;
    status: "normal" | "high" | "low";
    explanation: string;
}

const MOCK_RESULTS: ResultItem[] = [
    {
        test: "Glucose",
        value: "7.2 mmol/L",
        status: "high",
        explanation: "Đường huyết cao hơn bình thường (bình thường: 3.9-5.5 mmol/L). Đây là mức tiền đái tháo đường. Gợi ý: Hạn chế đường, tinh bột. Tái khám sau 3 tháng.",
    },
    {
        test: "HbA1c",
        value: "6.8%",
        status: "high",
        explanation: "Chỉ số đường huyết trung bình 3 tháng. Mức 6.8% cho thấy tiền đái tháo đường (bình thường: <5.7%). Cần kiểm soát chế độ ăn.",
    },
    {
        test: "Cholesterol",
        value: "5.5 mmol/L",
        status: "high",
        explanation: "Cholesterol cao hơn mức khuyến cáo (<5.0). Nên hạn chế mỡ động vật, tăng rau xanh, tập thể dục.",
    },
    {
        test: "Huyết áp",
        value: "150/95 mmHg",
        status: "high",
        explanation: "Huyết áp cao (bình thường: <140/90). Uống thuốc đều đặn và giảm muối trong khẩu phần ăn.",
    },
    {
        test: "Creatinine",
        value: "0.9 mg/dL",
        status: "normal",
        explanation: "Chức năng thận bình thường. Tiếp tục duy trì.",
    },
];

const STATUS_CONFIG = {
    normal: {
        label: "Bình thường",
        badgeClass: "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20",
        dotClass: "bg-green-500",
        icon: "check_circle",
        iconClass: "text-green-500",
    },
    high: {
        label: "Cao",
        badgeClass: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20",
        dotClass: "bg-red-500",
        icon: "arrow_upward",
        iconClass: "text-red-500",
    },
    low: {
        label: "Thấp",
        badgeClass: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
        dotClass: "bg-amber-500",
        icon: "arrow_downward",
        iconClass: "text-amber-500",
    },
};

export function AIResultExplainer() {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const abnormalCount = MOCK_RESULTS.filter(r => r.status !== "normal").length;

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] overflow-hidden shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#3C81C6]/5 to-indigo-500/5 border-b border-[#e5e7eb] dark:border-[#2d353e]">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3C81C6] to-indigo-600 flex items-center justify-center shadow-md shadow-[#3C81C6]/20">
                        <span className="material-symbols-outlined text-white" style={{ fontSize: "18px" }}>biotech</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-1.5">
                            AI Giải thích kết quả xét nghiệm
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#3C81C6] text-white rounded-md">AI</span>
                        </h3>
                        <p className="text-xs text-[#687582]">
                            {abnormalCount > 0
                                ? `${abnormalCount} chỉ số cần chú ý — được giải thích bằng ngôn ngữ đơn giản`
                                : "Tất cả chỉ số trong giới hạn bình thường"}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setDismissed(true)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Đóng"
                >
                    <span className="material-symbols-outlined text-[#687582]" style={{ fontSize: "18px" }}>close</span>
                </button>
            </div>

            {/* Results list */}
            <div className="divide-y divide-[#f3f4f6] dark:divide-[#2d353e]">
                {MOCK_RESULTS.map((result, idx) => {
                    const cfg = STATUS_CONFIG[result.status];
                    const isExpanded = expandedIndex === idx;

                    return (
                        <div
                            key={idx}
                            className={`transition-all ${isExpanded ? "bg-[#f8f9ff] dark:bg-[#13191f]" : "hover:bg-gray-50/50 dark:hover:bg-[#191f26]/50"}`}
                        >
                            <button
                                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                                className="w-full flex items-center gap-4 px-5 py-3.5 text-left"
                            >
                                {/* Status indicator */}
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dotClass}`} />

                                {/* Test name */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[#121417] dark:text-white">{result.test}</p>
                                    <p className="text-xs text-[#687582] mt-0.5 flex items-center gap-1">
                                        <span>📊</span>
                                        <span>{result.value}</span>
                                    </p>
                                </div>

                                {/* Status badge */}
                                <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.badgeClass}`}>
                                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>{cfg.icon}</span>
                                    {cfg.label}
                                </span>

                                {/* Expand arrow */}
                                <span
                                    className={`material-symbols-outlined text-[#687582] flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                    style={{ fontSize: "18px" }}
                                >
                                    expand_more
                                </span>
                            </button>

                            {/* Expanded explanation */}
                            {isExpanded && (
                                <div className="px-5 pb-4">
                                    <div className="flex items-start gap-2 p-3.5 rounded-xl bg-[#3C81C6]/5 dark:bg-[#3C81C6]/10 border border-[#3C81C6]/10 dark:border-[#3C81C6]/20">
                                        <span className="text-base flex-shrink-0">💡</span>
                                        <p className="text-sm text-[#374151] dark:text-[#d1d5db] leading-relaxed">
                                            {result.explanation}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer note */}
            <div className="px-5 py-3 bg-[#f6f7f8] dark:bg-[#13191f] border-t border-[#e5e7eb] dark:border-[#2d353e]">
                <p className="text-[11px] text-[#687582] flex items-center gap-1.5">
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>info</span>
                    Đây là giải thích hỗ trợ tham khảo. Vui lòng hỏi bác sĩ để được tư vấn chuyên sâu.
                </p>
            </div>
        </div>
    );
}
