// src/services/Appointment Management/appointment-status.service.ts
import { AppError } from '../../utils/app-error.util';
import { AppointmentRepository } from '../../repository/Appointment Management/appointment.repository';
import { AppointmentStatusRepository } from '../../repository/Appointment Management/appointment-status.repository';
import { EncounterRepository } from '../../repository/EMR/encounter.repository';
import { NotificationEngineService } from '../Core/notification-engine.service';
import { v4 as uuidv4 } from 'uuid';
import {
    CHECK_IN_METHOD,
    STATUS_SETTING_KEYS,
    DEFAULT_STATUS_CONFIG,
    STATUS_TEMPLATE_CODES,
    STATUS_ERRORS,
    STATUS_CONFIG_LIMITS,
    NO_SHOW_ALLOWED,
} from '../../constants/appointment-status.constant';
import { APPOINTMENT_ERRORS, APPOINTMENT_STATUS } from '../../constants/appointment.constant';
import { APPOINTMENT_TEMPLATE_CODES } from '../../constants/appointment-confirmation.constant';


export class AppointmentStatusService {

    /**
     * Check-in tại quầy lễ tân
     */
    static async checkInAtCounter(appointmentId: string, userId: string): Promise<any> {
        const appointment = await AppointmentRepository.findWithPatientAccount(appointmentId);
        if (!appointment) {
            throw new AppError(404, 'NOT_FOUND', APPOINTMENT_ERRORS.NOT_FOUND);
        }

        if (appointment.status !== APPOINTMENT_STATUS.CONFIRMED) {
            throw new AppError(400, 'NOT_CONFIRMED', STATUS_ERRORS.NOT_CONFIRMED);
        }

        // Kiểm tra appointment_date = TODAY
        const today = new Date().toISOString().slice(0, 10);
        if (appointment.appointment_date !== today) {
            throw new AppError(400, 'NOT_TODAY', STATUS_ERRORS.NOT_TODAY);
        }

        const { isLate, lateMinutes } = this.calculateLateStatus(appointment as any);
        const queueNumber = await AppointmentStatusRepository.getNextQueueNumber();

        /** B4: Warning nếu BS đã đăng ký vắng đột xuất (không block check-in vì BN đã đến) */
        let doctorAbsentWarning: string | null = null;
        if (appointment.doctor_id) {
            try {
                const shiftId = appointment.slot_id ? await AppointmentRepository.getShiftIdBySlot(appointment.slot_id) : null;
                const isAbsent = await AppointmentRepository.isDoctorAbsentOnDate(
                    appointment.doctor_id, appointment.appointment_date, shiftId || undefined
                );
                if (isAbsent) {
                    doctorAbsentWarning = STATUS_ERRORS.DOCTOR_ABSENT_WARNING;
                }
            } catch (err: any) {
                console.error('[CHECK_IN] Lỗi kiểm tra BS vắng:', err.message);
            }
        }

        const auditLog = {
            appointment_audit_logs_id: `ALOG_${uuidv4().substring(0, 12)}`,
            appointment_id: appointmentId,
            changed_by: userId,
            old_status: APPOINTMENT_STATUS.CONFIRMED,
            new_status: APPOINTMENT_STATUS.CHECKED_IN,
            action_note: `Check-in tại quầy. STT: ${queueNumber}${isLate ? `. Trễ ${lateMinutes} phút` : ''}${doctorAbsentWarning ? '. CẢNH BÁO: BS vắng' : ''}`,
        };

        const result = await AppointmentStatusRepository.checkInWithQueue(
            appointmentId, queueNumber, CHECK_IN_METHOD.COUNTER, isLate, lateMinutes, auditLog
        );

        if (!result) {
            throw new AppError(400, 'CHECKIN_FAILED', STATUS_ERRORS.NOT_CONFIRMED);
        }

        // Gửi notification (fire-and-forget)
        this.sendNotificationSafe(appointment.account_id, APPOINTMENT_TEMPLATE_CODES.CHECKED_IN, {
            patient_name: appointment.patient_name || 'Bệnh nhân',
            appointment_code: appointment.appointment_code,
            appointment_date: appointment.appointment_date,
            slot_time: (appointment as any).slot_time || '',
            doctor_name: appointment.doctor_name || 'Chưa chỉ định',
        });

        return { ...result, queue_number: queueNumber, is_late: isLate, late_minutes: lateMinutes, doctor_absent_warning: doctorAbsentWarning };
    }

    /**
     * Check-in TEST — bỏ qua kiểm tra ngày (chỉ dùng để test, KHÔNG dùng production)
     */
    static async checkInTest(appointmentId: string, userId: string): Promise<any> {
        const appointment = await AppointmentRepository.findWithPatientAccount(appointmentId);
        if (!appointment) {
            throw new AppError(404, 'NOT_FOUND', APPOINTMENT_ERRORS.NOT_FOUND);
        }
        if (appointment.status !== APPOINTMENT_STATUS.CONFIRMED) {
            throw new AppError(400, 'NOT_CONFIRMED', STATUS_ERRORS.NOT_CONFIRMED);
        }

        // BỎ QUA kiểm tra appointment_date = TODAY

        const { isLate, lateMinutes } = { isLate: false, lateMinutes: 0 };
        const queueNumber = await AppointmentStatusRepository.getNextQueueNumber();

        const auditLog = {
            appointment_audit_logs_id: `ALOG_${uuidv4().substring(0, 12)}`,
            appointment_id: appointmentId,
            changed_by: userId,
            old_status: APPOINTMENT_STATUS.CONFIRMED,
            new_status: APPOINTMENT_STATUS.CHECKED_IN,
            action_note: `[TEST] Check-in test (bỏ qua kiểm tra ngày). STT: ${queueNumber}`,
        };

        const result = await AppointmentStatusRepository.checkInWithQueue(
            appointmentId, queueNumber, CHECK_IN_METHOD.COUNTER, isLate, lateMinutes, auditLog
        );

        if (!result) {
            throw new AppError(400, 'CHECKIN_FAILED', STATUS_ERRORS.NOT_CONFIRMED);
        }

        return { ...result, queue_number: queueNumber, is_late: isLate, late_minutes: lateMinutes };
    }

    /**
     * Sinh QR token cho bệnh nhân tự check-in
     */
    static async generateQrToken(appointmentId: string): Promise<{ qr_token: string; expires_at: string }> {
        const appointment = await AppointmentRepository.findById(appointmentId);
        if (!appointment) {
            throw new AppError(404, 'NOT_FOUND', APPOINTMENT_ERRORS.NOT_FOUND);
        }

        if (appointment.status !== APPOINTMENT_STATUS.CONFIRMED) {
            throw new AppError(400, 'NOT_CONFIRMED', STATUS_ERRORS.NOT_CONFIRMED);
        }

        // Kiểm tra QR đã có chưa
        if (appointment.qr_token) {
            throw new AppError(400, 'QR_EXISTS', STATUS_ERRORS.QR_ALREADY_GENERATED);
        }

        // Kiểm tra cấu hình QR
        const settings = await this.getSettings();
        if (!settings.allow_qr_checkin) {
            throw new AppError(400, 'QR_DISABLED', STATUS_ERRORS.QR_DISABLED);
        }

        const qrToken = `QR_${uuidv4()}`;
        // Hết hạn cuối ngày khám (23:59:59)
        const expiresAt = `${appointment.appointment_date}T23:59:59+07:00`;

        const saved = await AppointmentStatusRepository.saveQrToken(appointmentId, qrToken, expiresAt);
        if (!saved) {
            throw new AppError(400, 'QR_SAVE_FAILED', STATUS_ERRORS.QR_ALREADY_GENERATED);
        }

        return { qr_token: qrToken, expires_at: expiresAt };
    }

    /**
     * Check-in bằng QR code (bệnh nhân quét tại kiosk)
     */
    static async checkInByQr(qrToken: string): Promise<any> {
        if (!qrToken) {
            throw new AppError(400, 'MISSING_QR', STATUS_ERRORS.MISSING_QR_TOKEN);
        }

        // Kiểm tra cấu hình QR
        const settings = await this.getSettings();
        if (!settings.allow_qr_checkin) {
            throw new AppError(400, 'QR_DISABLED', STATUS_ERRORS.QR_DISABLED);
        }

        const appointment = await AppointmentStatusRepository.findByQrToken(qrToken);
        if (!appointment) {
            throw new AppError(404, 'INVALID_QR', STATUS_ERRORS.INVALID_QR_TOKEN);
        }

        // Kiểm tra appointment_date = TODAY
        const today = new Date().toISOString().slice(0, 10);
        if (appointment.appointment_date !== today) {
            throw new AppError(400, 'NOT_TODAY', STATUS_ERRORS.NOT_TODAY);
        }

        const { isLate, lateMinutes } = this.calculateLateStatus(appointment);
        const queueNumber = await AppointmentStatusRepository.getNextQueueNumber();

        const auditLog = {
            appointment_audit_logs_id: `ALOG_${uuidv4().substring(0, 12)}`,
            appointment_id: appointment.appointments_id,
            changed_by: appointment.account_id || 'SYSTEM',
            old_status: APPOINTMENT_STATUS.CONFIRMED,
            new_status: APPOINTMENT_STATUS.CHECKED_IN,
            action_note: `Check-in QR. STT: ${queueNumber}${isLate ? `. Trễ ${lateMinutes} phút` : ''}`,
        };

        const result = await AppointmentStatusRepository.checkInWithQueue(
            appointment.appointments_id, queueNumber, CHECK_IN_METHOD.QR_CODE, isLate, lateMinutes, auditLog
        );

        if (!result) {
            throw new AppError(400, 'CHECKIN_FAILED', STATUS_ERRORS.NOT_CONFIRMED);
        }

        // Gửi notification
        this.sendNotificationSafe(appointment.account_id, APPOINTMENT_TEMPLATE_CODES.CHECKED_IN, {
            patient_name: appointment.patient_name || 'Bệnh nhân',
            appointment_code: appointment.appointment_code,
            appointment_date: appointment.appointment_date,
            slot_time: (appointment as any).slot_time || '',
            doctor_name: (appointment as any).doctor_name || 'Chưa chỉ định',
        });

        return { ...result, queue_number: queueNumber, is_late: isLate, late_minutes: lateMinutes };
    }


    /**
     * Bắt đầu khám: CHECKED_IN → IN_PROGRESS + cập nhật phòng
     */
    static async startExam(appointmentId: string, userId: string): Promise<any> {
        const appointment = await AppointmentRepository.findWithPatientAccount(appointmentId);
        if (!appointment) {
            throw new AppError(404, 'NOT_FOUND', APPOINTMENT_ERRORS.NOT_FOUND);
        }

        if (appointment.status !== APPOINTMENT_STATUS.CHECKED_IN) {
            throw new AppError(400, 'NOT_CHECKED_IN', STATUS_ERRORS.NOT_CHECKED_IN);
        }

        if (!appointment.room_id) {
            throw new AppError(400, 'MISSING_ROOM', STATUS_ERRORS.MISSING_ROOM);
        }

        /** B1: Bắt buộc phải gán BS trước khi bắt đầu khám */
        if (!appointment.doctor_id) {
            throw new AppError(400, 'MISSING_DOCTOR', STATUS_ERRORS.MISSING_DOCTOR);
        }

        // Kiểm tra phòng đang trống (thông qua repository)
        const roomStatus = await AppointmentStatusRepository.getRoomStatusById(appointment.room_id);
        if (roomStatus === 'OCCUPIED') {
            throw new AppError(400, 'ROOM_OCCUPIED', STATUS_ERRORS.ROOM_OCCUPIED);
        }

        const auditLog = {
            appointment_audit_logs_id: `ALOG_${uuidv4().substring(0, 12)}`,
            appointment_id: appointmentId,
            changed_by: userId,
            old_status: APPOINTMENT_STATUS.CHECKED_IN,
            new_status: APPOINTMENT_STATUS.IN_PROGRESS,
            action_note: 'Bắt đầu khám bệnh',
        };

        const result = await AppointmentStatusRepository.startExam(
            appointmentId, appointment.room_id, appointment.patient_id, auditLog
        );

        if (!result) {
            throw new AppError(400, 'START_FAILED', STATUS_ERRORS.NOT_CHECKED_IN);
        }

        /** Tự động tạo encounter khi bắt đầu khám */
        let encounterId: string | null = null;
        try {
            const existingCount = await EncounterRepository.countByAppointmentId(appointmentId);
            if (existingCount === 0 && appointment.doctor_id) {
                const hasExisting = await EncounterRepository.hasExistingEncounters(appointment.patient_id);
                const encounterType = hasExisting ? 'FOLLOW_UP' : 'FIRST_VISIT';
                const visitNumber = await EncounterRepository.getVisitNumber(appointment.patient_id);
                const encounter = await EncounterRepository.create({
                    appointment_id: appointmentId,
                    patient_id: appointment.patient_id,
                    doctor_id: appointment.doctor_id,
                    room_id: appointment.room_id,
                    encounter_type: encounterType,
                    visit_number: visitNumber,
                });
                encounterId = encounter.encounters_id;
            }
        } catch (err: any) {
            console.error('[START_EXAM] Lỗi tạo encounter tự động:', err.message);
        }

        // Gửi notification bắt đầu khám
        this.sendNotificationSafe(appointment.account_id, STATUS_TEMPLATE_CODES.START_EXAM, {
            patient_name: appointment.patient_name || 'Bệnh nhân',
            appointment_code: appointment.appointment_code,
            appointment_date: appointment.appointment_date,
            doctor_name: appointment.doctor_name || 'Chưa chỉ định',
        });

        return { ...result, encounter_id: encounterId };
    }

    /**
     * Hoàn tất khám: IN_PROGRESS → COMPLETED + giải phóng phòng
     */
    static async completeExam(appointmentId: string, userId: string): Promise<any> {
        const appointment = await AppointmentRepository.findWithPatientAccount(appointmentId);
        if (!appointment) {
            throw new AppError(404, 'NOT_FOUND', APPOINTMENT_ERRORS.NOT_FOUND);
        }

        if (appointment.status !== APPOINTMENT_STATUS.IN_PROGRESS) {
            throw new AppError(400, 'NOT_IN_PROGRESS', STATUS_ERRORS.NOT_IN_PROGRESS);
        }

        const auditLog = {
            appointment_audit_logs_id: `ALOG_${uuidv4().substring(0, 12)}`,
            appointment_id: appointmentId,
            changed_by: userId,
            old_status: APPOINTMENT_STATUS.IN_PROGRESS,
            new_status: APPOINTMENT_STATUS.COMPLETED,
            action_note: 'Hoàn tất khám bệnh',
        };

        const result = await AppointmentStatusRepository.completeExam(
            appointmentId, appointment.room_id || null, auditLog
        );

        if (!result) {
            throw new AppError(400, 'COMPLETE_FAILED', STATUS_ERRORS.NOT_IN_PROGRESS);
        }

        /** Tự động đóng encounter khi hoàn tất khám */
        try {
            const encounter = await EncounterRepository.findActiveByAppointmentId(appointmentId);
            if (encounter) {
                await EncounterRepository.updateStatus(encounter.encounters_id, 'COMPLETED');
            }
        } catch (err: any) {
            console.error('[COMPLETE_EXAM] Lỗi đóng encounter tự động:', err.message);
        }

        // Gửi notification hoàn tất
        this.sendNotificationSafe(appointment.account_id, APPOINTMENT_TEMPLATE_CODES.COMPLETED, {
            patient_name: appointment.patient_name || 'Bệnh nhân',
            appointment_code: appointment.appointment_code,
            appointment_date: appointment.appointment_date,
            slot_time: (appointment as any).slot_time || '',
            doctor_name: appointment.doctor_name || 'Chưa chỉ định',
        });

        return result;
    }


    /**
     * Đánh dấu No-Show thủ công
     */
    static async markNoShow(appointmentId: string, userId: string, note?: string): Promise<any> {
        const appointment = await AppointmentRepository.findWithPatientAccount(appointmentId);
        if (!appointment) {
            throw new AppError(404, 'NOT_FOUND', APPOINTMENT_ERRORS.NOT_FOUND);
        }

        /** B2: Cho phép No-Show cho PENDING, CONFIRMED và CHECKED_IN (BN check-in rồi bỏ đi) */
        if (!(NO_SHOW_ALLOWED as readonly string[]).includes(appointment.status)) {
            throw new AppError(400, 'NO_SHOW_NOT_ALLOWED', STATUS_ERRORS.NO_SHOW_NOT_ALLOWED);
        }

        const auditLog = {
            appointment_audit_logs_id: `ALOG_${uuidv4().substring(0, 12)}`,
            appointment_id: appointmentId,
            changed_by: userId,
            old_status: appointment.status,
            new_status: APPOINTMENT_STATUS.NO_SHOW,
            action_note: note || 'Bệnh nhân không đến khám (No-Show)',
        };

        const result = await AppointmentStatusRepository.markNoShow(appointmentId, auditLog);

        if (!result) {
            throw new AppError(400, 'NO_SHOW_FAILED', STATUS_ERRORS.NO_SHOW_NOT_ALLOWED);
        }

        /** Fix #5: Dọn dẹp encounter đang mở nếu có (edge case) */
        try {
            const encounter = await EncounterRepository.findActiveByAppointmentId(appointmentId);
            if (encounter) {
                await EncounterRepository.updateStatus(encounter.encounters_id, 'CANCELLED');
                if (encounter.room_id) {
                    await EncounterRepository.updateRoomStatus(encounter.room_id, 'AVAILABLE', null);
                }
            }
        } catch (err: any) {
            console.error('[MARK_NO_SHOW] Lỗi dọn dẹp encounter:', err.message);
        }

        // Gửi notification
        this.sendNotificationSafe(appointment.account_id, STATUS_TEMPLATE_CODES.NO_SHOW, {
            patient_name: appointment.patient_name || 'Bệnh nhân',
            appointment_code: appointment.appointment_code,
            appointment_date: appointment.appointment_date,
            slot_time: (appointment as any).slot_time || '',
        });

        return result;
    }

    /**
     * Cron Job: Tự động phát hiện và đánh No-Show
     */
    static async processAutoNoShow(): Promise<{ total_marked: number; details: any[] }> {
        const settings = await this.getSettings();

        if (!settings.auto_no_show_enabled) {
            console.log('[AUTO-NOSHOW] Tự động phát hiện No-Show đang tắt. Bỏ qua.');
            return { total_marked: 0, details: [] };
        }

        const expired = await AppointmentStatusRepository.findExpiredForNoShow(settings.no_show_buffer_minutes);

        let totalMarked = 0;
        const details: any[] = [];

        for (const apt of expired) {
            try {
                const auditLog = {
                    appointment_audit_logs_id: `ALOG_${uuidv4().substring(0, 12)}`,
                    appointment_id: apt.appointments_id,
                    changed_by: undefined,
                    old_status: apt.status,
                    new_status: APPOINTMENT_STATUS.NO_SHOW,
                    action_note: `Tự động đánh No-Show (quá ${settings.no_show_buffer_minutes} phút sau slot_end_time)`,
                };

                await AppointmentStatusRepository.markNoShow(apt.appointments_id, auditLog);

                /** B3: Dọn dẹp encounter + giải phóng phòng (tương tự markNoShow thủ công) */
                try {
                    const encounter = await EncounterRepository.findActiveByAppointmentId(apt.appointments_id);
                    if (encounter) {
                        await EncounterRepository.updateStatus(encounter.encounters_id, 'CANCELLED');
                        if (encounter.room_id) {
                            await EncounterRepository.updateRoomStatus(encounter.room_id, 'AVAILABLE', null);
                        }
                    }
                } catch (cleanupErr: any) {
                    console.error(`[AUTO-NOSHOW] Lỗi dọn encounter cho ${apt.appointment_code}:`, cleanupErr.message);
                }

                // Notification
                if (apt.account_id) {
                    try {
                        await NotificationEngineService.triggerEvent({
                            template_code: STATUS_TEMPLATE_CODES.NO_SHOW,
                            target_user_id: apt.account_id,
                            variables: {
                                patient_name: apt.patient_name,
                                appointment_code: apt.appointment_code,
                                appointment_date: apt.appointment_date,
                                slot_time: apt.slot_time,
                            },
                        });
                    } catch (err: any) {
                        console.error(`[AUTO-NOSHOW] Lỗi gửi notification cho ${apt.appointment_code}:`, err.message);
                    }
                }

                totalMarked++;
                details.push({ appointment_code: apt.appointment_code, patient_name: apt.patient_name });
            } catch (error: any) {
                console.error(`[AUTO-NOSHOW] Lỗi xử lý ${apt.appointment_code}:`, error.message);
            }
        }

        if (totalMarked > 0) {
            console.log(`✅ [AUTO-NOSHOW] Đã đánh dấu ${totalMarked} lịch khám No-Show.`);
        }

        return { total_marked: totalMarked, details };
    }


    /**
     * Dashboard trạng thái lịch khám hôm nay
     */
    static async getDashboardToday(branchId?: string): Promise<any> {
        return this.getDashboardByDate(undefined, branchId);
    }

    /**
     * Dashboard trạng thái lịch khám theo ngày bất kỳ
     */
    static async getDashboardByDate(date?: string, branchId?: string): Promise<any> {
        const targetDate = date || new Date().toISOString().slice(0, 10);
        const data = await AppointmentStatusRepository.getDashboardByDate(branchId, date);
        return {
            date: targetDate,
            summary: {
                total: data.total,
                pending: data.pending,
                confirmed: data.confirmed,
                checked_in: data.checked_in,
                in_progress: data.in_progress,
                completed: data.completed,
                cancelled: data.cancelled,
                no_show: data.no_show,
            },
            queue: {
                current_serving: data.current_serving,
                next_in_line: data.next_in_line,
                total_waiting: data.total_waiting,
            },
        };
    }

    /**
     * Hàng đợi hôm nay
     */
    static async getQueueToday(filters: { branch_id?: string; room_id?: string; status?: string }): Promise<any[]> {
        return AppointmentStatusRepository.getQueueToday(filters);
    }

    /**
     * Trạng thái phòng khám
     */
    static async getRoomStatus(branchId?: string): Promise<any[]> {
        return AppointmentStatusRepository.getRoomStatusList(branchId);
    }


    /**
     * Lấy cấu hình check-in & no-show từ system_settings
     */
    static async getSettings(): Promise<{
        no_show_buffer_minutes: number;
        auto_no_show_enabled: boolean;
        allow_qr_checkin: boolean;
        late_threshold_minutes: number;
    }> {
        const keys = Object.values(STATUS_SETTING_KEYS);
        const settings = await AppointmentStatusRepository.getSettingsByKeys(keys);

        return {
            no_show_buffer_minutes: settings[STATUS_SETTING_KEYS.NO_SHOW_BUFFER_MINUTES]
                ?? DEFAULT_STATUS_CONFIG.NO_SHOW_BUFFER_MINUTES,
            auto_no_show_enabled: settings[STATUS_SETTING_KEYS.AUTO_NO_SHOW_ENABLED]
                ?? DEFAULT_STATUS_CONFIG.AUTO_NO_SHOW_ENABLED,
            allow_qr_checkin: settings[STATUS_SETTING_KEYS.ALLOW_QR_CHECKIN]
                ?? DEFAULT_STATUS_CONFIG.ALLOW_QR_CHECKIN,
            late_threshold_minutes: settings[STATUS_SETTING_KEYS.LATE_THRESHOLD_MINUTES]
                ?? DEFAULT_STATUS_CONFIG.LATE_THRESHOLD_MINUTES,
        };
    }

    /**
     * Cập nhật cấu hình check-in & no-show
     */
    static async updateSettings(data: {
        no_show_buffer_minutes?: number;
        auto_no_show_enabled?: boolean;
        allow_qr_checkin?: boolean;
        late_threshold_minutes?: number;
    }): Promise<any> {
        const updates: Array<{ key: string; value: any }> = [];

        if (data.no_show_buffer_minutes !== undefined) {
            if (data.no_show_buffer_minutes < STATUS_CONFIG_LIMITS.NO_SHOW_BUFFER_MIN ||
                data.no_show_buffer_minutes > STATUS_CONFIG_LIMITS.NO_SHOW_BUFFER_MAX) {
                throw new AppError(400, 'INVALID_BUFFER', STATUS_ERRORS.INVALID_BUFFER);
            }
            updates.push({ key: STATUS_SETTING_KEYS.NO_SHOW_BUFFER_MINUTES, value: { value: data.no_show_buffer_minutes } });
        }

        if (data.auto_no_show_enabled !== undefined) {
            updates.push({ key: STATUS_SETTING_KEYS.AUTO_NO_SHOW_ENABLED, value: { value: data.auto_no_show_enabled } });
        }

        if (data.allow_qr_checkin !== undefined) {
            updates.push({ key: STATUS_SETTING_KEYS.ALLOW_QR_CHECKIN, value: { value: data.allow_qr_checkin } });
        }

        if (data.late_threshold_minutes !== undefined) {
            if (data.late_threshold_minutes < STATUS_CONFIG_LIMITS.LATE_THRESHOLD_MIN ||
                data.late_threshold_minutes > STATUS_CONFIG_LIMITS.LATE_THRESHOLD_MAX) {
                throw new AppError(400, 'INVALID_LATE', STATUS_ERRORS.INVALID_LATE_THRESHOLD);
            }
            updates.push({ key: STATUS_SETTING_KEYS.LATE_THRESHOLD_MINUTES, value: { value: data.late_threshold_minutes } });
        }

        for (const update of updates) {
            await AppointmentStatusRepository.updateSetting(update.key, update.value);
        }

        return this.getSettings();
    }


    /**
     * Tính toán trạng thái đến muộn dựa trên slot_start_time
     */
    private static calculateLateStatus(appointment: { slot_start_time?: string; appointment_date: string }): {
        isLate: boolean;
        lateMinutes: number;
    } {
        if (!appointment.slot_start_time) {
            return { isLate: false, lateMinutes: 0 };
        }

        const now = new Date();
        const [hours, minutes] = appointment.slot_start_time.split(':').map(Number);
        const slotTime = new Date(appointment.appointment_date);
        slotTime.setHours(hours, minutes, 0, 0);

        const diffMs = now.getTime() - slotTime.getTime();
        const diffMinutes = Math.floor(diffMs / 60000);

        if (diffMinutes > 0) {
            return { isLate: true, lateMinutes: diffMinutes };
        }

        return { isLate: false, lateMinutes: 0 };
    }

    /**
     * Gửi notification an toàn (fire-and-forget)
     */
    private static async sendNotificationSafe(
        accountId: string | null | undefined,
        templateCode: string,
        variables: Record<string, any>
    ): Promise<void> {
        if (!accountId) return;

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

    /**
     * Bỏ qua BN trong hàng đợi (CHECKED_IN → SKIPPED)
     */
    static async skipPatient(appointmentId: string, userId: string): Promise<any> {
        const appointment = await AppointmentRepository.findById(appointmentId);
        if (!appointment) {
            throw new AppError(404, 'NOT_FOUND', APPOINTMENT_ERRORS.NOT_FOUND);
        }
        if (appointment.status !== APPOINTMENT_STATUS.CHECKED_IN) {
            throw new AppError(400, 'NOT_CHECKED_IN_FOR_SKIP', STATUS_ERRORS.NOT_CHECKED_IN_FOR_SKIP);
        }

        const result = await AppointmentStatusRepository.skipQueueItem(appointmentId, {
            appointment_audit_logs_id: `AAL_${uuidv4().slice(0, 8)}`,
            appointment_id: appointmentId,
            changed_by: userId,
            old_status: APPOINTMENT_STATUS.CHECKED_IN,
            new_status: APPOINTMENT_STATUS.SKIPPED,
            action_note: `Bỏ qua BN (số ${appointment.queue_number}) — không có mặt khi gọi tên`
        });
        return result;
    }

    /**
     * Gọi lại BN đã skip (SKIPPED → CHECKED_IN, gán queue_number mới ở cuối hàng)
     */
    static async recallPatient(appointmentId: string, userId: string): Promise<any> {
        const appointment = await AppointmentRepository.findById(appointmentId);
        if (!appointment) {
            throw new AppError(404, 'NOT_FOUND', APPOINTMENT_ERRORS.NOT_FOUND);
        }
        if (appointment.status !== APPOINTMENT_STATUS.SKIPPED) {
            throw new AppError(400, 'NOT_SKIPPED', STATUS_ERRORS.NOT_SKIPPED);
        }

        const newQueueNumber = await AppointmentStatusRepository.getNextQueueNumber();
        const result = await AppointmentStatusRepository.recallQueueItem(appointmentId, newQueueNumber, {
            appointment_audit_logs_id: `AAL_${uuidv4().slice(0, 8)}`,
            appointment_id: appointmentId,
            changed_by: userId,
            old_status: APPOINTMENT_STATUS.SKIPPED,
            new_status: APPOINTMENT_STATUS.CHECKED_IN,
            action_note: `Gọi lại BN — xếp cuối hàng, số mới: ${newQueueNumber}`
        });
        return result;
    }
}
