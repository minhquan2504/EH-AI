"use client";

import { useState, useMemo } from "react";

interface TimeSlot {
    time: string;
    available: boolean;
    remaining?: number;
}

interface TimeSlotPickerProps {
    selectedDate: string;
    onDateChange: (date: string) => void;
    selectedTime: string;
    onTimeChange: (time: string) => void;
    slots?: TimeSlot[];
    loading?: boolean;
    availableDates?: string[];
}

const DAYS_HEADER = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTH_NAMES = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

const DEFAULT_SLOTS: TimeSlot[] = [
    { time: "07:00", available: true, remaining: 3 },
    { time: "07:30", available: true, remaining: 2 },
    { time: "08:00", available: true, remaining: 5 },
    { time: "08:30", available: true, remaining: 1 },
    { time: "09:00", available: false },
    { time: "09:30", available: true, remaining: 4 },
    { time: "10:00", available: true, remaining: 3 },
    { time: "10:30", available: true, remaining: 2 },
    { time: "13:30", available: true, remaining: 5 },
    { time: "14:00", available: true, remaining: 3 },
    { time: "14:30", available: false },
    { time: "15:00", available: true, remaining: 4 },
    { time: "15:30", available: true, remaining: 2 },
    { time: "16:00", available: true, remaining: 1 },
    { time: "16:30", available: true, remaining: 3 },
    { time: "17:00", available: false },
];

function formatDate(y: number, m: number, d: number): string {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function getCalendarDays(year: number, month: number): { date: string; day: number; isCurrentMonth: boolean; isToday: boolean; isPast: boolean }[] {
    const today = new Date();
    const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { date: string; day: number; isCurrentMonth: boolean; isToday: boolean; isPast: boolean }[] = [];

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
        const d = daysInPrevMonth - i;
        const m = month === 0 ? 11 : month - 1;
        const y = month === 0 ? year - 1 : year;
        const dateStr = formatDate(y, m, d);
        days.push({ date: dateStr, day: d, isCurrentMonth: false, isToday: dateStr === todayStr, isPast: dateStr < todayStr });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = formatDate(year, month, d);
        days.push({ date: dateStr, day: d, isCurrentMonth: true, isToday: dateStr === todayStr, isPast: dateStr < todayStr });
    }

    // Next month padding
    const remaining = 42 - days.length; // 6 rows
    for (let d = 1; d <= remaining; d++) {
        const m = month === 11 ? 0 : month + 1;
        const y = month === 11 ? year + 1 : year;
        const dateStr = formatDate(y, m, d);
        days.push({ date: dateStr, day: d, isCurrentMonth: false, isToday: dateStr === todayStr, isPast: dateStr < todayStr });
    }

    return days;
}

export function TimeSlotPicker({ selectedDate, onDateChange, selectedTime, onTimeChange, slots, loading, availableDates }: TimeSlotPickerProps) {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());

    const timeSlots = slots || DEFAULT_SLOTS;
    const calendarDays = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

    const morningSlots = timeSlots.filter(s => parseInt(s.time.split(":")[0]) < 12);
    const afternoonSlots = timeSlots.filter(s => parseInt(s.time.split(":")[0]) >= 12);

    const goToPrevMonth = () => {
        if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
        else setViewMonth(viewMonth - 1);
    };
    const goToNextMonth = () => {
        if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
        else setViewMonth(viewMonth + 1);
    };
    const goToToday = () => {
        setViewYear(today.getFullYear());
        setViewMonth(today.getMonth());
    };

    // Don't allow navigating to months before current
    const canGoPrev = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth > today.getMonth());

    return (
        <div className="space-y-6">
            {/* Calendar picker */}
            <div>
                <label className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>calendar_today</span>
                    Chọn ngày khám
                </label>

                <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 max-w-md">
                    {/* Calendar header */}
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={goToPrevMonth} disabled={!canGoPrev}
                            className="p-2 rounded-xl hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                            <span className="material-symbols-outlined text-gray-600" style={{ fontSize: "20px" }}>chevron_left</span>
                        </button>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-gray-900">
                                {MONTH_NAMES[viewMonth]} {viewYear}
                            </h3>
                            {(viewMonth !== today.getMonth() || viewYear !== today.getFullYear()) && (
                                <button onClick={goToToday}
                                    className="px-2.5 py-1 text-[10px] font-bold text-[#3C81C6] bg-[#3C81C6]/10 rounded-full hover:bg-[#3C81C6]/20 transition-colors">
                                    Hôm nay
                                </button>
                            )}
                        </div>
                        <button onClick={goToNextMonth}
                            className="p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all">
                            <span className="material-symbols-outlined text-gray-600" style={{ fontSize: "20px" }}>chevron_right</span>
                        </button>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 mb-1">
                        {DAYS_HEADER.map(d => (
                            <div key={d} className="text-center text-[11px] font-bold text-gray-400 uppercase py-2">{d}</div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, idx) => {
                            const isSelected = selectedDate === day.date;
                            const isDisabled = day.isPast || !day.isCurrentMonth;
                            const hasSlots = !availableDates || availableDates.includes(day.date);

                            return (
                                <button
                                    key={idx}
                                    onClick={() => !isDisabled && hasSlots && onDateChange(day.date)}
                                    disabled={isDisabled || !hasSlots}
                                    className={`relative h-10 w-10 mx-auto flex flex-col items-center justify-center rounded-xl text-sm transition-all duration-200
                                        ${isSelected
                                            ? "bg-gradient-to-br from-[#3C81C6] to-[#2563eb] text-white shadow-lg shadow-[#3C81C6]/25 scale-105 font-bold"
                                            : day.isToday
                                                ? "bg-[#3C81C6]/10 text-[#3C81C6] font-bold ring-2 ring-[#3C81C6]/30"
                                                : isDisabled
                                                    ? "text-gray-300 cursor-not-allowed"
                                                    : !hasSlots
                                                        ? "text-gray-300 cursor-not-allowed"
                                                        : "text-gray-700 hover:bg-white hover:shadow-sm cursor-pointer font-medium"
                                        }`}
                                >
                                    <span>{day.day}</span>
                                    {day.isToday && !isSelected && (
                                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#3C81C6]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Selected date display */}
                    {selectedDate && (
                        <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "16px" }}>event</span>
                            <span className="text-sm text-gray-700">
                                Đã chọn: <strong className="text-[#3C81C6]">
                                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                                </strong>
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Time slots */}
            <div>
                <label className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>schedule</span>
                    Chọn giờ khám
                </label>

                {!selectedDate ? (
                    <div className="flex items-center justify-center py-8 text-gray-400">
                        <div className="text-center">
                            <span className="material-symbols-outlined mb-2" style={{ fontSize: "36px" }}>calendar_today</span>
                            <p className="text-sm">Vui lòng chọn ngày khám trước</p>
                        </div>
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="w-8 h-8 border-3 border-[#3C81C6]/20 border-t-[#3C81C6] rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Legend */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-gray-50 border border-gray-200" />
                                <span>Còn chỗ</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-[#3C81C6]" />
                                <span>Đã chọn</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-red-100 border border-red-200" />
                                <span>Hết chỗ</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200" />
                                <span>Sắp hết</span>
                            </div>
                        </div>

                        {/* Morning */}
                        {morningSlots.length > 0 && (
                            <div>
                                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>wb_sunny</span>
                                    Buổi sáng
                                </div>
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                    {morningSlots.map(slot => (
                                        <SlotButton key={slot.time} slot={slot} selected={selectedTime === slot.time} onClick={() => slot.available && onTimeChange(slot.time)} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Afternoon */}
                        {afternoonSlots.length > 0 && (
                            <div>
                                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>wb_twilight</span>
                                    Buổi chiều
                                </div>
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                    {afternoonSlots.map(slot => (
                                        <SlotButton key={slot.time} slot={slot} selected={selectedTime === slot.time} onClick={() => slot.available && onTimeChange(slot.time)} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function SlotButton({ slot, selected, onClick }: { slot: TimeSlot; selected: boolean; onClick: () => void }) {
    const isLow = slot.available && slot.remaining !== undefined && slot.remaining <= 2;

    return (
        <button onClick={onClick} disabled={!slot.available}
            className={`relative py-2.5 px-1 rounded-xl text-sm font-medium transition-all duration-200 text-center
            ${selected ? "bg-gradient-to-b from-[#3C81C6] to-[#2563eb] text-white shadow-md shadow-[#3C81C6]/25 scale-105" : ""}
            ${!selected && slot.available && !isLow ? "bg-gray-50 text-gray-700 hover:bg-[#3C81C6]/[0.08] hover:text-[#3C81C6] border border-gray-100 hover:border-[#3C81C6]/20" : ""}
            ${!selected && isLow ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100" : ""}
            ${!slot.available ? "bg-red-50 text-red-300 cursor-not-allowed border border-red-100" : "cursor-pointer active:scale-[0.95]"}`}>
            {slot.time}
            {!slot.available && (
                <span className="block text-[10px] font-normal mt-0.5 text-red-400">Hết chỗ</span>
            )}
            {slot.available && slot.remaining !== undefined && !selected && (
                <span className={`block text-[10px] font-normal mt-0.5 ${isLow ? "text-amber-600" : "text-gray-400"}`}>
                    Còn {slot.remaining}
                </span>
            )}
        </button>
    );
}
