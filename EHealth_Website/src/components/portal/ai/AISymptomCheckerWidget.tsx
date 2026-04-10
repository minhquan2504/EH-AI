'use client';

import { useState } from 'react';
import { aiService } from '@/services/aiService';

// ============================================
// Types & Config
// ============================================

type Step = 'select' | 'confirm' | 'result';

interface AnalysisResult {
    urgency: 'urgent' | 'moderate' | 'mild';
    advice: string;
}

const SYMPTOM_CHIPS = [
    'Sốt', 'Ho', 'Đau đầu', 'Đau bụng', 'Khó thở',
    'Chóng mặt', 'Buồn nôn', 'Đau ngực', 'Mệt mỏi', 'Đau lưng',
];

const URGENCY_CONFIG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
    urgent: { label: 'Khẩn cấp', bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600', icon: 'emergency' },
    moderate: { label: 'Cần khám sớm', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600', icon: 'medical_services' },
    mild: { label: 'Theo dõi tại nhà', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600', icon: 'home_health' },
};

const URGENT_SYMPTOMS = ['Đau ngực', 'Khó thở'];

function getMockResult(symptoms: string[]): AnalysisResult {
    if (symptoms.some(s => URGENT_SYMPTOMS.includes(s))) {
        return {
            urgency: 'urgent',
            advice: 'Triệu chứng của bạn có thể nghiêm trọng. Hãy đến cơ sở y tế ngay hoặc gọi cấp cứu 115.',
        };
    }
    if (symptoms.some(s => ['Sốt', 'Ho', 'Đau đầu'].includes(s))) {
        return {
            urgency: 'moderate',
            advice: 'Bạn nên đặt lịch khám trong vòng 1-2 ngày. Nghỉ ngơi, uống nhiều nước và theo dõi triệu chứng.',
        };
    }
    return {
        urgency: 'mild',
        advice: 'Triệu chứng nhẹ, có thể theo dõi tại nhà. Nếu không cải thiện sau 3 ngày, hãy đặt lịch khám.',
    };
}

// ============================================
// Component
// ============================================

export function AISymptomCheckerWidget() {
    const [step, setStep] = useState<Step>('select');
    const [selected, setSelected] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);

    const toggleSymptom = (s: string) => {
        setSelected(prev =>
            prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
        );
    };

    const handleAnalyze = async () => {
        if (selected.length === 0) return;
        setStep('confirm');
        setLoading(true);

        try {
            const res = await aiService.analyze({
                type: 'symptom_check',
                data: { symptoms: selected },
            });
            const data = res?.data as Record<string, unknown> | null | undefined;
            if (data?.urgency) {
                setResult({
                    urgency: data.urgency as 'urgent' | 'moderate' | 'mild',
                    advice: String(data.advice ?? ''),
                });
            } else {
                setResult(getMockResult(selected));
            }
        } catch {
            setResult(getMockResult(selected));
        } finally {
            setLoading(false);
            setStep('result');
        }
    };

    const handleReset = () => {
        setStep('select');
        setSelected([]);
        setResult(null);
    };

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                        <span className="material-symbols-outlined text-[#3C81C6] text-[20px]">symptoms</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">Kiểm tra triệu chứng AI</h3>
                        <p className="text-xs text-[#687582] dark:text-gray-500">Phân tích nhanh, không thay thế khám bác sĩ</p>
                    </div>
                </div>
                {step !== 'select' && (
                    <button onClick={handleReset} className="text-xs text-[#687582] hover:text-[#3C81C6] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">refresh</span>
                        Làm lại
                    </button>
                )}
            </div>

            {/* Body */}
            <div className="p-5">
                {/* Step: Select symptoms */}
                {step === 'select' && (
                    <div className="space-y-4">
                        <p className="text-sm text-[#121417] dark:text-white font-medium">
                            Bạn đang có triệu chứng gì?
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {SYMPTOM_CHIPS.map(symptom => (
                                <button
                                    key={symptom}
                                    onClick={() => toggleSymptom(symptom)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${selected.includes(symptom)
                                        ? 'border-[#3C81C6] bg-[#3C81C6]/10 text-[#3C81C6]'
                                        : 'border-gray-200 dark:border-gray-600 text-[#687582] hover:border-[#3C81C6]/40'
                                    }`}
                                >
                                    {selected.includes(symptom) && (
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3C81C6] mr-1.5 align-middle" />
                                    )}
                                    {symptom}
                                </button>
                            ))}
                        </div>

                        {selected.length > 0 && (
                            <div className="flex items-center justify-between pt-2">
                                <p className="text-xs text-[#687582]">
                                    Đã chọn: <span className="font-semibold text-[#121417] dark:text-white">{selected.join(', ')}</span>
                                </p>
                                <button
                                    onClick={handleAnalyze}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                                >
                                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                                    Phân tích
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Step: Loading */}
                {step === 'confirm' && loading && (
                    <div className="flex flex-col items-center gap-3 py-6">
                        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#3C81C6] text-[28px] animate-pulse">smart_toy</span>
                        </div>
                        <p className="text-sm text-[#687582]">AI đang phân tích triệu chứng...</p>
                    </div>
                )}

                {/* Step: Result */}
                {step === 'result' && result && (
                    <div className="space-y-4">
                        {/* Urgency badge */}
                        {(() => {
                            const cfg = URGENCY_CONFIG[result.urgency];
                            return (
                                <div className={`flex items-center gap-3 p-4 rounded-xl ${cfg.bg}`}>
                                    <span className={`material-symbols-outlined text-[28px] ${cfg.text}`}>{cfg.icon}</span>
                                    <div>
                                        <p className={`text-sm font-bold ${cfg.text}`}>{cfg.label}</p>
                                        <p className={`text-xs mt-0.5 ${cfg.text} opacity-80`}>{result.advice}</p>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Selected symptoms */}
                        <div className="flex flex-wrap gap-1.5">
                            {selected.map(s => (
                                <span key={s} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs text-[#687582] rounded-full">
                                    {s}
                                </span>
                            ))}
                        </div>

                        {/* CTA */}
                        <a
                            href="/booking"
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#3C81C6] hover:bg-[#2a6da8] text-white text-sm font-bold rounded-xl shadow-sm transition-all"
                        >
                            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                            Đặt lịch ngay
                        </a>

                        <p className="text-[10px] text-[#687582] text-center">
                            Kết quả chỉ mang tính tham khảo. Hãy gặp bác sĩ để được tư vấn chính xác.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
