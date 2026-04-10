"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { inventoryService } from "@/services/inventoryService";

interface ExportRecord {
    id: string;
    code: string;
    medicineName: string;
    quantity: number;
    destination: string;
    date: string;
    reason: string;
    status: "completed" | "pending" | "cancelled";
    approvedBy: string;
}

const MOCK_EXPORTS: ExportRecord[] = [
    { id: "1", code: "XK-2026-001", medicineName: "Paracetamol 500mg", quantity: 100, destination: "Khoa Nội", date: "2026-03-10", reason: "Cấp phát theo đơn", status: "completed", approvedBy: "Admin Quản trị" },
    { id: "2", code: "XK-2026-002", medicineName: "Amoxicillin 250mg", quantity: 50, destination: "Khoa Nhi", date: "2026-03-09", reason: "Cấp phát theo đơn", status: "completed", approvedBy: "Admin Quản trị" },
    { id: "3", code: "XK-2026-003", medicineName: "Vitamin C 1000mg", quantity: 30, destination: "Khoa Tim mạch", date: "2026-03-12", reason: "Bổ sung kho khoa", status: "pending", approvedBy: "—" },
    { id: "4", code: "XK-2026-004", medicineName: "Omeprazol 20mg (hết hạn)", quantity: 20, destination: "Hủy bỏ", date: "2026-03-11", reason: "Thuốc hết hạn sử dụng", status: "cancelled", approvedBy: "Admin Quản trị" },
];

export default function MedicineExportPage() {
    const router = useRouter();
    const [records, setRecords] = useState<ExportRecord[]>(MOCK_EXPORTS);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        inventoryService.getStockOutList({ limit: 100 })
            .then((res: any) => {
                const items: any[] = res?.data?.data ?? res?.data ?? res ?? [];
                if (Array.isArray(items) && items.length > 0) {
                    setRecords(items.map((x: any, i: number) => ({
                        ...MOCK_EXPORTS[i % MOCK_EXPORTS.length],
                        id: x.id ?? String(i + 1),
                        code: x.code ?? x.order_code ?? `XK-${x.id}`,
                        medicineName: x.drug?.name ?? x.drugName ?? x.medicineName ?? "",
                        quantity: x.quantity ?? 0,
                        destination: x.destination ?? x.department ?? x.to ?? "",
                        reason: x.reason ?? x.note ?? "",
                        date: (x.created_at ?? x.date ?? "").split("T")[0],
                        status: x.status?.toLowerCase() === "completed" ? "completed" : x.status?.toLowerCase() === "cancelled" ? "cancelled" : "pending",
                        approvedBy: x.approved_by_name ?? x.approvedBy ?? "—",
                    })));
                }
            })
            .catch(() => {/* keep mock */});
    }, []);

    const filtered = records.filter((r) =>
        r.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "completed": return { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", label: "Đã xuất" };
            case "pending": return { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", label: "Chờ duyệt" };
            case "cancelled": return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: "Đã hủy" };
            default: return { bg: "bg-gray-100", text: "text-gray-600", label: status };
        }
    };

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-[#121417] dark:text-white">Xuất kho</h1>
                    <p className="text-[#687582] dark:text-gray-400">Quản lý phiếu xuất kho, cấp phát và hủy thuốc</p>
                </div>
                <button onClick={() => router.push("/admin/medicines/export/create")} className="flex items-center gap-2 px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all">
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    Tạo phiếu xuất
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600"><span className="material-symbols-outlined">outbox</span></div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Tổng phiếu xuất</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{records.length}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600"><span className="material-symbols-outlined">check_circle</span></div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Hoàn thành</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{records.filter(r => r.status === "completed").length}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center text-yellow-600"><span className="material-symbols-outlined">pending</span></div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Chờ duyệt</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{records.filter(r => r.status === "pending").length}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="p-4 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <div className="relative w-full sm:w-72">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#687582]"><span className="material-symbols-outlined text-[20px]">search</span></span>
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full py-2.5 pl-10 pr-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white placeholder:text-gray-400"
                            placeholder="Tìm theo mã phiếu, tên thuốc..." />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-[#dde0e4] dark:border-[#2d353e]">
                            <tr>
                                <th className="py-3 px-6 text-xs font-semibold text-[#687582] uppercase">Mã phiếu</th>
                                <th className="py-3 px-6 text-xs font-semibold text-[#687582] uppercase">Tên thuốc</th>
                                <th className="py-3 px-6 text-xs font-semibold text-[#687582] uppercase">SL</th>
                                <th className="py-3 px-6 text-xs font-semibold text-[#687582] uppercase">Nơi nhận</th>
                                <th className="py-3 px-6 text-xs font-semibold text-[#687582] uppercase">Lý do</th>
                                <th className="py-3 px-6 text-xs font-semibold text-[#687582] uppercase">Ngày xuất</th>
                                <th className="py-3 px-6 text-xs font-semibold text-[#687582] uppercase">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dde0e4] dark:divide-[#2d353e]">
                            {filtered.map((record) => {
                                const s = getStatusStyle(record.status);
                                return (
                                    <tr key={record.id} onClick={() => router.push(`/admin/medicines/export/${record.id}`)} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                                        <td className="py-3 px-6 text-sm font-bold text-[#3C81C6]">{record.code}</td>
                                        <td className="py-3 px-6 text-sm text-[#121417] dark:text-white">{record.medicineName}</td>
                                        <td className="py-3 px-6 text-sm font-medium text-[#121417] dark:text-white">{record.quantity}</td>
                                        <td className="py-3 px-6 text-sm text-[#687582] dark:text-gray-400">{record.destination}</td>
                                        <td className="py-3 px-6 text-sm text-[#687582] dark:text-gray-400">{record.reason}</td>
                                        <td className="py-3 px-6 text-sm text-[#687582] dark:text-gray-400">{record.date}</td>
                                        <td className="py-3 px-6"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>{s.label}</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
