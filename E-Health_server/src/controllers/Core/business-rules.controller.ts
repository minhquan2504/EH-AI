import { Request, Response, NextFunction } from 'express';
import { BusinessRulesService } from '../../services/Core/business-rules.service';
import { UpdateBusinessRuleInput, BulkUpdateBusinessRulesInput } from '../../models/Core/system-settings.model';
import { AuthenticatedRequest } from '../../middleware/authorizeRoles.middleware';

export class BusinessRulesController {
    /**
     * Lấy tất cả business rules, nhóm theo module
     */
    static async getAllBusinessRules(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const module = req.query.module as string | undefined;
            const data = await BusinessRulesService.getAllBusinessRules(module);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy 1 business rule theo :ruleKey
     */
    static async getBusinessRuleByKey(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { ruleKey } = req.params;
            const data = await BusinessRulesService.getBusinessRuleByKey(String(ruleKey));
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật 1 business rule theo :ruleKey (Admin only)
     */
    static async updateBusinessRule(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { ruleKey } = req.params;
            const input: UpdateBusinessRuleInput = req.body;
            const updatedBy = req.auth?.user_id ?? 'SYSTEM';
            const data = await BusinessRulesService.updateBusinessRule(String(ruleKey), input, updatedBy);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật nhiều business rules cùng lúc (Admin only)
     */
    static async bulkUpdateBusinessRules(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const input: BulkUpdateBusinessRulesInput = req.body;
            const updatedBy = req.auth?.user_id ?? 'SYSTEM';
            const data = await BusinessRulesService.bulkUpdateBusinessRules(input, updatedBy);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }
}
