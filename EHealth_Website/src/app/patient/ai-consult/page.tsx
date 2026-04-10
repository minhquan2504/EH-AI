"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MOCK_AI_SESSIONS, AI_QUICK_PROMPTS, type AiChatMessage, type AiChatSession } from "@/data/patient-portal-mock";

const AI_MOCK_RESPONSES: Record<string, { reply: string; specialty?: { name: string; icon: string; reason: string } }> = {
    "đau đầu": { reply: "Đau đầu có nhiều nguyên nhân. Bạn có thể mô tả thêm:\n• Đau ở vùng nào? (thái dương, trán, sau gáy)\n• Đau kéo dài bao lâu?\n• Có kèm buồn nôn, nhìn mờ không?", specialty: { name: "Thần kinh", icon: "neurology", reason: "Đau đầu cần khám chuyên khoa" } },
    "sốt": { reply: "Sốt là phản ứng tự nhiên của cơ thể. Hãy cho tôi biết thêm:\n• Sốt bao nhiêu độ?\n• Kéo dài mấy ngày?\n• Có kèm ho, đau họng, phát ban không?", specialty: { name: "Nội tổng quát", icon: "medical_services", reason: "Sốt kéo dài cần được khám" } },
    "đau bụng": { reply: "Đau bụng cần xác định vị trí cụ thể:\n• Đau vùng nào? (thượng vị, hạ vị, quanh rốn)\n• Đau sau ăn hay khi đói?\n• Có kèm buồn nôn, tiêu chảy không?", specialty: { name: "Tiêu hóa", icon: "gastroenterology", reason: "Đau bụng cần khám tiêu hóa" } },
    default: { reply: "Cảm ơn bạn đã chia sẻ. Để tư vấn chính xác hơn, bạn có thể mô tả chi tiết:\n• Triệu chứng cụ thể?\n• Kéo dài bao lâu?\n• Đã dùng thuốc gì chưa?\n\n⚠️ Lưu ý: AI chỉ tư vấn sơ bộ, không thay thế bác sĩ." },
};

export default function AiConsultPage() {
    const [messages, setMessages] = useState<AiChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState<AiChatSession | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const getAiResponse = (msg: string) => {
        const lower = msg.toLowerCase();
        for (const [key, val] of Object.entries(AI_MOCK_RESPONSES)) {
            if (key !== "default" && lower.includes(key)) return val;
        }
        return AI_MOCK_RESPONSES.default;
    };

    const sendMessage = (text: string) => {
        if (!text.trim()) return;
        const userMsg: AiChatMessage = { id: `m-${Date.now()}`, role: "user", message: text.trim(), timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        setTimeout(() => {
            const resp = getAiResponse(text);
            const aiMsg: AiChatMessage = {
                id: `m-${Date.now()}-ai`, role: "ai", message: resp.reply,
                timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
                specialtyRecommendation: resp.specialty,
            };
            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
        }, 1500);
    };

    const loadHistory = (session: AiChatSession) => {
        setMessages(session.messages);
        setSelectedHistory(session);
        setShowHistory(false);
    };

    const startNew = () => {
        setMessages([]);
        setSelectedHistory(null);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "28px" }}>smart_toy</span>
                        AI Tư vấn sức khỏe
                    </h1>
                    <p className="text-sm text-[#687582] mt-0.5">Mô tả triệu chứng để nhận gợi ý chuyên khoa phù hợp</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowHistory(!showHistory)}
                        className="px-3 py-2 text-sm font-medium text-[#687582] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl hover:bg-gray-50 dark:hover:bg-[#252d36] flex items-center gap-1.5">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>history</span>
                        Lịch sử
                    </button>
                    {messages.length > 0 && (
                        <button onClick={startNew}
                            className="px-3 py-2 text-sm font-medium text-[#3C81C6] bg-[#3C81C6]/[0.06] rounded-xl hover:bg-[#3C81C6]/[0.12] flex items-center gap-1.5">
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                            Cuộc mới
                        </button>
                    )}
                </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400" style={{ fontSize: "18px" }}>info</span>
                <p className="text-xs text-amber-700 dark:text-amber-400">AI chỉ mang tính tham khảo, <strong>không thay thế</strong> chẩn đoán và điều trị của bác sĩ.</p>
            </div>

            {/* Chat area */}
            <div className="flex-1 bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {messages.length === 0 && !showHistory ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center shadow-xl shadow-[#3C81C6]/20 mb-4">
                                <span className="material-symbols-outlined text-white" style={{ fontSize: "32px" }}>smart_toy</span>
                            </div>
                            <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-1">Xin chào! Tôi là EHealth AI</h3>
                            <p className="text-sm text-[#687582] max-w-md mb-6">Hãy mô tả triệu chứng của bạn, tôi sẽ giúp phân tích sơ bộ và gợi ý chuyên khoa phù hợp.</p>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-lg">
                                {AI_QUICK_PROMPTS.map(p => (
                                    <button key={p.label} onClick={() => sendMessage(p.prompt)}
                                        className="flex flex-col items-center gap-2 p-3 rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] hover:border-[#3C81C6] hover:bg-[#3C81C6]/[0.04] transition-all group">
                                        <span className="material-symbols-outlined text-[#687582] group-hover:text-[#3C81C6] transition-colors" style={{ fontSize: "22px" }}>{p.icon}</span>
                                        <span className="text-xs font-medium text-[#687582] group-hover:text-[#3C81C6]">{p.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[85%] ${msg.role === "user" ? "" : "flex gap-3"}`}>
                                        {msg.role === "ai" && (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center flex-shrink-0 mt-1">
                                                <span className="material-symbols-outlined text-white" style={{ fontSize: "16px" }}>smart_toy</span>
                                            </div>
                                        )}
                                        <div>
                                            <div className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-line ${msg.role === "user" ? "bg-[#3C81C6] text-white rounded-br-md" : "bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-white rounded-bl-md"}`}>
                                                {msg.message}
                                            </div>
                                            {msg.specialtyRecommendation && (
                                                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
                                                    <p className="text-xs font-bold text-blue-800 dark:text-blue-400 mb-2">🏥 Gợi ý chuyên khoa:</p>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-blue-600" style={{ fontSize: "20px" }}>{msg.specialtyRecommendation.icon}</span>
                                                            <div>
                                                                <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">{msg.specialtyRecommendation.name}</p>
                                                                <p className="text-xs text-blue-600 dark:text-blue-400">{msg.specialtyRecommendation.reason}</p>
                                                            </div>
                                                        </div>
                                                        <Link href={`/booking?specialtyName=${encodeURIComponent(msg.specialtyRecommendation.name)}`}
                                                            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#3C81C6] rounded-lg hover:bg-[#2a6da8] whitespace-nowrap">
                                                            Đặt lịch →
                                                        </Link>
                                                    </div>
                                                </div>
                                            )}
                                            <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-right text-[#687582]" : "text-[#687582]"}`}>{msg.timestamp}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center flex-shrink-0">
                                        <span className="material-symbols-outlined text-white" style={{ fontSize: "16px" }}>smart_toy</span>
                                    </div>
                                    <div className="px-4 py-3 bg-[#f6f7f8] dark:bg-[#13191f] rounded-2xl rounded-bl-md">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-[#687582] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <span className="w-2 h-2 bg-[#687582] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <span className="w-2 h-2 bg-[#687582] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </>
                    )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-[#e5e7eb] dark:border-[#2d353e]">
                    <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
                        <input type="text" value={input} onChange={e => setInput(e.target.value)}
                            placeholder="Mô tả triệu chứng của bạn..."
                            className="flex-1 px-4 py-3 border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl text-sm bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 placeholder-[#687582]" />
                        <button type="submit" disabled={!input.trim() || isTyping}
                            className="px-5 py-3 bg-gradient-to-r from-[#3C81C6] to-[#2563eb] text-white rounded-xl shadow-md hover:shadow-lg disabled:opacity-40 transition-all">
                            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>send</span>
                        </button>
                    </form>
                </div>
            </div>

            {/* History Panel */}
            {showHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowHistory(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center justify-between">
                            <h3 className="text-lg font-bold text-[#121417] dark:text-white">Lịch sử tư vấn</h3>
                            <button onClick={() => setShowHistory(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><span className="material-symbols-outlined text-[#687582]">close</span></button>
                        </div>
                        <div className="p-5 space-y-3">
                            {MOCK_AI_SESSIONS.length === 0 ? (
                                <p className="text-sm text-[#687582] text-center py-8">Chưa có lịch sử tư vấn</p>
                            ) : (
                                MOCK_AI_SESSIONS.map(session => (
                                    <button key={session.id} onClick={() => loadHistory(session)}
                                        className="w-full text-left p-4 rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] hover:border-[#3C81C6] hover:bg-[#3C81C6]/[0.04] transition-all">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-bold text-[#121417] dark:text-white">{session.title}</h4>
                                            {session.resolved && <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-100 dark:bg-green-500/10 text-green-700">Đã tư vấn</span>}
                                        </div>
                                        <p className="text-xs text-[#687582] mt-1">{session.date} • {session.messages.length} tin nhắn</p>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
