// src/controllers/Facility Management/operating-hour.controller.ts
import { Request, Response } from 'express';
import { OperatingHourService } from '../../services/Facility Management/operating-hour.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';

export class OperatingHourController {

    /**
     * Tạo mới cấu hình giờ hoạt động
     */
    static async create(req: Request, res: Response) {
        try {
            const data = await OperatingHourService.createOperatingHour(req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Tạo giờ hoạt động thành công.', data });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi tạo giờ hoạt động.' });
        }
    }

    /**
     * Lấy danh sách giờ hoạt động
     */
    static async getAll(req: Request, res: Response) {
        try {
            const facilityId = req.query.facility_id ? String(req.query.facility_id) : undefined;
            const data = await OperatingHourService.getOperatingHours(facilityId);
            res.status(HTTP_STATUS.OK).json({ success: true, data });
        } catch (error: any) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi lấy danh sách giờ hoạt động.' });
        }
    }

    /**
     * Lấy chi tiết 1 cấu hình
     */
    static async getById(req: Request, res: Response) {
        try {
            const data = await OperatingHourService.getOperatingHourById(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, data });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ.' });
        }
    }

    /**
     * Cập nhật giờ hoạt động
     */
    static async update(req: Request, res: Response) {
        try {
            const data = await OperatingHourService.updateOperatingHour(req.params.id as string, req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Cập nhật giờ hoạt động thành công.', data });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi cập nhật.' });
        }
    }

    /**
     * Xóa cấu hình giờ hoạt động (Soft Delete)
     */
    static async remove(req: Request, res: Response) {
        try {
            await OperatingHourService.deleteOperatingHour(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Xóa giờ hoạt động thành công.' });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi xóa.' });
        }
    }
}
