import { Router } from 'express';
import { InventoryController } from '../../controllers/Medication Management/inventory.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

export const inventoryRoutes = Router();

// =====================================================================
// ALERTS (đặt trước :batchId để tránh conflict)
// =====================================================================

/**
 * @swagger
 * /api/inventory/alerts/expiring:
 *   get:
 *     summary: Cảnh báo thuốc sắp hết hạn
 *     description: |
 *       Lấy danh sách tất cả lô thuốc sắp hết hạn trong N ngày tới.
 *       Phân loại 3 mức: CRITICAL (≤30 ngày), WARNING (≤60 ngày), NOTICE (≤90 ngày).
 *       Chỉ lấy lô còn tồn kho > 0 và chưa hết hạn.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST, DOCTOR, NURSE (ai có quyền `INVENTORY_VIEW`).
 *     tags:
 *       - "5.6 Drug Inventory Tracking"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           example: 90
 *         description: Số ngày tới để kiểm tra (mặc định 90)
 *     responses:
 *       200:
 *         description: Lấy danh sách thuốc sắp hết hạn thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         critical:
 *                           type: integer
 *                         warning:
 *                           type: integer
 *                         notice:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                     alerts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           drug_code:
 *                             type: string
 *                           brand_name:
 *                             type: string
 *                           batch_number:
 *                             type: string
 *                           expiry_date:
 *                             type: string
 *                           days_until_expiry:
 *                             type: integer
 *                           alert_level:
 *                             type: string
 *                             enum: [CRITICAL, WARNING, NOTICE]
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
inventoryRoutes.get(
    '/alerts/expiring',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('INVENTORY_VIEW'),
    InventoryController.getExpiringAlerts
);

/**
 * @swagger
 * /api/inventory/alerts/low-stock:
 *   get:
 *     summary: Cảnh báo thuốc tồn kho thấp
 *     description: |
 *       Lấy danh sách thuốc có tổng tồn kho (tất cả lô) thấp hơn ngưỡng cảnh báo.
 *       Gom theo thuốc (drug_id), trả kèm chi tiết từng lô.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST, DOCTOR, NURSE (ai có quyền `INVENTORY_VIEW`).
 *     tags:
 *       - "5.6 Drug Inventory Tracking"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách thuốc tồn kho thấp thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     alerts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           drug_id:
 *                             type: string
 *                           drug_code:
 *                             type: string
 *                           brand_name:
 *                             type: string
 *                           total_stock:
 *                             type: integer
 *                           min_threshold:
 *                             type: integer
 *                           percentage_remaining:
 *                             type: integer
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
inventoryRoutes.get(
    '/alerts/low-stock',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('INVENTORY_VIEW'),
    InventoryController.getLowStockAlerts
);

// =====================================================================
// CRUD
// =====================================================================

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     summary: Danh sách tồn kho thuốc
 *     description: |
 *       Lấy danh sách toàn bộ lô tồn kho, hỗ trợ phân trang và filter.
 *       Sắp xếp mặc định: FEFO (hết hạn sớm trước).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST, DOCTOR, NURSE (ai có quyền `INVENTORY_VIEW`).
 *     tags:
 *       - "5.6 Drug Inventory Tracking"
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
 *         name: drug_id
 *         schema:
 *           type: string
 *           example: ""
 *         description: Filter theo thuốc
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: ""
 *         description: Tìm theo tên thuốc, mã thuốc, mã lô
 *       - in: query
 *         name: expiry_before
 *         schema:
 *           type: string
 *           format: date
 *           example: ""
 *         description: Lọc lô hết hạn trước ngày này
 *       - in: query
 *         name: low_stock_only
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *           example: ""
 *         description: Chỉ hiện lô tồn kho thấp
 *     responses:
 *       200:
 *         description: Lấy danh sách tồn kho thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
inventoryRoutes.get(
    '/',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('INVENTORY_VIEW'),
    InventoryController.getAll
);

/**
 * @swagger
 * /api/inventory:
 *   post:
 *     summary: Nhập kho lô thuốc mới
 *     description: |
 *       Thêm 1 lô thuốc mới vào kho. Kiểm tra:
 *       - Thuốc phải active trong hệ thống
 *       - Lô (drug_id + batch_number) chưa tồn tại
 *       - Ngày hết hạn phải là tương lai
 *       - Số lượng >= 0
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST (ai có quyền `INVENTORY_MANAGE`).
 *     tags:
 *       - "5.6 Drug Inventory Tracking"
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [drug_id, batch_number, expiry_date, stock_quantity]
 *             properties:
 *               drug_id:
 *                 type: string
 *                 example: "DRG_001"
 *                 description: ID thuốc
 *               batch_number:
 *                 type: string
 *                 example: "LOT-2603-NEW01"
 *                 description: Mã lô (unique theo drug)
 *               expiry_date:
 *                 type: string
 *                 format: date
 *                 example: "2028-06-30"
 *               stock_quantity:
 *                 type: integer
 *                 example: 500
 *               unit_cost:
 *                 type: number
 *                 example: 2000.00
 *                 description: Giá nhập
 *               unit_price:
 *                 type: number
 *                 example: 2600.00
 *                 description: Giá bán
 *               location_bin:
 *                 type: string
 *                 example: "A01-03"
 *                 description: Vị trí kệ
 *               low_stock_threshold:
 *                 type: integer
 *                 example: 50
 *                 description: Ngưỡng cảnh báo tồn kho thấp
 *     responses:
 *       201:
 *         description: Nhập kho lô mới thành công
 *       400:
 *         description: Thiếu thông tin / ngày hết hạn không hợp lệ / số lượng âm
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Thuốc không tồn tại
 *       409:
 *         description: Lô đã tồn tại
 */
inventoryRoutes.post(
    '/',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('INVENTORY_MANAGE'),
    InventoryController.create
);

/**
 * @swagger
 * /api/inventory/{batchId}:
 *   get:
 *     summary: Chi tiết 1 lô tồn kho
 *     description: |
 *       Lấy thông tin chi tiết 1 lô: thuốc, mã lô, hạn dùng, tồn kho, giá, vị trí kệ, ngưỡng cảnh báo.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST, DOCTOR, NURSE (ai có quyền `INVENTORY_VIEW`).
 *     tags:
 *       - "5.6 Drug Inventory Tracking"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *           example: "PINV_0001"
 *         description: ID lô tồn kho (pharmacy_inventory_id)
 *     responses:
 *       200:
 *         description: Lấy chi tiết lô thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Lô không tồn tại
 */
inventoryRoutes.get(
    '/:batchId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('INVENTORY_VIEW'),
    InventoryController.getById
);

/**
 * @swagger
 * /api/inventory/{batchId}:
 *   patch:
 *     summary: Cập nhật tồn kho
 *     description: |
 *       Cập nhật số lượng tồn kho, giá, vị trí kệ, ngưỡng cảnh báo.
 *       Không cho sửa drug_id, batch_number (immutable).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST (ai có quyền `INVENTORY_MANAGE`).
 *     tags:
 *       - "5.6 Drug Inventory Tracking"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *           example: "PINV_0001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stock_quantity:
 *                 type: integer
 *                 example: 180
 *                 description: Số lượng mới (sau kiểm kê)
 *               unit_cost:
 *                 type: number
 *                 example: 2100.00
 *               unit_price:
 *                 type: number
 *                 example: 2730.00
 *               location_bin:
 *                 type: string
 *                 example: "A01-01"
 *               low_stock_threshold:
 *                 type: integer
 *                 example: 30
 *               adjustment_reason:
 *                 type: string
 *                 example: "Kiểm kê tháng 3/2026"
 *                 description: Lý do điều chỉnh (ghi chú)
 *     responses:
 *       200:
 *         description: Cập nhật tồn kho thành công
 *       400:
 *         description: Số lượng không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Lô không tồn tại
 */
inventoryRoutes.patch(
    '/:batchId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('INVENTORY_MANAGE'),
    InventoryController.update
);
