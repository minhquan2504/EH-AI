import { Router } from 'express';
import { TeleQualityController } from '../../controllers/Remote Consultation/tele-quality.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';

const router = Router();

// ═══════════════════════════════════════════════════
// STATIC ROUTES (trước dynamic)
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/quality/reviews:
 *   get:
 *     summary: Danh sách đánh giá chất lượng (phân trang, filter)
 *     description: |
 *       Filter theo doctor_id, min/max rating, keyword (comment, tên BS).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.8.1 Đánh giá chất lượng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: doctor_id
 *         schema: { type: string }
 *       - in: query
 *         name: min_rating
 *         schema: { type: integer, minimum: 1, maximum: 5 }
 *       - in: query
 *         name: max_rating
 *         schema: { type: integer, minimum: 1, maximum: 5 }
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
 *         description: DS đánh giá
 */
router.get('/quality/reviews', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleQualityController.listReviews);

/**
 * @swagger
 * /api/teleconsultation/quality/reviews/doctor/{doctorId}:
 *   get:
 *     summary: DS đánh giá theo bác sĩ
 *     description: |
 *       BS xem reviews của mình, ADMIN xem của bất kỳ BS.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.8.1 Đánh giá chất lượng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema: { type: string, example: 'DOC_001' }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: DS đánh giá
 */
router.get('/quality/reviews/doctor/:doctorId', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleQualityController.getDoctorReviews);

// ═══════════════════════════════════════════════════
// NHÓM 2: METRICS
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/quality/metrics/overview:
 *   get:
 *     summary: Tổng quan hệ thống (avg satisfaction, top/low performers)
 *     description: |
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN
 *     tags: [8.8.2 Metrics & Phân tích]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tổng quan
 */
router.get('/quality/metrics/overview', verifyAccessToken, authorizeRoles('ADMIN'), TeleQualityController.getOverview);

/**
 * @swagger
 * /api/teleconsultation/quality/metrics/connection:
 *   get:
 *     summary: Thống kê chất lượng kết nối (video/audio, tech issues phổ biến)
 *     description: |
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN
 *     tags: [8.8.2 Metrics & Phân tích]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê kết nối
 */
router.get('/quality/metrics/connection', verifyAccessToken, authorizeRoles('ADMIN'), TeleQualityController.getConnectionStats);

/**
 * @swagger
 * /api/teleconsultation/quality/metrics/trends:
 *   get:
 *     summary: Xu hướng chất lượng (12 tuần gần nhất)
 *     description: |
 *       Trả về review_count, avg_satisfaction, avg_doctor theo từng tuần.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN
 *     tags: [8.8.2 Metrics & Phân tích]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Xu hướng
 */
router.get('/quality/metrics/trends', verifyAccessToken, authorizeRoles('ADMIN'), TeleQualityController.getTrends);

/**
 * @swagger
 * /api/teleconsultation/quality/metrics/doctor/{doctorId}:
 *   get:
 *     summary: Metrics chi tiết bác sĩ (avg tất cả tiêu chí)
 *     description: |
 *       Avg: professionalism, communication, knowledge, empathy, overall, satisfaction, video, audio, stability. recommend_count.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.8.2 Metrics & Phân tích]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema: { type: string, example: 'DOC_001' }
 *     responses:
 *       200:
 *         description: Metrics BS
 */
router.get('/quality/metrics/doctor/:doctorId', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleQualityController.getDoctorMetrics);

// ═══════════════════════════════════════════════════
// NHÓM 3: CẢNH BÁO
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/quality/alerts:
 *   get:
 *     summary: DS cảnh báo chất lượng (filter status)
 *     description: |
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN
 *     tags: [8.8.3 Cảnh báo chất lượng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [OPEN, ACKNOWLEDGED, RESOLVED, DISMISSED] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: DS cảnh báo
 *   post:
 *     summary: Tạo cảnh báo thủ công
 *     description: |
 *       ADMIN tạo cảnh báo khi phát hiện vấn đề (patient_complaint, tech_issue...).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN
 *     tags: [8.8.3 Cảnh báo chất lượng]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [alert_type, severity, target_type, title]
 *             properties:
 *               alert_type: { type: string, enum: [LOW_RATING, TECH_ISSUE, HIGH_CANCEL_RATE, PATIENT_COMPLAINT], example: 'PATIENT_COMPLAINT' }
 *               severity: { type: string, enum: [WARNING, CRITICAL], example: 'WARNING' }
 *               target_type: { type: string, enum: [DOCTOR, SYSTEM, PLATFORM], example: 'DOCTOR' }
 *               target_id: { type: string, example: 'DOC_001' }
 *               title: { type: string, example: 'BN phản ánh BS không lắng nghe' }
 *               description: { type: string, example: 'BN ID 123 phản ánh BS không lắng nghe, cắt ngang liên tục' }
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.get('/quality/alerts', verifyAccessToken, authorizeRoles('ADMIN'), TeleQualityController.listAlerts);
router.post('/quality/alerts', verifyAccessToken, authorizeRoles('ADMIN'), TeleQualityController.createAlert);

/**
 * @swagger
 * /api/teleconsultation/quality/alerts/stats:
 *   get:
 *     summary: Thống kê cảnh báo (open/resolved/critical)
 *     description: |
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN
 *     tags: [8.8.3 Cảnh báo chất lượng]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê
 */
router.get('/quality/alerts/stats', verifyAccessToken, authorizeRoles('ADMIN'), TeleQualityController.getAlertStats);

/**
 * @swagger
 * /api/teleconsultation/quality/alerts/{alertId}/resolve:
 *   put:
 *     summary: Resolve / dismiss cảnh báo
 *     description: |
 *       ADMIN xử lý cảnh báo: RESOLVED (đã khắc phục) hoặc DISMISSED (bỏ qua).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN
 *     tags: [8.8.3 Cảnh báo chất lượng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema: { type: string, example: 'QA_abc123' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status, resolution_notes]
 *             properties:
 *               status: { type: string, enum: [RESOLVED, DISMISSED], example: 'RESOLVED' }
 *               resolution_notes: { type: string, example: 'Đã trao đổi với BS, BS cam kết cải thiện giao tiếp' }
 *     responses:
 *       200:
 *         description: Xử lý thành công
 */
router.put('/quality/alerts/:alertId/resolve', verifyAccessToken, authorizeRoles('ADMIN'), TeleQualityController.resolveAlert);

// ═══════════════════════════════════════════════════
// NHÓM 1: ĐÁNH GIÁ (dynamic routes)
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/quality/reviews/{consultationId}:
 *   post:
 *     summary: BN gửi đánh giá chi tiết
 *     description: |
 *       Đánh giá đa tiêu chí: BS (5 tiêu chí), BN trải nghiệm (3 tiêu chí + would_recommend), kết nối (3 tiêu chí).
 *       Hỗ trợ ẩn danh. Auto-check: nếu avg doctor rating < 3.0 (5 reviews) → tạo alert WARNING.
 *       1 phiên = 1 review (UNIQUE).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.8.1 Đánh giá chất lượng]
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
 *             required: [doctor_overall, overall_satisfaction]
 *             properties:
 *               doctor_professionalism: { type: integer, minimum: 1, maximum: 5, example: 4 }
 *               doctor_communication: { type: integer, minimum: 1, maximum: 5, example: 5 }
 *               doctor_knowledge: { type: integer, minimum: 1, maximum: 5, example: 5 }
 *               doctor_empathy: { type: integer, minimum: 1, maximum: 5, example: 4 }
 *               doctor_overall: { type: integer, minimum: 1, maximum: 5, example: 4 }
 *               doctor_comment: { type: string, example: 'Bác sĩ tư vấn rất kỹ lưỡng' }
 *               ease_of_use: { type: integer, minimum: 1, maximum: 5, example: 5 }
 *               waiting_time_rating: { type: integer, minimum: 1, maximum: 5, example: 3 }
 *               overall_satisfaction: { type: integer, minimum: 1, maximum: 5, example: 4 }
 *               would_recommend: { type: boolean, example: true }
 *               patient_comment: { type: string, example: 'Dịch vụ tốt, video hơi giật' }
 *               video_quality: { type: integer, minimum: 1, maximum: 5, example: 3 }
 *               audio_quality: { type: integer, minimum: 1, maximum: 5, example: 4 }
 *               connection_stability: { type: integer, minimum: 1, maximum: 5, example: 3 }
 *               tech_issues: { type: array, items: { type: string }, example: ['VIDEO_FREEZE'] }
 *               is_anonymous: { type: boolean, example: false }
 *     responses:
 *       201:
 *         description: Gửi thành công
 *       409:
 *         description: Đã đánh giá rồi
 *   get:
 *     summary: Chi tiết đánh giá phiên
 *     description: |
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.8.1 Đánh giá chất lượng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     responses:
 *       200:
 *         description: Chi tiết
 */
router.post('/quality/reviews/:consultationId', verifyAccessToken, TeleQualityController.createReview);
router.get('/quality/reviews/:consultationId', verifyAccessToken, TeleQualityController.getReview);

// ═══════════════════════════════════════════════════
// NHÓM 4: BÁO CÁO
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/quality/reports/doctor/{doctorId}:
 *   get:
 *     summary: Báo cáo chất lượng bác sĩ (metrics + reviews + alerts)
 *     description: |
 *       Tổng hợp: metrics chi tiết + 10 reviews gần nhất + alerts liên quan.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN
 *     tags: [8.8.4 Báo cáo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema: { type: string, example: 'DOC_001' }
 *     responses:
 *       200:
 *         description: Báo cáo BS
 */
router.get('/quality/reports/doctor/:doctorId', verifyAccessToken, authorizeRoles('ADMIN'), TeleQualityController.getDoctorReport);

/**
 * @swagger
 * /api/teleconsultation/quality/reports/summary:
 *   get:
 *     summary: Báo cáo tổng hợp hệ thống
 *     description: |
 *       overview + connection stats + trends (12 tuần) + alert stats.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN
 *     tags: [8.8.4 Báo cáo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Báo cáo tổng hợp
 */
router.get('/quality/reports/summary', verifyAccessToken, authorizeRoles('ADMIN'), TeleQualityController.getSystemReport);

export { router as teleQualityRoutes };
