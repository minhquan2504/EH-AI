"use client";

import { useState, useEffect } from "react";
import { telemedicineService } from "@/services/telemedicineService";
import { useAuth } from "@/contexts/AuthContext";

const MOCK_SESSIONS = [
    { id: "TM001", patient: "Nguyễn Văn An", patientId: "BN001", doctor: "BS. Trần Văn Minh", date: "28/02/2025", time: "14:00", status: "scheduled", department: "Tim mạch", reason: "Tái khám tăng huyết áp" },
    { id: "TM002", patient: "Lê Thị Bình", patientId: "BN002", doctor: "BS. Trần Văn Minh", date: "28/02/2025", time: "15:30", status: "in_progress", department: "Tim mạch", reason: "Tư vấn kết quả xét nghiệm" },
    { id: "TM003", patient: "Phạm Thị Dung", patientId: "BN004", doctor: "BS. Trần Văn Minh", date: "27/02/2025", time: "10:00", status: "completed", department: "Tim mạch", reason: "Khám định kỳ" },
    { id: "TM004", patient: "Vũ Thị Fương", patientId: "BN006", doctor: "BS. Trần Văn Minh", date: "27/02/2025", time: "11:30", status: "completed", department: "Tim mạch", reason: "Tư vấn dùng thuốc" },
    { id: "TM005", patient: "Trần Văn Cường", patientId: "BN003", doctor: "BS. Trần Văn Minh", date: "26/02/2025", time: "09:00", status: "cancelled", department: "Tim mạch", reason: "Tái khám" },
];

const statusMap: Record<string, { label: string; style: string }> = {
    scheduled: { label: "Đã lên lịch", style: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" },
    in_progress: { label: "Đang diễn ra", style: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" },
    completed: { label: "Hoàn thành", style: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
    cancelled: { label: "Đã hủy", style: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" },
};

export default function TelemedicinePage() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState(MOCK_SESSIONS);
    const [filter, setFilter] = useState("all");
    const [showRoom, setShowRoom] = useState<string | null>(null);

    useEffect(() => {
        telemedicineService.getList({ doctorId: user?.id, limit: 50 })
            .then(res => {
                const items: any[] = res?.data ?? [];
                if (items.length > 0) {
                    setSessions(items.map((s: any) => ({
                        id: s.id,
                        patient: s.patientName ?? s.patient ?? "",
                        patientId: s.patientId ?? "",
                        doctor: s.doctorName ?? s.doctor ?? "",
                        date: s.date ?? s.scheduledDate ?? s.createdAt?.split("T")[0] ?? "",
                        time: s.time ?? s.scheduledTime ?? "",
                        status: s.status ?? "scheduled",
                        department: s.department ?? s.departmentName ?? "",
                        reason: s.reason ?? s.chiefComplaint ?? "",
                    })));
                }
            })
            .catch(() => {/* keep mock */});
    }, [user?.id]);
    const [chatInput, setChatInput] = useState("");
    const [chatMessages, setChatMessages] = useState([
        { id: 1, sender: "doctor", text: "Xin chào, tôi là BS. Trần Văn Minh. Hôm nay bạn cảm thấy thế nào?", time: "15:30" },
        { id: 2, sender: "patient", text: "Chào bác sĩ, em vẫn uống thuốc đều nhưng thỉnh thoảng hơi chóng mặt", time: "15:31" },
    ]);

    const filtered = sessions.filter((s) => filter === "all" || s.status === filter);
    const activeSession = sessions.find((s) => s.id === showRoom);

    if (showRoom && activeSession) {
        return (
            <div className="p-6 md:p-8"><div className="max-w-6xl mx-auto space-y-4">
                {/* Room Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowRoom(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><span className="material-symbols-outlined text-[#687582]">arrow_back</span></button>
                        <div>
                            <h1 className="text-lg font-bold text-[#121417] dark:text-white">Phòng khám trực tuyến</h1>
                            <p className="text-sm text-[#687582]">{activeSession.patient} — {activeSession.reason}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm text-green-600 font-medium">Đang kết nối</span>
                    </div>
                </div>

                {/* Video + Chat */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: "calc(100vh - 240px)" }}>
                    {/* Video Area */}
                    <div className="lg:col-span-2 bg-gray-900 rounded-xl flex flex-col items-center justify-center relative">
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto rounded-full bg-gray-700 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-gray-400" style={{ fontSize: "40px" }}>person</span>
                            </div>
                            <p className="text-white text-sm">{activeSession.patient}</p>
                            <p className="text-gray-400 text-xs mt-1">Camera đang tắt</p>
                        </div>
                        {/* Controls */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                            {[
                                { icon: "mic", color: "bg-gray-700 hover:bg-gray-600" },
                                { icon: "videocam", color: "bg-gray-700 hover:bg-gray-600" },
                                { icon: "screen_share", color: "bg-gray-700 hover:bg-gray-600" },
                                { icon: "call_end", color: "bg-red-600 hover:bg-red-700" },
                            ].map((btn) => (
                                <button key={btn.icon} className={`p-3 rounded-full ${btn.color} text-white transition-colors`}>
                                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{btn.icon}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chat Panel */}
                    <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] flex flex-col">
                        <div className="p-3 border-b border-[#dde0e4] dark:border-[#2d353e]">
                            <h3 className="text-sm font-semibold text-[#121417] dark:text-white">Chat trong phiên khám</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                            {chatMessages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender === "doctor" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[85%] rounded-xl px-3 py-2 ${msg.sender === "doctor" ? "bg-[#3C81C6] text-white" : "bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-white"
                                        }`}>
                                        <p className="text-sm">{msg.text}</p>
                                        <p className={`text-[10px] mt-1 ${msg.sender === "doctor" ? "text-blue-200" : "text-[#687582]"}`}>{msg.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 border-t border-[#dde0e4] dark:border-[#2d353e] flex gap-2">
                            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && chatInput.trim()) {
                                        setChatMessages((prev) => [...prev, { id: Date.now(), sender: "doctor", text: chatInput, time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) }]);
                                        setChatInput("");
                                    }
                                }}
                                placeholder="Nhập tin nhắn..." className="flex-1 px-3 py-2 bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm outline-none focus:border-[#3C81C6]" />
                            <button className="p-2 bg-[#3C81C6] text-white rounded-lg"><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>send</span></button>
                        </div>
                    </div>
                </div>
            </div></div>
        );
    }

    return (
        <div className="p-6 md:p-8"><div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#121417] dark:text-white">Khám từ xa</h1>
                    <p className="text-sm text-[#687582] mt-1">Quản lý lịch khám trực tuyến và phòng khám ảo</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-medium transition-colors">
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>video_call</span>Tạo phiên khám mới
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                    { l: "Hôm nay", v: "3", i: "today", c: "from-blue-500 to-blue-600" },
                    { l: "Đang diễn ra", v: "1", i: "videocam", c: "from-green-500 to-green-600" },
                    { l: "Đã hoàn thành", v: "12", i: "check_circle", c: "from-teal-500 to-teal-600" },
                    { l: "Đã hủy", v: "2", i: "cancel", c: "from-red-500 to-red-600" },
                ].map((s) => (
                    <div key={s.l} className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.c} flex items-center justify-center`}>
                            <span className="material-symbols-outlined text-white" style={{ fontSize: "20px" }}>{s.i}</span>
                        </div>
                        <div><p className="text-xl font-bold text-[#121417] dark:text-white">{s.v}</p><p className="text-xs text-[#687582]">{s.l}</p></div>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {[{ k: "all", l: "Tất cả" }, { k: "scheduled", l: "Đã lên lịch" }, { k: "in_progress", l: "Đang diễn ra" }, { k: "completed", l: "Hoàn thành" }].map((f) => (
                    <button key={f.k} onClick={() => setFilter(f.k)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f.k ? "bg-[#3C81C6] text-white" : "bg-white dark:bg-[#1e242b] text-[#687582] border border-[#dde0e4] dark:border-[#2d353e] hover:bg-gray-50"}`}>
                        {f.l}
                    </button>
                ))}
            </div>

            {/* Sessions List */}
            <div className="space-y-3">
                {filtered.map((s) => (
                    <div key={s.id} className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-600" style={{ fontSize: "24px" }}>videocam</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-bold text-[#121417] dark:text-white">{s.patient}</p>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusMap[s.status].style}`}>{statusMap[s.status].label}</span>
                            </div>
                            <p className="text-xs text-[#687582]">{s.reason} • {s.department}</p>
                            <p className="text-xs text-[#687582] mt-0.5">{s.date} lúc {s.time}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {s.status === "scheduled" && (
                                <button onClick={() => setShowRoom(s.id)} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>videocam</span>Bắt đầu
                                </button>
                            )}
                            {s.status === "in_progress" && (
                                <button onClick={() => setShowRoom(s.id)} className="flex items-center gap-1.5 px-4 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-lg text-sm font-medium transition-colors">
                                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>login</span>Vào phòng
                                </button>
                            )}
                            {s.status === "completed" && (
                                <button className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-[#687582] rounded-lg text-sm font-medium">
                                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>description</span>Xem kết quả
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div></div>
    );
}
