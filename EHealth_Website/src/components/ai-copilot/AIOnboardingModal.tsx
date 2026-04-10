'use client';

import { useState, useEffect } from 'react';
import { useAICopilot } from '@/contexts/AICopilotContext';

// ============================================
// Steps config
// ============================================

const STEPS = [
    {
        icon: 'smart_toy',
        title: 'Chào mừng đến với AI Copilot!',
        description: 'AI Copilot luôn ở bên phải, sẵn sàng hỗ trợ bạn 24/7 — từ tra cứu ICD-10, tương tác thuốc đến phân tích triệu chứng.',
        color: 'text-violet-500',
        bg: 'bg-violet-50 dark:bg-violet-900/20',
    },
    {
        icon: 'auto_awesome',
        title: 'Gợi ý thông minh',
        description: 'AI tự phân tích và đưa ra gợi ý khi bạn nhập dữ liệu — cảnh báo dị ứng, liều bất thường, chẩn đoán tham khảo.',
        color: 'text-amber-500',
        bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
        icon: 'terminal',
        title: 'Lệnh nhanh',
        description: 'Gõ / trong chat để xem danh sách lệnh: /icd, /drug, /diagnose, /vitals... Hoặc nhấn Ctrl+K để mở Command Palette.',
        color: 'text-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
        icon: 'search',
        title: 'Tìm kiếm AI',
        description: 'Thanh tìm kiếm trên header hiểu ngôn ngữ tự nhiên — thử "bệnh nhân đau đầu tuần này" hay "thuốc hạ áp an toàn cho thai kỳ".',
        color: 'text-emerald-500',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
        icon: 'mic',
        title: 'Nhập liệu giọng nói ✨',
        description: 'Nhấn icon 🎤 để nói — AI tự chuyển thành văn bản tiếng Việt. Tiết kiệm thời gian nhập liệu triệu chứng, ghi chú bác sĩ.',
        color: 'text-rose-500',
        bg: 'bg-rose-50 dark:bg-rose-900/20',
    },
];

// ============================================
// AIOnboardingModal
// ============================================

interface Props {
    role?: string;
}

export default function AIOnboardingModal({ role: roleProp }: Props) {
    const { role: ctxRole } = useAICopilot();
    const role = roleProp || ctxRole;

    const storageKey = `ehealth_ai_onboarded_${role}`;
    const [visible, setVisible] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        try {
            if (!localStorage.getItem(storageKey)) {
                setVisible(true);
            }
        } catch {
            // storage unavailable
        }
    }, [storageKey]);

    if (!visible) return null;

    const current = STEPS[step];
    const isLast = step === STEPS.length - 1;

    const handleNext = () => {
        if (isLast) {
            complete();
        } else {
            setStep(s => s + 1);
        }
    };

    const complete = () => {
        try {
            localStorage.setItem(storageKey, '1');
        } catch { /* */ }
        setVisible(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40">
            <div className="relative bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#dde0e4] dark:border-[#2d353e]">
                {/* Violet gradient top border */}
                <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />

                {/* Content */}
                <div className="p-8">
                    {/* Illustration area */}
                    <div className={`w-20 h-20 rounded-2xl ${current.bg} flex items-center justify-center mx-auto mb-6 transition-all duration-300`}>
                        <span className={`material-symbols-outlined text-[44px] ${current.color}`}>
                            {current.icon}
                        </span>
                    </div>

                    {/* Step counter */}
                    <p className="text-center text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase tracking-widest mb-2">
                        Bước {step + 1} / {STEPS.length}
                    </p>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-[#121417] dark:text-white text-center mb-3 leading-tight">
                        {current.title}
                    </h2>

                    {/* Description */}
                    <p className="text-sm text-[#687582] dark:text-gray-300 text-center leading-relaxed mb-8">
                        {current.description}
                    </p>

                    {/* CTA button */}
                    <button
                        onClick={handleNext}
                        className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-violet-200 dark:shadow-violet-900/30 hover:-translate-y-0.5 active:translate-y-0"
                    >
                        {isLast ? 'Bắt đầu sử dụng 🚀' : 'Tiếp theo →'}
                    </button>
                </div>

                {/* Step dots */}
                <div className="flex items-center justify-center gap-2 pb-5">
                    {STEPS.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setStep(i)}
                            className={`rounded-full transition-all duration-200 ${
                                i === step
                                    ? 'w-6 h-2 bg-violet-500'
                                    : 'w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-violet-300'
                            }`}
                        />
                    ))}
                </div>

                {/* Skip link */}
                <button
                    onClick={complete}
                    className="absolute bottom-4 right-5 text-xs text-[#687582] dark:text-gray-500 hover:text-[#121417] dark:hover:text-gray-300 transition-colors"
                >
                    Bỏ qua
                </button>
            </div>
        </div>
    );
}
