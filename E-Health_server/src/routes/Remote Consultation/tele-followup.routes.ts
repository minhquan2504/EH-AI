import { Router } from 'express';
import { TeleFollowUpController } from '../../controllers/Remote Consultation/tele-followup.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';

const router = Router();

// ═══════════════════════════════════════════════════
// STATIC ROUTES (trước dynamic)
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/follow-ups/plans:
 *   get:
 *     summary: Danh sách kế hoạch theo dõi (phân trang, filter)
 *     description: |
 *       Filter theo status, plan_type, doctor_id, keyword (tên BN, mô tả).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.7.4 Tra cứu & Báo cáo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, COMPLETED, CONVERTED_IN_PERSON, CANCELLED] }
 *       - in: query
 *         name: plan_type
 *         schema: { type: string, enum: [MEDICATION_MONITOR, SYMPTOM_TRACK, POST_PROCEDURE, CHRONIC_CARE] }
 *       - in: query
 *         name: doctor_id
 *         schema: { type: string }
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
 *         description: DS plans
 */
router.get('/follow-ups/plans', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleFollowUpController.listPlans);

/**
 * @swagger
 * /api/teleconsultation/follow-ups/plans/upcoming:
 *   get:
 *     summary: DS kế hoạch sắp tái khám (3 ngày tới)
 *     description: |
 *       Trả về plans ACTIVE có next_follow_up_date trong 3 ngày tới.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.7.3 Nhắc tái khám]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: DS sắp tái khám
 */
router.get('/follow-ups/plans/upcoming', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleFollowUpController.getUpcomingPlans);

/**
 * @swagger
 * /api/teleconsultation/follow-ups/plans/patient/{patientId}:
 *   get:
 *     summary: Lịch sử follow-up của BN
 *     description: |
 *       BN xem lịch sử của mình, BS/ADMIN xem BN bất kỳ.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT (chỉ xem mình)
 *     tags: [8.7.4 Tra cứu & Báo cáo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: '1' }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Lịch sử follow-up
 */
router.get('/follow-ups/plans/patient/:patientId', verifyAccessToken, TeleFollowUpController.getPatientPlans);

/**
 * @swagger
 * /api/teleconsultation/follow-ups/stats:
 *   get:
 *     summary: Thống kê follow-up (outcome distribution)
 *     description: |
 *       Tổng plans, active/completed/converted, outcome distribution (IMPROVED/STABLE/WORSENED/RESOLVED).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.7.4 Tra cứu & Báo cáo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: doctor_id
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Thống kê
 */
router.get('/follow-ups/stats', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleFollowUpController.getStats);

/**
 * @swagger
 * /api/teleconsultation/follow-ups/updates/attention:
 *   get:
 *     summary: DS diễn biến cần BS xem xét
 *     description: |
 *       Trả về health updates có requires_attention = true, chưa phản hồi, thuộc BS hiện tại.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.7.2 Diễn biến sức khỏe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: DS cần xem xét
 */
router.get('/follow-ups/updates/attention', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleFollowUpController.getAttentionUpdates);

// ═══════════════════════════════════════════════════
// NHÓM 1: KẾ HOẠCH (dynamic routes)
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/follow-ups/plans/{consultationId}:
 *   post:
 *     summary: Tạo kế hoạch theo dõi
 *     description: |
 *       BS tạo follow-up plan cho BN sau phiên khám, chỉ định loại theo dõi, tần suất, monitoring_items.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.7.1 Kế hoạch theo dõi]
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
 *             required: [plan_type, start_date]
 *             properties:
 *               plan_type: { type: string, enum: [MEDICATION_MONITOR, SYMPTOM_TRACK, POST_PROCEDURE, CHRONIC_CARE], example: 'SYMPTOM_TRACK' }
 *               description: { type: string, example: 'Theo dõi triệu chứng cảm cúm sau điều trị' }
 *               instructions: { type: string, example: 'Đo nhiệt độ 2 lần/ngày, báo ngay nếu sốt > 39°C' }
 *               monitoring_items: { type: array, items: { type: string }, example: ['Nhiệt độ', 'Huyết áp', 'SpO2'] }
 *               frequency: { type: string, enum: [DAILY, WEEKLY, BI_WEEKLY, MONTHLY], example: 'DAILY' }
 *               start_date: { type: string, format: date, example: '2026-03-21' }
 *               end_date: { type: string, format: date, example: '2026-04-04' }
 *               next_follow_up_date: { type: string, format: date, example: '2026-03-28' }
 *               follow_up_type: { type: string, enum: [TELECONSULTATION, IN_PERSON], example: 'TELECONSULTATION' }
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/follow-ups/plans/:consultationId', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleFollowUpController.createPlan);

/**
 * @swagger
 * /api/teleconsultation/follow-ups/plans/{planId}:
 *   put:
 *     summary: Cập nhật kế hoạch
 *     description: |
 *       Chỉ cập nhật plan ACTIVE.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.7.1 Kế hoạch theo dõi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema: { type: string, example: 'FUP_abc123' }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description: { type: string, example: 'Theo dõi phản ứng thuốc mới' }
 *               frequency: { type: string, example: 'WEEKLY' }
 *               next_follow_up_date: { type: string, format: date, example: '2026-04-05' }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   get:
 *     summary: Chi tiết kế hoạch
 *     description: |
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.7.1 Kế hoạch theo dõi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema: { type: string, example: 'FUP_abc123' }
 *     responses:
 *       200:
 *         description: Chi tiết
 */
router.put('/follow-ups/plans/:planId', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleFollowUpController.updatePlan);
router.get('/follow-ups/plans/:planId', verifyAccessToken, TeleFollowUpController.getPlanDetail);

/**
 * @swagger
 * /api/teleconsultation/follow-ups/plans/{planId}/complete:
 *   put:
 *     summary: Hoàn thành kế hoạch + ghi outcome
 *     description: |
 *       Bắt buộc: outcome + outcome_rating (IMPROVED/STABLE/WORSENED/RESOLVED).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.7.1 Kế hoạch theo dõi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema: { type: string, example: 'FUP_abc123' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [outcome, outcome_rating]
 *             properties:
 *               outcome: { type: string, example: 'BN hết sốt, huyết áp ổn định, hết triệu chứng sau 7 ngày' }
 *               outcome_rating: { type: string, enum: [IMPROVED, STABLE, WORSENED, RESOLVED], example: 'RESOLVED' }
 *     responses:
 *       200:
 *         description: Hoàn thành thành công
 */
router.put('/follow-ups/plans/:planId/complete', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleFollowUpController.completePlan);

/**
 * @swagger
 * /api/teleconsultation/follow-ups/plans/{planId}/convert:
 *   put:
 *     summary: Chuyển sang khám trực tiếp
 *     description: |
 *       Status → CONVERTED_IN_PERSON. Ghi lý do chuyển.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.7.1 Kế hoạch theo dõi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema: { type: string, example: 'FUP_abc123' }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               converted_reason: { type: string, example: 'Triệu chứng không cải thiện sau 5 ngày, cần khám trực tiếp' }
 *     responses:
 *       200:
 *         description: Chuyển thành công
 */
router.put('/follow-ups/plans/:planId/convert', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleFollowUpController.convertToPerson);

// ═══════════════════════════════════════════════════
// NHÓM 2: DIỄN BIẾN SỨC KHỎE
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/follow-ups/plans/{planId}/updates:
 *   post:
 *     summary: BN/BS ghi nhận diễn biến sức khỏe
 *     description: |
 *       BN tự báo triệu chứng, sinh hiệu, phản ứng thuốc. BS ghi nhận note.
 *       SEVERE/CRITICAL → auto requires_attention = true.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.7.2 Diễn biến sức khỏe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema: { type: string, example: 'FUP_abc123' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [update_type]
 *             properties:
 *               update_type: { type: string, enum: [SYMPTOM_UPDATE, VITAL_SIGNS, MEDICATION_RESPONSE, SIDE_EFFECT, GENERAL_NOTE], example: 'VITAL_SIGNS' }
 *               content: { type: string, example: 'Sáng nay đo nhiệt độ 36.8, cảm thấy khỏe hơn' }
 *               vital_data: { type: object, properties: { temperature: { type: number }, pulse: { type: integer }, bp_systolic: { type: integer }, bp_diastolic: { type: integer }, spo2: { type: integer } }, example: { temperature: 36.8, pulse: 75, bp_systolic: 120, bp_diastolic: 80, spo2: 98 } }
 *               severity_level: { type: string, enum: [NORMAL, MILD, MODERATE, SEVERE, CRITICAL], example: 'NORMAL' }
 *     responses:
 *       201:
 *         description: Ghi nhận thành công
 *   get:
 *     summary: DS diễn biến sức khỏe (phân trang)
 *     description: |
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.7.2 Diễn biến sức khỏe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema: { type: string, example: 'FUP_abc123' }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: DS updates
 */
router.post('/follow-ups/plans/:planId/updates', verifyAccessToken, TeleFollowUpController.addHealthUpdate);
router.get('/follow-ups/plans/:planId/updates', verifyAccessToken, TeleFollowUpController.getHealthUpdates);

/**
 * @swagger
 * /api/teleconsultation/follow-ups/updates/{updateId}/respond:
 *   put:
 *     summary: BS phản hồi diễn biến
 *     description: |
 *       BS ghi phản hồi, tự động tắt requires_attention.
 *       Mỗi update chỉ phản hồi 1 lần.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.7.2 Diễn biến sức khỏe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: updateId
 *         required: true
 *         schema: { type: string, example: 'HU_abc123' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [doctor_response]
 *             properties:
 *               doctor_response: { type: string, example: 'Sinh hiệu ổn định, tiếp tục uống thuốc theo liều hiện tại' }
 *     responses:
 *       200:
 *         description: Phản hồi thành công
 */
router.put('/follow-ups/updates/:updateId/respond', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleFollowUpController.respondToUpdate);

// ═══════════════════════════════════════════════════
// NHÓM 3: NHẮC TÁI KHÁM
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/follow-ups/plans/{planId}/send-reminder:
 *   post:
 *     summary: Gửi nhắc lịch tái khám
 *     description: |
 *       Đánh dấu reminder_sent = true. Mỗi plan chỉ gửi 1 lần.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.7.3 Nhắc tái khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema: { type: string, example: 'FUP_abc123' }
 *     responses:
 *       200:
 *         description: Gửi thành công
 *       400:
 *         description: Đã gửi rồi
 */
router.post('/follow-ups/plans/:planId/send-reminder', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleFollowUpController.sendReminder);

/**
 * @swagger
 * /api/teleconsultation/follow-ups/plans/{planId}/report:
 *   get:
 *     summary: Báo cáo kết quả điều trị
 *     description: |
 *       Plan + tất cả health updates — dùng cho BS review toàn bộ quá trình theo dõi.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.7.4 Tra cứu & Báo cáo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema: { type: string, example: 'FUP_abc123' }
 *     responses:
 *       200:
 *         description: Báo cáo đầy đủ
 */
router.get('/follow-ups/plans/:planId/report', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleFollowUpController.getReport);

export { router as teleFollowUpRoutes };
