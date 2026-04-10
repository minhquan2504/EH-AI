import { TeleRoomRepository } from '../../repository/Remote Consultation/tele-room.repository';
import { SendMessageInput, UploadFileInput, UpdateMediaInput } from '../../models/Remote Consultation/tele-room.model';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import {
    TELE_ROOM_STATUS, PARTICIPANT_ROLE, PARTICIPANT_STATUS,
    ROOM_EVENT_TYPE, TELE_ROOM_ERRORS, ROOM_TOKEN_EXPIRY_HOURS,
    SHARED_FILE_TYPE, REMOTE_CONSULTATION_CONFIG,
} from '../../constants/remote-consultation.constant';
import { pool } from '../../config/postgresdb';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * Business Logic Layer cho phòng khám trực tuyến
 * Lifecycle: mở phòng → join/leave → chat/file → đóng phòng
 */
export class TeleRoomService {

    // ═══════════════════════════════════════════════════
    // NHÓM 1: QUẢN LÝ PHÒNG
    // ═══════════════════════════════════════════════════

    /**
     * BS mở phòng — chuyển trạng thái SCHEDULED → WAITING
     * Sinh meeting URL giả lập, room tokens cho participants
     */
    static async openRoom(consultationId: string, userId: string): Promise<any> {
        const consultation = await this.getConsultationOrThrow(consultationId);

        if (consultation.room_status && consultation.room_status !== TELE_ROOM_STATUS.SCHEDULED) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_ROOM_ERRORS.ROOM_ALREADY_OPEN.code, TELE_ROOM_ERRORS.ROOM_ALREADY_OPEN.message);
        }

        // Sinh meeting credentials (giả lập — production sẽ gọi Agora/Zoom API)
        const meetingId = `MEET_${uuidv4().substring(0, 8).toUpperCase()}`;
        const meetingPassword = crypto.randomBytes(4).toString('hex');
        const hostUrl = `https://meet.ehealth.vn/host/${meetingId}`;
        const joinUrl = `https://meet.ehealth.vn/join/${meetingId}`;

        // Cập nhật tele_consultations
        await TeleRoomRepository.updateRoomStatus(consultationId, {
            room_status: TELE_ROOM_STATUS.WAITING,
            room_opened_at: new Date(),
            room_opened_by: userId,
            meeting_id: meetingId,
            meeting_password: meetingPassword,
            host_url: hostUrl,
            join_url: joinUrl,
            call_status: 'ONGOING',
        });

        // Tạo participant cho BS (HOST)
        const tokenExpires = new Date(Date.now() + ROOM_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
        const hostToken = this.generateRoomToken();
        await TeleRoomRepository.createParticipant({
            participant_id: `TRP_${uuidv4().substring(0, 12)}`,
            tele_consultation_id: consultationId,
            user_id: userId,
            participant_role: PARTICIPANT_ROLE.HOST,
            room_token: hostToken,
            token_expires_at: tokenExpires,
            status: PARTICIPANT_STATUS.IN_ROOM,
        });

        // Tạo participant cho BN (lấy từ encounter) — chờ join
        try {
            const encResult = await pool.query(`
                SELECT p.account_id FROM encounters enc
                JOIN patients p ON enc.patient_id = p.id::varchar
                WHERE enc.encounters_id = $1 AND p.account_id IS NOT NULL
            `, [consultation.encounter_id]);
            if (encResult.rows[0]?.account_id) {
                const patientToken = this.generateRoomToken();
                await TeleRoomRepository.createParticipant({
                    participant_id: `TRP_${uuidv4().substring(0, 12)}`,
                    tele_consultation_id: consultationId,
                    user_id: encResult.rows[0].account_id,
                    participant_role: PARTICIPANT_ROLE.GUEST,
                    room_token: patientToken,
                    token_expires_at: tokenExpires,
                    status: PARTICIPANT_STATUS.WAITING,
                });
            }
        } catch { /* BN chưa có account → skip */ }

        // Ghi event
        await TeleRoomRepository.createEvent({
            tele_consultation_id: consultationId,
            user_id: userId,
            event_type: ROOM_EVENT_TYPE.ROOM_OPENED,
            event_data: { meeting_id: meetingId, platform: consultation.platform },
        });

        return await TeleRoomRepository.getConsultationDetail(consultationId);
    }

    /**
     * Tham gia phòng — validate token, ghi join_time
     */
    static async joinRoom(consultationId: string, userId: string, deviceInfo?: any): Promise<any> {
        const consultation = await this.getConsultationOrThrow(consultationId);
        this.assertRoomOpen(consultation);

        // Tìm participant record
        let participant = await TeleRoomRepository.findActiveParticipant(consultationId, userId);
        if (!participant) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, TELE_ROOM_ERRORS.NOT_PARTICIPANT.code, TELE_ROOM_ERRORS.NOT_PARTICIPANT.message);
        }

        if (participant.status === PARTICIPANT_STATUS.IN_ROOM) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_ROOM_ERRORS.ALREADY_IN_ROOM.code, TELE_ROOM_ERRORS.ALREADY_IN_ROOM.message);
        }

        // Cập nhật join
        await TeleRoomRepository.updateParticipant(participant.participant_id, {
            status: PARTICIPANT_STATUS.IN_ROOM,
            join_time: new Date(),
            device_info: deviceInfo ? JSON.stringify(deviceInfo) : participant.device_info,
        });

        // Nếu đây là GUEST đầu tiên join → room ONGOING
        if (consultation.room_status === TELE_ROOM_STATUS.WAITING) {
            await TeleRoomRepository.updateRoomStatus(consultationId, {
                room_status: TELE_ROOM_STATUS.ONGOING,
                actual_start_time: new Date(),
            });
        }

        // Cập nhật participant_count
        const inRoom = await TeleRoomRepository.countInRoom(consultationId);
        await TeleRoomRepository.updateRoomStatus(consultationId, { participant_count: inRoom });

        await TeleRoomRepository.createEvent({
            tele_consultation_id: consultationId,
            user_id: userId,
            event_type: ROOM_EVENT_TYPE.JOIN,
            event_data: deviceInfo,
        });

        return {
            participant,
            room_token: participant.room_token,
            join_url: consultation.join_url,
            meeting_id: consultation.meeting_id,
            platform: consultation.platform,
        };
    }

    /**
     * Rời phòng — ghi leave_time, tính duration
     */
    static async leaveRoom(consultationId: string, userId: string): Promise<any> {
        const consultation = await this.getConsultationOrThrow(consultationId);
        const participant = await TeleRoomRepository.findActiveParticipant(consultationId, userId);
        if (!participant || participant.status !== PARTICIPANT_STATUS.IN_ROOM) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_ROOM_ERRORS.NOT_IN_ROOM.code, TELE_ROOM_ERRORS.NOT_IN_ROOM.message);
        }

        const now = new Date();
        const joinMs = participant.join_time ? new Date(participant.join_time).getTime() : now.getTime();
        const durationAdd = Math.floor((now.getTime() - joinMs) / 1000);

        await TeleRoomRepository.updateParticipant(participant.participant_id, {
            status: PARTICIPANT_STATUS.LEFT,
            leave_time: now,
            duration_seconds: (participant.duration_seconds || 0) + durationAdd,
        });

        const inRoom = await TeleRoomRepository.countInRoom(consultationId);
        await TeleRoomRepository.updateRoomStatus(consultationId, { participant_count: inRoom });

        await TeleRoomRepository.createEvent({
            tele_consultation_id: consultationId,
            user_id: userId,
            event_type: ROOM_EVENT_TYPE.LEAVE,
        });

        return { left_at: now, duration_seconds: (participant.duration_seconds || 0) + durationAdd };
    }

    /**
     * Đóng phòng — kết thúc phiên, cập nhật encounter
     */
    static async closeRoom(consultationId: string, userId: string, endedReason?: string): Promise<any> {
        const consultation = await this.getConsultationOrThrow(consultationId);

        if (consultation.room_status === TELE_ROOM_STATUS.COMPLETED || consultation.room_status === TELE_ROOM_STATUS.MISSED) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_ROOM_ERRORS.ROOM_COMPLETED.code, TELE_ROOM_ERRORS.ROOM_COMPLETED.message);
        }

        const now = new Date();
        const startTime = consultation.actual_start_time || consultation.room_opened_at || now;
        const totalDuration = Math.floor((now.getTime() - new Date(startTime).getTime()) / 1000);

        // Kick tất cả participants ra
        await TeleRoomRepository.leaveAllParticipants(consultationId);

        // Kiểm tra phiên có dùng video/audio/chat/file
        const summary = await TeleRoomRepository.getRoomSummary(consultationId);

        // Cập nhật consultation
        await TeleRoomRepository.updateRoomStatus(consultationId, {
            room_status: TELE_ROOM_STATUS.COMPLETED,
            call_status: 'COMPLETED',
            room_closed_at: now,
            actual_end_time: now,
            total_duration_seconds: totalDuration,
            ended_reason: endedReason || 'NORMAL',
            has_chat: summary.messages_count > 0,
            has_file_sharing: summary.files_count > 0,
            network_issues_count: summary.network_issues,
        });

        // Cập nhật encounter status → COMPLETED
        if (consultation.encounter_id) {
            await pool.query(`UPDATE encounters SET status = 'COMPLETED', end_time = $1, updated_at = $1 WHERE encounters_id = $2`, [now, consultation.encounter_id]);
        }

        // Cập nhật appointment status → COMPLETED
        if (consultation.appointment_id) {
            await pool.query(`UPDATE appointments SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP WHERE appointments_id = $1`, [consultation.appointment_id]);
        }

        await TeleRoomRepository.createEvent({
            tele_consultation_id: consultationId,
            user_id: userId,
            event_type: ROOM_EVENT_TYPE.ROOM_CLOSED,
            event_data: { ended_reason: endedReason || 'NORMAL', total_duration_seconds: totalDuration },
        });

        return await TeleRoomRepository.getConsultationDetail(consultationId);
    }

    /** Chi tiết phòng */
    static async getRoomDetail(consultationId: string): Promise<any> {
        const detail = await this.getConsultationOrThrow(consultationId);
        const participants = await TeleRoomRepository.findParticipants(consultationId);
        return { ...detail, participants };
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 2: CHAT
    // ═══════════════════════════════════════════════════

    /** Gửi tin nhắn */
    static async sendMessage(consultationId: string, userId: string, input: SendMessageInput, userRoles?: string[]): Promise<any> {
        const consultation = await this.getConsultationOrThrow(consultationId);
        this.assertRoomOngoing(consultation);

        const senderType = userRoles?.includes('DOCTOR') ? 'DOCTOR' : userRoles?.includes('ADMIN') ? 'SYSTEM' : 'PATIENT';

        const message = await TeleRoomRepository.createMessage({
            tele_consultation_id: consultationId,
            sender_id: userId,
            sender_type: senderType,
            message_type: input.message_type || 'TEXT',
            content: input.content,
            file_url: input.file_url,
        });

        // Đánh dấu phiên có chat
        if (!consultation.has_chat) {
            await TeleRoomRepository.updateRoomStatus(consultationId, { has_chat: true });
        }

        return message;
    }

    /** Lịch sử chat */
    static async getMessages(consultationId: string, page: number = 1, limit: number = 50): Promise<any> {
        await this.getConsultationOrThrow(consultationId);
        const offset = (page - 1) * limit;
        return await TeleRoomRepository.findMessages(consultationId, limit, offset);
    }

    /** Đánh dấu đã đọc */
    static async markRead(consultationId: string, userId: string): Promise<number> {
        await this.getConsultationOrThrow(consultationId);
        return await TeleRoomRepository.markMessagesRead(consultationId, userId);
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 3: FILE SHARING
    // ═══════════════════════════════════════════════════

    /** Upload file */
    static async uploadFile(consultationId: string, userId: string, input: UploadFileInput): Promise<any> {
        const consultation = await this.getConsultationOrThrow(consultationId);
        this.assertRoomOngoing(consultation);

        const file = await TeleRoomRepository.createFile({
            tele_consultation_id: consultationId,
            uploaded_by: userId,
            file_name: input.file_name,
            file_url: input.file_url,
            file_type: input.file_type || SHARED_FILE_TYPE.DOCUMENT,
            file_size: input.file_size,
            mime_type: input.mime_type,
            thumbnail_url: input.thumbnail_url,
            description: input.description,
            is_medical_record: input.is_medical_record,
        });

        if (!consultation.has_file_sharing) {
            await TeleRoomRepository.updateRoomStatus(consultationId, { has_file_sharing: true });
        }

        await TeleRoomRepository.createEvent({
            tele_consultation_id: consultationId,
            user_id: userId,
            event_type: ROOM_EVENT_TYPE.FILE_SHARED,
            event_data: { file_id: file.file_id, file_name: input.file_name, file_type: input.file_type },
        });

        return file;
    }

    /** DS file */
    static async getFiles(consultationId: string): Promise<any[]> {
        await this.getConsultationOrThrow(consultationId);
        return await TeleRoomRepository.findFiles(consultationId);
    }

    /** Xóa file */
    static async deleteFile(consultationId: string, fileId: string, userId: string, isAdmin: boolean): Promise<void> {
        const file = await TeleRoomRepository.findFileById(fileId);
        if (!file) throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_ROOM_ERRORS.FILE_NOT_FOUND.code, TELE_ROOM_ERRORS.FILE_NOT_FOUND.message);
        if (file.uploaded_by !== userId && !isAdmin) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, TELE_ROOM_ERRORS.FILE_NOT_OWNER.code, TELE_ROOM_ERRORS.FILE_NOT_OWNER.message);
        }
        await TeleRoomRepository.deleteFile(fileId);
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 4: MEDIA CONTROLS
    // ═══════════════════════════════════════════════════

    /** Cập nhật trạng thái cam/mic/screen */
    static async updateMedia(consultationId: string, userId: string, input: UpdateMediaInput): Promise<any> {
        const consultation = await this.getConsultationOrThrow(consultationId);
        this.assertRoomOngoing(consultation);

        const participant = await TeleRoomRepository.findActiveParticipant(consultationId, userId);
        if (!participant || participant.status !== PARTICIPANT_STATUS.IN_ROOM) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_ROOM_ERRORS.NOT_IN_ROOM.code, TELE_ROOM_ERRORS.NOT_IN_ROOM.message);
        }

        const updateData: Record<string, any> = {};
        if (input.is_video_on !== undefined) updateData.is_video_on = input.is_video_on;
        if (input.is_audio_on !== undefined) updateData.is_audio_on = input.is_audio_on;
        if (input.is_screen_sharing !== undefined) updateData.is_screen_sharing = input.is_screen_sharing;

        await TeleRoomRepository.updateParticipant(participant.participant_id, updateData);

        // Ghi events cho toggle
        if (input.is_video_on !== undefined) {
            await TeleRoomRepository.createEvent({ tele_consultation_id: consultationId, user_id: userId, event_type: input.is_video_on ? ROOM_EVENT_TYPE.VIDEO_ON : ROOM_EVENT_TYPE.VIDEO_OFF });
            if (input.is_video_on && !consultation.has_video) await TeleRoomRepository.updateRoomStatus(consultationId, { has_video: true });
        }
        if (input.is_audio_on !== undefined) {
            await TeleRoomRepository.createEvent({ tele_consultation_id: consultationId, user_id: userId, event_type: input.is_audio_on ? ROOM_EVENT_TYPE.AUDIO_ON : ROOM_EVENT_TYPE.AUDIO_OFF });
            if (input.is_audio_on && !consultation.has_audio) await TeleRoomRepository.updateRoomStatus(consultationId, { has_audio: true });
        }
        if (input.is_screen_sharing !== undefined) {
            await TeleRoomRepository.createEvent({ tele_consultation_id: consultationId, user_id: userId, event_type: input.is_screen_sharing ? ROOM_EVENT_TYPE.SCREEN_SHARE_START : ROOM_EVENT_TYPE.SCREEN_SHARE_STOP });
        }

        return { ...participant, ...updateData };
    }

    /** DS participants */
    static async getParticipants(consultationId: string): Promise<any[]> {
        await this.getConsultationOrThrow(consultationId);
        return await TeleRoomRepository.findParticipants(consultationId);
    }

    /** Kick người dùng */
    static async kickUser(consultationId: string, targetUserId: string, kickedBy: string): Promise<void> {
        const consultation = await this.getConsultationOrThrow(consultationId);
        this.assertRoomOngoing(consultation);

        const target = await TeleRoomRepository.findActiveParticipant(consultationId, targetUserId);
        if (!target) throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_ROOM_ERRORS.TARGET_USER_NOT_FOUND.code, TELE_ROOM_ERRORS.TARGET_USER_NOT_FOUND.message);
        if (target.participant_role === PARTICIPANT_ROLE.HOST) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_ROOM_ERRORS.CANNOT_KICK_HOST.code, TELE_ROOM_ERRORS.CANNOT_KICK_HOST.message);
        }

        const now = new Date();
        const joinMs = target.join_time ? new Date(target.join_time).getTime() : now.getTime();
        const durationAdd = Math.floor((now.getTime() - joinMs) / 1000);

        await TeleRoomRepository.updateParticipant(target.participant_id, {
            status: PARTICIPANT_STATUS.KICKED,
            leave_time: now,
            duration_seconds: (target.duration_seconds || 0) + durationAdd,
        });

        const inRoom = await TeleRoomRepository.countInRoom(consultationId);
        await TeleRoomRepository.updateRoomStatus(consultationId, { participant_count: inRoom });

        await TeleRoomRepository.createEvent({
            tele_consultation_id: consultationId,
            user_id: kickedBy,
            event_type: ROOM_EVENT_TYPE.KICKED,
            event_data: { kicked_user_id: targetUserId },
        });
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 5: EVENTS & THỐNG KÊ
    // ═══════════════════════════════════════════════════

    /** Activity log */
    static async getEvents(consultationId: string, page: number = 1, limit: number = 100): Promise<any> {
        await this.getConsultationOrThrow(consultationId);
        const offset = (page - 1) * limit;
        return await TeleRoomRepository.findEvents(consultationId, limit, offset);
    }

    /** Report network quality */
    static async reportNetwork(consultationId: string, userId: string, quality: string, details?: any): Promise<void> {
        const consultation = await this.getConsultationOrThrow(consultationId);
        const participant = await TeleRoomRepository.findActiveParticipant(consultationId, userId);
        if (participant) {
            await TeleRoomRepository.updateParticipant(participant.participant_id, { connection_quality: quality });
        }

        if (quality === 'POOR' || quality === 'FAIR') {
            await TeleRoomRepository.createEvent({
                tele_consultation_id: consultationId,
                user_id: userId,
                event_type: ROOM_EVENT_TYPE.NETWORK_ISSUE,
                event_data: { quality, ...details },
            });
            await TeleRoomRepository.updateRoomStatus(consultationId, {
                network_issues_count: (consultation.network_issues_count || 0) + 1,
            });
        }
    }

    /** Tổng kết phiên */
    static async getRoomSummary(consultationId: string): Promise<any> {
        const detail = await this.getConsultationOrThrow(consultationId);
        const summary = await TeleRoomRepository.getRoomSummary(consultationId);
        const participants = await TeleRoomRepository.findParticipants(consultationId);
        return { consultation: detail, summary, participants };
    }

    /** DS phòng đang hoạt động */
    static async getActiveRooms(): Promise<any[]> {
        return await TeleRoomRepository.findActiveRooms();
    }

    // ═══════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════

    private static async getConsultationOrThrow(consultationId: string): Promise<any> {
        const c = await TeleRoomRepository.getConsultationDetail(consultationId);
        if (!c) throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_ROOM_ERRORS.CONSULTATION_NOT_FOUND.code, TELE_ROOM_ERRORS.CONSULTATION_NOT_FOUND.message);
        return c;
    }

    private static assertRoomOpen(consultation: any): void {
        if (!consultation.room_status || consultation.room_status === TELE_ROOM_STATUS.SCHEDULED) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_ROOM_ERRORS.ROOM_NOT_OPEN.code, TELE_ROOM_ERRORS.ROOM_NOT_OPEN.message);
        }
        if (consultation.room_status === TELE_ROOM_STATUS.COMPLETED || consultation.room_status === TELE_ROOM_STATUS.MISSED) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_ROOM_ERRORS.ROOM_COMPLETED.code, TELE_ROOM_ERRORS.ROOM_COMPLETED.message);
        }
    }

    private static assertRoomOngoing(consultation: any): void {
        if (consultation.room_status !== TELE_ROOM_STATUS.ONGOING && consultation.room_status !== TELE_ROOM_STATUS.WAITING) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_ROOM_ERRORS.ROOM_NOT_ONGOING.code, TELE_ROOM_ERRORS.ROOM_NOT_ONGOING.message);
        }
    }

    private static generateRoomToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }
}
