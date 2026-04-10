/**
 * Interface Types cho Module 2.2 — Lịch sử khám & Điều trị (Read-Only)
 */

/** Lượt khám tóm tắt (dùng cho danh sách) */
export interface EncounterListItem {
    encounters_id: string;
    appointment_id: string | null;
    patient_id: string;
    doctor_id: string;
    room_id: string;
    encounter_type: string;
    start_time: string;
    end_time: string | null;
    status: string;
    created_at: string;

    doctor_name?: string;
    doctor_title?: string;
    specialty_name?: string;
    room_name?: string;
    room_code?: string;
    patient_name?: string;
    patient_code?: string;
    chief_complaint?: string;
    primary_diagnosis?: string;
}

/** Sinh hiệu & khám lâm sàng */
export interface ClinicalExamination {
    clinical_examinations_id: string;
    encounter_id: string;
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
    recorded_by: string | null;
    recorder_name?: string;
}

/** Chẩn đoán */
export interface Diagnosis {
    encounter_diagnoses_id: string;
    icd10_code: string;
    diagnosis_name: string;
    diagnosis_type: string;
    notes: string | null;
    diagnosed_by: string;
    diagnosed_by_name?: string;
    created_at: string;
}

/** Đơn thuốc tóm tắt */
export interface PrescriptionSummary {
    prescriptions_id: string;
    prescription_code: string;
    status: string;
    clinical_diagnosis: string | null;
    doctor_notes: string | null;
    prescribed_at: string;
    details: PrescriptionDetailItem[];
}

/** Chi tiết dòng thuốc */
export interface PrescriptionDetailItem {
    drug_name: string;
    quantity: number;
    dosage: string;
    frequency: string;
    duration_days: number | null;
    usage_instruction: string | null;
}

/** Chỉ định CLS */
export interface MedicalOrderItem {
    medical_orders_id: string;
    service_code: string;
    service_name: string;
    clinical_indicator: string | null;
    priority: string;
    status: string;
    ordered_at: string;
    result_summary: string | null;
}

/** Chi tiết đầy đủ lượt khám */
export interface EncounterDetail extends EncounterListItem {
    clinical_examination: ClinicalExamination | null;
    diagnoses: Diagnosis[];
    prescription: PrescriptionSummary | null;
    medical_orders: MedicalOrderItem[];
}

/** Sự kiện trên dòng thời gian */
export interface TimelineEvent {
    health_timeline_events_id: string;
    event_date: string;
    event_type: string;
    title: string;
    summary: string | null;
    reference_id: string | null;
    reference_table: string | null;
    source_system: string;
}

/** Tổng hợp lịch sử bệnh nhân */
export interface PatientMedicalSummary {
    total_encounters: number;
    last_encounter_date: string | null;
    last_encounter_type: string | null;
    last_doctor_name: string | null;
    last_primary_diagnosis: string | null;
    last_prescription_code: string | null;
}

/** Kết quả phân trang */
export interface PaginatedEncounters {
    data: EncounterListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
