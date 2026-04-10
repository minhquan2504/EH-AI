"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { inventoryService } from "@/services/inventoryService";

interface ExportItem {
    name: string;
    quantity: string;
    unit: string;
    destination: string;
    reason: string;
    note: string;
}

const EMPTY_ITEM: ExportItem = {
    name: "", quantity: "", unit: "Viên", destination: "", reason: "Cấp phát theo đơn", note: "",
};

const UNITS = ["Viên", "Hộp", "Chai", "Ống", "Gói", "Tuýp", "Lọ"];
const REASONS = ["Cấp phát theo đơn", "Bổ sung kho khoa", "Hủy thuốc hết hạn", "Chuyển kho", "Khác"];
const DESTINATIONS = ["Khoa Nội", "Khoa Ngoại", "Khoa Nhi", "Khoa Sản", "Khoa Tim mạch", "Khoa Cấp cứu", "Phòng khám", "Hủy bỏ", "Khác"];

export default function StockOutCreatePage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [items, setItems] = useState<ExportItem[]>([{ ...EMPTY_ITEM }]);
    const [generalNote, setGeneralNote] = useState("");

    const handleItemChange = (index: number, field: keyof ExportItem, value: string) => {
        setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    };

    const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);

    const removeItem = (index: number) => {
        if (items.length === 1) return;
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const hasEmpty = items.some((item) => !item.name.trim() || !item.quantity.trim() || !item.destination.trim());
        if (hasEmpty) { alert("Vui lòng nhập tên thuốc, số lượng và nơi nhận cho tất cả các mục"); return; }
        setSaving(true);
        try {
            await inventoryService.createStockOut({
                items: items.map((item) => ({
                    drugName: item.name,
                    quantity: Number(item.quantity) || 0,
                    unit: item.unit,
                    destination: item.destination,
                    reason: item.reason,
                    note: item.note || undefined,
                })),
                note: generalNote || undefined,
            });
            router.push("/admin/medicines/export");
        } catch {
            alert("Tạo phiếu xuất kho thất bại. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            {/* Breadcrumb */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/admin/medicines" className="hover:text-[#3C81C6] transition-colors">Danh mục thuốc</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <Link href="/admin/medicines/export" className="hover:text-[#3C81C6] transition-colors">Xuất kho</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Tạo phiếu xuất</span>
                </div>
                <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại
                </button>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <h1 className="text-xl font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">outbox</span>
                        Tạo phiếu xuất kho
                    </h1>
                    <p className="text-sm text-[#687582] mt-1">Xuất thuốc từ kho cho các khoa/phòng ban</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-6">
                        {items.map((item, index) => (
                            <div key={index} className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">medication</span>
                                        Thuốc #{index + 1}
                                    </h3>
                                    {items.length > 1 && (
                                        <button type="button" onClick={() => removeItem(index)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Tên thuốc *</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#687582]"><span className="material-symbols-outlined text-[18px]">medication</span></span>
                                            <input type="text" value={item.name} onChange={(e) => handleItemChange(index, "name", e.target.value)} placeholder="VD: Paracetamol 500mg"
                                                className="w-full py-2.5 pl-10 pr-4 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Số lượng *</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#687582]"><span className="material-symbols-outlined text-[18px]">inventory</span></span>
                                            <input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, "quantity", e.target.value)} placeholder="VD: 100"
                                                className="w-full py-2.5 pl-10 pr-4 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Đơn vị</label>
                                        <select value={item.unit} onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                                            className="w-full py-2.5 px-4 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Nơi nhận *</label>
                                        <select value={item.destination} onChange={(e) => handleItemChange(index, "destination", e.target.value)}
                                            className="w-full py-2.5 px-4 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                            <option value="">-- Chọn nơi nhận --</option>
                                            {DESTINATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Lý do xuất</label>
                                        <select value={item.reason} onChange={(e) => handleItemChange(index, "reason", e.target.value)}
                                            className="w-full py-2.5 px-4 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                            {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ghi chú</label>
                                        <input type="text" value={item.note} onChange={(e) => handleItemChange(index, "note", e.target.value)} placeholder="VD: Ghi chú thêm..."
                                            className="w-full py-2.5 px-4 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add more */}
                    <button type="button" onClick={addItem}
                        className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 text-[#687582] rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-[#3C81C6] hover:text-[#3C81C6] transition-all w-full justify-center">
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        Thêm thuốc khác
                    </button>

                    {/* General note */}
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ghi chú phiếu xuất</label>
                        <textarea value={generalNote} onChange={(e) => setGeneralNote(e.target.value)} rows={2} placeholder="Ghi chú chung cho phiếu xuất..."
                            className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400 resize-none" />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
                        <button type="button" onClick={() => router.back()}
                            className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-[#687582] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Hủy
                        </button>
                        <button type="submit" disabled={saving}
                            className="px-6 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50 flex items-center gap-2">
                            {saving ? (
                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</>
                            ) : (
                                <><span className="material-symbols-outlined text-[18px]">save</span> Tạo phiếu xuất</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
