import { Request, Response } from 'express';
import { AppointmentConfirmationService } from '../../services/Appointment Management/appointment-confirmation.service';
import { AppointmentReminderService } from '../../services/Appointment Management/appointment-reminder.service';
import { CONFIRMATION_SUCCESS, CONFIRMATION_ERRORS } from '../../constants/appointment-confirmation.constant';
import { APPOINTMENT_ERRORS } from '../../constants/appointment.constant';

/**
 * Controller cho Module 3.6 – Xác nhận & Nhắc lịch khám
 * Chỉ xử lý HTTP Request/Response, delegate business logic cho Service
 */
export class AppointmentConfirmationController {

    // ======================= XÁC NHẬN LỊCH KHÁM =======================

    /** Xác nhận 1 lịch khám (PENDING → CONFIRMED) */
    static async confirm(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id as string;
            const userId = (req as any).auth?.user_id;

            const result = await AppointmentConfirmationService.confirmAppointment(id, userId);
            res.status(200).json({
                success: true,
                message: CONFIRMATION_SUCCESS.CONFIRMED,
                data: result,
            });
        } catch (error: any) {
            res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'INTERNAL_ERROR',
                message: error.message || 'Lỗi máy chủ',
            });
        }
    }

    /** Xác nhận hàng loạt */
    static async batchConfirm(req: Request, res: Response): Promise<void> {
        try {
            const { appointment_ids } = req.body;
            const userId = (req as any).auth?.user_id;

            if (!appointment_ids || !Array.isArray(appointment_ids) || appointment_ids.length === 0) {
                res.status(400).json({
                    success: false,
                    code: 'MISSING_IDS',
                    message: CONFIRMATION_ERRORS.MISSING_IDS,
                });
                return;
            }

            const result = await AppointmentConfirmationService.batchConfirm(appointment_ids, userId);
            res.status(200).json({
                success: true,
                message: CONFIRMATION_SUCCESS.BATCH_CONFIRMED,
                data: result,
            });
        } catch (error: any) {
            res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'INTERNAL_ERROR',
                message: error.message || 'Lỗi máy chủ',
            });
        }
    }

    // ======================= CHECK-IN =======================

    /** Check-in lịch khám (CONFIRMED → CHECKED_IN) */
    static async checkIn(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id as string;
            const userId = (req as any).auth?.user_id;

            const result = await AppointmentConfirmationService.checkIn(id, userId);
            res.status(200).json({
                success: true,
                message: CONFIRMATION_SUCCESS.CHECKED_IN,
                data: result,
            });
        } catch (error: any) {
            res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'INTERNAL_ERROR',
                message: error.message || 'Lỗi máy chủ',
            });
        }
    }

    // ======================= NHẮC LỊCH =======================

    /** Gửi nhắc lịch thủ công cho 1 lịch khám */
    static async sendReminder(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id as string;
            const userId = (req as any).auth?.user_id;

            const result = await AppointmentReminderService.sendManualReminder(id, userId);
            res.status(200).json({
                success: true,
                message: CONFIRMATION_SUCCESS.REMINDER_SENT,
                data: result,
            });
        } catch (error: any) {
            res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'INTERNAL_ERROR',
                message: error.message || 'Lỗi máy chủ',
            });
        }
    }

    /** Gửi nhắc lịch thủ công hàng loạt */
    static async batchSendReminder(req: Request, res: Response): Promise<void> {
        try {
            const { appointment_ids } = req.body;
            const userId = (req as any).auth?.user_id;

            if (!appointment_ids || !Array.isArray(appointment_ids) || appointment_ids.length === 0) {
                res.status(400).json({
                    success: false,
                    code: 'MISSING_IDS',
                    message: CONFIRMATION_ERRORS.MISSING_IDS,
                });
                return;
            }

            const result = await AppointmentReminderService.batchSendReminder(appointment_ids, userId);
            res.status(200).json({
                success: true,
                message: CONFIRMATION_SUCCESS.BATCH_REMINDER_SENT,
                data: result,
            });
        } catch (error: any) {
            res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'INTERNAL_ERROR',
                message: error.message || 'Lỗi máy chủ',
            });
        }
    }

    /** Lấy lịch sử nhắc lịch của 1 appointment */
    static async getReminderHistory(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id as string;

            const result = await AppointmentReminderService.getReminders(id);
            res.status(200).json({
                success: true,
                message: CONFIRMATION_SUCCESS.REMINDER_HISTORY_FETCHED,
                data: result,
            });
        } catch (error: any) {
            res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'INTERNAL_ERROR',
                message: error.message || 'Lỗi máy chủ',
            });
        }
    }

    // ======================= CẤU HÌNH NHẮC LỊCH =======================

    /** Lấy cấu hình nhắc lịch hiện tại */
    static async getReminderSettings(req: Request, res: Response): Promise<void> {
        try {
            const result = await AppointmentReminderService.getReminderSettings();
            res.status(200).json({
                success: true,
                message: CONFIRMATION_SUCCESS.REMINDER_SETTINGS_FETCHED,
                data: result,
            });
        } catch (error: any) {
            res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'INTERNAL_ERROR',
                message: error.message || 'Lỗi máy chủ',
            });
        }
    }

    /** Cập nhật cấu hình nhắc lịch */
    static async updateReminderSettings(req: Request, res: Response): Promise<void> {
        try {
            const result = await AppointmentReminderService.updateReminderSettings(req.body);
            res.status(200).json({
                success: true,
                message: CONFIRMATION_SUCCESS.REMINDER_SETTINGS_UPDATED,
                data: result,
            });
        } catch (error: any) {
            res.status(error.httpCode || 500).json({
                success: false,
                code: error.code || 'INTERNAL_ERROR',
                message: error.message || 'Lỗi máy chủ',
            });
        }
    }
}
