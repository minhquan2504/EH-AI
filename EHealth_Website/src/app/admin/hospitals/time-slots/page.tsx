"use client";

import { useState, useEffect } from "react";
import { getSlotConfig, updateSlotConfig } from "@/services/systemConfigService";

interface TimeSlot {
    id: string;
    shift: string;
    startTime: string;
    endTime: string;
    maxPatients: number;
    status: "active" | "inactive";
}

const SHIFTS = ["Sáng", "Chiều", "Tối"];


export default function TimeSlotsPage() {
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [activeShift, setActiveShift] = useState("Sáng");

    useEffect(() => {
        getSlotConfig()
            .then((res: any) => {
                const items: any[] = res?.data?.slots ?? res?.data ?? res ?? [];
                if (Array.isArray(items) && items.length > 0) {
                    setSlots(items.map((s: any, i: number) => ({
                        id: s.id ?? String(i + 1),
                        shift: s.shift === "MORNING" ? "Sáng" : s.shift === "AFTERNOON" ? "Chiều" : s.shift === "NIGHT" ? "Tối" : s.shift ?? "Sáng",
                        startTime: s.startTime ?? s.start_time ?? "",
                        endTime: s.endTime ?? s.end_time ?? "",
                        maxPatients: s.maxPatients ?? s.max_patients ?? 0,
                        status: s.isActive === false ? "inactive" : "active",
                    })));
                }
            })
            .catch(() => { /* API không khả dụng, hiển thị trống */ });
    }, []);

    const filteredSlots = slots.filter((s) => s.shift === activeShift);

    const toggleSlot = (id: string) => {
        setSlots((prev) =>
            prev.map((s) => (s.id === id ? { ...s, status: s.status === "active" ? "inactive" : "active" } : s))
        );
        const slot = slots.find((s) => s.id === id);
        if (slot) {
            updateSlotConfig({ slotId: id, isActive: slot.status !== "active" }).catch(() => {});
        }
    };

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-[#121417] dark:text-white">Cấu hình khung giờ</h1>
                    <p className="text-[#687582] dark:text-gray-400">Quản lý các khung giờ khám bệnh cho từng ca</p>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Thêm khung giờ
                </button>
            </div>

            {/* Shift Tabs */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="flex border-b border-[#dde0e4] dark:border-[#2d353e]">
                    {SHIFTS.map((shift) => (
                        <button key={shift} onClick={() => setActiveShift(shift)}
                            className={`flex-1 py-3 text-sm font-bold text-center transition-colors relative ${activeShift === shift ? "text-[#3C81C6]" : "text-[#687582] hover:text-[#3C81C6]"}`}>
                            {shift}
                            ({slots.filter((s) => s.shift === shift && s.status === "active").length} slots)
                            {activeShift === shift && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3C81C6]" />}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {filteredSlots.map((slot) => (
                            <div key={slot.id}
                                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${slot.status === "active"
                                    ? "border-[#3C81C6]/30 bg-[#3C81C6]/5 dark:bg-[#3C81C6]/10"
                                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60"
                                    }`}
                                onClick={() => toggleSlot(slot.id)}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-lg font-black text-[#121417] dark:text-white">
                                        {slot.startTime}
                                    </span>
                                    <span className={`w-3 h-3 rounded-full ${slot.status === "active" ? "bg-green-500" : "bg-gray-400"}`} />
                                </div>
                                <p className="text-xs text-[#687582] dark:text-gray-400">
                                    {slot.startTime} — {slot.endTime}
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                    <span className="material-symbols-outlined text-[14px] text-[#687582]">group</span>
                                    <span className="text-xs text-[#687582] dark:text-gray-400">Tối đa {slot.maxPatients} BN</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
