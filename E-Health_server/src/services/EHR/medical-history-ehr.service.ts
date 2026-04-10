import { MedicalHistoryEhrRepository } from '../../repository/EHR/medical-history-ehr.repository';
import {
    MedicalHistoryItem, CreateMedicalHistoryInput, UpdateMedicalHistoryInput, MedicalHistoryFilters,
    AllergyItem, CreateAllergyInput, UpdateAllergyInput, AllergyFilters,
    RiskFactorItem, CreateRiskFactorInput, UpdateRiskFactorInput,
    SpecialConditionItem, CreateSpecialConditionInput,
} from '../../models/EHR/medical-history-ehr.model';
import {
    HISTORY_TYPE, HISTORY_STATUS, FAMILY_RELATIONSHIP,
    ALLERGEN_TYPE, ALLERGY_SEVERITY,
    RISK_FACTOR_TYPE, RISK_SEVERITY,
    SPECIAL_CONDITION_TYPE,
    MH_EHR_ERRORS,
} from '../../constants/medical-history-ehr.constant';


export class MedicalHistoryEhrService {

    /** Validate bệnh nhân tồn tại */
    private static async validatePatient(patientId: string): Promise<void> {
        const exists = await MedicalHistoryEhrRepository.patientExists(patientId);
        if (!exists) throw new Error(MH_EHR_ERRORS.PATIENT_NOT_FOUND);
    }

    //  NHÓM A: TIỀN SỬ BỆNH 

    static async getHistories(patientId: string, filters: MedicalHistoryFilters): Promise<MedicalHistoryItem[]> {
        await this.validatePatient(patientId);
        return MedicalHistoryEhrRepository.getHistories(patientId, filters);
    }

    static async getHistoryById(patientId: string, historyId: string): Promise<MedicalHistoryItem> {
        await this.validatePatient(patientId);
        const item = await MedicalHistoryEhrRepository.getHistoryById(historyId);
        if (!item) throw new Error(MH_EHR_ERRORS.HISTORY_NOT_FOUND);
        if (item.patient_id !== patientId) throw new Error(MH_EHR_ERRORS.HISTORY_NOT_BELONG);
        return item;
    }

    static async createHistory(patientId: string, userId: string, input: CreateMedicalHistoryInput): Promise<MedicalHistoryItem> {
        await this.validatePatient(patientId);

        if (!input.condition_name?.trim()) throw new Error(MH_EHR_ERRORS.CONDITION_NAME_REQUIRED);

        const validTypes = Object.values(HISTORY_TYPE);
        if (!validTypes.includes(input.history_type as any)) throw new Error(MH_EHR_ERRORS.INVALID_HISTORY_TYPE);

        /** Bắt buộc relationship khi FAMILY */
        if (input.history_type === HISTORY_TYPE.FAMILY) {
            if (!input.relationship) throw new Error(MH_EHR_ERRORS.FAMILY_RELATIONSHIP_REQUIRED);
        }

        return MedicalHistoryEhrRepository.createHistory(patientId, userId, input);
    }

    static async updateHistory(patientId: string, historyId: string, input: UpdateMedicalHistoryInput): Promise<MedicalHistoryItem> {
        await this.validatePatient(patientId);
        const existing = await MedicalHistoryEhrRepository.getHistoryById(historyId);
        if (!existing) throw new Error(MH_EHR_ERRORS.HISTORY_NOT_FOUND);
        if (existing.patient_id !== patientId) throw new Error(MH_EHR_ERRORS.HISTORY_NOT_BELONG);

        if (input.status) {
            const validStatuses = Object.values(HISTORY_STATUS);
            if (!validStatuses.includes(input.status as any)) throw new Error(MH_EHR_ERRORS.INVALID_STATUS);
        }

        return MedicalHistoryEhrRepository.updateHistory(historyId, input);
    }

    static async updateHistoryStatus(patientId: string, historyId: string, status: string): Promise<MedicalHistoryItem> {
        await this.validatePatient(patientId);
        const existing = await MedicalHistoryEhrRepository.getHistoryById(historyId);
        if (!existing) throw new Error(MH_EHR_ERRORS.HISTORY_NOT_FOUND);
        if (existing.patient_id !== patientId) throw new Error(MH_EHR_ERRORS.HISTORY_NOT_BELONG);

        const validStatuses = Object.values(HISTORY_STATUS);
        if (!validStatuses.includes(status as any)) throw new Error(MH_EHR_ERRORS.INVALID_STATUS);

        return MedicalHistoryEhrRepository.updateHistoryStatus(historyId, status);
    }

    static async deleteHistory(patientId: string, historyId: string): Promise<void> {
        await this.validatePatient(patientId);
        const existing = await MedicalHistoryEhrRepository.getHistoryById(historyId);
        if (!existing) throw new Error(MH_EHR_ERRORS.HISTORY_NOT_FOUND);
        if (existing.patient_id !== patientId) throw new Error(MH_EHR_ERRORS.HISTORY_NOT_BELONG);
        await MedicalHistoryEhrRepository.deleteHistory(historyId);
    }

    //  NHÓM B: DỊ ỨNG 

    static async getAllergies(patientId: string, filters: AllergyFilters): Promise<AllergyItem[]> {
        await this.validatePatient(patientId);
        return MedicalHistoryEhrRepository.getAllergies(patientId, filters);
    }

    static async getAllergyById(patientId: string, allergyId: string): Promise<AllergyItem> {
        await this.validatePatient(patientId);
        const item = await MedicalHistoryEhrRepository.getAllergyById(allergyId);
        if (!item) throw new Error(MH_EHR_ERRORS.ALLERGY_NOT_FOUND);
        if (item.patient_id !== patientId) throw new Error(MH_EHR_ERRORS.ALLERGY_NOT_BELONG);
        return item;
    }

    static async createAllergy(patientId: string, userId: string, input: CreateAllergyInput): Promise<AllergyItem> {
        await this.validatePatient(patientId);

        if (!input.allergen_name?.trim()) throw new Error(MH_EHR_ERRORS.ALLERGEN_NAME_REQUIRED);

        const validTypes = Object.values(ALLERGEN_TYPE);
        if (input.allergen_type && !validTypes.includes(input.allergen_type as any)) {
            throw new Error(MH_EHR_ERRORS.INVALID_ALLERGEN_TYPE);
        }

        /** Kiểm tra trùng */
        const dup = await MedicalHistoryEhrRepository.allergyExists(patientId, input.allergen_name);
        if (dup) throw new Error(MH_EHR_ERRORS.ALLERGY_DUPLICATE);

        return MedicalHistoryEhrRepository.createAllergy(patientId, userId, input);
    }

    static async updateAllergy(patientId: string, allergyId: string, input: UpdateAllergyInput): Promise<AllergyItem> {
        await this.validatePatient(patientId);
        const existing = await MedicalHistoryEhrRepository.getAllergyById(allergyId);
        if (!existing) throw new Error(MH_EHR_ERRORS.ALLERGY_NOT_FOUND);
        if (existing.patient_id !== patientId) throw new Error(MH_EHR_ERRORS.ALLERGY_NOT_BELONG);
        return MedicalHistoryEhrRepository.updateAllergy(allergyId, input);
    }

    static async deleteAllergy(patientId: string, allergyId: string): Promise<void> {
        await this.validatePatient(patientId);
        const existing = await MedicalHistoryEhrRepository.getAllergyById(allergyId);
        if (!existing) throw new Error(MH_EHR_ERRORS.ALLERGY_NOT_FOUND);
        if (existing.patient_id !== patientId) throw new Error(MH_EHR_ERRORS.ALLERGY_NOT_BELONG);
        await MedicalHistoryEhrRepository.deleteAllergy(allergyId);
    }

    //  NHÓM C: YẾU TỐ NGUY CƠ 

    static async getRiskFactors(patientId: string): Promise<RiskFactorItem[]> {
        await this.validatePatient(patientId);
        return MedicalHistoryEhrRepository.getRiskFactors(patientId);
    }

    static async createRiskFactor(patientId: string, userId: string, input: CreateRiskFactorInput): Promise<RiskFactorItem> {
        await this.validatePatient(patientId);

        if (!input.details?.trim()) throw new Error(MH_EHR_ERRORS.DETAILS_REQUIRED);

        const validTypes = Object.values(RISK_FACTOR_TYPE);
        if (!validTypes.includes(input.factor_type as any)) throw new Error(MH_EHR_ERRORS.INVALID_RISK_TYPE);

        return MedicalHistoryEhrRepository.createRiskFactor(patientId, userId, input);
    }

    static async updateRiskFactor(patientId: string, factorId: string, input: UpdateRiskFactorInput): Promise<RiskFactorItem> {
        await this.validatePatient(patientId);
        const existing = await MedicalHistoryEhrRepository.getRiskFactorById(factorId);
        if (!existing) throw new Error(MH_EHR_ERRORS.RISK_NOT_FOUND);
        if (existing.patient_id !== patientId) throw new Error(MH_EHR_ERRORS.RISK_NOT_BELONG);
        return MedicalHistoryEhrRepository.updateRiskFactor(factorId, input);
    }

    static async deleteRiskFactor(patientId: string, factorId: string): Promise<void> {
        await this.validatePatient(patientId);
        const existing = await MedicalHistoryEhrRepository.getRiskFactorById(factorId);
        if (!existing) throw new Error(MH_EHR_ERRORS.RISK_NOT_FOUND);
        if (existing.patient_id !== patientId) throw new Error(MH_EHR_ERRORS.RISK_NOT_BELONG);
        await MedicalHistoryEhrRepository.deleteRiskFactor(factorId);
    }

    //  NHÓM D: TÌNH TRẠNG ĐẶC BIỆT 

    static async getSpecialConditions(patientId: string): Promise<SpecialConditionItem[]> {
        await this.validatePatient(patientId);
        return MedicalHistoryEhrRepository.getSpecialConditions(patientId);
    }

    static async createSpecialCondition(patientId: string, userId: string, input: CreateSpecialConditionInput): Promise<SpecialConditionItem> {
        await this.validatePatient(patientId);

        if (!input.description?.trim()) throw new Error(MH_EHR_ERRORS.DESCRIPTION_REQUIRED);

        const validTypes = Object.values(SPECIAL_CONDITION_TYPE);
        if (!validTypes.includes(input.condition_type as any)) throw new Error(MH_EHR_ERRORS.INVALID_SPECIAL_TYPE);

        return MedicalHistoryEhrRepository.createSpecialCondition(patientId, userId, input);
    }

    static async deleteSpecialCondition(patientId: string, conditionId: string): Promise<void> {
        await this.validatePatient(patientId);
        const existing = await MedicalHistoryEhrRepository.getSpecialConditionById(conditionId);
        if (!existing) throw new Error(MH_EHR_ERRORS.SPECIAL_NOT_FOUND);
        if (existing.patient_id !== patientId) throw new Error(MH_EHR_ERRORS.SPECIAL_NOT_BELONG);
        await MedicalHistoryEhrRepository.deleteSpecialCondition(conditionId);
    }
}
