"use client";

import Link from "next/link";
import { ROUTES } from "@/constants/routes";

interface QueueItem {
    id: string;
    order: number;
    patientName: string;
    patientCode: string;
    department: string;
    doctor: string;
    waitTime: string;
    status: string;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    examining: { label: "Đang khám", cls: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" },
    waiting: { label: "Chờ khám", cls: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" },
    checked_in: { label: "Đã tiếp nhận", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" },
};

export function PatientQueue({ data }: { data: QueueItem[] }) {
    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex flex-col">
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <span className="material-symbols-outlined text-amber-600 text-[20px]">queue</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">Hàng đợi bệnh nhân</h3>
                        <p className="text-xs text-[#687582] dark:text-gray-500">{data.length} bệnh nhân đang chờ</p>
                    </div>
                </div>
                <Link href={ROUTES.ADMIN.STATISTICS} className="text-xs text-[#3C81C6] hover:underline font-medium">
                    Xem tất cả
                </Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                    <thead className="bg-[#f9fafb] dark:bg-[#13191f]">
                        <tr>
                            {["STT", "Bệnh nhân", "Khoa", "Bác sĩ", "Chờ", "Trạng thái"].map((h) => (
                                <th key={h} className="py-2 px-3 text-[10px] font-semibold text-[#687582] dark:text-gray-500 uppercase tracking-wider first:pl-4">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e]">
                        {data.map((item) => {
                            const st = STATUS_MAP[item.status] || STATUS_MAP.waiting;
                            return (
                                <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="py-2 px-3 pl-4">
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#3C81C6]/10 text-[#3C81C6] text-xs font-bold">
                                            {item.order}
                                        </span>
                                    </td>
                                    <td className="py-2 px-3">
                                        <p className="text-sm font-medium text-[#121417] dark:text-white">{item.patientName}</p>
                                        <p className="text-[11px] text-[#687582] dark:text-gray-500">{item.patientCode}</p>
                                    </td>
                                    <td className="py-3 px-4 text-xs text-[#687582] dark:text-gray-400">{item.department}</td>
                                    <td className="py-3 px-4 text-xs text-[#121417] dark:text-gray-300">{item.doctor}</td>
                                    <td className="py-3 px-4 text-xs font-medium text-[#687582] dark:text-gray-400">{item.waitTime}</td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${st.cls}`}>
                                            {st.label}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default PatientQueue;
