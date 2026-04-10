/** Đánh giá chi tiết chất lượng */
export interface TeleQualityReview {
    review_id: string;
    tele_consultation_id: string;
    patient_id: string;
    doctor_id: string;
    doctor_professionalism: number | null;
    doctor_communication: number | null;
    doctor_knowledge: number | null;
    doctor_empathy: number | null;
    doctor_overall: number | null;
    doctor_comment: string | null;
    ease_of_use: number | null;
    waiting_time_rating: number | null;
    overall_satisfaction: number | null;
    would_recommend: boolean;
    patient_comment: string | null;
    video_quality: number | null;
    audio_quality: number | null;
    connection_stability: number | null;
    tech_issues: any;
    is_anonymous: boolean;
    created_at: Date;
    // JOIN
    patient_name?: string;
    doctor_name?: string;
}

/** Input gửi đánh giá */
export interface CreateReviewInput {
    doctor_professionalism?: number;
    doctor_communication?: number;
    doctor_knowledge?: number;
    doctor_empathy?: number;
    doctor_overall: number;
    doctor_comment?: string;
    ease_of_use?: number;
    waiting_time_rating?: number;
    overall_satisfaction: number;
    would_recommend?: boolean;
    patient_comment?: string;
    video_quality?: number;
    audio_quality?: number;
    connection_stability?: number;
    tech_issues?: string[];
    is_anonymous?: boolean;
}

/** Cảnh báo chất lượng */
export interface TeleQualityAlert {
    alert_id: string;
    alert_type: string;
    severity: string;
    target_type: string;
    target_id: string | null;
    title: string;
    description: string | null;
    metrics_snapshot: any;
    status: string;
    resolved_by: string | null;
    resolution_notes: string | null;
    resolved_at: Date | null;
    created_at: Date;
    resolver_name?: string;
}

/** Input tạo alert */
export interface CreateAlertInput {
    alert_type: string;
    severity: string;
    target_type: string;
    target_id?: string;
    title: string;
    description?: string;
    metrics_snapshot?: any;
}

/** Input resolve alert */
export interface ResolveAlertInput {
    status: string;
    resolution_notes: string;
}

/** Filter reviews */
export interface QualityReviewFilter {
    doctor_id?: string;
    min_rating?: number;
    max_rating?: number;
    keyword?: string;
    page: number;
    limit: number;
}
