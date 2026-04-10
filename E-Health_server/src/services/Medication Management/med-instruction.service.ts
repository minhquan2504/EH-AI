import { MedInstructionRepository } from '../../repository/Medication Management/med-instruction.repository';
import { CreateTemplateInput, UpdateTemplateInput, UpsertDrugDefaultInput } from '../../models/Medication Management/med-instruction.model';
import { MED_INSTRUCTION_ERRORS, VALID_TEMPLATE_TYPES } from '../../constants/med-instruction.constant';

const HTTP_STATUS = { BAD_REQUEST: 400, NOT_FOUND: 404, CONFLICT: 409 };

class AppError extends Error {
    constructor(public httpCode: number, public code: string, message: string) {
        super(message);
    }
}


export class MedInstructionService {

    // ========== TEMPLATES ==========

    static async getTemplates(type?: string, search?: string) {
        if (type && !VALID_TEMPLATE_TYPES.includes(type as any)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_TYPE', MED_INSTRUCTION_ERRORS.INVALID_TYPE);
        }
        return MedInstructionRepository.findTemplates(type, search);
    }

    static async createTemplate(input: CreateTemplateInput) {
        if (!input.type || !input.label || !input.value) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_REQUIRED', MED_INSTRUCTION_ERRORS.MISSING_REQUIRED);
        }
        if (!VALID_TEMPLATE_TYPES.includes(input.type as any)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_TYPE', MED_INSTRUCTION_ERRORS.INVALID_TYPE);
        }

        const exists = await MedInstructionRepository.templateValueExists(input.type, input.value);
        if (exists) throw new AppError(HTTP_STATUS.CONFLICT, 'DUPLICATE', MED_INSTRUCTION_ERRORS.DUPLICATE_VALUE);

        const id = MedInstructionRepository.generateTemplateId();
        return MedInstructionRepository.createTemplate(id, input);
    }

    static async updateTemplate(id: string, input: UpdateTemplateInput) {
        const existing = await MedInstructionRepository.findTemplateById(id);
        if (!existing) throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', MED_INSTRUCTION_ERRORS.TEMPLATE_NOT_FOUND);

        const hasFields = Object.values(input).some(v => v !== undefined);
        if (!hasFields) throw new AppError(HTTP_STATUS.BAD_REQUEST, 'NO_FIELDS', MED_INSTRUCTION_ERRORS.NO_FIELDS_TO_UPDATE);

        if (input.value) {
            const dup = await MedInstructionRepository.templateValueExists(existing.type, input.value, id);
            if (dup) throw new AppError(HTTP_STATUS.CONFLICT, 'DUPLICATE', MED_INSTRUCTION_ERRORS.DUPLICATE_VALUE);
        }

        return MedInstructionRepository.updateTemplate(id, input);
    }

    static async deleteTemplate(id: string) {
        const existing = await MedInstructionRepository.findTemplateById(id);
        if (!existing) throw new AppError(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', MED_INSTRUCTION_ERRORS.TEMPLATE_NOT_FOUND);
        await MedInstructionRepository.deleteTemplate(id);
    }

    // ========== DRUG DEFAULTS ==========

    static async getDrugDefault(drugId: string) {
        const drugOk = await MedInstructionRepository.drugActive(drugId);
        if (!drugOk) throw new AppError(HTTP_STATUS.NOT_FOUND, 'DRUG_NOT_FOUND', MED_INSTRUCTION_ERRORS.DRUG_NOT_FOUND);

        const result = await MedInstructionRepository.findDefaultByDrug(drugId);
        if (!result) throw new AppError(HTTP_STATUS.NOT_FOUND, 'DEFAULT_NOT_FOUND', MED_INSTRUCTION_ERRORS.DEFAULT_NOT_FOUND);
        return result;
    }

    static async upsertDrugDefault(drugId: string, input: UpsertDrugDefaultInput) {
        const drugOk = await MedInstructionRepository.drugActive(drugId);
        if (!drugOk) throw new AppError(HTTP_STATUS.NOT_FOUND, 'DRUG_NOT_FOUND', MED_INSTRUCTION_ERRORS.DRUG_NOT_FOUND);

        const hasFields = Object.values(input).some(v => v !== undefined && v !== null && v !== '');
        if (!hasFields) throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_FIELDS', MED_INSTRUCTION_ERRORS.MISSING_DRUG_FIELDS);

        const id = MedInstructionRepository.generateDefaultId();
        return MedInstructionRepository.upsertDefault(id, drugId, input);
    }

    static async deleteDrugDefault(drugId: string) {
        const existing = await MedInstructionRepository.findDefaultByDrug(drugId);
        if (!existing) throw new AppError(HTTP_STATUS.NOT_FOUND, 'DEFAULT_NOT_FOUND', MED_INSTRUCTION_ERRORS.DEFAULT_NOT_FOUND);
        await MedInstructionRepository.deleteDefault(drugId);
    }

    static async getAllDefaults(search?: string) {
        return MedInstructionRepository.findAllDefaults(search);
    }
}
