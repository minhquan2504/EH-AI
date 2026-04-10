import { Router } from 'express';
import { BillingReconciliationController } from '../../controllers/Billing/billing-reconciliation.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';

const router = Router();

// ═══════════════════════════════════════════════════════════════
// NHÓM 1: ĐỐI SOÁT GIAO DỊCH
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/reconciliation/online:
 *   post:
 *     summary: Chạy đối soát giao dịch online
 *     description: |
 *       Gọi SePay API lấy giao dịch ngân hàng trong ngày, sau đó
 *       so sánh với `payment_transactions` (method=BANK_TRANSFER) trên hệ thống.
 *
 *       **Match logic:** gateway_transaction_id (system) ↔ reference_number (bank)
 *
 *       Kết quả phân loại:
 *       - **MATCHED:** Số tiền & mã tham chiếu khớp
 *       - **SYSTEM_ONLY:** Có trên hệ thống, không thấy trên ngân hàng
 *       - **EXTERNAL_ONLY:** Có trên ngân hàng, chưa ghi nhận trên hệ thống
 *       - **AMOUNT_MISMATCH:** Mã khớp nhưng chênh lệch số tiền
 *
 *       Phân quyền: BILLING_RECONCILE_RUN
 *       Vai trò được phép: ADMIN
 *     tags: [9.6.1 Đối soát giao dịch]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reconcile_date]
 *             properties:
 *               reconcile_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-19"
 *                 description: Ngày cần đối soát
 *               facility_id:
 *                 type: string
 *                 example: "FAC_001"
 *     responses:
 *       201:
 *         description: Đối soát thành công — trả về session kèm items
 *       400:
 *         description: |
 *           - REC_017: Ngày không hợp lệ
 *           - REC_020: Đã đối soát ngày này
 */
router.post('/reconciliation/online', verifyAccessToken, authorizeRoles('ADMIN'), BillingReconciliationController.runOnlineReconciliation);

/**
 * @swagger
 * /api/billing/reconciliation/shift/{shiftId}:
 *   post:
 *     summary: Chạy đối soát ca thu ngân
 *     description: |
 *       So sánh 3 giá trị cho ca đã đóng:
 *       1. **system_calculated_balance** — hệ thống tự tính (opening + payments - refunds)
 *       2. **actual_closing_balance** — thu ngân kê khai khi đóng ca
 *       3. **Σ denominations** — tổng mệnh giá × số lượng (Module 9.4)
 *
 *       Nếu 3 giá trị chênh lệch → tạo items AMOUNT_MISMATCH.
 *
 *       Phân quyền: BILLING_RECONCILE_RUN
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.6.1 Đối soát giao dịch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema: { type: string, example: "CSH_abc123" }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 example: "Đối soát ca sáng 19/03"
 *     responses:
 *       201:
 *         description: Đối soát ca thành công
 *       400:
 *         description: |
 *           - REC_009: Không tìm thấy ca
 *           - REC_010: Ca chưa đóng
 *           - REC_020: Đã đối soát ca này
 */
router.post('/reconciliation/shift/:shiftId', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingReconciliationController.runShiftReconciliation);

/**
 * @swagger
 * /api/billing/reconciliation/sessions:
 *   get:
 *     summary: Danh sách phiên đối soát
 *     description: |
 *       Phân quyền: BILLING_RECONCILE_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.6.1 Đối soát giao dịch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [ONLINE, CASHIER_SHIFT, DAILY_SETTLEMENT] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, REVIEWED, APPROVED, REJECTED, CLOSED] }
 *       - in: query
 *         name: facility_id
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
 *         description: Danh sách + phân trang
 */
router.get('/reconciliation/sessions', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingReconciliationController.getSessions);

/**
 * @swagger
 * /api/billing/reconciliation/sessions/{id}:
 *   get:
 *     summary: Chi tiết phiên đối soát
 *     description: |
 *       Trả về session kèm tất cả items (từng dòng giao dịch khớp/không khớp).
 *
 *       Phân quyền: BILLING_RECONCILE_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.6.1 Đối soát giao dịch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "REC_abc123" }
 *     responses:
 *       200:
 *         description: Chi tiết phiên
 *       404:
 *         description: Không tìm thấy
 */
router.get('/reconciliation/sessions/:id', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingReconciliationController.getSessionById);

/**
 * @swagger
 * /api/billing/reconciliation/shifts/{shiftId}/discrepancy:
 *   get:
 *     summary: Chi tiết chênh lệch ca thu ngân
 *     description: |
 *       Trả về so sánh 3 chiều: system balance, actual balance, denomination total.
 *       Kèm danh sách mệnh giá đã kê khai.
 *
 *       Phân quyền: BILLING_RECONCILE_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.6.1 Đối soát giao dịch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema: { type: string, example: "CSH_abc123" }
 *     responses:
 *       200:
 *         description: Chi tiết chênh lệch 3 chiều
 *       404:
 *         description: Không tìm thấy ca
 */
router.get('/reconciliation/shifts/:shiftId/discrepancy', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingReconciliationController.getShiftDiscrepancy);

// ═══════════════════════════════════════════════════════════════
// NHÓM 2: XỬ LÝ CHÊNH LỆCH
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/reconciliation/discrepancy-report:
 *   get:
 *     summary: Báo cáo chênh lệch tổng hợp
 *     description: |
 *       Tổng hợp tất cả items UNRESOLVED:
 *       - Phân loại severity: MINOR (< 10k), MAJOR (< 100k), CRITICAL (≥ 100k)
 *       - Nhóm theo loại đối soát (ONLINE/CASHIER_SHIFT)
 *       - 20 dòng chưa xử lý gần nhất
 *
 *       Phân quyền: BILLING_RECONCILE_VIEW
 *       Vai trò được phép: ADMIN
 *     tags: [9.6.2 Xử lý chênh lệch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: facility_id
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Báo cáo chênh lệch
 */
router.get('/reconciliation/discrepancy-report', verifyAccessToken, authorizeRoles('ADMIN'), BillingReconciliationController.getDiscrepancyReport);

/**
 * @swagger
 * /api/billing/reconciliation/items/{itemId}/resolve:
 *   patch:
 *     summary: Xử lý chênh lệch
 *     description: |
 *       Đánh dấu dòng chênh lệch đã xử lý (RESOLVED) hoặc ghi nhận bỏ qua (WRITTEN_OFF).
 *
 *       Phân quyền: BILLING_RECONCILE_RESOLVE
 *       Vai trò được phép: ADMIN
 *     tags: [9.6.2 Xử lý chênh lệch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string, example: "RI_abc123" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resolution_status, resolution_notes]
 *             properties:
 *               resolution_status:
 *                 type: string
 *                 enum: [RESOLVED, WRITTEN_OFF]
 *                 example: "RESOLVED"
 *               resolution_notes:
 *                 type: string
 *                 example: "Đã đối chiếu với bank và xác nhận đúng"
 *     responses:
 *       200:
 *         description: Xử lý thành công
 *       400:
 *         description: |
 *           - REC_005: Không tìm thấy
 *           - REC_006: Đã xử lý
 *           - REC_007: Thiếu trạng thái
 *           - REC_008: Thiếu ghi chú
 */
router.patch('/reconciliation/items/:itemId/resolve', verifyAccessToken, authorizeRoles('ADMIN'), BillingReconciliationController.resolveItem);

/**
 * @swagger
 * /api/billing/reconciliation/sessions/{id}/review:
 *   patch:
 *     summary: Review phiên đối soát (PENDING → REVIEWED)
 *     description: |
 *       Kế toán xác nhận đã kiểm tra phiên đối soát.
 *
 *       Phân quyền: BILLING_RECONCILE_RESOLVE
 *       Vai trò được phép: ADMIN
 *     tags: [9.6.2 Xử lý chênh lệch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "REC_abc123" }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 example: "Đã kiểm tra, chênh lệch nhỏ chấp nhận được"
 *     responses:
 *       200:
 *         description: Review thành công
 *       400:
 *         description: REC_002 — Chỉ review khi PENDING
 */
router.patch('/reconciliation/sessions/:id/review', verifyAccessToken, authorizeRoles('ADMIN'), BillingReconciliationController.reviewSession);

/**
 * @swagger
 * /api/billing/reconciliation/sessions/{id}/approve:
 *   patch:
 *     summary: Phê duyệt phiên đối soát (REVIEWED → APPROVED)
 *     description: |
 *       Kế toán trưởng phê duyệt kết quả đối soát.
 *
 *       Phân quyền: BILLING_RECONCILE_RESOLVE
 *       Vai trò được phép: ADMIN
 *     tags: [9.6.2 Xử lý chênh lệch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "REC_abc123" }
 *     responses:
 *       200:
 *         description: Phê duyệt thành công
 *       400:
 *         description: REC_003 — Chỉ approve khi REVIEWED
 */
router.patch('/reconciliation/sessions/:id/approve', verifyAccessToken, authorizeRoles('ADMIN'), BillingReconciliationController.approveSession);

/**
 * @swagger
 * /api/billing/reconciliation/sessions/{id}/reject:
 *   patch:
 *     summary: Từ chối phiên đối soát (REVIEWED → REJECTED)
 *     description: |
 *       Phân quyền: BILLING_RECONCILE_RESOLVE
 *       Vai trò được phép: ADMIN
 *     tags: [9.6.2 Xử lý chênh lệch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "REC_abc123" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reject_reason]
 *             properties:
 *               reject_reason:
 *                 type: string
 *                 example: "Chênh lệch quá lớn, cần đối soát lại"
 *     responses:
 *       200:
 *         description: Từ chối thành công
 */
router.patch('/reconciliation/sessions/:id/reject', verifyAccessToken, authorizeRoles('ADMIN'), BillingReconciliationController.rejectSession);

// ═══════════════════════════════════════════════════════════════
// NHÓM 3: QUYẾT TOÁN
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/reconciliation/settlements:
 *   post:
 *     summary: Tạo phiếu quyết toán
 *     description: |
 *       Tự động tổng hợp từ `payment_transactions` theo khoảng thời gian:
 *       - Tổng revenue: cash, card, transfer, online
 *       - Tổng refunds, voids
 *       - Net revenue = total - refunds - voids
 *       - Snapshot discrepancies (đã có / chưa giải quyết)
 *
 *       Status ban đầu: **DRAFT**
 *
 *       Phân quyền: BILLING_SETTLEMENT_CREATE
 *       Vai trò được phép: ADMIN
 *     tags: [9.6.3 Quyết toán]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [report_type, period_start, period_end]
 *             properties:
 *               report_type:
 *                 type: string
 *                 enum: [DAILY, WEEKLY, MONTHLY, CUSTOM]
 *                 example: "DAILY"
 *               period_start:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-19"
 *               period_end:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-19"
 *               facility_id:
 *                 type: string
 *                 example: "FAC_001"
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo phiếu thành công (DRAFT)
 *       400:
 *         description: REC_017 — Ngày không hợp lệ
 */
router.post('/reconciliation/settlements', verifyAccessToken, authorizeRoles('ADMIN'), BillingReconciliationController.createSettlement);

/**
 * @swagger
 * /api/billing/reconciliation/settlements/{id}/submit:
 *   patch:
 *     summary: Gửi phiếu quyết toán (DRAFT → SUBMITTED)
 *     description: |
 *       Phân quyền: BILLING_SETTLEMENT_CREATE
 *       Vai trò được phép: ADMIN
 *     tags: [9.6.3 Quyết toán]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "STL_abc123" }
 *     responses:
 *       200:
 *         description: Gửi thành công
 *       400:
 *         description: REC_014 — Chỉ gửi khi DRAFT
 */
router.patch('/reconciliation/settlements/:id/submit', verifyAccessToken, authorizeRoles('ADMIN'), BillingReconciliationController.submitSettlement);

/**
 * @swagger
 * /api/billing/reconciliation/settlements/{id}/approve:
 *   patch:
 *     summary: Phê duyệt quyết toán (SUBMITTED → APPROVED)
 *     description: |
 *       Phân quyền: BILLING_SETTLEMENT_APPROVE
 *       Vai trò được phép: ADMIN
 *     tags: [9.6.3 Quyết toán]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "STL_abc123" }
 *     responses:
 *       200:
 *         description: Phê duyệt thành công
 *       400:
 *         description: REC_015 — Chỉ approve khi SUBMITTED
 */
router.patch('/reconciliation/settlements/:id/approve', verifyAccessToken, authorizeRoles('ADMIN'), BillingReconciliationController.approveSettlement);

/**
 * @swagger
 * /api/billing/reconciliation/settlements/{id}/reject:
 *   patch:
 *     summary: Từ chối quyết toán (SUBMITTED → REJECTED)
 *     description: |
 *       Phân quyền: BILLING_SETTLEMENT_APPROVE
 *       Vai trò được phép: ADMIN
 *     tags: [9.6.3 Quyết toán]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "STL_abc123" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reject_reason]
 *             properties:
 *               reject_reason:
 *                 type: string
 *                 example: "Chưa giải quyết hết chênh lệch"
 *     responses:
 *       200:
 *         description: Từ chối thành công
 */
router.patch('/reconciliation/settlements/:id/reject', verifyAccessToken, authorizeRoles('ADMIN'), BillingReconciliationController.rejectSettlement);

/**
 * @swagger
 * /api/billing/reconciliation/settlements:
 *   get:
 *     summary: Danh sách phiếu quyết toán
 *     description: |
 *       Phân quyền: BILLING_SETTLEMENT_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.6.3 Quyết toán]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [DAILY, WEEKLY, MONTHLY, CUSTOM] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFT, SUBMITTED, APPROVED, REJECTED] }
 *       - in: query
 *         name: facility_id
 *         schema: { type: string }
 *       - in: query
 *         name: date_from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: date_to
 *         schema: { type: string, format: date }
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
router.get('/reconciliation/settlements', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingReconciliationController.getSettlements);

/**
 * @swagger
 * /api/billing/reconciliation/settlements/{id}:
 *   get:
 *     summary: Chi tiết phiếu quyết toán
 *     description: |
 *       Kèm export_data (snapshot đầy đủ revenue breakdown + discrepancies).
 *
 *       Phân quyền: BILLING_SETTLEMENT_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.6.3 Quyết toán]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "STL_abc123" }
 *     responses:
 *       200:
 *         description: Chi tiết phiếu
 *       404:
 *         description: Không tìm thấy
 */
router.get('/reconciliation/settlements/:id', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingReconciliationController.getSettlementById);

// ═══════════════════════════════════════════════════════════════
// NHÓM 4: LỊCH SỬ & XUẤT BÁO CÁO
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/reconciliation/history:
 *   get:
 *     summary: Lịch sử đối soát
 *     description: |
 *       Danh sách tất cả phiên đối soát — filter theo loại, trạng thái, ngày.
 *
 *       Phân quyền: BILLING_RECONCILE_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.6.4 Lịch sử & xuất báo cáo]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [ONLINE, CASHIER_SHIFT, DAILY_SETTLEMENT] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, REVIEWED, APPROVED, REJECTED, CLOSED] }
 *       - in: query
 *         name: facility_id
 *         schema: { type: string }
 *       - in: query
 *         name: date_from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: date_to
 *         schema: { type: string, format: date }
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
router.get('/reconciliation/history', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingReconciliationController.getHistory);

/**
 * @swagger
 * /api/billing/reconciliation/settlements/{id}/export:
 *   get:
 *     summary: Xuất data quyết toán
 *     description: |
 *       Trả về JSON đầy đủ cho frontend render Excel/PDF:
 *       report info, revenue breakdown, discrepancy summary,
 *       approval info, generated timestamp.
 *
 *       Phân quyền: BILLING_SETTLEMENT_VIEW
 *       Vai trò được phép: ADMIN
 *     tags: [9.6.4 Lịch sử & xuất báo cáo]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "STL_abc123" }
 *     responses:
 *       200:
 *         description: Data quyết toán (JSON)
 *       404:
 *         description: Không tìm thấy
 */
router.get('/reconciliation/settlements/:id/export', verifyAccessToken, authorizeRoles('ADMIN'), BillingReconciliationController.exportSettlement);

export default router;
