"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { scheduleService } from "@/services/scheduleService";

interface Schedule {
    id: string;
    doctorId: string;
    doctorName: string;
    department: string;
    shift: "MORNING" | "AFTERNOON" | "NIGHT";
    date: string;
    status: "SCHEDULED" | "ON_DUTY" | "COMPLETED" | "ABSENT" | "LEAVE";
    avatar?: string;
}

const SHIFTS = {
    MORNING: { label: "Ca sáng", time: "7:00 - 12:00", color: "bg-yellow-50 dark:bg-yellow-900/20", text: "text-yellow-700 dark:text-yellow-400", border: "border-yellow-200 dark:border-yellow-800", dot: "bg-yellow-400" },
    AFTERNOON: { label: "Ca chiều", time: "13:00 - 18:00", color: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800", dot: "bg-blue-400" },
    NIGHT: { label: "Ca đêm", time: "19:00 - 7:00", color: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800", dot: "bg-purple-400" },
};

const STATUS_STYLES = {
    SCHEDULED: { label: "Đã lên lịch", bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-700 dark:text-gray-300" },
    ON_DUTY: { label: "Đang trực", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
    COMPLETED: { label: "Hoàn thành", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
    ABSENT: { label: "Vắng mặt", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
    LEAVE: { label: "Nghỉ phép", bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400" },
};

const DOCTORS = [
    { id: "1", name: "BS. Nguyễn Văn An", dept: "Khoa Nội" },
    { id: "2", name: "BS. Trần Thị Bình", dept: "Khoa Ngoại" },
    { id: "3", name: "BS. Lê Văn Cường", dept: "Khoa Nhi" },
    { id: "4", name: "BS. Phạm Thị Dung", dept: "Khoa Sản" },
    { id: "5", name: "BS. Hoàng Văn Em", dept: "Khoa Tim mạch" },
    { id: "6", name: "BS. Ngô Thị Pha", dept: "Khoa Da liễu" },
];

const generateMockSchedules = (): Schedule[] => {
    const today = new Date();
    const schedules: Schedule[] = [];
    for (let i = -7; i <= 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];
        DOCTORS.forEach((doc, idx) => {
            const shifts: ("MORNING" | "AFTERNOON" | "NIGHT")[] = ["MORNING", "AFTERNOON", "NIGHT"];
            const shift = shifts[(idx + i + 20) % 3];
            const rand = Math.random();
            let status: Schedule["status"];
            if (i < 0) status = rand > 0.1 ? "COMPLETED" : "ABSENT";
            else if (i === 0) status = "ON_DUTY";
            else status = rand > 0.9 ? "LEAVE" : "SCHEDULED";
            schedules.push({
                id: `${doc.id}-${dateStr}`,
                doctorId: doc.id,
                doctorName: doc.name,
                department: doc.dept,
                shift,
                date: dateStr,
                status,
            });
        });
    }
    return schedules;
};

function getWeekDates(date: Date): Date[] {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    const monday = new Date(d.setDate(diff));
    return Array.from({ length: 7 }, (_, i) => {
        const dt = new Date(monday);
        dt.setDate(monday.getDate() + i);
        return dt;
    });
}

function getMonthDates(date: Date): Date[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // Pad to start on Monday
    const startDay = firstDay.getDay();
    const startOffset = startDay === 0 ? -6 : 1 - startDay;
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() + startOffset);
    const dates: Date[] = [];
    const current = new Date(start);
    while (dates.length < 42) { // 6 rows
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

const DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default function SchedulesPage() {
    const [schedules, setSchedules] = useState<Schedule[]>(generateMockSchedules());
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<"week" | "month">("week");
    const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

    useEffect(() => {
        const from = new Date();
        from.setDate(from.getDate() - 7);
        const to = new Date();
        to.setDate(to.getDate() + 14);
        scheduleService.getList({
            from: from.toISOString().split("T")[0],
            to: to.toISOString().split("T")[0],
            limit: 500,
        })
            .then((res: any) => {
                const items: any[] = res?.data?.items ?? res?.items ?? res?.data?.data ?? res?.data ?? res ?? [];
                if (Array.isArray(items) && items.length > 0) {
                    setSchedules(items.map((s: any) => ({
                        id: s.id ?? s.schedule_id ?? "",
                        doctorId: s.doctorId ?? s.doctor_id ?? "",
                        doctorName: s.doctorName ?? s.doctor_name ?? s.full_name ?? "",
                        department: s.department ?? s.departmentName ?? s.department_name ?? "",
                        shift: s.shift ?? "MORNING",
                        date: s.date ?? s.workDate ?? s.work_date ?? "",
                        status: s.status ?? "SCHEDULED",
                        avatar: s.avatar,
                    })));
                }
            })
            .catch(() => {/* keep mock */});
    }, []);

    const todayStr = new Date().toISOString().split("T")[0];

    const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
    const monthDates = useMemo(() => getMonthDates(currentDate), [currentDate]);

    const navigate = (dir: number) => {
        const d = new Date(currentDate);
        if (viewMode === "week") d.setDate(d.getDate() + dir * 7);
        else d.setMonth(d.getMonth() + dir);
        setCurrentDate(d);
    };

    const schedulesMap = useMemo(() => {
        const map: Record<string, Schedule[]> = {};
        schedules.forEach((s) => {
            const key = `${s.date}-${s.shift}`;
            if (!map[key]) map[key] = [];
            map[key].push(s);
        });
        return map;
    }, [schedules]);

    const handleDeleteSchedule = (scheduleId: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa lịch trực này?")) {
            setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
            setSelectedSchedule(null);
        }
    };

    const handleChangeStatus = (scheduleId: string, newStatus: Schedule["status"]) => {
        setSchedules((prev) =>
            prev.map((s) => (s.id === scheduleId ? { ...s, status: newStatus } : s))
        );
        setSelectedSchedule((prev) => prev && prev.id === scheduleId ? { ...prev, status: newStatus } : prev);
    };

    const handleExport = () => {
        const headers = ["Bác sĩ", "Khoa", "Ngày", "Ca trực", "Giờ", "Trạng thái"];
        const rows = schedules.map((s) => [
            s.doctorName, s.department,
            new Date(s.date).toLocaleDateString("vi-VN"),
            SHIFTS[s.shift].label, SHIFTS[s.shift].time,
            STATUS_STYLES[s.status].label,
        ]);
        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `schedules_export.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Stats
    const stats = {
        totalToday: schedules.filter((s) => s.date === todayStr).length,
        onDuty: schedules.filter((s) => s.date === todayStr && s.status === "ON_DUTY").length,
        onLeave: schedules.filter((s) => s.date === todayStr && s.status === "LEAVE").length,
    };

    const headerLabel = viewMode === "week"
        ? `${weekDates[0].toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} — ${weekDates[6].toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}`
        : currentDate.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });

    return (
        <>
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-[#121417] dark:text-white">
                        Quản lý Lịch trực
                    </h1>
                    <p className="text-[#687582] dark:text-gray-400">
                        Phân công và theo dõi lịch trực của bác sĩ
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] text-[#121417] dark:text-white rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">download</span>
                        Xuất lịch
                    </button>
                    <button
                        onClick={() => router.push('/admin/schedules/new')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all transform hover:-translate-y-0.5"
                    >
                        <span className="material-symbols-outlined text-[20px]">add_circle</span>
                        Thêm lịch trực
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600"><span className="material-symbols-outlined">event</span></div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Lịch trực hôm nay</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{stats.totalToday}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600"><span className="material-symbols-outlined">work</span></div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Đang trực</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{stats.onDuty}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600"><span className="material-symbols-outlined">event_busy</span></div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Nghỉ phép</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{stats.onLeave}</p>
                    </div>
                </div>
            </div>

            {/* Calendar Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-[#687582]">
                        <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                    </button>
                    <h2 className="text-lg font-bold text-[#121417] dark:text-white min-w-[220px] text-center capitalize">
                        {headerLabel}
                    </h2>
                    <button onClick={() => navigate(1)} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-[#687582]">
                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                    </button>
                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="px-3 py-1.5 text-sm font-medium text-[#3C81C6] bg-[#3C81C6]/10 rounded-lg hover:bg-[#3C81C6]/20 transition-colors"
                    >
                        Hôm nay
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Legend */}
                    <div className="hidden lg:flex items-center gap-3 mr-2">
                        {(Object.keys(SHIFTS) as (keyof typeof SHIFTS)[]).map((key) => (
                            <div key={key} className="flex items-center gap-1.5 text-xs text-[#687582]">
                                <span className={`w-2.5 h-2.5 rounded-full ${SHIFTS[key].dot}`} />
                                {SHIFTS[key].label}
                            </div>
                        ))}
                    </div>
                    <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <button
                            onClick={() => setViewMode("week")}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === "week" ? "bg-[#3C81C6] text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                        >
                            Tuần
                        </button>
                        <button
                            onClick={() => setViewMode("month")}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === "month" ? "bg-[#3C81C6] text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                        >
                            Tháng
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm overflow-hidden">
                {viewMode === "week" ? (
                    <WeekView weekDates={weekDates} schedulesMap={schedulesMap} todayStr={todayStr} onSelect={setSelectedSchedule} />
                ) : (
                    <MonthView monthDates={monthDates} schedulesMap={schedulesMap} todayStr={todayStr} currentMonth={currentDate.getMonth()} />
                )}
            </div>

            {/* Schedule Detail Panel */}
            {selectedSchedule && (
                <ScheduleDetailPanel
                    schedule={selectedSchedule}
                    onClose={() => setSelectedSchedule(null)}
                    onChangeStatus={handleChangeStatus}
                    onDelete={handleDeleteSchedule}
                />
            )}
        </>
    );
}

/* ─── Week View ─── */
function WeekView({ weekDates, schedulesMap, todayStr, onSelect }: {
    weekDates: Date[];
    schedulesMap: Record<string, Schedule[]>;
    todayStr: string;
    onSelect: (s: Schedule) => void;
}) {
    const shiftKeys: (keyof typeof SHIFTS)[] = ["MORNING", "AFTERNOON", "NIGHT"];

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
                <thead>
                    <tr className="border-b border-[#dde0e4] dark:border-[#2d353e]">
                        <th className="w-24 py-3 px-4 text-left text-xs font-semibold text-[#687582] uppercase bg-gray-50/50 dark:bg-gray-800/50">Ca trực</th>
                        {weekDates.map((d, i) => {
                            const dateStr = d.toISOString().split("T")[0];
                            const isToday = dateStr === todayStr;
                            return (
                                <th key={i} className={`py-3 px-2 text-center border-l border-[#dde0e4] dark:border-[#2d353e] ${isToday ? "bg-[#3C81C6]/5" : "bg-gray-50/50 dark:bg-gray-800/50"}`}>
                                    <div className="text-xs font-semibold text-[#687582] uppercase">{DAY_NAMES[i]}</div>
                                    <div className={`text-lg font-black mt-0.5 ${isToday ? "text-[#3C81C6]" : "text-[#121417] dark:text-white"}`}>
                                        {d.getDate()}
                                        {isToday && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3C81C6] ml-1 align-super" />}
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {shiftKeys.map((shiftKey) => {
                        const shift = SHIFTS[shiftKey];
                        return (
                            <tr key={shiftKey} className="border-b border-[#dde0e4] dark:border-[#2d353e] last:border-0">
                                <td className="py-3 px-4 bg-gray-50/50 dark:bg-gray-800/50 align-top">
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${shift.color} ${shift.text}`}>
                                        <span className={`w-2 h-2 rounded-full ${shift.dot}`} />
                                        {shift.label}
                                    </div>
                                    <p className="text-[10px] text-[#687582] mt-1">{shift.time}</p>
                                </td>
                                {weekDates.map((d, i) => {
                                    const dateStr = d.toISOString().split("T")[0];
                                    const isToday = dateStr === todayStr;
                                    const key = `${dateStr}-${shiftKey}`;
                                    const cellSchedules = schedulesMap[key] || [];
                                    return (
                                        <td
                                            key={i}
                                            className={`py-2 px-1.5 border-l border-[#dde0e4] dark:border-[#2d353e] align-top ${isToday ? "bg-[#3C81C6]/5" : ""}`}
                                        >
                                            <div className="space-y-1 min-h-[60px]">
                                                {cellSchedules.map((s) => {
                                                    const st = STATUS_STYLES[s.status];
                                                    return (
                                                        <button
                                                            key={s.id}
                                                            onClick={() => onSelect(s)}
                                                            className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:shadow-sm hover:scale-[1.02] border ${st.bg} ${st.text} border-current/10`}
                                                        >
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-5 h-5 rounded-full bg-[#3C81C6]/10 flex items-center justify-center flex-shrink-0">
                                                                    <span className="material-symbols-outlined text-[12px] text-[#3C81C6]">person</span>
                                                                </div>
                                                                <span className="truncate">{(s.doctorName || "").replace("BS. ", "")}</span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

/* ─── Month View ─── */
function MonthView({ monthDates, schedulesMap, todayStr, currentMonth }: {
    monthDates: Date[];
    schedulesMap: Record<string, Schedule[]>;
    todayStr: string;
    currentMonth: number;
}) {
    return (
        <div className="p-4">
            {/* Header row */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {DAY_NAMES.map((d) => (
                    <div key={d} className="text-center text-xs font-bold text-[#687582] uppercase py-2">{d}</div>
                ))}
            </div>
            {/* Date grid */}
            <div className="grid grid-cols-7 gap-1">
                {monthDates.map((d, i) => {
                    const dateStr = d.toISOString().split("T")[0];
                    const isToday = dateStr === todayStr;
                    const isCurrentMonth = d.getMonth() === currentMonth;
                    // Count schedules
                    const morningCount = (schedulesMap[`${dateStr}-MORNING`] || []).length;
                    const afternoonCount = (schedulesMap[`${dateStr}-AFTERNOON`] || []).length;
                    const nightCount = (schedulesMap[`${dateStr}-NIGHT`] || []).length;
                    const totalCount = morningCount + afternoonCount + nightCount;

                    return (
                        <div
                            key={i}
                            className={`p-2 rounded-lg min-h-[80px] transition-colors border ${
                                isToday
                                    ? "border-[#3C81C6] bg-[#3C81C6]/5"
                                    : isCurrentMonth
                                        ? "border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                        : "border-transparent opacity-40"
                            }`}
                        >
                            <div className={`text-sm font-bold mb-1 ${isToday ? "text-[#3C81C6]" : "text-[#121417] dark:text-white"}`}>
                                {d.getDate()}
                            </div>
                            {totalCount > 0 && (
                                <div className="space-y-0.5">
                                    {morningCount > 0 && (
                                        <div className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                                            <span className="text-[10px] text-[#687582] truncate">{morningCount} sáng</span>
                                        </div>
                                    )}
                                    {afternoonCount > 0 && (
                                        <div className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                                            <span className="text-[10px] text-[#687582] truncate">{afternoonCount} chiều</span>
                                        </div>
                                    )}
                                    {nightCount > 0 && (
                                        <div className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
                                            <span className="text-[10px] text-[#687582] truncate">{nightCount} đêm</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── Schedule Detail Panel ─── */
function ScheduleDetailPanel({ schedule, onClose, onChangeStatus, onDelete }: {
    schedule: Schedule;
    onClose: () => void;
    onChangeStatus: (id: string, status: Schedule["status"]) => void;
    onDelete: (id: string) => void;
}) {
    const shiftInfo = SHIFTS[schedule.shift];
    const statusInfo = STATUS_STYLES[schedule.status];

    return (
        <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#3C81C6]/10 flex items-center justify-center text-[#3C81C6]">
                        <span className="material-symbols-outlined text-3xl">person</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white">{schedule.doctorName}</h3>
                        <p className="text-sm text-[#687582] dark:text-gray-400">{schedule.department}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-[#687582]">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <p className="text-xs text-[#687582]">Ngày</p>
                    <p className="text-sm font-bold text-[#121417] dark:text-white">
                        {new Date(schedule.date).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
                    </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <p className="text-xs text-[#687582]">Ca trực</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium mt-1 ${shiftInfo.color} ${shiftInfo.text}`}>
                        {shiftInfo.label} ({shiftInfo.time})
                    </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <p className="text-xs text-[#687582]">Trạng thái</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold mt-1 ${statusInfo.bg} ${statusInfo.text}`}>
                        {statusInfo.label}
                    </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <p className="text-xs text-[#687582]">Mã lịch</p>
                    <p className="text-sm font-bold text-[#3C81C6] mt-1">{schedule.id}</p>
                </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[#687582] mr-1">Thao tác:</span>
                <button onClick={() => onChangeStatus(schedule.id, "COMPLETED")} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 transition-colors">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>Hoàn thành
                </button>
                <button onClick={() => onChangeStatus(schedule.id, "ABSENT")} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition-colors">
                    <span className="material-symbols-outlined text-[14px]">cancel</span>Vắng mặt
                </button>
                <button onClick={() => onChangeStatus(schedule.id, "LEAVE")} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 transition-colors">
                    <span className="material-symbols-outlined text-[14px]">event_busy</span>Nghỉ phép
                </button>
                <button onClick={() => onDelete(schedule.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-red-600 hover:bg-red-50 dark:bg-gray-800 dark:text-red-400 transition-colors ml-auto">
                    <span className="material-symbols-outlined text-[14px]">delete</span>Xóa lịch
                </button>
            </div>
        </div>
    );
}
