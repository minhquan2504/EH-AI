"use client";

import Link from "next/link";
import { ROUTES } from "@/constants/routes";

interface MedicineAlert {
    id: string;
    name: string;
    code: string;
    stock: number;
    unit: string;
    alertType: string;
    alertLabel: string;
    expiryDate: string;
}

const ALERT_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
    low_stock: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400", icon: "trending_down" },
    expiring: { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-700 dark:text-orange-400", icon: "schedule" },
    out_of_stock: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-400", icon: "close" },
};

export function MedicineAlerts({ data }: { data: MedicineAlert[] }) {
    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex flex-col">
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <span className="material-symbols-outlined text-red-500 text-[20px]">medication</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">Cảnh báo thuốc</h3>
                        <p className="text-xs text-[#687582] dark:text-gray-500">{data.length} mặt hàng cần chú ý</p>
                    </div>
                </div>
                <Link href={ROUTES.ADMIN.MEDICINES} className="text-xs text-[#3C81C6] hover:underline font-medium">
                    Xem kho thuốc
                </Link>
            </div>

            {/* Alert list */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#f0f1f3] dark:divide-[#2d353e]">
                {data.map((item) => {
                    const style = ALERT_STYLES[item.alertType] || ALERT_STYLES.low_stock;
                    return (
                        <div key={item.id} className="px-5 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                            <div className="flex items-start gap-3">
                                <div className={`mt-0.5 p-1 rounded-md ${style.bg}`}>
                                    <span className={`material-symbols-outlined text-[16px] ${style.text}`}>{style.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-medium text-[#121417] dark:text-white truncate">{item.name}</p>
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${style.bg} ${style.text} flex-shrink-0`}>
                                            {item.alertLabel}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-[11px] text-[#687582] dark:text-gray-500">
                                        <span>Mã: {item.code}</span>
                                        <span>•</span>
                                        <span>Tồn: <b className={item.stock === 0 ? "text-red-500" : "text-[#121417] dark:text-white"}>{item.stock}</b> {item.unit}</span>
                                        {item.expiryDate !== "—" && (
                                            <>
                                                <span>•</span>
                                                <span>HSD: {item.expiryDate}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default MedicineAlerts;
