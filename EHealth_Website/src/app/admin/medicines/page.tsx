"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UI_TEXT } from "@/constants/ui-text";
import { getDrugs } from "@/services/medicineService";
import { MEDICINE_STATUS } from "@/constants/status";
import { validateFile } from "@/utils/fileValidation";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { MedicineFormModal } from "@/features/medicines/components/medicine-form-modal";
import { AddStockModal } from "@/features/medicines/components/add-stock-modal";
import type { Medicine } from "@/types";

const MEDICINE_CATEGORIES = [
    "Kháng sinh",
    "Giảm đau",
    "Vitamin & Khoáng chất",
    "Hô hấp",
    "Tiêu hóa",
    "Tim mạch",
    "Thần kinh",
    "Da liễu",
];

type SortField = "code" | "name" | "price" | "stock" | "status";
type SortOrder = "asc" | "desc";

function formatCurrency(num: number): string {
    if (num >= 1_000_000_000) {
        return `${(num / 1_000_000_000).toFixed(1)} Tỷ`;
    }
    return num.toLocaleString("vi-VN") + "₫";
}

export default function MedicinesPage() {
    // State
    const router = useRouter();
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
    const [stockMedicine, setStockMedicine] = useState<Medicine | null>(null);
    const [sortField, setSortField] = useState<SortField>("name");
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

    const [stats, setStats] = useState({ expiringSoon: 0 });

    useEffect(() => {
        getDrugs({ limit: 200 })
            .then(res => {
                const items: any[] = res?.data ?? [];
                if (items.length > 0) {
                    setMedicines(items.map((d: any) => ({
                        id: d.id,
                        code: d.code ?? d.id,
                        name: d.name ?? "",
                        category: d.category ?? "",
                        unit: d.unit ?? "",
                        price: d.price ?? 0,
                        stock: d.quantity ?? d.stock ?? 0,
                        stockLevel: d.stockLevel ?? "NORMAL",
                        minStock: d.minQuantity ?? d.minStock ?? 0,
                        manufacturer: d.manufacturer ?? "",
                        expiryDate: d.expiryDate ?? d.expiry_date ?? "",
                        activeIngredient: d.activeIngredient ?? d.active_ingredient ?? "",
                        status: d.status ?? "IN_BUSINESS",
                        description: d.description ?? "",
                        createdAt: d.createdAt ?? d.created_at ?? "",
                        updatedAt: d.updatedAt ?? d.updated_at ?? "",
                    })) as Medicine[]);
                    const total = items.length;
                    const lowStock = items.filter((d: any) => d.status === "low_stock").length;
                    const outOfStock = items.filter((d: any) => d.status === "out_of_stock").length;
                    setStats(prev => ({ ...prev, totalMedicines: total, lowStockCount: lowStock, outOfStockCount: outOfStock }));
                }
            })
            .catch(() => { /* API không khả dụng, hiển thị trống */ });
    }, []);

    // Filtered and sorted medicines
    const filteredMedicines = useMemo(() => {
        let result = medicines.filter((medicine) => {
            const matchesSearch =
                searchQuery === "" ||
                (medicine.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (medicine.code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (medicine.activeIngredient || "").toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory =
                categoryFilter === "all" || medicine.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });

        result.sort((a, b) => {
            let comparison = 0;
            if (sortField === "code") {
                comparison = (a.code || "").localeCompare(b.code || "");
            } else if (sortField === "name") {
                comparison = (a.name || "").localeCompare(b.name || "");
            } else if (sortField === "price") {
                comparison = (a.price || 0) - (b.price || 0);
            } else if (sortField === "stock") {
                comparison = (a.stock || 0) - (b.stock || 0);
            } else if (sortField === "status") {
                comparison = (a.status || "").localeCompare(b.status || "");
            }
            return sortOrder === "asc" ? comparison : -comparison;
        });

        return result;
    }, [medicines, searchQuery, categoryFilter, sortField, sortOrder]);

    // Toggle sort
    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    // Export to CSV
    const handleExport = async () => {
        try {
            const { exportDrugs } = await import("@/services/medicineService");
            const blob = await exportDrugs();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `medicines_${new Date().toISOString().split("T")[0]}.xlsx`;
            link.click();
            URL.revokeObjectURL(url);
        } catch {
            // fallback: CSV từ dữ liệu hiện có
            const headers = ["Mã", "Tên", "Hoạt chất", "Đơn vị", "Giá", "Tồn kho", "Trạng thái"];
            const rows = filteredMedicines.map((m) => [
                m.code, m.name, m.activeIngredient, m.unit,
                m.price.toString(), m.stock.toString(), m.status,
            ]);
            const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `medicines_${new Date().toISOString().split("T")[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
        }
    };

    // Handlers
    const handleAddMedicine = () => {
        setEditingMedicine(null);
        setIsModalOpen(true);
    };

    const handleEditMedicine = (medicine: Medicine) => {
        setEditingMedicine(medicine);
        setIsModalOpen(true);
    };

    const handleDeleteMedicine = async (medicineId: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa thuốc này?")) return;
        try {
            const { deleteDrug } = await import("@/services/medicineService");
            await deleteDrug(medicineId);
        } catch {
            // keep local even if API fails
        }
        setMedicines((prev) => prev.filter((m) => m.id !== medicineId));
    };

    const handleAddStock = (medicine: Medicine) => {
        setStockMedicine(medicine);
        setIsStockModalOpen(true);
    };

    const handleStockSubmit = async (medicineId: string, quantity: number, note: string) => {
        // Cập nhật local state ngay
        setMedicines((prev) =>
            prev.map((m) =>
                m.id === medicineId
                    ? { ...m, stock: m.stock + quantity, updatedAt: new Date().toISOString().split("T")[0] }
                    : m
            )
        );
        // Gọi API nhập kho
        try {
            const { inventoryService } = await import("@/services/inventoryService");
            await inventoryService.createStockIn({
                items: [{ drugId: medicineId, quantity, note: note || undefined }],
            });
        } catch {
            // fallback: local state đã cập nhật rồi
        }
    };

    const handleSubmitMedicine = async (medicineData: Partial<Medicine>) => {
        try {
            const { createDrug, updateDrug } = await import("@/services/medicineService");
            if (editingMedicine) {
                await updateDrug(editingMedicine.id, {
                    name: medicineData.name,
                    unit: medicineData.unit,
                    price: medicineData.price,
                    category: medicineData.category,
                    activeIngredient: medicineData.activeIngredient,
                } as any).catch(() => null);
                setMedicines((prev) =>
                    prev.map((m) => (m.id === editingMedicine.id ? { ...m, ...medicineData } : m))
                );
                return;
            }
            const created = await createDrug({
                name: medicineData.name || "",
                unit: medicineData.unit || "Hộp",
                price: medicineData.price || 0,
                category: medicineData.category,
                activeIngredient: medicineData.activeIngredient,
                quantity: medicineData.stock,
                minQuantity: (medicineData as any).minStock,
            } as any).catch(() => null);
            const newMedicine: Medicine = {
                id: (created as any)?.id ?? String(Date.now()),
                code: (created as any)?.code ?? `SP-${new Date().getFullYear()}-${String(medicines.length + 1).padStart(3, "0")}`,
                name: medicineData.name || "",
                activeIngredient: medicineData.activeIngredient || "",
                unit: medicineData.unit || "Hộp",
                unitDetail: medicineData.unitDetail,
                price: medicineData.price || 0,
                stock: medicineData.stock || 0,
                stockLevel: medicineData.stockLevel || "NORMAL",
                category: medicineData.category || "",
                status: MEDICINE_STATUS.IN_BUSINESS,
                createdAt: new Date().toISOString().split("T")[0],
                updatedAt: new Date().toISOString().split("T")[0],
            };
            setMedicines((prev) => [newMedicine, ...prev]);
        } catch {
            // keep local state
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case MEDICINE_STATUS.IN_BUSINESS:
                return { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", label: UI_TEXT.STATUS.IN_BUSINESS };
            case MEDICINE_STATUS.SUSPENDED:
                return { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", label: UI_TEXT.STATUS.SUSPENDED };
            case MEDICINE_STATUS.OUT_OF_STOCK:
                return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: UI_TEXT.STATUS.OUT_OF_STOCK };
            default:
                return { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-600 dark:text-gray-300", label: status };
        }
    };

    const getStockStyle = (level: string) => {
        switch (level) {
            case "HIGH":
                return "text-green-600 bg-green-50 dark:bg-green-900/20";
            case "NORMAL":
                return "text-blue-600 bg-blue-50 dark:bg-blue-900/20";
            case "LOW":
                return "text-orange-600 bg-orange-50 dark:bg-orange-900/20";
            case "OUT":
                return "text-red-600 bg-red-50 dark:bg-red-900/20";
            default:
                return "text-gray-600 bg-gray-50";
        }
    };

    // Calculate dynamic stats
    const dynamicStats = {
        total: medicines.length,
        lowStock: medicines.filter((m) => m.stockLevel === "LOW" || m.stockLevel === "OUT").length,
        expiringSoon: stats.expiringSoon,
        totalValue: medicines.reduce((sum, m) => sum + m.price * m.stock, 0),
    };

    return (
        <>
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-[#121417] dark:text-white">
                        {UI_TEXT.ADMIN.MEDICINES.TITLE}
                    </h1>
                    <p className="text-[#687582] dark:text-gray-400">
                        {UI_TEXT.ADMIN.MEDICINES.SUBTITLE}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = ".xlsx,.xls,.csv";
                            input.onchange = async (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (!file) return;
                                const validation = validateFile(file, { maxSize: 5 * 1024 * 1024, allowedTypes: ["csv", "xlsx", "xls"] });
                                if (!validation.valid) { alert(validation.message); return; }
                                try {
                                    const { importDrugs } = await import("@/services/medicineService");
                                    const result = await importDrugs(file);
                                    alert(`Nhập thành công${result?.imported ? `: ${result.imported} thuốc` : ""}!`);
                                    // Reload danh sách
                                    getDrugs({ limit: 200 }).then(res => {
                                        const items: any[] = res?.data ?? [];
                                        if (items.length > 0) setMedicines(items.map((d: any) => ({ ...medicines[0], id: d.id, code: d.code ?? d.id, name: d.name ?? "", category: d.category ?? "", unit: d.unit ?? "", price: d.price ?? 0, stock: d.quantity ?? 0, minStock: d.minQuantity ?? 0, manufacturer: d.manufacturer ?? "", expiryDate: d.expiryDate ?? "", activeIngredient: d.activeIngredient ?? "", status: d.status ?? "available", description: d.description ?? "" })) as Medicine[]);
                                    }).catch(() => {});
                                } catch {
                                    alert("Nhập file thất bại. Vui lòng thử lại.");
                                }
                            };
                            input.click();
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] text-[#121417] dark:text-white rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">upload_file</span>
                        {UI_TEXT.ADMIN.MEDICINES.IMPORT_EXCEL}
                    </button>
                    <button
                        onClick={() => router.push("/admin/medicines/new")}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all transform hover:-translate-y-0.5"
                    >
                        <span className="material-symbols-outlined text-[20px]">add_circle</span>
                        {UI_TEXT.ADMIN.MEDICINES.ADD_MEDICINE}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                        <span className="material-symbols-outlined">medication</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">{UI_TEXT.ADMIN.MEDICINES.TOTAL_MEDICINES}</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{dynamicStats.total.toLocaleString("vi-VN")}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600">
                        <span className="material-symbols-outlined">inventory_2</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">{UI_TEXT.ADMIN.MEDICINES.LOW_STOCK}</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{dynamicStats.lowStock}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600">
                        <span className="material-symbols-outlined">schedule</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">{UI_TEXT.ADMIN.MEDICINES.EXPIRING_SOON}</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{dynamicStats.expiringSoon}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                        <span className="material-symbols-outlined">payments</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">{UI_TEXT.ADMIN.MEDICINES.TOTAL_VALUE}</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{formatCurrency(dynamicStats.totalValue)}</p>
                    </div>
                </div>
            </div>

            {/* Medicines Table */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                {/* Table Header */}
                <div className="p-4 border-b border-[#dde0e4] dark:border-[#2d353e] flex flex-col sm:flex-row justify-between gap-4 items-center">
                    <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                        <div className="relative w-full sm:w-72">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#687582]">
                                <span className="material-symbols-outlined text-[20px]">search</span>
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full py-2.5 pl-10 pr-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] transition-all dark:text-white placeholder:text-gray-400"
                                placeholder={UI_TEXT.ADMIN.MEDICINES.SEARCH_PLACEHOLDER}
                            />
                        </div>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="py-2.5 pl-3 pr-10 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all text-[#687582] dark:text-gray-400 cursor-pointer"
                        >
                            <option value="all">{UI_TEXT.ADMIN.MEDICINES.ALL_CATEGORIES}</option>
                            {MEDICINE_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExport}
                            className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-[#687582] transition-colors"
                            title="Xuất dữ liệu"
                        >
                            <span className="material-symbols-outlined text-[20px]">download</span>
                        </button>
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setCategoryFilter("all");
                            }}
                            className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-[#687582] transition-colors"
                            title="Xóa bộ lọc"
                        >
                            <span className="material-symbols-outlined text-[20px]">filter_list_off</span>
                        </button>
                    </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-[#dde0e4] dark:border-[#2d353e]">
                            <tr>
                                <th onClick={() => toggleSort("code")} className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase cursor-pointer hover:text-[#3C81C6] select-none">
                                    <span className="flex items-center gap-1">
                                        Mã thuốc
                                        {sortField === "code" && <span className="material-symbols-outlined text-[14px]">{sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}</span>}
                                    </span>
                                </th>
                                <th onClick={() => toggleSort("name")} className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase cursor-pointer hover:text-[#3C81C6] select-none">
                                    <span className="flex items-center gap-1">
                                        Tên thuốc
                                        {sortField === "name" && <span className="material-symbols-outlined text-[14px]">{sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}</span>}
                                    </span>
                                </th>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">Hoạt chất</th>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">Đơn vị</th>
                                <th onClick={() => toggleSort("price")} className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase cursor-pointer hover:text-[#3C81C6] select-none">
                                    <span className="flex items-center gap-1">
                                        Giá bán
                                        {sortField === "price" && <span className="material-symbols-outlined text-[14px]">{sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}</span>}
                                    </span>
                                </th>
                                <th onClick={() => toggleSort("stock")} className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase cursor-pointer hover:text-[#3C81C6] select-none">
                                    <span className="flex items-center gap-1">
                                        Tồn kho
                                        {sortField === "stock" && <span className="material-symbols-outlined text-[14px]">{sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}</span>}
                                    </span>
                                </th>
                                <th onClick={() => toggleSort("status")} className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase cursor-pointer hover:text-[#3C81C6] select-none">
                                    <span className="flex items-center gap-1">
                                        Trạng thái
                                        {sortField === "status" && <span className="material-symbols-outlined text-[14px]">{sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}</span>}
                                    </span>
                                </th>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase text-right">{UI_TEXT.COMMON.ACTIONS}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dde0e4] dark:divide-[#2d353e]">
                            {filteredMedicines.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-[#687582] dark:text-gray-400">
                                        <span className="material-symbols-outlined text-4xl mb-2 block">search_off</span>
                                        {UI_TEXT.TABLE.NO_RESULTS}
                                    </td>
                                </tr>
                            ) : (
                                filteredMedicines.map((medicine) => {
                                    const statusStyle = getStatusStyle(medicine.status);
                                    return (
                                        <tr key={medicine.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <span className="text-sm font-mono text-[#3C81C6]">{medicine.code}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="text-sm font-bold text-[#121417] dark:text-white">{medicine.name}</p>
                                                <p className="text-xs text-[#687582] dark:text-gray-400">{medicine.category}</p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="text-sm text-[#121417] dark:text-gray-200 max-w-[200px] truncate">{medicine.activeIngredient}</p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="text-sm text-[#121417] dark:text-gray-200">{medicine.unit}</p>
                                                {medicine.unitDetail && (
                                                    <p className="text-xs text-[#687582] dark:text-gray-400">{medicine.unitDetail}</p>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="text-sm font-semibold text-[#121417] dark:text-white">
                                                    {medicine.price.toLocaleString("vi-VN")}₫
                                                </p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${getStockStyle(medicine.stockLevel)}`}>
                                                    {medicine.stock.toLocaleString("vi-VN")}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                                                    {statusStyle.label}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <DropdownMenu
                                                    items={[
                                                        {
                                                            label: "Chỉnh sửa",
                                                            icon: "edit",
                                                            onClick: () => handleEditMedicine(medicine),
                                                        },
                                                        {
                                                            label: "Nhập thêm kho",
                                                            icon: "add_box",
                                                            onClick: () => handleAddStock(medicine),
                                                        },
                                                        {
                                                            label: "Xóa",
                                                            icon: "delete",
                                                            onClick: () => handleDeleteMedicine(medicine.id),
                                                            variant: "danger",
                                                        },
                                                    ]}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Medicine Form Modal */}
            <MedicineFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitMedicine}
                initialData={editingMedicine || undefined}
                mode={editingMedicine ? "edit" : "create"}
            />

            {/* Add Stock Modal */}
            {stockMedicine && (
                <AddStockModal
                    isOpen={isStockModalOpen}
                    onClose={() => {
                        setIsStockModalOpen(false);
                        setStockMedicine(null);
                    }}
                    onSubmit={handleStockSubmit}
                    medicine={stockMedicine}
                />
            )}
        </>
    );
}
