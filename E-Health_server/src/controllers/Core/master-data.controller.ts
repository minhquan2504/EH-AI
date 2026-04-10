import { Request, Response, NextFunction } from 'express';
import { MasterDataService } from '../../services/Core/master-data.service';
import { CreateCategoryInput, UpdateCategoryInput } from '../../models/Core/master-data.model';

export class MasterDataController {
    /**
     * Lấy danh sách nhóm danh mục nền
     */
    static async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const search = req.query.search as string | undefined;
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 20;

            const result = await MasterDataService.getCategories(search, page, limit);

            res.status(200).json({
                success: true,
                ...result // Trải phẳng data, total, page, limit, totalPages ra ngoài
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy chi tiết 1 nhóm danh mục theo ID
     */
    static async getCategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const data = await MasterDataService.getCategoryById(id);

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tạo mới một nhóm danh mục
     */
    static async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: CreateCategoryInput = req.body;
            const data = await MasterDataService.createCategory(input);

            res.status(201).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật thông tin nhóm danh mục (Partial Update)
     */
    static async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const input: UpdateCategoryInput = req.body;

            const data = await MasterDataService.updateCategory(id, input);

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa mềm nhóm danh mục
     */
    static async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            await MasterDataService.deleteCategory(id);

            res.status(200).json({
                success: true,
                message: 'Đã xóa nhóm danh mục thành công.'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xuất danh sách nhóm danh mục ra file Excel
     */
    static async exportCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const buffer = await MasterDataService.exportCategories();

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=MasterData_Categories.xlsx');

            res.status(200).send(buffer);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Nhập danh sách nhóm danh mục từ file Excel
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

            const result = await MasterDataService.importCategories(req.file.buffer);

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