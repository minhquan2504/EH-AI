// src/controllers/Facility Management/shift-swap.controller.ts
import { Request, Response } from 'express';
import { ShiftSwapService } from '../../services/Facility Management/shift-swap.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';

export class ShiftSwapController {

    /**
     * Tạo yêu cầu đổi ca
     */
    static async createSwap(req: Request, res: Response) {
        try {
            const { requester_schedule_id, target_schedule_id, reason } = req.body;
            const requesterId = (req as any).auth?.user_id;

            if (!requester_schedule_id || !target_schedule_id || !reason) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DATA', 'Thiếu thông tin: requester_schedule_id, target_schedule_id, reason.');
            }

            const swap = await ShiftSwapService.createSwapRequest(
                { requester_schedule_id, target_schedule_id, reason },
                requesterId
            );

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: 'Tạo yêu cầu đổi ca thành công',
                data: swap
            });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi tạo yêu cầu đổi ca' });
        }
    }

    /**
     * Lấy danh sách yêu cầu đổi ca
     */
    static async getSwaps(req: Request, res: Response) {
        try {
            const { status } = req.query;
            const swaps = await ShiftSwapService.getSwapRequests({ status: status?.toString() });
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Lấy danh sách yêu cầu đổi ca thành công', data: swaps });
        } catch (error: any) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
        }
    }

    /**
     * Xem chi tiết 1 yêu cầu
     */
    static async getSwapById(req: Request, res: Response) {
        try {
            const swap = await ShiftSwapService.getSwapById(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, data: swap });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /**
     * Duyệt yêu cầu đổi ca
     */
    static async approveSwap(req: Request, res: Response) {
        try {
            const approverId = (req as any).auth?.user_id;
            const approverNote = req.body.approver_note as string | undefined;
            const updated = await ShiftSwapService.approveSwap(req.params.id as string, approverId, approverNote);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Đã duyệt yêu cầu đổi ca thành công', data: updated });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /**
     * Từ chối yêu cầu đổi ca
     */
    static async rejectSwap(req: Request, res: Response) {
        try {
            const approverId = (req as any).auth?.user_id;
            const approverNote = req.body.approver_note as string;
            const updated = await ShiftSwapService.rejectSwap(req.params.id as string, approverId, approverNote);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Đã từ chối yêu cầu đổi ca', data: updated });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }
}
