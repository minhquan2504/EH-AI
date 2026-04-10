/** Đơn thuốc từ xa */
export interface TelePrescription {
    tele_prescription_id: string;
    prescription_id: string;
    tele_consultation_id: string;
    encounter_id: string | null;
    is_remote_prescription: boolean;
    remote_restrictions_checked: boolean;
    restriction_notes: string | null;
    delivery_method: string | null;
    delivery_address: string | null;
    delivery_phone: string | null;
    delivery_notes: string | null;
    sent_to_patient: boolean;
    sent_at: Date | null;
    legal_disclaimer: string | null;
    doctor_confirmed_identity: boolean;
    has_lab_orders: boolean;
    has_referral: boolean;
    referral_notes: string | null;
    pharmacy_notes: string | null;
    stock_checked: boolean;
    stock_check_result: any;
    created_at: Date;
    updated_at: Date;
    // JOIN from prescriptions
    prescription_code?: string;
    prescription_status?: string;
    doctor_notes?: string;
    clinical_diagnosis?: string;
    patient_name?: string;
    doctor_name?: string;
    items?: PrescriptionItem[];
}

/** Chi tiết thuốc (từ prescription_details) */
export interface PrescriptionItem {
    prescription_details_id: string;
    drug_id: string;
    drug_code?: string;
    brand_name?: string;
    active_ingredients?: string;
    quantity: number;
    dosage: string;
    frequency: string;
    duration_days: number | null;
    usage_instruction: string | null;
}

/** Input thêm thuốc */
export interface AddDrugInput {
    drug_id: string;
    quantity: number;
    dosage: string;
    frequency: string;
    duration_days?: number;
    usage_instruction?: string;
}

/** Input gửi đơn */
export interface SendPrescriptionInput {
    delivery_method: string;
    delivery_address?: string;
    delivery_phone?: string;
    delivery_notes?: string;
    doctor_confirmed_identity: boolean;
    remote_restrictions_checked: boolean;
    legal_disclaimer?: string;
}

/** Input chỉ định XN */
export interface LabOrderInput {
    service_code: string;
    service_name: string;
    clinical_indicator?: string;
    priority?: string;
}

/** Input referral */
export interface ReferralInput86 {
    has_referral: boolean;
    referral_notes?: string;
}

/** Drug restriction */
export interface DrugRestriction {
    restriction_id: string;
    drug_id: string;
    restriction_type: string;
    max_quantity: number | null;
    reason: string;
    legal_reference: string | null;
    is_active: boolean;
    // JOIN
    drug_code?: string;
    brand_name?: string;
}

/** Filter */
export interface TeleRxFilter {
    status?: string;
    doctor_id?: string;
    keyword?: string;
    page: number;
    limit: number;
}
