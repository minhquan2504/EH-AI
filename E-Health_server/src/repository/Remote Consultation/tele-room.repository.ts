import { pool } from '../../config/postgresdb';
import { TeleRoomParticipant, TeleRoomEvent, TeleSharedFile, TeleRoomDetail } from '../../models/Remote Consultation/tele-room.model';
import { v4 as uuidv4 } from 'uuid';

/**
 * Data Access Layer cho phòng khám trực tuyến
 * Quản lý: tele_consultations (room), participants, events, messages, files
 */
export class TeleRoomRepository {

    // ═══════════════════════════════════════════════════
    // CONSULTATION / ROOM
    // ═══════════════════════════════════════════════════

    /** Lấy chi tiết phòng khám với JOIN đầy đủ */
    static async getConsultationDetail(consultationId: string): Promise<TeleRoomDetail | null> {
        const r = await pool.query(`
            SELECT tc.*,
                up_doc.full_name AS doctor_name,
                up_pat.full_name AS patient_name,
                sp.name AS specialty_name,
                tct.name AS type_name,
                tbs.session_code AS booking_session_code,
                apt.appointment_code
            FROM tele_consultations tc
            LEFT JOIN encounters enc ON tc.encounter_id = enc.encounters_id
            LEFT JOIN doctors doc ON enc.doctor_id = doc.doctors_id
            LEFT JOIN user_profiles up_doc ON doc.user_id = up_doc.user_id
            LEFT JOIN patients pat ON enc.patient_id = pat.id::varchar
            LEFT JOIN user_profiles up_pat ON pat.account_id = up_pat.user_id
            LEFT JOIN tele_booking_sessions tbs ON tc.booking_session_id = tbs.session_id
            LEFT JOIN tele_consultation_types tct ON tc.consultation_type_id = tct.type_id
            LEFT JOIN specialties sp ON tbs.specialty_id = sp.specialties_id
            LEFT JOIN appointments apt ON tc.appointment_id = apt.appointments_id
            WHERE tc.tele_consultations_id = $1
        `, [consultationId]);
        return r.rows[0] || null;
    }

    /** Cập nhật trạng thái phòng */
    static async updateRoomStatus(consultationId: string, data: Record<string, any>): Promise<void> {
        const setClauses: string[] = [];
        const values: any[] = [];
        let idx = 1;
        for (const [key, val] of Object.entries(data)) {
            setClauses.push(`${key} = $${idx++}`);
            values.push(val);
        }
        if (setClauses.length === 0) return;
        values.push(consultationId);
        await pool.query(`UPDATE tele_consultations SET ${setClauses.join(', ')} WHERE tele_consultations_id = $${idx}`, values);
    }

    /** DS phòng đang hoạt động */
    static async findActiveRooms(): Promise<TeleRoomDetail[]> {
        const r = await pool.query(`
            SELECT tc.*,
                up_doc.full_name AS doctor_name,
                up_pat.full_name AS patient_name,
                tct.name AS type_name,
                apt.appointment_code
            FROM tele_consultations tc
            LEFT JOIN encounters enc ON tc.encounter_id = enc.encounters_id
            LEFT JOIN doctors doc ON enc.doctor_id = doc.doctors_id
            LEFT JOIN user_profiles up_doc ON doc.user_id = up_doc.user_id
            LEFT JOIN patients pat ON enc.patient_id = pat.id::varchar
            LEFT JOIN user_profiles up_pat ON pat.account_id = up_pat.user_id
            LEFT JOIN tele_consultation_types tct ON tc.consultation_type_id = tct.type_id
            LEFT JOIN appointments apt ON tc.appointment_id = apt.appointments_id
            WHERE tc.room_status IN ('WAITING','ONGOING')
            ORDER BY tc.room_opened_at DESC
        `);
        return r.rows;
    }

    // ═══════════════════════════════════════════════════
    // PARTICIPANTS
    // ═══════════════════════════════════════════════════

    /** Tạo participant */
    static async createParticipant(data: {
        participant_id: string;
        tele_consultation_id: string;
        user_id: string;
        participant_role: string;
        room_token: string;
        token_expires_at: Date;
        status: string;
        device_info?: any;
    }): Promise<TeleRoomParticipant> {
        const r = await pool.query(`
            INSERT INTO tele_room_participants (
                participant_id, tele_consultation_id, user_id, participant_role,
                room_token, token_expires_at, status, device_info
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [
            data.participant_id, data.tele_consultation_id, data.user_id,
            data.participant_role, data.room_token, data.token_expires_at,
            data.status, data.device_info ? JSON.stringify(data.device_info) : null,
        ]);
        return r.rows[0];
    }

    /** Tìm participant active (WAITING/IN_ROOM) */
    static async findActiveParticipant(consultationId: string, userId: string): Promise<TeleRoomParticipant | null> {
        const r = await pool.query(`
            SELECT * FROM tele_room_participants
            WHERE tele_consultation_id = $1 AND user_id = $2 AND status IN ('WAITING','IN_ROOM')
            LIMIT 1
        `, [consultationId, userId]);
        return r.rows[0] || null;
    }

    /** Cập nhật participant */
    static async updateParticipant(participantId: string, data: Record<string, any>): Promise<void> {
        const setClauses: string[] = [];
        const values: any[] = [];
        let idx = 1;
        for (const [key, val] of Object.entries(data)) {
            setClauses.push(`${key} = $${idx++}`);
            values.push(val);
        }
        setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(participantId);
        await pool.query(`UPDATE tele_room_participants SET ${setClauses.join(', ')} WHERE participant_id = $${idx}`, values);
    }

    /** DS participants của phiên */
    static async findParticipants(consultationId: string): Promise<TeleRoomParticipant[]> {
        const r = await pool.query(`
            SELECT trp.*, up.full_name
            FROM tele_room_participants trp
            JOIN user_profiles up ON trp.user_id = up.user_id
            WHERE trp.tele_consultation_id = $1
            ORDER BY trp.created_at ASC
        `, [consultationId]);
        return r.rows;
    }

    /** Đếm participant đang IN_ROOM */
    static async countInRoom(consultationId: string): Promise<number> {
        const r = await pool.query(`
            SELECT COUNT(*)::int AS cnt FROM tele_room_participants
            WHERE tele_consultation_id = $1 AND status = 'IN_ROOM'
        `, [consultationId]);
        return r.rows[0].cnt;
    }

    /** Batch update tất cả IN_ROOM → LEFT khi đóng phòng */
    static async leaveAllParticipants(consultationId: string): Promise<void> {
        await pool.query(`
            UPDATE tele_room_participants
            SET status = 'LEFT', leave_time = CURRENT_TIMESTAMP,
                duration_seconds = COALESCE(duration_seconds, 0) + COALESCE(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - join_time))::int, 0),
                updated_at = CURRENT_TIMESTAMP
            WHERE tele_consultation_id = $1 AND status = 'IN_ROOM'
        `, [consultationId]);
    }

    // ═══════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════

    /** Ghi event */
    static async createEvent(data: {
        tele_consultation_id: string;
        user_id?: string;
        event_type: string;
        event_data?: any;
    }): Promise<TeleRoomEvent> {
        const eventId = `TRE_${uuidv4().substring(0, 12)}`;
        const r = await pool.query(`
            INSERT INTO tele_room_events (event_id, tele_consultation_id, user_id, event_type, event_data)
            VALUES ($1, $2, $3, $4, $5) RETURNING *
        `, [eventId, data.tele_consultation_id, data.user_id || null, data.event_type,
            data.event_data ? JSON.stringify(data.event_data) : null]);
        return r.rows[0];
    }

    /** DS events của phiên */
    static async findEvents(consultationId: string, limit: number = 100, offset: number = 0): Promise<{ data: TeleRoomEvent[]; total: number }> {
        const countR = await pool.query(`SELECT COUNT(*)::int AS total FROM tele_room_events WHERE tele_consultation_id = $1`, [consultationId]);
        const r = await pool.query(`
            SELECT tre.*, up.full_name
            FROM tele_room_events tre
            LEFT JOIN user_profiles up ON tre.user_id = up.user_id
            WHERE tre.tele_consultation_id = $1
            ORDER BY tre.created_at ASC
            LIMIT $2 OFFSET $3
        `, [consultationId, limit, offset]);
        return { data: r.rows, total: countR.rows[0].total };
    }

    // ═══════════════════════════════════════════════════
    // MESSAGES (sử dụng bảng tele_messages hiện có)
    // ═══════════════════════════════════════════════════

    /** Gửi tin nhắn */
    static async createMessage(data: {
        tele_consultation_id: string;
        sender_id: string;
        sender_type: string;
        message_type: string;
        content?: string;
        file_url?: string;
    }): Promise<any> {
        const msgId = `TMSG_${uuidv4().substring(0, 12)}`;
        const r = await pool.query(`
            INSERT INTO tele_messages (tele_messages_id, tele_consultation_id, sender_id, sender_type, message_type, content, file_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
        `, [msgId, data.tele_consultation_id, data.sender_id, data.sender_type, data.message_type,
            data.content || null, data.file_url || null]);
        return r.rows[0];
    }

    /** DS tin nhắn (phân trang) */
    static async findMessages(consultationId: string, limit: number = 50, offset: number = 0): Promise<{ data: any[]; total: number }> {
        const countR = await pool.query(`SELECT COUNT(*)::int AS total FROM tele_messages WHERE tele_consultation_id = $1`, [consultationId]);
        const r = await pool.query(`
            SELECT tm.*, up.full_name AS sender_name
            FROM tele_messages tm
            LEFT JOIN user_profiles up ON tm.sender_id = up.user_id
            WHERE tm.tele_consultation_id = $1
            ORDER BY tm.sent_at ASC
            LIMIT $2 OFFSET $3
        `, [consultationId, limit, offset]);
        return { data: r.rows, total: countR.rows[0].total };
    }

    /** Mark read */
    static async markMessagesRead(consultationId: string, userId: string): Promise<number> {
        const r = await pool.query(`
            UPDATE tele_messages SET is_read = TRUE
            WHERE tele_consultation_id = $1 AND sender_id != $2 AND is_read = FALSE
        `, [consultationId, userId]);
        return r.rowCount ?? 0;
    }

    // ═══════════════════════════════════════════════════
    // FILES
    // ═══════════════════════════════════════════════════

    /** Tạo file */
    static async createFile(data: {
        tele_consultation_id: string;
        uploaded_by: string;
        file_name: string;
        file_url: string;
        file_type: string;
        file_size?: number;
        mime_type?: string;
        thumbnail_url?: string;
        description?: string;
        is_medical_record?: boolean;
    }): Promise<TeleSharedFile> {
        const fileId = `TSF_${uuidv4().substring(0, 12)}`;
        const r = await pool.query(`
            INSERT INTO tele_shared_files (
                file_id, tele_consultation_id, uploaded_by, file_name, file_url,
                file_type, file_size, mime_type, thumbnail_url, description, is_medical_record
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *
        `, [
            fileId, data.tele_consultation_id, data.uploaded_by, data.file_name, data.file_url,
            data.file_type, data.file_size || null, data.mime_type || null,
            data.thumbnail_url || null, data.description || null, data.is_medical_record || false,
        ]);
        return r.rows[0];
    }

    /** DS file của phiên */
    static async findFiles(consultationId: string): Promise<TeleSharedFile[]> {
        const r = await pool.query(`
            SELECT tsf.*, up.full_name AS uploader_name
            FROM tele_shared_files tsf
            LEFT JOIN user_profiles up ON tsf.uploaded_by = up.user_id
            WHERE tsf.tele_consultation_id = $1
            ORDER BY tsf.created_at ASC
        `, [consultationId]);
        return r.rows;
    }

    /** Tìm file theo ID */
    static async findFileById(fileId: string): Promise<TeleSharedFile | null> {
        const r = await pool.query(`SELECT * FROM tele_shared_files WHERE file_id = $1`, [fileId]);
        return r.rows[0] || null;
    }

    /** Xóa file */
    static async deleteFile(fileId: string): Promise<void> {
        await pool.query(`DELETE FROM tele_shared_files WHERE file_id = $1`, [fileId]);
    }

    // ═══════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════

    /** Tổng kết phiên */
    static async getRoomSummary(consultationId: string): Promise<any> {
        const [participantsR, eventsR, messagesR, filesR, networkR] = await Promise.all([
            pool.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'IN_ROOM')::int AS in_room FROM tele_room_participants WHERE tele_consultation_id = $1`, [consultationId]),
            pool.query(`SELECT COUNT(*)::int AS total FROM tele_room_events WHERE tele_consultation_id = $1`, [consultationId]),
            pool.query(`SELECT COUNT(*)::int AS total FROM tele_messages WHERE tele_consultation_id = $1`, [consultationId]),
            pool.query(`SELECT COUNT(*)::int AS total FROM tele_shared_files WHERE tele_consultation_id = $1`, [consultationId]),
            pool.query(`SELECT COUNT(*)::int AS total FROM tele_room_events WHERE tele_consultation_id = $1 AND event_type = 'NETWORK_ISSUE'`, [consultationId]),
        ]);
        return {
            participants: participantsR.rows[0],
            events_count: eventsR.rows[0].total,
            messages_count: messagesR.rows[0].total,
            files_count: filesR.rows[0].total,
            network_issues: networkR.rows[0].total,
        };
    }
}
