import { Router } from 'express';
import { StockOutController } from '../../controllers/Medication Management/stock-out.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

export const stockOutRoutes = Router();

/**
 * @swagger
 * /api/stock-out:
 *   get:
 *     summary: Lịch sử phiếu xuất kho
 *     description: |
 *       Lấy danh sách phiếu xuất kho (phân trang + filter theo status, reason_type, warehouse, ngày).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST (ai có quyền `STOCK_OUT_VIEW`).
 *     tags:
 *       - "5.9 Stock-Out Management"
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
 *           enum: [DRAFT, CONFIRMED, CANCELLED]
 *           example: ""
 *       - in: query
 *         name: reason_type
 *         schema:
 *           type: string
 *           enum: [DISPOSAL, RETURN_SUPPLIER, TRANSFER, OTHER]
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
 *         description: Lấy lịch sử xuất kho thành công
 *       401:
 *         description: Chưa đăng nhập
 */
stockOutRoutes.get('/', verifyAccessToken, checkSessionStatus, authorizePermissions('STOCK_OUT_VIEW'), StockOutController.getHistory);

/**
 * @swagger
 * /api/stock-out:
 *   post:
 *     summary: Tạo phiếu xuất kho
 *     description: |
 *       Tạo phiếu xuất kho (DRAFT). Chọn kho xuất, loại xuất kho.
 *       - DISPOSAL: hủy thuốc hết hạn/hỏng
 *       - RETURN_SUPPLIER: trả hàng NCC → bắt buộc supplier_id
 *       - TRANSFER: chuyển kho → bắt buộc dest_warehouse_id (≠ warehouse_id)
 *       - OTHER: hao hụt, mất mát
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST (ai có quyền `STOCK_OUT_MANAGE`).
 *     tags:
 *       - "5.9 Stock-Out Management"
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [warehouse_id, reason_type]
 *             properties:
 *               warehouse_id:
 *                 type: string
 *                 example: "WH_260317_3lpo6bsv"
 *               reason_type:
 *                 type: string
 *                 enum: [DISPOSAL, RETURN_SUPPLIER, TRANSFER, OTHER]
 *                 example: "DISPOSAL"
 *               supplier_id:
 *                 type: string
 *                 example: ""
 *                 description: Bắt buộc nếu RETURN_SUPPLIER
 *               dest_warehouse_id:
 *                 type: string
 *                 example: ""
 *                 description: Bắt buộc nếu TRANSFER (khác warehouse_id)
 *               notes:
 *                 type: string
 *                 example: "Hủy thuốc hết hạn tháng 3"
 *     responses:
 *       201:
 *         description: Tạo phiếu xuất thành công
 *       400:
 *         description: Thiếu thông tin / loại không hợp lệ
 *       404:
 *         description: Kho hoặc NCC không tồn tại
 */
stockOutRoutes.post('/', verifyAccessToken, checkSessionStatus, authorizePermissions('STOCK_OUT_MANAGE'), StockOutController.createOrder);

/**
 * @swagger
 * /api/stock-out/{orderId}/items:
 *   post:
 *     summary: Thêm dòng thuốc vào phiếu xuất
 *     description: |
 *       Thêm 1 lô thuốc (inventory_id + quantity) vào phiếu DRAFT.
 *       Hệ thống tự tra cứu drug_id, batch_number từ inventory.
 *       Validate: lô phải thuộc kho xuất, stock phải đủ.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST (ai có quyền `STOCK_OUT_MANAGE`).
 *     tags:
 *       - "5.9 Stock-Out Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           example: "SOO_260317_abc12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [inventory_id, quantity]
 *             properties:
 *               inventory_id:
 *                 type: string
 *                 example: "PINV_0001"
 *                 description: ID lô tồn kho
 *               quantity:
 *                 type: integer
 *                 example: 50
 *               reason_note:
 *                 type: string
 *                 example: "Hết hạn 01/2027"
 *     responses:
 *       201:
 *         description: Thêm dòng thuốc thành công
 *       400:
 *         description: Phiếu không ở DRAFT / lô sai kho / stock không đủ
 *       404:
 *         description: Phiếu hoặc lô không tồn tại
 */
stockOutRoutes.post('/:orderId/items', verifyAccessToken, checkSessionStatus, authorizePermissions('STOCK_OUT_MANAGE'), StockOutController.addItem);

/**
 * @swagger
 * /api/stock-out/{orderId}/items/{detailId}:
 *   delete:
 *     summary: Xóa dòng thuốc khỏi phiếu xuất
 *     description: |
 *       Xóa 1 dòng thuốc khỏi phiếu DRAFT.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST (ai có quyền `STOCK_OUT_MANAGE`).
 *     tags:
 *       - "5.9 Stock-Out Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           example: "SOO_260317_abc12345"
 *       - in: path
 *         name: detailId
 *         required: true
 *         schema:
 *           type: string
 *           example: "SOD_260317_abc12345"
 *     responses:
 *       200:
 *         description: Xóa dòng thuốc thành công
 *       400:
 *         description: Phiếu không ở DRAFT
 *       404:
 *         description: Phiếu hoặc dòng thuốc không tồn tại
 */
stockOutRoutes.delete('/:orderId/items/:detailId', verifyAccessToken, checkSessionStatus, authorizePermissions('STOCK_OUT_MANAGE'), StockOutController.deleteItem);

/**
 * @swagger
 * /api/stock-out/{orderId}/confirm:
 *   patch:
 *     summary: Xác nhận phiếu xuất — TRỪ tồn kho
 *     description: |
 *       DRAFT → CONFIRMED. Hệ thống tự trừ tồn kho trong transaction:
 *       - Trừ stock_quantity từng lô trong kho gốc
 *       - Nếu TRANSFER: tự cộng stock vào kho đích (lô có sẵn → cộng, lô mới → tạo)
 *       - Rollback nếu stock không đủ
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST (ai có quyền `STOCK_OUT_MANAGE`).
 *     tags:
 *       - "5.9 Stock-Out Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           example: "SOO_260317_abc12345"
 *     responses:
 *       200:
 *         description: Xác nhận và trừ tồn kho thành công
 *       400:
 *         description: Phiếu không ở DRAFT / stock không đủ
 *       404:
 *         description: Phiếu không tồn tại
 */
stockOutRoutes.patch('/:orderId/confirm', verifyAccessToken, checkSessionStatus, authorizePermissions('STOCK_OUT_MANAGE'), StockOutController.confirm);

/**
 * @swagger
 * /api/stock-out/{orderId}/cancel:
 *   patch:
 *     summary: Hủy phiếu xuất — HOÀN tồn kho (nếu đã CONFIRMED)
 *     description: |
 *       Hủy phiếu DRAFT hoặc CONFIRMED.
 *       - DRAFT: chỉ đổi status, không ảnh hưởng kho
 *       - CONFIRMED: hoàn stock vào kho gốc + trừ kho đích (nếu TRANSFER)
 *       Bắt buộc truyền lý do hủy.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST (ai có quyền `STOCK_OUT_MANAGE`).
 *     tags:
 *       - "5.9 Stock-Out Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           example: "SOO_260317_abc12345"
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
 *                 example: "Nhập sai số lượng, cần tạo phiếu mới"
 *     responses:
 *       200:
 *         description: Hủy và hoàn kho thành công
 *       400:
 *         description: Phiếu đã bị hủy / thiếu lý do
 *       404:
 *         description: Phiếu không tồn tại
 */
stockOutRoutes.patch('/:orderId/cancel', verifyAccessToken, checkSessionStatus, authorizePermissions('STOCK_OUT_MANAGE'), StockOutController.cancel);

/**
 * @swagger
 * /api/stock-out/{orderId}:
 *   get:
 *     summary: Chi tiết phiếu xuất kho
 *     description: |
 *       Lấy thông tin phiếu xuất kèm danh sách dòng thuốc.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST (ai có quyền `STOCK_OUT_VIEW`).
 *     tags:
 *       - "5.9 Stock-Out Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           example: "SOO_260317_abc12345"
 *     responses:
 *       200:
 *         description: Lấy chi tiết phiếu thành công
 *       404:
 *         description: Phiếu không tồn tại
 */
stockOutRoutes.get('/:orderId', verifyAccessToken, checkSessionStatus, authorizePermissions('STOCK_OUT_VIEW'), StockOutController.getDetail);
