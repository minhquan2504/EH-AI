// src/controllers/Facility Management/closed-day.controller.ts
import { Request, Response } from 'express';
import { ClosedDayService } from '../../services/Facility Management/closed-day.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';

export class ClosedDayController {

    /**
     * Tạo mới ngày nghỉ cố định
     */
    static async create(req: Request, res: Response) {
        try {
            const data = await ClosedDayService.createClosedDay(req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Tạo ngày nghỉ cố định thành công.', data });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi tạo ngày nghỉ.' });
        }
    }

    /**
     * Lấy danh sách ngày nghỉ
     */
    static async getAll(req: Request, res: Response) {
        try {
            const facilityId = req.query.facility_id ? String(req.query.facility_id) : undefined;
            const data = await ClosedDayService.getClosedDays(facilityId);
            res.status(HTTP_STATUS.OK).json({ success: true, data });
        } catch (error: any) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi lấy danh sách ngày nghỉ.' });
        }
    }

    /**
     * Xóa ngày nghỉ (Soft Delete)
     */
    static async remove(req: Request, res: Response) {
        try {
            await ClosedDayService.deleteClosedDay(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Xóa ngày nghỉ thành công.' });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi xóa ngày nghỉ.' });
        }
    }
}
