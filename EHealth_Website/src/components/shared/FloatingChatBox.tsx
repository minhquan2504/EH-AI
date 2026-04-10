"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { aiService } from "@/services/aiService";

interface Message {
    role: "user" | "ai";
    content: string;
    time: string;
}

const MOCK_RESPONSES: Record<string, string> = {
    "đặt lịch": "Bạn có thể đặt lịch khám trực tiếp trên website tại mục **Đặt lịch khám**, hoặc gọi hotline **1900 1234**. Hệ thống sẽ xác nhận qua SMS trong 30 phút.",
    "giờ làm việc": "Bệnh viện EHealth làm việc:\n- **Thứ 2 — Thứ 7:** 7:00 — 20:00\n- **Chủ nhật:** Cấp cứu 24/7\n- **Ngày lễ:** Cấp cứu 24/7",
    "chi phí": "Chi phí khám chuyên khoa: **200.000 — 500.000đ**\nKhám tổng quát: từ **1.500.000đ**\nChi phí xét nghiệm sẽ được tư vấn sau khi khám.",
    "chuyên khoa": "EHealth có **8 chuyên khoa chính:**\n1. Tim mạch\n2. Thần kinh\n3. Da liễu\n4. Nhi khoa\n5. Nhãn khoa\n6. Răng hàm mặt\n7. Chấn thương chỉnh hình\n8. Sản phụ khoa",
    "bhyt": "EHealth chấp nhận **tất cả các loại thẻ BHYT** theo quy định. Vui lòng mang theo thẻ BHYT và CMND/CCCD khi đến khám.",
    "bác sĩ": "Đội ngũ EHealth gồm **120+ bác sĩ chuyên khoa**, trong đó có 24 PGS.TS với kinh nghiệm trung bình 18 năm. Xem chi tiết tại mục **Đội ngũ bác sĩ** trên trang chủ.",
};

function getQuickSuggestions(pathname: string) {
    if (pathname.includes("/portal/doctor")) return ["Tra cứu ICD-10", "Tương tác thuốc", "Gợi ý chẩn đoán", "Phác đồ điều trị"];
    if (pathname.includes("/portal/receptionist")) return ["Tìm bệnh nhân", "Hướng dẫn BHYT", "Đặt lịch hẹn", "Thanh toán"];
    if (pathname.includes("/portal/pharmacist")) return ["Kiểm tra tồn kho", "Tương tác thuốc", "Liều dùng", "Cấp phát thuốc"];
    if (pathname.includes("/admin")) return ["Báo cáo doanh thu", "Thống kê bệnh nhân", "Quản lý nhân sự", "Cấu hình hệ thống"];
    return ["Đặt lịch khám", "Giờ làm việc", "Chi phí khám", "Chuyên khoa"];
}

function getMockResponse(msg: string): string {
    const lower = msg.toLowerCase();
    for (const [key, val] of Object.entries(MOCK_RESPONSES)) {
        if (lower.includes(key)) return val;
    }
    return "Cảm ơn bạn đã liên hệ! Tôi là trợ lý AI của EHealth Hospital. Tôi có thể giúp bạn:\n- Thông tin **đặt lịch khám**\n- **Giờ làm việc** bệnh viện\n- **Chi phí** khám bệnh\n- Thông tin **chuyên khoa** và **bác sĩ**\n\nBạn muốn hỏi về vấn đề gì?";
}

function escapeHtml(text: string) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatMd(text: string) {
    return escapeHtml(text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br/>');
}

function getNow() {
    return new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export function FloatingChatBox() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [hasNewMsg, setHasNewMsg] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const suggestions = getQuickSuggestions(pathname);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => { scrollToBottom(); }, [messages, isTyping, scrollToBottom]);
    useEffect(() => { if (isOpen) inputRef.current?.focus(); }, [isOpen]);

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;
        const userMsg: Message = { role: "user", content: text.trim(), time: getNow() };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        try {
            const res = await aiService.chat({ message: text.trim() });
            const aiText = (res as any)?.data?.data?.reply ?? (res as any)?.data?.reply ?? (res as any)?.data?.message ?? getMockResponse(text);
            setMessages((prev) => [...prev, { role: "ai", content: aiText, time: getNow() }]);
        } catch {
            setMessages((prev) => [...prev, { role: "ai", content: getMockResponse(text), time: getNow() }]);
        } finally {
            setIsTyping(false);
            if (!isOpen) setHasNewMsg(true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
    };

    const clearChat = () => { setMessages([]); };

    return (
        <>
            {/* Chat Panel */}
            <div className={`fixed bottom-24 right-6 z-[60] w-[calc(100vw-48px)] sm:w-[400px] transition-all duration-300 ${isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"}`}>
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2d353e] flex flex-col overflow-hidden" style={{ height: "min(550px, 70vh)" }}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] text-white flex-shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold leading-tight">EHealth AI</p>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    <span className="text-[10px] text-blue-100">Online</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={clearChat} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="Cuộc trò chuyện mới">
                                <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                            </button>
                            <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                        {messages.length === 0 && (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-3">
                                    <span className="material-symbols-outlined text-[#3C81C6] text-[32px]">smart_toy</span>
                                </div>
                                <p className="text-sm font-bold text-[#121417] dark:text-white mb-1">Xin chào!</p>
                                <p className="text-xs text-[#687582] dark:text-gray-400 mb-4">Tôi là trợ lý AI của EHealth. Hãy hỏi tôi bất cứ điều gì!</p>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {suggestions.map((s) => (
                                        <button key={s} onClick={() => sendMessage(s)}
                                            className="px-3 py-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-[#3C81C6] rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors border border-blue-100 dark:border-blue-800">
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                                    ? "bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] text-white rounded-br-md"
                                    : "bg-gray-100 dark:bg-gray-800 text-[#121417] dark:text-gray-200 rounded-bl-md"}`}>
                                    <div dangerouslySetInnerHTML={{ __html: formatMd(msg.content) }} />
                                    <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-blue-200" : "text-gray-400"}`}>{msg.time}</p>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-md">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick suggestions (shown when chat has messages) */}
                    {messages.length > 0 && messages.length < 6 && (
                        <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide flex-shrink-0">
                            {suggestions.slice(0, 3).map((s) => (
                                <button key={s} onClick={() => sendMessage(s)}
                                    className="px-2.5 py-1 text-[10px] font-medium bg-gray-50 dark:bg-gray-800 text-[#687582] rounded-full hover:bg-blue-50 hover:text-[#3C81C6] transition-colors whitespace-nowrap border border-gray-200 dark:border-gray-700">
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="px-3 py-3 border-t border-gray-100 dark:border-[#2d353e] flex items-end gap-2 flex-shrink-0">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Nhập tin nhắn..."
                            rows={1}
                            className="flex-1 px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 focus:border-[#3C81C6] resize-none text-[#121417] dark:text-white placeholder:text-gray-400 max-h-24 transition-colors"
                        />
                        <button
                            onClick={() => sendMessage(input)}
                            disabled={!input.trim() || isTyping}
                            className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] text-white flex items-center justify-center hover:shadow-lg hover:shadow-blue-200 dark:hover:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 flex-shrink-0"
                        >
                            <span className="material-symbols-outlined text-[20px]">send</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Bubble */}
            <button
                onClick={() => { setIsOpen(!isOpen); setHasNewMsg(false); }}
                className={`fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:-translate-y-1 active:scale-95 ${isOpen
                    ? "bg-gray-700 hover:bg-gray-600 rotate-0"
                    : "bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] hover:shadow-blue-300/50"}`}
                aria-label={isOpen ? "Đóng chatbox" : "Mở chatbox AI"}
            >
                <span className="material-symbols-outlined text-white text-[26px] transition-transform duration-300" style={{ transform: isOpen ? "rotate(90deg)" : "none" }}>
                    {isOpen ? "close" : "smart_toy"}
                </span>

                {/* Notification badge */}
                {hasNewMsg && !isOpen && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">!</span>
                )}

                {/* Pulse ring */}
                {!isOpen && (
                    <span className="absolute inset-0 rounded-full bg-[#3C81C6] animate-ping opacity-20" />
                )}
            </button>
        </>
    );
}
