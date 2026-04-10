/** Người tham gia phòng khám */
export interface TeleRoomParticipant {
    participant_id: string;
    tele_consultation_id: string;
    user_id: string;
    participant_role: string;
    join_time: Date | null;
    leave_time: Date | null;
    duration_seconds: number;
    is_video_on: boolean;
    is_audio_on: boolean;
    is_screen_sharing: boolean;
    connection_quality: string;
    device_info: any;
    room_token: string | null;
    token_expires_at: Date | null;
    status: string;
    // JOIN
    full_name?: string;
}

/** Sự kiện phòng khám */
export interface TeleRoomEvent {
    event_id: string;
    tele_consultation_id: string;
    user_id: string | null;
    event_type: string;
    event_data: any;
    created_at: Date;
    // JOIN
    full_name?: string;
}

/** File chia sẻ */
export interface TeleSharedFile {
    file_id: string;
    tele_consultation_id: string;
    uploaded_by: string;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number | null;
    mime_type: string | null;
    thumbnail_url: string | null;
    description: string | null;
    is_medical_record: boolean;
    created_at: Date;
    // JOIN
    uploader_name?: string;
}

/** Chi tiết phòng khám (extended tele_consultations) */
export interface TeleRoomDetail {
    tele_consultations_id: string;
    encounter_id: string;
    platform: string;
    meeting_id: string | null;
    meeting_password: string | null;
    host_url: string | null;
    join_url: string;
    call_status: string;
    room_status: string;
    room_opened_at: Date | null;
    room_closed_at: Date | null;
    total_duration_seconds: number;
    participant_count: number;
    has_video: boolean;
    has_audio: boolean;
    has_chat: boolean;
    has_file_sharing: boolean;
    network_issues_count: number;
    ended_reason: string | null;
    actual_start_time: Date | null;
    actual_end_time: Date | null;
    // JOIN
    patient_name?: string;
    doctor_name?: string;
    specialty_name?: string;
    type_name?: string;
    booking_session_code?: string;
    appointment_code?: string;
    participants?: TeleRoomParticipant[];
}

/** Input gửi tin nhắn */
export interface SendMessageInput {
    message_type?: string;
    content?: string;
    file_url?: string;
}

/** Input upload file */
export interface UploadFileInput {
    file_name: string;
    file_url: string;
    file_type?: string;
    file_size?: number;
    mime_type?: string;
    thumbnail_url?: string;
    description?: string;
    is_medical_record?: boolean;
}

/** Input cập nhật media */
export interface UpdateMediaInput {
    is_video_on?: boolean;
    is_audio_on?: boolean;
    is_screen_sharing?: boolean;
}
