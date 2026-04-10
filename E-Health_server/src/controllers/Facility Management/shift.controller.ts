// src/controllers/shift.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ShiftService } from '../../services/Facility Management/shift.service';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';

export class ShiftController {

    // Lấy Danh sách ca làm việc
    static async getShifts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const facilityId = req.query.facility_id as string;
            const status = req.query.status as string;
            const search = req.query.search as string;

            const shifts = await ShiftService.getShifts(facilityId, status, search);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Lấy danh sách ca làm việc thành công',
                data: shifts
            });
        } catch (error) {
            next(error);
        }
    }

    // Chi tiết 1 Ca làm
    static async getShiftById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const shiftId = req.params.id as string;
            const shift = await ShiftService.getShiftById(shiftId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Lấy thông tin ca làm việc thành công',
                data: shift
            });
        } catch (error) {
            next(error);
        }
    }

    // Tạo Ca làm việc mới
    static async createShift(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = req.body;
            const newShift = await ShiftService.createShift(input);

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: 'Tạo ca làm việc mới thành công',
                data: newShift
            });
        } catch (error) {
            next(error);
        }
    }

    // Cập nhật cấu hình Ca
    static async updateShift(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const shiftId = req.params.id as string;
            const updateData = req.body;

            const updatedShift = await ShiftService.updateShift(shiftId, updateData);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Cập nhật cấu hình ca làm việc thành công',
                data: updatedShift
            });
        } catch (error) {
            next(error);
        }
    }

    // Thay đổi trạng thái về INACTIVE (Xóa Mềm Ca Làm Việc)
    static async deleteShift(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const shiftId = req.params.id as string;
            await ShiftService.deleteShift(shiftId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Đã tạm ngưng ca làm việc thành công'
            });
        } catch (error) {
            next(error);
        }
    }
}
