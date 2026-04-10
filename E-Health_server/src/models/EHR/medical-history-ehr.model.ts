//  TIỀN SỬ BỆNH 

export interface MedicalHistoryItem {
    patient_medical_histories_id: string;
    patient_id: string;
    condition_code: string | null;
    condition_name: string;
    history_type: string;
    relationship: string | null;
    diagnosis_date: string | null;
    status: string;
    notes: string | null;
    reported_by: string | null;
    reported_by_name: string | null;
    created_at: string;
    updated_at: string | null;
}

export interface CreateMedicalHistoryInput {
    condition_code?: string;
    condition_name: string;
    history_type: string;
    relationship?: string;
    diagnosis_date?: string;
    status?: string;
    notes?: string;
}

export interface UpdateMedicalHistoryInput {
    condition_code?: string;
    condition_name?: string;
    relationship?: string;
    diagnosis_date?: string;
    status?: string;
    notes?: string;
}

//  DỊ ỨNG 

export interface AllergyItem {
    patient_allergies_id: string;
    patient_id: string;
    allergen_type: string | null;
    allergen_name: string;
    reaction: string | null;
    severity: string | null;
    notes: string | null;
    reported_by: string | null;
    reported_by_name: string | null;
    created_at: string;
    updated_at: string | null;
}

export interface CreateAllergyInput {
    allergen_type: string;
    allergen_name: string;
    reaction?: string;
    severity?: string;
    notes?: string;
}

export interface UpdateAllergyInput {
    allergen_type?: string;
    allergen_name?: string;
    reaction?: string;
    severity?: string;
    notes?: string;
}

//  YẾU TỐ NGUY CƠ 

export interface RiskFactorItem {
    risk_factor_id: string;
    patient_id: string;
    factor_type: string;
    severity: string;
    details: string;
    start_date: string | null;
    end_date: string | null;
    is_active: boolean;
    recorded_by: string | null;
    recorded_by_name: string | null;
    created_at: string;
    updated_at: string | null;
}

export interface CreateRiskFactorInput {
    factor_type: string;
    severity?: string;
    details: string;
    start_date?: string;
    end_date?: string;
    is_active?: boolean;
}

export interface UpdateRiskFactorInput {
    factor_type?: string;
    severity?: string;
    details?: string;
    start_date?: string;
    end_date?: string;
    is_active?: boolean;
}

//  TÌNH TRẠNG ĐẶC BIỆT 

export interface SpecialConditionItem {
    special_condition_id: string;
    patient_id: string;
    condition_type: string;
    description: string;
    start_date: string | null;
    end_date: string | null;
    is_active: boolean;
    recorded_by: string | null;
    recorded_by_name: string | null;
    created_at: string;
    updated_at: string | null;
}

export interface CreateSpecialConditionInput {
    condition_type: string;
    description: string;
    start_date?: string;
    end_date?: string;
    is_active?: boolean;
}

//  FILTER 

export interface MedicalHistoryFilters {
    history_type?: string;
    status?: string;
    keyword?: string;
}

export interface AllergyFilters {
    allergen_type?: string;
    severity?: string;
}
