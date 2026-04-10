// Đơn thuốc tổng hợp

export interface MedicationRecordItem {
    prescriptions_id: string;
    prescription_code: string;
    encounter_id: string;
    patient_id: string;
    doctor_id: string;
    status: string;
    clinical_diagnosis: string | null;
    doctor_notes: string | null;
    prescribed_at: string;
    doctor_name: string | null;
    encounter_start: string | null;
    drug_count: number;
    is_dispensed: boolean;
    dispensed_at: string | null;
}

// Chi tiết đơn thuốc + danh sách thuốc
export interface MedicationDetailItem {
    prescriptions_id: string;
    prescription_code: string;
    encounter_id: string;
    status: string;
    clinical_diagnosis: string | null;
    doctor_notes: string | null;
    prescribed_at: string;
    doctor_name: string | null;
    is_dispensed: boolean;
    dispensed_at: string | null;
    pharmacist_name: string | null;
    drugs: PrescriptionDrugItem[];
}

export interface PrescriptionDrugItem {
    prescription_details_id: string;
    drug_id: string;
    drug_code: string;
    brand_name: string;
    active_ingredients: string;
    route_of_administration: string | null;
    dispensing_unit: string;
    quantity: number;
    dosage: string;
    frequency: string;
    duration_days: number | null;
    usage_instruction: string | null;
}

// Thuốc đang sử dụng
export interface CurrentMedicationItem {
    prescription_details_id: string;
    drug_code: string;
    brand_name: string;
    active_ingredients: string;
    dosage: string;
    frequency: string;
    duration_days: number | null;
    usage_instruction: string | null;
    dispensing_unit: string;
    prescribed_at: string;
    days_remaining: number | null;
    prescription_code: string;
    doctor_name: string | null;
}

// Kế hoạch điều trị
export interface TreatmentRecordItem {
    treatment_plans_id: string;
    plan_code: string;
    patient_id: string;
    primary_diagnosis_code: string;
    primary_diagnosis_name: string;
    title: string;
    description: string | null;
    goals: string | null;
    start_date: string;
    expected_end_date: string | null;
    actual_end_date: string | null;
    status: string;
    created_by_name: string | null;
    notes_count: number;
}

// Chi tiết kế hoạch + notes + follow-ups
export interface TreatmentDetailItem extends TreatmentRecordItem {
    notes: TreatmentNoteItem[];
    follow_ups: FollowUpItem[];
}

export interface TreatmentNoteItem {
    treatment_progress_notes_id: string;
    note_type: string;
    title: string | null;
    content: string;
    severity: string;
    recorded_by_name: string | null;
    created_at: string;
}

export interface FollowUpItem {
    encounter_follow_up_links_id: string;
    previous_encounter_id: string;
    follow_up_encounter_id: string;
    follow_up_reason: string | null;
    scheduled_date: string | null;
    actual_date: string | null;
    notes: string | null;
}

// Cảnh báo tương tác
export interface InteractionWarning {
    drug_code: string;
    brand_name: string;
    active_ingredients: string;
    allergen_name: string;
    allergen_type: string;
    severity: string;
    reaction: string | null;
    warning_type: string;
}

// Tuân thủ
export interface AdherenceRecord {
    adherence_id: string;
    prescription_detail_id: string;
    adherence_date: string;
    taken: boolean;
    skip_reason: string | null;
    recorded_by_name: string | null;
    created_at: string;
    drug_name: string | null;
    dosage: string | null;
}

export interface CreateAdherenceInput {
    prescription_detail_id: string;
    adherence_date: string;
    taken: boolean;
    skip_reason?: string;
}

// Timeline
export interface MedicationTimelineItem {
    event_id: string;
    event_type: string;
    event_date: string;
    title: string;
    description: string | null;
    status: string;
    reference_id: string;
}

// Filters
export interface MedicationFilters {
    status?: string;
    from_date?: string;
    to_date?: string;
    page: number;
    limit: number;
}
