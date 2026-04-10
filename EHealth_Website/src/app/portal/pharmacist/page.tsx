"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { prescriptionService } from "@/services/prescriptionService";
import { getDrugs } from "@/services/medicineService";
import { usePageAIContext } from "@/hooks/usePageAIContext";
import { AIInventoryPredictor } from "@/components/portal/ai";

// ==================== MOCK DATA ====================
const STATS = [
    { label: "Đơn chờ cấp phát", value: "15", icon: "pending_actions", bg: "bg-amber-50 dark:bg-amber-900/20", color: "text-amber-600", badge: "Cần xử lý", badgeColor: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
    { label: "Đã cấp hôm nay", value: "42", icon: "check_circle", bg: "bg-emerald-50 dark:bg-emerald-900/20", color: "text-emerald-600", badge: "+8 so với hôm qua", badgeColor: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" },
    { label: "Thuốc sắp hết", value: "07", icon: "warning", bg: "bg-red-50 dark:bg-red-900/20", color: "text-red-500", badge: "Cần nhập thêm", badgeColor: "text-red-600 bg-red-50 dark:bg-red-900/20" },
    { label: "Tổng thuốc trong kho", value: "1,247", icon: "inventory_2", bg: "bg-blue-50 dark:bg-blue-900/20", color: "text-blue-600", badge: "98% đạt chuẩn", badgeColor: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
];

const PENDING_PRESCRIPTIONS = [
    { id: "DT001", patient: "Nguyễn Văn An", doctor: "BS. Trần Minh", dept: "Nội khoa", time: "08:45", medicines: 3, urgent: false },
    { id: "DT002", patient: "Lê Thị Bình", doctor: "BS. Phạm Hoa", dept: "Da liễu", time: "09:00", medicines: 2, urgent: false },
    { id: "DT003", patient: "Trần Văn Cường", doctor: "BS. Ngô Đức", dept: "Tim mạch", time: "09:10", medicines: 5, urgent: true },
    { id: "DT004", patient: "Phạm Thị Dung", doctor: "BS. Trần Minh", dept: "Nội khoa", time: "09:20", medicines: 2, urgent: false },
    { id: "DT005", patient: "Hoàng Văn Em", doctor: "BS. Lý Thanh", dept: "Nhi khoa", time: "09:35", medicines: 4, urgent: true },
];

const LOW_STOCK = [
    { name: "Amoxicillin 500mg", stock: 45, min: 100, unit: "viên" },
    { name: "Paracetamol 500mg", stock: 30, min: 200, unit: "viên" },
    { name: "Vitamin C 1000mg", stock: 12, min: 50, unit: "viên" },
    { name: "Omeprazole 20mg", stock: 25, min: 80, unit: "viên" },
    { name: "Cefuroxime 500mg", stock: 18, min: 60, unit: "viên" },
];

const RECENT_DISPENSES = [
    { id: "CP001", patient: "Trần Minh Thủy", medicines: 3, time: "08:30", total: "125,000₫" },
    { id: "CP002", patient: "Nguyễn Hoàng Long", medicines: 2, time: "08:15", total: "89,000₫" },
    { id: "CP003", patient: "Phạm Thị Hương", medicines: 4, time: "08:00", total: "210,000₫" },
    { id: "CP004", patient: "Lê Văn Tân", medicines: 1, time: "07:45", total: "45,000₫" },
];

// ==================== HELPERS ====================
function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "Chào buổi sáng";
    if (h < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
}

function getCurrentDate(): string {
    const now = new Date();
    const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    return `${days[now.getDay()]}, ${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
}

// ==================== PAGE ====================
export default function PharmacistDashboard() {
    const router = useRouter();
    usePageAIContext({ pageKey: 'dashboard' });
    const [filter, setFilter] = useState<"all" | "urgent">("all");
    const [pendingPrescriptions, setPendingPrescriptions] = useState(PENDING_PRESCRIPTIONS);
    const [lowStock, setLowStock] = useState(LOW_STOCK);
    const [stats, setStats] = useState(STATS);

    useEffect(() => {
        prescriptionService.getList({ status: "pending", limit: 20 })
            .then(res => {
                const items: any[] = res?.data?.data ?? res?.data ?? [];
                if (items.length > 0) {
                    const mapped = items.map((p: any) => ({
                        id: p.id, patient: p.patientName ?? "", doctor: p.doctorName ?? "",
                        dept: p.departmentName ?? "", time: p.createdAt?.split("T")[1]?.slice(0, 5) ?? "",
                        medicines: p.items?.length ?? 0, urgent: p.priority === "urgent",
                    }));
                    setPendingPrescriptions(mapped);
                    setStats(prev => prev.map((s, i) => i === 0 ? { ...s, value: String(items.length) } : s));
                }
            })
            .catch(() => {});
        getDrugs({ status: "low_stock", limit: 5 })
            .then(res => {
                const items: any[] = res?.data ?? [];
                if (items.length > 0) {
                    setLowStock(items.map((d: any) => ({ name: d.name, stock: d.quantity, min: d.minQuantity, unit: d.unit })));
                    setStats(prev => prev.map((s, i) => i === 2 ? { ...s, value: String(items.length) } : s));
                }
            })
            .catch(() => {});
    }, []);

    const filtered = filter === "urgent" ? pendingPrescriptions.filter((p) => p.urgent) : pendingPrescriptions;

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* ===== HEADER ===== */}
                <div>
                    <div className="flex items-center gap-1.5 text-xs text-[#687582] dark:text-gray-500 mb-3">
                        <span className="material-symbols-outlined text-[14px]">home</span>
                        <span>Trang chủ</span>
                        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                        <span className="text-[#121417] dark:text-white font-medium">Bảng điều khiển</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-[#121417] dark:text-white">
                                {getGreeting()}, <span className="text-[#3C81C6]">DS. Trần Văn Dược</span> 💊
                            </h1>
                            <p className="text-[#687582] dark:text-gray-400 mt-0.5 text-sm">Quầy phát thuốc số 2 — Ca sáng</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#687582] dark:text-gray-400">
                            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                            <span>{getCurrentDate()}</span>
                        </div>
                    </div>
                </div>

                {/* ===== STATS ===== */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    {STATS.map((s) => (
                        <div key={s.label} className="bg-white dark:bg-[#1e242b] p-5 rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-[#3C81C6]/40 dark:hover:border-[#3C81C6]/30 transition-all cursor-pointer">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[#687582] dark:text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wider">{s.label}</p>
                                    <h3 className="text-[28px] font-extrabold text-[#121417] dark:text-white leading-none">{s.value}</h3>
                                </div>
                                <div className={`p-2.5 ${s.bg} rounded-xl ${s.color} group-hover:scale-110 transition-transform flex-shrink-0`}>
                                    <span className="material-symbols-outlined text-[22px]">{s.icon}</span>
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-[#f0f1f3] dark:border-[#2d353e]">
                                <span className={`inline-flex items-center text-xs font-bold ${s.badgeColor} px-2 py-0.5 rounded-md`}>
                                    {s.badge}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ===== AI INVENTORY PREDICTOR ===== */}
                <AIInventoryPredictor />

                {/* ===== MAIN GRID ===== */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Đơn thuốc chờ cấp phát */}
                    <div className="lg:col-span-2 bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                        <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                    <span className="material-symbols-outlined text-amber-600 text-[20px]">medication</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-[#121417] dark:text-white">Đơn thuốc chờ cấp phát</h3>
                                    <p className="text-xs text-[#687582] dark:text-gray-500">{filtered.length} đơn cần xử lý</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link href={ROUTES.PORTAL.PHARMACIST.PRESCRIPTIONS} className="text-xs text-[#3C81C6] hover:underline font-medium mr-2">
                                    Xem tất cả
                                </Link>
                                <button
                                    onClick={() => setFilter("all")}
                                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${filter === "all" ? "bg-[#3C81C6] text-white" : "text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                                >
                                    Tất cả
                                </button>
                                <button
                                    onClick={() => setFilter("urgent")}
                                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${filter === "urgent" ? "bg-red-500 text-white" : "text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                                >
                                    Khẩn cấp
                                </button>
                            </div>
                        </div>
                        <div className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e]">
                            {filtered.map((rx) => (
                                <div key={rx.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-[#f6f7f8] dark:hover:bg-[#13191f] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${rx.urgent ? "bg-red-50 dark:bg-red-500/10" : "bg-[#3C81C6]/10"}`}>
                                            <span className={`material-symbols-outlined text-[18px] ${rx.urgent ? "text-red-500" : "text-[#3C81C6]"}`}>
                                                {rx.urgent ? "priority_high" : "receipt_long"}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-[#121417] dark:text-white">{rx.patient}</p>
                                                {rx.urgent && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 dark:bg-red-500/10 text-red-500">KHẨN</span>}
                                            </div>
                                            <p className="text-xs text-[#687582] dark:text-gray-500">{rx.doctor} • {rx.dept} • {rx.medicines} thuốc</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-[#687582] dark:text-gray-500 bg-[#f6f7f8] dark:bg-[#13191f] px-2 py-0.5 rounded">{rx.time}</span>
                                        <button onClick={() => router.push('/portal/pharmacist/dispensing')} className="px-3 py-1.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white text-xs font-medium rounded-lg transition-colors">Cấp phát</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cột phải */}
                    <div className="space-y-6">
                        {/* Thuốc sắp hết */}
                        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                            <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                        <span className="material-symbols-outlined text-red-500 text-[20px]">warning</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">Thuốc sắp hết</h3>
                                        <p className="text-xs text-[#687582] dark:text-gray-500">{LOW_STOCK.length} loại cần nhập</p>
                                    </div>
                                </div>
                                <Link href={ROUTES.PORTAL.PHARMACIST.INVENTORY} className="text-xs text-[#3C81C6] hover:underline font-medium">
                                    Quản lý kho
                                </Link>
                            </div>
                            <div className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e]">
                                {LOW_STOCK.map((med) => (
                                    <div key={med.name} className="px-5 py-3">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <p className="text-sm font-medium text-[#121417] dark:text-white">{med.name}</p>
                                            <span className={`text-xs font-bold ${med.stock / med.min < 0.3 ? "text-red-500" : "text-amber-500"}`}>
                                                {med.stock}/{med.min}
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all ${med.stock / med.min < 0.3 ? "bg-red-500" : "bg-amber-500"}`}
                                                style={{ width: `${Math.min((med.stock / med.min) * 100, 100)}%` }} />
                                        </div>
                                        <p className="text-[10px] text-[#687582] dark:text-gray-500 mt-1">Còn {med.stock} {med.unit}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Đã cấp gần đây */}
                        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                            <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center gap-2.5">
                                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                    <span className="material-symbols-outlined text-emerald-600 text-[20px]">fact_check</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-[#121417] dark:text-white">Đã cấp gần đây</h3>
                                    <p className="text-xs text-[#687582] dark:text-gray-500">4 đơn gần nhất</p>
                                </div>
                            </div>
                            <div className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e]">
                                {RECENT_DISPENSES.map((d) => (
                                    <div key={d.id} className="px-5 py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-emerald-600 text-[16px]">check_circle</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-[#121417] dark:text-white">{d.patient}</p>
                                                <p className="text-[11px] text-[#687582] dark:text-gray-500">{d.medicines} thuốc • {d.time}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-[#121417] dark:text-white">{d.total}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
