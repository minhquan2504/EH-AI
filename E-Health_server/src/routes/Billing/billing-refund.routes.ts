import { Router } from 'express';
import { BillingRefundController } from '../../controllers/Billing/billing-refund.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';

const router = Router();

// ═══════════════════════════════════════════════════════════════
// NHÓM 1: YÊU CẦU HOÀN TIỀN
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/refunds/requests:
 *   post:
 *     summary: Tạo yêu cầu hoàn tiền
 *     description: |
 *       Tạo request hoàn tiền cho giao dịch đã thành công (SUCCESS).
 *
 *       **FULL:** hoàn toàn bộ số tiền còn lại (trừ đã hoàn trước đó).
 *       **PARTIAL:** hoàn 1 phần — phải chỉ định refund_amount.
 *
 *       **Auto-approve:** Nếu refund_amount ≤ 50,000 VND → tự động phê duyệt.
 *
 *       Phân quyền: BILLING_REFUND_REQUEST
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.7.1 Yêu cầu hoàn tiền]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [transaction_id, refund_type, reason_category, reason_detail]
 *             properties:
 *               transaction_id:
 *                 type: string
 *                 example: "TXN_abc123def456"
 *               refund_type:
 *                 type: string
 *                 enum: [FULL, PARTIAL]
 *                 example: "PARTIAL"
 *               refund_amount:
 *                 type: number
 *                 description: Bắt buộc nếu PARTIAL
 *                 example: 150000
 *               refund_method:
 *                 type: string
 *                 description: Mặc định = phương thức gốc
 *                 enum: [CASH, CREDIT_CARD, BANK_TRANSFER]
 *               reason_category:
 *                 type: string
 *                 enum: [OVERCHARGE, SERVICE_CANCELLED, DUPLICATE_PAYMENT, WRONG_PATIENT, QUALITY_ISSUE, PATIENT_REQUEST, OTHER]
 *                 example: "SERVICE_CANCELLED"
 *               reason_detail:
 *                 type: string
 *                 example: "Bệnh nhân hủy dịch vụ xét nghiệm máu"
 *               evidence_urls:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["https://storage.example.com/receipts/scan001.pdf"]
 *               notes:
 *                 type: string
 *               facility_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Yêu cầu đã tạo (PENDING hoặc auto APPROVED)
 *       400:
 *         description: |
 *           - RFD_002: GD không tồn tại
 *           - RFD_003: GD chưa SUCCESS
 *           - RFD_004: Đã hoàn toàn bộ
 *           - RFD_005: Vượt số tiền có thể hoàn
 *           - RFD_007: Lý do không hợp lệ
 */
router.post('/refunds/requests', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingRefundController.createRefundRequest);

/**
 * @swagger
 * /api/billing/refunds/requests:
 *   get:
 *     summary: Danh sách yêu cầu hoàn tiền
 *     description: |
 *       Phân quyền: BILLING_REFUND_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.7.1 Yêu cầu hoàn tiền]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, APPROVED, REJECTED, PROCESSING, COMPLETED, FAILED, CANCELLED] }
 *       - in: query
 *         name: refund_type
 *         schema: { type: string, enum: [FULL, PARTIAL] }
 *       - in: query
 *         name: reason_category
 *         schema: { type: string }
 *       - in: query
 *         name: patient_id
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
router.get('/refunds/requests', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingRefundController.getRefundRequests);

/**
 * @swagger
 * /api/billing/refunds/requests/{id}:
 *   get:
 *     summary: Chi tiết yêu cầu hoàn tiền
 *     description: |
 *       Kèm thông tin GD gốc, invoice, bệnh nhân, người xử lý.
 *
 *       Phân quyền: BILLING_REFUND_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.7.1 Yêu cầu hoàn tiền]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "RFD_abc123" }
 *     responses:
 *       200:
 *         description: Chi tiết yêu cầu
 *       404:
 *         description: Không tìm thấy
 */
router.get('/refunds/requests/:id', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingRefundController.getRefundById);

// ═══════════════════════════════════════════════════════════════
// NHÓM 2: PHÊ DUYỆT HOÀN TIỀN
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/refunds/requests/{id}/approve:
 *   patch:
 *     summary: Phê duyệt yêu cầu hoàn tiền (PENDING → APPROVED)
 *     description: |
 *       Phân quyền: BILLING_REFUND_APPROVE
 *       Vai trò được phép: ADMIN
 *     tags: [9.7.2 Phê duyệt hoàn tiền]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "RFD_abc123" }
 *     responses:
 *       200:
 *         description: Phê duyệt thành công
 *       400:
 *         description: RFD_009 — Không ở PENDING
 */
router.patch('/refunds/requests/:id/approve', verifyAccessToken, authorizeRoles('ADMIN'), BillingRefundController.approveRefund);

/**
 * @swagger
 * /api/billing/refunds/requests/{id}/reject:
 *   patch:
 *     summary: Từ chối yêu cầu hoàn tiền (PENDING → REJECTED)
 *     description: |
 *       Phân quyền: BILLING_REFUND_APPROVE
 *       Vai trò được phép: ADMIN
 *     tags: [9.7.2 Phê duyệt hoàn tiền]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "RFD_abc123" }
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
 *                 example: "Không đủ chứng từ, cần bổ sung biên lai gốc"
 *     responses:
 *       200:
 *         description: Từ chối thành công
 */
router.patch('/refunds/requests/:id/reject', verifyAccessToken, authorizeRoles('ADMIN'), BillingRefundController.rejectRefund);

/**
 * @swagger
 * /api/billing/refunds/requests/{id}/process:
 *   patch:
 *     summary: Xử lý hoàn tiền (APPROVED → COMPLETED)
 *     description: |
 *       Thực hiện hoàn tiền:
 *       1. Tạo giao dịch REFUND trong `payment_transactions`
 *       2. Cập nhật `invoices.paid_amount` và `status`
 *       3. Đánh dấu COMPLETED
 *
 *       Nếu lỗi → tự đánh dấu FAILED.
 *
 *       Phân quyền: BILLING_REFUND_PROCESS
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.7.2 Phê duyệt hoàn tiền]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "RFD_abc123" }
 *     responses:
 *       200:
 *         description: Hoàn tiền thành công
 *       400:
 *         description: RFD_010 — Chưa được phê duyệt
 */
router.patch('/refunds/requests/:id/process', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingRefundController.processRefund);

/**
 * @swagger
 * /api/billing/refunds/requests/{id}/cancel:
 *   patch:
 *     summary: Hủy yêu cầu hoàn tiền (chỉ PENDING)
 *     description: |
 *       Phân quyền: BILLING_REFUND_REQUEST
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.7.2 Phê duyệt hoàn tiền]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "RFD_abc123" }
 *     responses:
 *       200:
 *         description: Hủy thành công
 *       400:
 *         description: RFD_020 — Chỉ hủy khi PENDING
 */
router.patch('/refunds/requests/:id/cancel', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingRefundController.cancelRefund);

// ═══════════════════════════════════════════════════════════════
// NHÓM 3: ĐIỀU CHỈNH GIAO DỊCH
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/refunds/adjustments:
 *   post:
 *     summary: Tạo yêu cầu điều chỉnh giao dịch
 *     description: |
 *       Điều chỉnh khi phát hiện sai lệch:
 *       - **OVERCHARGE:** Thu dư → adjustment_amount < 0 (cần hoàn)
 *       - **UNDERCHARGE:** Thu thiếu → adjustment_amount > 0 (cần thu thêm)
 *       - **WRONG_METHOD:** Sai phương thức thanh toán
 *       - **DUPLICATE:** Trùng giao dịch
 *       - **OTHER:** Khác
 *
 *       Phân quyền: BILLING_ADJUSTMENT_CREATE
 *       Vai trò được phép: ADMIN
 *     tags: [9.7.3 Điều chỉnh giao dịch]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [original_transaction_id, adjustment_type, adjustment_amount, description]
 *             properties:
 *               original_transaction_id:
 *                 type: string
 *                 example: "TXN_abc123def456"
 *               adjustment_type:
 *                 type: string
 *                 enum: [OVERCHARGE, UNDERCHARGE, WRONG_METHOD, DUPLICATE, OTHER]
 *                 example: "OVERCHARGE"
 *               adjustment_amount:
 *                 type: number
 *                 description: "+ = cần thu thêm, - = cần hoàn"
 *                 example: -50000
 *               description:
 *                 type: string
 *                 example: "Thu dư 50,000 VND do nhập sai đơn giá"
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công (PENDING)
 *       400:
 *         description: |
 *           - RFD_002: GD không tồn tại
 *           - RFD_018: Loại điều chỉnh không hợp lệ
 */
router.post('/refunds/adjustments', verifyAccessToken, authorizeRoles('ADMIN'), BillingRefundController.createAdjustment);

/**
 * @swagger
 * /api/billing/refunds/adjustments:
 *   get:
 *     summary: Danh sách điều chỉnh giao dịch
 *     description: |
 *       Phân quyền: BILLING_REFUND_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.7.3 Điều chỉnh giao dịch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, APPROVED, APPLIED, REJECTED] }
 *       - in: query
 *         name: adjustment_type
 *         schema: { type: string, enum: [OVERCHARGE, UNDERCHARGE, WRONG_METHOD, DUPLICATE, OTHER] }
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
router.get('/refunds/adjustments', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingRefundController.getAdjustments);

/**
 * @swagger
 * /api/billing/refunds/adjustments/{id}:
 *   get:
 *     summary: Chi tiết điều chỉnh
 *     description: |
 *       Phân quyền: BILLING_REFUND_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.7.3 Điều chỉnh giao dịch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "ADJ_abc123" }
 *     responses:
 *       200:
 *         description: Chi tiết
 *       404:
 *         description: Không tìm thấy
 */
router.get('/refunds/adjustments/:id', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingRefundController.getAdjustmentById);

/**
 * @swagger
 * /api/billing/refunds/adjustments/{id}/approve:
 *   patch:
 *     summary: Phê duyệt điều chỉnh (PENDING → APPROVED)
 *     description: |
 *       Phân quyền: BILLING_ADJUSTMENT_APPROVE
 *       Vai trò được phép: ADMIN
 *     tags: [9.7.3 Điều chỉnh giao dịch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "ADJ_abc123" }
 *     responses:
 *       200:
 *         description: Phê duyệt thành công
 *       400:
 *         description: RFD_015 — Không ở PENDING
 */
router.patch('/refunds/adjustments/:id/approve', verifyAccessToken, authorizeRoles('ADMIN'), BillingRefundController.approveAdjustment);

/**
 * @swagger
 * /api/billing/refunds/adjustments/{id}/apply:
 *   patch:
 *     summary: Áp dụng điều chỉnh (APPROVED → APPLIED)
 *     description: |
 *       Tạo giao dịch bù/hoàn:
 *       - amount > 0 → tạo PAYMENT bổ sung
 *       - amount < 0 → tạo REFUND
 *
 *       Cập nhật invoice paid_amount + status.
 *
 *       Phân quyền: BILLING_ADJUSTMENT_APPROVE
 *       Vai trò được phép: ADMIN
 *     tags: [9.7.3 Điều chỉnh giao dịch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "ADJ_abc123" }
 *     responses:
 *       200:
 *         description: Áp dụng thành công — GD bù đã tạo
 *       400:
 *         description: RFD_016 — Chưa được duyệt
 */
router.patch('/refunds/adjustments/:id/apply', verifyAccessToken, authorizeRoles('ADMIN'), BillingRefundController.applyAdjustment);

/**
 * @swagger
 * /api/billing/refunds/adjustments/{id}/reject:
 *   patch:
 *     summary: Từ chối điều chỉnh (PENDING → REJECTED)
 *     description: |
 *       Phân quyền: BILLING_ADJUSTMENT_APPROVE
 *       Vai trò được phép: ADMIN
 *     tags: [9.7.3 Điều chỉnh giao dịch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "ADJ_abc123" }
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
 *                 example: "Không đủ bằng chứng sai lệch"
 *     responses:
 *       200:
 *         description: Từ chối thành công
 */
router.patch('/refunds/adjustments/:id/reject', verifyAccessToken, authorizeRoles('ADMIN'), BillingRefundController.rejectAdjustment);

// ═══════════════════════════════════════════════════════════════
// NHÓM 4: DASHBOARD & TRACKING
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/refunds/dashboard:
 *   get:
 *     summary: Dashboard hoàn tiền
 *     description: |
 *       Tổng quan: pending count/amount, total refunded, phân loại theo lý do,
 *       phân loại theo trạng thái, 10 yêu cầu PENDING mới nhất.
 *
 *       Phân quyền: BILLING_REFUND_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.7.4 Dashboard & Tracking]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get('/refunds/dashboard', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingRefundController.getDashboard);

/**
 * @swagger
 * /api/billing/refunds/requests/{id}/timeline:
 *   get:
 *     summary: Timeline yêu cầu hoàn tiền
 *     description: |
 *       Chuỗi sự kiện: CREATED → APPROVED → PROCESSING → COMPLETED
 *       (hoặc REJECTED/CANCELLED).
 *
 *       Phân quyền: BILLING_REFUND_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.7.4 Dashboard & Tracking]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "RFD_abc123" }
 *     responses:
 *       200:
 *         description: Danh sách events
 *       404:
 *         description: Không tìm thấy
 */
router.get('/refunds/requests/:id/timeline', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingRefundController.getRefundTimeline);

/**
 * @swagger
 * /api/billing/refunds/transaction/{txnId}/history:
 *   get:
 *     summary: Lịch sử hoàn/điều chỉnh cho 1 giao dịch
 *     description: |
 *       Trả về tất cả refund_requests + adjustments cho 1 GD cụ thể.
 *
 *       Phân quyền: BILLING_REFUND_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.7.4 Dashboard & Tracking]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: txnId
 *         required: true
 *         schema: { type: string, example: "TXN_abc123def456" }
 *     responses:
 *       200:
 *         description: Refund requests + adjustments
 *       404:
 *         description: Không tìm thấy GD
 */
router.get('/refunds/transaction/:txnId/history', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingRefundController.getTransactionHistory);

export default router;
