import { Request, Response, NextFunction } from 'express';
import { FacilityServiceLogic } from '../../services/Facility Management/facility-service.service';
import { CreateFacilityServiceInput, UpdateFacilityServiceInput } from '../../models/Facility Management/facility-service.model';

export class FacilityServiceController {
    /**
     * Lấy danh sách dịch vụ tại cơ sở (Dành cho Admin/Manager)
     */
    static async getFacilityServices(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const facilityId = String(req.params.facilityId);
            const departmentId = req.query.departmentId ? String(req.query.departmentId) : undefined;
            const search = req.query.search ? String(req.query.search) : undefined;


            let isActive: boolean | undefined = undefined;
            if (req.query.isActive !== undefined) {
                isActive = req.query.isActive === 'true';
            }

            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 20;

            const result = await FacilityServiceLogic.getFacilityServices(facilityId, departmentId, search, isActive, page, limit);

            res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy danh sách dịch vụ ĐANG HOẠT ĐỘNG (Cho Dropdown kê dịch vụ của bác sĩ, kèm filter tên)
     */
    static async getActiveFacilityServices(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const facilityId = String(req.params.facilityId);
            const departmentId = req.query.departmentId ? String(req.query.departmentId) : undefined;
            const search = req.query.search ? String(req.query.search) : undefined;

            const data = await FacilityServiceLogic.getActiveFacilityServices(facilityId, departmentId, search);

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy chi tiết 1 cấu hình dịch vụ cơ sở
     */
    static async getFacilityServiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const data = await FacilityServiceLogic.getFacilityServiceById(id);

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Bật dịch vụ chuẩn thành dịch vụ cơ sở
     */
    static async createFacilityService(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const facilityId = req.params.facilityId;
            const input: CreateFacilityServiceInput = {
                ...req.body,
                facility_id: facilityId
            };

            const data = await FacilityServiceLogic.createFacilityService(input);

            res.status(201).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật thông tin giá, thời gian... của dịch vụ tại cơ sở
     */
    static async updateFacilityService(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const input: UpdateFacilityServiceInput = req.body;

            const data = await FacilityServiceLogic.updateFacilityService(id, input);

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Bật / Tắt dịch vụ (Ngưng cung cấp tại cơ sở)
     */
    static async toggleFacilityServiceStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const is_active = req.body.is_active === true;

            const data = await FacilityServiceLogic.toggleFacilityServiceStatus(id, is_active);

            res.status(200).json({
                success: true,
                message: is_active ? 'Đã bật lại dịch vụ thành công.' : 'Đã ngưng cung cấp dịch vụ thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xuất danh sách dịch vụ cơ sở ra file Excel
     */
    static async exportFacilityServices(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const facilityId = String(req.params.facilityId);
            const buffer = await FacilityServiceLogic.exportFacilityServices(facilityId);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=FacilityServices_${facilityId}.xlsx`);

            res.status(200).send(buffer);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Nhập danh sách dịch vụ cơ sở từ file Excel
     */
    static async importFacilityServices(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const facilityId = String(req.params.facilityId);

            if (!req.file) {
                res.status(400).json({
                    success: false,
                    error_code: 'FILE_MISSING',
                    message: 'Vui lòng đính kèm file Excel.'
                });
                return;
            }

            const result = await FacilityServiceLogic.importFacilityServices(facilityId, req.file.buffer);

            res.status(200).json({
                success: true,
                message: 'Đã xử lý file Excel thành công.',
                ...result
            });
        } catch (error) {
            next(error);
        }
    }
}
