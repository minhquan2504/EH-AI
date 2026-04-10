// src/services/Appointment Management/appointment-change.service.ts
import { AppointmentRepository } from '../../repository/Appointment Management/appointment.repository';
import { AppointmentChangeRepository } from '../../repository/Appointment Management/appointment-change.repository';
import { BookingConfigService } from '../Facility Management/booking-config.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { CHANGE_ERRORS, RESCHEDULABLE_STATUSES } from '../../constants/appointment-change.constant';


export class AppointmentChangeService {

    /**
     * Lịch sử thay đổi của 1 lịch khám
     */
    static async getHistory(appointmentId: string) {
        const existing = await AppointmentRepository.findById(appointmentId);
        if (!existing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'APPOINTMENT_NOT_FOUND', CHANGE_ERRORS.APPOINTMENT_NOT_FOUND);
        }
        const logs = await AppointmentChangeRepository.getHistoryByAppointmentId(appointmentId);
        return {
            appointment_id: appointmentId,
            appointment_code: existing.appointment_code,
            current_status: existing.status,
            reschedule_count: existing.reschedule_count || 0,
            changes: logs,
        };
    }

    /**
     * Thống kê dời/hủy theo khoảng thời gian
     */
    static async getStats(fromDate: string, toDate: string, branchId?: string) {
        if (new Date(fromDate) > new Date(toDate)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_DATE_RANGE', CHANGE_ERRORS.INVALID_DATE_RANGE);
        }
        const stats = await AppointmentChangeRepository.getStats(fromDate, toDate, branchId);
        return {
            from_date: fromDate,
            to_date: toDate,
            ...stats,
        };
    }

    /**
     * Danh sách thay đổi gần đây (phân trang)
     */
    static async getRecentChanges(filters: {
        change_type?: string;
        branch_id?: string;
        page: number;
        limit: number;
    }) {
        return AppointmentChangeRepository.getRecentChanges(filters);
    }

    /**
     * Kiểm tra chính sách hủy lịch (preview API)
     */
    static async checkCancelPolicy(appointmentId: string) {
        const existing = await AppointmentRepository.findById(appointmentId);
        if (!existing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'APPOINTMENT_NOT_FOUND', CHANGE_ERRORS.APPOINTMENT_NOT_FOUND);
        }

        // Lấy cấu hình cancellation_allowed_hours
        let policyHours = 12;
        try {
            const config = await BookingConfigService.getResolvedConfig('default');
            policyHours = config.cancellation_allowed_hours ?? 12;
        } catch {
            // Fallback default
        }

        // Tính thời điểm giới hạn
        const slotStartTime = existing.slot_start_time || '00:00:00';
        const appointmentDateTime = new Date(`${existing.appointment_date}T${slotStartTime}`);
        const deadlineMs = appointmentDateTime.getTime() - (policyHours * 60 * 60 * 1000);
        const nowMs = Date.now();
        const hoursRemaining = Math.max(0, (appointmentDateTime.getTime() - nowMs) / (60 * 60 * 1000));
        const allowed = nowMs <= deadlineMs;

        return {
            appointment_id: appointmentId,
            appointment_code: existing.appointment_code,
            current_status: existing.status,
            appointment_datetime: appointmentDateTime.toISOString(),
            policy: {
                cancellation_allowed_hours: policyHours,
                deadline: new Date(deadlineMs).toISOString(),
                allowed,
                hours_remaining: Math.round(hoursRemaining * 10) / 10,
                message: allowed
                    ? `Có thể hủy lịch (còn ${Math.round(hoursRemaining * 10) / 10} giờ trước giờ khám)`
                    : `Đã quá thời hạn hủy lịch (yêu cầu tối thiểu ${policyHours} giờ trước giờ khám). Chỉ Admin mới được hủy`,
            },
        };
    }

    /**
     * Kiểm tra khả năng dời lịch
     */
    static async canReschedule(appointmentId: string) {
        const existing = await AppointmentRepository.findById(appointmentId);
        if (!existing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'APPOINTMENT_NOT_FOUND', CHANGE_ERRORS.APPOINTMENT_NOT_FOUND);
        }

        const canReschedule = (RESCHEDULABLE_STATUSES as readonly string[]).includes(existing.status);
        const rescheduleCount = existing.reschedule_count || 0;

        return {
            appointment_id: appointmentId,
            appointment_code: existing.appointment_code,
            current_status: existing.status,
            can_reschedule: canReschedule,
            reschedule_count: rescheduleCount,
            reason: canReschedule
                ? undefined
                : `Lịch khám ở trạng thái ${existing.status} không thể dời. Chỉ PENDING hoặc CONFIRMED mới được dời lịch`,
        };
    }
}
