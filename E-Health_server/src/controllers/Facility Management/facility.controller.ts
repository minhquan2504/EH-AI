import { Request, Response, NextFunction } from 'express';
import { FacilityService } from '../../services/Facility Management/facility.service';
import { CreateFacilityInput, UpdateFacilityInfoInput, FacilityQuery } from '../../models/Facility Management/facility.model';

export class FacilityController {
    /**
     * Get list of facilities for dropdown
     */
    static async getFacilitiesForDropdown(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const facilities = await FacilityService.getFacilitiesForDropdown();
            res.status(200).json({
                success: true,
                data: facilities
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Dành cho Admin: Lấy danh sách cơ sở y tế có phân trang
     */
    static async getFacilities(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const query: FacilityQuery = {
                search: req.query.search as string,
                status: req.query.status as string,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 10
            };
            const result = await FacilityService.getFacilities(query);
            res.status(200).json({
                success: true,
                data: result.facilities,
                pagination: {
                    page: query.page,
                    limit: query.limit,
                    total_records: result.total,
                    total_pages: Math.ceil(result.total / query.limit)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Dành cho Admin: Xem chi tiết 1 cơ sở y tế
     */
    static async getFacilityById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id as string;
            const facility = await FacilityService.getFacilityById(id);
            res.status(200).json({
                success: true,
                data: facility
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Dành cho Admin: Tạo mới cơ sở y tế (Hỗ trợ upload ảnh logo)
     */
    static async createFacility(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data: CreateFacilityInput = req.body;
            const file = req.file; // multer sẽ gán file vào đây
            const result = await FacilityService.createFacility(data, file);
            res.status(201).json({
                success: true,
                message: 'Tạo mới cơ sở y tế thành công',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Dành cho Admin: Cập nhật thông tin cơ sở
     */
    static async updateFacility(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id as string;
            const data: UpdateFacilityInfoInput = req.body;
            const file = req.file;
            const result = await FacilityService.updateFacility(id, data, file);
            res.status(200).json({
                success: true,
                message: 'Cập nhật cơ sở y tế thành công',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Dành cho Admin: Đổi trạng thái cơ sở
     */
    static async changeFacilityStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id as string;
            const { status } = req.body;
            await FacilityService.changeFacilityStatus(id, status);
            res.status(200).json({
                success: true,
                message: 'Cập nhật trạng thái cơ sở thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Dành cho Admin: Xóa mềm cơ sở
     */
    static async deleteFacility(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id as string;
            await FacilityService.deleteFacility(id);
            res.status(200).json({
                success: true,
                message: 'Xóa cơ sở y tế thành công'
            });
        } catch (error) {
            next(error);
        }
    }
}
