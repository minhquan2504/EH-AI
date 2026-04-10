/**
 * Interfaces cho module Kê đơn thuốc (Prescription Management 4.5)
 */

/** Bản ghi đơn thuốc (header) */
export interface PrescriptionRecord {
    prescriptions_id: string;
    prescription_code: string;
    encounter_id: string;
    doctor_id: string;
    patient_id: string;
    status: string;
    clinical_diagnosis: string | null;
    doctor_notes: string | null;
    primary_diagnosis_id: string | null;
    prescribed_at: string;
    updated_at: string;
    cancelled_at: string | null;
    cancelled_reason: string | null;


    doctor_name?: string;
    patient_name?: string;
    diagnosis_name?: string;
    icd10_code?: string;
}

/** Input tạo đơn thuốc */
export interface CreatePrescriptionInput {
    clinical_diagnosis?: string;
    doctor_notes?: string;
    primary_diagnosis_id?: string;
}

/** Input cập nhật đơn thuốc */
export interface UpdatePrescriptionInput {
    clinical_diagnosis?: string;
    doctor_notes?: string;
    primary_diagnosis_id?: string;
}

/** Bản ghi dòng thuốc chi tiết */
export interface PrescriptionDetailRecord {
    prescription_details_id: string;
    prescription_id: string;
    drug_id: string;
    quantity: number;
    dosage: string;
    frequency: string;
    duration_days: number | null;
    usage_instruction: string | null;
    route_of_administration: string | null;
    notes: string | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;

    drug_code?: string;
    brand_name?: string;
    active_ingredients?: string;
    dispensing_unit?: string;
}

/** Input thêm dòng thuốc */
export interface CreateDetailInput {
    drug_id: string;
    quantity: number;
    dosage: string;
    frequency: string;
    duration_days?: number;
    usage_instruction?: string;
    route_of_administration?: string;
    notes?: string;
}

/** Input sửa dòng thuốc */
export interface UpdateDetailInput {
    quantity?: number;
    dosage?: string;
    frequency?: string;
    duration_days?: number;
    usage_instruction?: string;
    route_of_administration?: string;
    notes?: string;
}

/** Kết quả tìm kiếm thuốc */
export interface DrugSearchResult {
    drugs_id: string;
    drug_code: string;
    brand_name: string;
    active_ingredients: string;
    category_id: string | null;
    category_name?: string;
    route_of_administration: string | null;
    dispensing_unit: string;
    is_prescription_only: boolean;
}

/** Tóm tắt đơn thuốc cho encounter */
export interface PrescriptionSummary {
    prescriptions_id: string;
    prescription_code: string;
    status: string;
    prescribed_at: string;
    doctor_name: string | null;
    clinical_diagnosis: string | null;
    total_items: number;
    items: PrescriptionSummaryItem[];
}

/** Dòng tóm tắt thuốc */
export interface PrescriptionSummaryItem {
    drug_code: string;
    brand_name: string;
    active_ingredients: string;
    dosage: string;
    frequency: string;
    quantity: number;
    duration_days: number | null;
    route_of_administration: string | null;
    usage_instruction: string | null;
    dispensing_unit: string;
    notes: string | null;
}
