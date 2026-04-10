import { SystemSettingsRepository } from '../../repository/Core/system-settings.repository';
import { BusinessRule, BusinessRulesGrouped, UpdateBusinessRuleInput, BulkUpdateBusinessRulesInput, } from '../../models/Core/system-settings.model';
import { BUSINESS_RULE_SCHEMAS, BUSINESS_RULE_ERRORS, } from '../../constants/system.constant';

export class BusinessRulesService {
    /**
     * Lấy tất cả business rules, nhóm theo module.
     */
    static async getAllBusinessRules(module?: string): Promise<BusinessRulesGrouped[]> {
        const rules = await SystemSettingsRepository.getAllBusinessRules(module);

        // Nhóm theo module ở tầng Service (không dùng GROUP BY SQL)
        const grouped = rules.reduce((acc, rule) => {
            if (!acc[rule.module]) acc[rule.module] = [];
            acc[rule.module].push(rule);
            return acc;
        }, {} as Record<string, BusinessRule[]>);

        return Object.entries(grouped).map(([mod, items]) => ({
            module: mod,
            rules: items,
        }));
    }

    /**
     * Lấy 1 business rule theo key. Ném 404 nếu không tìm thấy.
     */
    static async getBusinessRuleByKey(key: string): Promise<BusinessRule> {
        const rule = await SystemSettingsRepository.getBusinessRuleByKey(key);
        if (!rule) throw BUSINESS_RULE_ERRORS.RULE_NOT_FOUND;
        return rule;
    }

    /**
     * Validate type + range rồi upsert 1 business rule.
     */
    static async updateBusinessRule(
        key: string,
        input: UpdateBusinessRuleInput,
        updatedBy: string,
    ): Promise<BusinessRule> {
        BusinessRulesService.validateRuleValue(key, input.value);

        return await SystemSettingsRepository.upsertBusinessRule(key, input.value, updatedBy);
    }

    /**
     * Validate toàn bộ rồi bulk upsert trong transaction.
     */
    static async bulkUpdateBusinessRules(
        input: BulkUpdateBusinessRulesInput,
        updatedBy: string,
    ): Promise<BusinessRule[]> {
        // Validate trước khi chạm DB
        for (const item of input.rules) {
            BusinessRulesService.validateRuleValue(item.key, item.value);
        }

        return await SystemSettingsRepository.bulkUpsertBusinessRules(input.rules, updatedBy);
    }

    /**
     * Validate type và range cho 1 rule value theo BUSINESS_RULE_SCHEMAS.
     */
    private static validateRuleValue(key: string, value: number | boolean): void {
        const schema = BUSINESS_RULE_SCHEMAS[key];
        if (!schema) throw BUSINESS_RULE_ERRORS.INVALID_RULE_KEY;

        if (schema.type === 'boolean' && typeof value !== 'boolean') {
            throw BUSINESS_RULE_ERRORS.INVALID_RULE_VALUE;
        }

        if (schema.type === 'number') {
            if (typeof value !== 'number' || !Number.isInteger(value)) {
                throw BUSINESS_RULE_ERRORS.INVALID_RULE_VALUE;
            }
            if (schema.min !== undefined && value < schema.min) {
                throw BUSINESS_RULE_ERRORS.INVALID_RULE_VALUE;
            }
            if (schema.max !== undefined && value > schema.max) {
                throw BUSINESS_RULE_ERRORS.INVALID_RULE_VALUE;
            }
        }
    }
}
