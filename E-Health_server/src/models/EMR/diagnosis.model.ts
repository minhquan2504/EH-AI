
/** Chẩn đoán y khoa đầy đủ */
export interface DiagnosisRecord {
    encounter_diagnoses_id: string;
    encounter_id: string;
    icd10_code: string;
    diagnosis_name: string;
    diagnosis_type: string;
    notes: string | null;
    diagnosed_by: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;

    diagnosed_by_name?: string;
    patient_id?: string;
    patient_name?: string;
    doctor_name?: string;
    encounter_type?: string;
    encounter_start_time?: string;
}

/** Tạo chẩn đoán mới */
export interface CreateDiagnosisInput {
    icd10_code: string;
    diagnosis_name: string;
    diagnosis_type?: string;
    notes?: string;
}

/** Cập nhật chẩn đoán */
export interface UpdateDiagnosisInput {
    icd10_code?: string;
    diagnosis_name?: string;
    notes?: string;
}

/** Mã ICD-10 (kết quả tìm kiếm) */
export interface ICDSearchResult {
    code: string;
    name: string;
}

/** Kết luận khám */
export interface EncounterConclusion {
    encounter_id: string;
    conclusion: string | null;
    doctor_name?: string;
    updated_at?: string;
}
