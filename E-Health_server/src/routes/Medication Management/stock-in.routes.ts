import { Router } from 'express';
import { StockInController } from '../../controllers/Medication Management/stock-in.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

export const stockInRoutes = Router();

/**
 * @swagger
 * /api/stock-in:
 *   get:
 *     summary: Lịch sử phiếu nhập kho
 *     description: |
 *       Lấy danh sách phiếu nhập kho (phân trang + filter).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST (ai có quyền `STOCK_IN_VIEW`).
 *     tags:
 *       - "5.8 Stock-In Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, CONFIRMED, RECEIVED, CANCELLED]
 *           example: ""
 *       - in: query
 *         name: supplier_id
 *         schema:
 *           type: string
 *           example: ""
 *       - in: query
 *         name: warehouse_id
 *         schema:
 *           type: string
 *           example: ""
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *           example: ""
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *           example: ""
 *     responses:
 *       200:
 *         description: Lấy lịch sử nhập kho thành công
 *       401:
 *         description: Chưa đăng nhập
 */
stockInRoutes.get('/', verifyAccessToken, checkSessionStatus, authorizePermissions('STOCK_IN_VIEW'), StockInController.getHistory);

/**
 * @swagger
 * /api/stock-in:
 *   post:
 *     summary: Tạo phiếu nhập kho
 *     description: |
 *       Tạo phiếu nhập kho mới (trạng thái DRAFT). Chọn nhà cung cấp và kho nhận hàng.
 *       Sau khi tạo, thêm dòng thuốc qua API riêng.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST (ai có quyền `STOCK_IN_MANAGE`).
 *     tags:
 *       - "5.8 Stock-In Management"
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [supplier_id, warehouse_id]
 *             properties:
 *               supplier_id:
 *                 type: string
 *                 example: "SUP_260317_abc12345"
 *                 description: ID nhà cung cấp
 *               warehouse_id:
 *                 type: string
 *                 example: "WH_260317_3lpo6bsv"
 *                 description: ID kho nhận hàng
 *               notes:
 *                 type: string
 *                 example: "Nhập thuốc đợt tháng 3/2026"
 *     responses:
 *       201:
 *         description: Tạo phiếu nhập thành công
 *       400:
 *         description: Thiếu thông tin
 *       404:
 *         description: NCC hoặc kho không tồn tại/không hoạt động
 */
stockInRoutes.post('/', verifyAccessToken, checkSessionStatus, authorizePermissions('STOCK_IN_MANAGE'), StockInController.createOrder);

/**
 * @swagger
 * /api/stock-in/{orderId}/items:
 *   post:
 *     summary: Thêm dòng thuốc vào phiếu nhập
 *     description: |
 *       Thêm 1 dòng thuốc (drug + lô + HSD + SL + giá) vào phiếu nhập DRAFT.
 *       Tự tính amount = quantity × unit_cost và cập nhật total_amount trên phiếu.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST (ai có quyền `STOCK_IN_MANAGE`).
 *     tags:
 *       - "5.8 Stock-In Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           example: "SIO_260317_abc12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [drug_id, batch_number, expiry_date, quantity, unit_cost]
 *             properties:
 *               drug_id:
 *                 type: string
 *                 example: "DRG_001"
 *               batch_number:
 *                 type: string
 *                 example: "LOT-2603-NHAP01"
 *               expiry_date:
 *                 type: string
 *                 format: date
 *                 example: "2028-12-31"
 *               quantity:
 *                 type: integer
 *                 example: 200
 *               unit_cost:
 *                 type: number
 *                 example: 2000.00
 *                 description: Giá nhập
 *               unit_price:
 *                 type: number
 *                 example: 2600.00
 *                 description: Giá bán
 *     responses:
 *       201:
 *         description: Thêm dòng thuốc thành công
 *       400:
 *         description: Thiếu thông tin / phiếu không ở DRAFT / SL <= 0
 *       404:
 *         description: Phiếu hoặc thuốc không tồn tại
 */
stockInRoutes.post('/:orderId/items', verifyAccessToken, checkSessionStatus, authorizePermissions('STOCK_IN_MANAGE'), StockInController.addItem);

/**
 * @swagger
 * /api/stock-in/{orderId}/confirm:
 *   patch:
 *     summary: Xác nhận phiếu nhập kho
 *     description: |
 *       Chuyển trạng thái DRAFT → CONFIRMED. Phiếu phải có ít nhất 1 dòng thuốc.
 *       Sau khi CONFIRMED không được thêm/sửa dòng thuốc.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST (ai có quyền `STOCK_IN_MANAGE`).
 *     tags:
 *       - "5.8 Stock-In Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           example: "SIO_260317_abc12345"
 *     responses:
 *       200:
 *         description: Xác nhận phiếu thành công
 *       400:
 *         description: Phiếu không ở DRAFT / không có dòng thuốc
 *       404:
 *         description: Phiếu không tồn tại
 */
stockInRoutes.patch('/:orderId/confirm', verifyAccessToken, checkSessionStatus, authorizePermissions('STOCK_IN_MANAGE'), StockInController.confirm);

/**
 * @swagger
 * /api/stock-in/{orderId}/receive:
 *   patch:
 *     summary: Nhận hàng — cộng tồn kho
 *     description: |
 *       Chuyển CONFIRMED → RECEIVED. Hệ thống tự cộng tồn kho (pharmacy_inventory):
 *       - Lô đã có → cộng thêm stock_quantity
 *       - Lô mới → tạo record mới trong pharmacy_inventory
 *
 *       Tất cả trong 1 transaction (rollback nếu lỗi).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST (ai có quyền `STOCK_IN_MANAGE`).
 *     tags:
 *       - "5.8 Stock-In Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           example: "SIO_260317_abc12345"
 *     responses:
 *       200:
 *         description: Nhận hàng và cập nhật tồn kho thành công
 *       400:
 *         description: Phiếu không ở CONFIRMED
 *       404:
 *         description: Phiếu không tồn tại
 */
stockInRoutes.patch('/:orderId/receive', verifyAccessToken, checkSessionStatus, authorizePermissions('STOCK_IN_MANAGE'), StockInController.receive);

/**
 * @swagger
 * /api/stock-in/{orderId}/cancel:
 *   patch:
 *     summary: Hủy phiếu nhập kho
 *     description: |
 *       Hủy phiếu DRAFT hoặc CONFIRMED. Không cho hủy phiếu đã RECEIVED.
 *       Bắt buộc truyền lý do hủy.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST (ai có quyền `STOCK_IN_MANAGE`).
 *     tags:
 *       - "5.8 Stock-In Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           example: "SIO_260317_abc12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cancelled_reason]
 *             properties:
 *               cancelled_reason:
 *                 type: string
 *                 example: "NCC giao thiếu hàng, hủy để tạo phiếu mới"
 *     responses:
 *       200:
 *         description: Hủy phiếu thành công
 *       400:
 *         description: Không thể hủy phiếu RECEIVED / thiếu lý do
 *       404:
 *         description: Phiếu không tồn tại
 */
stockInRoutes.patch('/:orderId/cancel', verifyAccessToken, checkSessionStatus, authorizePermissions('STOCK_IN_MANAGE'), StockInController.cancel);

/**
 * @swagger
 * /api/stock-in/{orderId}:
 *   get:
 *     summary: Chi tiết phiếu nhập kho
 *     description: |
 *       Lấy thông tin phiếu nhập kho kèm danh sách dòng thuốc.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST (ai có quyền `STOCK_IN_VIEW`).
 *     tags:
 *       - "5.8 Stock-In Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           example: "SIO_260317_abc12345"
 *     responses:
 *       200:
 *         description: Lấy chi tiết phiếu thành công
 *       404:
 *         description: Phiếu không tồn tại
 */
stockInRoutes.get('/:orderId', verifyAccessToken, checkSessionStatus, authorizePermissions('STOCK_IN_VIEW'), StockInController.getDetail);
