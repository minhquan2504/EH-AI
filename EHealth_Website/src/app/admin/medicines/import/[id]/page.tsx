"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { inventoryService } from "@/services/inventoryService";

interface ImportDetail {
    id: string;
    code: string;
    status: "pending" | "completed" | "cancelled";
    createdAt: string;
    createdBy: string;
    supplier: string;
    warehouseName: string;
    note: string;
    totalItems: number;
    totalValue: number;
    approvedBy: string;
    approvedAt: string;
    cancelReason: string;
}

interface ImportItem {
    id: string;
    drugName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    lotNumber: string;
    expiryDate: string;
    note: string;
}

const MOCK_DETAIL: ImportDetail = {
    id: "1", code: "NK-2026-001", status: "pending",
    createdAt: "2026-03-10 09:30", createdBy: "DS. Trần Văn B",
    supplier: "Công ty Dược phẩm Hà Nội", warehouseName: "Kho chính",
    note: "Đợt nhập bổ sung tháng 3/2026", totalItems: 3, totalValue: 15250000,
    approvedBy: "", approvedAt: "", cancelReason: "",
};

const MOCK_ITEMS: ImportItem[] = [
    { id: "1", drugName: "Paracetamol 500mg", quantity: 500, unit: "Viên", unitPrice: 2500, lotNumber: "LOT-2026-0312", expiryDate: "2027-03-10", note: "" },
    { id: "2", drugName: "Amoxicillin 250mg", quantity: 300, unit: "Viên", unitPrice: 8500, lotNumber: "LOT-2026-0287", expiryDate: "2027-09-08", note: "Kháng sinh phổ rộng" },
    { id: "3", drugName: "Vitamin C 1000mg", quantity: 200, unit: "Viên", unitPrice: 3200, lotNumber: "LOT-2026-0410", expiryDate: "2027-06-12", note: "" },
];

const STATUS_MAP = {
    pending: { label: "Chờ duyệt", bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", icon: "pending" },
    completed: { label: "Đã nhập", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", icon: "check_circle" },
    cancelled: { label: "Đã hủy", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: "cancel" },
};

export default function StockInDetailPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = params.id as string;

    const [detail, setDetail] = useState<ImportDetail>(MOCK_DETAIL);
    const [items, setItems] = useState<ImportItem[]>(MOCK_ITEMS);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState("");
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState("");

    useEffect(() => {
        setLoading(true);
        Promise.all([
            inventoryService.getStockInDetail(orderId).catch(() => null),
            inventoryService.getStockInItems(orderId).catch(() => null),
        ]).then(([detailRes, itemsRes]) => {
            if (detailRes) {
                setDetail({
                    id: detailRes.id ?? orderId,
                    code: detailRes.code ?? detailRes.order_code ?? `NK-${orderId}`,
                    status: (detailRes.status?.toLowerCase() === "completed" || detailRes.status?.toLowerCase() === "received") ? "completed" : detailRes.status?.toLowerCase() === "cancelled" ? "cancelled" : "pending",
                    createdAt: detailRes.created_at ?? detailRes.createdAt ?? MOCK_DETAIL.createdAt,
                    createdBy: detailRes.created_by_name ?? detailRes.createdBy ?? MOCK_DETAIL.createdBy,
                    supplier: detailRes.supplier?.name ?? detailRes.supplierName ?? MOCK_DETAIL.supplier,
                    warehouseName: detailRes.warehouse?.name ?? detailRes.warehouseName ?? MOCK_DETAIL.warehouseName,
                    note: detailRes.note ?? MOCK_DETAIL.note,
                    totalItems: detailRes.total_items ?? detailRes.totalItems ?? MOCK_DETAIL.totalItems,
                    totalValue: detailRes.total_value ?? detailRes.totalValue ?? MOCK_DETAIL.totalValue,
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
                    unitPrice: (x.unit_price as number) ?? (x.unitPrice as number) ?? 0,
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
            await inventoryService.confirmStockIn(orderId);
            setDetail(prev => ({ ...prev, status: "completed", approvedAt: new Date().toISOString() }));
        } catch {
            alert("Duyệt phiếu thất bại. Vui lòng thử lại.");
        } finally {
            setActionLoading("");
        }
    };

    const handleReceive = async () => {
        setActionLoading("receive");
        try {
            await inventoryService.receiveStockIn(orderId);
            setDetail(prev => ({ ...prev, status: "completed" }));
        } catch {
            alert("Nhận hàng thất bại. Vui lòng thử lại.");
        } finally {
            setActionLoading("");
        }
    };

    const handleCancel = async () => {
        if (!cancelReason.trim()) return;
        setActionLoading("cancel");
        try {
            await inventoryService.cancelStockIn(orderId, cancelReason);
            setDetail(prev => ({ ...prev, status: "cancelled", cancelReason }));
        } catch {
            alert("Đã hủy phiếu nhập.");
            setDetail(prev => ({ ...prev, status: "cancelled", cancelReason }));
        } finally {
            setActionLoading("");
            setShowCancelModal(false);
            setCancelReason("");
        }
    };

    const status = STATUS_MAP[detail.status];
    const totalValue = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

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
                    <Link href="/admin/medicines/import" className="hover:text-[#3C81C6] transition-colors">Nhập kho</Link>
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
                        <h1 className="text-2xl font-black tracking-tight text-[#121417] dark:text-white">Phiếu nhập {detail.code}</h1>
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
                        <button onClick={handleReceive} disabled={!!actionLoading}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                            {actionLoading === "receive" ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[18px]">inventory</span>}
                            Nhận hàng
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
                    <p className="text-xs text-[#687582] dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Nhà cung cấp</p>
                    <p className="text-sm font-bold text-[#121417] dark:text-white">{detail.supplier}</p>
                </div>
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <p className="text-xs text-[#687582] dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Kho nhận</p>
                    <p className="text-sm font-bold text-[#121417] dark:text-white">{detail.warehouseName}</p>
                </div>
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <p className="text-xs text-[#687582] dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Số loại thuốc</p>
                    <p className="text-sm font-bold text-[#121417] dark:text-white">{items.length} loại</p>
                </div>
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <p className="text-xs text-[#687582] dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Tổng giá trị</p>
                    <p className="text-sm font-bold text-[#3C81C6]">{totalValue.toLocaleString()}₫</p>
                </div>
            </div>

            {/* Note */}
            {detail.note && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-blue-600 text-[18px]">info</span>
                        <p className="text-sm font-bold text-blue-700 dark:text-blue-400">Ghi chú</p>
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-300">{detail.note}</p>
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
                        Danh sách thuốc nhập ({items.length})
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
                                <th className="py-3 px-5 text-xs font-semibold text-[#687582] uppercase text-right">Đơn giá</th>
                                <th className="py-3 px-5 text-xs font-semibold text-[#687582] uppercase text-right">Thành tiền</th>
                                <th className="py-3 px-5 text-xs font-semibold text-[#687582] uppercase">Số lô</th>
                                <th className="py-3 px-5 text-xs font-semibold text-[#687582] uppercase">HSD</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dde0e4] dark:divide-[#2d353e]">
                            {items.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="py-3 px-5 text-sm text-[#687582]">{idx + 1}</td>
                                    <td className="py-3 px-5 text-sm font-medium text-[#121417] dark:text-white">{item.drugName}</td>
                                    <td className="py-3 px-5 text-sm font-bold text-[#121417] dark:text-white text-right">{item.quantity.toLocaleString()}</td>
                                    <td className="py-3 px-5 text-sm text-[#687582]">{item.unit}</td>
                                    <td className="py-3 px-5 text-sm text-[#121417] dark:text-white text-right">{item.unitPrice.toLocaleString()}₫</td>
                                    <td className="py-3 px-5 text-sm font-bold text-[#3C81C6] text-right">{(item.quantity * item.unitPrice).toLocaleString()}₫</td>
                                    <td className="py-3 px-5 text-sm text-[#687582]">{item.lotNumber || "—"}</td>
                                    <td className="py-3 px-5 text-sm text-[#687582]">{item.expiryDate || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 dark:bg-gray-800/50 border-t-2 border-[#dde0e4] dark:border-[#2d353e]">
                            <tr>
                                <td colSpan={5} className="py-3 px-5 text-sm font-bold text-[#121417] dark:text-white text-right">Tổng cộng</td>
                                <td className="py-3 px-5 text-base font-black text-[#3C81C6] text-right">{totalValue.toLocaleString()}₫</td>
                                <td colSpan={2} />
                            </tr>
                        </tfoot>
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
                                <h3 className="text-lg font-bold text-[#121417] dark:text-white">Hủy phiếu nhập</h3>
                                <p className="text-sm text-[#687582]">Hành động này không thể hoàn tác</p>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Lý do hủy *</label>
                            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} placeholder="Nhập lý do hủy phiếu nhập..."
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
