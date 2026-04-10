import { Request, Response, NextFunction } from 'express';
import { MasterServiceLogic } from '../../services/Facility Management/service.service';
import { CreateServiceInput, UpdateServiceInput } from '../../models/Facility Management/service.model';

export class MasterServiceController {
    /**
     * Lấy danh sách dịch vụ chuẩn (Dành cho Admin)
     */
    static async getServices(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const search = req.query.search as string | undefined;
            const serviceGroup = req.query.serviceGroup as string | undefined;

            let isActive: boolean | undefined = undefined;
            if (req.query.isActive !== undefined) {
                isActive = req.query.isActive === 'true';
            }

            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 20;

            const result = await MasterServiceLogic.getServices(search, serviceGroup, isActive, page, limit);

            res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy chi tiết 1 dịch vụ chuẩn theo ID
     */
    static async getServiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const data = await MasterServiceLogic.getServiceById(id);

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tạo mới dịch vụ chuẩn
     */
    static async createService(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: CreateServiceInput = req.body;
            const data = await MasterServiceLogic.createService(input);

            res.status(201).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật thông tin dịch vụ chuẩn
     */
    static async updateService(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const input: UpdateServiceInput = req.body;

            const data = await MasterServiceLogic.updateService(id, input);

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Vô hiệu hóa / Mở khóa dịch vụ chuẩn
     */
    static async toggleServiceStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const is_active = req.body.is_active === true;

            const data = await MasterServiceLogic.toggleServiceStatus(id, is_active);

            res.status(200).json({
                success: true,
                message: is_active ? 'Đã mở khóa dịch vụ thành công.' : 'Đã vô hiệu hóa dịch vụ thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa mềm dịch vụ chuẩn
     */
    static async deleteService(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };

            await MasterServiceLogic.deleteService(id);

            res.status(200).json({
                success: true,
                message: 'Đã xóa dịch vụ thành công.'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xuất danh sách dịch vụ chuẩn ra file Excel
     */
    static async exportServices(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const buffer = await MasterServiceLogic.exportServices();

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=MasterServices.xlsx');

            res.status(200).send(buffer);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Nhập danh sách dịch vụ chuẩn từ file Excel
     */
    static async importServices(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    error_code: 'FILE_MISSING',
                    message: 'Vui lòng đính kèm file Excel.'
                });
                return;
            }

            const result = await MasterServiceLogic.importServices(req.file.buffer);

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
