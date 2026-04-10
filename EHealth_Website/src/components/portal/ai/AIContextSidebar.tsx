'use client';

import { useState } from 'react';

interface AIContext {
    patientId?: string;
    patientName?: string;
    patientInfo?: string;
    currentStep?: string;
}

interface AIContextSidebarProps {
    context: AIContext | null;
    onUpdateContext: (ctx: AIContext | null) => void;
    onClearContext: () => void;
    deepAnalysisMode: boolean;
    onToggleDeepAnalysis: (enabled: boolean) => void;
}

export function AIContextSidebar({
    context,
    onUpdateContext,
    onClearContext,
    deepAnalysisMode,
    onToggleDeepAnalysis,
}: AIContextSidebarProps) {
    const [showForm, setShowForm] = useState(false);
    const [formName, setFormName] = useState('');
    const [formInfo, setFormInfo] = useState('');
    const [formError, setFormError] = useState<string | null>(null);

    const handleAddContext = () => {
        try {
            if (!formName.trim() && !formInfo.trim()) {
                setFormError('Vui lòng nhập ít nhất tên bệnh nhân hoặc thông tin.');
                return;
            }
            onUpdateContext({
                ...context,
                patientName: formName.trim() || context?.patientName,
                patientInfo: formInfo.trim() || context?.patientInfo,
            });
            setFormName('');
            setFormInfo('');
            setFormError(null);
            setShowForm(false);
        } catch {
            setFormError('Có lỗi xảy ra khi cập nhật context.');
        }
    };

    const handleClear = () => {
        try {
            onClearContext();
            setShowForm(false);
            setFormName('');
            setFormInfo('');
            setFormError(null);
        } catch {
            // silent — parent handles state
        }
    };

    return (
        <aside
            className="flex flex-col gap-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1d21] h-full overflow-y-auto"
            style={{ width: 250, minWidth: 250 }}
        >
            {/* Section 1: Context hiện tại */}
            <div className="p-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-[#121417] dark:text-gray-100 tracking-wide">
                    📌 Context hiện tại
                </p>

                {context ? (
                    <div className="flex flex-col gap-2">
                        {/* Patient card */}
                        {(context.patientName || context.patientId) && (
                            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-3 py-2">
                                <p className="text-[10px] text-[#687582] dark:text-gray-400 uppercase tracking-wider mb-0.5">
                                    Bệnh nhân
                                </p>
                                {context.patientName && (
                                    <p className="text-xs font-medium text-[#121417] dark:text-gray-100 leading-tight">
                                        {context.patientName}
                                    </p>
                                )}
                                {context.patientId && (
                                    <p className="text-[10px] text-[#687582] dark:text-gray-400 mt-0.5">
                                        ID: {context.patientId}
                                    </p>
                                )}
                                {context.patientInfo && (
                                    <p className="text-[10px] text-[#687582] dark:text-gray-400 mt-1 leading-snug line-clamp-3">
                                        {context.patientInfo}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Current step card */}
                        {context.currentStep && (
                            <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 px-3 py-2">
                                <p className="text-[10px] text-[#687582] dark:text-gray-400 uppercase tracking-wider mb-0.5">
                                    Bước hiện tại
                                </p>
                                <p className="text-xs font-medium text-[#121417] dark:text-gray-100 leading-tight">
                                    {context.currentStep}
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-3 py-4 text-center">
                        <p className="text-xs text-[#687582] dark:text-gray-500">
                            Chưa có context
                        </p>
                        <p className="text-[10px] text-[#687582] dark:text-gray-600 mt-1">
                            Thêm thông tin bệnh nhân để AI hỗ trợ chính xác hơn
                        </p>
                    </div>
                )}

                {/* Inline form */}
                {showForm && (
                    <div className="flex flex-col gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-medium text-[#687582] dark:text-gray-400 uppercase tracking-wider">
                                Tên bệnh nhân
                            </label>
                            <input
                                type="text"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                placeholder="Nguyễn Văn A..."
                                className="text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-[#121417] dark:text-gray-100 placeholder-[#687582] dark:placeholder-gray-500 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#3C81C6] dark:focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-medium text-[#687582] dark:text-gray-400 uppercase tracking-wider">
                                Thông tin bổ sung
                            </label>
                            <textarea
                                value={formInfo}
                                onChange={(e) => setFormInfo(e.target.value)}
                                placeholder="Tiền sử bệnh, dị ứng..."
                                rows={3}
                                className="text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-[#121417] dark:text-gray-100 placeholder-[#687582] dark:placeholder-gray-500 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#3C81C6] dark:focus:ring-blue-500 resize-none"
                            />
                        </div>
                        {formError && (
                            <p className="text-[10px] text-red-500 dark:text-red-400">{formError}</p>
                        )}
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddContext}
                                className="flex-1 text-xs font-medium rounded-md bg-[#3C81C6] hover:bg-blue-600 text-white px-2.5 py-1.5 transition-colors"
                            >
                                Lưu
                            </button>
                            <button
                                onClick={() => {
                                    setShowForm(false);
                                    setFormError(null);
                                    setFormName('');
                                    setFormInfo('');
                                }}
                                className="flex-1 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 text-[#687582] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 px-2.5 py-1.5 transition-colors"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-col gap-1.5">
                    {!showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="w-full text-xs font-medium rounded-md border border-[#3C81C6] text-[#3C81C6] hover:bg-blue-50 dark:hover:bg-blue-950/30 px-3 py-1.5 transition-colors text-left"
                        >
                            + Thêm context
                        </button>
                    )}
                    {context && (
                        <button
                            onClick={handleClear}
                            className="w-full text-xs font-medium rounded-md border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 px-3 py-1.5 transition-colors text-left"
                        >
                            Xóa context
                        </button>
                    )}
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700" />

            {/* Section 2: Chế độ */}
            <div className="p-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-[#121417] dark:text-gray-100 tracking-wide">
                    ⚙️ Chế độ
                </p>

                <div className="flex items-start gap-3">
                    {/* Toggle switch */}
                    <button
                        role="switch"
                        aria-checked={deepAnalysisMode}
                        onClick={() => onToggleDeepAnalysis(!deepAnalysisMode)}
                        className={`relative flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1 dark:focus:ring-offset-gray-900 ${
                            deepAnalysisMode
                                ? 'bg-violet-500'
                                : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        style={{ width: 36, height: 20 }}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 inline-block rounded-full bg-white shadow transition-transform duration-200 ${
                                deepAnalysisMode ? 'translate-x-4' : 'translate-x-0'
                            }`}
                            style={{ width: 16, height: 16 }}
                        />
                    </button>

                    <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-medium text-[#121417] dark:text-gray-100 leading-tight">
                            Deep Analysis
                        </p>
                        <p className="text-[10px] text-[#687582] dark:text-gray-400 leading-snug">
                            Gửi toàn bộ lịch sử chat để AI phân tích sâu hơn
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
