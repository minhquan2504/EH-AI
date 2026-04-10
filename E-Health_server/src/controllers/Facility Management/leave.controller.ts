// src/controllers/Facility Management/leave.controller.ts
import { Request, Response } from 'express';
import { LeaveService } from '../../services/Facility Management/leave.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';

export class LeaveController {

    /**
     * Tạo đơn nghỉ phép
     */
    static async createLeave(req: Request, res: Response) {
        try {
            const { start_date, end_date, reason } = req.body;
            const user_id = (req as any).auth?.user_id;

            if (!start_date || !end_date || !reason) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DATA', 'Thiếu thông tin bắt buộc: start_date, end_date, reason.');
            }

            const leave = await LeaveService.createLeave({ user_id, start_date, end_date, reason });

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: 'Tạo đơn xin nghỉ phép thành công',
                data: leave
            });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi tạo đơn nghỉ phép' });
        }
    }

    /**
     * Lấy danh sách đơn nghỉ phép
     */
    static async getLeaves(req: Request, res: Response) {
        try {
            const { user_id, status } = req.query;
            const filters = {
                user_id: user_id?.toString(),
                status: status?.toString()
            };

            const leaves = await LeaveService.getLeaves(filters);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Lấy danh sách đơn nghỉ phép thành công',
                data: leaves
            });
        } catch (error: any) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi lấy danh sách đơn nghỉ phép' });
        }
    }

    /**
     * Xem chi tiết 1 đơn
     */
    static async getLeaveById(req: Request, res: Response) {
        try {
            const leave = await LeaveService.getLeaveById(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, data: leave });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /**
     * Chỉnh sửa đơn (chỉ khi PENDING)
     */
    static async updateLeave(req: Request, res: Response) {
        try {
            const { start_date, end_date, reason } = req.body;
            const updated = await LeaveService.updateLeave(req.params.id as string, { start_date, end_date, reason });
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Cập nhật đơn nghỉ phép thành công', data: updated });
        } catch (error: any) {
            console.error('[LeaveController.updateLeave] Error:', error);
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /**
     * Hủy / rút đơn
     */
    static async deleteLeave(req: Request, res: Response) {
        try {
            await LeaveService.deleteLeave(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Đã hủy đơn nghỉ phép thành công' });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /**
     * Admin duyệt đơn
     */
    static async approveLeave(req: Request, res: Response) {
        try {
            const approverId = (req as any).auth?.user_id;
            const approverNote = req.body.approver_note as string | undefined;
            const updated = await LeaveService.approveLeave(req.params.id as string, approverId, approverNote);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Đã duyệt đơn nghỉ phép thành công', data: updated });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /**
     * Admin từ chối đơn
     */
    static async rejectLeave(req: Request, res: Response) {
        try {
            const approverId = (req as any).auth?.user_id;
            const approverNote = req.body.approver_note as string;
            const updated = await LeaveService.rejectLeave(req.params.id as string, approverId, approverNote);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Đã từ chối đơn nghỉ phép', data: updated });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }
}
