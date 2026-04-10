/**
 * Interfaces cho module Theo dõi Tiến trình Điều trị (Treatment Progress 4.7)
 */

/** Kế hoạch điều trị */
export interface TreatmentPlan {
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
    created_by: string;
    created_encounter_id: string | null;
    created_at: string;
    updated_at: string;
    creator_name?: string;
    patient_name?: string;
    patient_code?: string;
}

/** Input tạo kế hoạch */
export interface CreatePlanInput {
    patient_id: string;
    primary_diagnosis_code: string;
    primary_diagnosis_name: string;
    title: string;
    description?: string;
    goals?: string;
    start_date: string;
    expected_end_date?: string;
    created_encounter_id?: string;
}

/** Input cập nhật kế hoạch */
export interface UpdatePlanInput {
    title?: string;
    description?: string;
    goals?: string;
    expected_end_date?: string;
}

/** Input chuyển trạng thái */
export interface StatusChangeInput {
    status: string;
    reason?: string;
}

/** Ghi nhận diễn tiến */
export interface ProgressNote {
    treatment_progress_notes_id: string;
    plan_id: string;
    encounter_id: string | null;
    note_type: string;
    title: string | null;
    content: string;
    severity: string;
    recorded_by: string;
    created_at: string;
    recorder_name?: string;
}

/** Input tạo ghi nhận */
export interface CreateNoteInput {
    encounter_id?: string;
    note_type: string;
    title?: string;
    content: string;
    severity?: string;
}

/** Input sửa ghi nhận */
export interface UpdateNoteInput {
    note_type?: string;
    title?: string;
    content?: string;
    severity?: string;
}

/** Liên kết tái khám */
export interface FollowUpLink {
    encounter_follow_up_links_id: string;
    plan_id: string;
    previous_encounter_id: string;
    follow_up_encounter_id: string;
    follow_up_reason: string | null;
    scheduled_date: string | null;
    actual_date: string | null;
    notes: string | null;
    created_by: string;
    created_at: string;
}

/** Input liên kết tái khám */
export interface CreateFollowUpInput {
    previous_encounter_id: string;
    follow_up_encounter_id: string;
    follow_up_reason?: string;
    scheduled_date?: string;
    notes?: string;
}

/** Item trong chuỗi tái khám */
export interface FollowUpChainItem {
    order: number;
    encounter_id: string;
    encounter_type: string;
    date: string;
    doctor_name: string | null;
    diagnosis: string | null;
    blood_pressure: string | null;
    notes_count: number;
}

/** Chi tiết kế hoạch (bao gồm notes gần nhất + chain + stats) */
export interface PlanDetail {
    plan: TreatmentPlan;
    recent_notes: ProgressNote[];
    encounter_chain: FollowUpChainItem[];
    stats: PlanStats;
}

/** Thống kê nhanh */
export interface PlanStats {
    total_notes: number;
    total_encounters: number;
    days_in_treatment: number;
    notes_by_type: Record<string, number>;
}

/** Item DS kế hoạch */
export interface PlanListItem extends TreatmentPlan {
    total_notes: number;
    total_encounters: number;
}

/** Tổng hợp điều trị */
export interface TreatmentSummary {
    plan: TreatmentPlan;
    total_days: number;
    total_encounters: number;
    total_notes: number;
    notes_by_type: Record<string, number>;
    notes_by_severity: Record<string, number>;
    vital_signs_trend: VitalSignItem[];
    prescriptions_history: PrescriptionHistoryItem[];
    recent_notes: ProgressNote[];
    follow_up_chain: FollowUpChainItem[];
}

export interface VitalSignItem {
    date: string;
    systolic: number | null;
    diastolic: number | null;
    pulse: number | null;
    weight: number | null;
}

export interface PrescriptionHistoryItem {
    date: string;
    prescription_code: string;
    status: string;
    drugs: string[];
}
