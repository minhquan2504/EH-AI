import { Request, Response, NextFunction } from 'express';
import { BranchService } from '../../services/Facility Management/branch.service';
import { CreateBranchInput, UpdateBranchInput, BranchQuery } from '../../models/Facility Management/branch.model';

export class BranchController {
    /**
     * Get list of branches for dropdown (ACTIVE only)
     */
    static async getBranchesForDropdown(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const branches = await BranchService.getBranchesForDropdown();
            res.status(200).json({
                success: true,
                data: branches
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Dành cho Admin: Lấy danh sách chi nhánh phân trang bộ lọc
     */
    static async getBranches(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const query: BranchQuery = {
                search: req.query.search as string,
                facility_id: req.query.facility_id as string,
                status: req.query.status as string,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 10
            };
            const result = await BranchService.getBranches(query);
            res.status(200).json({
                success: true,
                data: result.branches,
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
     * Xem chi tiết 1 chi nhánh
     */
    static async getBranchById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id as string;
            const branch = await BranchService.getBranchById(id);
            res.status(200).json({
                success: true,
                data: branch
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tạo chi nhánh mới
     */
    static async createBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data: CreateBranchInput = req.body;
            const result = await BranchService.createBranch(data);
            res.status(201).json({
                success: true,
                message: 'Tạo mới chi nhánh thành công',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật thông tin chi nhánh
     */
    static async updateBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id as string;
            const data: UpdateBranchInput = req.body;
            const result = await BranchService.updateBranch(id, data);
            res.status(200).json({
                success: true,
                message: 'Cập nhật chi nhánh thành công',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Đổi trạng thái chi nhánh
     */
    static async changeBranchStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id as string;
            const { status } = req.body;
            await BranchService.changeBranchStatus(id, status);
            res.status(200).json({
                success: true,
                message: 'Cập nhật trạng thái chi nhánh thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa mềm chi nhánh
     */
    static async deleteBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id as string;
            await BranchService.deleteBranch(id);
            res.status(200).json({
                success: true,
                message: 'Xóa chi nhánh y tế thành công'
            });
        } catch (error) {
            next(error);
        }
    }
}
