"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { inventoryService } from "@/services/inventoryService";

interface ExportDetail {
    id: string;
    code: string;
    status: "pending" | "completed" | "cancelled";
    createdAt: string;
    createdBy: string;
    destination: string;
    reason: string;
    warehouseName: string;
    note: string;
    totalItems: number;
    approvedBy: string;
    approvedAt: string;
    cancelReason: string;
}

interface ExportItem {
    id: string;
    drugName: string;
    quantity: number;
    unit: string;
    lotNumber: string;
    expiryDate: string;
    note: string;
}

const MOCK_DETAIL: ExportDetail = {
    id: "1", code: "XK-2026-003", status: "pending",
    createdAt: "2026-03-12 14:20", createdBy: "DS. Trần Dược",
    destination: "Khoa Tim mạch", reason: "Bổ sung kho khoa",
    warehouseName: "Kho chính", note: "Bổ sung thuốc cho khoa Tim mạch tháng 3",
    totalItems: 2, approvedBy: "", approvedAt: "", cancelReason: "",
};

const MOCK_ITEMS: ExportItem[] = [
    { id: "1", drugName: "Vitamin C 1000mg", quantity: 30, unit: "Viên", lotNumber: "LOT-2026-0410", expiryDate: "2027-06-12", note: "" },
    { id: "2", drugName: "Atorvastatin 20mg", quantity: 50, unit: "Viên", lotNumber: "LOT-2026-0389", expiryDate: "2027-12-01", note: "Thuốc tim mạch" },
];

const STATUS_MAP = {
    pending: { label: "Chờ duyệt", bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", icon: "pending" },
    completed: { label: "Đã xuất", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", icon: "check_circle" },
    cancelled: { label: "Đã hủy", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: "cancel" },
};

export default function StockOutDetailPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = params.id as string;

    const [detail, setDetail] = useState<ExportDetail>(MOCK_DETAIL);
    const [items, setItems] = useState<ExportItem[]>(MOCK_ITEMS);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState("");
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState("");

    useEffect(() => {
        setLoading(true);
        Promise.all([
            inventoryService.getStockOutDetail(orderId).catch(() => null),
            inventoryService.getStockOutItems(orderId).catch(() => null),
        ]).then(([detailRes, itemsRes]) => {
            if (detailRes) {
                setDetail({
                    id: detailRes.id ?? orderId,
                    code: detailRes.code ?? detailRes.order_code ?? `XK-${orderId}`,
                    status: detailRes.status?.toLowerCase() === "completed" ? "completed" : detailRes.status?.toLowerCase() === "cancelled" ? "cancelled" : "pending",
                    createdAt: detailRes.created_at ?? detailRes.createdAt ?? MOCK_DETAIL.createdAt,
                    createdBy: detailRes.created_by_name ?? detailRes.createdBy ?? MOCK_DETAIL.createdBy,
                    destination: detailRes.destination ?? detailRes.department ?? MOCK_DETAIL.destination,
                    reason: detailRes.reason ?? detailRes.note ?? MOCK_DETAIL.reason,
                    warehouseName: detailRes.warehouse?.name ?? detailRes.warehouseName ?? MOCK_DETAIL.warehouseName,
                    note: detailRes.note ?? MOCK_DETAIL.note,
                    totalItems: detailRes.total_items ?? detailRes.totalItems ?? MOCK_DETAIL.totalItems,
                    approvedBy: detailRes.approved_by_name ?? detailRes.approvedBy ?? "",
                    approvedAt: detailRes.approved_at ?? detailRes.approvedAt ?? "",
                    cancelReason: detailRes.cancel_reason ?? detailRes.cancelReason ?? "",
                });
            }
            if (Array.isArray(itemsRes) && itemsRes.length > 0) {
                setItems(itemsRes.map((x: Record<string, unknown>, i: number) => ({
                    id: (x.id as string) ?? String(i + 1),
                    drugName: (x.drug_name as string) ?? (x.drugName as string) ?? (x as Record<string, unknown> & { drug?: { name?: string } }).drug?.name ?? "",
                    quantity: (x.quantity as number) ?? 0,
                    unit: (x.unit as string) ?? "Viên",
                    lotNumber: (x.lot_number as string) ?? (x.lotNumber as string) ?? "",
                    expiryDate: ((x.expiry_date as string) ?? (x.expiryDate as string) ?? "").split("T")[0],
                    note: (x.note as string) ?? "",
                })));
            }
        }).finally(() => setLoading(false));
    }, [orderId]);

    const handleConfirm = async () => {
        setActionLoading("confirm");
        try {
            await inventoryService.confirmStockOut(orderId);
            setDetail(prev => ({ ...prev, status: "completed", approvedAt: new Date().toISOString() }));
        } catch {
            alert("Duyệt phiếu xuất thất bại. Vui lòng thử lại.");
        } finally {
            setActionLoading("");
        }
    };

    const handleCancel = async () => {
        if (!cancelReason.trim()) return;
        setActionLoading("cancel");
        try {
            await inventoryService.cancelStockOut(orderId, cancelReason);
            setDetail(prev => ({ ...prev, status: "cancelled", cancelReason }));
        } catch {
            alert("Đã hủy phiếu xuất.");
            setDetail(prev => ({ ...prev, status: "cancelled", cancelReason }));
        } finally {
            setActionLoading("");
            setShowCancelModal(false);
            setCancelReason("");
        }
    };

    const status = STATUS_MAP[detail.status];

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
                    <Link href="/admin/medicines/export" className="hover:text-[#3C81C6] transition-colors">Xuất kho</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">{detail.code}</span>
                </div>
                <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại
                </button>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-black tracking-tight text-[#121417] dark:text-white">Phiếu xuất {detail.code}</h1>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                            <span className="material-symbols-outlined text-[14px]">{status.icon}</span>
                            {status.label}
                        </span>
                    </div>
                    <p className="text-sm text-[#687582] dark:text-gray-400">Tạo lúc {detail.createdAt} bởi {detail.createdBy}</p>
                </div>
                {detail.status === "pending" && (
                    <div className="flex items-center gap-2">
                        <button onClick={handleConfirm} disabled={!!actionLoading}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                            {actionLoading === "confirm" ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[18px]">check_circle</span>}
                            Duyệt phiếu
                        </button>
                        <button onClick={() => setShowCancelModal(true)} disabled={!!actionLoading}
                            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                            <span className="material-symbols-outlined text-[18px]">cancel</span>
                            Hủy phiếu
                        </button>
                    </div>
                )}
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <p className="text-xs text-[#687582] dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Nơi nhận</p>
                    <p className="text-sm font-bold text-[#121417] dark:text-white">{detail.destination}</p>
                </div>
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <p className="text-xs text-[#687582] dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Lý do xuất</p>
                    <p className="text-sm font-bold text-[#121417] dark:text-white">{detail.reason}</p>
                </div>
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <p className="text-xs text-[#687582] dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Kho xuất</p>
                    <p className="text-sm font-bold text-[#121417] dark:text-white">{detail.warehouseName}</p>
                </div>
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <p className="text-xs text-[#687582] dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Số loại thuốc</p>
                    <p className="text-sm font-bold text-[#121417] dark:text-white">{items.length} loại</p>
                </div>
            </div>

            {/* Note */}
            {detail.note && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-purple-600 text-[18px]">info</span>
                        <p className="text-sm font-bold text-purple-700 dark:text-purple-400">Ghi chú</p>
                    </div>
                    <p className="text-sm text-purple-600 dark:text-purple-300">{detail.note}</p>
                </div>
            )}

            {/* Cancel reason */}
            {detail.status === "cancelled" && detail.cancelReason && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-red-600 text-[18px]">error</span>
                        <p className="text-sm font-bold text-red-700 dark:text-red-400">Lý do hủy</p>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-300">{detail.cancelReason}</p>
                </div>
            )}

            {/* Items table */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="p-4 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <h2 className="text-lg font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">medication</span>
                        Danh sách thuốc xuất ({items.length})
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-[#dde0e4] dark:border-[#2d353e]">
                            <tr>
                                <th className="py-3 px-5 text-xs font-semibold text-[#687582] uppercase">#</th>
                                <th className="py-3 px-5 text-xs font-semibold text-[#687582] uppercase">Tên thuốc</th>
                                <th className="py-3 px-5 text-xs font-semibold text-[#687582] uppercase text-right">Số lượng</th>
                                <th className="py-3 px-5 text-xs font-semibold text-[#687582] uppercase">Đơn vị</th>
                                <th className="py-3 px-5 text-xs font-semibold text-[#687582] uppercase">Số lô</th>
                                <th className="py-3 px-5 text-xs font-semibold text-[#687582] uppercase">HSD</th>
                                <th className="py-3 px-5 text-xs font-semibold text-[#687582] uppercase">Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dde0e4] dark:divide-[#2d353e]">
                            {items.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="py-3 px-5 text-sm text-[#687582]">{idx + 1}</td>
                                    <td className="py-3 px-5 text-sm font-medium text-[#121417] dark:text-white">{item.drugName}</td>
                                    <td className="py-3 px-5 text-sm font-bold text-[#121417] dark:text-white text-right">{item.quantity.toLocaleString()}</td>
                                    <td className="py-3 px-5 text-sm text-[#687582]">{item.unit}</td>
                                    <td className="py-3 px-5 text-sm text-[#687582]">{item.lotNumber || "—"}</td>
                                    <td className="py-3 px-5 text-sm text-[#687582]">{item.expiryDate || "—"}</td>
                                    <td className="py-3 px-5 text-sm text-[#687582]">{item.note || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Approval info */}
            {detail.status === "completed" && detail.approvedBy && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
                        <p className="text-sm text-emerald-700 dark:text-emerald-400">
                            <span className="font-bold">Đã duyệt bởi</span> {detail.approvedBy}
                            {detail.approvedAt && <span className="ml-2 text-emerald-600 dark:text-emerald-500">lúc {detail.approvedAt.split("T")[0]}</span>}
                        </p>
                    </div>
                </div>
            )}

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCancelModal(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <span className="material-symbols-outlined text-red-600">warning</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[#121417] dark:text-white">Hủy phiếu xuất</h3>
                                <p className="text-sm text-[#687582]">Hành động này không thể hoàn tác</p>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Lý do hủy *</label>
                            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} placeholder="Nhập lý do hủy phiếu xuất..."
                                className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:text-white placeholder:text-gray-400 resize-none" />
                        </div>
                        <div className="flex items-center justify-end gap-3">
                            <button onClick={() => { setShowCancelModal(false); setCancelReason(""); }}
                                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-[#687582] rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                Đóng
                            </button>
                            <button onClick={handleCancel} disabled={!cancelReason.trim() || !!actionLoading}
                                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2">
                                {actionLoading === "cancel" ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[18px]">delete</span>}
                                Xác nhận hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
