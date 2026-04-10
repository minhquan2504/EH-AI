"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getDrugById, Drug } from "@/services/medicineService";

const MOCK_DRUG: Drug = {
    id: "1",
    name: "Amoxicillin 500mg",
    genericName: "Amoxicillin",
    category: "Kháng sinh",
    unit: "Viên",
    price: 8500,
    quantity: 45,
    minQuantity: 100,
    manufacturer: "Dược Hậu Giang",
    expiryDate: "2027-03-10",
    description: "Thuốc kháng sinh nhóm penicillin phổ rộng, dùng điều trị nhiễm khuẩn đường hô hấp, tiết niệu, da và mô mềm.",
    sideEffects: "Buồn nôn, tiêu chảy, phát ban da, phản ứng dị ứng. Hiếm gặp: sốc phản vệ.",
    activeIngredient: "Amoxicillin trihydrate",
    status: "available",
    createdAt: "2026-01-15T08:00:00Z",
    updatedAt: "2026-03-20T10:30:00Z",
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    available: { label: "Còn hàng", color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    low_stock: { label: "Sắp hết", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
    out_of_stock: { label: "Hết hàng", color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30" },
};

export default function MedicineDetailPage() {
    const router = useRouter();
    const params = useParams();
    const medicineId = params.id as string;

    const [drug, setDrug] = useState<Drug>(MOCK_DRUG);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getDrugById(medicineId)
            .then((data) => {
                if (data) setDrug(data);
            })
            .catch(() => {/* keep mock */})
            .finally(() => setLoading(false));
    }, [medicineId]);

    const statusInfo = STATUS_MAP[drug.status] ?? STATUS_MAP.available;

    const stockLevel = drug.quantity === 0
        ? "OUT"
        : drug.quantity < drug.minQuantity
            ? "LOW"
            : "NORMAL";

    const stockPercent = drug.minQuantity > 0 ? Math.min((drug.quantity / drug.minQuantity) * 100, 100) : 100;

    const stockBarColor = stockLevel === "OUT" ? "bg-red-500" : stockLevel === "LOW" ? "bg-amber-500" : "bg-emerald-500";
    const stockTextColor = stockLevel === "OUT" ? "text-red-600" : stockLevel === "LOW" ? "text-amber-600" : "text-emerald-600";

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb + Back */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/admin/medicines" className="hover:text-[#3C81C6] transition-colors">Danh mục thuốc</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Chi tiết thuốc</span>
                </div>
                <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại
                </button>
            </div>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-black tracking-tight text-[#121417] dark:text-white">{drug.name}</h1>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.color}`}>
                            {statusInfo.label}
                        </span>
                    </div>
                    <p className="text-sm text-[#687582] dark:text-gray-400">Mã: {drug.id} | Hoạt chất: {drug.activeIngredient ?? "N/A"}</p>
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
                    <p className={`text-sm font-bold ${stockTextColor}`}>{drug.quantity}/{drug.minQuantity} {drug.unit}</p>
                </div>
                <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${stockBarColor}`} style={{ width: `${stockPercent}%` }} />
                </div>
                <p className="text-xs text-[#687582] mt-2">Mức tối thiểu: {drug.minQuantity} {drug.unit}</p>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <p className="text-xs text-[#687582] dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Nhóm thuốc</p>
                    <p className="text-sm font-bold text-[#121417] dark:text-white">{drug.category}</p>
                </div>
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <p className="text-xs text-[#687582] dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Đơn vị tính</p>
                    <p className="text-sm font-bold text-[#121417] dark:text-white">{drug.unit}</p>
                </div>
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <p className="text-xs text-[#687582] dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Nhà sản xuất</p>
                    <p className="text-sm font-bold text-[#121417] dark:text-white">{drug.manufacturer}</p>
                </div>
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <p className="text-xs text-[#687582] dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Giá bán</p>
                    <p className="text-sm font-bold text-[#3C81C6]">{drug.price.toLocaleString()}₫/{drug.unit}</p>
                </div>
            </div>

            {/* Dates row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] flex items-center gap-4">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <span className="material-symbols-outlined text-blue-600">calendar_month</span>
                    </div>
                    <div>
                        <p className="text-xs text-[#687582] dark:text-gray-400 font-medium">Hoạt chất chính</p>
                        <p className="text-sm font-bold text-[#121417] dark:text-white">{drug.activeIngredient ?? "N/A"}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] flex items-center gap-4">
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                        <span className="material-symbols-outlined text-amber-600">event_busy</span>
                    </div>
                    <div>
                        <p className="text-xs text-[#687582] dark:text-gray-400 font-medium">Hạn sử dụng</p>
                        <p className="text-sm font-bold text-[#121417] dark:text-white">{drug.expiryDate?.split("T")[0] ?? "N/A"}</p>
                    </div>
                </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="p-4 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <h2 className="text-lg font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">description</span>
                        Mô tả thuốc
                    </h2>
                </div>
                <div className="p-5">
                    <p className="text-sm text-[#687582] dark:text-gray-300 leading-relaxed">
                        {drug.description ?? "Chưa có mô tả."}
                    </p>
                </div>
            </div>

            {/* Side Effects */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="p-4 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <h2 className="text-lg font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500">warning</span>
                        Tác dụng phụ
                    </h2>
                </div>
                <div className="p-5">
                    <p className="text-sm text-[#687582] dark:text-gray-300 leading-relaxed">
                        {drug.sideEffects ?? "Chưa có thông tin."}
                    </p>
                </div>
            </div>
        </div>
    );
}
