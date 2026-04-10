// src/controllers/Appointment Management/appointment-status.controller.ts
import { Request, Response } from 'express';
import { AppointmentStatusService } from '../../services/Appointment Management/appointment-status.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { STATUS_SUCCESS } from '../../constants/appointment-status.constant';


export class AppointmentStatusController {

    /** POST /api/appointment-status/:id/check-in — Check-in tại quầy */
    static async checkIn(req: Request, res: Response) {
        try {
            const userId = (req as any).auth?.user_id;
            const result = await AppointmentStatusService.checkInAtCounter(req.params.id.toString(), userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.CHECKED_IN,
                data: result,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi check-in' });
            }
        }
    }

    /** POST /api/appointment-status/:id/check-in-test — Check-in TEST (bỏ qua kiểm tra ngày) */
    static async checkInTest(req: Request, res: Response) {
        try {
            const userId = (req as any).auth?.user_id;
            const result = await AppointmentStatusService.checkInTest(req.params.id.toString(), userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: '[TEST] ' + STATUS_SUCCESS.CHECKED_IN,
                data: result,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi check-in test' });
            }
        }
    }

    /** POST /api/appointment-status/generate-qr/:id — Sinh QR token */
    static async generateQr(req: Request, res: Response) {
        try {
            const result = await AppointmentStatusService.generateQrToken(req.params.id.toString());
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.QR_GENERATED,
                data: result,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi tạo QR' });
            }
        }
    }

    /** POST /api/appointment-status/check-in-qr — Check-in bằng QR */
    static async checkInQr(req: Request, res: Response) {
        try {
            const { qr_token } = req.body;
            const result = await AppointmentStatusService.checkInByQr(qr_token);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.QR_CHECKED_IN,
                data: result,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi check-in QR' });
            }
        }
    }

    /** PATCH /api/appointment-status/:id/start-exam — Bắt đầu khám */
    static async startExam(req: Request, res: Response) {
        try {
            const userId = (req as any).auth?.user_id;
            const result = await AppointmentStatusService.startExam(req.params.id.toString(), userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.EXAM_STARTED,
                data: result,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi bắt đầu khám' });
            }
        }
    }

    /** PATCH /api/appointment-status/:id/complete-exam — Hoàn tất khám */
    static async completeExam(req: Request, res: Response) {
        try {
            const userId = (req as any).auth?.user_id;
            const result = await AppointmentStatusService.completeExam(req.params.id.toString(), userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.EXAM_COMPLETED,
                data: result,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi hoàn tất khám' });
            }
        }
    }

    /** PATCH /api/appointment-status/:id/no-show — Đánh dấu No-Show */
    static async markNoShow(req: Request, res: Response) {
        try {
            const userId = (req as any).auth?.user_id;
            const { note } = req.body;
            const result = await AppointmentStatusService.markNoShow(req.params.id.toString(), userId, note);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.NO_SHOW_MARKED,
                data: result,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi đánh No-Show' });
            }
        }
    }

    /** GET /api/appointment-status/dashboard/today — Dashboard hôm nay */
    static async getDashboard(req: Request, res: Response) {
        try {
            const branchId = req.query.branch_id?.toString();
            const data = await AppointmentStatusService.getDashboardToday(branchId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.DASHBOARD_FETCHED,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi lấy dashboard' });
            }
        }
    }

    /** GET /api/appointment-status/dashboard/:date — Dashboard theo ngày */
    static async getDashboardByDate(req: Request, res: Response) {
        try {
            const date = req.params.date?.toString();
            const branchId = req.query.branch_id?.toString();
            const data = await AppointmentStatusService.getDashboardByDate(date, branchId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.DASHBOARD_FETCHED,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi lấy dashboard' });
            }
        }
    }

    /** GET /api/appointment-status/queue/today — Hàng đợi hôm nay */
    static async getQueue(req: Request, res: Response) {
        try {
            const filters = {
                branch_id: req.query.branch_id?.toString(),
                room_id: req.query.room_id?.toString(),
                status: req.query.status?.toString(),
            };
            const data = await AppointmentStatusService.getQueueToday(filters);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.QUEUE_FETCHED,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi lấy hàng đợi' });
            }
        }
    }

    /** GET /api/appointment-status/room-status — Trạng thái phòng khám */
    static async getRoomStatus(req: Request, res: Response) {
        try {
            const branchId = req.query.branch_id?.toString();
            const data = await AppointmentStatusService.getRoomStatus(branchId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.ROOM_STATUS_FETCHED,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi lấy trạng thái phòng' });
            }
        }
    }

    /** GET /api/appointment-status/settings — Lấy cấu hình */
    static async getSettings(req: Request, res: Response) {
        try {
            const data = await AppointmentStatusService.getSettings();
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.SETTINGS_FETCHED,
                data,
            });
        } catch (error: any) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi lấy cấu hình' });
        }
    }

    /** PUT /api/appointment-status/settings — Cập nhật cấu hình */
    static async updateSettings(req: Request, res: Response) {
        try {
            const data = await AppointmentStatusService.updateSettings(req.body);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.SETTINGS_UPDATED,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi cập nhật cấu hình' });
            }
        }
    }

    /** PATCH /api/appointment-status/:id/skip — Bỏ qua BN trong hàng đợi */
    static async skipPatient(req: Request, res: Response) {
        try {
            const userId = (req as any).auth?.user_id;
            const result = await AppointmentStatusService.skipPatient(req.params.id.toString(), userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.QUEUE_SKIPPED,
                data: result,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi bỏ qua BN' });
            }
        }
    }

    /** PATCH /api/appointment-status/:id/recall — Gọi lại BN đã skip */
    static async recallPatient(req: Request, res: Response) {
        try {
            const userId = (req as any).auth?.user_id;
            const result = await AppointmentStatusService.recallPatient(req.params.id.toString(), userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: STATUS_SUCCESS.QUEUE_RECALLED,
                data: result,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi gọi lại BN' });
            }
        }
    }
}
