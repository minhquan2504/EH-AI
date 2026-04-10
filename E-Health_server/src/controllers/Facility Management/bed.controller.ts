import { Request, Response, NextFunction } from 'express';
import { BedService } from '../../services/Facility Management/bed.service';
import {
    CreateBedInput,
    UpdateBedInput,
    AssignBedInput
} from '../../models/Facility Management/bed.model';
import { BED_CONFIG } from '../../constants/bed.constant';

export class BedController {
    /**
     * Lấy danh sách giường bệnh
     */
    static async getBeds(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const {
                facility_id, branch_id, department_id, room_id,
                type, status, search, page, limit
            } = req.query as Record<string, string>;

            const data = await BedService.getBeds(
                facility_id,
                branch_id,
                department_id,
                room_id,
                type,
                status,
                search,
                page ? parseInt(page) : BED_CONFIG.DEFAULT_PAGE,
                limit ? parseInt(limit) : BED_CONFIG.DEFAULT_LIMIT
            );

            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy chi tiết giường
     */
    static async getBedById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const data = await BedService.getBedById(id);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tạo mới giường
     */
    static async createBed(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: CreateBedInput = req.body;
            const data = await BedService.createBed(input);
            res.status(201).json({
                success: true,
                message: 'Tạo giường bệnh thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật thông tin giường
     */
    static async updateBed(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const input: UpdateBedInput = req.body;
            const data = await BedService.updateBed(id, input);
            res.status(200).json({
                success: true,
                message: 'Cập nhật giường bệnh thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Gán / thay đổi phòng-khoa cho giường
     */
    static async assignBed(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const input: AssignBedInput = req.body;
            const data = await BedService.assignBed(id, input);
            res.status(200).json({
                success: true,
                message: 'Đã cập nhật vị trí giường thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật trạng thái giường
     */
    static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const { status } = req.body as { status: string };
            const data = await BedService.updateStatus(id, status);
            res.status(200).json({
                success: true,
                message: `Đã cập nhật trạng thái giường thành: ${status}.`,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa mềm giường
     */
    static async deleteBed(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            await BedService.deleteBed(id);
            res.status(200).json({
                success: true,
                message: 'Đã xóa giường bệnh thành công.'
            });
        } catch (error) {
            next(error);
        }
    }
}
