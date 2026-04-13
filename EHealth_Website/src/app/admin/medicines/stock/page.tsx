"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { inventoryService } from "@/services/inventoryService";

interface StockItem {
    id: string;
    code: string;
    name: string;
    unit: string;
    currentStock: number;
    minStock: number;
    maxStock: number;
    batchNumber: string;
    expiryDate: string;
    stockLevel: "HIGH" | "NORMAL" | "LOW" | "OUT";
}


export default function MedicineStockPage() {
    const router = useRouter();
    const [stock, setStock] = useState<StockItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [levelFilter, setLevelFilter] = useState("all");

    useEffect(() => {
        inventoryService.getList({ limit: 500 })
            .then(res => {
                const items: any[] = res?.data?.data ?? res?.data ?? res ?? [];
                if (Array.isArray(items) && items.length > 0) {
                    setStock(items.map((d: any) => {
                        const qty = d.quantity ?? d.currentStock ?? 0;
                        const min = d.minQuantity ?? d.reorderPoint ?? 0;
                        const level: StockItem["stockLevel"] = qty === 0 ? "OUT" : qty < min ? "LOW" : qty > min * 3 ? "HIGH" : "NORMAL";
                        return {
                            id: d.id ?? d.drugId,
                            code: d.drugCode ?? d.code ?? "",
                            name: d.drugName ?? d.name ?? "",
                            unit: d.unit ?? "",
                            currentStock: qty,
                            minStock: min,
                            maxStock: d.maxQuantity ?? min * 5,
                            batchNumber: d.batchNumber ?? d.lotNumber ?? "",
                            expiryDate: d.expiryDate ?? d.nearestExpiry ?? "",
                            stockLevel: level,
                        };
                    }));
                }
            })
            .catch(() => { /* API không khả dụng, hiển thị trống */ });
    }, []);

    const filtered = stock.filter((s) => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLevel = levelFilter === "all" || s.stockLevel === levelFilter;
        return matchesSearch && matchesLevel;
    });

    const getStockStyle = (level: string) => {
        switch (level) {
            case "HIGH": return { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: "Dự trữ cao", bar: "bg-blue-500" };
            case "NORMAL": return { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", label: "Bình thường", bar: "bg-green-500" };
            case "LOW": return { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", label: "Sắp hết", bar: "bg-orange-500" };
            case "OUT": return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: "Hết hàng", bar: "bg-red-500" };
            default: return { bg: "bg-gray-100", text: "text-gray-600", label: level, bar: "bg-gray-400" };
        }
    };

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-[#121417] dark:text-white">Tồn kho</h1>
                    <p className="text-[#687582] dark:text-gray-400">Theo dõi số lượng tồn kho thuốc và vật tư y tế</p>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] text-[#121417] dark:text-white rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">download</span>
                    Xuất báo cáo
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600"><span className="material-symbols-outlined">inventory_2</span></div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Tổng mặt hàng</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{stock.length}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600"><span className="material-symbols-outlined">check_circle</span></div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Đủ hàng</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{stock.filter(s => s.stockLevel === "NORMAL" || s.stockLevel === "HIGH").length}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600"><span className="material-symbols-outlined">warning</span></div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Sắp hết</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{stock.filter(s => s.stockLevel === "LOW").length}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600"><span className="material-symbols-outlined">report</span></div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Hết hàng</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{stock.filter(s => s.stockLevel === "OUT").length}</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="p-4 border-b border-[#dde0e4] dark:border-[#2d353e] flex flex-col sm:flex-row gap-3">
                    <div className="relative w-full sm:w-72">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#687582]"><span className="material-symbols-outlined text-[20px]">search</span></span>
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full py-2.5 pl-10 pr-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white placeholder:text-gray-400"
                            placeholder="Tìm theo mã, tên thuốc..." />
                    </div>
                    <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}
                        className="py-2.5 pl-3 pr-10 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-[#687582] dark:text-gray-400 cursor-pointer">
                        <option value="all">Tất cả mức tồn</option>
                        <option value="HIGH">Dự trữ cao</option>
                        <option value="NORMAL">Bình thường</option>
                        <option value="LOW">Sắp hết</option>
                        <option value="OUT">Hết hàng</option>
                    </select>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-[#dde0e4] dark:border-[#2d353e]">
                            <tr>
                                <th className="py-3 px-6 text-xs font-semibold text-[#687582] uppercase">Mã</th>
                                <th className="py-3 px-6 text-xs font-semibold text-[#687582] uppercase">Tên thuốc</th>
                                <th className="py-3 px-6 text-xs font-semibold text-[#687582] uppercase">Tồn kho</th>
                                <th className="py-3 px-6 text-xs font-semibold text-[#687582] uppercase">Mức tồn</th>
                                <th className="py-3 px-6 text-xs font-semibold text-[#687582] uppercase">Số lô</th>
                                <th className="py-3 px-6 text-xs font-semibold text-[#687582] uppercase">Hạn dùng</th>
                                <th className="py-3 px-6 text-xs font-semibold text-[#687582] uppercase">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dde0e4] dark:divide-[#2d353e]">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-[#687582] dark:text-gray-400">
                                        <span className="material-symbols-outlined text-4xl mb-2 block">inbox</span>
                                        Chưa có dữ liệu
                                    </td>
                                </tr>
                            ) : filtered.map((item) => {
                                const style = getStockStyle(item.stockLevel);
                                const pct = Math.min(100, Math.round((item.currentStock / item.maxStock) * 100));
                                return (
                                    <tr key={item.id} onClick={() => router.push(`/admin/medicines/stock/${item.id}`)} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                                        <td className="py-3 px-6 text-sm font-bold text-[#3C81C6]">{item.code}</td>
                                        <td className="py-3 px-6 text-sm text-[#121417] dark:text-white">{item.name}</td>
                                        <td className="py-3 px-6">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-[#121417] dark:text-white">{item.currentStock.toLocaleString("vi-VN")}</span>
                                                <span className="text-xs text-[#687582]">/ {item.maxStock.toLocaleString("vi-VN")}</span>
                                            </div>
                                            <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                                                <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </td>
                                        <td className="py-3 px-6 text-sm text-[#687582]">Min: {item.minStock}</td>
                                        <td className="py-3 px-6 text-sm text-[#687582]">{item.batchNumber}</td>
                                        <td className="py-3 px-6 text-sm text-[#687582]">{item.expiryDate}</td>
                                        <td className="py-3 px-6"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>{style.label}</span></td>
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
