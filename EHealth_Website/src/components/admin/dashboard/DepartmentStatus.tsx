"use client";

import Link from "next/link";
import { ROUTES } from "@/constants/routes";

interface DeptDistribution {
    department: string;
    icon: string;
    color: string;
    totalDoctors: number;
    onDuty: number;
    patientsWaiting: number;
}

export function DepartmentStatus({ departments }: { departments: DeptDistribution[] }) {
    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex flex-col">
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <span className="material-symbols-outlined text-indigo-600 text-[20px]">local_hospital</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">Phân bổ bác sĩ theo khoa</h3>
                        <p className="text-xs text-[#687582] dark:text-gray-500">{departments.length} chuyên khoa</p>
                    </div>
                </div>
                <Link href={ROUTES.ADMIN.DEPARTMENTS} className="text-xs text-[#3C81C6] hover:underline font-medium">
                    Chi tiết
                </Link>
            </div>

            {/* Department cards */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {departments.map((dept) => {
                    const dutyPct = Math.round((dept.onDuty / dept.totalDoctors) * 100);
                    return (
                        <div
                            key={dept.department}
                            className="flex items-center gap-3 p-3 rounded-xl bg-[#f9fafb] dark:bg-[#13191f] hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors group"
                        >
                            {/* Icon */}
                            <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${dept.color}15` }}
                            >
                                <span className="material-symbols-outlined text-[18px]" style={{ color: dept.color }}>
                                    {dept.icon}
                                </span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-xs font-semibold text-[#121417] dark:text-white truncate">{dept.department}</p>
                                    <span className="text-[11px] text-[#687582] dark:text-gray-500 flex-shrink-0">
                                        {dept.onDuty}/{dept.totalDoctors} BS
                                    </span>
                                </div>
                                {/* Progress bar */}
                                <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${dutyPct}%`, backgroundColor: dept.color }}
                                    />
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-[10px] text-[#687582] dark:text-gray-500">{dutyPct}% đang trực</span>
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                        {dept.patientsWaiting} BN chờ
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default DepartmentStatus;
