import { Router } from 'express';
import { MedicalChatController } from '../../controllers/Remote Consultation/tele-medical-chat.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';

const router = Router();

// ═══════════════════════════════════════════════════
// NHÓM 1: CONVERSATIONS
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/medical-chat/unread-count:
 *   get:
 *     summary: Đếm tổng tin nhắn chưa đọc
 *     description: |
 *       Trả về tổng số tin nhắn chưa đọc từ tất cả cuộc hội thoại ACTIVE.
 *       BN xem unread_count_patient, BS xem unread_count_doctor.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.4.4 Thống kê]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tổng unread
 */
router.get('/medical-chat/unread-count', verifyAccessToken, MedicalChatController.getUnreadCount);

/**
 * @swagger
 * /api/teleconsultation/medical-chat/my-patients:
 *   get:
 *     summary: Danh sách bệnh nhân đang chat với BS
 *     description: |
 *       Trả về DS bệnh nhân có conversation ACTIVE với BS hiện tại. Sắp xếp theo last_message_at.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** DOCTOR
 *     tags: [8.4.4 Thống kê]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: DS BN
 */
router.get('/medical-chat/my-patients', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), MedicalChatController.getMyPatients);

/**
 * @swagger
 * /api/teleconsultation/medical-chat/conversations:
 *   post:
 *     summary: Tạo cuộc hội thoại y tế
 *     description: |
 *       Tạo cuộc hội thoại giữa BN và BS. Kiểm tra BN + BS tồn tại, không trùng ACTIVE conversation.
 *       Có thể liên kết appointment_id, encounter_id, specialty_id.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.4.1 Quản lý hội thoại]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient_id, doctor_id]
 *             properties:
 *               patient_id: { type: string, example: '1' }
 *               doctor_id: { type: string, example: 'DOC_001' }
 *               specialty_id: { type: string, example: 'SPEC_001' }
 *               appointment_id: { type: string }
 *               encounter_id: { type: string }
 *               subject: { type: string, example: 'Theo dõi sau mổ tim' }
 *               priority: { type: string, enum: [NORMAL, URGENT, FOLLOW_UP], example: 'FOLLOW_UP' }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       404:
 *         description: BN/BS không tồn tại
 *       409:
 *         description: Đã có conversation ACTIVE
 *   get:
 *     summary: Danh sách cuộc hội thoại (theo role)
 *     description: |
 *       BN chỉ thấy conversation mình, BS chỉ thấy conversation mình, ADMIN thấy tất cả.
 *       Hỗ trợ filter status, priority, keyword (search subject/tên).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.4.1 Quản lý hội thoại]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, CLOSED, ARCHIVED] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [NORMAL, URGENT, FOLLOW_UP] }
 *       - in: query
 *         name: keyword
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: DS conversations
 */
router.post('/medical-chat/conversations', verifyAccessToken, MedicalChatController.createConversation);
router.get('/medical-chat/conversations', verifyAccessToken, MedicalChatController.listConversations);

/**
 * @swagger
 * /api/teleconsultation/medical-chat/conversations/{conversationId}:
 *   get:
 *     summary: Chi tiết cuộc hội thoại
 *     description: |
 *       Trả về thông tin + tên BN/BS/CK.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + là participant hoặc ADMIN.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT (chỉ xem mình)
 *     tags: [8.4.1 Quản lý hội thoại]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string, example: 'CONV_abc123def4' }
 *     responses:
 *       200:
 *         description: Chi tiết
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy
 */
router.get('/medical-chat/conversations/:conversationId', verifyAccessToken, MedicalChatController.getConversation);

/**
 * @swagger
 * /api/teleconsultation/medical-chat/conversations/{conversationId}/close:
 *   put:
 *     summary: Đóng cuộc hội thoại
 *     description: |
 *       Chuyển status → CLOSED. Conversation đóng vẫn xem được lịch sử, không gửi thêm tin.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.4.1 Quản lý hội thoại]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string, example: 'CONV_abc123def4' }
 *     responses:
 *       200:
 *         description: Đóng thành công
 *       400:
 *         description: Đã đóng rồi
 */
router.put('/medical-chat/conversations/:conversationId/close', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), MedicalChatController.closeConversation);

/**
 * @swagger
 * /api/teleconsultation/medical-chat/conversations/{conversationId}/reopen:
 *   put:
 *     summary: Mở lại cuộc hội thoại đã đóng
 *     description: |
 *       Chuyển status CLOSED → ACTIVE.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.4.1 Quản lý hội thoại]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string, example: 'CONV_abc123def4' }
 *     responses:
 *       200:
 *         description: Mở lại thành công
 *       400:
 *         description: Đang ACTIVE rồi
 */
router.put('/medical-chat/conversations/:conversationId/reopen', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), MedicalChatController.reopenConversation);

// ═══════════════════════════════════════════════════
// NHÓM 2: MESSAGES
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/medical-chat/conversations/{conversationId}/messages:
 *   post:
 *     summary: Gửi tin nhắn y tế
 *     description: |
 *       Gửi TEXT, IMAGE, FILE, LAB_RESULT, PRESCRIPTION. Hỗ trợ đính kèm nhiều file.
 *       Tự động cập nhật last_message, unread_count.
 *       Conversation phải ở trạng thái ACTIVE.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + là participant.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.4.2 Tin nhắn]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string, example: 'CONV_abc123def4' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message_type:
 *                 type: string
 *                 enum: [TEXT, IMAGE, FILE, LAB_RESULT, PRESCRIPTION, SYSTEM_NOTE]
 *                 example: 'TEXT'
 *               content: { type: string, example: 'Bác sĩ ơi, tôi bị sốt từ tối qua, nhiệt độ 38.5°C.' }
 *               reply_to_id: { type: string }
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     file_name: { type: string, example: 'trieu_chung_viem_hong.jpg' }
 *                     file_url: { type: string, example: 'https://storage.ehealth.vn/uploads/symptom_01.jpg' }
 *                     file_type: { type: string, enum: [IMAGE, PDF, LAB_RESULT, PRESCRIPTION, DOCUMENT], example: 'IMAGE' }
 *                     file_size: { type: integer, example: 152000 }
 *                     mime_type: { type: string, example: 'image/jpeg' }
 *                     is_medical_record: { type: boolean, example: false }
 *     responses:
 *       201:
 *         description: Gửi thành công
 *       400:
 *         description: Conversation đã đóng / thiếu nội dung
 *       403:
 *         description: Không có quyền
 *   get:
 *     summary: Lịch sử chat (phân trang)
 *     description: |
 *       Lấy tin nhắn theo thứ tự thời gian, bỏ qua đã xóa. Mỗi tin nhắn kèm attachments.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + là participant.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.4.2 Tin nhắn]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string, example: 'CONV_abc123def4' }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: DS tin nhắn
 */
router.post('/medical-chat/conversations/:conversationId/messages', verifyAccessToken, MedicalChatController.sendMessage);
router.get('/medical-chat/conversations/:conversationId/messages', verifyAccessToken, MedicalChatController.getMessages);

/**
 * @swagger
 * /api/teleconsultation/medical-chat/conversations/{conversationId}/messages/pinned:
 *   get:
 *     summary: Danh sách tin nhắn đã ghim
 *     description: |
 *       Trả về tất cả tin nhắn đã ghim trong conversation, kèm attachments.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + là participant.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.4.2 Tin nhắn]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string, example: 'CONV_abc123def4' }
 *     responses:
 *       200:
 *         description: DS tin ghim
 */
router.get('/medical-chat/conversations/:conversationId/messages/pinned', verifyAccessToken, MedicalChatController.getPinnedMessages);

/**
 * @swagger
 * /api/teleconsultation/medical-chat/conversations/{conversationId}/messages/read:
 *   put:
 *     summary: Đánh dấu đã đọc
 *     description: |
 *       Mark is_read = true cho mọi tin nhắn chưa đọc từ đối phương.
 *       Reset unread_count tương ứng về 0.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + là participant.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.4.2 Tin nhắn]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string, example: 'CONV_abc123def4' }
 *     responses:
 *       200:
 *         description: Đánh dấu thành công
 */
router.put('/medical-chat/conversations/:conversationId/messages/read', verifyAccessToken, MedicalChatController.markRead);

/**
 * @swagger
 * /api/teleconsultation/medical-chat/conversations/{conversationId}/messages/{messageId}/pin:
 *   put:
 *     summary: Ghim / bỏ ghim tin nhắn
 *     description: |
 *       Toggle is_pinned. Ghim đơn thuốc, chỉ dẫn quan trọng.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.4.2 Tin nhắn]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string, example: 'CONV_abc123def4' }
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema: { type: string, example: 'MCM_abc123' }
 *     responses:
 *       200:
 *         description: Ghim/bỏ ghim thành công
 *       404:
 *         description: Tin nhắn không tồn tại
 */
router.put('/medical-chat/conversations/:conversationId/messages/:messageId/pin', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), MedicalChatController.togglePin);

/**
 * @swagger
 * /api/teleconsultation/medical-chat/conversations/{conversationId}/messages/{messageId}:
 *   delete:
 *     summary: Xóa tin nhắn (soft delete)
 *     description: |
 *       Soft delete — giữ audit trail, tin nhắn không hiển thị nữa.
 *       Chỉ người gửi hoặc ADMIN mới được xóa.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, owner
 *     tags: [8.4.2 Tin nhắn]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string, example: 'CONV_abc123def4' }
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema: { type: string, example: 'MCM_abc123' }
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       403:
 *         description: Không phải người gửi
 *       404:
 *         description: Tin nhắn không tồn tại
 */
router.delete('/medical-chat/conversations/:conversationId/messages/:messageId', verifyAccessToken, MedicalChatController.deleteMessage);

// ═══════════════════════════════════════════════════
// NHÓM 3: ATTACHMENTS
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/medical-chat/conversations/{conversationId}/attachments:
 *   get:
 *     summary: DS file đính kèm trong conversation
 *     description: |
 *       Tất cả file chia sẻ (ảnh triệu chứng, PDF kết quả XN, đơn thuốc).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + là participant.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.4.3 File y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string, example: 'CONV_abc123def4' }
 *     responses:
 *       200:
 *         description: DS attachments
 */
router.get('/medical-chat/conversations/:conversationId/attachments', verifyAccessToken, MedicalChatController.getAttachments);

/**
 * @swagger
 * /api/teleconsultation/medical-chat/conversations/{conversationId}/attachments/medical:
 *   get:
 *     summary: DS file y tế (is_medical_record = true)
 *     description: |
 *       Chỉ trả về file đánh dấu là hồ sơ y tế — dùng để liên kết EMR.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.4.3 File y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string, example: 'CONV_abc123def4' }
 *     responses:
 *       200:
 *         description: DS file y tế
 */
router.get('/medical-chat/conversations/:conversationId/attachments/medical', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), MedicalChatController.getMedicalAttachments);

export { router as medicalChatRoutes };
