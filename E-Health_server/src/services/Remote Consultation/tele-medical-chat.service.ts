import { MedicalChatRepository } from '../../repository/Remote Consultation/tele-medical-chat.repository';
import { CreateConversationInput, SendMedChatMessageInput, ConversationFilter } from '../../models/Remote Consultation/tele-medical-chat.model';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import {
    MED_CHAT_STATUS, MED_CHAT_ERRORS, MED_CHAT_FILE_TYPE,
    REMOTE_CONSULTATION_CONFIG,
} from '../../constants/remote-consultation.constant';
import { pool } from '../../config/postgresdb';
import { v4 as uuidv4 } from 'uuid';

/**
 * Business Logic Layer cho trao đổi thông tin y tế (async medical chat)
 * Quản lý conversations, messages (với attachments), access control
 */
export class MedicalChatService {

    // ═══════════════════════════════════════════════════
    // NHÓM 1: CONVERSATIONS
    // ═══════════════════════════════════════════════════

    /**
     * Tạo cuộc hội thoại BS↔BN
     * Validate BN + BS tồn tại, kiểm tra trùng active conversation
     */
    static async createConversation(input: CreateConversationInput, userId: string, isPatient: boolean): Promise<any> {
        if (!input.patient_id || !input.doctor_id) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, MED_CHAT_ERRORS.MISSING_REQUIRED.code, MED_CHAT_ERRORS.MISSING_REQUIRED.message);
        }

        const patientExists = await MedicalChatRepository.patientExists(input.patient_id);
        if (!patientExists) throw new AppError(HTTP_STATUS.NOT_FOUND, MED_CHAT_ERRORS.PATIENT_NOT_FOUND.code, MED_CHAT_ERRORS.PATIENT_NOT_FOUND.message);

        const doctorExists = await MedicalChatRepository.doctorExists(input.doctor_id);
        if (!doctorExists) throw new AppError(HTTP_STATUS.NOT_FOUND, MED_CHAT_ERRORS.DOCTOR_NOT_FOUND.code, MED_CHAT_ERRORS.DOCTOR_NOT_FOUND.message);

        // Kiểm tra trùng conversation ACTIVE
        const existing = await MedicalChatRepository.findActiveConversation(input.patient_id, input.doctor_id);
        if (existing) {
            throw new AppError(HTTP_STATUS.CONFLICT, MED_CHAT_ERRORS.DUPLICATE_CONVERSATION.code, MED_CHAT_ERRORS.DUPLICATE_CONVERSATION.message);
        }

        const conversationId = `CONV_${uuidv4().substring(0, 12)}`;
        const conversation = await MedicalChatRepository.createConversation({
            conversation_id: conversationId,
            patient_id: input.patient_id,
            doctor_id: input.doctor_id,
            specialty_id: input.specialty_id,
            appointment_id: input.appointment_id,
            encounter_id: input.encounter_id,
            subject: input.subject,
            priority: input.priority,
            is_patient_initiated: isPatient,
        });

        return await MedicalChatRepository.findById(conversationId);
    }

    /** DS cuộc hội thoại (filter theo role) */
    static async listConversations(filters: ConversationFilter, userId: string, roles: string[]): Promise<any> {
        // Nếu PATIENT → chỉ xem conversation mình tham gia
        if (roles.includes('PATIENT') && !roles.includes('ADMIN')) {
            const patR = await pool.query(`SELECT id::varchar AS pid FROM patients WHERE account_id = $1 LIMIT 1`, [userId]);
            if (patR.rows[0]) filters.patient_id = patR.rows[0].pid;
        }
        // Nếu DOCTOR → chỉ xem conversation mình tham gia
        if (roles.includes('DOCTOR') && !roles.includes('ADMIN')) {
            const docR = await pool.query(`SELECT doctors_id FROM doctors WHERE user_id = $1 LIMIT 1`, [userId]);
            if (docR.rows[0]) filters.doctor_id = docR.rows[0].doctors_id;
        }

        return await MedicalChatRepository.findAll(filters);
    }

    /** Chi tiết conversation (kiểm tra quyền truy cập) */
    static async getConversation(conversationId: string, userId: string, roles: string[]): Promise<any> {
        const conversation = await this.getConversationOrThrow(conversationId);
        await this.assertAccess(conversation, userId, roles);
        return conversation;
    }

    /** Đóng conversation */
    static async closeConversation(conversationId: string, userId: string): Promise<void> {
        const conversation = await this.getConversationOrThrow(conversationId);
        if (conversation.status === MED_CHAT_STATUS.CLOSED) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, MED_CHAT_ERRORS.CONVERSATION_CLOSED.code, MED_CHAT_ERRORS.CONVERSATION_CLOSED.message);
        }

        await MedicalChatRepository.updateConversation(conversationId, {
            status: MED_CHAT_STATUS.CLOSED,
            closed_at: new Date(),
            closed_by: userId,
        });
    }

    /** Mở lại conversation */
    static async reopenConversation(conversationId: string): Promise<void> {
        const conversation = await this.getConversationOrThrow(conversationId);
        if (conversation.status === MED_CHAT_STATUS.ACTIVE) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, MED_CHAT_ERRORS.CONVERSATION_ALREADY_ACTIVE.code, MED_CHAT_ERRORS.CONVERSATION_ALREADY_ACTIVE.message);
        }

        await MedicalChatRepository.updateConversation(conversationId, {
            status: MED_CHAT_STATUS.ACTIVE,
            closed_at: null,
            closed_by: null,
        });
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 2: MESSAGES
    // ═══════════════════════════════════════════════════

    /**
     * Gửi tin nhắn + attachments (nếu có)
     * Cập nhật last_message, unread_count
     */
    static async sendMessage(conversationId: string, userId: string, roles: string[], input: SendMedChatMessageInput): Promise<any> {
        const conversation = await this.getConversationOrThrow(conversationId);
        await this.assertAccess(conversation, userId, roles);

        if (conversation.status !== MED_CHAT_STATUS.ACTIVE) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, MED_CHAT_ERRORS.CONVERSATION_CLOSED.code, MED_CHAT_ERRORS.CONVERSATION_CLOSED.message);
        }

        if (!input.content && (!input.attachments || input.attachments.length === 0)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, MED_CHAT_ERRORS.MISSING_CONTENT.code, MED_CHAT_ERRORS.MISSING_CONTENT.message);
        }

        const senderType = roles.includes('DOCTOR') ? 'DOCTOR' : roles.includes('ADMIN') ? 'SYSTEM' : 'PATIENT';
        const messageId = `MCM_${uuidv4().substring(0, 12)}`;

        const message = await MedicalChatRepository.createMessage({
            message_id: messageId,
            conversation_id: conversationId,
            sender_id: userId,
            sender_type: senderType,
            message_type: input.message_type || 'TEXT',
            content: input.content,
            reply_to_id: input.reply_to_id,
            metadata: input.metadata,
        });

        // Tạo attachments
        const attachments = [];
        if (input.attachments && input.attachments.length > 0) {
            for (const att of input.attachments) {
                const attachment = await MedicalChatRepository.createAttachment({
                    attachment_id: `MCA_${uuidv4().substring(0, 12)}`,
                    message_id: messageId,
                    file_name: att.file_name,
                    file_url: att.file_url,
                    file_type: att.file_type || MED_CHAT_FILE_TYPE.DOCUMENT,
                    file_size: att.file_size,
                    mime_type: att.mime_type,
                    thumbnail_url: att.thumbnail_url,
                    is_medical_record: att.is_medical_record,
                });
                attachments.push(attachment);
            }
        }

        // Cập nhật conversation: last_message, unread_count
        const preview = input.content?.substring(0, 100) || `[${input.message_type || 'FILE'}]`;
        const unreadField = senderType === 'DOCTOR' ? 'unread_count_patient' : 'unread_count_doctor';
        const currentUnread = senderType === 'DOCTOR' ? conversation.unread_count_patient : conversation.unread_count_doctor;

        await MedicalChatRepository.updateConversation(conversationId, {
            last_message_at: new Date(),
            last_message_preview: preview,
            [unreadField]: (currentUnread || 0) + 1,
        });

        return { ...message, attachments };
    }

    /** Lịch sử tin nhắn */
    static async getMessages(conversationId: string, userId: string, roles: string[], page: number = 1, limit: number = 50): Promise<any> {
        const conversation = await this.getConversationOrThrow(conversationId);
        await this.assertAccess(conversation, userId, roles);

        const offset = (page - 1) * limit;
        return await MedicalChatRepository.findMessages(conversationId, limit, offset);
    }

    /** Đánh dấu đã đọc + reset unread count */
    static async markRead(conversationId: string, userId: string, roles: string[]): Promise<number> {
        const conversation = await this.getConversationOrThrow(conversationId);
        await this.assertAccess(conversation, userId, roles);

        const count = await MedicalChatRepository.markMessagesRead(conversationId, userId);

        // Reset unread count cho phía đọc
        const isDoctor = roles.includes('DOCTOR');
        const resetField = isDoctor ? 'unread_count_doctor' : 'unread_count_patient';
        await MedicalChatRepository.updateConversation(conversationId, { [resetField]: 0 });

        return count;
    }

    /** Ghim/bỏ ghim tin nhắn */
    static async togglePin(conversationId: string, messageId: string, userId: string, roles: string[]): Promise<boolean> {
        const conversation = await this.getConversationOrThrow(conversationId);
        await this.assertAccess(conversation, userId, roles);

        const message = await MedicalChatRepository.findMessageById(messageId);
        if (!message) throw new AppError(HTTP_STATUS.NOT_FOUND, MED_CHAT_ERRORS.MESSAGE_NOT_FOUND.code, MED_CHAT_ERRORS.MESSAGE_NOT_FOUND.message);
        if (message.is_deleted) throw new AppError(HTTP_STATUS.BAD_REQUEST, MED_CHAT_ERRORS.MESSAGE_ALREADY_DELETED.code, MED_CHAT_ERRORS.MESSAGE_ALREADY_DELETED.message);

        const newPinned = !message.is_pinned;
        await MedicalChatRepository.updateMessage(messageId, { is_pinned: newPinned });
        return newPinned;
    }

    /** Soft delete tin nhắn (chỉ owner hoặc ADMIN) */
    static async deleteMessage(conversationId: string, messageId: string, userId: string, isAdmin: boolean): Promise<void> {
        const message = await MedicalChatRepository.findMessageById(messageId);
        if (!message) throw new AppError(HTTP_STATUS.NOT_FOUND, MED_CHAT_ERRORS.MESSAGE_NOT_FOUND.code, MED_CHAT_ERRORS.MESSAGE_NOT_FOUND.message);
        if (message.is_deleted) throw new AppError(HTTP_STATUS.BAD_REQUEST, MED_CHAT_ERRORS.MESSAGE_ALREADY_DELETED.code, MED_CHAT_ERRORS.MESSAGE_ALREADY_DELETED.message);

        if (message.sender_id !== userId && !isAdmin) {
            throw new AppError(HTTP_STATUS.FORBIDDEN, MED_CHAT_ERRORS.NOT_MESSAGE_OWNER.code, MED_CHAT_ERRORS.NOT_MESSAGE_OWNER.message);
        }

        await MedicalChatRepository.updateMessage(messageId, { is_deleted: true });
    }

    /** DS tin nhắn đã ghim */
    static async getPinnedMessages(conversationId: string, userId: string, roles: string[]): Promise<any[]> {
        const conversation = await this.getConversationOrThrow(conversationId);
        await this.assertAccess(conversation, userId, roles);
        return await MedicalChatRepository.findPinnedMessages(conversationId);
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 3: ATTACHMENTS
    // ═══════════════════════════════════════════════════

    /** DS file đính kèm */
    static async getAttachments(conversationId: string, userId: string, roles: string[]): Promise<any[]> {
        const conversation = await this.getConversationOrThrow(conversationId);
        await this.assertAccess(conversation, userId, roles);
        return await MedicalChatRepository.findAttachments(conversationId);
    }

    /** DS file y tế */
    static async getMedicalAttachments(conversationId: string): Promise<any[]> {
        await this.getConversationOrThrow(conversationId);
        return await MedicalChatRepository.findMedicalAttachments(conversationId);
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 4: STATS
    // ═══════════════════════════════════════════════════

    /** Tổng unread */
    static async getUnreadCount(userId: string, roles: string[]): Promise<number> {
        const role = roles.includes('DOCTOR') ? 'DOCTOR' as const : 'PATIENT' as const;
        return await MedicalChatRepository.getUnreadCount(userId, role);
    }

    /** DS BN đang chat (cho BS) */
    static async getMyPatients(userId: string): Promise<any[]> {
        const docR = await pool.query(`SELECT doctors_id FROM doctors WHERE user_id = $1 LIMIT 1`, [userId]);
        if (!docR.rows[0]) throw new AppError(HTTP_STATUS.NOT_FOUND, MED_CHAT_ERRORS.DOCTOR_NOT_FOUND.code, MED_CHAT_ERRORS.DOCTOR_NOT_FOUND.message);
        return await MedicalChatRepository.findPatientsByDoctor(docR.rows[0].doctors_id);
    }

    // ═══════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════

    private static async getConversationOrThrow(conversationId: string): Promise<any> {
        const c = await MedicalChatRepository.findById(conversationId);
        if (!c) throw new AppError(HTTP_STATUS.NOT_FOUND, MED_CHAT_ERRORS.CONVERSATION_NOT_FOUND.code, MED_CHAT_ERRORS.CONVERSATION_NOT_FOUND.message);
        return c;
    }

    /**
     * Kiểm tra quyền: BN chỉ xem conversation mình, BS chỉ xem conversation mình, ADMIN xem tất cả
     */
    private static async assertAccess(conversation: any, userId: string, roles: string[]): Promise<void> {
        if (roles.includes('ADMIN')) return;

        if (roles.includes('DOCTOR')) {
            const docR = await pool.query(`SELECT doctors_id FROM doctors WHERE user_id = $1 LIMIT 1`, [userId]);
            if (docR.rows[0]?.doctors_id === conversation.doctor_id) return;
        }

        if (roles.includes('PATIENT')) {
            const patR = await pool.query(`SELECT id::varchar AS pid FROM patients WHERE account_id = $1 LIMIT 1`, [userId]);
            if (patR.rows[0]?.pid === conversation.patient_id) return;
        }

        throw new AppError(HTTP_STATUS.FORBIDDEN, MED_CHAT_ERRORS.NO_ACCESS.code, MED_CHAT_ERRORS.NO_ACCESS.message);
    }
}
