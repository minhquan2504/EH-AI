import { Request, Response, NextFunction } from 'express';
import { DrugService } from '../../services/Core/drug.service';
import { CreateDrugInput, UpdateDrugInput, ToggleDrugStatusInput } from '../../models/Core/drug.model';

export class DrugController {
    /**
     * Lấy danh sách thuốc (Dành cho Admin)
     */
    static async getDrugsAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const search = req.query.search as string | undefined;
            const categoryId = req.query.categoryId as string | undefined;

            let isActive: boolean | undefined = undefined;
            if (req.query.isActive !== undefined) {
                isActive = req.query.isActive === 'true';
            }

            let isPrescriptionOnly: boolean | undefined = undefined;
            if (req.query.isPrescriptionOnly !== undefined) {
                isPrescriptionOnly = req.query.isPrescriptionOnly === 'true';
            }

            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 20;

            const result = await DrugService.getDrugsAdmin(search, categoryId, isActive, isPrescriptionOnly, page, limit);

            res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy danh sách thuốc (Dành cho chức năng autocomplete của Bác sĩ)
     */
    static async getActiveDrugs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const search = req.query.search as string | undefined;
            const data = await DrugService.getActiveDrugs(search);

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy chi tiết 1 loại thuốc theo ID
     */
    static async getDrugById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const data = await DrugService.getDrugById(id);

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tạo mới thuốc
     */
    static async createDrug(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: CreateDrugInput = req.body;
            const data = await DrugService.createDrug(input);

            res.status(201).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật thông tin thuốc
     */
    static async updateDrug(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const input: UpdateDrugInput = req.body;

            const data = await DrugService.updateDrug(id, input);

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Vô hiệu hóa / Mở khóa thuốc
     */
    static async toggleDrugStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const { is_active }: ToggleDrugStatusInput = req.body;

            const data = await DrugService.toggleDrugStatus(id, is_active);

            res.status(200).json({
                success: true,
                message: is_active ? 'Đã mở khóa thuốc thành công.' : 'Đã vô hiệu hóa thuốc thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xuất danh sách thuốc ra file Excel
     */
    static async exportDrugs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const buffer = await DrugService.exportDrugs();

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=Pharmacy_Drugs.xlsx');

            res.status(200).send(buffer);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Nhập danh sách thuốc từ file Excel
     */
    static async importDrugs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    error_code: 'FILE_MISSING',
                    message: 'Vui lòng đính kèm file Excel.'
                });
                return;
            }

            const result = await DrugService.importDrugs(req.file.buffer);

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
