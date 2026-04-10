
/** Phiếu khám lâm sàng đầy đủ */
export interface ClinicalExamination {
    clinical_examinations_id: string;
    encounter_id: string;
    status: string;

    /** Sinh hiệu (Vital Signs) */
    pulse: number | null;
    blood_pressure_systolic: number | null;
    blood_pressure_diastolic: number | null;
    temperature: number | null;
    respiratory_rate: number | null;
    spo2: number | null;
    weight: number | null;
    height: number | null;
    bmi: number | null;
    blood_glucose: number | null;

    /** Khám lâm sàng */
    chief_complaint: string | null;
    physical_examination: string | null;
    medical_history_notes: string | null;
    relevant_history: string | null;
    clinical_notes: string | null;
    severity_level: string | null;

    recorded_by: string | null;
    created_at: string;
    updated_at: string;

    /** JOIN fields */
    recorder_name?: string;
    patient_id?: string;
    patient_name?: string;
    doctor_name?: string;
    encounter_type?: string;
    encounter_start_time?: string;
}

/** Tạo phiếu khám lâm sàng */
export interface CreateClinicalExamInput {
    chief_complaint?: string;
    pulse?: number;
    blood_pressure_systolic?: number;
    blood_pressure_diastolic?: number;
    temperature?: number;
    respiratory_rate?: number;
    spo2?: number;
    weight?: number;
    height?: number;
    blood_glucose?: number;
    physical_examination?: string;
    medical_history_notes?: string;
    relevant_history?: string;
    clinical_notes?: string;
    severity_level?: string;
}

/** Cập nhật phiếu khám lâm sàng */
export interface UpdateClinicalExamInput {
    chief_complaint?: string;
    pulse?: number;
    blood_pressure_systolic?: number;
    blood_pressure_diastolic?: number;
    temperature?: number;
    respiratory_rate?: number;
    spo2?: number;
    weight?: number;
    height?: number;
    blood_glucose?: number;
    physical_examination?: string;
    medical_history_notes?: string;
    relevant_history?: string;
    clinical_notes?: string;
    severity_level?: string;
}

/** Cập nhật riêng sinh hiệu */
export interface UpdateVitalsInput {
    pulse?: number;
    blood_pressure_systolic?: number;
    blood_pressure_diastolic?: number;
    temperature?: number;
    respiratory_rate?: number;
    spo2?: number;
    weight?: number;
    height?: number;
    blood_glucose?: number;
}

/** Tóm tắt khám lâm sàng */
export interface ClinicalExamSummary {
    chief_complaint: string | null;
    severity_level: string | null;
    vitals_summary: string;
    has_abnormal_vitals: boolean;
    status: string;
}
