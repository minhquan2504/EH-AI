// src/controllers/Facility Management/facility-status.controller.ts
import { Request, Response } from 'express';
import { FacilityStatusService } from '../../services/Facility Management/facility-status.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';

export class FacilityStatusController {

    /**
     * Trạng thái cơ sở hôm nay
     */
    static async getToday(req: Request, res: Response) {
        try {
            const facilityId = req.query.facility_id ? String(req.query.facility_id) : '';
            const data = await FacilityStatusService.getStatusToday(facilityId);
            res.status(HTTP_STATUS.OK).json({ success: true, data });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ.' });
        }
    }

    /**
     * Trạng thái cơ sở theo ngày
     */
    static async getByDate(req: Request, res: Response) {
        try {
            const facilityId = req.query.facility_id ? String(req.query.facility_id) : '';
            const dateStr = req.params.date as string;
            const data = await FacilityStatusService.getStatusByDate(facilityId, dateStr);
            res.status(HTTP_STATUS.OK).json({ success: true, data });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ.' });
        }
    }

    /**
     * Calendar 1 tháng
     */
    static async getCalendar(req: Request, res: Response) {
        try {
            const facilityId = req.query.facility_id ? String(req.query.facility_id) : '';
            const month = req.query.month ? Number(req.query.month) : new Date().getMonth() + 1;
            const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
            const data = await FacilityStatusService.getCalendar(facilityId, month, year);
            res.status(HTTP_STATUS.OK).json({ success: true, data });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ.' });
        }
    }
}
