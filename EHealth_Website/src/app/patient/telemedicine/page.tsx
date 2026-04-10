"use client";

import { useState } from "react";
import Link from "next/link";
import {
    MOCK_TELE_SESSIONS, MOCK_TELE_CHAT,
    type TeleMockSession, type TeleChatMessage,
} from "@/data/patient-portal-mock";

const TABS = [
    { id: "upcoming", label: "Sắp tới", icon: "event_upcoming" },
    { id: "completed", label: "Đã khám", icon: "task_alt" },
    { id: "cancelled", label: "Đã hủy", icon: "event_busy" },
];

export default function TelemedicinePage() {
    const [activeTab, setActiveTab] = useState("upcoming");
    const [selectedSession, setSelectedSession] = useState<TeleMockSession | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [showRating, setShowRating] = useState(false);
    const [chatInput, setChatInput] = useState("");

    const filtered = MOCK_TELE_SESSIONS.filter(s => {
        if (activeTab === "upcoming") return s.status === "scheduled" || s.status === "in_progress";
        if (activeTab === "completed") return s.status === "completed";
        return s.status === "cancelled";
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#121417] dark:text-white">Khám từ xa</h1>
                    <p className="text-sm text-[#687582] mt-0.5">Tư vấn online với bác sĩ qua video call</p>
                </div>
                <Link href="/booking?type=online" className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#3C81C6] to-[#2563eb] text-white text-sm font-semibold rounded-xl shadow-md shadow-[#3C81C6]/20 hover:shadow-lg transition-all">
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>videocam</span>Đặt lịch online
                </Link>
            </div>

            {/* Info Banner */}
            <div className="bg-gradient-to-r from-[#3C81C6]/5 to-[#60a5fa]/5 border border-[#3C81C6]/10 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: "24px" }}>video_camera_front</span>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-[#121417] dark:text-white">Khám bệnh trực tuyến tiện lợi</h3>
                    <p className="text-xs text-[#687582] mt-1">Tư vấn trực tiếp với bác sĩ chuyên khoa qua video call. Nhận đơn thuốc & chẩn đoán ngay tại nhà. Không cần di chuyển.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#f1f2f4] dark:bg-[#13191f] p-1 rounded-xl">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all
                        ${activeTab === tab.id ? "bg-white dark:bg-[#1e242b] text-[#3C81C6] shadow-sm" : "text-[#687582] hover:text-[#121417]"}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{tab.icon}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Sessions */}
            {filtered.length === 0 ? (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] py-16 text-center">
                    <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 mb-3" style={{ fontSize: "56px" }}>videocam_off</span>
                    <h3 className="text-lg font-semibold text-[#121417] dark:text-white mb-1">Không có lịch khám online</h3>
                    <p className="text-sm text-[#687582] mb-4">{activeTab === "upcoming" ? "Đặt lịch khám trực tuyến để bắt đầu" : ""}</p>
                    {activeTab === "upcoming" && (
                        <Link href="/booking?type=online" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#3C81C6] to-[#2563eb] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>videocam</span>Đặt lịch online
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(session => (
                        <div key={session.id} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] hover:shadow-md hover:border-[#3C81C6]/20 transition-all p-5">
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${session.status === "scheduled" ? "bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] shadow-lg shadow-[#3C81C6]/20" : session.status === "completed" ? "bg-green-100 dark:bg-green-500/10" : "bg-gray-100 dark:bg-gray-700"}`}>
                                    <span className={`material-symbols-outlined ${session.status === "scheduled" ? "text-white" : session.status === "completed" ? "text-green-600" : "text-gray-400"}`} style={{ fontSize: "24px" }}>
                                        {session.status === "scheduled" ? "videocam" : session.status === "completed" ? "check_circle" : "cancel"}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h4 className="text-sm font-bold text-[#121417] dark:text-white">{session.doctorName}</h4>
                                            <p className="text-xs text-[#687582] mt-0.5">{session.department}</p>
                                        </div>
                                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase
                                            ${session.status === "scheduled" ? "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400" : session.status === "completed" ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-gray-700 text-gray-500"}`}>
                                            {session.status === "scheduled" ? "Đã lên lịch" : session.status === "completed" ? "Hoàn thành" : "Đã hủy"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-[#687582]">
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: "14px" }}>event</span>{session.date}</span>
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: "14px" }}>schedule</span>{session.time}</span>
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: "14px" }}>timer</span>{session.duration} phút</span>
                                    </div>
                                    <p className="text-xs text-[#687582] mt-1.5">💬 {session.reason}</p>
                                    {session.diagnosis && (
                                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-500/10 rounded-lg">
                                            <p className="text-xs text-green-700 dark:text-green-400 font-medium">📋 Chẩn đoán: {session.diagnosis}</p>
                                        </div>
                                    )}
                                    {session.rating && (
                                        <div className="flex items-center gap-1 mt-2">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <span key={i} className={`material-symbols-outlined ${i < session.rating! ? "text-amber-400 fill-1" : "text-gray-200"}`} style={{ fontSize: "16px" }}>star</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#e5e7eb]/50 dark:border-[#2d353e]/50">
                                {session.status === "scheduled" && (
                                    <>
                                        <button className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#2563eb] rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1.5">
                                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>videocam</span>Vào phòng khám
                                        </button>
                                        <button onClick={() => { setSelectedSession(session); setShowChat(true); }} className="px-3 py-2 text-xs font-medium text-[#3C81C6] bg-[#3C81C6]/[0.06] rounded-lg hover:bg-[#3C81C6]/[0.12] flex items-center gap-1">
                                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chat</span>Nhắn tin
                                        </button>
                                        <button className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">Hủy lịch</button>
                                    </>
                                )}
                                {session.status === "completed" && (
                                    <>
                                        <button onClick={() => { setSelectedSession(session); setShowChat(true); }} className="px-3 py-2 text-xs font-medium text-[#687582] border border-[#e5e7eb] dark:border-[#2d353e] rounded-lg hover:bg-gray-50 dark:hover:bg-[#252d36] flex items-center gap-1">
                                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chat</span>Xem tin nhắn
                                        </button>
                                        {session.prescription && (
                                            <button className="px-3 py-2 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 flex items-center gap-1">
                                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>medication</span>Xem đơn thuốc
                                            </button>
                                        )}
                                        {!session.rating && (
                                            <button onClick={() => { setSelectedSession(session); setShowRating(true); }} className="px-3 py-2 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 flex items-center gap-1">
                                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>star</span>Đánh giá
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Chat Modal */}
            {showChat && selectedSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowChat(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ height: "70vh" }} onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center text-white text-xs font-bold">{selectedSession.doctorName.charAt(0)}</div>
                                <div><p className="text-sm font-bold text-[#121417] dark:text-white">{selectedSession.doctorName}</p><p className="text-xs text-[#687582]">{selectedSession.department}</p></div>
                            </div>
                            <button onClick={() => setShowChat(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><span className="material-symbols-outlined text-[#687582]">close</span></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {MOCK_TELE_CHAT.filter(m => m.sessionId === selectedSession.id).map(msg => (
                                <div key={msg.id} className={`flex ${msg.sender === "patient" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${msg.sender === "patient" ? "bg-[#3C81C6] text-white rounded-br-md" : "bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-white rounded-bl-md"}`}>
                                        <p>{msg.message}</p>
                                        <p className={`text-[10px] mt-1 ${msg.sender === "patient" ? "text-blue-200" : "text-[#687582]"}`}>{msg.timestamp}</p>
                                    </div>
                                </div>
                            ))}
                            {MOCK_TELE_CHAT.filter(m => m.sessionId === selectedSession.id).length === 0 && (
                                <div className="text-center py-8"><p className="text-sm text-[#687582]">Chưa có tin nhắn</p></div>
                            )}
                        </div>
                        <div className="p-4 border-t border-[#e5e7eb] dark:border-[#2d353e]">
                            <div className="flex gap-2">
                                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Nhập tin nhắn..."
                                    className="flex-1 px-4 py-2.5 border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl text-sm bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30" />
                                <button className="px-4 py-2.5 bg-[#3C81C6] text-white rounded-xl hover:bg-[#2a6da8] transition-colors">
                                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>send</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rating Modal */}
            {showRating && selectedSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowRating(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white text-center mb-2">Đánh giá tư vấn</h3>
                        <p className="text-sm text-[#687582] text-center mb-4">{selectedSession.doctorName}</p>
                        <div className="flex justify-center gap-2 mb-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <button key={i} className="text-gray-300 hover:text-amber-400 transition-colors">
                                    <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>star</span>
                                </button>
                            ))}
                        </div>
                        <textarea placeholder="Nhận xét (không bắt buộc)..."
                            className="w-full px-4 py-3 border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl text-sm bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 min-h-[80px] resize-none mb-4" />
                        <div className="flex gap-3">
                            <button onClick={() => setShowRating(false)} className="flex-1 py-2.5 text-sm font-medium text-[#687582] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl hover:bg-gray-50 dark:hover:bg-[#252d36]">Bỏ qua</button>
                            <button onClick={() => setShowRating(false)} className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#3C81C6] rounded-xl hover:bg-[#2a6da8]">Gửi đánh giá</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
