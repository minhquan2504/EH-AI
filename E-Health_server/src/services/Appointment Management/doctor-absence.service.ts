import { DoctorAbsenceRepository } from '../../repository/Appointment Management/doctor-absence.repository';
import { DoctorAbsence, CreateDoctorAbsenceInput } from '../../models/Appointment Management/doctor-absence.model';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { DOCTOR_ABSENCE_ERRORS, ABSENCE_TYPES } from '../../constants/doctor-absence.constant';

/**
 * Service quản lý lịch vắng đột xuất bác sĩ.
 * Hỗ trợ tạo nhanh (không cần quy trình duyệt) + tự động đánh dấu staff_schedules.
 */
export class DoctorAbsenceService {

    /** Validate định dạng ngày */
    private static isValidDate(dateStr: string): boolean {
        return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(new Date(dateStr + 'T00:00:00').getTime());
    }

    /** Validate ngày không trong quá khứ */
    private static validateDateNotPast(dateStr: string): void {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(dateStr + 'T00:00:00');

        if (targetDate.getTime() < today.getTime()) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_DATE_PAST', DOCTOR_ABSENCE_ERRORS.INVALID_DATE_PAST);
        }
    }

    /**
     * Tạo lịch vắng đột xuất + tự động mark staff_schedules + đếm ảnh hưởng
     */
    static async createAbsence(input: CreateDoctorAbsenceInput, createdBy: string): Promise<{
        absence: DoctorAbsence;
        affected_appointments: number;
        schedules_marked: number;
    }> {
        // Validate input
        if (!input.doctor_id) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DOCTOR_ID', DOCTOR_ABSENCE_ERRORS.MISSING_DOCTOR_ID);
        }
        if (!input.absence_date) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DATE', DOCTOR_ABSENCE_ERRORS.MISSING_DATE);
        }
        if (!input.absence_type) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_ABSENCE_TYPE', DOCTOR_ABSENCE_ERRORS.MISSING_ABSENCE_TYPE);
        }
        if (!this.isValidDate(input.absence_date)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_DATE_FORMAT', DOCTOR_ABSENCE_ERRORS.INVALID_DATE_FORMAT);
        }
        if (!ABSENCE_TYPES.includes(input.absence_type)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_ABSENCE_TYPE', DOCTOR_ABSENCE_ERRORS.INVALID_ABSENCE_TYPE);
        }

        this.validateDateNotPast(input.absence_date);

        // Validate doctor tồn tại
        const userId = await DoctorAbsenceRepository.getDoctorUserId(input.doctor_id);
        if (!userId) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'DOCTOR_NOT_FOUND', DOCTOR_ABSENCE_ERRORS.DOCTOR_NOT_FOUND);
        }

        // Validate shift (nếu có)
        if (input.shift_id) {
            const shiftExists = await DoctorAbsenceRepository.isShiftExists(input.shift_id);
            if (!shiftExists) {
                throw new AppError(HTTP_STATUS.NOT_FOUND, 'SHIFT_NOT_FOUND', DOCTOR_ABSENCE_ERRORS.SHIFT_NOT_FOUND);
            }
        }

        // Tạo bản ghi absence
        const absence = await DoctorAbsenceRepository.create(
            input.doctor_id,
            input.absence_date,
            input.shift_id || null,
            input.absence_type,
            input.reason || null,
            createdBy
        );

        if (!absence) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'ABSENCE_ALREADY_EXISTS', DOCTOR_ABSENCE_ERRORS.ABSENCE_ALREADY_EXISTS);
        }

        // Tự động đánh dấu staff_schedules.is_leave = true
        const schedulesMarked = await DoctorAbsenceRepository.markSchedulesAsAbsent(
            userId,
            input.absence_date,
            input.shift_id || null,
            input.reason || 'Vắng đột xuất'
        );

        // Đếm lịch khám bị ảnh hưởng
        const affected = await DoctorAbsenceRepository.getAffectedAppointments(
            input.doctor_id,
            input.absence_date,
            input.shift_id
        );

        return {
            absence,
            affected_appointments: affected.count,
            schedules_marked: schedulesMarked,
        };
    }

    /**
     * Lấy danh sách vắng đột xuất (filter)
     */
    static async getAbsences(filters: {
        doctor_id?: string;
        start_date?: string;
        end_date?: string;
        absence_type?: string;
    }): Promise<DoctorAbsence[]> {
        return await DoctorAbsenceRepository.findAll(filters);
    }

    /**
     * Huỷ lịch vắng (soft delete + revert staff_schedules)
     */
    static async deleteAbsence(absenceId: string): Promise<void> {
        const existing = await DoctorAbsenceRepository.findById(absenceId);
        if (!existing) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'ABSENCE_NOT_FOUND', DOCTOR_ABSENCE_ERRORS.ABSENCE_NOT_FOUND);
        }

        const success = await DoctorAbsenceRepository.softDelete(absenceId);
        if (!success) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'ABSENCE_NOT_FOUND', DOCTOR_ABSENCE_ERRORS.ABSENCE_NOT_FOUND);
        }

        // Revert staff_schedules.is_leave = false
        const userId = await DoctorAbsenceRepository.getDoctorUserId(existing.doctor_id);
        if (userId) {
            await DoctorAbsenceRepository.revertSchedulesFromAbsent(
                userId,
                existing.absence_date,
                existing.shift_id
            );
        }
    }

    /**
     * Xem danh sách lịch khám bị ảnh hưởng
     */
    static async getAffectedAppointments(
        doctorId: string,
        absenceDate: string,
        shiftId?: string
    ): Promise<{ count: number; appointments: any[] }> {
        if (!doctorId) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DOCTOR_ID', DOCTOR_ABSENCE_ERRORS.MISSING_DOCTOR_ID);
        }
        if (!absenceDate) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DATE', DOCTOR_ABSENCE_ERRORS.MISSING_DATE);
        }

        const userId = await DoctorAbsenceRepository.getDoctorUserId(doctorId);
        if (!userId) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'DOCTOR_NOT_FOUND', DOCTOR_ABSENCE_ERRORS.DOCTOR_NOT_FOUND);
        }

        return await DoctorAbsenceRepository.getAffectedAppointments(doctorId, absenceDate, shiftId);
    }
}
