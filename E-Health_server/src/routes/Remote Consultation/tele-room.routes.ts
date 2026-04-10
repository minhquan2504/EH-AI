import { Router } from 'express';
import { TeleRoomController } from '../../controllers/Remote Consultation/tele-room.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';

const router = Router();

// ═══════════════════════════════════════════════════
// NHÓM 1: QUẢN LÝ PHÒNG
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/room/active:
 *   get:
 *     summary: Danh sách phòng đang hoạt động (dashboard admin)
 *     description: |
 *       Trả về tất cả phiên tư vấn có room_status = WAITING hoặc ONGOING.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN
 *     tags: [8.3.5 Events & Thống kê]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: DS phòng đang hoạt động
 */
router.get('/room/active', verifyAccessToken, authorizeRoles('ADMIN'), TeleRoomController.getActiveRooms);

/**
 * @swagger
 * /api/teleconsultation/room/{consultationId}/open:
 *   post:
 *     summary: Bác sĩ mở phòng khám trực tuyến
 *     description: |
 *       Chuyển phiên tư vấn từ SCHEDULED → WAITING.
 *       Sinh meeting credentials (meeting_id, meeting_password, host_url, join_url).
 *       Tạo room token cho BS (HOST, IN_ROOM) và BN (GUEST, WAITING).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.3.1 Quản lý phòng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     responses:
 *       200:
 *         description: Mở phòng thành công. Trả về room detail + meeting URLs
 *       400:
 *         description: Phòng đã mở / trạng thái không hợp lệ
 *       404:
 *         description: Không tìm thấy phiên tư vấn
 */
router.post('/room/:consultationId/open', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleRoomController.openRoom);

/**
 * @swagger
 * /api/teleconsultation/room/{consultationId}/join:
 *   post:
 *     summary: Tham gia phòng khám
 *     description: |
 *       Participant (GUEST/HOST) join vào phòng. Ghi nhận join_time, device_info.
 *       Nếu GUEST đầu tiên join → chuyển room_status sang ONGOING.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.3.1 Quản lý phòng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               device_info:
 *                 type: object
 *                 example: { "browser": "Chrome 120", "os": "Windows 11", "ip_hash": "abc123" }
 *     responses:
 *       200:
 *         description: Tham gia thành công. Trả về room_token, join_url, meeting_id
 *       400:
 *         description: Đã ở trong phòng / phòng chưa mở
 *       403:
 *         description: Không phải participant
 */
router.post('/room/:consultationId/join', verifyAccessToken, TeleRoomController.joinRoom);

/**
 * @swagger
 * /api/teleconsultation/room/{consultationId}/leave:
 *   post:
 *     summary: Rời phòng khám
 *     description: |
 *       Ghi nhận leave_time, tính duration_seconds. Cập nhật participant_count.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.3.1 Quản lý phòng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     responses:
 *       200:
 *         description: Rời phòng thành công
 *       400:
 *         description: Không ở trong phòng
 */
router.post('/room/:consultationId/leave', verifyAccessToken, TeleRoomController.leaveRoom);

/**
 * @swagger
 * /api/teleconsultation/room/{consultationId}/close:
 *   post:
 *     summary: Đóng phòng / kết thúc phiên
 *     description: |
 *       Kick tất cả participants, tính tổng duration, cập nhật encounter → COMPLETED, appointment → COMPLETED.
 *       Ghi event ROOM_CLOSED.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.3.1 Quản lý phòng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ended_reason:
 *                 type: string
 *                 enum: [NORMAL, TIMEOUT, TECHNICAL_ERROR, PATIENT_LEFT, DOCTOR_LEFT]
 *                 example: 'NORMAL'
 *     responses:
 *       200:
 *         description: Đóng phòng thành công
 *       400:
 *         description: Phiên đã kết thúc
 */
router.post('/room/:consultationId/close', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleRoomController.closeRoom);

/**
 * @swagger
 * /api/teleconsultation/room/{consultationId}:
 *   get:
 *     summary: Chi tiết phòng khám + danh sách participants
 *     description: |
 *       Trả về đầy đủ thông tin phiên tư vấn + JOINed data (BN, BS, CK, loại hình) + DS participants.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.3.1 Quản lý phòng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     responses:
 *       200:
 *         description: Chi tiết phòng
 *       404:
 *         description: Không tìm thấy phiên
 */
router.get('/room/:consultationId', verifyAccessToken, TeleRoomController.getRoomDetail);

// ═══════════════════════════════════════════════════
// NHÓM 2: CHAT
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/room/{consultationId}/messages:
 *   post:
 *     summary: Gửi tin nhắn trong phiên
 *     description: |
 *       Gửi TEXT, IMAGE, hoặc FILE_PDF. Chỉ khi phiên đang ONGOING.
 *       Tự động xác định sender_type từ roles (DOCTOR/PATIENT/SYSTEM).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.3.2 Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message_type: { type: string, enum: [TEXT, IMAGE, FILE_PDF], example: 'TEXT' }
 *               content: { type: string, example: 'Xin chào bác sĩ, tôi bị đau đầu từ sáng.' }
 *               file_url: { type: string, example: 'https://storage.ehealth.vn/uploads/xray.jpg' }
 *     responses:
 *       201:
 *         description: Gửi thành công
 *       400:
 *         description: Phiên chưa diễn ra
 *   get:
 *     summary: Lịch sử chat phiên (phân trang)
 *     description: |
 *       Lấy tin nhắn theo thứ tự thời gian.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.3.2 Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
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
router.post('/room/:consultationId/messages', verifyAccessToken, TeleRoomController.sendMessage);
router.get('/room/:consultationId/messages', verifyAccessToken, TeleRoomController.getMessages);

/**
 * @swagger
 * /api/teleconsultation/room/{consultationId}/messages/read:
 *   put:
 *     summary: Đánh dấu đã đọc tất cả tin nhắn chưa đọc
 *     description: |
 *       Mark is_read = true cho mọi tin nhắn KHÔNG phải do mình gửi.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.3.2 Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     responses:
 *       200:
 *         description: Đã đánh dấu đọc
 */
router.put('/room/:consultationId/messages/read', verifyAccessToken, TeleRoomController.markRead);

// ═══════════════════════════════════════════════════
// NHÓM 3: FILE SHARING
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/room/{consultationId}/files:
 *   post:
 *     summary: Upload/chia sẻ file trong phiên
 *     description: |
 *       Chia sẻ tài liệu (IMAGE, PDF, LAB_RESULT, PRESCRIPTION). Chỉ khi phiên ONGOING.
 *       Ghi event FILE_SHARED.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.3.3 File Sharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [file_name, file_url]
 *             properties:
 *               file_name: { type: string, example: 'kết_quả_xét_nghiệm.pdf' }
 *               file_url: { type: string, example: 'https://storage.ehealth.vn/uploads/lab_result.pdf' }
 *               file_type: { type: string, enum: [IMAGE, PDF, DOCUMENT, LAB_RESULT, PRESCRIPTION], example: 'LAB_RESULT' }
 *               file_size: { type: integer, example: 204800 }
 *               mime_type: { type: string, example: 'application/pdf' }
 *               thumbnail_url: { type: string }
 *               description: { type: string, example: 'Kết quả chụp X-quang ngực' }
 *               is_medical_record: { type: boolean, example: true }
 *     responses:
 *       201:
 *         description: Upload thành công
 *       400:
 *         description: Phiên chưa diễn ra
 *   get:
 *     summary: Danh sách file đã chia sẻ trong phiên
 *     description: |
 *       Trả về tất cả file chia sẻ, sắp xếp theo thời gian.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.3.3 File Sharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     responses:
 *       200:
 *         description: DS file
 */
router.post('/room/:consultationId/files', verifyAccessToken, TeleRoomController.uploadFile);
router.get('/room/:consultationId/files', verifyAccessToken, TeleRoomController.getFiles);

/**
 * @swagger
 * /api/teleconsultation/room/{consultationId}/files/{fileId}:
 *   delete:
 *     summary: Xóa file chia sẻ
 *     description: |
 *       Chỉ người upload hoặc ADMIN mới được xóa.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, owner
 *     tags: [8.3.3 File Sharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema: { type: string, example: 'TSF_abc123' }
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       403:
 *         description: Không có quyền xóa
 *       404:
 *         description: Không tìm thấy file
 */
router.delete('/room/:consultationId/files/:fileId', verifyAccessToken, TeleRoomController.deleteFile);

// ═══════════════════════════════════════════════════
// NHÓM 4: MEDIA & PARTICIPANTS
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/room/{consultationId}/media:
 *   put:
 *     summary: Cập nhật trạng thái cam/mic/chia sẻ màn hình
 *     description: |
 *       Toggle bật/tắt video, audio, screen share. Tự động ghi event tương ứng.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.3.4 Media & Participants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_video_on: { type: boolean, example: true }
 *               is_audio_on: { type: boolean, example: true }
 *               is_screen_sharing: { type: boolean, example: false }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Không ở trong phòng
 */
router.put('/room/:consultationId/media', verifyAccessToken, TeleRoomController.updateMedia);

/**
 * @swagger
 * /api/teleconsultation/room/{consultationId}/participants:
 *   get:
 *     summary: Danh sách người tham gia phòng
 *     description: |
 *       Trả về tất cả participants kèm trạng thái media, connection quality, thời gian.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.3.4 Media & Participants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     responses:
 *       200:
 *         description: DS participants
 */
router.get('/room/:consultationId/participants', verifyAccessToken, TeleRoomController.getParticipants);

/**
 * @swagger
 * /api/teleconsultation/room/{consultationId}/kick/{userId}:
 *   post:
 *     summary: Kick người dùng khỏi phòng
 *     description: |
 *       Chỉ BS (HOST) hoặc ADMIN mới được kick. Không thể kick chính BS chủ phiên.
 *       Ghi event KICKED.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.3.4 Media & Participants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, example: 'USR_abc123' }
 *     responses:
 *       200:
 *         description: Kick thành công
 *       400:
 *         description: Không thể kick BS chủ phiên
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.post('/room/:consultationId/kick/:userId', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleRoomController.kickUser);

// ═══════════════════════════════════════════════════
// NHÓM 5: EVENTS & THỐNG KÊ
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/room/{consultationId}/events:
 *   get:
 *     summary: Activity log phiên khám
 *     description: |
 *       Liệt kê tất cả sự kiện (JOIN/LEAVE/VIDEO_ON/OFF...) theo thứ tự thời gian.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.3.5 Events & Thống kê]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 100 }
 *     responses:
 *       200:
 *         description: DS events
 */
router.get('/room/:consultationId/events', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleRoomController.getEvents);

/**
 * @swagger
 * /api/teleconsultation/room/{consultationId}/network-report:
 *   post:
 *     summary: Báo cáo chất lượng mạng
 *     description: |
 *       Participant gửi report connection quality (EXCELLENT/GOOD/FAIR/POOR).
 *       Nếu POOR/FAIR → ghi event NETWORK_ISSUE và tăng network_issues_count.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.3.5 Events & Thống kê]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quality]
 *             properties:
 *               quality: { type: string, enum: [EXCELLENT, GOOD, FAIR, POOR], example: 'POOR' }
 *               details: { type: object, example: { "latency_ms": 500, "packet_loss": 5.2 } }
 *     responses:
 *       200:
 *         description: Ghi nhận thành công
 */
router.post('/room/:consultationId/network-report', verifyAccessToken, TeleRoomController.networkReport);

/**
 * @swagger
 * /api/teleconsultation/room/{consultationId}/summary:
 *   get:
 *     summary: Tổng kết phiên khám
 *     description: |
 *       Trả về: chi tiết phiên, thống kê (participants, events, messages, files, network issues), DS participants.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.3.5 Events & Thống kê]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     responses:
 *       200:
 *         description: Tổng kết phiên
 */
router.get('/room/:consultationId/summary', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleRoomController.getRoomSummary);

export { router as teleRoomRoutes };
