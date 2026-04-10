import { Router } from 'express';
import { BillingCashierAuthController } from '../../controllers/Billing/billing-cashier-auth.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';

const router = Router();

// ═══════════════════════════════════════════════════════════════
// NHÓM 1: HỒ SƠ THU NGÂN
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/cashier-auth/profiles:
 *   post:
 *     summary: Gán user làm thu ngân
 *     description: |
 *       ADMIN chỉ định user làm thu ngân, gán quyền thu/hoàn/VOID, branch, supervisor.
 *       1 user chỉ được gán 1 profile.
 *
 *       Phân quyền: CASHIER_AUTH_MANAGE
 *       Vai trò được phép: ADMIN
 *     tags: [9.9.1 Hồ sơ thu ngân]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id]
 *             properties:
 *               user_id:
 *                 type: string
 *                 example: "USR_cashier01"
 *               employee_code:
 *                 type: string
 *                 example: "TN-001"
 *               branch_id:
 *                 type: string
 *               facility_id:
 *                 type: string
 *               can_collect_payment:
 *                 type: boolean
 *                 example: true
 *               can_process_refund:
 *                 type: boolean
 *                 example: false
 *               can_void_transaction:
 *                 type: boolean
 *                 example: false
 *               can_open_shift:
 *                 type: boolean
 *                 example: true
 *               can_close_shift:
 *                 type: boolean
 *                 example: true
 *               supervisor_id:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: CSH_002 — User đã được gán
 */
router.post('/cashier-auth/profiles', verifyAccessToken, authorizeRoles('ADMIN'), BillingCashierAuthController.createProfile);

/**
 * @swagger
 * /api/billing/cashier-auth/profiles:
 *   get:
 *     summary: Danh sách thu ngân
 *     description: |
 *       Filter theo branch, facility, active.
 *
 *       Phân quyền: CASHIER_AUTH_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.9.1 Hồ sơ thu ngân]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         schema: { type: string }
 *       - in: query
 *         name: facility_id
 *         schema: { type: string }
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
router.get('/cashier-auth/profiles', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingCashierAuthController.getProfiles);

/**
 * @swagger
 * /api/billing/cashier-auth/profiles/by-user/{userId}:
 *   get:
 *     summary: Tìm hồ sơ theo userId
 *     description: |
 *       Phân quyền: CASHIER_AUTH_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.9.1 Hồ sơ thu ngân]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, example: "USR_cashier01" }
 *     responses:
 *       200:
 *         description: Chi tiết profile
 *       404:
 *         description: Không tìm thấy
 */
router.get('/cashier-auth/profiles/by-user/:userId', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingCashierAuthController.getProfileByUserId);

/**
 * @swagger
 * /api/billing/cashier-auth/profiles/{id}:
 *   get:
 *     summary: Chi tiết hồ sơ thu ngân
 *     description: |
 *       Phân quyền: CASHIER_AUTH_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.9.1 Hồ sơ thu ngân]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Chi tiết
 *       404:
 *         description: Không tìm thấy
 */
router.get('/cashier-auth/profiles/:id', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingCashierAuthController.getProfileById);

/**
 * @swagger
 * /api/billing/cashier-auth/profiles/{id}:
 *   put:
 *     summary: Cập nhật hồ sơ thu ngân
 *     description: |
 *       Cập nhật quyền, branch, supervisor, trạng thái.
 *       Tự động ghi nhật ký PROFILE_UPDATE.
 *
 *       Phân quyền: CASHIER_AUTH_MANAGE
 *       Vai trò được phép: ADMIN
 *     tags: [9.9.1 Hồ sơ thu ngân]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               can_collect_payment: { type: boolean }
 *               can_process_refund: { type: boolean }
 *               can_void_transaction: { type: boolean }
 *               supervisor_id: { type: string }
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/cashier-auth/profiles/:id', verifyAccessToken, authorizeRoles('ADMIN'), BillingCashierAuthController.updateProfile);

/**
 * @swagger
 * /api/billing/cashier-auth/profiles/{id}:
 *   delete:
 *     summary: Vô hiệu hóa thu ngân
 *     description: |
 *       Soft delete (is_active = false).
 *
 *       Phân quyền: CASHIER_AUTH_MANAGE
 *       Vai trò được phép: ADMIN
 *     tags: [9.9.1 Hồ sơ thu ngân]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Vô hiệu hóa thành công
 */
router.delete('/cashier-auth/profiles/:id', verifyAccessToken, authorizeRoles('ADMIN'), BillingCashierAuthController.deleteProfile);

// ═══════════════════════════════════════════════════════════════
// NHÓM 2: GIỚI HẠN THAO TÁC
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/cashier-auth/limits:
 *   post:
 *     summary: Đặt giới hạn thao tác cho thu ngân
 *     description: |
 *       Cấu hình giới hạn VND mỗi GD, mỗi ca, mỗi ngày.
 *       Tự động upsert (nếu đã có → cập nhật).
 *
 *       Phân quyền: CASHIER_AUTH_MANAGE
 *       Vai trò được phép: ADMIN
 *     tags: [9.9.2 Giới hạn thao tác]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cashier_profile_id]
 *             properties:
 *               cashier_profile_id:
 *                 type: string
 *                 example: "CSP_abc123"
 *               max_single_payment:
 *                 type: number
 *                 description: "Max VND 1 GD thu"
 *                 example: 50000000
 *               max_single_refund:
 *                 type: number
 *                 example: 10000000
 *               max_single_void:
 *                 type: number
 *                 example: 10000000
 *               max_shift_total:
 *                 type: number
 *                 description: "Tổng thu trong 1 ca"
 *                 example: 500000000
 *               max_shift_refund_total:
 *                 type: number
 *                 example: 50000000
 *               max_shift_void_count:
 *                 type: integer
 *                 example: 5
 *               max_daily_total:
 *                 type: number
 *                 example: 1000000000
 *               max_daily_refund_total:
 *                 type: number
 *                 example: 100000000
 *               max_daily_void_count:
 *                 type: integer
 *                 example: 10
 *               require_approval_above:
 *                 type: number
 *                 description: "GD > X VND cần supervisor approve"
 *                 example: 20000000
 *     responses:
 *       201:
 *         description: Cấu hình thành công
 */
router.post('/cashier-auth/limits', verifyAccessToken, authorizeRoles('ADMIN'), BillingCashierAuthController.setLimit);

/**
 * @swagger
 * /api/billing/cashier-auth/limits/check:
 *   post:
 *     summary: Kiểm tra giới hạn trước giao dịch
 *     description: |
 *       Check 1 thao tác có vượt limit không:
 *       1. Quyền (can_collect/refund/void)
 *       2. Single limit
 *       3. Shift limit (tổng ca)
 *       4. Daily limit (tổng ngày)
 *       5. Supervisor approval (nếu > ngưỡng)
 *
 *       Trả về: allowed, requires_approval, exceeded_limits[], current_usage.
 *
 *       Phân quyền: CASHIER_AUTH_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.9.2 Giới hạn thao tác]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, action_type, amount]
 *             properties:
 *               user_id:
 *                 type: string
 *                 example: "USR_cashier01"
 *               action_type:
 *                 type: string
 *                 enum: [PAYMENT, REFUND, VOID]
 *                 example: "PAYMENT"
 *               amount:
 *                 type: number
 *                 example: 5000000
 *               shift_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thao tác trong giới hạn
 *       403:
 *         description: Vượt giới hạn (kèm exceeded_limits[])
 */
router.post('/cashier-auth/limits/check', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingCashierAuthController.checkLimit);

/**
 * @swagger
 * /api/billing/cashier-auth/limits/{profileId}:
 *   get:
 *     summary: Xem giới hạn thu ngân
 *     description: |
 *       Phân quyền: CASHIER_AUTH_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.9.2 Giới hạn thao tác]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Giới hạn hiện tại
 *       404:
 *         description: Chưa cấu hình
 */
router.get('/cashier-auth/limits/:profileId', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingCashierAuthController.getLimit);

/**
 * @swagger
 * /api/billing/cashier-auth/limits/{profileId}:
 *   put:
 *     summary: Cập nhật giới hạn
 *     description: |
 *       Phân quyền: CASHIER_AUTH_MANAGE
 *       Vai trò được phép: ADMIN
 *     tags: [9.9.2 Giới hạn thao tác]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               max_single_payment: { type: number }
 *               max_shift_total: { type: number }
 *               max_daily_total: { type: number }
 *               require_approval_above: { type: number }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/cashier-auth/limits/:profileId', verifyAccessToken, authorizeRoles('ADMIN'), BillingCashierAuthController.updateLimit);

// ═══════════════════════════════════════════════════════════════
// NHÓM 3: KHÓA CA / MỞ CA
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/cashier-auth/shifts/active:
 *   get:
 *     summary: Danh sách ca đang OPEN/LOCKED
 *     description: |
 *       Kèm thông tin thu ngân, branch, facility.
 *
 *       Phân quyền: CASHIER_AUTH_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.9.3 Khóa ca / Mở ca]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Danh sách ca active
 */
router.get('/cashier-auth/shifts/active', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingCashierAuthController.getActiveShifts);

/**
 * @swagger
 * /api/billing/cashier-auth/shifts/{shiftId}/lock:
 *   patch:
 *     summary: Khóa ca thu ngân
 *     description: |
 *       Ngừng giao dịch trong ca. Bắt buộc ghi reason.
 *       OPEN → LOCKED. 
 *       Tự ghi nhật ký SHIFT_LOCK.
 *
 *       Phân quyền: CASHIER_SHIFT_CONTROL
 *       Vai trò được phép: ADMIN
 *     tags: [9.9.3 Khóa ca / Mở ca]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Kiểm tra chênh lệch tiền mặt"
 *     responses:
 *       200:
 *         description: Khóa ca thành công
 *       400:
 *         description: CSH_023 — Ca đã bị khóa
 */
router.patch('/cashier-auth/shifts/:shiftId/lock', verifyAccessToken, authorizeRoles('ADMIN'), BillingCashierAuthController.lockShift);

/**
 * @swagger
 * /api/billing/cashier-auth/shifts/{shiftId}/unlock:
 *   patch:
 *     summary: Mở khóa ca
 *     description: |
 *       LOCKED → OPEN. Admin/supervisor unlock.
 *       Tự ghi nhật ký SHIFT_UNLOCK.
 *
 *       Phân quyền: CASHIER_SHIFT_CONTROL
 *       Vai trò được phép: ADMIN
 *     tags: [9.9.3 Khóa ca / Mở ca]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Mở khóa thành công
 */
router.patch('/cashier-auth/shifts/:shiftId/unlock', verifyAccessToken, authorizeRoles('ADMIN'), BillingCashierAuthController.unlockShift);

/**
 * @swagger
 * /api/billing/cashier-auth/shifts/{shiftId}/force-close:
 *   patch:
 *     summary: Force close ca thu ngân
 *     description: |
 *       Đóng ca sự cố (OPEN/LOCKED→CLOSED, force_closed=TRUE).
 *       Tự ghi nhật ký FORCE_CLOSE.
 *
 *       Phân quyền: CASHIER_SHIFT_CONTROL
 *       Vai trò được phép: ADMIN
 *     tags: [9.9.3 Khóa ca / Mở ca]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Force close thành công
 */
router.patch('/cashier-auth/shifts/:shiftId/force-close', verifyAccessToken, authorizeRoles('ADMIN'), BillingCashierAuthController.forceCloseShift);

/**
 * @swagger
 * /api/billing/cashier-auth/shifts/{shiftId}/handover:
 *   patch:
 *     summary: Bàn giao ca
 *     description: |
 *       Đóng ca hiện tại → chuyển cho thu ngân khác.
 *       Người nhận phải có cashier_profile.
 *       Tự ghi nhật ký HANDOVER.
 *
 *       Phân quyền: CASHIER_SHIFT_CONTROL
 *       Vai trò được phép: ADMIN
 *     tags: [9.9.3 Khóa ca / Mở ca]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [handover_to]
 *             properties:
 *               handover_to:
 *                 type: string
 *                 description: "user_id người nhận bàn giao"
 *                 example: "USR_cashier02"
 *     responses:
 *       200:
 *         description: Bàn giao thành công
 *       400:
 *         description: CSH_028 — Người nhận chưa có profile
 */
router.patch('/cashier-auth/shifts/:shiftId/handover', verifyAccessToken, authorizeRoles('ADMIN'), BillingCashierAuthController.handoverShift);

// ═══════════════════════════════════════════════════════════════
// NHÓM 4: NHẬT KÝ HOẠT ĐỘNG
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/cashier-auth/activity-logs:
 *   get:
 *     summary: Nhật ký hoạt động thu ngân
 *     description: |
 *       Filter theo action_type, user_id, ngày.
 *
 *       Phân quyền: CASHIER_LOG_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.9.4 Nhật ký]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: action_type
 *         schema:
 *           type: string
 *           enum: [SHIFT_OPEN, SHIFT_CLOSE, SHIFT_LOCK, SHIFT_UNLOCK, PAYMENT, VOID, REFUND, LIMIT_EXCEEDED, FORCE_CLOSE, HANDOVER, PROFILE_UPDATE]
 *       - in: query
 *         name: user_id
 *         schema: { type: string }
 *       - in: query
 *         name: date_from
 *         schema: { type: string, format: date, example: "2026-03-01" }
 *       - in: query
 *         name: date_to
 *         schema: { type: string, format: date, example: "2026-03-31" }
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 20 }
 *     responses:
 *       200:
 *         description: Nhật ký + phân trang
 */
router.get('/cashier-auth/activity-logs', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingCashierAuthController.getLogs);

/**
 * @swagger
 * /api/billing/cashier-auth/activity-logs/shift/{shiftId}:
 *   get:
 *     summary: Nhật ký 1 ca
 *     description: |
 *       Phân quyền: CASHIER_LOG_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.9.4 Nhật ký]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Timeline nhật ký ca
 */
router.get('/cashier-auth/activity-logs/shift/:shiftId', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingCashierAuthController.getLogsByShift);

/**
 * @swagger
 * /api/billing/cashier-auth/activity-logs/{profileId}:
 *   get:
 *     summary: Nhật ký 1 thu ngân
 *     description: |
 *       Phân quyền: CASHIER_LOG_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.9.4 Nhật ký]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 20 }
 *     responses:
 *       200:
 *         description: Nhật ký + phân trang
 */
router.get('/cashier-auth/activity-logs/:profileId', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingCashierAuthController.getLogsByProfile);

// ═══════════════════════════════════════════════════════════════
// NHÓM 5: DASHBOARD
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/cashier-auth/dashboard:
 *   get:
 *     summary: Dashboard phân quyền thu ngân
 *     description: |
 *       Tổng quan: thu ngân active, ca đang mở, GD hôm nay, cảnh báo vượt limit.
 *
 *       Phân quyền: CASHIER_DASHBOARD
 *       Vai trò được phép: ADMIN
 *     tags: [9.9.5 Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get('/cashier-auth/dashboard', verifyAccessToken, authorizeRoles('ADMIN'), BillingCashierAuthController.getDashboard);

/**
 * @swagger
 * /api/billing/cashier-auth/stats/{profileId}:
 *   get:
 *     summary: Thống kê cá nhân thu ngân
 *     description: |
 *       Tổng thu/hoàn/void hôm nay, tổng ca, limit usage %.
 *
 *       Phân quyền: CASHIER_AUTH_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.9.5 Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Thống kê cá nhân + limit usage %
 *       404:
 *         description: Không tìm thấy
 */
router.get('/cashier-auth/stats/:profileId', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingCashierAuthController.getCashierStats);

export default router;
