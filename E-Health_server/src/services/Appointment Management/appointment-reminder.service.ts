import { AppError } from '../../utils/app-error.util';
import { AppointmentRepository } from '../../repository/Appointment Management/appointment.repository';
import { AppointmentReminderRepository } from '../../repository/Appointment Management/appointment-reminder.repository';
import { NotificationEngineService } from '../Core/notification-engine.service';
import { pool } from '../../config/postgresdb';
import {
    REMINDABLE_STATUSES,
    CONFIRMATION_ERRORS,
    CONFIRMATION_SUCCESS,
    APPOINTMENT_TEMPLATE_CODES,
    REMINDER_TYPE,
    REMINDER_TRIGGER_SOURCE,
    NOTIFICATION_CHANNEL,
    REMINDER_SETTING_KEYS,
    DEFAULT_REMINDER_CONFIG,
    REMINDER_CONFIG_LIMITS,
} from '../../constants/appointment-confirmation.constant';
import { APPOINTMENT_ERRORS } from '../../constants/appointment.constant';


export class AppointmentReminderService {

    /**
     * Gửi nhắc lịch thủ công cho 1 lịch khám
     */
    static async sendManualReminder(appointmentId: string, userId: string): Promise<any> {
        const appointment = await AppointmentRepository.findWithPatientAccount(appointmentId);
        if (!appointment) {
            throw new AppError(404, 'NOT_FOUND', APPOINTMENT_ERRORS.NOT_FOUND);
        }

        // Chỉ nhắc lịch cho appointment đang active
        if (!REMINDABLE_STATUSES.includes(appointment.status as any)) {
            throw new AppError(400, 'NOT_ACTIVE', CONFIRMATION_ERRORS.APPOINTMENT_NOT_ACTIVE);
        }

        const variables = {
            patient_name: appointment.patient_name || 'Bệnh nhân',
            appointment_code: appointment.appointment_code,
            appointment_date: appointment.appointment_date,
            slot_time: (appointment as any).slot_time || '',
            doctor_name: appointment.doctor_name || 'Chưa chỉ định',
        };

        // Gửi notification nếu bệnh nhân có tài khoản
        if (appointment.account_id) {
            try {
                await NotificationEngineService.triggerEvent({
                    template_code: APPOINTMENT_TEMPLATE_CODES.REMINDER,
                    target_user_id: appointment.account_id,
                    variables,
                });
            } catch (error: any) {
                console.error(`[REMINDER] Lỗi gửi thông báo nhắc lịch:`, error.message);
            }
        }

        // Ghi bản ghi reminder tracking
        const reminder = await AppointmentReminderRepository.create({
            appointment_id: appointmentId,
            reminder_type: REMINDER_TYPE.MANUAL,
            channel: NOTIFICATION_CHANNEL.INAPP,
            sent_by: userId,
            trigger_source: REMINDER_TRIGGER_SOURCE.STAFF_MANUAL,
        });

        return reminder;
    }

    /**
     * Gửi nhắc lịch thủ công hàng loạt
     */
    static async batchSendReminder(appointmentIds: string[], userId: string): Promise<{
        succeeded: string[];
        failed: Array<{ id: string; reason: string }>;
    }> {
        if (!appointmentIds || appointmentIds.length === 0) {
            throw new AppError(400, 'MISSING_IDS', CONFIRMATION_ERRORS.MISSING_IDS);
        }

        const succeeded: string[] = [];
        const failed: Array<{ id: string; reason: string }> = [];

        for (const id of appointmentIds) {
            try {
                await this.sendManualReminder(id, userId);
                succeeded.push(id);
            } catch (error: any) {
                failed.push({ id, reason: error.message || 'Lỗi không xác định' });
            }
        }

        return { succeeded, failed };
    }

    /**
     * Lấy lịch sử nhắc lịch của 1 appointment
     */
    static async getReminders(appointmentId: string): Promise<any[]> {
        // Kiểm tra appointment tồn tại
        const appointment = await AppointmentRepository.findById(appointmentId);
        if (!appointment) {
            throw new AppError(404, 'NOT_FOUND', APPOINTMENT_ERRORS.NOT_FOUND);
        }

        return AppointmentReminderRepository.findByAppointmentId(appointmentId);
    }

    //  CẤU HÌNH NHẮC LỊCH 

    /**
     * Lấy cấu hình nhắc lịch từ system_settings
     */
    static async getReminderSettings(): Promise<{
        reminder_before_hours: number[];
        auto_reminder_enabled: boolean;
        cron_interval: string;
    }> {
        const keys = Object.values(REMINDER_SETTING_KEYS);
        const query = `
            SELECT setting_key, setting_value 
            FROM system_settings 
            WHERE setting_key = ANY($1)
        `;
        const result = await pool.query(query, [keys]);

        const settings: Record<string, any> = {};
        for (const row of result.rows) {
            settings[row.setting_key] = row.setting_value?.value;
        }

        return {
            reminder_before_hours: settings[REMINDER_SETTING_KEYS.REMINDER_BEFORE_HOURS]
                ?? DEFAULT_REMINDER_CONFIG.REMINDER_BEFORE_HOURS,
            auto_reminder_enabled: settings[REMINDER_SETTING_KEYS.AUTO_REMINDER_ENABLED]
                ?? DEFAULT_REMINDER_CONFIG.AUTO_REMINDER_ENABLED,
            cron_interval: settings[REMINDER_SETTING_KEYS.REMINDER_CRON_INTERVAL]
                ?? DEFAULT_REMINDER_CONFIG.CRON_INTERVAL,
        };
    }

    /**
     * Cập nhật cấu hình nhắc lịch
     */
    static async updateReminderSettings(data: {
        reminder_before_hours?: number[];
        auto_reminder_enabled?: boolean;
        cron_interval?: string;
    }): Promise<any> {
        const updates: Array<{ key: string; value: any }> = [];

        // Validate reminder_before_hours
        if (data.reminder_before_hours !== undefined) {
            if (!Array.isArray(data.reminder_before_hours) || data.reminder_before_hours.length === 0) {
                throw new AppError(400, 'INVALID_HOURS', CONFIRMATION_ERRORS.INVALID_REMINDER_HOURS);
            }
            if (data.reminder_before_hours.length > REMINDER_CONFIG_LIMITS.MAX_REMINDER_MILESTONES) {
                throw new AppError(400, 'MAX_MILESTONES', CONFIRMATION_ERRORS.MAX_MILESTONES_EXCEEDED);
            }
            for (const h of data.reminder_before_hours) {
                if (h < REMINDER_CONFIG_LIMITS.REMINDER_HOURS_MIN || h > REMINDER_CONFIG_LIMITS.REMINDER_HOURS_MAX) {
                    throw new AppError(400, 'INVALID_HOURS', CONFIRMATION_ERRORS.INVALID_REMINDER_HOURS);
                }
            }
            updates.push({
                key: REMINDER_SETTING_KEYS.REMINDER_BEFORE_HOURS,
                value: { value: data.reminder_before_hours },
            });
        }

        // Validate auto_reminder_enabled
        if (data.auto_reminder_enabled !== undefined) {
            updates.push({
                key: REMINDER_SETTING_KEYS.AUTO_REMINDER_ENABLED,
                value: { value: data.auto_reminder_enabled },
            });
        }

        // Validate cron_interval
        if (data.cron_interval !== undefined) {
            updates.push({
                key: REMINDER_SETTING_KEYS.REMINDER_CRON_INTERVAL,
                value: { value: data.cron_interval },
            });
        }

        // Ghi DB
        for (const update of updates) {
            await pool.query(
                `UPDATE system_settings SET setting_value = $1, updated_at = CURRENT_TIMESTAMP WHERE setting_key = $2`,
                [JSON.stringify(update.value), update.key]
            );
        }

        return this.getReminderSettings();
    }

    //  AUTO REMINDER 

    /**
     * Xử lý nhắc lịch tự động — được gọi bởi Cron Job
     * Đọc cấu hình → tìm appointments sắp tới → lọc chưa nhắc → gửi notification
     */
    static async processAutoReminders(): Promise<{ total_sent: number; details: any[] }> {
        const settings = await this.getReminderSettings();

        if (!settings.auto_reminder_enabled) {
            console.log('[AUTO-REMINDER] Tự động nhắc lịch đang tắt. Bỏ qua.');
            return { total_sent: 0, details: [] };
        }

        let totalSent = 0;
        const details: any[] = [];

        for (const hours of settings.reminder_before_hours) {
            try {
                // Tìm appointments sắp tới trong window ± 15 phút
                const upcoming = await AppointmentRepository.findUpcomingForReminder(hours, 15);

                for (const apt of upcoming) {
                    // Kiểm tra đã nhắc trong 60 phút gần đây chưa
                    const alreadySent = await AppointmentReminderRepository.hasRecentReminder(
                        apt.appointments_id, 60
                    );
                    if (alreadySent) continue;

                    // Gửi notification nếu bệnh nhân có tài khoản
                    if (apt.account_id) {
                        try {
                            await NotificationEngineService.triggerEvent({
                                template_code: APPOINTMENT_TEMPLATE_CODES.REMINDER,
                                target_user_id: apt.account_id,
                                variables: {
                                    patient_name: apt.patient_name,
                                    appointment_code: apt.appointment_code,
                                    appointment_date: apt.appointment_date,
                                    slot_time: apt.slot_time,
                                    doctor_name: apt.doctor_name || 'Chưa chỉ định',
                                },
                            });
                        } catch (err: any) {
                            console.error(`[AUTO-REMINDER] Lỗi gửi notification cho ${apt.appointment_code}:`, err.message);
                        }
                    }

                    // Ghi reminder log
                    await AppointmentReminderRepository.create({
                        appointment_id: apt.appointments_id,
                        reminder_type: REMINDER_TYPE.AUTO,
                        channel: NOTIFICATION_CHANNEL.INAPP,
                        sent_by: null,
                        trigger_source: REMINDER_TRIGGER_SOURCE.CRON_JOB,
                    });

                    totalSent++;
                    details.push({
                        appointment_code: apt.appointment_code,
                        patient_name: apt.patient_name,
                        reminder_hours: hours,
                    });
                }
            } catch (error: any) {
                console.error(`[AUTO-REMINDER] Lỗi xử lý mốc ${hours}h:`, error.message);
            }
        }

        if (totalSent > 0) {
            console.log(`✅ [AUTO-REMINDER] Đã gửi ${totalSent} nhắc lịch tự động.`);
        }

        return { total_sent: totalSent, details };
    }
}
