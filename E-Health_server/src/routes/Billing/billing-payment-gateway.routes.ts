import { Router } from 'express';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';
import { verifySepayWebhook } from '../../middleware/verifyWebhook.middleware';
import * as ctrl from '../../controllers/Billing/billing-payment-gateway.controller';

const router = Router();

// =============================================
// NHÓM 1: PAYMENT ORDERS (Lệnh thanh toán QR)
// =============================================

/**
 * @swagger
 * /api/billing/payments/qr-generate:
 *   post:
 *     summary: Sinh QR Code thanh toán cho hóa đơn
 *     description: |
 *       Tạo mã QR VietQR qua SePay để bệnh nhân quét thanh toán.
 *       - Nếu đã có lệnh PENDING chưa hết hạn → trả lại lệnh cũ
 *       - QR hết hạn sau 15 phút
 *       - Nội dung chuyển khoản tự động chứa mã lệnh để SePay detect
 *
 *       Phân quyền: Yêu cầu JWT Token
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.3 Payment Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invoice_id]
 *             properties:
 *               invoice_id:
 *                 type: string
 *                 example: "INV_242d7140064b4f"
 *               amount:
 *                 type: number
 *                 description: Số tiền (mặc định = số tiền còn lại)
 *                 example: 357050
 *               description:
 *                 type: string
 *                 example: "Thanh toán khám bệnh"
 *     responses:
 *       201:
 *         description: QR Code đã được sinh
 *       400:
 *         description: Lỗi nghiệp vụ
 */
router.post('/qr-generate', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), ctrl.generateQR);

/**
 * @swagger
 * /api/billing/payments/orders/{orderId}:
 *   get:
 *     summary: Xem chi tiết lệnh thanh toán
 *     description: |
 *       Lấy thông tin chi tiết lệnh thanh toán QR, bao gồm QR URL, trạng thái, thời gian còn lại.
 *
 *       Phân quyền: Yêu cầu JWT Token
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.3 Payment Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         example: "PO_abc123"
 *     responses:
 *       200:
 *         description: Chi tiết lệnh thanh toán
 *       404:
 *         description: Không tìm thấy
 */
router.get('/orders/:orderId', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), ctrl.getOrderDetail);

/**
 * @swagger
 * /api/billing/payments/orders/{orderId}/status:
 *   get:
 *     summary: Kiểm tra trạng thái lệnh (polling)
 *     description: |
 *       API nhẹ để frontend polling kiểm tra trạng thái thanh toán.
 *       Trả về: status, remaining_seconds, paid_at.
 *       Frontend nên polling mỗi 3-5 giây.
 *
 *       Phân quyền: Yêu cầu JWT Token
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.3 Payment Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         example: "PO_abc123"
 *     responses:
 *       200:
 *         description: Trạng thái hiện tại
 */
router.get('/orders/:orderId/status', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), ctrl.getOrderStatus);

/**
 * @swagger
 * /api/billing/payments/orders/{orderId}/cancel:
 *   post:
 *     summary: Hủy lệnh thanh toán QR
 *     description: |
 *       Hủy lệnh thanh toán đang PENDING. Không thể hủy nếu đã PAID.
 *
 *       Phân quyền: Yêu cầu JWT Token
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.3 Payment Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         example: "PO_abc123"
 *     responses:
 *       200:
 *         description: Hủy thành công
 *       400:
 *         description: Không thể hủy
 */
router.post('/orders/:orderId/cancel', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), ctrl.cancelOrder);

/**
 * @swagger
 * /api/billing/payments/invoice/{invoiceId}/orders:
 *   get:
 *     summary: Lịch sử QR đã sinh cho 1 hóa đơn
 *     description: |
 *       Lấy tất cả lệnh thanh toán QR đã tạo cho hóa đơn, bao gồm PAID/EXPIRED/CANCELLED.
 *
 *       Phân quyền: Yêu cầu JWT Token
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.3 Payment Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *         example: "INV_242d7140064b4f"
 *     responses:
 *       200:
 *         description: Danh sách lệnh thanh toán
 */
router.get('/invoice/:invoiceId/orders', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), ctrl.getOrdersByInvoice);

// =============================================
// NHÓM 2: WEBHOOK & CALLBACK
// =============================================

/**
 * @swagger
 * /api/billing/payments/webhook/sepay:
 *   post:
 *     summary: Webhook nhận callback từ SePay
 *     description: |
 *       Endpoint nhận thông báo giao dịch từ SePay. KHÔNG cần JWT.
 *       Xác thực bằng API Key trong header Authorization.
 *       SePay sẽ tự động gọi endpoint này khi phát hiện giao dịch tiền vào.
 *
 *       Phân quyền: Public (xác thực bằng SePay API Key)
 *       Vai trò được phép: Không yêu cầu (webhook từ SePay)
 *     tags: [9.3 Webhook]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: number
 *                 example: 123456
 *               gateway:
 *                 type: string
 *                 example: "SEPAY"
 *               transactionDate:
 *                 type: string
 *                 example: "2026-03-18 21:05:00"
 *               accountNumber:
 *                 type: string
 *                 example: "VQRQAHSGO9410"
 *               transferType:
 *                 type: string
 *                 example: "in"
 *               transferAmount:
 *                 type: number
 *                 example: 357050
 *               content:
 *                 type: string
 *                 example: "EHEALTH PO-20260318-WXYZ thanh toan kham benh"
 *               referenceNumber:
 *                 type: string
 *                 example: "FT26077ABC123"
 *     responses:
 *       200:
 *         description: Webhook đã được xử lý
 */
router.post('/webhook/sepay', verifySepayWebhook, ctrl.sepayWebhook);

/**
 * @swagger
 * /api/billing/payments/webhook/verify/{orderId}:
 *   get:
 *     summary: Xác minh thủ công giao dịch
 *     description: |
 *       Gọi SePay API kiểm tra giao dịch thủ công. Dùng khi webhook bị miss.
 *       Nếu tìm thấy giao dịch phù hợp → tự động cập nhật trạng thái.
 *
 *       Phân quyền: Yêu cầu JWT Token
 *       Vai trò được phép: ADMIN
 *     tags: [9.3 Webhook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         example: "PO_abc123"
 *     responses:
 *       200:
 *         description: Kết quả xác minh
 */
router.get('/webhook/verify/:orderId', verifyAccessToken, authorizeRoles('ADMIN'), ctrl.manualVerify);

// =============================================
// NHÓM 3: GATEWAY CONFIG
// =============================================

/**
 * @swagger
 * /api/billing/payments/gateway/config:
 *   get:
 *     summary: Xem cấu hình cổng thanh toán
 *     description: |
 *       Lấy cấu hình SePay hiện tại. Các trường nhạy cảm (API Key) sẽ được mask.
 *
 *       Phân quyền: Yêu cầu JWT Token
 *       Vai trò được phép: ADMIN
 *     tags: [9.3 Gateway Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cấu hình gateway
 */
router.get('/gateway/config', verifyAccessToken, authorizeRoles('ADMIN'), ctrl.getGatewayConfig);

/**
 * @swagger
 * /api/billing/payments/gateway/config:
 *   put:
 *     summary: Cập nhật cấu hình cổng thanh toán
 *     description: |
 *       Cập nhật thông tin SePay (API Key, tài khoản ngân hàng, VA, ...).
 *
 *       Phân quyền: Yêu cầu JWT Token
 *       Vai trò được phép: ADMIN
 *     tags: [9.3 Gateway Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               merchant_id:
 *                 type: string
 *                 example: "8327"
 *               api_key:
 *                 type: string
 *                 example: "YOUR_NEW_API_KEY"
 *               bank_account_number:
 *                 type: string
 *                 example: "3015112004"
 *               bank_name:
 *                 type: string
 *                 example: "MBBank"
 *               va_account:
 *                 type: string
 *                 example: "VQRQAHSGO9410"
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/gateway/config', verifyAccessToken, authorizeRoles('ADMIN'), ctrl.updateGatewayConfig);

/**
 * @swagger
 * /api/billing/payments/gateway/test:
 *   post:
 *     summary: Test kết nối cổng thanh toán
 *     description: |
 *       Kiểm tra kết nối đến SePay API bằng cách call API list transactions.
 *
 *       Phân quyền: Yêu cầu JWT Token
 *       Vai trò được phép: ADMIN
 *     tags: [9.3 Gateway Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kết nối thành công
 *       502:
 *         description: Kết nối thất bại
 */
router.post('/gateway/test', verifyAccessToken, authorizeRoles('ADMIN'), ctrl.testGatewayConnection);

// =============================================
// NHÓM 4: THỐNG KÊ ONLINE PAYMENT
// =============================================

/**
 * @swagger
 * /api/billing/payments/online/history:
 *   get:
 *     summary: Lịch sử thanh toán online
 *     description: |
 *       Danh sách tất cả lệnh thanh toán QR với filter và phân trang.
 *
 *       Phân quyền: Yêu cầu JWT Token
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.3 Online Payment Stats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, EXPIRED, CANCELLED]
 *         example: "PAID"
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *         example: "2026-01-01"
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *         example: "2026-12-31"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         example: 20
 *     responses:
 *       200:
 *         description: Danh sách lệnh thanh toán
 */
router.get('/online/history', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), ctrl.getOnlineHistory);

/**
 * @swagger
 * /api/billing/payments/online/stats:
 *   get:
 *     summary: Thống kê thanh toán online
 *     description: |
 *       Thống kê tổng quan: tổng orders, tổng đã thanh toán, hết hạn, đang chờ...
 *
 *       Phân quyền: Yêu cầu JWT Token
 *       Vai trò được phép: ADMIN
 *     tags: [9.3 Online Payment Stats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *         example: "2026-01-01"
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *         example: "2026-12-31"
 *     responses:
 *       200:
 *         description: Thống kê thanh toán
 */
router.get('/online/stats', verifyAccessToken, authorizeRoles('ADMIN'), ctrl.getOnlineStats);

export default router;
