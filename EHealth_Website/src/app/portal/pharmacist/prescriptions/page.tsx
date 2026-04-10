"use client";

import { useState, useMemo, useEffect } from "react";
import { prescriptionService } from "@/services/prescriptionService";

type RxStatus = "pending" | "checking" | "dispensed";

const MOCK_RX = [
    { id: "DT001", patient: "Nguyễn Văn An", doctor: "BS. Trần Minh", dept: "Nội khoa", date: "25/02/2025", medicines: [{ name: "Amoxicillin 500mg", qty: "20 viên", dosage: "2 viên/ngày" }, { name: "Paracetamol 500mg", qty: "10 viên", dosage: "Khi sốt" }, { name: "Omeprazole 20mg", qty: "14 viên", dosage: "1 viên/ngày" }], diagnosis: "Viêm họng cấp", status: "pending" as RxStatus, priority: false },
    { id: "DT002", patient: "Lê Thị Bình", doctor: "BS. Phạm Hoa", dept: "Da liễu", date: "25/02/2025", medicines: [{ name: "Cetirizine 10mg", qty: "30 viên", dosage: "1 viên/tối" }, { name: "Hydrocortisone cream", qty: "1 tuýp", dosage: "Bôi 2 lần/ngày" }], diagnosis: "Viêm da dị ứng", status: "pending" as RxStatus, priority: false },
    { id: "DT003", patient: "Trần Văn Cường", doctor: "BS. Ngô Đức", dept: "Tim mạch", date: "25/02/2025", medicines: [{ name: "Amlodipine 5mg", qty: "30 viên", dosage: "1 viên/sáng" }, { name: "Aspirin 81mg", qty: "30 viên", dosage: "1 viên/ngày" }, { name: "Atorvastatin 10mg", qty: "30 viên", dosage: "1 viên/tối" }], diagnosis: "Tăng HA, ĐTĐ type 2", status: "checking" as RxStatus, priority: true },
    { id: "DT004", patient: "Phạm Thị Dung", doctor: "BS. Trần Minh", dept: "Nội khoa", date: "25/02/2025", medicines: [{ name: "Vitamin B12", qty: "30 viên", dosage: "1 viên/ngày" }, { name: "Acid folic 5mg", qty: "30 viên", dosage: "1 viên/ngày" }], diagnosis: "Thiếu máu", status: "dispensed" as RxStatus, priority: false },
    { id: "DT005", patient: "Hoàng Văn Em", doctor: "BS. Lý Thanh", dept: "Nhi khoa", date: "25/02/2025", medicines: [{ name: "Amoxicillin siro", qty: "1 chai", dosage: "5ml x 3 lần/ngày" }, { name: "Paracetamol siro", qty: "1 chai", dosage: "Khi sốt" }], diagnosis: "Viêm đường hô hấp", status: "pending" as RxStatus, priority: true },
    { id: "DT006", patient: "Vũ Thị Fương", doctor: "BS. Phạm Hoa", dept: "Da liễu", date: "24/02/2025", medicines: [{ name: "Tretinoin cream", qty: "1 tuýp", dosage: "Bôi tối" }], diagnosis: "Mụn trứng cá", status: "dispensed" as RxStatus, priority: false },
];

const COLUMNS: { key: RxStatus; label: string; icon: string; color: string; bgColor: string }[] = [
    { key: "pending", label: "Chờ cấp phát", icon: "pending_actions", color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" },
    { key: "checking", label: "Đang kiểm tra", icon: "fact_check", color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" },
    { key: "dispensed", label: "Đã cấp phát", icon: "check_circle", color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" },
];

const INTERACTION_WARNINGS: Record<string, { drugs: string[]; warning: string; severity: "high" | "medium" }> = {
    DT003: { drugs: ["Aspirin 81mg", "Amlodipine 5mg"], warning: "Aspirin có thể tăng tác dụng hạ huyết áp của Amlodipine. Theo dõi HA.", severity: "medium" },
    DT005: { drugs: ["Amoxicillin siro", "Paracetamol siro"], warning: "Lưu ý liều dùng cho trẻ em theo cân nặng.", severity: "high" },
};

export default function PharmacistPrescriptions() {
    const [rxs, setRxs] = useState(MOCK_RX);

    useEffect(() => {
        prescriptionService.search({ limit: 100 })
            .then(res => {
                const items: any[] = res?.data?.data ?? res?.data ?? res ?? [];
                if (Array.isArray(items) && items.length > 0) {
                    const mapped = items.map((p: any) => ({
                        id: p.id, patient: p.patientName ?? "", doctor: p.doctorName ?? "",
                        dept: p.departmentName ?? "", date: p.createdAt?.split("T")[0] ?? "",
                        medicines: p.items ?? p.medicines ?? [], diagnosis: p.diagnosis ?? "",
                        status: (p.status === "PENDING" ? "pending" : p.status === "DISPENSED" ? "dispensed" : "checking") as RxStatus,
                        priority: p.priority === "urgent" || p.priority === true,
                    }));
                    setRxs(mapped);
                }
            })
            .catch(() => {/* keep mock */});
    }, []);
    const [search, setSearch] = useState("");
    const [detail, setDetail] = useState<string | null>(null);
    const [pharmacistNote, setPharmacistNote] = useState("");

    const filtered = useMemo(() => rxs.filter(r =>
        r.patient.toLowerCase().includes(search.toLowerCase()) || r.id.includes(search)
    ), [rxs, search]);

    const moveToChecking = (id: string) => setRxs(prev => prev.map(r => r.id === id ? { ...r, status: "checking" as RxStatus } : r));
    const moveToDispensed = (id: string) => setRxs(prev => prev.map(r => r.id === id ? { ...r, status: "dispensed" as RxStatus } : r));

    const detailRx = rxs.find(r => r.id === detail);
    const interactionWarning = detail ? INTERACTION_WARNINGS[detail] : null;

    return (
        <div className="p-6 md:p-8"><div className="max-w-full mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#121417] dark:text-white">Quản lý Đơn thuốc</h1>
                    <p className="text-sm text-[#687582] mt-1">Tiếp nhận, kiểm tra và cấp phát đơn thuốc từ bác sĩ</p>
                </div>
                <div className="relative w-full md:w-72">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#687582]" style={{ fontSize: "20px" }}>search</span>
                    <input type="text" placeholder="Tìm mã đơn, tên BN..." value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {COLUMNS.map(col => {
                    const count = rxs.filter(r => r.status === col.key).length;
                    return (
                        <div key={col.key} className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-4 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${col.bgColor}`}>
                                <span className={`material-symbols-outlined ${col.color}`}>{col.icon}</span>
                            </div>
                            <div><p className="text-xl font-bold text-[#121417] dark:text-white">{count}</p><p className="text-xs text-[#687582]">{col.label}</p></div>
                        </div>
                    );
                })}
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {COLUMNS.map(col => {
                    const colRxs = filtered.filter(r => r.status === col.key);
                    return (
                        <div key={col.key} className="space-y-3">
                            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${col.bgColor}`}>
                                <span className={`material-symbols-outlined ${col.color}`}>{col.icon}</span>
                                <h3 className={`text-sm font-bold ${col.color}`}>{col.label}</h3>
                                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${col.bgColor} ${col.color}`}>{colRxs.length}</span>
                            </div>
                            <div className="space-y-3 min-h-[200px]">
                                {colRxs.map(rx => {
                                    const hasWarning = INTERACTION_WARNINGS[rx.id];
                                    return (
                                        <div key={rx.id} onClick={() => setDetail(rx.id)}
                                            className={`bg-white dark:bg-[#1e242b] rounded-xl border ${hasWarning ? "border-red-300 dark:border-red-800" : "border-[#dde0e4] dark:border-[#2d353e]"} p-4 hover:shadow-md transition-all cursor-pointer group`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-mono text-[#3C81C6] font-bold">{rx.id}</span>
                                                <div className="flex items-center gap-1">
                                                    {rx.priority && <span className="material-symbols-outlined text-red-500 text-[16px]">priority_high</span>}
                                                    {hasWarning && <span className="material-symbols-outlined text-orange-500 text-[16px]">warning</span>}
                                                </div>
                                            </div>
                                            <p className="text-sm font-bold text-[#121417] dark:text-white">{rx.patient}</p>
                                            <p className="text-xs text-[#687582] mt-0.5">{rx.doctor} • {rx.dept}</p>
                                            <p className="text-xs text-[#687582] mt-1"><strong className="text-[#121417] dark:text-gray-300">CĐ:</strong> {rx.diagnosis}</p>
                                            <div className="mt-3 flex items-center justify-between">
                                                <div className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-teal-500 text-[14px]">medication</span>
                                                    <span className="text-xs text-[#687582]">{rx.medicines.length} thuốc</span>
                                                </div>
                                                {col.key === "pending" && (
                                                    <button onClick={e => { e.stopPropagation(); moveToChecking(rx.id); }}
                                                        className="text-xs font-medium text-[#3C81C6] hover:text-[#2a6da8] flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                                                        Kiểm tra <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                                    </button>
                                                )}
                                                {col.key === "checking" && (
                                                    <button onClick={e => { e.stopPropagation(); moveToDispensed(rx.id); }}
                                                        className="text-xs font-medium text-green-600 hover:text-green-700 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                                                        Cấp phát <span className="material-symbols-outlined text-[14px]">check</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {colRxs.length === 0 && (
                                    <div className="text-center py-8 text-[#b0b8c1]">
                                        <span className="material-symbols-outlined text-3xl mb-1 block">inbox</span>
                                        <p className="text-xs">Không có đơn</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Detail Modal */}
            {detailRx && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setDetail(null); setPharmacistNote(""); }}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e] flex items-center justify-between">
                            <h2 className="text-lg font-bold text-[#121417] dark:text-white">Chi tiết đơn {detailRx.id}</h2>
                            <button onClick={() => { setDetail(null); setPharmacistNote(""); }} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                <span className="material-symbols-outlined text-[#687582]">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-[#687582]">Bệnh nhân:</span><p className="font-semibold text-[#121417] dark:text-white">{detailRx.patient}</p></div>
                                <div><span className="text-[#687582]">Bác sĩ:</span><p className="font-semibold text-[#121417] dark:text-white">{detailRx.doctor}</p></div>
                                <div><span className="text-[#687582]">Khoa:</span><p className="font-medium">{detailRx.dept}</p></div>
                                <div><span className="text-[#687582]">Ngày:</span><p className="font-medium">{detailRx.date}</p></div>
                            </div>
                            <div><span className="text-sm text-[#687582]">Chẩn đoán:</span><p className="text-sm font-medium text-[#121417] dark:text-white">{detailRx.diagnosis}</p></div>

                            {/* Interaction Warning */}
                            {interactionWarning && (
                                <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${interactionWarning.severity === "high" ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800" : "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"}`}>
                                    <span className={`material-symbols-outlined text-[20px] mt-0.5 ${interactionWarning.severity === "high" ? "text-red-500" : "text-amber-500"}`}>warning</span>
                                    <div>
                                        <p className={`text-xs font-bold mb-0.5 ${interactionWarning.severity === "high" ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}`}>⚠ Cảnh báo tương tác thuốc</p>
                                        <p className={`text-xs ${interactionWarning.severity === "high" ? "text-red-600 dark:text-red-300" : "text-amber-600 dark:text-amber-300"}`}>
                                            <strong>{interactionWarning.drugs.join(" + ")}</strong>: {interactionWarning.warning}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Medicines Checklist */}
                            <div>
                                <p className="text-sm font-semibold text-[#121417] dark:text-white mb-2">Danh sách thuốc:</p>
                                <div className="space-y-2">
                                    {detailRx.medicines.map((m, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#f6f7f8] dark:bg-[#13191f]">
                                            <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>medication</span>
                                            <div className="flex-1">
                                                <span className="text-sm font-medium text-[#121417] dark:text-white">{m.name}</span>
                                                <span className="text-xs text-[#687582] ml-2">x {m.qty}</span>
                                                <p className="text-xs text-[#687582]">{m.dosage}</p>
                                            </div>
                                            {detailRx.status !== "dispensed" && (
                                                <span className="material-symbols-outlined text-green-500 text-[20px]">check_circle</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pharmacist Note */}
                            {detailRx.status !== "dispensed" && (
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ghi chú dược sĩ</label>
                                    <textarea value={pharmacistNote} onChange={e => setPharmacistNote(e.target.value)} rows={2} placeholder="Nhập ghi chú nếu cần..."
                                        className="w-full px-4 py-2.5 text-sm bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl outline-none focus:border-[#3C81C6] resize-none dark:text-white" />
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-[#dde0e4] dark:border-[#2d353e] flex justify-end gap-3">
                            <button className="px-4 py-2 text-sm font-medium text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2">
                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>print</span>In đơn
                            </button>
                            {detailRx.status === "pending" && (
                                <button onClick={() => { moveToChecking(detailRx.id); setDetail(null); }} className="px-4 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white text-sm font-medium rounded-lg flex items-center gap-2">
                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>fact_check</span>Bắt đầu kiểm tra
                                </button>
                            )}
                            {detailRx.status === "checking" && (
                                <button onClick={() => { moveToDispensed(detailRx.id); setDetail(null); }} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg flex items-center gap-2">
                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>done_all</span>Xác nhận cấp phát
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div></div>
    );
}
