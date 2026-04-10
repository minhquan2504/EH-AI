import { randomUUID } from 'crypto';
import { ClassificationRuleRepository } from '../../repository/Patient Management/classification-rule.repository';
import {
    ClassificationRule,
    CreateRuleInput,
    UpdateRuleInput,
    PaginatedRules
} from '../../models/Patient Management/classification-rule.model';
import {
    RULE_ID_PREFIX,
    VALID_CRITERIA_TYPES,
    VALID_CRITERIA_OPERATORS,
    RULE_ERRORS
} from '../../constants/classification-rule.constant';

export class ClassificationRuleService {

    /**
     * Tạo mới luật phân loại. Validate type, operator, tag đích.
     */
    static async create(input: CreateRuleInput): Promise<ClassificationRule> {
        if (!input.name || !input.criteria_type || !input.criteria_operator || !input.criteria_value || !input.target_tag_id) {
            throw RULE_ERRORS.MISSING_REQUIRED_FIELDS;
        }

        if (!(VALID_CRITERIA_TYPES as readonly string[]).includes(input.criteria_type)) {
            throw RULE_ERRORS.INVALID_CRITERIA_TYPE;
        }

        if (!(VALID_CRITERIA_OPERATORS as readonly string[]).includes(input.criteria_operator)) {
            throw RULE_ERRORS.INVALID_OPERATOR;
        }

        const tagExists = await ClassificationRuleRepository.checkTagExists(input.target_tag_id);
        if (!tagExists) {
            throw RULE_ERRORS.TARGET_TAG_NOT_FOUND;
        }

        const newId = this.generateRuleId();
        return await ClassificationRuleRepository.create(newId, input);
    }

    /**
     * Danh sách Rules có phân trang
     */
    static async getAll(page: number, limit: number, isActive?: boolean): Promise<PaginatedRules> {
        return await ClassificationRuleRepository.getAll(page, limit, isActive);
    }

    /**
     * Chi tiết 1 Rule
     */
    static async getById(id: string): Promise<ClassificationRule> {
        const rule = await ClassificationRuleRepository.getById(id);
        if (!rule) {
            throw RULE_ERRORS.NOT_FOUND;
        }
        return rule;
    }

    /**
     * Cập nhật Rule (validate lại type/operator/tag nếu thay đổi)
     */
    static async update(id: string, input: UpdateRuleInput): Promise<ClassificationRule> {
        const existing = await ClassificationRuleRepository.getById(id);
        if (!existing) {
            throw RULE_ERRORS.NOT_FOUND;
        }

        if (input.criteria_type && !(VALID_CRITERIA_TYPES as readonly string[]).includes(input.criteria_type)) {
            throw RULE_ERRORS.INVALID_CRITERIA_TYPE;
        }

        if (input.criteria_operator && !(VALID_CRITERIA_OPERATORS as readonly string[]).includes(input.criteria_operator)) {
            throw RULE_ERRORS.INVALID_OPERATOR;
        }

        if (input.target_tag_id) {
            const tagExists = await ClassificationRuleRepository.checkTagExists(input.target_tag_id);
            if (!tagExists) {
                throw RULE_ERRORS.TARGET_TAG_NOT_FOUND;
            }
        }

        return await ClassificationRuleRepository.update(id, input);
    }

    /**
     * Xóa mềm Rule
     */
    static async delete(id: string): Promise<void> {
        const existing = await ClassificationRuleRepository.getById(id);
        if (!existing) {
            throw RULE_ERRORS.NOT_FOUND;
        }
        await ClassificationRuleRepository.softDelete(id);
    }

    /** Sinh ID Rule: RUL_YYMMDD_8charUUID */
    private static generateRuleId(): string {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        return `${RULE_ID_PREFIX}_${yy}${mm}${dd}_${randomUUID().substring(0, 8)}`;
    }
}
