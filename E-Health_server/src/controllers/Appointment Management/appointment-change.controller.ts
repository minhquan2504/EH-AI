// src/controllers/Appointment Management/appointment-change.controller.ts
import { Request, Response } from 'express';
import { AppointmentChangeService } from '../../services/Appointment Management/appointment-change.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { CHANGE_SUCCESS, CHANGE_ERRORS } from '../../constants/appointment-change.constant';


export class AppointmentChangeController {

    /** GET /api/appointment-changes/:appointmentId/history */
    static async getHistory(req: Request, res: Response) {
        try {
            const appointmentId = req.params.appointmentId?.toString();
            const data = await AppointmentChangeService.getHistory(appointmentId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: CHANGE_SUCCESS.HISTORY_FETCHED,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi lấy lịch sử thay đổi' });
            }
        }
    }

    /** GET /api/appointment-changes/stats */
    static async getStats(req: Request, res: Response) {
        try {
            const fromDate = req.query.from_date?.toString();
            const toDate = req.query.to_date?.toString();
            const branchId = req.query.branch_id?.toString();

            if (!fromDate || !toDate) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_DATE_RANGE', CHANGE_ERRORS.INVALID_DATE_RANGE);
            }

            const data = await AppointmentChangeService.getStats(fromDate, toDate, branchId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: CHANGE_SUCCESS.STATS_FETCHED,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi lấy thống kê' });
            }
        }
    }

    /** POST /api/appointment-changes/:appointmentId/check-cancel-policy */
    static async checkCancelPolicy(req: Request, res: Response) {
        try {
            const appointmentId = req.params.appointmentId?.toString();
            const data = await AppointmentChangeService.checkCancelPolicy(appointmentId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: CHANGE_SUCCESS.POLICY_CHECKED,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi kiểm tra chính sách hủy' });
            }
        }
    }

    /** GET /api/appointment-changes/recent */
    static async getRecentChanges(req: Request, res: Response) {
        try {
            const filters = {
                change_type: req.query.change_type?.toString(),
                branch_id: req.query.branch_id?.toString(),
                page: req.query.page ? parseInt(req.query.page.toString()) : 1,
                limit: req.query.limit ? parseInt(req.query.limit.toString()) : 20,
            };
            const result = await AppointmentChangeService.getRecentChanges(filters);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: CHANGE_SUCCESS.RECENT_FETCHED,
                data: result.data,
                pagination: {
                    page: filters.page,
                    limit: filters.limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / filters.limit),
                },
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi lấy danh sách thay đổi gần đây' });
            }
        }
    }

    /** GET /api/appointment-changes/:appointmentId/can-reschedule */
    static async canReschedule(req: Request, res: Response) {
        try {
            const appointmentId = req.params.appointmentId?.toString();
            const data = await AppointmentChangeService.canReschedule(appointmentId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: CHANGE_SUCCESS.CAN_RESCHEDULE_CHECKED,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi kiểm tra khả năng dời lịch' });
            }
        }
    }
}
