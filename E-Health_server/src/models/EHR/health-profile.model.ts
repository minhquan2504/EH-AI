/** Hồ sơ sức khỏe tổng hợp — response chính API /profile */
export interface PatientHealthProfile {
    patient_info: PatientBasicInfo;
    health_summary: HealthSummary;
    latest_vitals: LatestVitals | null;
    active_conditions: ActiveCondition[];
    allergies: AllergyItem[];
    current_medications: CurrentMedication[];
    recent_diagnoses: DiagnosisHistoryItem[];
    insurance_info: InsuranceStatusItem[];
    tags: PatientTagItem[];
    alerts: HealthAlert[];
    ehr_notes: string | null;
}

/** Thông tin hành chính cơ bản bệnh nhân */
export interface PatientBasicInfo {
    id: string;
    patient_code: string;
    full_name: string;
    date_of_birth: string;
    gender: string;
    age: number;
    phone_number: string | null;
    email: string | null;
    address: string | null;
    status: string;
}

/** Tóm tắt sức khỏe (tổng hợp nhanh) */
export interface HealthSummary {
    total_encounters: number;
    last_encounter_date: string | null;
    last_encounter_doctor: string | null;
    last_primary_diagnosis: string | null;
    last_primary_icd10: string | null;
    active_conditions_count: number;
    allergy_count: number;
    active_medications_count: number;
    has_active_insurance: boolean;
    active_treatment_plans_count: number;
    risk_level: string;
}

/** Sinh hiệu lần khám gần nhất */
export interface LatestVitals {
    encounter_id: string;
    encounter_date: string;
    pulse: number | null;
    blood_pressure_systolic: number | null;
    blood_pressure_diastolic: number | null;
    temperature: number | null;
    respiratory_rate: number | null;
    spo2: number | null;
    weight: number | null;
    height: number | null;
    bmi: number | null;
    recorded_by: string | null;
}

/** Bệnh lý đang hoạt động (tiền sử bệnh) */
export interface ActiveCondition {
    patient_medical_histories_id: string;
    condition_code: string | null;
    condition_name: string;
    history_type: string;
    diagnosis_date: string | null;
    status: string;
    notes: string | null;
    reported_by_name: string | null;
    created_at: string;
}

/** Mục dị ứng */
export interface AllergyItem {
    patient_allergies_id: string;
    allergen_type: string | null;
    allergen_name: string;
    reaction: string | null;
    severity: string | null;
    notes: string | null;
}

/** Thuốc đang sử dụng (từ đơn PRESCRIBED/DISPENSED còn hiệu lực) */
export interface CurrentMedication {
    prescription_code: string;
    drug_code: string;
    brand_name: string;
    active_ingredients: string;
    dosage: string;
    frequency: string;
    duration_days: number | null;
    usage_instruction: string | null;
    route_of_administration: string | null;
    dispensing_unit: string;
    prescribed_at: string;
    estimated_end_date: string | null;
    doctor_name: string | null;
}

/** Mục lịch sử chẩn đoán */
export interface DiagnosisHistoryItem {
    encounter_diagnoses_id: string;
    encounter_id: string;
    icd10_code: string;
    diagnosis_name: string;
    diagnosis_type: string;
    encounter_date: string;
    doctor_name: string | null;
    notes: string | null;
}

/** Tình trạng bảo hiểm */
export interface InsuranceStatusItem {
    patient_insurances_id: string;
    insurance_type: string;
    insurance_number: string;
    provider_name: string | null;
    start_date: string;
    end_date: string;
    coverage_percent: number | null;
    is_primary: boolean;
    is_expired: boolean;
    days_until_expiry: number;
}

/** Thẻ phân loại bệnh nhân */
export interface PatientTagItem {
    tag_id: string;
    code: string;
    name: string;
    color_hex: string;
}

/** Cảnh báo y tế (cả tự động lẫn thủ công) */
export interface HealthAlert {
    alert_id: string;
    alert_type: string;
    severity: string;
    title: string;
    description: string | null;
    source: 'AUTO' | 'MANUAL';
    created_by_name: string | null;
    is_active: boolean;
    created_at: string;
}

/** Metadata hồ sơ EHR (bảng ehr_health_profiles) */
export interface EhrProfileMeta {
    ehr_profile_id: string;
    patient_id: string;
    risk_level: string;
    ehr_notes: string | null;
    last_reviewed_by: string | null;
    last_reviewed_at: string | null;
    reviewer_name: string | null;
}

/** Input tạo cảnh báo thủ công */
export interface CreateAlertInput {
    alert_type: string;
    severity?: string;
    title: string;
    description?: string;
}

/** Input cập nhật cảnh báo thủ công */
export interface UpdateAlertInput {
    severity?: string;
    title?: string;
    description?: string;
    is_active?: boolean;
}

/** Input cập nhật ghi chú & risk level */
export interface UpdateEhrNotesInput {
    ehr_notes?: string;
    risk_level?: string;
}
