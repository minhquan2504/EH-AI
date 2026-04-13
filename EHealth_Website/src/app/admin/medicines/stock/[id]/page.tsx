"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { inventoryService } from "@/services/inventoryService";

interface BatchDetail {
    id: string;
    drugName: string;
    drugCode: string;
    category: string;
    lotNumber: string;
    expiryDate: string;
    currentStock: number;
    minStock: number;
    unit: string;
    warehouseName: string;
    supplier: string;
    importDate: string;
    unitPrice: number;
    manufacturer: string;
}

interface StockHistory {
    id: string;
    date: string;
    type: "import" | "export";
    quantity: number;
    refCode: string;
    note: string;
    user: string;
}


export default function StockBatchDetailPage() {
    const router = useRouter();
    const params = useParams();
    const batchId = params.id as string;

    const [batch, setBatch] = useState<BatchDetail | null>(null);
    const [history, setHistory] = useState<StockHistory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        inventoryService.getDetail(batchId)
            .then((res) => {
                if (res) {
                    setBatch({
                        id: res.id ?? batchId,
                        drugName: res.drug_name ?? res.drugName ?? res.drug?.name ?? "",
                        drugCode: res.drug_code ?? res.drugCode ?? res.drug?.code ?? "",
                        category: res.category ?? res.drug?.category ?? "",
                        lotNumber: res.lot_number ?? res.lotNumber ?? res.batch_number ?? "",
                        expiryDate: (res.expiry_date ?? res.expiryDate ?? "").split("T")[0],
                        currentStock: res.quantity ?? res.currentStock ?? res.current_stock ?? 0,
                        minStock: res.min_quantity ?? res.minQuantity ?? res.reorder_point ?? 0,
                        unit: res.unit ?? "",
                        warehouseName: res.warehouse?.name ?? res.warehouseName ?? "",
                        supplier: res.supplier?.name ?? res.supplierName ?? "",
                        importDate: (res.import_date ?? res.importDate ?? res.created_at ?? "").split("T")[0],
                        unitPrice: res.unit_price ?? res.unitPrice ?? 0,
                        manufacturer: res.manufacturer ?? res.drug?.manufacturer ?? "",
                    });
                } else {
                    setBatch(null);
                }
            })
            .catch(() => { setBatch(null); })
            .finally(() => setLoading(false));
    }, [batchId]);

    if (!batch) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">inventory_2</span>
                <p className="text-lg text-gray-500 mb-4">Không tìm thấy thông tin tồn kho</p>
                <button onClick={() => router.back()} className="px-5 py-2.5 bg-[#3C81C6] text-white rounded-xl text-sm font-bold hover:bg-[#2a6da8] transition-colors">Quay lại</button>
            </div>
        );
    }

    const stockPercent = batch.minStock > 0 ? Math.min((batch.currentStock / batch.minStock) * 100, 100) : 100;
    const stockLevel = batch.currentStock === 0 ? "OUT" : batch.currentStock < batch.minStock ? "LOW" : batch.currentStock > batch.minStock * 3 ? "HIGH" : "NORMAL";
    const stockLevelMap = {
        HIGH: { label: "Đầy đủ", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30", bar: "bg-blue-500" },
        NORMAL: { label: "Bình thường", color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30", bar: "bg-emerald-500" },
        LOW: { label: "Sắp hết", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30", bar: "bg-amber-500" },
        OUT: { label: "Hết hàng", color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30", bar: "bg-red-500" },
    };
    const sl = stockLevelMap[stockLevel];

    const daysToExpiry = Math.ceil((new Date(batch.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const expiryWarning = daysToExpiry <= 90;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/admin/medicines" className="hover:text-[#3C81C6] transition-colors">Danh mục thuốc</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <Link href="/admin/medicines/stock" className="hover:text-[#3C81C6] transition-colors">Tồn kho</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">{batch.drugName}</span>
                </div>
                <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại
                </button>
            </div>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-black tracking-tight text-[#121417] dark:text-white">{batch.drugName}</h1>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${sl.bg} ${sl.color}`}>
                            {sl.label}
                        </span>
                    </div>
                    <p className="text-sm text-[#687582] dark:text-gray-400">Mã: {batch.drugCode} | Lô: {batch.lotNumber}</p>
                </div>
                <button onClick={() => router.push("/admin/medicines/inventory/import")}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-[#3C81C6]/20">
                    <span className="material-symbols-outlined text-[18px]">add</span> Nhập thêm
                </button>
            </div>

            {/* Stock level bar */}
            <div className="bg-white dark:bg-[#1e242b] p-5 rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-[#121417] dark:text-white">Mức tồn kho</p>
                    <p className={`text-sm font-bold ${sl.color}`}>{batch.currentStock}/{batch.minStock} {batch.unit}</p>
                </div>
                <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${sl.bar}`} style={{ width: `${stockPercent}%` }} />
                </div>
                <p className="text-xs text-[#687582] mt-2">Mức tối thiểu: {batch.minStock} {batch.unit}</p>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <p className="text-xs text-[#687582] dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Nhóm thuốc</p>
                    <p className="text-sm font-bold text-[#121417] dark:text-white">{batch.category}</p>
                </div>
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <p className="text-xs text-[#687582] dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Nhà cung cấp</p>
                    <p className="text-sm font-bold text-[#121417] dark:text-white">{batch.supplier}</p>
                </div>
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <p className="text-xs text-[#687582] dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Kho lưu trữ</p>
                    <p className="text-sm font-bold text-[#121417] dark:text-white">{batch.warehouseName}</p>
                </div>
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <p className="text-xs text-[#687582] dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Giá nhập</p>
                    <p className="text-sm font-bold text-[#3C81C6]">{batch.unitPrice.toLocaleString("vi-VN")}₫/{batch.unit}</p>
                </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] flex items-center gap-4">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <span className="material-symbols-outlined text-blue-600">calendar_month</span>
                    </div>
                    <div>
                        <p className="text-xs text-[#687582] dark:text-gray-400 font-medium">Ngày nhập kho</p>
                        <p className="text-sm font-bold text-[#121417] dark:text-white">{batch.importDate}</p>
                    </div>
                </div>
                <div className={`p-4 rounded-xl border flex items-center gap-4 ${expiryWarning ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" : "bg-white dark:bg-[#1e242b] border-[#dde0e4] dark:border-[#2d353e]"}`}>
                    <div className={`p-2.5 rounded-xl ${expiryWarning ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-50 dark:bg-amber-900/20"}`}>
                        <span className={`material-symbols-outlined ${expiryWarning ? "text-red-600" : "text-amber-600"}`}>event_busy</span>
                    </div>
                    <div>
                        <p className={`text-xs font-medium ${expiryWarning ? "text-red-600" : "text-[#687582] dark:text-gray-400"}`}>Hạn sử dụng</p>
                        <p className={`text-sm font-bold ${expiryWarning ? "text-red-700 dark:text-red-400" : "text-[#121417] dark:text-white"}`}>
                            {batch.expiryDate}
                            {expiryWarning && <span className="ml-2 text-xs font-normal">({daysToExpiry > 0 ? `còn ${daysToExpiry} ngày` : "Đã hết hạn"})</span>}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stock history */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="p-4 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <h2 className="text-lg font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">history</span>
                        Lịch sử nhập/xuất
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-[#dde0e4] dark:border-[#2d353e]">
                            <tr>
                                <th className="py-3 px-5 text-xs font-semibold text-[#687582] uppercase">Ngày</th>
                                <th className="py-3 px-5 text-xs font-semibold text-[#687582] uppercase">Loại</th>
                                <th className="py-3 px-5 text-xs font-semibold text-[#687582] uppercase text-right">Số lượng</th>
                                <th className="py-3 px-5 text-xs font-semibold text-[#687582] uppercase">Mã phiếu</th>
                                <th className="py-3 px-5 text-xs font-semibold text-[#687582] uppercase">Ghi chú</th>
                                <th className="py-3 px-5 text-xs font-semibold text-[#687582] uppercase">Người thực hiện</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dde0e4] dark:divide-[#2d353e]">
                            {history.map((h) => (
                                <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                                    onClick={() => router.push(h.type === "import" ? `/admin/medicines/import/${h.id}` : `/admin/medicines/export/${h.id}`)}>
                                    <td className="py-3 px-5 text-sm text-[#687582]">{h.date}</td>
                                    <td className="py-3 px-5">
                                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${h.type === "import" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" : "bg-amber-50 dark:bg-amber-900/20 text-amber-600"}`}>
                                            <span className="material-symbols-outlined text-[12px]">{h.type === "import" ? "arrow_downward" : "arrow_upward"}</span>
                                            {h.type === "import" ? "Nhập" : "Xuất"}
                                        </span>
                                    </td>
                                    <td className={`py-3 px-5 text-sm font-bold text-right ${h.type === "import" ? "text-emerald-600" : "text-amber-600"}`}>
                                        {h.type === "import" ? "+" : "-"}{h.quantity.toLocaleString("vi-VN")}
                                    </td>
                                    <td className="py-3 px-5 text-sm font-medium text-[#3C81C6]">{h.refCode}</td>
                                    <td className="py-3 px-5 text-sm text-[#687582]">{h.note}</td>
                                    <td className="py-3 px-5 text-sm text-[#687582]">{h.user}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
