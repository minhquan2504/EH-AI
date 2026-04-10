/** Cuộc hội thoại y tế */
export interface MedicalConversation {
    conversation_id: string;
    patient_id: string;
    doctor_id: string;
    specialty_id: string | null;
    appointment_id: string | null;
    encounter_id: string | null;
    subject: string | null;
    status: string;
    priority: string;
    last_message_at: Date | null;
    last_message_preview: string | null;
    unread_count_patient: number;
    unread_count_doctor: number;
    is_patient_initiated: boolean;
    closed_at: Date | null;
    closed_by: string | null;
    created_at: Date;
    // JOIN
    patient_name?: string;
    doctor_name?: string;
    specialty_name?: string;
}

/** Tin nhắn y tế */
export interface MedicalChatMessage {
    message_id: string;
    conversation_id: string;
    sender_id: string;
    sender_type: string;
    message_type: string;
    content: string | null;
    is_read: boolean;
    read_at: Date | null;
    is_pinned: boolean;
    is_deleted: boolean;
    reply_to_id: string | null;
    metadata: any;
    sent_at: Date;
    // JOIN
    sender_name?: string;
    attachments?: MedicalChatAttachment[];
    reply_to?: MedicalChatMessage;
}

/** File đính kèm */
export interface MedicalChatAttachment {
    attachment_id: string;
    message_id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number | null;
    mime_type: string | null;
    thumbnail_url: string | null;
    is_medical_record: boolean;
    created_at: Date;
}

/** Input tạo conversation */
export interface CreateConversationInput {
    patient_id: string;
    doctor_id: string;
    specialty_id?: string;
    appointment_id?: string;
    encounter_id?: string;
    subject?: string;
    priority?: string;
}

/** Input gửi tin nhắn */
export interface SendMedChatMessageInput {
    message_type?: string;
    content?: string;
    reply_to_id?: string;
    metadata?: any;
    attachments?: {
        file_name: string;
        file_url: string;
        file_type?: string;
        file_size?: number;
        mime_type?: string;
        thumbnail_url?: string;
        is_medical_record?: boolean;
    }[];
}

/** Filter cuộc hội thoại */
export interface ConversationFilter {
    patient_id?: string;
    doctor_id?: string;
    status?: string;
    priority?: string;
    keyword?: string;
    page: number;
    limit: number;
}
