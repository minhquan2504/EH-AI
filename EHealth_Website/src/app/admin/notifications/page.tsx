"use client";

import { useState, useEffect } from "react";
import {
    getNotificationCategories,
    createNotificationCategory,
    getNotificationTemplates,
    createNotificationTemplate,
    sendAdminBroadcast,
    NotificationCategory,
    NotificationTemplate,
} from "@/services/notificationService";
import { useToast } from "@/contexts/ToastContext";

const MOCK_CATEGORIES: NotificationCategory[] = [
    { id: "cat1", name: "Lịch hẹn", code: "APPOINTMENT", description: "Thông báo liên quan đến lịch hẹn", isActive: true },
    { id: "cat2", name: "Kết quả xét nghiệm", code: "LAB_RESULT", description: "Thông báo kết quả xét nghiệm", isActive: true },
    { id: "cat3", name: "Thanh toán", code: "BILLING", description: "Thông báo thanh toán và hóa đơn", isActive: true },
    { id: "cat4", name: "Hệ thống", code: "SYSTEM", description: "Thông báo hệ thống và bảo trì", isActive: false },
];

const MOCK_TEMPLATES: NotificationTemplate[] = [
    { id: "t1", categoryId: "cat1", name: "Xác nhận lịch hẹn", subject: "Xác nhận lịch khám ngày {{date}}", content: "Kính gửi {{patientName}}, lịch khám của bạn vào {{time}} ngày {{date}} với {{doctorName}} đã được xác nhận.", variables: ["patientName", "date", "time", "doctorName"], isActive: true },
    { id: "t2", categoryId: "cat1", name: "Nhắc nhở lịch hẹn", subject: "Nhắc nhở: Lịch khám ngày mai", content: "Kính gửi {{patientName}}, nhắc bạn có lịch khám vào {{time}} ngày {{date}}. Vui lòng đến trước 15 phút.", variables: ["patientName", "date", "time"], isActive: true },
    { id: "t3", categoryId: "cat2", name: "Kết quả xét nghiệm sẵn sàng", subject: "Kết quả xét nghiệm của bạn đã có", content: "Kính gửi {{patientName}}, kết quả xét nghiệm ngày {{date}} đã được cập nhật. Vui lòng đăng nhập để xem.", variables: ["patientName", "date"], isActive: true },
    { id: "t4", categoryId: "cat3", name: "Xác nhận thanh toán", subject: "Xác nhận thanh toán hóa đơn {{invoiceId}}", content: "Hóa đơn {{invoiceId}} trị giá {{amount}} đã được thanh toán thành công.", variables: ["invoiceId", "amount"], isActive: true },
];

type ActiveTab = "categories" | "templates" | "broadcast";

export default function AdminNotifications() {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<ActiveTab>("categories");
    const [categories, setCategories] = useState<NotificationCategory[]>(MOCK_CATEGORIES);
    const [templates, setTemplates] = useState<NotificationTemplate[]>(MOCK_TEMPLATES);
    const [loadingCat, setLoadingCat] = useState(true);
    const [loadingTpl, setLoadingTpl] = useState(true);

    // Modal tạo category
    const [showCatModal, setShowCatModal] = useState(false);
    const [catForm, setCatForm] = useState({ name: "", code: "", description: "" });
    const [savingCat, setSavingCat] = useState(false);

    // Modal tạo template
    const [showTplModal, setShowTplModal] = useState(false);
    const [tplForm, setTplForm] = useState({ categoryId: "", name: "", subject: "", content: "", variables: "" });
    const [savingTpl, setSavingTpl] = useState(false);

    // Broadcast
    const [bcForm, setBcForm] = useState({ title: "", content: "", roles: [] as string[], channels: [] as string[] });
    const [sendingBc, setSendingBc] = useState(false);

    const ALL_ROLES = ["admin", "doctor", "receptionist", "pharmacist"];
    const ALL_CHANNELS = ["in_app", "email", "sms"];
    const CHANNEL_LABELS: Record<string, string> = { in_app: "In-App", email: "Email", sms: "SMS" };
    const ROLE_LABELS: Record<string, string> = { admin: "Admin", doctor: "Bác sĩ", receptionist: "Lễ tân", pharmacist: "Dược sĩ" };

    useEffect(() => {
        getNotificationCategories()
            .then(data => { if (data.length > 0) setCategories(data); })
            .catch(() => {})
            .finally(() => setLoadingCat(false));
    }, []);

    useEffect(() => {
        getNotificationTemplates()
            .then(data => { if (data.length > 0) setTemplates(data); })
            .catch(() => {})
            .finally(() => setLoadingTpl(false));
    }, []);

    const handleCreateCategory = async () => {
        if (!catForm.name || !catForm.code) { toast.error("Vui lòng điền tên và mã loại!"); return; }
        setSavingCat(true);
        try {
            await createNotificationCategory(catForm);
            setCategories(prev => [...prev, { id: Date.now().toString(), ...catForm, isActive: true }]);
            toast.success("Đã tạo loại thông báo!");
            setShowCatModal(false);
            setCatForm({ name: "", code: "", description: "" });
        } catch {
            toast.error("Tạo loại thông báo thất bại!");
        } finally { setSavingCat(false); }
    };

    const handleCreateTemplate = async () => {
        if (!tplForm.name || !tplForm.content) { toast.error("Vui lòng điền tên và nội dung mẫu!"); return; }
        setSavingTpl(true);
        try {
            const vars = tplForm.variables ? tplForm.variables.split(",").map(v => v.trim()).filter(Boolean) : [];
            await createNotificationTemplate({ ...tplForm, variables: vars });
            setTemplates(prev => [...prev, { id: Date.now().toString(), ...tplForm, variables: vars, isActive: true }]);
            toast.success("Đã tạo mẫu thông báo!");
            setShowTplModal(false);
            setTplForm({ categoryId: "", name: "", subject: "", content: "", variables: "" });
        } catch {
            toast.error("Tạo mẫu thất bại!");
        } finally { setSavingTpl(false); }
    };

    const handleBroadcast = async () => {
        if (!bcForm.title || !bcForm.content) { toast.error("Vui lòng điền tiêu đề và nội dung!"); return; }
        if (bcForm.roles.length === 0) { toast.error("Chọn ít nhất một nhóm nhận!"); return; }
        setSendingBc(true);
        try {
            await sendAdminBroadcast({ title: bcForm.title, content: bcForm.content, targetRoles: bcForm.roles });
            toast.success("Đã gửi thông báo thành công!");
            setBcForm({ title: "", content: "", roles: [], channels: [] });
        } catch {
            toast.error("Gửi thông báo thất bại!");
        } finally { setSendingBc(false); }
    };

    const toggleRole = (r: string) => setBcForm(prev => ({ ...prev, roles: prev.roles.includes(r) ? prev.roles.filter(x => x !== r) : [...prev.roles, r] }));
    const toggleChannel = (c: string) => setBcForm(prev => ({ ...prev, channels: prev.channels.includes(c) ? prev.channels.filter(x => x !== c) : [...prev.channels, c] }));

    const catOfTemplate = (categoryId: string) => categories.find(c => c.id === categoryId)?.name ?? "—";

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#121417] dark:text-white">Quản lý Thông báo</h1>
                        <p className="text-sm text-[#687582] mt-1">Cấu hình loại, mẫu thông báo và gửi thông báo hàng loạt</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { l: "Loại thông báo", v: categories.length, i: "category", c: "text-blue-600" },
                        { l: "Loại đang bật", v: categories.filter(c => c.isActive).length, i: "check_circle", c: "text-emerald-600" },
                        { l: "Tổng mẫu", v: templates.length, i: "description", c: "text-violet-600" },
                        { l: "Mẫu đang dùng", v: templates.filter(t => t.isActive).length, i: "task_alt", c: "text-amber-600" },
                    ].map(s => (
                        <div key={s.l} className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-4 flex items-center gap-3">
                            <span className={`material-symbols-outlined ${s.c}`} style={{ fontSize: "24px" }}>{s.i}</span>
                            <div><p className="text-lg font-bold text-[#121417] dark:text-white">{s.v}</p><p className="text-[11px] text-[#687582]">{s.l}</p></div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                    {([["categories", "Loại thông báo", "category"], ["templates", "Mẫu thông báo", "description"], ["broadcast", "Gửi hàng loạt", "send"]] as const).map(([key, label, icon]) => (
                        <button key={key} onClick={() => setActiveTab(key)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === key ? "bg-white dark:bg-[#1e242b] text-[#121417] dark:text-white shadow-sm" : "text-[#687582] hover:text-[#121417]"}`}>
                            <span className="material-symbols-outlined text-[18px]">{icon}</span>{label}
                        </button>
                    ))}
                </div>

                {/* ===== Tab: Categories ===== */}
                {activeTab === "categories" && (
                    <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                        <div className="p-4 border-b border-[#dde0e4] dark:border-[#2d353e] flex items-center justify-between">
                            <p className="text-sm font-semibold text-[#121417] dark:text-white">Danh sách loại thông báo ({categories.length})</p>
                            <button onClick={() => setShowCatModal(true)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-medium transition-colors">
                                <span className="material-symbols-outlined text-[18px]">add</span>Thêm loại
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead><tr className="border-b border-[#dde0e4] dark:border-[#2d353e]">
                                    {["Tên loại", "Mã", "Mô tả", "Trạng thái"].map(h => (
                                        <th key={h} className="px-4 py-3 text-xs font-semibold text-[#687582] uppercase">{h}</th>
                                    ))}
                                </tr></thead>
                                <tbody>
                                    {loadingCat ? (
                                        <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-[#687582]">Đang tải...</td></tr>
                                    ) : categories.map(cat => (
                                        <tr key={cat.id} className="border-b border-[#dde0e4] dark:border-[#2d353e] hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-4 py-3 text-sm font-semibold text-[#121417] dark:text-white">{cat.name}</td>
                                            <td className="px-4 py-3"><code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-[#3C81C6]">{cat.code}</code></td>
                                            <td className="px-4 py-3 text-sm text-[#687582]">{cat.description ?? "—"}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cat.isActive ? "bg-green-50 text-green-600 dark:bg-green-900/20" : "bg-gray-100 text-gray-500 dark:bg-gray-700"}`}>
                                                    {cat.isActive ? "Đang bật" : "Tắt"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ===== Tab: Templates ===== */}
                {activeTab === "templates" && (
                    <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                        <div className="p-4 border-b border-[#dde0e4] dark:border-[#2d353e] flex items-center justify-between">
                            <p className="text-sm font-semibold text-[#121417] dark:text-white">Mẫu thông báo ({templates.length})</p>
                            <button onClick={() => setShowTplModal(true)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-medium transition-colors">
                                <span className="material-symbols-outlined text-[18px]">add</span>Thêm mẫu
                            </button>
                        </div>
                        <div className="divide-y divide-[#dde0e4] dark:divide-[#2d353e]">
                            {loadingTpl ? (
                                <div className="p-8 text-center text-sm text-[#687582]">Đang tải...</div>
                            ) : templates.map(tpl => (
                                <div key={tpl.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <p className="text-sm font-semibold text-[#121417] dark:text-white">{tpl.name}</p>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-600">{catOfTemplate(tpl.categoryId)}</span>
                                                {!tpl.isActive && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">Tắt</span>}
                                            </div>
                                            {tpl.subject && <p className="text-xs text-[#687582] mb-1">Tiêu đề: <span className="italic">{tpl.subject}</span></p>}
                                            <p className="text-xs text-[#687582] line-clamp-2">{tpl.content}</p>
                                            {tpl.variables && tpl.variables.length > 0 && (
                                                <div className="flex gap-1 flex-wrap mt-2">
                                                    {tpl.variables.map(v => (
                                                        <code key={v} className="text-[10px] bg-amber-50 dark:bg-amber-900/20 text-amber-600 px-1.5 py-0.5 rounded">{"{{" + v + "}}"}</code>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ===== Tab: Broadcast ===== */}
                {activeTab === "broadcast" && (
                    <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-6 space-y-5">
                        <div>
                            <h3 className="text-base font-bold text-[#121417] dark:text-white mb-4">Gửi thông báo hàng loạt</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1">Tiêu đề *</label>
                                    <input type="text" value={bcForm.title} onChange={e => setBcForm(p => ({ ...p, title: e.target.value }))} placeholder="VD: Thông báo bảo trì hệ thống"
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1">Nội dung *</label>
                                    <textarea value={bcForm.content} onChange={e => setBcForm(p => ({ ...p, content: e.target.value }))} rows={4} placeholder="Nội dung thông báo..."
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 resize-none dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-2">Gửi đến nhóm *</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {ALL_ROLES.map(r => (
                                            <button key={r} onClick={() => toggleRole(r)}
                                                className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${bcForm.roles.includes(r) ? "bg-[#3C81C6] text-white border-[#3C81C6]" : "bg-white dark:bg-[#13191f] text-[#687582] border-[#dde0e4] dark:border-[#2d353e] hover:border-[#3C81C6]"}`}>
                                                {ROLE_LABELS[r]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-2">Kênh gửi</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {ALL_CHANNELS.map(c => (
                                            <button key={c} onClick={() => toggleChannel(c)}
                                                className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${bcForm.channels.includes(c) ? "bg-violet-600 text-white border-violet-600" : "bg-white dark:bg-[#13191f] text-[#687582] border-[#dde0e4] dark:border-[#2d353e] hover:border-violet-400"}`}>
                                                {CHANNEL_LABELS[c]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800">
                                    <span className="material-symbols-outlined text-amber-500 text-[18px] mt-0.5">warning</span>
                                    <p className="text-xs text-amber-700 dark:text-amber-400">Thông báo sẽ được gửi ngay lập tức đến <strong>tất cả người dùng</strong> thuộc nhóm được chọn. Hành động này không thể hoàn tác.</p>
                                </div>
                                <div className="flex justify-end">
                                    <button onClick={handleBroadcast} disabled={sendingBc || !bcForm.title || !bcForm.content || bcForm.roles.length === 0}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-40 shadow-md shadow-blue-200 dark:shadow-none">
                                        <span className="material-symbols-outlined text-[18px]">{sendingBc ? "hourglass_top" : "send"}</span>
                                        {sendingBc ? "Đang gửi..." : "Gửi thông báo"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal tạo Category */}
            {showCatModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCatModal(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                            <h2 className="text-base font-bold text-[#121417] dark:text-white">Tạo loại thông báo mới</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1">Tên loại *</label>
                                <input type="text" value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} placeholder="VD: Lịch hẹn"
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-[#3C81C6]/20" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1">Mã (code) *</label>
                                <input type="text" value={catForm.code} onChange={e => setCatForm(p => ({ ...p, code: e.target.value.toUpperCase().replace(/\s/g, "_") }))} placeholder="VD: APPOINTMENT"
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm font-mono outline-none dark:text-white focus:ring-2 focus:ring-[#3C81C6]/20" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1">Mô tả</label>
                                <textarea value={catForm.description} onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))} rows={2}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none dark:text-white resize-none" />
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#dde0e4] dark:border-[#2d353e] flex justify-end gap-3">
                            <button onClick={() => setShowCatModal(false)} className="px-4 py-2 text-sm text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">Hủy</button>
                            <button onClick={handleCreateCategory} disabled={savingCat}
                                className="px-5 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white text-sm font-bold rounded-xl disabled:opacity-40">
                                {savingCat ? "Đang lưu..." : "Tạo loại"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal tạo Template */}
            {showTplModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowTplModal(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                            <h2 className="text-base font-bold text-[#121417] dark:text-white">Tạo mẫu thông báo mới</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1">Loại thông báo</label>
                                <select value={tplForm.categoryId} onChange={e => setTplForm(p => ({ ...p, categoryId: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none dark:text-white">
                                    <option value="">-- Chọn loại --</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1">Tên mẫu *</label>
                                <input type="text" value={tplForm.name} onChange={e => setTplForm(p => ({ ...p, name: e.target.value }))} placeholder="VD: Xác nhận lịch hẹn"
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-[#3C81C6]/20" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1">Tiêu đề email</label>
                                <input type="text" value={tplForm.subject} onChange={e => setTplForm(p => ({ ...p, subject: e.target.value }))} placeholder="VD: Xác nhận lịch khám ngày {{date}}"
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1">Nội dung *</label>
                                <textarea value={tplForm.content} onChange={e => setTplForm(p => ({ ...p, content: e.target.value }))} rows={4} placeholder="Dùng {{biến}} để chèn dữ liệu động..."
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none dark:text-white resize-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1">Biến động (ngăn bởi dấu phẩy)</label>
                                <input type="text" value={tplForm.variables} onChange={e => setTplForm(p => ({ ...p, variables: e.target.value }))} placeholder="VD: patientName, date, time"
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm font-mono outline-none dark:text-white" />
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#dde0e4] dark:border-[#2d353e] flex justify-end gap-3">
                            <button onClick={() => setShowTplModal(false)} className="px-4 py-2 text-sm text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">Hủy</button>
                            <button onClick={handleCreateTemplate} disabled={savingTpl}
                                className="px-5 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white text-sm font-bold rounded-xl disabled:opacity-40">
                                {savingTpl ? "Đang lưu..." : "Tạo mẫu"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
