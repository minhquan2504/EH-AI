import { Request, Response, NextFunction } from 'express';
import { DrugCategoryService } from '../../services/Core/drug-category.service';
import { CreateDrugCategoryInput, UpdateDrugCategoryInput } from '../../models/Core/drug-category.model';

export class DrugCategoryController {
    /**
     * Lấy danh sách nhóm thuốc
     */
    static async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const search = req.query.search as string | undefined;
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 20;

            const result = await DrugCategoryService.getCategories(search, page, limit);

            res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy chi tiết 1 nhóm thuốc theo ID
     */
    static async getCategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const data = await DrugCategoryService.getCategoryById(id);

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tạo mới một nhóm thuốc
     */
    static async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: CreateDrugCategoryInput = req.body;
            const data = await DrugCategoryService.createCategory(input);

            res.status(201).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật thông tin nhóm thuốc
     */
    static async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const input: UpdateDrugCategoryInput = req.body;

            const data = await DrugCategoryService.updateCategory(id, input);

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa nhóm thuốc
     */
    static async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            await DrugCategoryService.deleteCategory(id);

            res.status(200).json({
                success: true,
                message: 'Đã xóa nhóm danh mục thuốc thành công.'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xuất danh sách nhóm thuốc ra file Excel
     */
    static async exportCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const buffer = await DrugCategoryService.exportCategories();

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=Pharmacy_DrugCategories.xlsx');

            res.status(200).send(buffer);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Nhập danh sách nhóm thuốc từ file Excel
     */
    static async importCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    error_code: 'FILE_MISSING',
                    message: 'Vui lòng đính kèm file Excel.'
                });
                return;
            }

            const result = await DrugCategoryService.importCategories(req.file.buffer);

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
