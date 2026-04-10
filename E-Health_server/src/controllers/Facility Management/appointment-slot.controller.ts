// src/controllers/Facility Management/appointment-slot.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AppointmentSlotService } from '../../services/Facility Management/appointment-slot.service';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';

export class AppointmentSlotController {

    // Tạo 1 Slot đơn lẻ
    static async createSlot(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (req.body.interval_minutes) {
                const slots = await AppointmentSlotService.bulkCreateSlots(req.body);
                res.status(HTTP_STATUS.CREATED).json({
                    success: true,
                    message: `Tạo thành công ${slots.length} Auto Slots mới.`,
                    data: slots
                });
                return;
            }

            const slot = await AppointmentSlotService.createSlot(req.body);
            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: 'Tạo Slot Khám Bệnh thành công.',
                data: slot
            });
        } catch (error) {
            next(error);
        }
    }

    // Lấy Danh sách Slot
    static async getSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const shiftId = req.query.shift_id as string | undefined;

            let isActive: boolean | undefined = undefined;
            if (req.query.is_active === 'true') isActive = true;
            if (req.query.is_active === 'false') isActive = false;

            const slots = await AppointmentSlotService.getSlots(shiftId, isActive);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Tra cứu danh sách Slot thành công.',
                data: slots
            });
        } catch (error) {
            next(error);
        }
    }

    // Chi tiết 1 Slot
    static async getSlotById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const slotId = req.params.id as string;
            const slot = await AppointmentSlotService.getSlotById(slotId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Lấy chi tiết Slot thành công.',
                data: slot
            });
        } catch (error) {
            next(error);
        }
    }

    // Cập nhật Slot
    static async updateSlot(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const slotId = req.params.id as string;
            const updateData = req.body;

            const updatedSlot = await AppointmentSlotService.updateSlot(slotId, updateData);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Cập nhật cấu hình Slot thành công.',
                data: updatedSlot
            });
        } catch (error) {
            next(error);
        }
    }

    // Soft Delete (Disable)
    static async disableSlot(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const slotId = req.params.id as string;
            await AppointmentSlotService.disableSlot(slotId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Đã vô hiệu hóa Slot khỏi danh mục áp dụng.',
            });
        } catch (error) {
            next(error);
        }
    }
}
