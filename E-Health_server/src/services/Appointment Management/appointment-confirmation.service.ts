import { AppError } from '../../utils/app-error.util';
import { AppointmentRepository } from '../../repository/Appointment Management/appointment.repository';
import { AppointmentAuditLogRepository } from '../../repository/Appointment Management/appointment-audit-log.repository';
import { NotificationEngineService } from '../Core/notification-engine.service';
import {
    CONFIRMABLE_STATUSES,
    CHECKIN_ALLOWED_STATUSES,
    COMPLETE_ALLOWED_STATUSES,
    CONFIRMATION_ERRORS,
    CONFIRMATION_SUCCESS,
    APPOINTMENT_TEMPLATE_CODES,
} from '../../constants/appointment-confirmation.constant';
import { APPOINTMENT_ERRORS, APPOINTMENT_STATUS } from '../../constants/appointment.constant';
import { v4 as uuidv4 } from 'uuid';


export class AppointmentConfirmationService {

    /**
     * Xác nhận 1 lịch khám: PENDING → CONFIRMED
     */
    static async confirmAppointment(appointmentId: string, userId: string): Promise<any> {
        // Lấy thông tin appointment kèm account_id bệnh nhân
        const appointment = await AppointmentRepository.findWithPatientAccount(appointmentId);
        if (!appointment) {
            throw new AppError(404, 'NOT_FOUND', APPOINTMENT_ERRORS.NOT_FOUND);
        }

        if (appointment.status !== APPOINTMENT_STATUS.PENDING) {
            throw new AppError(400, 'NOT_PENDING', CONFIRMATION_ERRORS.NOT_PENDING);
        }


        const auditLog = {
            appointment_audit_logs_id: `ALOG_${uuidv4().substring(0, 12)}`,
            appointment_id: appointmentId,
            changed_by: userId,
            old_status: APPOINTMENT_STATUS.PENDING,
            new_status: APPOINTMENT_STATUS.CONFIRMED,
            action_note: 'Xác nhận lịch khám',
        };

        // Cập nhật trạng thái
        const confirmed = await AppointmentRepository.confirmAppointment(appointmentId, userId, auditLog);
        if (!confirmed) {
            throw new AppError(400, 'CONFIRM_FAILED', CONFIRMATION_ERRORS.NOT_PENDING);
        }

        // Gửi thông báo cho bệnh nhân (fire-and-forget, không block response)
        this.sendNotificationSafe(appointment.account_id, APPOINTMENT_TEMPLATE_CODES.CONFIRMED, {
            patient_name: appointment.patient_name || 'Bệnh nhân',
            appointment_code: appointment.appointment_code,
            appointment_date: appointment.appointment_date,
            slot_time: (appointment as any).slot_time || '',
            doctor_name: appointment.doctor_name || 'Chưa chỉ định',
        });

        return confirmed;
    }

    /**
     * Xác nhận hàng loạt nhiều lịch khám
     */
    static async batchConfirm(appointmentIds: string[], userId: string): Promise<{
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
                await this.confirmAppointment(id, userId);
                succeeded.push(id);
            } catch (error: any) {
                failed.push({
                    id,
                    reason: error.message || 'Lỗi không xác định',
                });
            }
        }

        return { succeeded, failed };
    }

    /**
     * Check-in lịch khám: CONFIRMED → CHECKED_IN
     * C1: Delegate sang AppointmentStatusService.checkInAtCounter() — đảm bảo 1 luồng check-in duy nhất
     * với đầy đủ STT, kiểm tra ngày, cảnh báo BS vắng
     */
    static async checkIn(appointmentId: string, userId: string): Promise<any> {
        const { AppointmentStatusService } = require('./appointment-status.service');
        return AppointmentStatusService.checkInAtCounter(appointmentId, userId);
    }

    /**
     * Gửi notification an toàn (fire-and-forget)
     */
    private static async sendNotificationSafe(
        accountId: string | null,
        templateCode: string,
        variables: Record<string, any>
    ): Promise<void> {
        if (!accountId) {
            console.warn(`[NOTIFICATION] Bệnh nhân chưa có tài khoản, bỏ qua gửi thông báo template: ${templateCode}`);
            return;
        }

        try {
            await NotificationEngineService.triggerEvent({
                template_code: templateCode,
                target_user_id: accountId,
                variables,
            });
        } catch (error: any) {
            console.error(`[NOTIFICATION] Lỗi gửi thông báo ${templateCode}:`, error.message);
        }
    }
}
