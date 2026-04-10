import { Router } from 'express';
import { TeleConfigController } from '../../controllers/Remote Consultation/tele-config.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';

const router = Router();

// ═══════════════════════════════════════════════════
// NHÓM 1: CẤU HÌNH HỆ THỐNG (static routes trước)
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/admin/configs:
 *   get:
 *     summary: Danh sách cấu hình (filter category)
 *     description: |
 *       Trả về tất cả configs, filter theo category: PLATFORM, SECURITY, USAGE_LIMIT, OPERATION, SLA.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN
 *     tags: [8.9.1 Cấu hình hệ thống]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [PLATFORM, SECURITY, USAGE_LIMIT, OPERATION, SLA] }
 *     responses:
 *       200:
 *         description: DS configs
 */
router.get('/admin/configs', verifyAccessToken, authorizeRoles('ADMIN'), TeleConfigController.getAllConfigs);

/**
 * @swagger
 * /api/teleconsultation/admin/configs/batch:
 *   put:
 *     summary: Cập nhật nhiều config cùng lúc
 *     description: |
 *       Batch update. Config không tìm thấy hoặc không editable sẽ bị skip.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN
 *     tags: [8.9.1 Cấu hình hệ thống]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [configs]
 *             properties:
 *               configs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [config_key, config_value]
 *                   properties:
 *                     config_key: { type: string }
 *                     config_value: { type: string }
 *                 example:
 *                   - { config_key: 'MAX_SESSION_DURATION_MINUTES', config_value: '90' }
 *                   - { config_key: 'MAX_DAILY_CONSULTATIONS_PER_DOCTOR', config_value: '25' }
 *     responses:
 *       200:
 *         description: Kết quả batch (updated, skipped)
 */
router.put('/admin/configs/batch', verifyAccessToken, authorizeRoles('ADMIN'), TeleConfigController.batchUpdate);

/**
 * @swagger
 * /api/teleconsultation/admin/configs/reset:
 *   post:
 *     summary: Reset config về mặc định
 *     description: |
 *       Ghi audit log và đánh dấu reset. User cần chạy lại seed SQL.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN
 *     tags: [8.9.1 Cấu hình hệ thống]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reset thành công
 */
router.post('/admin/configs/reset', verifyAccessToken, authorizeRoles('ADMIN'), TeleConfigController.resetDefaults);

/**
 * @swagger
 * /api/teleconsultation/admin/configs/audit-log:
 *   get:
 *     summary: Lịch sử thay đổi config
 *     description: |
 *       Audit trail: ai sửa, lúc nào, giá trị cũ → mới. Filter theo config_key.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN
 *     tags: [8.9.1 Cấu hình hệ thống]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: config_key
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Audit log
 */
router.get('/admin/configs/audit-log', verifyAccessToken, authorizeRoles('ADMIN'), TeleConfigController.getAuditLog);

/**
 * @swagger
 * /api/teleconsultation/admin/configs/{configKey}:
 *   get:
 *     summary: Lấy 1 config
 *     description: |
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN
 *     tags: [8.9.1 Cấu hình hệ thống]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: configKey
 *         required: true
 *         schema: { type: string, example: 'MAX_SESSION_DURATION_MINUTES' }
 *     responses:
 *       200:
 *         description: Chi tiết config
 *   put:
 *     summary: Cập nhật 1 config
 *     description: |
 *       Cập nhật giá trị. Ghi audit log. Config `is_editable = false` → 403.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN
 *     tags: [8.9.1 Cấu hình hệ thống]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: configKey
 *         required: true
 *         schema: { type: string, example: 'MAX_SESSION_DURATION_MINUTES' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [config_value]
 *             properties:
 *               config_value: { type: string, example: '90' }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       403:
 *         description: Config không cho phép sửa
 */
router.get('/admin/configs/:configKey', verifyAccessToken, authorizeRoles('ADMIN'), TeleConfigController.getConfig);
router.put('/admin/configs/:configKey', verifyAccessToken, authorizeRoles('ADMIN'), TeleConfigController.updateConfig);

// ═══════════════════════════════════════════════════
// NHÓM 2: CHI PHÍ DỊCH VỤ
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/admin/pricing:
 *   get:
 *     summary: Danh sách bảng giá (filter)
 *     description: |
 *       Filter theo type_id, specialty_id, facility_id, is_active.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN
 *     tags: [8.9.2 Chi phí dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type_id
 *         schema: { type: string }
 *       - in: query
 *         name: specialty_id
 *         schema: { type: string }
 *       - in: query
 *         name: facility_id
 *         schema: { type: string }
 *       - in: query
 *         name: is_active
 *         schema: { type: boolean }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: DS bảng giá
 *   post:
 *     summary: Tạo bảng giá mới
 *     description: |
 *       1 bộ giá per (type + specialty + facility + effective_from) UNIQUE.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN
 *     tags: [8.9.2 Chi phí dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type_id, base_price, effective_from]
 *             properties:
 *               type_id: { type: string, example: 'TELE_TYPE_VIDEO' }
 *               specialty_id: { type: string, example: 'SPEC_001' }
 *               facility_id: { type: string, example: 'FAC_001' }
 *               base_price: { type: number, example: 200000 }
 *               currency: { type: string, example: 'VND' }
 *               discount_percent: { type: number, example: 10 }
 *               effective_from: { type: string, format: date, example: '2026-04-01' }
 *               effective_to: { type: string, format: date, example: '2026-12-31' }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       409:
 *         description: Trùng lặp
 */
router.get('/admin/pricing', verifyAccessToken, authorizeRoles('ADMIN'), TeleConfigController.listPricing);
router.post('/admin/pricing', verifyAccessToken, authorizeRoles('ADMIN'), TeleConfigController.createPricing);

/**
 * @swagger
 * /api/teleconsultation/admin/pricing/lookup:
 *   get:
 *     summary: Tra cứu giá hiện hành
 *     description: |
 *       Trả về bảng giá active, đang hiệu lực cho bộ (type + specialty + facility). Tính final_price = base_price * (1 - discount%).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.9.2 Chi phí dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type_id
 *         required: true
 *         schema: { type: string, example: 'TELE_TYPE_VIDEO' }
 *       - in: query
 *         name: specialty_id
 *         schema: { type: string }
 *       - in: query
 *         name: facility_id
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Giá hiện hành + final_price
 */
router.get('/admin/pricing/lookup', verifyAccessToken, TeleConfigController.lookupPrice);

/**
 * @swagger
 * /api/teleconsultation/admin/pricing/{pricingId}:
 *   put:
 *     summary: Cập nhật bảng giá
 *     description: |
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN
 *     tags: [8.9.2 Chi phí dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pricingId
 *         required: true
 *         schema: { type: string, example: 'TP_abc123' }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               base_price: { type: number, example: 250000 }
 *               discount_percent: { type: number, example: 15 }
 *               is_active: { type: boolean, example: true }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa bảng giá
 *     description: |
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN
 *     tags: [8.9.2 Chi phí dịch vụ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pricingId
 *         required: true
 *         schema: { type: string, example: 'TP_abc123' }
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.put('/admin/pricing/:pricingId', verifyAccessToken, authorizeRoles('ADMIN'), TeleConfigController.updatePricing);
router.delete('/admin/pricing/:pricingId', verifyAccessToken, authorizeRoles('ADMIN'), TeleConfigController.deletePricing);

// ═══════════════════════════════════════════════════
// NHÓM 3: SLA
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/admin/sla/dashboard:
 *   get:
 *     summary: Dashboard SLA (30 ngày gần nhất)
 *     description: |
 *       Metrics: total, completed, cancelled, completion_rate. Kèm SLA targets từ config.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN
 *     tags: [8.9.3 SLA & Vận hành]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SLA dashboard
 */
router.get('/admin/sla/dashboard', verifyAccessToken, authorizeRoles('ADMIN'), TeleConfigController.getSlaDashboard);

/**
 * @swagger
 * /api/teleconsultation/admin/sla/breaches:
 *   get:
 *     summary: DS vi phạm SLA (phiên bị hủy 30 ngày gần nhất)
 *     description: |
 *       Trả về phiên CANCELLED với thông tin BN, BS, lý do hủy.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN
 *     tags: [8.9.3 SLA & Vận hành]
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
 *         description: DS breaches
 */
router.get('/admin/sla/breaches', verifyAccessToken, authorizeRoles('ADMIN'), TeleConfigController.getSlaBreaches);

export { router as teleConfigRoutes };
