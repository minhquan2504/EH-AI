import { Request, Response } from 'express';
import { DoctorAbsenceService } from '../../services/Appointment Management/doctor-absence.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { DOCTOR_ABSENCE_SUCCESS } from '../../constants/doctor-absence.constant';

/**
 * Controller quản lý lịch vắng đột xuất bác sĩ.
 */
export class DoctorAbsenceController {

    /**
     * POST /api/doctor-absences — Tạo lịch vắng đột xuất
     */
    static async createAbsence(req: Request, res: Response): Promise<void> {
        try {
            const createdBy = (req as any).auth?.user_id;
            const { doctor_id, absence_date, shift_id, absence_type, reason } = req.body;

            const result = await DoctorAbsenceService.createAbsence(
                { doctor_id, absence_date, shift_id, absence_type, reason },
                createdBy
            );

            const response: any = {
                success: true,
                message: DOCTOR_ABSENCE_SUCCESS.CREATED,
                data: result.absence,
                schedules_marked: result.schedules_marked,
            };

            // Thêm warning nếu có lịch khám bị ảnh hưởng
            if (result.affected_appointments > 0) {
                response.warning = `Có ${result.affected_appointments} lịch khám (PENDING/CONFIRMED) bị ảnh hưởng bởi việc vắng.`;
                response.affected_appointments = result.affected_appointments;
            }

            res.status(HTTP_STATUS.CREATED).json(response);
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi tạo lịch vắng' });
            }
        }
    }

    /**
     * GET /api/doctor-absences — Danh sách vắng đột xuất
     */
    static async getAbsences(req: Request, res: Response): Promise<void> {
        try {
            const filters = {
                doctor_id: req.query.doctor_id as string | undefined,
                start_date: req.query.start_date as string | undefined,
                end_date: req.query.end_date as string | undefined,
                absence_type: req.query.absence_type as string | undefined,
            };

            const data = await DoctorAbsenceService.getAbsences(filters);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: DOCTOR_ABSENCE_SUCCESS.LIST_FETCHED,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi lấy danh sách vắng' });
            }
        }
    }

    /**
     * DELETE /api/doctor-absences/:absenceId — Huỷ lịch vắng
     */
    static async deleteAbsence(req: Request, res: Response): Promise<void> {
        try {
            const absenceId = req.params.absenceId as string;
            await DoctorAbsenceService.deleteAbsence(absenceId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: DOCTOR_ABSENCE_SUCCESS.DELETED,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi huỷ lịch vắng' });
            }
        }
    }

    /**
     * GET /api/doctor-absences/affected-appointments — Xem lịch khám bị ảnh hưởng
     */
    static async getAffectedAppointments(req: Request, res: Response): Promise<void> {
        try {
            const doctorId = req.query.doctor_id as string;
            const absenceDate = req.query.absence_date as string;
            const shiftId = req.query.shift_id as string | undefined;

            const result = await DoctorAbsenceService.getAffectedAppointments(doctorId, absenceDate, shiftId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: DOCTOR_ABSENCE_SUCCESS.AFFECTED_FETCHED,
                data: result,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }
}
