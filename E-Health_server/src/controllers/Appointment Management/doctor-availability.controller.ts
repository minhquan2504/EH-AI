import { Request, Response } from 'express';
import { DoctorAvailabilityService } from '../../services/Appointment Management/doctor-availability.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { DOCTOR_AVAILABILITY_SUCCESS } from '../../constants/doctor-availability.constant';

/**
 * Controller API xem lịch khả dụng bác sĩ (read-only).
 */
export class DoctorAvailabilityController {

    /**
     * GET /api/doctor-availability/:doctorId — Lịch làm việc tổng hợp
     */
    static async getDoctorSchedule(req: Request, res: Response): Promise<void> {
        try {
            const doctorId = req.params.doctorId as string;
            const startDate = req.query.start_date as string;
            const endDate = req.query.end_date as string;

            const data = await DoctorAvailabilityService.getDoctorSchedule(doctorId, startDate, endDate);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: DOCTOR_AVAILABILITY_SUCCESS.SCHEDULE_FETCHED,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi lấy lịch bác sĩ' });
            }
        }
    }

    /**
     * GET /api/doctor-availability/:doctorId/conflicts — Kiểm tra xung đột
     */
    static async checkConflicts(req: Request, res: Response): Promise<void> {
        try {
            const doctorId = req.params.doctorId as string;
            const workingDate = req.query.working_date as string;
            const shiftId = req.query.shift_id as string;

            const result = await DoctorAvailabilityService.checkConflicts(doctorId, workingDate, shiftId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: DOCTOR_AVAILABILITY_SUCCESS.CONFLICT_CHECKED,
                data: result,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi kiểm tra xung đột' });
            }
        }
    }

    /**
     * GET /api/doctor-availability/by-specialty/:specialtyId — BS theo chuyên khoa
     */
    static async getDoctorsBySpecialty(req: Request, res: Response): Promise<void> {
        try {
            const specialtyId = req.params.specialtyId as string;
            const date = req.query.date as string;
            const shiftId = req.query.shift_id as string | undefined;

            const data = await DoctorAvailabilityService.getDoctorsBySpecialty(specialtyId, date, shiftId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: DOCTOR_AVAILABILITY_SUCCESS.BY_SPECIALTY_FETCHED,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi lấy BS theo chuyên khoa' });
            }
        }
    }

    /**
     * GET /api/doctor-availability/by-date/:date — Tổng quan ngày
     */
    static async getDoctorOverviewByDate(req: Request, res: Response): Promise<void> {
        try {
            const date = req.params.date as string;

            const data = await DoctorAvailabilityService.getDoctorOverviewByDate(date);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: DOCTOR_AVAILABILITY_SUCCESS.BY_DATE_FETCHED,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi lấy tổng quan ngày' });
            }
        }
    }

    /**
     * GET /api/doctor-availability/:doctorId/facilities — Lịch đa cơ sở
     */
    static async getDoctorMultiFacilitySchedule(req: Request, res: Response): Promise<void> {
        try {
            const doctorId = req.params.doctorId as string;
            const startDate = req.query.start_date as string;
            const endDate = req.query.end_date as string;

            const data = await DoctorAvailabilityService.getDoctorMultiFacilitySchedule(doctorId, startDate, endDate);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: DOCTOR_AVAILABILITY_SUCCESS.FACILITIES_FETCHED,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi lấy lịch đa cơ sở' });
            }
        }
    }
}
