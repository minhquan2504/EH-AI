/** Kế hoạch theo dõi */
export interface TeleFollowUpPlan {
    plan_id: string;
    tele_consultation_id: string;
    patient_id: string;
    doctor_id: string;
    encounter_id: string | null;
    plan_type: string;
    description: string | null;
    instructions: string | null;
    monitoring_items: any;
    frequency: string;
    start_date: Date;
    end_date: Date | null;
    next_follow_up_date: Date | null;
    follow_up_type: string | null;
    follow_up_booking_id: string | null;
    reminder_sent: boolean;
    reminder_sent_at: Date | null;
    status: string;
    outcome: string | null;
    outcome_rating: string | null;
    completed_at: Date | null;
    converted_reason: string | null;
    created_at: Date;
    updated_at: Date;
    // JOIN
    patient_name?: string;
    doctor_name?: string;
    update_count?: number;
}

/** Diễn biến sức khỏe */
export interface TeleHealthUpdate {
    update_id: string;
    plan_id: string;
    reported_by: string;
    reporter_type: string;
    update_type: string;
    content: string | null;
    vital_data: any;
    severity_level: string;
    attachments: any;
    doctor_response: string | null;
    responded_at: Date | null;
    requires_attention: boolean;
    created_at: Date;
    reporter_name?: string;
}

/** Input tạo plan */
export interface CreatePlanInput {
    plan_type: string;
    description?: string;
    instructions?: string;
    monitoring_items?: string[];
    frequency?: string;
    start_date: string;
    end_date?: string;
    next_follow_up_date?: string;
    follow_up_type?: string;
}

/** Input cập nhật plan */
export interface UpdatePlanInput {
    description?: string;
    instructions?: string;
    monitoring_items?: string[];
    frequency?: string;
    end_date?: string;
    next_follow_up_date?: string;
    follow_up_type?: string;
}

/** Input hoàn thành plan */
export interface CompletePlanInput {
    outcome: string;
    outcome_rating: string;
}

/** Input ghi diễn biến */
export interface AddHealthUpdateInput {
    update_type: string;
    content?: string;
    vital_data?: any;
    severity_level?: string;
    attachments?: any[];
}

/** Input BS phản hồi */
export interface RespondUpdateInput {
    doctor_response: string;
}

/** Filter plans */
export interface FollowUpPlanFilter {
    status?: string;
    plan_type?: string;
    doctor_id?: string;
    keyword?: string;
    page: number;
    limit: number;
}
