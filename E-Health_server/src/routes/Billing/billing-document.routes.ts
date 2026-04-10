import { Router } from 'express';
import { BillingDocumentController } from '../../controllers/Billing/billing-document.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';

const router = Router();

// ═══════════════════════════════════════════════════════════════
// NHÓM 1: HÓA ĐƠN ĐIỆN TỬ (E-INVOICE)
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/documents/e-invoices:
 *   post:
 *     summary: Tạo hóa đơn điện tử (SALES)
 *     description: |
 *       Tạo HĐĐT từ hóa đơn nội bộ (invoices, Module 9.2).
 *       Hệ thống tự động:
 *       - Fill thông tin bên bán từ **e_invoice_config** theo cơ sở
 *       - Snapshot thông tin bên mua từ hồ sơ bệnh nhân
 *       - Copy items từ invoice_details → e_invoice_items
 *       - Sinh số HĐĐT liên tục (8 chữ số)
 *       - Sinh mã tra cứu CQT
 *       - Tính thuế theo cấu hình
 *       - Chuyển số tiền thành chữ (Tiếng Việt)
 *
 *       Status ban đầu: **DRAFT**
 *
 *       Phân quyền: BILLING_EINVOICE_CREATE
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.5.1 Hóa đơn điện tử]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invoice_id, facility_id]
 *             properties:
 *               invoice_id:
 *                 type: string
 *                 example: "INV_abc123"
 *                 description: ID hóa đơn nội bộ (Module 9.2)
 *               facility_id:
 *                 type: string
 *                 example: "FAC_001"
 *                 description: ID cơ sở y tế (để lấy cấu hình seller)
 *               payment_transaction_id:
 *                 type: string
 *                 example: "TXN_xyz789"
 *                 description: ID giao dịch thanh toán liên kết
 *               buyer_name:
 *                 type: string
 *                 example: "Nguyễn Văn A"
 *                 description: Tên bên mua (nếu khác BN)
 *               buyer_email:
 *                 type: string
 *                 example: "patient@email.com"
 *               buyer_address:
 *                 type: string
 *                 example: "123 Lê Lợi, Q.1, TP.HCM"
 *               tax_rate:
 *                 type: number
 *                 example: 0
 *                 description: Thuế suất (0, 5, 8, 10). Mặc định lấy từ config
 *               payment_method_text:
 *                 type: string
 *                 example: "Tiền mặt"
 *                 description: Hình thức thanh toán dạng text in trên HĐ
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo HĐĐT thành công (status = DRAFT)
 *       400:
 *         description: |
 *           - DOC_009: Không tìm thấy HĐ nội bộ
 *           - DOC_010: HĐ chưa thanh toán
 *           - DOC_011: HĐ đã có HĐĐT
 *           - DOC_012: Chưa cấu hình HĐĐT cho cơ sở
 */
router.post('/documents/e-invoices', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingDocumentController.createEInvoice);

/**
 * @swagger
 * /api/billing/documents/e-invoices/vat:
 *   post:
 *     summary: Tạo hóa đơn VAT (GTGT)
 *     description: |
 *       Tạo HĐĐT loại VAT cho doanh nghiệp/tổ chức.
 *       Yêu cầu bổ sung: **buyer_tax_code** (MST), **buyer_name** (tên công ty), **buyer_address**.
 *
 *       Phân quyền: BILLING_EINVOICE_CREATE
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.5.1 Hóa đơn điện tử]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invoice_id, facility_id, buyer_tax_code, buyer_name, buyer_address]
 *             properties:
 *               invoice_id:
 *                 type: string
 *                 example: "INV_abc123"
 *               facility_id:
 *                 type: string
 *                 example: "FAC_001"
 *               buyer_tax_code:
 *                 type: string
 *                 example: "0123456789"
 *                 description: Mã số thuế doanh nghiệp
 *               buyer_name:
 *                 type: string
 *                 example: "Công ty TNHH ABC"
 *               buyer_address:
 *                 type: string
 *                 example: "456 Nguyễn Huệ, Q.1, TP.HCM"
 *               buyer_email:
 *                 type: string
 *                 example: "ketoan@abc.vn"
 *               tax_rate:
 *                 type: number
 *                 example: 10
 *                 description: Thuế suất GTGT (0, 5, 8, 10%)
 *               payment_method_text:
 *                 type: string
 *                 example: "Chuyển khoản"
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo HĐ VAT thành công
 *       400:
 *         description: |
 *           - DOC_015: Thiếu MST bên mua
 *           - DOC_016: Thiếu tên bên mua
 *           - DOC_017: Thiếu địa chỉ bên mua
 */
router.post('/documents/e-invoices/vat', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingDocumentController.createVATInvoice);

/**
 * @swagger
 * /api/billing/documents/e-invoices/{id}/issue:
 *   patch:
 *     summary: Phát hành HĐĐT (DRAFT → ISSUED)
 *     description: |
 *       Chuyển HĐĐT từ DRAFT sang ISSUED. Sau khi phát hành không thể sửa nội dung.
 *
 *       Phân quyền: BILLING_EINVOICE_CREATE
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.5.1 Hóa đơn điện tử]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "EIV_abc123"
 *     responses:
 *       200:
 *         description: Phát hành thành công
 *       400:
 *         description: DOC_002 — Chỉ phát hành khi status = DRAFT
 */
router.patch('/documents/e-invoices/:id/issue', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingDocumentController.issueEInvoice);

/**
 * @swagger
 * /api/billing/documents/e-invoices/{id}/sign:
 *   patch:
 *     summary: Ký số HĐĐT (ISSUED → SIGNED)
 *     description: |
 *       Ký số xác nhận tính pháp lý của HĐĐT. Ghi nhận signed_at, signed_by.
 *
 *       Phân quyền: BILLING_EINVOICE_SIGN
 *       Vai trò được phép: ADMIN
 *     tags: [9.5.1 Hóa đơn điện tử]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "EIV_abc123"
 *     responses:
 *       200:
 *         description: Ký số thành công
 *       400:
 *         description: DOC_003 — Chỉ ký khi status = ISSUED
 */
router.patch('/documents/e-invoices/:id/sign', verifyAccessToken, authorizeRoles('ADMIN'), BillingDocumentController.signEInvoice);

/**
 * @swagger
 * /api/billing/documents/e-invoices/{id}/send:
 *   patch:
 *     summary: Gửi HĐĐT cho bên mua (SIGNED → SENT)
 *     description: |
 *       Ghi nhận HĐĐT đã được gửi cho bên mua (qua email/SMS).
 *
 *       Phân quyền: BILLING_EINVOICE_CREATE
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.5.1 Hóa đơn điện tử]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "EIV_abc123"
 *     responses:
 *       200:
 *         description: Gửi thành công
 *       400:
 *         description: DOC_004 — Chỉ gửi khi status = SIGNED
 */
router.patch('/documents/e-invoices/:id/send', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingDocumentController.sendEInvoice);

/**
 * @swagger
 * /api/billing/documents/e-invoices/{id}/cancel:
 *   post:
 *     summary: Hủy HĐĐT
 *     description: |
 *       Hủy HĐĐT sai hoàn toàn. Chỉ hủy khi status = ISSUED/SIGNED/SENT.
 *
 *       Phân quyền: BILLING_EINVOICE_CANCEL
 *       Vai trò được phép: ADMIN
 *     tags: [9.5.1 Hóa đơn điện tử]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "EIV_abc123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cancel_reason]
 *             properties:
 *               cancel_reason:
 *                 type: string
 *                 example: "Sai thông tin bên mua"
 *     responses:
 *       200:
 *         description: Hủy thành công
 *       400:
 *         description: DOC_006 — Không thể hủy ở status hiện tại
 */
router.post('/documents/e-invoices/:id/cancel', verifyAccessToken, authorizeRoles('ADMIN'), BillingDocumentController.cancelEInvoice);

/**
 * @swagger
 * /api/billing/documents/e-invoices/{id}/replace:
 *   post:
 *     summary: Thay thế HĐĐT
 *     description: |
 *       Tạo HĐĐT mới thay thế cho HĐĐT sai. HĐ cũ chuyển status = REPLACED,
 *       HĐ mới ghi nhận link tới HĐ gốc.
 *
 *       Có thể override buyer info và items cho HĐ mới.
 *
 *       Phân quyền: BILLING_EINVOICE_CANCEL
 *       Vai trò được phép: ADMIN
 *     tags: [9.5.1 Hóa đơn điện tử]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "EIV_abc123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cancel_reason]
 *             properties:
 *               cancel_reason:
 *                 type: string
 *                 example: "Sai tên bên mua, thay thế bằng HĐ đúng"
 *               buyer_name:
 *                 type: string
 *                 example: "Trần Văn B"
 *               buyer_tax_code:
 *                 type: string
 *               buyer_address:
 *                 type: string
 *               tax_rate:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Thay thế thành công, trả về HĐĐT mới
 */
router.post('/documents/e-invoices/:id/replace', verifyAccessToken, authorizeRoles('ADMIN'), BillingDocumentController.replaceEInvoice);

/**
 * @swagger
 * /api/billing/documents/e-invoices/{id}/adjust:
 *   post:
 *     summary: Điều chỉnh HĐĐT (tăng/giảm)
 *     description: |
 *       Tạo HĐ điều chỉnh cho HĐĐT gốc — ghi nhận chênh lệch tăng hoặc giảm.
 *       Chỉ áp dụng khi HĐ gốc status = SIGNED hoặc SENT.
 *
 *       Phân quyền: BILLING_EINVOICE_CANCEL
 *       Vai trò được phép: ADMIN
 *     tags: [9.5.1 Hóa đơn điện tử]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "EIV_abc123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [adjustment_type, adjust_amount, cancel_reason]
 *             properties:
 *               adjustment_type:
 *                 type: string
 *                 enum: [INCREASE, DECREASE]
 *                 example: "DECREASE"
 *               adjust_amount:
 *                 type: number
 *                 example: 100000
 *                 description: Số tiền chênh lệch
 *               cancel_reason:
 *                 type: string
 *                 example: "Giảm giá khuyến mãi 100.000đ"
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Điều chỉnh thành công, trả về HĐ điều chỉnh mới
 */
router.post('/documents/e-invoices/:id/adjust', verifyAccessToken, authorizeRoles('ADMIN'), BillingDocumentController.adjustEInvoice);

/**
 * @swagger
 * /api/billing/documents/e-invoices/{id}:
 *   get:
 *     summary: Chi tiết HĐĐT
 *     description: |
 *       Trả về HĐĐT kèm items (dòng hàng) và documents (chứng từ đính kèm).
 *
 *       Phân quyền: BILLING_EINVOICE_VIEW
 *       Vai trò được phép: ADMIN, STAFF, DOCTOR, NURSE
 *     tags: [9.5.1 Hóa đơn điện tử]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "EIV_abc123"
 *     responses:
 *       200:
 *         description: Chi tiết HĐĐT
 *       404:
 *         description: Không tìm thấy
 */
router.get('/documents/e-invoices/:id', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF', 'DOCTOR', 'NURSE'), BillingDocumentController.getEInvoiceById);

/**
 * @swagger
 * /api/billing/documents/e-invoices:
 *   get:
 *     summary: Danh sách HĐĐT
 *     description: |
 *       Phân quyền: BILLING_EINVOICE_VIEW
 *       Vai trò được phép: ADMIN, STAFF, DOCTOR, NURSE
 *     tags: [9.5.1 Hóa đơn điện tử]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: facility_id
 *         schema: { type: string, example: "FAC_001" }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFT, ISSUED, SIGNED, SENT, CANCELLED, REPLACED, ADJUSTED] }
 *       - in: query
 *         name: invoice_type
 *         schema: { type: string, enum: [SALES, VAT] }
 *       - in: query
 *         name: date_from
 *         schema: { type: string, format: date, example: "2026-03-01" }
 *       - in: query
 *         name: date_to
 *         schema: { type: string, format: date, example: "2026-03-31" }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: "Tìm theo số HĐĐT, mã tra cứu, tên bên mua, MST"
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
router.get('/documents/e-invoices', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF', 'DOCTOR', 'NURSE'), BillingDocumentController.getEInvoices);

/**
 * @swagger
 * /api/billing/documents/e-invoices/lookup/{code}:
 *   get:
 *     summary: Tra cứu HĐĐT theo mã CQT
 *     description: |
 *       BN hoặc CQ thuế tra cứu HĐĐT bằng mã tra cứu.
 *
 *       Phân quyền: BILLING_EINVOICE_VIEW
 *       Vai trò được phép: ADMIN, STAFF, DOCTOR, NURSE
 *     tags: [9.5.1 Hóa đơn điện tử]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           example: "A1B2C3D4E5F6"
 *     responses:
 *       200:
 *         description: HĐĐT chi tiết
 *       404:
 *         description: Không tìm thấy
 */
router.get('/documents/e-invoices/lookup/:code', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF', 'DOCTOR', 'NURSE'), BillingDocumentController.lookupEInvoice);

// ═══════════════════════════════════════════════════════════════
// NHÓM 2: IN HÓA ĐƠN
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/documents/e-invoices/{id}/print-data:
 *   get:
 *     summary: Dữ liệu in HĐĐT
 *     description: |
 *       Trả về data phẳng cho client render template in (PDF/HTML):
 *       seller info, buyer info, items, totals, mã tra cứu.
 *
 *       Phân quyền: BILLING_EINVOICE_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.5.2 In hóa đơn]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "EIV_abc123" }
 *     responses:
 *       200:
 *         description: Print data object
 */
router.get('/documents/e-invoices/:id/print-data', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingDocumentController.getPrintData);

/**
 * @swagger
 * /api/billing/documents/e-invoices/{id}/print-history:
 *   get:
 *     summary: Lịch sử in/xuất HĐĐT
 *     description: |
 *       Danh sách chứng từ PDF/file đã tạo cho HĐĐT này.
 *
 *       Phân quyền: BILLING_EINVOICE_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.5.2 In hóa đơn]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "EIV_abc123" }
 *     responses:
 *       200:
 *         description: Danh sách file documents gắn HĐĐT
 */
router.get('/documents/e-invoices/:id/print-history', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingDocumentController.getPrintHistory);

// ═══════════════════════════════════════════════════════════════
// NHÓM 3: TRA CỨU
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/documents/search:
 *   get:
 *     summary: Tìm kiếm hóa đơn nâng cao
 *     description: |
 *       Unified search trên cả invoices (nội bộ) và e_invoices (HĐĐT).
 *       Hỗ trợ filter: mã HĐ, mã HĐĐT, mã tra cứu, BN, facility,
 *       status, loại HĐĐT, khoảng ngày, khoảng tiền.
 *
 *       Phân quyền: BILLING_EINVOICE_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.5.3 Tra cứu hóa đơn]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: "Tìm theo mã HĐ, số HĐĐT, mã CQT, tên BN"
 *       - in: query
 *         name: invoice_code
 *         schema: { type: string }
 *       - in: query
 *         name: e_invoice_number
 *         schema: { type: string }
 *       - in: query
 *         name: lookup_code
 *         schema: { type: string }
 *       - in: query
 *         name: patient_id
 *         schema: { type: string }
 *       - in: query
 *         name: facility_id
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: invoice_type
 *         schema: { type: string, enum: [SALES, VAT] }
 *       - in: query
 *         name: date_from
 *         schema: { type: string, format: date, example: "2026-03-01" }
 *       - in: query
 *         name: date_to
 *         schema: { type: string, format: date, example: "2026-03-31" }
 *       - in: query
 *         name: amount_from
 *         schema: { type: number, example: 100000 }
 *       - in: query
 *         name: amount_to
 *         schema: { type: number, example: 5000000 }
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 20 }
 *     responses:
 *       200:
 *         description: Kết quả tìm kiếm + phân trang
 */
router.get('/documents/search', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingDocumentController.searchInvoices);

/**
 * @swagger
 * /api/billing/documents/invoices/{invoiceId}/timeline:
 *   get:
 *     summary: Dòng thời gian hóa đơn
 *     description: |
 *       Gộp tất cả sự kiện liên quan HĐ nội bộ:
 *       tạo HĐ → thanh toán → phát hành HĐĐT → ký → gửi → upload chứng từ
 *
 *       Phân quyền: BILLING_EINVOICE_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.5.3 Tra cứu hóa đơn]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema: { type: string, example: "INV_abc123" }
 *     responses:
 *       200:
 *         description: Danh sách events sắp theo thời gian
 */
router.get('/documents/invoices/:invoiceId/timeline', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingDocumentController.getTimeline);

// ═══════════════════════════════════════════════════════════════
// NHÓM 4: CHỨNG TỪ
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/documents/attachments:
 *   post:
 *     summary: Upload chứng từ thanh toán
 *     description: |
 *       Lưu trữ file đính kèm (scan biên lai, HĐ giấy, ủy nhiệm chi, ...).
 *       Liên kết với invoice, e_invoice, hoặc payment_transaction.
 *
 *       Phân quyền: BILLING_DOCUMENT_MANAGE
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.5.4 Chứng từ thanh toán]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [document_type, document_name, file_url]
 *             properties:
 *               document_type:
 *                 type: string
 *                 enum: [E_INVOICE_PDF, RECEIPT_SCAN, VAT_PAPER, BANK_SLIP, REFUND_PROOF, OTHER]
 *                 example: "RECEIPT_SCAN"
 *               document_name:
 *                 type: string
 *                 example: "Biên lai thu ngân BN001"
 *               file_url:
 *                 type: string
 *                 example: "https://res.cloudinary.com/xxx/receipt_001.pdf"
 *               file_size:
 *                 type: integer
 *                 example: 204800
 *               mime_type:
 *                 type: string
 *                 example: "application/pdf"
 *               invoice_id:
 *                 type: string
 *                 example: "INV_abc123"
 *               e_invoice_id:
 *                 type: string
 *               payment_transaction_id:
 *                 type: string
 *               description:
 *                 type: string
 *                 example: "Scan biên lai thu tiền mặt"
 *               tags:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["scan", "receipt"]
 *     responses:
 *       201:
 *         description: Upload thành công
 *       400:
 *         description: Loại chứng từ không hợp lệ
 */
router.post('/documents/attachments', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingDocumentController.uploadDocument);

/**
 * @swagger
 * /api/billing/documents/attachments:
 *   get:
 *     summary: Danh sách chứng từ
 *     description: |
 *       Phân quyền: BILLING_DOCUMENT_VIEW
 *       Vai trò được phép: ADMIN, STAFF, DOCTOR, NURSE
 *     tags: [9.5.4 Chứng từ thanh toán]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: document_type
 *         schema: { type: string, enum: [E_INVOICE_PDF, RECEIPT_SCAN, VAT_PAPER, BANK_SLIP, REFUND_PROOF, OTHER] }
 *       - in: query
 *         name: invoice_id
 *         schema: { type: string }
 *       - in: query
 *         name: e_invoice_id
 *         schema: { type: string }
 *       - in: query
 *         name: date_from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: date_to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: is_archived
 *         schema: { type: boolean, example: false }
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
router.get('/documents/attachments', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF', 'DOCTOR', 'NURSE'), BillingDocumentController.getDocuments);

/**
 * @swagger
 * /api/billing/documents/attachments/{id}:
 *   get:
 *     summary: Chi tiết chứng từ
 *     description: |
 *       Phân quyền: BILLING_DOCUMENT_VIEW
 *       Vai trò được phép: ADMIN, STAFF, DOCTOR, NURSE
 *     tags: [9.5.4 Chứng từ thanh toán]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "DOC_abc123" }
 *     responses:
 *       200:
 *         description: Chi tiết chứng từ
 *       404:
 *         description: Không tìm thấy
 */
router.get('/documents/attachments/:id', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF', 'DOCTOR', 'NURSE'), BillingDocumentController.getDocumentById);

/**
 * @swagger
 * /api/billing/documents/attachments/{id}:
 *   delete:
 *     summary: Xóa chứng từ (soft archive)
 *     description: |
 *       Đánh dấu chứng từ là archived (soft delete).
 *
 *       Phân quyền: BILLING_DOCUMENT_MANAGE
 *       Vai trò được phép: ADMIN
 *     tags: [9.5.4 Chứng từ thanh toán]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "DOC_abc123" }
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       400:
 *         description: Chứng từ đã archived
 */
router.delete('/documents/attachments/:id', verifyAccessToken, authorizeRoles('ADMIN'), BillingDocumentController.deleteDocument);

/**
 * @swagger
 * /api/billing/documents/attachments/archive:
 *   patch:
 *     summary: Lưu trữ chứng từ hàng loạt
 *     description: |
 *       Đánh dấu archive cho nhiều chứng từ cùng lúc.
 *
 *       Phân quyền: BILLING_DOCUMENT_MANAGE
 *       Vai trò được phép: ADMIN
 *     tags: [9.5.4 Chứng từ thanh toán]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [document_ids]
 *             properties:
 *               document_ids:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["DOC_001", "DOC_002", "DOC_003"]
 *     responses:
 *       200:
 *         description: Lưu trữ thành công, trả về số lượng đã archive
 */
router.patch('/documents/attachments/archive', verifyAccessToken, authorizeRoles('ADMIN'), BillingDocumentController.archiveDocuments);

// ═══════════════════════════════════════════════════════════════
// NHÓM 5: CẤU HÌNH HĐĐT
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/documents/config/{facilityId}:
 *   get:
 *     summary: Lấy cấu hình HĐĐT theo cơ sở
 *     description: |
 *       Xem cấu hình phát hành HĐĐT: thông tin bên bán, mẫu/ký hiệu, thuế suất mặc định.
 *
 *       Phân quyền: BILLING_EINVOICE_CONFIG
 *       Vai trò được phép: ADMIN
 *     tags: [9.5.5 Cấu hình HĐĐT]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema: { type: string, example: "FAC_001" }
 *     responses:
 *       200:
 *         description: Cấu hình HĐĐT (null nếu chưa cấu hình)
 *       404:
 *         description: Cơ sở không tồn tại
 */
router.get('/documents/config/:facilityId', verifyAccessToken, authorizeRoles('ADMIN'), BillingDocumentController.getConfig);

/**
 * @swagger
 * /api/billing/documents/config/{facilityId}:
 *   put:
 *     summary: Tạo/Cập nhật cấu hình HĐĐT
 *     description: |
 *       Upsert cấu hình phát hành HĐĐT cho cơ sở: thông tin bên bán,
 *       mẫu số, ký hiệu, thuế suất mặc định.
 *
 *       Phân quyền: BILLING_EINVOICE_CONFIG
 *       Vai trò được phép: ADMIN
 *     tags: [9.5.5 Cấu hình HĐĐT]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema: { type: string, example: "FAC_001" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [seller_name, seller_tax_code]
 *             properties:
 *               seller_name:
 *                 type: string
 *                 example: "Phòng khám Đa khoa XYZ"
 *               seller_tax_code:
 *                 type: string
 *                 example: "0123456789"
 *               seller_address:
 *                 type: string
 *                 example: "123 Lê Lợi, Q.1, TP.HCM"
 *               seller_phone:
 *                 type: string
 *                 example: "028-1234-5678"
 *               seller_bank_account:
 *                 type: string
 *                 example: "0123456789"
 *               seller_bank_name:
 *                 type: string
 *                 example: "Vietcombank - CN Sài Gòn"
 *               invoice_template:
 *                 type: string
 *                 example: "1C24TAA"
 *                 description: Ký hiệu mẫu số
 *               invoice_series:
 *                 type: string
 *                 example: "C24TAA"
 *                 description: Ký hiệu hóa đơn
 *               tax_rate_default:
 *                 type: number
 *                 example: 0
 *                 description: Thuế suất mặc định (0, 5, 8, 10)
 *               currency_default:
 *                 type: string
 *                 example: "VND"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/documents/config/:facilityId', verifyAccessToken, authorizeRoles('ADMIN'), BillingDocumentController.upsertConfig);

export default router;
