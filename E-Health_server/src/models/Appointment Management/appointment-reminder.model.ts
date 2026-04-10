/**
 * Interface cho bảng appointment_reminders
 */
export interface AppointmentReminder {
    reminder_id: string;
    appointment_id: string;
    reminder_type: 'AUTO' | 'MANUAL';
    channel: 'INAPP' | 'EMAIL' | 'PUSH';
    sent_at: string;
    sent_by: string | null;
    trigger_source: 'CRON_JOB' | 'STAFF_MANUAL';
    appointment_code?: string;
    patient_name?: string;
    appointment_date?: string;
    slot_time?: string;
    sent_by_name?: string;
}

/** Input tạo bản ghi reminder */
export interface CreateReminderInput {
    appointment_id: string;
    reminder_type: 'AUTO' | 'MANUAL';
    channel: 'INAPP' | 'EMAIL' | 'PUSH';
    sent_by?: string | null;
    trigger_source: 'CRON_JOB' | 'STAFF_MANUAL';
}

/** Cấu hình nhắc lịch từ system_settings */
export interface ReminderSettings {
    reminder_before_hours: number[];
    auto_reminder_enabled: boolean;
    cron_interval: string;
}

/** Input cập nhật cấu hình nhắc lịch */
export interface UpdateReminderSettingsInput {
    reminder_before_hours?: number[];
    auto_reminder_enabled?: boolean;
    cron_interval?: string;
}
