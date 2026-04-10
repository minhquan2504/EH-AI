/** Phiên hội thoại AI tư vấn sức khỏe */
export interface AiChatSession {
    session_id: string;
    session_code: string;
    patient_id: string | null;
    user_id: string | null;
    suggested_specialty_id: string | null;
    suggested_specialty_name: string | null;
    suggested_priority: string | null;
    symptoms_summary: string | null;
    ai_conclusion: string | null;
    status: string;
    message_count: number;
    appointment_id: string | null;
    created_at: Date;
    updated_at: Date;
    completed_at: Date | null;
}

/** Tin nhắn trong phiên hội thoại */
export interface AiChatMessage {
    message_id: string;
    session_id: string;
    role: string;
    content: string;
    model_used: string | null;
    tokens_used: number;
    response_time_ms: number;
    analysis_data: AiAnalysisData | null;
    created_at: Date;
}

/**
 * Dữ liệu phân tích triệu chứng từ AI (trả về trong mỗi tin nhắn ASSISTANT).
 */
export interface AiAnalysisData {
    intent_group?: number;
    is_complete: boolean;
    suggested_specialty_code: string | null;
    suggested_specialty_name: string | null;
    priority: string | null;
    symptoms_collected: string[];
    should_suggest_booking: boolean;
    reasoning: string | null;
    severity: string | null;
    can_self_treat: boolean;
    preliminary_assessment: string | null;
    recommended_actions: string[];
    red_flags_detected: string[];
    needs_doctor: boolean;
}

/** Payload tạo phiên mới — userId lấy từ JWT token, không cần truyền patient_id */
export interface StartSessionPayload {
    message: string;
}

/** Payload gửi tin nhắn */
export interface SendMessagePayload {
    message: string;
}

/** Chuyên khoa dùng cho system prompt */
export interface SpecialtyForPrompt {
    specialties_id: string;
    code: string;
    name: string;
    description: string | null;
}

/** Kết quả trả về khi bắt đầu phiên hoặc gửi tin nhắn */
export interface AiChatResponse {
    session: AiChatSession;
    ai_reply: string;
    analysis: AiAnalysisData | null;
}

/** Kết quả phiên chat kèm danh sách tin nhắn */
export interface AiChatSessionDetail {
    session: AiChatSession;
    messages: AiChatMessage[];
}
