"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { billingService } from "@/services/billingService";
import { unwrapList } from "@/api/response";
import { usePageAIContext } from "@/hooks/usePageAIContext";


const STATUS_MAP: Record<string, { label: string; style: string }> = {
    pending:   { label: "Chờ thanh toán", style: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" },
    paid:      { label: "Đã thanh toán",  style: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" },
    partial:   { label: "Thanh toán một phần", style: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" },
    cancelled: { label: "Đã hủy",        style: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" },
    refunded:  { label: "Đã hoàn tiền",  style: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
};

const FILTER_TABS = [
    { k: "all",       l: "Tất cả" },
    { k: "pending",   l: "Chờ thanh toán" },
    { k: "partial",   l: "Một phần" },
    { k: "paid",      l: "Đã thanh toán" },
    { k: "cancelled", l: "Đã hủy" },
    { k: "refunded",  l: "Đã hoàn" },
];

type Invoice = { id: string; invoiceNumber: string; patient: string; patientName: string; patientId: string; date: string; createdAt: string; services: string; total: number; insurance: number; insuranceCovered: number; paid: number; status: string; paymentMethod: string; items: any[] } & Record<string, any>;

const fmt = (n: number) => (n || 0).toLocaleString("vi-VN") + "đ";

export default function BillingPage() {
    usePageAIContext({ pageKey: 'billing' });
    const router = useRouter();

    const [invoices, setInvoices]         = useState<Invoice[]>([]);
    const [filter, setFilter]             = useState("all");
    const [dateFrom, setDateFrom]         = useState("");
    const [dateTo, setDateTo]             = useState("");
    const [patientSearch, setPatientSearch] = useState("");
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState<string | null>(null);
    const [selectedInv, setSelectedInv]   = useState<Invoice | null>(null);
    const [exporting, setExporting]       = useState(false);

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params: Record<string, any> = { limit: 100 };
            if (filter !== "all") params.status = filter;
            if (dateFrom) params.dateFrom = dateFrom;
            if (dateTo)   params.dateTo   = dateTo;
            if (patientSearch) params.patientName = patientSearch;

            const res = await billingService.getInvoices(params);
            const { data } = unwrapList<Invoice>(res);
            if (data.length > 0) {
                const normalized = data.map((inv: any) => ({
                    ...inv,
                    id:          inv.id ?? inv._id ?? inv.invoiceNumber ?? "",
                    patient:     inv.patientName ?? inv.patient ?? "",
                    patientId:   inv.patientId ?? "",
                    date:        inv.createdAt
                        ? new Date(inv.createdAt).toLocaleDateString("vi-VN")
                        : (inv.date ?? ""),
                    services:    inv.description ?? inv.services ?? "",
                    total:       Number(inv.totalAmount ?? inv.total ?? 0),
                    insurance:   Number(inv.insuranceCovered ?? inv.insurance ?? 0),
                    paid:        Number(inv.paidAmount ?? inv.paid ?? 0),
                    status:      inv.status ?? "pending",
                    paymentMethod: inv.paymentMethod ?? "",
                    items:       inv.items ?? [],
                }));
                setInvoices(normalized);
            }
        } catch {
            setInvoices([]);
            setError("Không thể tải danh sách hóa đơn. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    }, [filter, dateFrom, dateTo, patientSearch]);

    useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

    const filtered = invoices.filter((inv) => {
        if (filter !== "all" && inv.status !== filter) return false;
        if (patientSearch && !inv.patient.toLowerCase().includes(patientSearch.toLowerCase())) return false;
        return true;
    });

    const totalRevenue  = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.paid, 0);
    const pendingAmount = invoices.filter(i => i.status === "pending").reduce((s, i) => s + i.total - i.insurance, 0);
    const totalInsurance = invoices.reduce((s, i) => s + (i.insurance || 0), 0);

    const handleCancel = async (inv: Invoice) => {
        if (!confirm(`Bạn có chắc muốn hủy hóa đơn ${inv.id}?`)) return;
        try {
            await billingService.cancelInvoice(inv.id, "Hủy bởi lễ tân");
            setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: "cancelled" } : i));
            setSelectedInv(null);
        } catch {
            alert("Hủy hóa đơn thất bại. Vui lòng thử lại.");
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const params: Record<string, any> = {};
            if (filter !== "all") params.status = filter;
            if (dateFrom) params.dateFrom = dateFrom;
            if (dateTo)   params.dateTo   = dateTo;
            const res = await billingService.exportInvoices(params);
            const blob = res.data instanceof Blob ? res.data : new Blob([res.data]);
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `hoadon_${new Date().toISOString().split("T")[0]}.xlsx`;
            link.click();
            URL.revokeObjectURL(url);
        } catch {
            // Fallback: export as CSV from current data
            const lines = [
                "Mã HĐ,Bệnh nhân,Dịch vụ,Tổng tiền,BHYT,Cần TT,Trạng thái,Phương thức",
                ...filtered.map(i =>
                    `${i.id},"${i.patient}","${i.services}",${i.total},${i.insurance},${i.total - i.insurance},${STATUS_MAP[i.status]?.label ?? i.status},${i.paymentMethod}`
                ),
            ];
            const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `hoadon_${new Date().toISOString().split("T")[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#121417] dark:text-white">Thanh toán & Hóa đơn</h1>
                        <p className="text-sm text-[#687582] mt-1">Quản lý thanh toán viện phí và bảo hiểm</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleExport}
                            disabled={exporting}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] text-[#687582] rounded-xl text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>download</span>
                            {exporting ? "Đang xuất..." : "Xuất báo cáo"}
                        </button>
                        <button
                            onClick={() => router.push('/portal/receptionist/billing/new')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-medium transition-colors"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>receipt_long</span>
                            Tạo hóa đơn mới
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-sm text-amber-700 dark:text-amber-400">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>warning</span>
                        {error}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {[
                        { l: "Tổng hóa đơn",    v: invoices.length.toString(),   i: "receipt",          c: "from-blue-500 to-blue-600" },
                        { l: "Doanh thu hôm nay", v: fmt(totalRevenue),           i: "payments",         c: "from-green-500 to-green-600" },
                        { l: "Chờ thanh toán",   v: fmt(pendingAmount),           i: "pending_actions",  c: "from-amber-500 to-amber-600" },
                        { l: "BHYT chi trả",     v: fmt(totalInsurance),          i: "health_and_safety", c: "from-violet-500 to-violet-600" },
                    ].map((s) => (
                        <div key={s.l} className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.c} flex items-center justify-center`}>
                                <span className="material-symbols-outlined text-white" style={{ fontSize: "20px" }}>{s.i}</span>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-[#121417] dark:text-white">{s.v}</p>
                                <p className="text-xs text-[#687582]">{s.l}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Status tabs */}
                    <div className="flex gap-2 flex-wrap">
                        {FILTER_TABS.map((f) => (
                            <button
                                key={f.k}
                                onClick={() => setFilter(f.k)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f.k ? "bg-[#3C81C6] text-white" : "bg-white dark:bg-[#1e242b] text-[#687582] border border-[#dde0e4] dark:border-[#2d353e] hover:bg-gray-50 dark:hover:bg-[#252d36]"}`}
                            >
                                {f.l}
                            </button>
                        ))}
                    </div>
                    {/* Search + date range */}
                    <div className="flex gap-2 ml-auto">
                        <input
                            type="text"
                            value={patientSearch}
                            onChange={e => setPatientSearch(e.target.value)}
                            placeholder="Tìm tên bệnh nhân..."
                            className="px-3 py-2 text-sm bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 dark:text-white placeholder:text-gray-400 w-48"
                        />
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                            className="px-3 py-2 text-sm bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 dark:text-white"
                        />
                        <input
                            type="date"
                            value={dateTo}
                            onChange={e => setDateTo(e.target.value)}
                            className="px-3 py-2 text-sm bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 dark:text-white"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 gap-3 text-[#687582]">
                            <div className="w-6 h-6 border-2 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Đang tải hóa đơn...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 mb-3" style={{ fontSize: "56px" }}>receipt_long</span>
                            <p className="text-sm font-medium text-[#121417] dark:text-white mb-1">Không có hóa đơn nào</p>
                            <p className="text-xs text-[#687582]">Thử thay đổi bộ lọc hoặc tạo hóa đơn mới</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-[#dde0e4] dark:border-[#2d353e] bg-[#f6f7f8] dark:bg-[#13191f]">
                                        {["Mã HĐ", "Bệnh nhân", "Dịch vụ", "Tổng tiền", "BHYT", "Cần thanh toán", "Trạng thái", "Thao tác"].map((h) => (
                                            <th key={h} className="px-4 py-3 text-xs font-semibold text-[#687582] uppercase">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((inv) => {
                                        const stCfg = STATUS_MAP[inv.status] ?? STATUS_MAP.pending;
                                        const needPay = inv.total - (inv.insurance || 0);
                                        return (
                                            <tr
                                                key={inv.id}
                                                className="border-b border-[#dde0e4] dark:border-[#2d353e] last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer"
                                                onClick={() => setSelectedInv(inv)}
                                            >
                                                <td className="px-4 py-3 text-sm font-mono text-[#3C81C6] font-medium">{inv.id}</td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm font-semibold text-[#121417] dark:text-white">{inv.patient}</p>
                                                    <p className="text-xs text-[#687582]">{inv.date}</p>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-[#121417] dark:text-white max-w-[200px] truncate">{inv.services}</td>
                                                <td className="px-4 py-3 text-sm font-semibold text-[#121417] dark:text-white">{fmt(inv.total)}</td>
                                                <td className="px-4 py-3 text-sm text-green-600">{inv.insurance > 0 ? `-${fmt(inv.insurance)}` : "—"}</td>
                                                <td className="px-4 py-3 text-sm font-bold text-[#121417] dark:text-white">{fmt(needPay)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${stCfg.style}`}>{stCfg.label}</span>
                                                </td>
                                                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                                    <div className="flex gap-1">
                                                        {inv.status === "pending" && (
                                                            <button
                                                                onClick={() => router.push(`/portal/receptionist/billing/new?invoiceId=${inv.id}`)}
                                                                className="p-1.5 rounded-lg hover:bg-green-50 text-green-600"
                                                                title="Thu tiền"
                                                            >
                                                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>payments</span>
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await billingService.getInvoicePDF(inv.id);
                                                                } catch {
                                                                    window.print();
                                                                }
                                                            }}
                                                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
                                                            title="In hóa đơn"
                                                        >
                                                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>print</span>
                                                        </button>
                                                        {(inv.status === "pending" || inv.status === "partial") && (
                                                            <button
                                                                onClick={() => handleCancel(inv)}
                                                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                                                                title="Hủy hóa đơn"
                                                            >
                                                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>cancel</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Invoice Detail Modal */}
            {selectedInv && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={() => setSelectedInv(null)}
                >
                    <div
                        className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-[#121417] dark:text-white">Chi tiết hóa đơn</h3>
                                <p className="text-sm text-[#687582] mt-0.5">Mã: {selectedInv.id} • {selectedInv.date}</p>
                            </div>
                            <button onClick={() => setSelectedInv(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                <span className="material-symbols-outlined text-[#687582]">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "20px" }}>person</span>
                                <div>
                                    <p className="text-sm font-semibold text-[#121417] dark:text-white">{selectedInv.patient}</p>
                                    <p className="text-xs text-[#687582]">Mã BN: {selectedInv.patientId || "—"}</p>
                                </div>
                            </div>

                            {selectedInv.services && (
                                <div className="p-3 bg-[#f6f7f8] dark:bg-[#13191f] rounded-xl">
                                    <p className="text-sm text-[#121417] dark:text-white">{selectedInv.services}</p>
                                </div>
                            )}

                            <div className="border-t border-[#e5e7eb] dark:border-[#2d353e] pt-3 space-y-1.5 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-[#687582]">Tổng cộng</span>
                                    <span className="font-semibold text-[#121417] dark:text-white">{fmt(selectedInv.total)}</span>
                                </div>
                                {selectedInv.insurance > 0 && (
                                    <div className="flex justify-between text-blue-600">
                                        <span>BHYT chi trả</span>
                                        <span>-{fmt(selectedInv.insurance)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 border-t border-[#e5e7eb] dark:border-[#2d353e] text-base font-bold">
                                    <span className="text-[#121417] dark:text-white">Cần thanh toán</span>
                                    <span className="text-[#3C81C6]">{fmt(selectedInv.total - (selectedInv.insurance || 0))}</span>
                                </div>
                            </div>

                            <div className={`flex items-center gap-2 p-3 rounded-xl ${STATUS_MAP[selectedInv.status]?.style ?? ""}`}>
                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>info</span>
                                <p className="text-sm font-semibold">{STATUS_MAP[selectedInv.status]?.label ?? selectedInv.status}</p>
                                {selectedInv.paymentMethod && (
                                    <p className="text-xs ml-auto">{selectedInv.paymentMethod}</p>
                                )}
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#e5e7eb] dark:border-[#2d353e] flex gap-3">
                            {(selectedInv.status === "pending" || selectedInv.status === "partial") && (
                                <button
                                    onClick={() => handleCancel(selectedInv)}
                                    className="flex-1 py-2.5 text-sm font-medium text-red-600 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    Hủy hóa đơn
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedInv(null)}
                                className="flex-1 py-2.5 text-sm font-medium text-[#687582] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl hover:bg-gray-50 dark:hover:bg-[#252d36] transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
