import { Router } from 'express';
import { BillingOfflinePaymentController } from '../../controllers/Billing/billing-offline-payment.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';

const router = Router();

// ═══════════════════════════════════════════════════════════════
// NHÓM 1: THANH TOÁN TẠI QUẦY
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/offline/pay:
 *   post:
 *     summary: Thanh toán tại quầy
 *     description: |
 *       Ghi nhận thanh toán trực tiếp tại quầy thu ngân.
 *       Thu ngân **bắt buộc phải có ca mở** mới được thực hiện thu tiền.
 *       Hệ thống tự động ghi lại shift_id, terminal_id (nếu POS) và tạo biên lai.
 *
 *       **Phương thức hỗ trợ:** CASH (tiền mặt), CREDIT_CARD (máy POS), BANK_TRANSFER (chuyển khoản).
 *       - Nếu CASH: tự động tính tiền thừa (change_amount).
 *       - Nếu CREDIT_CARD: yêu cầu approval_code từ ngân hàng, có thể đính kèm terminal_id.
 *
 *       Phân quyền: BILLING_OFFLINE_PAYMENT
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.4.1 Thanh toán tại quầy]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invoice_id, payment_method, amount]
 *             properties:
 *               invoice_id:
 *                 type: string
 *                 example: "INV_abc123"
 *                 description: ID hóa đơn cần thanh toán
 *               payment_method:
 *                 type: string
 *                 enum: [CASH, CREDIT_CARD, BANK_TRANSFER]
 *                 example: "CASH"
 *                 description: Phương thức thanh toán
 *               amount:
 *                 type: number
 *                 example: 500000
 *                 description: Số tiền thanh toán (VND)
 *               terminal_id:
 *                 type: string
 *                 example: "POS_001"
 *                 description: ID thiết bị POS (chỉ khi method = CREDIT_CARD)
 *               approval_code:
 *                 type: string
 *                 example: "AUTH123456"
 *                 description: Mã phê duyệt từ ngân hàng (bắt buộc khi CREDIT_CARD)
 *               card_last_four:
 *                 type: string
 *                 example: "4567"
 *                 description: 4 số cuối thẻ
 *               card_brand:
 *                 type: string
 *                 enum: [VISA, MASTERCARD, JCB, NAPAS, UNKNOWN]
 *                 example: "VISA"
 *               notes:
 *                 type: string
 *                 example: "BN thanh toán tiền mặt"
 *     responses:
 *       201:
 *         description: Thanh toán thành công, trả về giao dịch + biên lai
 *       400:
 *         description: |
 *           Lỗi nghiệp vụ:
 *           - OFP_001: Chưa mở ca thu ngân
 *           - OFP_002: Không tìm thấy hóa đơn
 *           - OFP_003: Hóa đơn đã thanh toán đầy đủ
 *           - OFP_005: Số tiền phải > 0
 *           - OFP_006: Vượt quá số tiền còn lại
 *           - OFP_007: Phương thức không hợp lệ
 *           - OFP_023: Thanh toán POS yêu cầu approval_code
 */
router.post('/offline/pay', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingOfflinePaymentController.processPayment);

/**
 * @swagger
 * /api/billing/offline/transactions/{transactionId}/void:
 *   post:
 *     summary: Hủy giao dịch (VOID)
 *     description: |
 *       Hủy giao dịch thanh toán đã thực hiện sai tại quầy.
 *
 *       **Khác với REFUND**: VOID là hủy ngay giao dịch sai trong ca hiện tại, không tạo giao dịch đối ứng.
 *       REFUND là hoàn tiền cho bệnh nhân ở thời điểm sau.
 *
 *       **Ràng buộc:**
 *       - Chỉ được VOID trong vòng **30 phút** kể từ lúc thanh toán
 *       - Chỉ VOID giao dịch trong **cùng ca thu ngân** hiện tại
 *       - Giao dịch phải ở trạng thái SUCCESS
 *
 *       Phân quyền: BILLING_OFFLINE_VOID
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.4.1 Thanh toán tại quầy]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *           example: "TXN_abc123"
 *         description: ID giao dịch cần hủy
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [void_reason]
 *             properties:
 *               void_reason:
 *                 type: string
 *                 example: "Nhập sai số tiền, cần thanh toán lại"
 *     responses:
 *       200:
 *         description: Hủy giao dịch thành công
 *       400:
 *         description: |
 *           - OFP_009: Quá 30 phút
 *           - OFP_010: Khác ca thu ngân
 *           - OFP_011: Đã bị hủy trước đó
 *           - OFP_013: Thiếu lý do
 */
router.post('/offline/transactions/:transactionId/void', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingOfflinePaymentController.voidTransaction);

/**
 * @swagger
 * /api/billing/offline/transactions:
 *   get:
 *     summary: Danh sách giao dịch tại quầy
 *     description: |
 *       Lấy danh sách giao dịch thanh toán được thực hiện tại quầy (có shift_id).
 *       Phân biệt rõ với giao dịch online (Module 9.3).
 *
 *       Phân quyền: BILLING_OFFLINE_PAYMENT
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.4.1 Thanh toán tại quầy]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: shift_id
 *         schema:
 *           type: string
 *           example: "CSH_abc123"
 *         description: Filter theo ca thu ngân
 *       - in: query
 *         name: cashier_id
 *         schema:
 *           type: string
 *         description: Filter theo thu ngân
 *       - in: query
 *         name: payment_method
 *         schema:
 *           type: string
 *           enum: [CASH, CREDIT_CARD, BANK_TRANSFER]
 *         description: Filter theo phương thức
 *       - in: query
 *         name: terminal_id
 *         schema:
 *           type: string
 *         description: Filter theo thiết bị POS
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SUCCESS, VOIDED, REFUNDED]
 *         description: Filter theo trạng thái
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-03-01"
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-03-31"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *     responses:
 *       200:
 *         description: Danh sách giao dịch tại quầy + phân trang
 */
router.get('/offline/transactions', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingOfflinePaymentController.getTransactions);

// ═══════════════════════════════════════════════════════════════
// NHÓM 2: POS TERMINALS
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/offline/terminals:
 *   post:
 *     summary: Đăng ký thiết bị POS mới
 *     description: |
 *       Thêm thiết bị POS (máy quẹt thẻ) cho chi nhánh.
 *       Mỗi thiết bị có mã duy nhất (terminal_code).
 *
 *       Phân quyền: BILLING_POS_MANAGE
 *       Vai trò được phép: ADMIN
 *     tags: [9.4.2 Quản lý POS]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [terminal_code, terminal_name, branch_id]
 *             properties:
 *               terminal_code:
 *                 type: string
 *                 example: "POS-001"
 *               terminal_name:
 *                 type: string
 *                 example: "Máy POS quầy thu ngân 1"
 *               terminal_type:
 *                 type: string
 *                 enum: [CARD_READER, QR_SCANNER, COMBO]
 *                 example: "COMBO"
 *               brand:
 *                 type: string
 *                 example: "Ingenico"
 *               model:
 *                 type: string
 *                 example: "Move 5000"
 *               serial_number:
 *                 type: string
 *                 example: "SN-2024-001"
 *               location_description:
 *                 type: string
 *                 example: "Quầy thu ngân 1, tầng trệt"
 *               branch_id:
 *                 type: string
 *                 example: "BR_001"
 *     responses:
 *       201:
 *         description: Đăng ký POS thành công
 *       400:
 *         description: Mã POS trùng hoặc chi nhánh không tồn tại
 */
router.post('/offline/terminals', verifyAccessToken, authorizeRoles('ADMIN'), BillingOfflinePaymentController.createTerminal);

/**
 * @swagger
 * /api/billing/offline/terminals/{terminalId}:
 *   put:
 *     summary: Cập nhật thông tin thiết bị POS
 *     description: |
 *       Phân quyền: BILLING_POS_MANAGE
 *       Vai trò được phép: ADMIN
 *     tags: [9.4.2 Quản lý POS]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: terminalId
 *         required: true
 *         schema:
 *           type: string
 *           example: "POS_abc123"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               terminal_name:
 *                 type: string
 *                 example: "Máy POS quầy 2"
 *               terminal_type:
 *                 type: string
 *                 enum: [CARD_READER, QR_SCANNER, COMBO]
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               serial_number:
 *                 type: string
 *               location_description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy POS
 */
router.put('/offline/terminals/:terminalId', verifyAccessToken, authorizeRoles('ADMIN'), BillingOfflinePaymentController.updateTerminal);

/**
 * @swagger
 * /api/billing/offline/terminals:
 *   get:
 *     summary: Danh sách thiết bị POS
 *     description: |
 *       Phân quyền: BILLING_OFFLINE_PAYMENT
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.4.2 Quản lý POS]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *           example: "BR_001"
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *     responses:
 *       200:
 *         description: Danh sách POS + phân trang
 */
router.get('/offline/terminals', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingOfflinePaymentController.getTerminals);

/**
 * @swagger
 * /api/billing/offline/terminals/{terminalId}:
 *   get:
 *     summary: Chi tiết thiết bị POS
 *     description: |
 *       Phân quyền: BILLING_OFFLINE_PAYMENT
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.4.2 Quản lý POS]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: terminalId
 *         required: true
 *         schema:
 *           type: string
 *           example: "POS_abc123"
 *     responses:
 *       200:
 *         description: Chi tiết POS
 *       404:
 *         description: Không tìm thấy
 */
router.get('/offline/terminals/:terminalId', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingOfflinePaymentController.getTerminalById);

/**
 * @swagger
 * /api/billing/offline/terminals/{terminalId}/toggle:
 *   patch:
 *     summary: Bật/tắt thiết bị POS
 *     description: |
 *       Toggle trạng thái is_active của thiết bị POS.
 *
 *       Phân quyền: BILLING_POS_MANAGE
 *       Vai trò được phép: ADMIN
 *     tags: [9.4.2 Quản lý POS]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: terminalId
 *         required: true
 *         schema:
 *           type: string
 *           example: "POS_abc123"
 *     responses:
 *       200:
 *         description: Toggle thành công
 *       404:
 *         description: Không tìm thấy POS
 */
router.patch('/offline/terminals/:terminalId/toggle', verifyAccessToken, authorizeRoles('ADMIN'), BillingOfflinePaymentController.toggleTerminal);

// ═══════════════════════════════════════════════════════════════
// NHÓM 3: BIÊN LAI
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/offline/receipts/by-transaction/{transactionId}:
 *   get:
 *     summary: Lấy biên lai theo giao dịch
 *     description: |
 *       Phân quyền: BILLING_OFFLINE_PAYMENT
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.4.3 Biên lai thanh toán]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *           example: "TXN_abc123"
 *     responses:
 *       200:
 *         description: Biên lai thanh toán (snapshot đầy đủ thông tin)
 *       404:
 *         description: Không tìm thấy biên lai
 */
router.get('/offline/receipts/by-transaction/:transactionId', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingOfflinePaymentController.getReceiptByTransaction);

/**
 * @swagger
 * /api/billing/offline/receipts/{receiptId}:
 *   get:
 *     summary: Chi tiết biên lai
 *     description: |
 *       Phân quyền: BILLING_OFFLINE_PAYMENT
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.4.3 Biên lai thanh toán]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: receiptId
 *         required: true
 *         schema:
 *           type: string
 *           example: "RCP_abc123"
 *     responses:
 *       200:
 *         description: Chi tiết biên lai
 *       404:
 *         description: Không tìm thấy
 */
router.get('/offline/receipts/:receiptId', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingOfflinePaymentController.getReceiptById);

/**
 * @swagger
 * /api/billing/offline/receipts/{receiptId}/reprint:
 *   post:
 *     summary: In lại biên lai
 *     description: |
 *       Ghi nhận việc in lại biên lai (tăng reprint_count).
 *       Không cho phép in lại biên lai đã bị VOID.
 *
 *       Phân quyền: BILLING_RECEIPT_REPRINT
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.4.3 Biên lai thanh toán]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: receiptId
 *         required: true
 *         schema:
 *           type: string
 *           example: "RCP_abc123"
 *     responses:
 *       200:
 *         description: In lại thành công (reprint_count tăng)
 *       400:
 *         description: Biên lai đã bị void
 *       404:
 *         description: Không tìm thấy biên lai
 */
router.post('/offline/receipts/:receiptId/reprint', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingOfflinePaymentController.reprintReceipt);

// ═══════════════════════════════════════════════════════════════
// NHÓM 4: CA THU NGÂN MỞ RỘNG
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/offline/shifts/{shiftId}/cash-denomination:
 *   post:
 *     summary: Kê khai mệnh giá tiền khi đóng ca
 *     description: |
 *       Thu ngân kê khai số lượng từng loại mệnh giá tiền mặt khi kết thúc ca.
 *       Hệ thống tính tổng tiền kê khai và so sánh với system_calculated_balance
 *       để phát hiện chênh lệch.
 *
 *       **Mệnh giá hợp lệ:** 500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000, 500
 *
 *       Phân quyền: BILLING_OFFLINE_PAYMENT
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.4.4 Ca thu ngân mở rộng]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema:
 *           type: string
 *           example: "CSH_abc123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [denominations]
 *             properties:
 *               denominations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [denomination_value, quantity]
 *                   properties:
 *                     denomination_value:
 *                       type: integer
 *                       example: 500000
 *                       description: Mệnh giá (VND)
 *                     quantity:
 *                       type: integer
 *                       example: 5
 *                       description: Số lượng tờ tiền
 *                 example:
 *                   - denomination_value: 500000
 *                     quantity: 5
 *                   - denomination_value: 200000
 *                     quantity: 3
 *                   - denomination_value: 100000
 *                     quantity: 10
 *                   - denomination_value: 50000
 *                     quantity: 8
 *     responses:
 *       200:
 *         description: Kê khai thành công
 *       400:
 *         description: Mệnh giá không hợp lệ
 *       404:
 *         description: Không tìm thấy ca thu ngân
 */
router.post('/offline/shifts/:shiftId/cash-denomination', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingOfflinePaymentController.submitCashDenomination);

/**
 * @swagger
 * /api/billing/offline/shifts/{shiftId}/transactions:
 *   get:
 *     summary: Giao dịch trong ca thu ngân
 *     description: |
 *       Liệt kê tất cả giao dịch (PAYMENT, REFUND, VOIDED) trong ca thu ngân cụ thể.
 *       Phân theo phương thức: CASH, CREDIT_CARD, BANK_TRANSFER.
 *
 *       Phân quyền: BILLING_OFFLINE_PAYMENT
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.4.4 Ca thu ngân mở rộng]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema:
 *           type: string
 *           example: "CSH_abc123"
 *     responses:
 *       200:
 *         description: Danh sách giao dịch trong ca
 *       404:
 *         description: Không tìm thấy ca
 */
router.get('/offline/shifts/:shiftId/transactions', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingOfflinePaymentController.getShiftTransactions);

/**
 * @swagger
 * /api/billing/offline/shifts/{shiftId}/summary:
 *   get:
 *     summary: Tổng kết ca thu ngân
 *     description: |
 *       Tổng hợp chi tiết ca thu ngân:
 *       - Thống kê tiền theo phương thức (CASH, POS, chuyển khoản)
 *       - Tổng số giao dịch, refund, void
 *       - Danh sách mệnh giá kê khai
 *       - Danh sách giao dịch chi tiết
 *       - Số dư đầu ca, cuối ca, system balance, chênh lệch
 *
 *       Phân quyền: BILLING_OFFLINE_PAYMENT
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.4.4 Ca thu ngân mở rộng]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema:
 *           type: string
 *           example: "CSH_abc123"
 *     responses:
 *       200:
 *         description: Tổng kết ca đầy đủ
 *       404:
 *         description: Không tìm thấy ca
 */
router.get('/offline/shifts/:shiftId/summary', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingOfflinePaymentController.getShiftSummary);

// ═══════════════════════════════════════════════════════════════
// NHÓM 5: BÁO CÁO
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/offline/reports/daily:
 *   get:
 *     summary: Báo cáo cuối ngày
 *     description: |
 *       Tổng hợp tất cả ca thu ngân trong ngày cho 1 branch hoặc facility.
 *       Bao gồm: tổng thu, tổng hoàn, tổng void, phân theo phương thức,
 *       phân theo thu ngân.
 *
 *       Phân quyền: BILLING_DAILY_REPORT
 *       Vai trò được phép: ADMIN
 *     tags: [9.4.5 Báo cáo]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: report_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-03-19"
 *         description: Ngày cần xem báo cáo
 *       - in: query
 *         name: facility_id
 *         schema:
 *           type: string
 *           example: "FAC_001"
 *         description: Filter theo cơ sở y tế
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *           example: "BR_001"
 *         description: Filter theo chi nhánh
 *     responses:
 *       200:
 *         description: Báo cáo cuối ngày chi tiết
 *       400:
 *         description: Facility hoặc branch không tồn tại
 */
router.get('/offline/reports/daily', verifyAccessToken, authorizeRoles('ADMIN'), BillingOfflinePaymentController.getDailyReport);

/**
 * @swagger
 * /api/billing/offline/reports/cashier-performance:
 *   get:
 *     summary: Hiệu suất thu ngân
 *     description: |
 *       Thống kê hiệu suất làm việc của thu ngân trong khoảng thời gian:
 *       - Tổng ca, tổng giao dịch, tổng thu
 *       - Tổng hoàn, tổng void
 *       - Trung bình giao dịch
 *       - Số lần chênh lệch ca, tổng chênh lệch
 *
 *       Phân quyền: BILLING_DAILY_REPORT
 *       Vai trò được phép: ADMIN
 *     tags: [9.4.5 Báo cáo]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: cashier_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID thu ngân cần xem hiệu suất
 *       - in: query
 *         name: date_from
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-03-01"
 *       - in: query
 *         name: date_to
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-03-31"
 *     responses:
 *       200:
 *         description: Thống kê hiệu suất thu ngân
 */
router.get('/offline/reports/cashier-performance', verifyAccessToken, authorizeRoles('ADMIN'), BillingOfflinePaymentController.getCashierPerformance);

export default router;
