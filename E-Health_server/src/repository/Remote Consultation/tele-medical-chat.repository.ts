import { pool } from '../../config/postgresdb';
import { MedicalConversation, MedicalChatMessage, MedicalChatAttachment, ConversationFilter } from '../../models/Remote Consultation/tele-medical-chat.model';
import { v4 as uuidv4 } from 'uuid';

/**
 * Data Access Layer cho trao đổi thông tin y tế (async medical chat)
 */
export class MedicalChatRepository {

    // ═══════════════════════════════════════════════════
    // CONVERSATIONS
    // ═══════════════════════════════════════════════════

    static async createConversation(data: Record<string, any>): Promise<MedicalConversation> {
        const r = await pool.query(`
            INSERT INTO medical_conversations (
                conversation_id, patient_id, doctor_id, specialty_id,
                appointment_id, encounter_id, subject, priority, is_patient_initiated
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
        `, [
            data.conversation_id, data.patient_id, data.doctor_id,
            data.specialty_id || null, data.appointment_id || null,
            data.encounter_id || null, data.subject || null,
            data.priority || 'NORMAL', data.is_patient_initiated || false,
        ]);
        return r.rows[0];
    }

    /** Tìm conversation active giữa BN + BS (kiểm tra trùng) */
    static async findActiveConversation(patientId: string, doctorId: string): Promise<MedicalConversation | null> {
        const r = await pool.query(`
            SELECT * FROM medical_conversations
            WHERE patient_id = $1 AND doctor_id = $2 AND status = 'ACTIVE'
            LIMIT 1
        `, [patientId, doctorId]);
        return r.rows[0] || null;
    }

    /** Chi tiết conversation với JOINed data */
    static async findById(conversationId: string): Promise<MedicalConversation | null> {
        const r = await pool.query(`
            SELECT mc.*,
                up_pat.full_name AS patient_name,
                up_doc.full_name AS doctor_name,
                sp.name AS specialty_name
            FROM medical_conversations mc
            LEFT JOIN patients p ON mc.patient_id = p.id::varchar
            LEFT JOIN user_profiles up_pat ON p.account_id = up_pat.user_id
            LEFT JOIN doctors d ON mc.doctor_id = d.doctors_id
            LEFT JOIN user_profiles up_doc ON d.user_id = up_doc.user_id
            LEFT JOIN specialties sp ON mc.specialty_id = sp.specialties_id
            WHERE mc.conversation_id = $1
        `, [conversationId]);
        return r.rows[0] || null;
    }

    /** DS conversations (phân trang + filter) */
    static async findAll(filters: ConversationFilter): Promise<{ data: MedicalConversation[]; total: number }> {
        let where = 'WHERE 1=1';
        const params: any[] = [];
        let idx = 1;

        if (filters.patient_id) { where += ` AND mc.patient_id = $${idx++}`; params.push(filters.patient_id); }
        if (filters.doctor_id) { where += ` AND mc.doctor_id = $${idx++}`; params.push(filters.doctor_id); }
        if (filters.status) { where += ` AND mc.status = $${idx++}`; params.push(filters.status); }
        if (filters.priority) { where += ` AND mc.priority = $${idx++}`; params.push(filters.priority); }
        if (filters.keyword) {
            where += ` AND (mc.subject ILIKE $${idx} OR up_pat.full_name ILIKE $${idx} OR up_doc.full_name ILIKE $${idx})`;
            params.push(`%${filters.keyword}%`); idx++;
        }

        const countR = await pool.query(`
            SELECT COUNT(*)::int AS total
            FROM medical_conversations mc
            LEFT JOIN patients p ON mc.patient_id = p.id::varchar
            LEFT JOIN user_profiles up_pat ON p.account_id = up_pat.user_id
            LEFT JOIN doctors d ON mc.doctor_id = d.doctors_id
            LEFT JOIN user_profiles up_doc ON d.user_id = up_doc.user_id
            ${where}
        `, params);

        const offset = (filters.page - 1) * filters.limit;
        const r = await pool.query(`
            SELECT mc.*,
                up_pat.full_name AS patient_name,
                up_doc.full_name AS doctor_name,
                sp.name AS specialty_name
            FROM medical_conversations mc
            LEFT JOIN patients p ON mc.patient_id = p.id::varchar
            LEFT JOIN user_profiles up_pat ON p.account_id = up_pat.user_id
            LEFT JOIN doctors d ON mc.doctor_id = d.doctors_id
            LEFT JOIN user_profiles up_doc ON d.user_id = up_doc.user_id
            LEFT JOIN specialties sp ON mc.specialty_id = sp.specialties_id
            ${where}
            ORDER BY mc.last_message_at DESC NULLS LAST, mc.created_at DESC
            LIMIT $${idx++} OFFSET $${idx}
        `, [...params, filters.limit, offset]);

        return { data: r.rows, total: countR.rows[0].total };
    }

    /** Cập nhật conversation */
    static async updateConversation(conversationId: string, data: Record<string, any>): Promise<void> {
        const setClauses: string[] = [];
        const values: any[] = [];
        let idx = 1;
        for (const [key, val] of Object.entries(data)) {
            setClauses.push(`${key} = $${idx++}`);
            values.push(val);
        }
        setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(conversationId);
        await pool.query(`UPDATE medical_conversations SET ${setClauses.join(', ')} WHERE conversation_id = $${idx}`, values);
    }

    /** Validate patient exists */
    static async patientExists(patientId: string): Promise<boolean> {
        const r = await pool.query(`SELECT 1 FROM patients WHERE id::varchar = $1 LIMIT 1`, [patientId]);
        return r.rowCount !== null && r.rowCount > 0;
    }

    /** Validate doctor exists */
    static async doctorExists(doctorId: string): Promise<boolean> {
        const r = await pool.query(`SELECT 1 FROM doctors WHERE doctors_id = $1 LIMIT 1`, [doctorId]);
        return r.rowCount !== null && r.rowCount > 0;
    }

    /** DS BN đang chat với BS (cho /my-patients) */
    static async findPatientsByDoctor(doctorId: string): Promise<any[]> {
        const r = await pool.query(`
            SELECT DISTINCT mc.patient_id, up.full_name AS patient_name,
                mc.last_message_at, mc.unread_count_doctor,
                mc.conversation_id, mc.subject, mc.status, mc.priority
            FROM medical_conversations mc
            LEFT JOIN patients p ON mc.patient_id = p.id::varchar
            LEFT JOIN user_profiles up ON p.account_id = up.user_id
            WHERE mc.doctor_id = $1 AND mc.status = 'ACTIVE'
            ORDER BY mc.last_message_at DESC NULLS LAST
        `, [doctorId]);
        return r.rows;
    }

    // ═══════════════════════════════════════════════════
    // MESSAGES
    // ═══════════════════════════════════════════════════

    static async createMessage(data: Record<string, any>): Promise<MedicalChatMessage> {
        const r = await pool.query(`
            INSERT INTO medical_chat_messages (
                message_id, conversation_id, sender_id, sender_type,
                message_type, content, reply_to_id, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
        `, [
            data.message_id, data.conversation_id, data.sender_id, data.sender_type,
            data.message_type || 'TEXT', data.content || null,
            data.reply_to_id || null, data.metadata ? JSON.stringify(data.metadata) : null,
        ]);
        return r.rows[0];
    }

    /** DS tin nhắn (phân trang, bỏ deleted) */
    static async findMessages(conversationId: string, limit: number, offset: number): Promise<{ data: MedicalChatMessage[]; total: number }> {
        const countR = await pool.query(`
            SELECT COUNT(*)::int AS total FROM medical_chat_messages
            WHERE conversation_id = $1 AND is_deleted = FALSE
        `, [conversationId]);

        const r = await pool.query(`
            SELECT mcm.*, up.full_name AS sender_name
            FROM medical_chat_messages mcm
            LEFT JOIN user_profiles up ON mcm.sender_id = up.user_id
            WHERE mcm.conversation_id = $1 AND mcm.is_deleted = FALSE
            ORDER BY mcm.sent_at ASC
            LIMIT $2 OFFSET $3
        `, [conversationId, limit, offset]);

        // Load attachments cho mỗi message
        for (const msg of r.rows) {
            const attR = await pool.query(`SELECT * FROM medical_chat_attachments WHERE message_id = $1`, [msg.message_id]);
            msg.attachments = attR.rows;
        }

        return { data: r.rows, total: countR.rows[0].total };
    }

    /** Tìm message theo ID */
    static async findMessageById(messageId: string): Promise<MedicalChatMessage | null> {
        const r = await pool.query(`SELECT * FROM medical_chat_messages WHERE message_id = $1`, [messageId]);
        return r.rows[0] || null;
    }

    /** Cập nhật message */
    static async updateMessage(messageId: string, data: Record<string, any>): Promise<void> {
        const setClauses: string[] = [];
        const values: any[] = [];
        let idx = 1;
        for (const [key, val] of Object.entries(data)) {
            setClauses.push(`${key} = $${idx++}`);
            values.push(val);
        }
        values.push(messageId);
        await pool.query(`UPDATE medical_chat_messages SET ${setClauses.join(', ')} WHERE message_id = $${idx}`, values);
    }

    /** Đánh dấu đã đọc tin nhắn của đối phương */
    static async markMessagesRead(conversationId: string, readerId: string): Promise<number> {
        const r = await pool.query(`
            UPDATE medical_chat_messages SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
            WHERE conversation_id = $1 AND sender_id != $2 AND is_read = FALSE AND is_deleted = FALSE
        `, [conversationId, readerId]);
        return r.rowCount ?? 0;
    }

    /** DS tin nhắn đã ghim */
    static async findPinnedMessages(conversationId: string): Promise<MedicalChatMessage[]> {
        const r = await pool.query(`
            SELECT mcm.*, up.full_name AS sender_name
            FROM medical_chat_messages mcm
            LEFT JOIN user_profiles up ON mcm.sender_id = up.user_id
            WHERE mcm.conversation_id = $1 AND mcm.is_pinned = TRUE AND mcm.is_deleted = FALSE
            ORDER BY mcm.sent_at ASC
        `, [conversationId]);
        for (const msg of r.rows) {
            const attR = await pool.query(`SELECT * FROM medical_chat_attachments WHERE message_id = $1`, [msg.message_id]);
            msg.attachments = attR.rows;
        }
        return r.rows;
    }

    // ═══════════════════════════════════════════════════
    // ATTACHMENTS
    // ═══════════════════════════════════════════════════

    static async createAttachment(data: Record<string, any>): Promise<MedicalChatAttachment> {
        const r = await pool.query(`
            INSERT INTO medical_chat_attachments (
                attachment_id, message_id, file_name, file_url,
                file_type, file_size, mime_type, thumbnail_url, is_medical_record
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
        `, [
            data.attachment_id, data.message_id, data.file_name, data.file_url,
            data.file_type || 'DOCUMENT', data.file_size || null,
            data.mime_type || null, data.thumbnail_url || null,
            data.is_medical_record || false,
        ]);
        return r.rows[0];
    }

    /** DS attachments của conversation */
    static async findAttachments(conversationId: string): Promise<MedicalChatAttachment[]> {
        const r = await pool.query(`
            SELECT mca.*, up.full_name AS uploader_name
            FROM medical_chat_attachments mca
            JOIN medical_chat_messages mcm ON mca.message_id = mcm.message_id
            LEFT JOIN user_profiles up ON mcm.sender_id = up.user_id
            WHERE mcm.conversation_id = $1 AND mcm.is_deleted = FALSE
            ORDER BY mca.created_at ASC
        `, [conversationId]);
        return r.rows;
    }

    /** DS attachments y tế (is_medical_record = true) */
    static async findMedicalAttachments(conversationId: string): Promise<MedicalChatAttachment[]> {
        const r = await pool.query(`
            SELECT mca.*, up.full_name AS uploader_name
            FROM medical_chat_attachments mca
            JOIN medical_chat_messages mcm ON mca.message_id = mcm.message_id
            LEFT JOIN user_profiles up ON mcm.sender_id = up.user_id
            WHERE mcm.conversation_id = $1 AND mca.is_medical_record = TRUE AND mcm.is_deleted = FALSE
            ORDER BY mca.created_at ASC
        `, [conversationId]);
        return r.rows;
    }

    // ═══════════════════════════════════════════════════
    // STATS
    // ═══════════════════════════════════════════════════

    /** Đếm unread cho user (tổng từ tất cả conversations) */
    static async getUnreadCount(userId: string, userRole: 'DOCTOR' | 'PATIENT'): Promise<number> {
        const field = userRole === 'DOCTOR' ? 'unread_count_doctor' : 'unread_count_patient';
        const joinField = userRole === 'DOCTOR' ? 'doctor_id' : 'patient_id';

        let idQuery: string;
        if (userRole === 'DOCTOR') {
            idQuery = `SELECT doctors_id FROM doctors WHERE user_id = $1 LIMIT 1`;
        } else {
            idQuery = `SELECT id::varchar AS doctors_id FROM patients WHERE account_id = $1 LIMIT 1`;
        }
        const idR = await pool.query(idQuery, [userId]);
        const entityId = idR.rows[0]?.doctors_id;
        if (!entityId) return 0;

        const r = await pool.query(`
            SELECT COALESCE(SUM(${field}), 0)::int AS total
            FROM medical_conversations
            WHERE ${joinField} = $1 AND status = 'ACTIVE'
        `, [entityId]);
        return r.rows[0].total;
    }
}
