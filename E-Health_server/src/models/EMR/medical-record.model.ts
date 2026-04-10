/** Bệnh án đầy đủ — tổng hợp toàn bộ dữ liệu encounter */
export interface FullMedicalRecord {
    encounter: EncounterInfo;
    clinical_examination: ClinicalExamInfo | null;
    diagnoses: DiagnosisInfo[];
    medical_orders: MedicalOrderInfo[];
    prescription: PrescriptionInfo | null;
    signature: SignatureInfo | null;
    snapshot: SnapshotMeta | null;
    is_finalized: boolean;
    completeness: CompletenessResult;
}

/** Thông tin encounter (header) */
export interface EncounterInfo {
    encounters_id: string;
    appointment_id: string | null;
    patient_id: string;
    doctor_id: string;
    room_id: string;
    encounter_type: string;
    start_time: string;
    end_time: string | null;
    status: string;
    visit_number: number;
    notes: string | null;
    is_finalized: boolean;
    finalized_at: string | null;
    patient_name?: string;
    patient_code?: string;
    doctor_name?: string;
    doctor_title?: string;
    specialty_name?: string;
    room_name?: string;
    room_code?: string;
}

/** Sinh hiệu + Khám lâm sàng */
export interface ClinicalExamInfo {
    clinical_examinations_id: string;
    pulse: number | null;
    blood_pressure_systolic: number | null;
    blood_pressure_diastolic: number | null;
    temperature: number | null;
    respiratory_rate: number | null;
    spo2: number | null;
    weight: number | null;
    height: number | null;
    bmi: number | null;
    chief_complaint: string | null;
    medical_history_notes: string | null;
    physical_examination: string | null;
    recorder_name?: string;
}

/** Chẩn đoán */
export interface DiagnosisInfo {
    encounter_diagnoses_id: string;
    icd10_code: string;
    diagnosis_name: string;
    diagnosis_type: string;
    notes: string | null;
    diagnosed_by_name?: string;
}

/** Chỉ định CLS + Kết quả */
export interface MedicalOrderInfo {
    medical_orders_id: string;
    service_code: string;
    service_name: string;
    clinical_indicator: string | null;
    priority: string;
    status: string;
    ordered_at: string;
    result_summary: string | null;
    result_details: any | null;
    attachment_urls: any | null;
}

/** Đơn thuốc (header + dòng thuốc) */
export interface PrescriptionInfo {
    prescriptions_id: string;
    prescription_code: string;
    status: string;
    clinical_diagnosis: string | null;
    doctor_notes: string | null;
    prescribed_at: string;
    details: PrescriptionDetailInfo[];
}

export interface PrescriptionDetailInfo {
    drug_code: string;
    brand_name: string;
    active_ingredients: string;
    quantity: number;
    dosage: string;
    frequency: string;
    duration_days: number | null;
    usage_instruction: string | null;
    route_of_administration: string | null;
    dispensing_unit: string;
}

/** Ký số bệnh án */
export interface SignatureInfo {
    emr_signatures_id: string;
    signed_by: string;
    signer_name?: string;
    signature_hash: string;
    certificate_serial: string | null;
    signed_at: string;
}

/** Metadata snapshot (không kèm data JSONB full) */
export interface SnapshotMeta {
    emr_record_snapshots_id: string;
    record_type: string;
    finalized_by: string;
    finalizer_name?: string;
    finalized_at: string;
    notes: string | null;
}

/** Snapshot đầy đủ (kèm JSONB data) */
export interface SnapshotFull extends SnapshotMeta {
    snapshot_data: any;
}

/** Kết quả kiểm tra completeness */
export interface CompletenessResult {
    score: number;
    total_items: number;
    completed_items: number;
    details: CompletenessItem[];
}

export interface CompletenessItem {
    item: string;
    status: string;
    weight: number;
    note?: string;
}

/** Item trong danh sách bệnh án theo bệnh nhân */
export interface PatientRecordItem {
    encounters_id: string;
    encounter_type: string;
    start_time: string;
    end_time: string | null;
    status: string;
    is_finalized: boolean;
    finalized_at: string | null;
    doctor_name: string | null;
    doctor_title: string | null;
    specialty_name: string | null;
    primary_diagnosis: string | null;
    icd10_code: string | null;
    has_signature: boolean;
    visit_number: number;
}

/** Sự kiện dòng thời gian */
export interface TimelineEvent {
    event_id: string;
    event_date: string;
    event_type: string;
    title: string;
    summary: string | null;
    reference_id: string | null;
    reference_table: string | null;
}

/** Thống kê xuyên encounter */
export interface PatientStatistics {
    total_encounters: number;
    total_finalized: number;
    encounters_by_type: Record<string, number>;
    encounters_by_year: Record<string, number>;
    top_diagnoses: TopDiagnosisItem[];
    top_drugs: TopDrugItem[];
    last_encounter: LastEncounterInfo | null;
    vital_signs_trend: VitalSignTrend[];
}

export interface TopDiagnosisItem {
    icd10_code: string;
    diagnosis_name: string;
    count: number;
}

export interface TopDrugItem {
    brand_name: string;
    drug_code: string;
    count: number;
}

export interface LastEncounterInfo {
    date: string;
    doctor_name: string | null;
    diagnosis: string | null;
}

export interface VitalSignTrend {
    date: string;
    systolic: number | null;
    diastolic: number | null;
    pulse: number | null;
    weight: number | null;
}

/** Kết quả tìm kiếm bệnh án */
export interface SearchRecordItem extends PatientRecordItem {
    patient_name: string;
    patient_code: string;
}

/** Input ký số */
export interface SignInput {
    certificate_serial?: string;
}

/** Input finalize */
export interface FinalizeInput {
    notes?: string;
}
