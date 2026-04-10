import { Router } from 'express';
import { TeleConsultationTypeController } from '../../controllers/Remote Consultation/tele-consultation-type.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';

const router = Router();

// ═══════════════════════════════════════════════════════════════
// NHÓM 1: QUẢN LÝ LOẠI HÌNH KHÁM TỪ XA
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/types:
 *   post:
 *     summary: Tạo loại hình khám từ xa
 *     description: |
 *       Tạo mới 1 loại hình khám từ xa (VIDEO, AUDIO, CHAT, HYBRID hoặc tùy chỉnh).
 *       Hệ thống tự động gán capabilities mặc định dựa trên code:
 *       - VIDEO: requires_video=true, requires_audio=true, allows_file_sharing=true, allows_screen_sharing=true
 *       - AUDIO: requires_audio=true
 *       - CHAT: allows_file_sharing=true
 *       - HYBRID: tất cả = true
 *
 *       Validate: code UNIQUE, thời lượng min <= default <= max.
 *
 *       Phân quyền: TELECONSULTATION_MANAGE
 *       Vai trò được phép: ADMIN
 *     tags: [8.1.1 Quản lý loại hình khám từ xa]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name]
 *             properties:
 *               code:
 *                 type: string
 *                 description: "Mã loại hình (UNIQUE, tự động uppercase)"
 *                 example: "VIDEO"
 *               name:
 *                 type: string
 *                 example: "Khám qua Video"
 *               description:
 *                 type: string
 *                 example: "Khám bệnh trực tuyến qua cuộc gọi video 2 chiều"
 *               default_platform:
 *                 type: string
 *                 enum: [AGORA, ZOOM, STRINGEE, INTERNAL_CHAT]
 *                 example: "AGORA"
 *               requires_video:
 *                 type: boolean
 *                 example: true
 *               requires_audio:
 *                 type: boolean
 *                 example: true
 *               allows_file_sharing:
 *                 type: boolean
 *                 example: true
 *               allows_screen_sharing:
 *                 type: boolean
 *                 example: true
 *               default_duration_minutes:
 *                 type: integer
 *                 description: "Thời lượng mặc định (phút)"
 *                 example: 30
 *               min_duration_minutes:
 *                 type: integer
 *                 example: 15
 *               max_duration_minutes:
 *                 type: integer
 *                 example: 60
 *               icon_url:
 *                 type: string
 *               sort_order:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: RMC_002 — Code đã tồn tại | RMC_009 — Thời lượng không hợp lệ
 */
router.post('/types', verifyAccessToken, authorizeRoles('ADMIN'), TeleConsultationTypeController.createType);

/**
 * @swagger
 * /api/teleconsultation/types/active:
 *   get:
 *     summary: Danh sách hình thức đang hoạt động (cho dropdown)
 *     description: |
 *       Trả về tất cả loại hình is_active = true, sắp xếp theo sort_order.
 *       Kèm total_configs (số CK đã cấu hình).
 *
 *       Phân quyền: Yêu cầu đăng nhập
 *       Vai trò được phép: Tất cả user đã xác thực
 *     tags: [8.1.1 Quản lý loại hình khám từ xa]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Danh sách loại hình active
 */
router.get('/types/active', verifyAccessToken, TeleConsultationTypeController.getActiveTypes);

/**
 * @swagger
 * /api/teleconsultation/types:
 *   get:
 *     summary: Danh sách loại hình khám từ xa
 *     description: |
 *       Lọc theo is_active, keyword (tên, code, mô tả).
 *       Sắp xếp: sort_order ASC, created_at DESC.
 *       Kèm total_configs mỗi loại hình.
 *
 *       Phân quyền: TELECONSULTATION_VIEW
 *       Vai trò được phép: ADMIN, DOCTOR, NURSE
 *     tags: [8.1.1 Quản lý loại hình khám từ xa]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: is_active
 *         schema: { type: string, enum: [true, false] }
 *       - in: query
 *         name: keyword
 *         schema: { type: string, example: "video" }
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 20 }
 *     responses:
 *       200:
 *         description: Danh sách + phân trang
 */
router.get('/types', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'), TeleConsultationTypeController.getTypes);

/**
 * @swagger
 * /api/teleconsultation/types/{typeId}:
 *   get:
 *     summary: Chi tiết loại hình khám từ xa
 *     description: |
 *       Phân quyền: TELECONSULTATION_VIEW
 *       Vai trò được phép: ADMIN, DOCTOR
 *     tags: [8.1.1 Quản lý loại hình khám từ xa]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: typeId
 *         required: true
 *         schema: { type: string, example: "TCT_VIDEO" }
 *     responses:
 *       200:
 *         description: Chi tiết loại hình
 *       404:
 *         description: RMC_001 — Không tìm thấy
 */
router.get('/types/:typeId', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleConsultationTypeController.getTypeById);

/**
 * @swagger
 * /api/teleconsultation/types/{typeId}:
 *   put:
 *     summary: Cập nhật loại hình khám từ xa
 *     description: |
 *       Cập nhật tên, mô tả, capabilities, thời lượng, trạng thái.
 *       Validate thời lượng: min <= default <= max.
 *
 *       Phân quyền: TELECONSULTATION_MANAGE
 *       Vai trò được phép: ADMIN
 *     tags: [8.1.1 Quản lý loại hình khám từ xa]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: typeId
 *         required: true
 *         schema: { type: string, example: "TCT_VIDEO" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Khám qua Video Call" }
 *               description: { type: string }
 *               default_platform: { type: string, enum: [AGORA, ZOOM, STRINGEE, INTERNAL_CHAT] }
 *               requires_video: { type: boolean }
 *               requires_audio: { type: boolean }
 *               allows_file_sharing: { type: boolean }
 *               allows_screen_sharing: { type: boolean }
 *               default_duration_minutes: { type: integer, example: 30 }
 *               min_duration_minutes: { type: integer, example: 15 }
 *               max_duration_minutes: { type: integer, example: 60 }
 *               sort_order: { type: integer }
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: RMC_009 — Thời lượng không hợp lệ
 */
router.put('/types/:typeId', verifyAccessToken, authorizeRoles('ADMIN'), TeleConsultationTypeController.updateType);

/**
 * @swagger
 * /api/teleconsultation/types/{typeId}:
 *   delete:
 *     summary: Xóa loại hình khám từ xa (Soft delete)
 *     description: |
 *       Soft delete. Không cho xóa nếu đang có config chuyên khoa sử dụng.
 *
 *       Phân quyền: TELECONSULTATION_MANAGE
 *       Vai trò được phép: ADMIN
 *     tags: [8.1.1 Quản lý loại hình khám từ xa]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: typeId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       400:
 *         description: RMC_011 — Đang có config sử dụng
 */
router.delete('/types/:typeId', verifyAccessToken, authorizeRoles('ADMIN'), TeleConsultationTypeController.deleteType);

// ═══════════════════════════════════════════════════════════════
// NHÓM 2: CẤU HÌNH CHUYÊN KHOA
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/configs:
 *   post:
 *     summary: Tạo cấu hình chuyên khoa cho loại hình
 *     description: |
 *       Cấu hình 1 loại hình khám từ xa cho 1 chuyên khoa tại 1 cơ sở.
 *       UNIQUE constraint: (type_id + specialty_id + facility_id).
 *
 *       Validate:
 *       - type_id tồn tại và is_active
 *       - specialty_id tồn tại
 *       - facility_id tồn tại
 *       - facility_service_id tồn tại (nếu có)
 *       - base_price >= 0
 *       - Thời lượng override: min <= default <= max
 *
 *       Phân quyền: TELECONSULTATION_MANAGE
 *       Vai trò được phép: ADMIN
 *     tags: [8.1.2 Cấu hình chuyên khoa]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type_id, specialty_id, facility_id, base_price]
 *             properties:
 *               type_id:
 *                 type: string
 *                 example: "TCT_VIDEO"
 *               specialty_id:
 *                 type: string
 *                 example: "SPE_noitq"
 *               facility_id:
 *                 type: string
 *                 example: "FAC_main01"
 *               facility_service_id:
 *                 type: string
 *                 description: "Liên kết dịch vụ cơ sở (để áp dụng Price Policy Module 9)"
 *               is_enabled:
 *                 type: boolean
 *                 example: true
 *               allowed_platforms:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["AGORA", "ZOOM"]
 *               min_duration_minutes:
 *                 type: integer
 *                 description: "Override thời lượng tối thiểu (null = dùng default từ type)"
 *                 example: 15
 *               max_duration_minutes:
 *                 type: integer
 *                 example: 45
 *               default_duration_minutes:
 *                 type: integer
 *                 example: 30
 *               base_price:
 *                 type: number
 *                 description: "Giá cơ bản (VND)"
 *                 example: 200000
 *               insurance_price:
 *                 type: number
 *                 description: "Giá BHYT chi trả"
 *                 example: 150000
 *               vip_price:
 *                 type: number
 *                 description: "Giá VIP"
 *                 example: 300000
 *               max_patients_per_slot:
 *                 type: integer
 *                 example: 1
 *               advance_booking_days:
 *                 type: integer
 *                 description: "Đặt trước tối đa (ngày)"
 *                 example: 30
 *               cancellation_hours:
 *                 type: integer
 *                 description: "Hủy trước (giờ)"
 *                 example: 2
 *               auto_record:
 *                 type: boolean
 *                 example: false
 *               priority:
 *                 type: integer
 *                 example: 0
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: RMC_005 — Config đã tồn tại | RMC_006 — CK không tìm thấy | RMC_010 — Giá không hợp lệ
 */
router.post('/configs', verifyAccessToken, authorizeRoles('ADMIN'), TeleConsultationTypeController.createConfig);

/**
 * @swagger
 * /api/teleconsultation/configs/batch:
 *   post:
 *     summary: Tạo hàng loạt cấu hình cho 1 loại hình × nhiều chuyên khoa
 *     description: |
 *       Batch create configs cho 1 type_id + 1 facility_id + nhiều specialty_id.
 *       Tự động skip nếu config đã tồn tại (upsert logic).
 *       Trả về: { created: N, skipped: M, errors: [] }
 *
 *       Phân quyền: TELECONSULTATION_MANAGE
 *       Vai trò được phép: ADMIN
 *     tags: [8.1.2 Cấu hình chuyên khoa]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type_id, facility_id, configs]
 *             properties:
 *               type_id:
 *                 type: string
 *                 example: "TCT_VIDEO"
 *               facility_id:
 *                 type: string
 *                 example: "FAC_main01"
 *               configs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [specialty_id, base_price]
 *                   properties:
 *                     specialty_id:
 *                       type: string
 *                       example: "SPE_noitq"
 *                     base_price:
 *                       type: number
 *                       example: 200000
 *                     insurance_price:
 *                       type: number
 *                       example: 150000
 *                     vip_price:
 *                       type: number
 *                       example: 300000
 *                     min_duration_minutes:
 *                       type: integer
 *                     max_duration_minutes:
 *                       type: integer
 *                     default_duration_minutes:
 *                       type: integer
 *                     allowed_platforms:
 *                       type: array
 *                       items: { type: string }
 *                     auto_record:
 *                       type: boolean
 *     responses:
 *       201:
 *         description: "{ created: 3, skipped: 1, errors: [] }"
 *       400:
 *         description: RMC_001 — Type không tìm thấy | RMC_012 — Không có config
 */
router.post('/configs/batch', verifyAccessToken, authorizeRoles('ADMIN'), TeleConsultationTypeController.batchCreateConfigs);

/**
 * @swagger
 * /api/teleconsultation/configs:
 *   get:
 *     summary: Danh sách cấu hình chuyên khoa
 *     description: |
 *       Lọc theo type_id, specialty_id, facility_id, is_enabled, is_active.
 *       JOIN: type, specialty, facility, facility_service.
 *
 *       Phân quyền: TELECONSULTATION_VIEW
 *       Vai trò được phép: ADMIN, DOCTOR
 *     tags: [8.1.2 Cấu hình chuyên khoa]
 *     security: [{ bearerAuth: [] }]
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
 *         name: is_enabled
 *         schema: { type: string, enum: [true, false] }
 *       - in: query
 *         name: is_active
 *         schema: { type: string, enum: [true, false] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 20 }
 *     responses:
 *       200:
 *         description: Danh sách + phân trang
 */
router.get('/configs', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleConsultationTypeController.getConfigs);

/**
 * @swagger
 * /api/teleconsultation/configs/{configId}:
 *   get:
 *     summary: Chi tiết cấu hình chuyên khoa
 *     description: |
 *       Phân quyền: TELECONSULTATION_VIEW
 *       Vai trò được phép: ADMIN, DOCTOR
 *     tags: [8.1.2 Cấu hình chuyên khoa]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Chi tiết config
 *       404:
 *         description: RMC_004 — Không tìm thấy
 */
router.get('/configs/:configId', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleConsultationTypeController.getConfigById);

/**
 * @swagger
 * /api/teleconsultation/configs/{configId}:
 *   put:
 *     summary: Cập nhật cấu hình chuyên khoa
 *     description: |
 *       Cập nhật giá, thời lượng, platforms, bật/tắt, v.v.
 *
 *       Phân quyền: TELECONSULTATION_MANAGE
 *       Vai trò được phép: ADMIN
 *     tags: [8.1.2 Cấu hình chuyên khoa]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_enabled: { type: boolean }
 *               allowed_platforms: { type: array, items: { type: string }, example: ["AGORA","ZOOM"] }
 *               base_price: { type: number, example: 250000 }
 *               insurance_price: { type: number }
 *               vip_price: { type: number }
 *               min_duration_minutes: { type: integer }
 *               max_duration_minutes: { type: integer }
 *               default_duration_minutes: { type: integer }
 *               max_patients_per_slot: { type: integer }
 *               advance_booking_days: { type: integer }
 *               cancellation_hours: { type: integer }
 *               auto_record: { type: boolean }
 *               priority: { type: integer }
 *               notes: { type: string }
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: RMC_010 — Giá không hợp lệ
 */
router.put('/configs/:configId', verifyAccessToken, authorizeRoles('ADMIN'), TeleConsultationTypeController.updateConfig);

/**
 * @swagger
 * /api/teleconsultation/configs/{configId}:
 *   delete:
 *     summary: Xóa cấu hình chuyên khoa (Soft delete)
 *     description: |
 *       Phân quyền: TELECONSULTATION_MANAGE
 *       Vai trò được phép: ADMIN
 *     tags: [8.1.2 Cấu hình chuyên khoa]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: RMC_004 — Không tìm thấy
 */
router.delete('/configs/:configId', verifyAccessToken, authorizeRoles('ADMIN'), TeleConsultationTypeController.deleteConfig);

/**
 * @swagger
 * /api/teleconsultation/types/{typeId}/specialties:
 *   get:
 *     summary: Danh sách CK đã cấu hình cho 1 loại hình
 *     description: |
 *       Trả về danh sách chuyên khoa đã được cấu hình cho loại hình typeId.
 *       Filter thêm theo facility_id nếu cần.
 *
 *       Phân quyền: TELECONSULTATION_VIEW
 *       Vai trò được phép: ADMIN, DOCTOR
 *     tags: [8.1.2 Cấu hình chuyên khoa]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: typeId
 *         required: true
 *         schema: { type: string, example: "TCT_VIDEO" }
 *       - in: query
 *         name: facility_id
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Danh sách CK + config
 *       404:
 *         description: RMC_001 — Type không tìm thấy
 */
router.get('/types/:typeId/specialties', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleConsultationTypeController.getSpecialtiesByType);

/**
 * @swagger
 * /api/teleconsultation/specialties/{specialtyId}/types:
 *   get:
 *     summary: Danh sách loại hình khả dụng cho 1 chuyên khoa
 *     description: |
 *       Trả về các hình thức khám từ xa khả dụng cho chuyên khoa (is_enabled + is_active).
 *       Kèm giá (base, insurance, VIP), thời lượng, platforms.
 *       Filter theo facility_id nếu cần.
 *       Dùng cho frontend hiển thị dropdown "Chọn hình thức khám" khi đặt lịch.
 *
 *       Phân quyền: Yêu cầu đăng nhập
 *       Vai trò được phép: Tất cả user đã xác thực
 *     tags: [8.1.2 Cấu hình chuyên khoa]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: specialtyId
 *         required: true
 *         schema: { type: string, example: "SPE_noitq" }
 *       - in: query
 *         name: facility_id
 *         schema: { type: string, example: "FAC_main01" }
 *     responses:
 *       200:
 *         description: Mảng loại hình khả dụng kèm giá và thời lượng
 */
router.get('/specialties/:specialtyId/types', verifyAccessToken, TeleConsultationTypeController.getTypesBySpecialty);

// ═══════════════════════════════════════════════════════════════
// NHÓM 3: TRA CỨU & THỐNG KÊ
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/availability:
 *   get:
 *     summary: Kiểm tra hình thức khả dụng cho 1 CK + 1 cơ sở
 *     description: |
 *       Kết hợp tele_consultation_types + tele_type_specialty_config.
 *       Chỉ trả về config is_enabled=true, is_active=true, type is_active=true.
 *       Kèm giá, thời lượng (COALESCE config vs type default), platforms.
 *
 *       Mục đích: Frontend dùng để hiển thị dropdown "Chọn hình thức khám"
 *       khi bệnh nhân đặt lịch tư vấn từ xa.
 *
 *       Phân quyền: Yêu cầu đăng nhập
 *       Vai trò được phép: Tất cả user đã xác thực
 *     tags: [8.1.3 Tra cứu & Thống kê]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: specialty_id
 *         required: true
 *         schema: { type: string, example: "SPE_noitq" }
 *       - in: query
 *         name: facility_id
 *         required: true
 *         schema: { type: string, example: "FAC_main01" }
 *     responses:
 *       200:
 *         description: Mảng hình thức khả dụng
 */
router.get('/availability', verifyAccessToken, TeleConsultationTypeController.checkAvailability);

/**
 * @swagger
 * /api/teleconsultation/stats:
 *   get:
 *     summary: Thống kê tổng quan khám từ xa
 *     description: |
 *       Tổng hợp:
 *       - Tổng loại hình (active/inactive)
 *       - Tổng cấu hình CK (enabled/disabled)
 *       - Số CK đã/chưa cấu hình
 *       - Giá trung bình / min / max theo loại hình
 *       - Top 5 cơ sở có nhiều cấu hình nhất
 *
 *       Phân quyền: TELECONSULTATION_DASHBOARD
 *       Vai trò được phép: ADMIN
 *     tags: [8.1.3 Tra cứu & Thống kê]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Thống kê tổng quan
 */
router.get('/stats', verifyAccessToken, authorizeRoles('ADMIN'), TeleConsultationTypeController.getStats);

export { router as teleConsultationTypeRoutes };
