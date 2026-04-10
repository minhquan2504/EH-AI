import { Request, Response, NextFunction } from 'express';
import { ClassificationRuleService } from '../../services/Patient Management/classification-rule.service';
import { RULE_MESSAGES, RULE_PAGINATION } from '../../constants/classification-rule.constant';

export class ClassificationRuleController {

    /** Tạo mới Rule */
    static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await ClassificationRuleService.create(req.body);
            res.status(201).json({ success: true, message: RULE_MESSAGES.CREATE_SUCCESS, data });
        } catch (error) {
            next(error);
        }
    }

    /** Danh sách Rules */
    static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const page = parseInt(req.query.page as string, 10) || RULE_PAGINATION.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string, 10) || RULE_PAGINATION.DEFAULT_LIMIT;
            const isActive = req.query.is_active !== undefined
                ? req.query.is_active === 'true'
                : undefined;

            const result = await ClassificationRuleService.getAll(page, limit, isActive);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }

    /** Chi tiết Rule */
    static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const data = await ClassificationRuleService.getById(id);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /** Cập nhật Rule */
    static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            const data = await ClassificationRuleService.update(id, req.body);
            res.status(200).json({ success: true, message: RULE_MESSAGES.UPDATE_SUCCESS, data });
        } catch (error) {
            next(error);
        }
    }

    /** Xóa mềm Rule */
    static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params as { id: string };
            await ClassificationRuleService.delete(id);
            res.status(200).json({ success: true, message: RULE_MESSAGES.DELETE_SUCCESS });
        } catch (error) {
            next(error);
        }
    }
}
