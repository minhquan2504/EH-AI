import { Request, Response, NextFunction } from 'express';
import { RelationTypeService } from '../../services/Patient Management/relation-type.service';
import {
    CreateRelationTypeInput,
    UpdateRelationTypeInput
} from '../../models/Patient Management/relation-type.model';

export class RelationTypeController {
    /**
     * Lấy danh sách tất cả loại quan hệ
     */
    static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await RelationTypeService.getAll();
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tạo mới loại quan hệ
     */
    static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: CreateRelationTypeInput = req.body;
            const data = await RelationTypeService.create(input);
            res.status(201).json({
                success: true,
                message: 'Tạo loại quan hệ thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật loại quan hệ
     */
    static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const input: UpdateRelationTypeInput = req.body;
            const data = await RelationTypeService.update(id, input);
            res.status(200).json({
                success: true,
                message: 'Cập nhật loại quan hệ thành công.',
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa loại quan hệ (soft delete)
     */
    static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            await RelationTypeService.delete(id);
            res.status(200).json({
                success: true,
                message: 'Đã xóa loại quan hệ thành công.'
            });
        } catch (error) {
            next(error);
        }
    }
}
