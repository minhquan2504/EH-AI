"use client";

import { useState, useEffect, useCallback } from "react";
import { telemedicineService, TelemedicineSession, DoctorStats, ConsultationResult, Prescription, FollowUp } from "@/services/telemedicineService";
import { extractErrorMessage } from "@/api/response";
import { useAuth } from "@/contexts/AuthContext";
import { AITelemedicineBrief } from "@/components/portal/ai";
import { usePageAIContext } from "@/hooks/usePageAIContext";

const STATUS_MAP: Record<string, { label: string; style: string }> = {
    scheduled:   { label: "Đã lên lịch",   style: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" },
    in_progress: { label: "Đang diễn ra",   style: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" },
    completed:   { label: "Hoàn thành",     style: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
    cancelled:   { label: "Đã hủy",         style: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" },
};

// ─── Component ─────────────────────────────────────────────────────────────────
export default function TelemedicinePage() {
    usePageAIContext({ pageKey: "telemedicine" });
    const { user } = useAuth();

    // ── Sessions ──
    const [sessions, setSessions] = useState<TelemedicineSession[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    // ── Stats ──
    const [stats, setStats] = useState<DoctorStats>({ today: 0, inProgress: 0, completed: 0, cancelled: 0 });

    // ── Room (video) ──
    const [showRoom, setShowRoom] = useState<string | null>(null);

    // ── AI Briefing ──
    const [briefingSession, setBriefingSession] = useState<TelemedicineSession | null>(null);

    // ── Chat in room ──
    const [chatInput, setChatInput] = useState("");
    const [chatMessages, setChatMessages] = useState<{ id: number; sender: string; text: string; time: string }[]>([]);
    const [roomLoading, setRoomLoading] = useState(false);
    const [roomError, setRoomError] = useState("");

    // ── Result modal ──
    const [showResult, setShowResult] = useState(false);
    const [resultSession, setResultSession] = useState<TelemedicineSession | null>(null);
    const [resultForm, setResultForm] = useState<Partial<ConsultationResult>>({ diagnosis: "", notes: "", recommendations: "" });
    const [resultSaving, setResultSaving] = useState(false);
    const [resultError, setResultError] = useState("");
    const [resultSuccess, setResultSuccess] = useState(false);

    // ── Prescription modal ──
    const [showPrescription, setShowPrescription] = useState(false);
    const [prescSession, setPrescSession] = useState<TelemedicineSession | null>(null);
    const [prescForm, setPrescForm] = useState<{ name: string; dosage: string; frequency: string; duration: string }[]>([
        { name: "", dosage: "", frequency: "", duration: "" }
    ]);
    const [prescNotes, setPrescNotes] = useState("");
    const [prescSaving, setPrescSaving] = useState(false);
    const [prescError, setPrescError] = useState("");
    const [prescSuccess, setPrescSuccess] = useState(false);

    // ── Follow-up modal ──
    const [showFollowUp, setShowFollowUp] = useState(false);
    const [followSession, setFollowSession] = useState<TelemedicineSession | null>(null);
    const [followDate, setFollowDate] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]);
    const [followReason, setFollowReason] = useState("");
    const [followSaving, setFollowSaving] = useState(false);
    const [followError, setFollowError] = useState("");
    const [followSuccess, setFollowSuccess] = useState(false);

    // ─────────────────────────────────────────────────────────────
    // Load sessions + stats
    // ─────────────────────────────────────────────────────────────
    const loadSessions = useCallback(() => {
        setSessionsLoading(true);
        telemedicineService
            .getList({ doctorId: user?.id, limit: 50 })
            .then(res => {
                const items = res.data ?? [];
                setSessions(items);
            })
            .catch(() => { setSessions([]); })
            .finally(() => setSessionsLoading(false));
    }, [user?.id]);

    useEffect(() => {
        loadSessions();
        telemedicineService
            .getStats({ doctorId: user?.id })
            .then(s => setStats(s))
            .catch(() => { /* stats empty state */ });
    }, [loadSessions, user?.id]);

    // ─────────────────────────────────────────────────────────────
    // Tham gia / bắt đầu phiên (start = join room)
    // ─────────────────────────────────────────────────────────────
    const handleJoinSession = (session: TelemedicineSession) => {
        setBriefingSession(session);
    };

    const enterRoom = async (sessionId: string) => {
        setRoomLoading(true);
        setRoomError("");
        try {
            // Nếu session là scheduled → start; in_progress → join
            const sess = sessions.find(s => s.id === sessionId);
            if (sess?.status === "scheduled") {
                await telemedicineService.joinRoom(sessionId); // POST /rooms/:id/join
            }
            setShowRoom(sessionId);
        } catch (e) {
            setRoomError(extractErrorMessage(e));
            // Vẫn vào phòng (placeholder) khi API fail
            setShowRoom(sessionId);
        } finally {
            setRoomLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Kết thúc phiên
    // ─────────────────────────────────────────────────────────────
    const handleEndSession = async (sessionId: string) => {
        try {
            await telemedicineService.closeRoom(sessionId);
            loadSessions();
        } catch { /* ignore */ }
        setShowRoom(null);
    };

    // ─────────────────────────────────────────────────────────────
    // Ghi kết quả
    // ─────────────────────────────────────────────────────────────
    const submitResult = async () => {
        if (!resultSession) return;
        setResultSaving(true);
        setResultError("");
        try {
            await telemedicineService.createResult({ ...resultForm, sessionId: resultSession.id } as ConsultationResult);
            setResultSuccess(true);
            setTimeout(() => { setShowResult(false); setResultSuccess(false); }, 1500);
        } catch (e) {
            setResultError(extractErrorMessage(e));
        } finally {
            setResultSaving(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Kê đơn
    // ─────────────────────────────────────────────────────────────
    const submitPrescription = async () => {
        if (!prescSession) return;
        const meds = prescForm.filter(m => m.name.trim());
        if (meds.length === 0) { setPrescError("Vui lòng nhập ít nhất 1 thuốc."); return; }
        setPrescSaving(true);
        setPrescError("");
        try {
            await telemedicineService.createPrescription({
                sessionId: prescSession.id,
                patientId: prescSession.patientId,
                medications: meds,
                notes: prescNotes,
            });
            setPrescSuccess(true);
            setTimeout(() => { setShowPrescription(false); setPrescSuccess(false); }, 1500);
        } catch (e) {
            setPrescError(extractErrorMessage(e));
        } finally {
            setPrescSaving(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Lịch tái khám
    // ─────────────────────────────────────────────────────────────
    const submitFollowUp = async () => {
        if (!followSession) return;
        setFollowSaving(true);
        setFollowError("");
        try {
            await telemedicineService.createFollowUp({
                sessionId: followSession.id,
                patientId: followSession.patientId,
                scheduledDate: followDate,
                reason: followReason,
            });
            setFollowSuccess(true);
            setTimeout(() => { setShowFollowUp(false); setFollowSuccess(false); }, 1500);
        } catch (e) {
            setFollowError(extractErrorMessage(e));
        } finally {
            setFollowSaving(false);
        }
    };

    const filtered = sessions.filter(s => filter === "all" || s.status === filter);
    const activeSession = sessions.find(s => s.id === showRoom);

    // ─────────────────────────────────────────────────────────────
    // Video Room view
    // ─────────────────────────────────────────────────────────────
    if (showRoom && activeSession) {
        return (
            <div className="p-6 md:p-8">
                <div className="max-w-6xl mx-auto space-y-4">
                    {/* Room Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setShowRoom(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                <span className="material-symbols-outlined text-[#687582]">arrow_back</span>
                            </button>
                            <div>
                                <h1 className="text-lg font-bold text-[#121417] dark:text-white">Phòng khám trực tuyến</h1>
                                <p className="text-sm text-[#687582]">{activeSession.patient} — {activeSession.reason}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-sm text-green-600 font-medium">Đang kết nối</span>
                            </div>
                            <button
                                onClick={() => handleEndSession(activeSession.id)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors">
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>call_end</span>Kết thúc
                            </button>
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
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                                {[
                                    { icon: "mic", color: "bg-gray-700 hover:bg-gray-600" },
                                    { icon: "videocam", color: "bg-gray-700 hover:bg-gray-600" },
                                    { icon: "screen_share", color: "bg-gray-700 hover:bg-gray-600" },
                                    { icon: "call_end", color: "bg-red-600 hover:bg-red-700" },
                                ].map(btn => (
                                    <button key={btn.icon}
                                        onClick={btn.icon === "call_end" ? () => handleEndSession(activeSession.id) : undefined}
                                        className={`p-3 rounded-full ${btn.color} text-white transition-colors`}>
                                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{btn.icon}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right Panel: Chat + Actions */}
                        <div className="flex flex-col gap-3 overflow-hidden">
                            {/* Chat */}
                            <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] flex flex-col flex-1 min-h-0">
                                <div className="p-3 border-b border-[#dde0e4] dark:border-[#2d353e]">
                                    <h3 className="text-sm font-semibold text-[#121417] dark:text-white">Chat trong phiên khám</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                    {chatMessages.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                                            <span className="material-symbols-outlined text-gray-300 text-4xl mb-2">chat</span>
                                            <p className="text-xs text-[#687582]">Chưa có tin nhắn. Bắt đầu cuộc trò chuyện với bệnh nhân.</p>
                                        </div>
                                    )}
                                    {chatMessages.map(msg => (
                                        <div key={msg.id} className={`flex ${msg.sender === "doctor" ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-[85%] rounded-xl px-3 py-2 ${msg.sender === "doctor" ? "bg-[#3C81C6] text-white" : "bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-white"}`}>
                                                <p className="text-sm">{msg.text}</p>
                                                <p className={`text-[10px] mt-1 ${msg.sender === "doctor" ? "text-blue-200" : "text-[#687582]"}`}>{msg.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 border-t border-[#dde0e4] dark:border-[#2d353e] flex gap-2">
                                    <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === "Enter" && chatInput.trim()) {
                                                setChatMessages(prev => [...prev, { id: Date.now(), sender: "doctor", text: chatInput, time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) }]);
                                                // Gửi qua API
                                                telemedicineService.sendMessage(activeSession.id, chatInput.trim()).catch(() => {});
                                                setChatInput("");
                                            }
                                        }}
                                        aria-label="Nhập tin nhắn"
                                        placeholder="Nhập tin nhắn..."
                                        className="flex-1 px-3 py-2 bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm outline-none focus:border-[#3C81C6]" />
                                    <button
                                        onClick={() => {
                                            if (!chatInput.trim()) return;
                                            setChatMessages(prev => [...prev, { id: Date.now(), sender: "doctor", text: chatInput, time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) }]);
                                            telemedicineService.sendMessage(activeSession.id, chatInput.trim()).catch(() => {});
                                            setChatInput("");
                                        }}
                                        aria-label="Gửi tin nhắn"
                                        className="p-2 bg-[#3C81C6] text-white rounded-lg">
                                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>send</span>
                                    </button>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-3 space-y-2">
                                <h3 className="text-xs font-semibold text-[#121417] dark:text-white mb-2">Thao tác nhanh</h3>
                                <button
                                    onClick={() => { setResultSession(activeSession); setResultForm({ diagnosis: "", notes: "", recommendations: "" }); setResultError(""); setResultSuccess(false); setShowResult(true); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#121417] dark:text-white border border-[#dde0e4] dark:border-[#2d353e] rounded-lg hover:bg-gray-50 dark:hover:bg-[#252d36]">
                                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "16px" }}>description</span>Ghi kết quả khám
                                </button>
                                <button
                                    onClick={() => { setPrescSession(activeSession); setPrescForm([{ name: "", dosage: "", frequency: "", duration: "" }]); setPrescNotes(""); setPrescError(""); setPrescSuccess(false); setShowPrescription(true); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#121417] dark:text-white border border-[#dde0e4] dark:border-[#2d353e] rounded-lg hover:bg-gray-50 dark:hover:bg-[#252d36]">
                                    <span className="material-symbols-outlined text-green-600" style={{ fontSize: "16px" }}>medication</span>Kê đơn thuốc
                                </button>
                                <button
                                    onClick={() => { setFollowSession(activeSession); setFollowReason(""); setFollowError(""); setFollowSuccess(false); setShowFollowUp(true); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#121417] dark:text-white border border-[#dde0e4] dark:border-[#2d353e] rounded-lg hover:bg-gray-50 dark:hover:bg-[#252d36]">
                                    <span className="material-symbols-outlined text-amber-500" style={{ fontSize: "16px" }}>event_repeat</span>Lịch tái khám
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modals rendered inside room view too */}
                {renderResultModal()}
                {renderPrescriptionModal()}
                {renderFollowUpModal()}
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────
    // Modal: Ghi kết quả
    // ─────────────────────────────────────────────────────────────
    function renderResultModal() {
        if (!showResult || !resultSession) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowResult(false)}>
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white">Ghi kết quả khám</h3>
                        <button onClick={() => setShowResult(false)} aria-label="Đóng" className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                            <span className="material-symbols-outlined text-[#687582]">close</span>
                        </button>
                    </div>
                    <p className="text-xs text-[#687582] mb-4">Bệnh nhân: <span className="font-semibold text-[#121417] dark:text-white">{resultSession.patient}</span></p>
                    {resultSuccess && (
                        <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 rounded-xl text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check_circle</span>Lưu kết quả thành công!
                        </div>
                    )}
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-semibold text-[#687582] mb-1 block">Chẩn đoán</label>
                            <input type="text" value={resultForm.diagnosis ?? ""} onChange={e => setResultForm(f => ({ ...f, diagnosis: e.target.value }))}
                                aria-label="Chẩn đoán"
                                placeholder="Nhập chẩn đoán..."
                                className="w-full px-4 py-2.5 border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl text-sm bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-[#687582] mb-1 block">Ghi chú khám</label>
                            <textarea value={resultForm.notes ?? ""} onChange={e => setResultForm(f => ({ ...f, notes: e.target.value }))}
                                placeholder="Ghi chú về kết quả khám..."
                                className="w-full px-4 py-3 border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl text-sm bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 min-h-[80px] resize-none" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-[#687582] mb-1 block">Khuyến nghị</label>
                            <textarea value={resultForm.recommendations ?? ""} onChange={e => setResultForm(f => ({ ...f, recommendations: e.target.value }))}
                                placeholder="Khuyến nghị cho bệnh nhân..."
                                className="w-full px-4 py-3 border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl text-sm bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 min-h-[60px] resize-none" />
                        </div>
                    </div>
                    {resultError && <p className="text-xs text-red-500 mt-2">{resultError}</p>}
                    <div className="flex gap-3 mt-4">
                        <button onClick={() => setShowResult(false)} className="flex-1 py-2.5 text-sm font-medium text-[#687582] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl hover:bg-gray-50 dark:hover:bg-[#252d36]">Hủy</button>
                        <button onClick={submitResult} disabled={resultSaving}
                            className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#3C81C6] rounded-xl hover:bg-[#2a6da8] disabled:opacity-60">
                            {resultSaving ? "Đang lưu..." : "Lưu kết quả"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────
    // Modal: Kê đơn thuốc
    // ─────────────────────────────────────────────────────────────
    function renderPrescriptionModal() {
        if (!showPrescription || !prescSession) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowPrescription(false)}>
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white">Kê đơn thuốc từ xa</h3>
                        <button onClick={() => setShowPrescription(false)} aria-label="Đóng" className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                            <span className="material-symbols-outlined text-[#687582]">close</span>
                        </button>
                    </div>
                    <p className="text-xs text-[#687582] mb-4">Bệnh nhân: <span className="font-semibold text-[#121417] dark:text-white">{prescSession.patient}</span></p>
                    {prescSuccess && (
                        <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check_circle</span>Kê đơn thành công!
                        </div>
                    )}
                    <div className="space-y-3">
                        {prescForm.map((med, idx) => (
                            <div key={idx} className="p-3 bg-[#f6f7f8] dark:bg-[#13191f] rounded-xl space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-[#687582]">Thuốc {idx + 1}</span>
                                    {prescForm.length > 1 && (
                                        <button onClick={() => setPrescForm(f => f.filter((_, i) => i !== idx))}
                                            aria-label="Xóa thuốc"
                                            className="text-red-500 hover:text-red-700">
                                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
                                        </button>
                                    )}
                                </div>
                                <input type="text" value={med.name} onChange={e => setPrescForm(f => f.map((m, i) => i === idx ? { ...m, name: e.target.value } : m))}
                                    aria-label="Tên thuốc" placeholder="Tên thuốc *" className="w-full px-3 py-2 border border-[#e5e7eb] dark:border-[#2d353e] rounded-lg text-sm bg-white dark:bg-[#1e242b] text-[#121417] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30" />
                                <div className="grid grid-cols-3 gap-2">
                                    <input type="text" value={med.dosage} onChange={e => setPrescForm(f => f.map((m, i) => i === idx ? { ...m, dosage: e.target.value } : m))}
                                        aria-label="Liều lượng" placeholder="Liều lượng" className="px-3 py-2 border border-[#e5e7eb] dark:border-[#2d353e] rounded-lg text-sm bg-white dark:bg-[#1e242b] text-[#121417] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30" />
                                    <input type="text" value={med.frequency} onChange={e => setPrescForm(f => f.map((m, i) => i === idx ? { ...m, frequency: e.target.value } : m))}
                                        aria-label="Tần suất dùng thuốc" placeholder="Tần suất" className="px-3 py-2 border border-[#e5e7eb] dark:border-[#2d353e] rounded-lg text-sm bg-white dark:bg-[#1e242b] text-[#121417] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30" />
                                    <input type="text" value={med.duration} onChange={e => setPrescForm(f => f.map((m, i) => i === idx ? { ...m, duration: e.target.value } : m))}
                                        aria-label="Thời gian dùng thuốc" placeholder="Thời gian" className="px-3 py-2 border border-[#e5e7eb] dark:border-[#2d353e] rounded-lg text-sm bg-white dark:bg-[#1e242b] text-[#121417] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30" />
                                </div>
                            </div>
                        ))}
                        <button onClick={() => setPrescForm(f => [...f, { name: "", dosage: "", frequency: "", duration: "" }])}
                            className="w-full py-2 border-2 border-dashed border-[#3C81C6]/30 rounded-xl text-xs text-[#3C81C6] hover:border-[#3C81C6]/60 flex items-center justify-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add</span>Thêm thuốc
                        </button>
                        <div>
                            <label className="text-xs font-semibold text-[#687582] mb-1 block">Ghi chú đơn thuốc</label>
                            <textarea value={prescNotes} onChange={e => setPrescNotes(e.target.value)}
                                placeholder="Lưu ý khi dùng thuốc..."
                                className="w-full px-4 py-3 border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl text-sm bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 min-h-[60px] resize-none" />
                        </div>
                    </div>
                    {prescError && <p className="text-xs text-red-500 mt-2">{prescError}</p>}
                    <div className="flex gap-3 mt-4">
                        <button onClick={() => setShowPrescription(false)} className="flex-1 py-2.5 text-sm font-medium text-[#687582] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl hover:bg-gray-50 dark:hover:bg-[#252d36]">Hủy</button>
                        <button onClick={submitPrescription} disabled={prescSaving}
                            className="flex-1 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-60">
                            {prescSaving ? "Đang kê đơn..." : "Xác nhận kê đơn"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────
    // Modal: Lịch tái khám
    // ─────────────────────────────────────────────────────────────
    function renderFollowUpModal() {
        if (!showFollowUp || !followSession) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowFollowUp(false)}>
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white">Lịch tái khám</h3>
                        <button onClick={() => setShowFollowUp(false)} aria-label="Đóng" className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                            <span className="material-symbols-outlined text-[#687582]">close</span>
                        </button>
                    </div>
                    <p className="text-xs text-[#687582] mb-4">Bệnh nhân: <span className="font-semibold text-[#121417] dark:text-white">{followSession.patient}</span></p>
                    {followSuccess && (
                        <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check_circle</span>Đã đặt lịch tái khám!
                        </div>
                    )}
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-semibold text-[#687582] mb-1 block">Ngày tái khám</label>
                            <input type="date" value={followDate} onChange={e => setFollowDate(e.target.value)}
                                className="w-full px-4 py-2.5 border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl text-sm bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-[#687582] mb-1 block">Lý do tái khám</label>
                            <textarea value={followReason} onChange={e => setFollowReason(e.target.value)}
                                placeholder="Lý do cần tái khám..."
                                className="w-full px-4 py-3 border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl text-sm bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 min-h-[70px] resize-none" />
                        </div>
                    </div>
                    {followError && <p className="text-xs text-red-500 mt-2">{followError}</p>}
                    <div className="flex gap-3 mt-4">
                        <button onClick={() => setShowFollowUp(false)} className="flex-1 py-2.5 text-sm font-medium text-[#687582] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl hover:bg-gray-50 dark:hover:bg-[#252d36]">Hủy</button>
                        <button onClick={submitFollowUp} disabled={followSaving}
                            className="flex-1 py-2.5 text-sm font-semibold text-white bg-amber-500 rounded-xl hover:bg-amber-600 disabled:opacity-60">
                            {followSaving ? "Đang lưu..." : "Xác nhận"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────
    // Dashboard main view
    // ─────────────────────────────────────────────────────────────
    return (
        <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { l: "Hôm nay", v: String(stats.today), i: "today", c: "from-blue-500 to-blue-600" },
                        { l: "Đang diễn ra", v: String(stats.inProgress), i: "videocam", c: "from-green-500 to-green-600" },
                        { l: "Đã hoàn thành", v: String(stats.completed), i: "check_circle", c: "from-teal-500 to-teal-600" },
                        { l: "Đã hủy", v: String(stats.cancelled), i: "cancel", c: "from-red-500 to-red-600" },
                    ].map(s => (
                        <div key={s.l} className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.c} flex items-center justify-center flex-shrink-0`}>
                                <span className="material-symbols-outlined text-white" style={{ fontSize: "20px" }}>{s.i}</span>
                            </div>
                            <div><p className="text-xl font-bold text-[#121417] dark:text-white">{s.v}</p><p className="text-xs text-[#687582]">{s.l}</p></div>
                        </div>
                    ))}
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 flex-wrap">
                    {[
                        { k: "all", l: "Tất cả" },
                        { k: "scheduled", l: "Đã lên lịch" },
                        { k: "in_progress", l: "Đang diễn ra" },
                        { k: "completed", l: "Hoàn thành" },
                    ].map(f => (
                        <button key={f.k} onClick={() => setFilter(f.k)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f.k ? "bg-[#3C81C6] text-white" : "bg-white dark:bg-[#1e242b] text-[#687582] border border-[#dde0e4] dark:border-[#2d353e] hover:bg-gray-50"}`}>
                            {f.l}
                        </button>
                    ))}
                </div>

                {/* Sessions List */}
                {sessionsLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-5 animate-pulse flex gap-4">
                                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] py-12 text-center">
                        <span className="material-symbols-outlined text-gray-300 dark:text-gray-600" style={{ fontSize: "48px" }}>videocam_off</span>
                        <p className="text-sm text-[#687582] mt-2">Không có phiên khám nào</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(s => (
                            <div key={s.id} className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-outlined text-blue-600" style={{ fontSize: "24px" }}>videocam</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <p className="text-sm font-bold text-[#121417] dark:text-white">{s.patient}</p>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_MAP[s.status]?.style ?? ""}`}>
                                            {STATUS_MAP[s.status]?.label ?? s.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#687582]">{s.reason} • {s.department}</p>
                                    <p className="text-xs text-[#687582] mt-0.5">{s.date} lúc {s.time}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                                    {(s.status === "scheduled" || s.status === "in_progress") && (
                                        <button
                                            onClick={() => handleJoinSession(s)}
                                            disabled={roomLoading}
                                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                                ${s.status === "scheduled"
                                                    ? "bg-green-600 hover:bg-green-700 text-white"
                                                    : "bg-[#3C81C6] hover:bg-[#2a6da8] text-white"}`}>
                                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                                                {s.status === "scheduled" ? "play_circle" : "login"}
                                            </span>
                                            {s.status === "scheduled" ? "Bắt đầu" : "Vào phòng"}
                                        </button>
                                    )}
                                    {s.status === "completed" && (
                                        <>
                                            <button
                                                onClick={() => { setResultSession(s); setResultForm({ diagnosis: "", notes: "", recommendations: "" }); setResultError(""); setResultSuccess(false); setShowResult(true); }}
                                                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-[#687582] rounded-lg text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600">
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>description</span>Kết quả
                                            </button>
                                            <button
                                                onClick={() => { setPrescSession(s); setPrescForm([{ name: "", dosage: "", frequency: "", duration: "" }]); setPrescNotes(""); setPrescError(""); setPrescSuccess(false); setShowPrescription(true); }}
                                                className="flex items-center gap-1.5 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900/30">
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>medication</span>Đơn thuốc
                                            </button>
                                            <button
                                                onClick={() => { setFollowSession(s); setFollowReason(""); setFollowError(""); setFollowSuccess(false); setShowFollowUp(true); }}
                                                className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30">
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>event_repeat</span>Tái khám
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* AI Pre-Session Briefing Modal */}
            {briefingSession && (
                <AITelemedicineBrief
                    patientId={briefingSession.patientId}
                    patientName={briefingSession.patient}
                    sessionReason={briefingSession.reason ?? ""}
                    visible={!!briefingSession}
                    onAcknowledge={() => {
                        const sessionId = briefingSession.id;
                        setBriefingSession(null);
                        enterRoom(sessionId);
                    }}
                    onClose={() => setBriefingSession(null)}
                />
            )}

            {/* Modals */}
            {renderResultModal()}
            {renderPrescriptionModal()}
            {renderFollowUpModal()}
        </div>
    );
}
