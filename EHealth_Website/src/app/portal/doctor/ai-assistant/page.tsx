"use client";

import { useState, useRef, useEffect } from "react";
import { aiService } from "@/services/aiService";
import { AIContextSidebar, AILogViewer } from "@/components/portal/ai";
import { useAuth } from "@/contexts/AuthContext";

type Message = { id: number; role: "user" | "ai"; text: string; time: string };

const QUICK_PROMPTS = [
    { icon: "diagnosis", label: "Gợi ý chẩn đoán", prompt: "Bệnh nhân nữ 42 tuổi, sốt 38.5°C, ho khan, đau họng 3 ngày. Gợi ý chẩn đoán?" },
    { icon: "medication", label: "Tra tương tác thuốc", prompt: "Kiểm tra tương tác giữa Amoxicillin và Omeprazole" },
    { icon: "search", label: "Tra cứu ICD-10", prompt: "Tra cứu mã ICD-10 cho viêm phổi" },
    { icon: "description", label: "Tìm phác đồ", prompt: "Phác đồ điều trị tăng huyết áp giai đoạn 1" },
    { icon: "science", label: "Phân tích xét nghiệm", prompt: "WBC 15.2, CRP 45mg/L, Neutrophil 85%. Phân tích kết quả?" },
    { icon: "vaccines", label: "Liều dùng thuốc", prompt: "Liều dùng Amoxicillin cho trẻ 5 tuổi, 18kg?" },
];

const MOCK_RESPONSES: Record<string, string> = {
    "chẩn đoán": `Dựa trên triệu chứng mô tả, các chẩn đoán phân biệt gợi ý:

**1. Viêm họng cấp (J02.9)** — ✅ Khả năng cao
- Sốt + đau họng + ho khan phù hợp
- Thường do virus (Rhinovirus, Adenovirus)
- Xem xét: test Strep nhanh nếu nghi ngờ vi khuẩn

**2. Viêm amidan cấp (J03.9)**
- Nếu có sưng amidan, bựa trắng
- Cần khám hầu họng kỹ

**3. COVID-19 / Cúm mùa**
- Nếu có tiếp xúc nguồn bệnh
- Test nhanh nếu cần thiết

📋 **Khuyến nghị:**
- XN máu (CBC) để đánh giá nhiễm trùng
- Xử lý triệu chứng: hạ sốt, giảm đau họng
- Kháng sinh nếu nghi Streptococcus nhóm A`,

    "tương tác": `📊 **Kiểm tra tương tác: Amoxicillin + Omeprazole**

⚠️ **Mức độ: THẤP** — Có thể sử dụng đồng thời

**Chi tiết:**
- Omeprazole có thể làm giảm nhẹ hấp thu Amoxicillin do thay đổi pH dạ dày
- Tuy nhiên, trong phác đồ diệt H.pylori, hai thuốc này thường được kê **cùng nhau** (triple therapy)

✅ **Kết luận:** An toàn khi dùng đồng thời. Khuyến cáo uống Amoxicillin trước bữa ăn, Omeprazole trước bữa ăn 30 phút.`,

    "icd": `🔎 **Tra cứu ICD-10: Viêm phổi**

| Mã | Mô tả |
|---|---|
| **J18.9** | Viêm phổi, không xác định |
| **J15.9** | Viêm phổi do vi khuẩn, không xác định |
| **J12.9** | Viêm phổi do virus, không xác định |
| **J13** | Viêm phổi do Streptococcus pneumoniae |
| **J14** | Viêm phổi do Haemophilus influenzae |
| **J15.1** | Viêm phổi do Pseudomonas |
| **J18.0** | Viêm phế quản phổi, không xác định |

💡 Mã thường dùng nhất: **J18.9** (Viêm phổi, không xác định)`,

    "phác đồ": `📋 **Phác đồ điều trị Tăng huyết áp giai đoạn 1**
*(HA 140-159/90-99 mmHg)*

**Bước 1: Thay đổi lối sống (3-6 tháng)**
- Giảm muối < 5g/ngày
- Tập thể dục 30 phút/ngày, 5 ngày/tuần
- Giảm cân nếu BMI > 25
- Hạn chế rượu bia

**Bước 2: Đơn trị liệu**
- Chọn 1: **ACE inhibitor** (Enalapril 5-10mg) hoặc **ARB** (Losartan 50mg) hoặc **CCB** (Amlodipine 5mg)
- Đánh giá lại sau 4-8 tuần

**Bước 3: Phối hợp thuốc (nếu chưa đạt mục tiêu)**
- ACEi/ARB + CCB hoặc ACEi/ARB + Thiazide

🎯 **Mục tiêu:** HA < 140/90 mmHg (< 130/80 nếu có ĐTĐ/bệnh thận)`,

    "phân tích": `🔬 **Phân tích kết quả xét nghiệm**

| Chỉ số | Giá trị | Bình thường | Đánh giá |
|---|---|---|---|
| WBC | **15.2** K/µL | 4.0-11.0 | ⬆️ Tăng |
| CRP | **45** mg/L | < 5.0 | ⬆️ Tăng cao |
| Neutrophil | **85%** | 40-70% | ⬆️ Tăng |

📊 **Nhận xét:**
- **Bạch cầu tăng + Neutrophil ưu thế** → Gợi ý nhiễm trùng do **vi khuẩn**
- **CRP tăng cao (45 mg/L)** → Phản ứng viêm cấp tính rõ
- Cần kết hợp lâm sàng để xác định ổ nhiễm trùng

⚕️ **Khuyến nghị:** Xem xét kháng sinh theo kinh nghiệm, cấy máu nếu sốt cao`,

    "liều": `💊 **Liều dùng Amoxicillin cho trẻ**
*Trẻ 5 tuổi, 18 kg*

**Liều chuẩn (nhiễm trùng nhẹ-vừa):**
- 25-50 mg/kg/ngày ÷ 3 lần
- = 450-900 mg/ngày
- **Khuyến cáo: 250mg x 3 lần/ngày** (dạng siro hoặc viên nhai)

**Liều cao (nhiễm trùng nặng):**
- 80-90 mg/kg/ngày ÷ 2 lần
- = 720-810 mg x 2 lần/ngày

📝 **Lưu ý:**
- Dạng siro 250mg/5ml → mỗi lần 5ml x 3 lần/ngày
- Uống trước hoặc sau ăn đều được
- Thời gian điều trị: 5-7 ngày`,
};

function getAIResponse(prompt: string): string {
    const lower = prompt.toLowerCase();
    if (lower.includes("chẩn đoán") || lower.includes("triệu chứng")) return MOCK_RESPONSES["chẩn đoán"];
    if (lower.includes("tương tác")) return MOCK_RESPONSES["tương tác"];
    if (lower.includes("icd")) return MOCK_RESPONSES["icd"];
    if (lower.includes("phác đồ") || lower.includes("điều trị")) return MOCK_RESPONSES["phác đồ"];
    if (lower.includes("phân tích") || lower.includes("xét nghiệm") || lower.includes("wbc")) return MOCK_RESPONSES["phân tích"];
    if (lower.includes("liều") || lower.includes("trẻ")) return MOCK_RESPONSES["liều"];
    return `Tôi đã tiếp nhận yêu cầu của bạn. Đây là tính năng AI demo — trong phiên bản chính thức, tôi sẽ phân tích chi tiết câu hỏi:\n\n> "${prompt}"\n\n*Vui lòng thử các câu hỏi gợi ý bên dưới để xem demo.*`;
}

function getTime() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function AIAssistantPage() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
        { id: 0, role: "ai", text: "Xin chào BS! Tôi là **EHealth AI Assistant** 🤖\n\nTôi có thể hỗ trợ bạn:\n- 🔍 Gợi ý chẩn đoán dựa trên triệu chứng\n- 💊 Tra cứu tương tác thuốc\n- 📋 Tìm phác đồ điều trị\n- 🔬 Phân tích kết quả xét nghiệm\n- 📖 Tra mã ICD-10\n\nHãy nhập câu hỏi hoặc chọn gợi ý bên dưới.", time: getTime() },
    ]);
    const [input, setInput] = useState("");
    const [typing, setTyping] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // AI Enhancement state
    const [activeTab, setActiveTab] = useState<"chat" | "logs">("chat");
    const [aiContext, setAiContext] = useState<{ patientId?: string; patientName?: string; patientInfo?: string; currentStep?: string } | null>(null);
    const [deepAnalysisMode, setDeepAnalysisMode] = useState(false);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;
        const userMsg: Message = { id: Date.now(), role: "user", text: text.trim(), time: getTime() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setTyping(true);

        let responseText = "";
        try {
            const chatPayload: { message: string; context?: Record<string, unknown>; history?: { role: string; content: string }[] } = {
                message: text.trim(),
            };
            // Add context if pinned
            if (aiContext) {
                chatPayload.context = { ...aiContext };
            }
            // Add history if deep analysis mode
            if (deepAnalysisMode) {
                chatPayload.history = messages.map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text }));
            }
            const res = await aiService.chat(chatPayload);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = res?.data as any;
            responseText = data?.message || data?.reply || data?.content || getAIResponse(text);
        } catch {
            responseText = getAIResponse(text);
        }

        const aiReply: Message = { id: Date.now() + 1, role: "ai", text: responseText, time: getTime() };
        setMessages(prev => [...prev, aiReply]);
        setTyping(false);
    };

    return (
        <div className="flex h-[calc(100vh-64px)]">
            {/* AI Context Sidebar */}
            <AIContextSidebar
                context={aiContext}
                onUpdateContext={setAiContext}
                onClearContext={() => setAiContext(null)}
                deepAnalysisMode={deepAnalysisMode}
                onToggleDeepAnalysis={setDeepAnalysisMode}
            />

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-[#dde0e4] dark:border-[#2d353e] bg-white dark:bg-[#1e242b]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-[20px]">smart_toy</span>
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-[#121417] dark:text-white">EHealth AI Assistant</h1>
                        <p className="text-xs text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Đang hoạt động • GPT-Medical v2</p>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                        {/* Tabs */}
                        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                            <button onClick={() => setActiveTab("chat")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "chat" ? "bg-white dark:bg-[#1e242b] text-[#3C81C6] shadow-sm" : "text-[#687582]"}`}>
                                💬 Chat
                            </button>
                            <button onClick={() => setActiveTab("logs")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "logs" ? "bg-white dark:bg-[#1e242b] text-[#3C81C6] shadow-sm" : "text-[#687582]"}`}>
                                📋 Lịch sử AI
                            </button>
                        </div>
                        <button onClick={() => setMessages([messages[0]])} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-[#687582] transition-colors" title="Cuộc hội thoại mới">
                            <span className="material-symbols-outlined text-[20px]">add_comment</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Log Viewer Tab */}
            {activeTab === "logs" && (
                <div className="flex-1 overflow-y-auto">
                    <AILogViewer doctorId={user?.id} visible={activeTab === "logs"} />
                </div>
            )}

            {/* Chat Tab */}
            {activeTab === "chat" && <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f8f9fa] dark:bg-[#13191f]">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role === "ai" && (
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                                <span className="material-symbols-outlined text-white text-[14px]">smart_toy</span>
                            </div>
                        )}
                        <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${msg.role === "user"
                            ? "bg-[#3C81C6] text-white rounded-br-md"
                            : "bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] text-[#121417] dark:text-gray-200 rounded-bl-md"
                        }`}>
                            <div className="text-sm whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: formatMd(msg.text) }} />
                            <p className={`text-[10px] mt-2 ${msg.role === "user" ? "text-blue-200" : "text-[#b0b8c1]"}`}>{msg.time}</p>
                        </div>
                    </div>
                ))}
                {typing && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-white text-[14px]">smart_toy</span>
                        </div>
                        <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-2xl rounded-bl-md px-4 py-3">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-[#3C81C6] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <div className="w-2 h-2 bg-[#3C81C6] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <div className="w-2 h-2 bg-[#3C81C6] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Quick Prompts */}
            <div className="flex-shrink-0 px-6 py-3 border-t border-[#dde0e4] dark:border-[#2d353e] bg-white dark:bg-[#1e242b] overflow-x-auto">
                <div className="flex gap-2">
                    {QUICK_PROMPTS.map(qp => (
                        <button key={qp.label} onClick={() => sendMessage(qp.prompt)} disabled={typing}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f6f7f8] dark:bg-[#13191f] hover:bg-[#eef0f2] dark:hover:bg-[#1a2030] rounded-lg text-xs font-medium text-[#687582] hover:text-[#3C81C6] whitespace-nowrap transition-colors border border-transparent hover:border-[#3C81C6]/20 disabled:opacity-50">
                            <span className="material-symbols-outlined text-[14px]">{qp.icon}</span>{qp.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Input */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-[#dde0e4] dark:border-[#2d353e] bg-white dark:bg-[#1e242b]">
                <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                        <input type="text" value={input} onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                            placeholder="Nhập câu hỏi cho AI (VD: Gợi ý chẩn đoán cho bệnh nhân sốt cao, ho)..."
                            disabled={typing}
                            className="w-full px-4 py-3 bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 disabled:opacity-50 dark:text-white" />
                    </div>
                    <button onClick={() => sendMessage(input)} disabled={!input.trim() || typing}
                        className="w-11 h-11 rounded-xl bg-[#3C81C6] hover:bg-[#2a6da8] text-white flex items-center justify-center transition-colors disabled:opacity-40 shadow-md shadow-blue-200 dark:shadow-none">
                        <span className="material-symbols-outlined text-[20px]">send</span>
                    </button>
                </div>
            </div>
            </>}
            </div>{/* End Main Area */}
        </div>
    );
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatMd(text: string): string {
    return escapeHtml(text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">$1</code>')
        .replace(/^&gt; (.*)/gm, '<div class="pl-3 border-l-2 border-[#3C81C6] text-[#687582] italic">$1</div>')
        .replace(/^- (.*)/gm, '<div class="flex gap-1.5"><span class="text-[#3C81C6]">•</span><span>$1</span></div>')
        .replace(/\| (.*)/g, '<span class="font-mono text-xs">| $1</span>')
        .replace(/\n/g, '<br/>');
}
