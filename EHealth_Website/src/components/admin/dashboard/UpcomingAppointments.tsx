"use client";

import Link from "next/link";
import { ROUTES } from "@/constants/routes";

interface Appointment {
    id: string;
    patientName: string;
    patientAge: number;
    doctorName: string;
    department: string;
    time: string;
    date: string;
    status: string;
    type: string;
}

const STATUS_MAP: Record<string, { label: string; dot: string; text: string }> = {
    confirmed: { label: "Đã xác nhận", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
    waiting: { label: "Chờ xác nhận", dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
    in_progress: { label: "Đang khám", dot: "bg-blue-500", text: "text-blue-600 dark:text-blue-400" },
    cancelled: { label: "Đã hủy", dot: "bg-red-500", text: "text-red-600 dark:text-red-400" },
};

export function UpcomingAppointments({ data }: { data: Appointment[] }) {
    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex flex-col">
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <span className="material-symbols-outlined text-blue-600 text-[20px]">calendar_month</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">Lịch hẹn sắp tới</h3>
                        <p className="text-xs text-[#687582] dark:text-gray-500">{data.length} lịch hẹn hôm nay</p>
                    </div>
                </div>
                <Link href={ROUTES.ADMIN.SCHEDULES} className="text-xs text-[#3C81C6] hover:underline font-medium">
                    Xem tất cả
                </Link>
            </div>

            {/* Timeline list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-0">
                {data.map((apt, idx) => {
                    const st = STATUS_MAP[apt.status] || STATUS_MAP.confirmed;
                    const isLast = idx === data.length - 1;
                    return (
                        <div key={apt.id} className="flex gap-3 group">
                            {/* Timeline */}
                            <div className="flex flex-col items-center pt-1">
                                <div className={`w-2.5 h-2.5 rounded-full ${st.dot} ring-4 ring-white dark:ring-[#1e242b] z-10`} />
                                {!isLast && <div className="w-[2px] flex-1 bg-[#e5e7eb] dark:bg-[#2d353e] mt-1" />}
                            </div>

                            {/* Content */}
                            <div className={`flex-1 ${!isLast ? "pb-4" : "pb-1"}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-[#121417] dark:text-white bg-[#f6f7f8] dark:bg-[#13191f] px-2 py-0.5 rounded">
                                            {apt.time}
                                        </span>
                                        <span className={`text-[11px] font-medium ${st.text}`}>
                                            {st.label}
                                        </span>
                                    </div>
                                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[#687582] dark:text-gray-400 font-medium">
                                        {apt.type}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-[#121417] dark:text-white mt-1">
                                    {apt.patientName}
                                    <span className="text-[#687582] dark:text-gray-500 font-normal"> ({apt.patientAge} tuổi)</span>
                                </p>
                                <p className="text-xs text-[#687582] dark:text-gray-500 mt-0.5">
                                    {apt.doctorName} • {apt.department}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default UpcomingAppointments;
