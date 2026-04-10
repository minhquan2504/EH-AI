
/** Mẫu hướng dẫn */
export interface InstructionTemplate {
    template_id: string;
    type: string;
    label: string;
    value: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateTemplateInput {
    type: string;
    label: string;
    value: string;
    sort_order?: number;
}

export interface UpdateTemplateInput {
    label?: string;
    value?: string;
    sort_order?: number;
    is_active?: boolean;
}

/** Hướng dẫn mặc định theo thuốc */
export interface DrugDefaultInstruction {
    default_instruction_id: string;
    drug_id: string;
    default_dosage?: string;
    default_frequency?: string;
    default_duration_days?: number;
    default_route?: string;
    default_instruction?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    /** JOIN */
    drug_code?: string;
    brand_name?: string;
    dispensing_unit?: string;
}

export interface UpsertDrugDefaultInput {
    default_dosage?: string;
    default_frequency?: string;
    default_duration_days?: number;
    default_route?: string;
    default_instruction?: string;
    notes?: string;
}
