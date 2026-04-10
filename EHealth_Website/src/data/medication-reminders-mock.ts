/**
 * Medication Reminders Mock Data
 * Dữ liệu nhắc thuốc cho bệnh nhân
 */

export interface MedicationReminder {
    id: string;
    profileId: string;          // unified: dùng profileId thay patientProfileId
    medicationName: string;
    dosage: string;
    frequency: number;
    timesOfDay: string[];
    instructions: string;
    startDate: string;
    endDate: string;
    prescriptionId?: string;
    isActive: boolean;
    color: string;
    createdAt: string;
}

export interface MedicationLog {
    id: string;
    reminderId: string;
    profileId: string;          // thêm profileId cho filter
    date: string;
    scheduledTime: string;
    status: "taken" | "missed" | "skipped";
    actualTime?: string;
    note?: string;
}

const today = new Date();
const fmt = (d: Date) => d.toISOString().split("T")[0];
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

export const MOCK_MEDICATION_REMINDERS: MedicationReminder[] = [
    {
        id: "med-001",
        profileId: "pp-001",
        medicationName: "Amlodipine 5mg",
        dosage: "1 viên",
        frequency: 1,
        timesOfDay: ["08:00"],
        instructions: "Uống sau ăn sáng",
        startDate: fmt(addDays(today, -30)),
        endDate: fmt(addDays(today, 60)),
        prescriptionId: "rx-001",
        isActive: true,
        color: "from-red-500 to-rose-600",
        createdAt: addDays(today, -30).toISOString(),
    },
    {
        id: "med-002",
        profileId: "pp-001",
        medicationName: "Metformin 500mg",
        dosage: "1 viên",
        frequency: 2,
        timesOfDay: ["07:00", "19:00"],
        instructions: "Uống sau ăn (sáng & tối)",
        startDate: fmt(addDays(today, -60)),
        endDate: fmt(addDays(today, 30)),
        prescriptionId: "rx-001",
        isActive: true,
        color: "from-blue-500 to-indigo-600",
        createdAt: addDays(today, -60).toISOString(),
    },
    {
        id: "med-003",
        profileId: "pp-001",
        medicationName: "Vitamin D3 1000IU",
        dosage: "1 viên",
        frequency: 1,
        timesOfDay: ["12:00"],
        instructions: "Uống sau ăn trưa",
        startDate: fmt(addDays(today, -14)),
        endDate: fmt(addDays(today, 76)),
        isActive: true,
        color: "from-amber-500 to-orange-600",
        createdAt: addDays(today, -14).toISOString(),
    },
    {
        id: "med-004",
        profileId: "pp-001",
        medicationName: "Omeprazole 20mg",
        dosage: "1 viên",
        frequency: 1,
        timesOfDay: ["06:30"],
        instructions: "Uống trước ăn sáng 30 phút",
        startDate: fmt(addDays(today, -7)),
        endDate: fmt(addDays(today, 7)),
        prescriptionId: "rx-002",
        isActive: true,
        color: "from-emerald-500 to-green-600",
        createdAt: addDays(today, -7).toISOString(),
    },
    {
        id: "med-005",
        profileId: "pp-002",
        medicationName: "Metformin 850mg",
        dosage: "1 viên",
        frequency: 2,
        timesOfDay: ["07:00", "19:00"],
        instructions: "Uống trong bữa ăn",
        startDate: fmt(addDays(today, -90)),
        endDate: fmt(addDays(today, 90)),
        prescriptionId: "rx-003",
        isActive: true,
        color: "from-violet-500 to-purple-600",
        createdAt: addDays(today, -90).toISOString(),
    },
    {
        id: "med-006",
        profileId: "pp-001",
        medicationName: "Amoxicillin 500mg",
        dosage: "1 viên",
        frequency: 3,
        timesOfDay: ["07:00", "13:00", "19:00"],
        instructions: "Uống đều đặn mỗi 8 tiếng",
        startDate: fmt(addDays(today, -14)),
        endDate: fmt(addDays(today, -7)),
        prescriptionId: "rx-002",
        isActive: false,
        color: "from-cyan-500 to-teal-600",
        createdAt: addDays(today, -14).toISOString(),
    },
];

// Generate medication logs for the last 7 days
const generateLogs = (): MedicationLog[] => {
    const logs: MedicationLog[] = [];
    const activeReminders = MOCK_MEDICATION_REMINDERS.filter(r => r.isActive);

    for (let dayOffset = -6; dayOffset <= 0; dayOffset++) {
        const date = fmt(addDays(today, dayOffset));

        for (const reminder of activeReminders) {
            for (const time of reminder.timesOfDay) {
                const rand = Math.random();
                let status: MedicationLog["status"] = "taken";
                if (rand > 0.85) status = "missed";
                else if (rand > 0.8) status = "skipped";

                logs.push({
                    id: `log-${reminder.id}-${date}-${time}`,
                    reminderId: reminder.id,
                    profileId: reminder.profileId,
                    date,
                    scheduledTime: time,
                    status,
                    actualTime: status === "taken" ? time.replace(/:(\d+)/, (_, m) => `:${String(Math.min(59, parseInt(m) + Math.floor(Math.random() * 15))).padStart(2, "0")}`) : undefined,
                });
            }
        }
    }

    // Today's logs — some taken, some pending (no status yet)
    const todayStr = fmt(today);
    const nowHour = today.getHours();
    const nowMin = today.getMinutes();

    for (const reminder of activeReminders) {
        for (const time of reminder.timesOfDay) {
            const [h, m] = time.split(":").map(Number);
            const isPast = h < nowHour || (h === nowHour && m <= nowMin);

            if (isPast) {
                const existing = logs.find(l => l.reminderId === reminder.id && l.date === todayStr && l.scheduledTime === time);
                if (!existing) {
                    logs.push({
                        id: `log-${reminder.id}-${todayStr}-${time}`,
                        reminderId: reminder.id,
                        profileId: reminder.profileId,
                        date: todayStr,
                        scheduledTime: time,
                        status: Math.random() > 0.2 ? "taken" : "missed",
                        actualTime: time,
                    });
                }
            }
            // Future times today — no log yet (pending)
        }
    }

    return logs;
};

export const MOCK_MEDICATION_LOGS = generateLogs();

// Helpers
export const getRemindersByProfileId = (profileId: string): MedicationReminder[] => {
    return MOCK_MEDICATION_REMINDERS.filter(r => r.profileId === profileId);
};

export const getActiveReminders = (profileId: string): MedicationReminder[] => {
    return MOCK_MEDICATION_REMINDERS.filter(r => r.profileId === profileId && r.isActive);
};

export const getTodaySchedule = (profileId: string): { reminder: MedicationReminder; time: string; log?: MedicationLog }[] => {
    const todayStr = fmt(today);
    const reminders = getActiveReminders(profileId);
    const schedule: { reminder: MedicationReminder; time: string; log?: MedicationLog }[] = [];

    for (const reminder of reminders) {
        for (const time of reminder.timesOfDay) {
            const log = MOCK_MEDICATION_LOGS.find(l => l.reminderId === reminder.id && l.date === todayStr && l.scheduledTime === time);
            schedule.push({ reminder, time, log });
        }
    }

    return schedule.sort((a, b) => a.time.localeCompare(b.time));
};

export const getComplianceStats = (profileId: string, days: number = 7): { date: string; total: number; taken: number; rate: number }[] => {
    const stats: { date: string; total: number; taken: number; rate: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = fmt(addDays(today, -i));
        const logs = MOCK_MEDICATION_LOGS.filter(l => {
            const reminder = MOCK_MEDICATION_REMINDERS.find(r => r.id === l.reminderId);
            return reminder?.profileId === profileId && l.date === date;
        });
        const total = logs.length;
        const taken = logs.filter(l => l.status === "taken").length;
        stats.push({ date, total, taken, rate: total > 0 ? Math.round((taken / total) * 100) : 0 });
    }

    return stats;
};
