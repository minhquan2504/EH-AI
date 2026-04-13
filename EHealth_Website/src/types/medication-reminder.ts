export interface MedicationReminder {
    id: string;
    profileId: string;
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
    profileId: string;
    date: string;
    scheduledTime: string;
    status: "taken" | "missed" | "skipped";
    actualTime?: string;
    note?: string;
}
