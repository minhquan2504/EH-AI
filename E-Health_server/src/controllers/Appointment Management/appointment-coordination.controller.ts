// src/controllers/Appointment Management/appointment-coordination.controller.ts
import { Request, Response } from 'express';
import { AppointmentCoordinationService } from '../../services/Appointment Management/appointment-coordination.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { COORDINATION_SUCCESS } from '../../constants/appointment-coordination.constant';

/**
 * Controller cho Module 3.9 — Điều phối & tối ưu lịch khám
 */
export class AppointmentCoordinationController {

    /** GET /api/appointment-coordination/doctor-load */
    static async getDoctorLoad(req: Request, res: Response) {
        try {
            const date = req.query.date?.toString() || '';
            const branchId = req.query.branch_id?.toString();
            const specialtyId = req.query.specialty_id?.toString();
            const data = await AppointmentCoordinationService.getDoctorLoad(date, branchId, specialtyId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: COORDINATION_SUCCESS.DOCTOR_LOAD_FETCHED,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[COORDINATION] getDoctorLoad error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi lấy tải BS' });
            }
        }
    }

    /** GET /api/appointment-coordination/suggest-slots */
    static async suggestSlots(req: Request, res: Response) {
        try {
            const date = req.query.date?.toString() || '';
            const doctorId = req.query.doctor_id?.toString();
            const specialtyId = req.query.specialty_id?.toString();
            const priority = req.query.priority?.toString();
            const data = await AppointmentCoordinationService.suggestSlots(date, doctorId, specialtyId, priority);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: COORDINATION_SUCCESS.SLOTS_SUGGESTED,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[COORDINATION] suggestSlots error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi gợi ý slot' });
            }
        }
    }

    /** GET /api/appointment-coordination/balance-overview */
    static async getBalanceOverview(req: Request, res: Response) {
        try {
            const date = req.query.date?.toString() || '';
            const branchId = req.query.branch_id?.toString();
            const data = await AppointmentCoordinationService.getBalanceOverview(date, branchId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: COORDINATION_SUCCESS.BALANCE_FETCHED,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[COORDINATION] getBalanceOverview error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi lấy dashboard cân bằng' });
            }
        }
    }

    /** PATCH /api/appointment-coordination/:appointmentId/priority */
    static async setPriority(req: Request, res: Response) {
        try {
            const appointmentId = req.params.appointmentId?.toString();
            const { priority, reason } = req.body;
            const userId = (req as any).auth?.user_id;
            await AppointmentCoordinationService.setPriority(appointmentId, priority, reason, userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: COORDINATION_SUCCESS.PRIORITY_SET,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[COORDINATION] setPriority error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi cập nhật ưu tiên' });
            }
        }
    }

    /** PATCH /api/appointment-coordination/:appointmentId/reassign-doctor */
    static async reassignDoctor(req: Request, res: Response) {
        try {
            const appointmentId = req.params.appointmentId?.toString();
            const { new_doctor_id, reason } = req.body;
            const userId = (req as any).auth?.user_id;
            await AppointmentCoordinationService.reassignDoctor(appointmentId, new_doctor_id, reason, userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: COORDINATION_SUCCESS.DOCTOR_REASSIGNED,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[COORDINATION] reassignDoctor error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi chuyển BS' });
            }
        }
    }

    /** POST /api/appointment-coordination/auto-assign */
    static async autoAssign(req: Request, res: Response) {
        try {
            const { date, specialty_id, branch_id } = req.body;
            const userId = (req as any).auth?.user_id;
            const data = await AppointmentCoordinationService.autoAssign(date, specialty_id, branch_id, userId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: COORDINATION_SUCCESS.AUTO_ASSIGNED,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[COORDINATION] autoAssign error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi auto-assign' });
            }
        }
    }

    /** GET /api/appointment-coordination/ai-dataset */
    static async getAIDataset(req: Request, res: Response) {
        try {
            const fromDate = req.query.from_date?.toString() || '';
            const toDate = req.query.to_date?.toString() || '';
            const branchId = req.query.branch_id?.toString();
            const data = await AppointmentCoordinationService.getAIDataset(fromDate, toDate, branchId);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: COORDINATION_SUCCESS.AI_DATASET_FETCHED,
                data,
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[COORDINATION] getAIDataset error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi xuất dữ liệu AI' });
            }
        }
    }
}
