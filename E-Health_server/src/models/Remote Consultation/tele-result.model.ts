/** Kết quả khám từ xa */
export interface TeleConsultationResult {
    result_id: string;
    tele_consultation_id: string;
    encounter_id: string | null;
    // Triệu chứng
    chief_complaint: string | null;
    symptom_description: string | null;
    symptom_duration: string | null;
    symptom_severity: string | null;
    self_reported_vitals: any;
    // Khám & Kết luận
    remote_examination_notes: string | null;
    examination_limitations: string | null;
    clinical_impression: string | null;
    medical_conclusion: string | null;
    conclusion_type: string;
    // Điều trị
    treatment_plan: string | null;
    treatment_advice: string | null;
    lifestyle_recommendations: string | null;
    medication_notes: string | null;
    referral_needed: boolean;
    referral_reason: string | null;
    referral_specialty: string | null;
    // Follow-up
    follow_up_needed: boolean;
    follow_up_date: Date | null;
    follow_up_notes: string | null;
    follow_up_type: string | null;
    // Ký
    is_signed: boolean;
    signed_at: Date | null;
    signed_by: string | null;
    signature_notes: string | null;
    // Metadata
    status: string;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;
    // JOIN
    patient_name?: string;
    doctor_name?: string;
    specialty_name?: string;
    type_name?: string;
}

/** Input tạo / cập nhật kết quả */
export interface TeleResultInput {
    chief_complaint?: string;
    symptom_description?: string;
    symptom_duration?: string;
    symptom_severity?: string;
    remote_examination_notes?: string;
    examination_limitations?: string;
    clinical_impression?: string;
    medical_conclusion?: string;
    conclusion_type?: string;
    treatment_plan?: string;
    treatment_advice?: string;
    lifestyle_recommendations?: string;
    medication_notes?: string;
}

/** Input triệu chứng */
export interface SymptomsInput {
    chief_complaint?: string;
    symptom_description?: string;
    symptom_duration?: string;
    symptom_severity?: string;
}

/** Input sinh hiệu BN tự báo */
export interface SelfReportedVitalsInput {
    temperature?: number;
    pulse?: number;
    bp_systolic?: number;
    bp_diastolic?: number;
    spo2?: number;
    weight?: number;
}

/** Input chuyển tuyến */
export interface ReferralInput {
    referral_needed: boolean;
    referral_reason?: string;
    referral_specialty?: string;
}

/** Input tái khám */
export interface FollowUpInput {
    follow_up_needed: boolean;
    follow_up_date?: string;
    follow_up_notes?: string;
    follow_up_type?: string;
}

/** Filter kết quả */
export interface ResultFilter {
    status?: string;
    doctor_id?: string;
    keyword?: string;
    page: number;
    limit: number;
}
