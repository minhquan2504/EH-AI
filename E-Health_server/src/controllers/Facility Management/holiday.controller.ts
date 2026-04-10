// src/controllers/Facility Management/holiday.controller.ts
import { Request, Response } from 'express';
import { HolidayService } from '../../services/Facility Management/holiday.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';

export class HolidayController {

    /**
     * Tạo mới ngày lễ
     */
    static async create(req: Request, res: Response) {
        try {
            const data = await HolidayService.createHoliday(req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Tạo ngày lễ thành công.', data });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi tạo ngày lễ.' });
        }
    }

    /**
     * Lấy danh sách ngày lễ
     */
    static async getAll(req: Request, res: Response) {
        try {
            const filters = {
                facilityId: req.query.facility_id ? String(req.query.facility_id) : undefined,
                year: req.query.year ? Number(req.query.year) : undefined,
                from: req.query.from ? String(req.query.from) : undefined,
                to: req.query.to ? String(req.query.to) : undefined,
            };
            const data = await HolidayService.getHolidays(filters);
            res.status(HTTP_STATUS.OK).json({ success: true, data });
        } catch (error: any) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi lấy danh sách ngày lễ.' });
        }
    }

    /**
     * Chi tiết 1 ngày lễ
     */
    static async getById(req: Request, res: Response) {
        try {
            const data = await HolidayService.getHolidayById(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, data });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ.' });
        }
    }

    /**
     * Cập nhật ngày lễ
     */
    static async update(req: Request, res: Response) {
        try {
            const data = await HolidayService.updateHoliday(req.params.id as string, req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Cập nhật ngày lễ thành công.', data });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi cập nhật ngày lễ.' });
        }
    }

    /**
     * Xóa ngày lễ (Soft Delete)
     */
    static async remove(req: Request, res: Response) {
        try {
            await HolidayService.deleteHoliday(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Xóa ngày lễ thành công.' });
        } catch (error: any) {
            if (error instanceof AppError) res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            else res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi xóa ngày lễ.' });
        }
    }
}
