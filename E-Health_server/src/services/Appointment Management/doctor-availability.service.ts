import { DoctorAvailabilityRepository } from '../../repository/Appointment Management/doctor-availability.repository';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { DOCTOR_AVAILABILITY_ERRORS } from '../../constants/doctor-availability.constant';

export class DoctorAvailabilityService {

    /** Validate định dạng ngày YYYY-MM-DD */
    private static isValidDate(dateStr: string): boolean {
        return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(new Date(dateStr + 'T00:00:00').getTime());
    }

    /** Lấy user_id từ doctorId, throw nếu không tồn tại */
    private static async resolveUserId(doctorId: string): Promise<string> {
        const userId = await DoctorAvailabilityRepository.getDoctorUserId(doctorId);
        if (!userId) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'DOCTOR_NOT_FOUND', DOCTOR_AVAILABILITY_ERRORS.DOCTOR_NOT_FOUND);
        }
        return userId;
    }

    /**
     * Lấy lịch làm việc tổng hợp của 1 BS (nhóm theo ngày)
     */
    static async getDoctorSchedule(
        doctorId: string,
        startDate: string,
        endDate: string
    ): Promise<Record<string, any[]>> {
        if (!startDate || !endDate) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DATE_RANGE', DOCTOR_AVAILABILITY_ERRORS.MISSING_DATE_RANGE);
        }
        if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_DATE_FORMAT', DOCTOR_AVAILABILITY_ERRORS.INVALID_DATE_FORMAT);
        }

        const userId = await this.resolveUserId(doctorId);
        const schedules = await DoctorAvailabilityRepository.getDoctorSchedule(userId, startDate, endDate);

        // Nhóm theo ngày để FE dễ render calendar
        const grouped: Record<string, any[]> = {};
        for (const row of schedules) {
            const dateKey = row.working_date;
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(row);
        }

        return grouped;
    }

    /**
     * Kiểm tra xung đột lịch BS trước khi gán ca mới
     */
    static async checkConflicts(
        doctorId: string,
        workingDate: string,
        shiftId: string
    ): Promise<{ has_conflict: boolean; conflicts: any[]; warnings: any[] }> {
        if (!workingDate) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DATE', DOCTOR_AVAILABILITY_ERRORS.MISSING_DATE);
        }
        if (!shiftId) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_SHIFT_ID', DOCTOR_AVAILABILITY_ERRORS.MISSING_SHIFT_ID);
        }
        if (!this.isValidDate(workingDate)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_DATE_FORMAT', DOCTOR_AVAILABILITY_ERRORS.INVALID_DATE_FORMAT);
        }

        const userId = await this.resolveUserId(doctorId);
        const conflicts: any[] = [];
        const warnings: any[] = [];

        // 1. Check leave APPROVED trùng ngày
        const hasLeave = await DoctorAvailabilityRepository.hasApprovedLeave(userId, workingDate);
        if (hasLeave) {
            conflicts.push({
                type: 'LEAVE_CONFLICT',
                message: `Bác sĩ đã có đơn nghỉ phép được duyệt vào ngày ${workingDate}.`,
            });
        }

        // 2. Check schedule overlap
        const shiftTime = await DoctorAvailabilityRepository.getShiftTime(shiftId);
        if (shiftTime) {
            const existingSchedules = await DoctorAvailabilityRepository.getSchedulesByUserAndDate(userId, workingDate);

            for (const existing of existingSchedules) {
                if (this.isTimeOverlapping(shiftTime.start_time, shiftTime.end_time, existing.start_time, existing.end_time)) {
                    conflicts.push({
                        type: 'SCHEDULE_OVERLAP',
                        message: `Trùng giờ với lịch hiện có: ${existing.shift_name} (${existing.start_time} - ${existing.end_time}) tại ${existing.room_name}.`,
                        schedule_id: existing.staff_schedules_id,
                    });
                }
            }
        }

        return {
            has_conflict: conflicts.length > 0,
            conflicts,
            warnings,
        };
    }

    /**
     * Danh sách BS khả dụng theo chuyên khoa + ngày
     */
    static async getDoctorsBySpecialty(
        specialtyId: string,
        date: string,
        shiftId?: string
    ): Promise<any[]> {
        if (!date) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DATE', DOCTOR_AVAILABILITY_ERRORS.MISSING_DATE);
        }
        if (!this.isValidDate(date)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_DATE_FORMAT', DOCTOR_AVAILABILITY_ERRORS.INVALID_DATE_FORMAT);
        }

        const specialtyExists = await DoctorAvailabilityRepository.isSpecialtyExists(specialtyId);
        if (!specialtyExists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'SPECIALTY_NOT_FOUND', DOCTOR_AVAILABILITY_ERRORS.SPECIALTY_NOT_FOUND);
        }

        return await DoctorAvailabilityRepository.getDoctorsBySpecialtyAndDate(specialtyId, date, shiftId);
    }

    /**
     * Tổng quan tất cả BS đang làm việc trong ngày
     */
    static async getDoctorOverviewByDate(date: string): Promise<Record<string, any[]>> {
        if (!date) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DATE', DOCTOR_AVAILABILITY_ERRORS.MISSING_DATE);
        }
        if (!this.isValidDate(date)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_DATE_FORMAT', DOCTOR_AVAILABILITY_ERRORS.INVALID_DATE_FORMAT);
        }

        const rows = await DoctorAvailabilityRepository.getDoctorOverviewByDate(date);

        // Nhóm theo ca làm việc
        const grouped: Record<string, any[]> = {};
        for (const row of rows) {
            const key = row.shift_name || 'Không xác định';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(row);
        }

        return grouped;
    }

    /**
     * Lịch BS ở tất cả cơ sở (nhóm theo branch)
     */
    static async getDoctorMultiFacilitySchedule(
        doctorId: string,
        startDate: string,
        endDate: string
    ): Promise<Record<string, any[]>> {
        if (!startDate || !endDate) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DATE_RANGE', DOCTOR_AVAILABILITY_ERRORS.MISSING_DATE_RANGE);
        }
        if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_DATE_FORMAT', DOCTOR_AVAILABILITY_ERRORS.INVALID_DATE_FORMAT);
        }

        const userId = await this.resolveUserId(doctorId);
        const rows = await DoctorAvailabilityRepository.getDoctorMultiFacilitySchedule(userId, startDate, endDate);

        // Nhóm theo branch
        const grouped: Record<string, any[]> = {};
        for (const row of rows) {
            const key = row.branch_name || 'Không xác định';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(row);
        }

        return grouped;
    }

    /** So sánh 2 khoảng thời gian có overlap không */
    private static isTimeOverlapping(start1: string, end1: string, start2: string, end2: string): boolean {
        return start1 < end2 && end1 > start2;
    }
}
