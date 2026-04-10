import { Router } from 'express';
import { WarehouseController } from '../../controllers/Medication Management/warehouse.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

export const warehouseRoutes = Router();

/**
 * @swagger
 * /api/warehouses:
 *   get:
 *     summary: Danh sách kho thuốc
 *     description: |
 *       Lấy danh sách tất cả kho thuốc, hỗ trợ filter theo chi nhánh và tìm kiếm.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST, DOCTOR, NURSE (ai có quyền `WAREHOUSE_VIEW`).
 *     tags:
 *       - "5.7 Warehouse Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *           example: ""
 *         description: Filter theo chi nhánh
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: ""
 *         description: Tìm theo mã hoặc tên kho
 *     responses:
 *       200:
 *         description: Lấy danh sách kho thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       warehouse_id:
 *                         type: string
 *                       branch_id:
 *                         type: string
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *                       warehouse_type:
 *                         type: string
 *                       is_active:
 *                         type: boolean
 *                       branch_name:
 *                         type: string
 *                       facility_name:
 *                         type: string
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
warehouseRoutes.get(
    '/',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('WAREHOUSE_VIEW'),
    WarehouseController.getAll
);

/**
 * @swagger
 * /api/warehouses:
 *   post:
 *     summary: Tạo kho thuốc mới
 *     description: |
 *       Tạo kho mới gắn với 1 chi nhánh. Mã kho (code) phải UNIQUE trong cùng chi nhánh.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST (ai có quyền `WAREHOUSE_MANAGE`).
 *     tags:
 *       - "5.7 Warehouse Management"
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [branch_id, code, name]
 *             properties:
 *               branch_id:
 *                 type: string
 *                 example: "BRN_001"
 *                 description: ID chi nhánh
 *               code:
 *                 type: string
 *                 example: "WH-MAIN"
 *                 description: Mã kho (unique theo branch)
 *               name:
 *                 type: string
 *                 example: "Kho chính Q1"
 *               warehouse_type:
 *                 type: string
 *                 enum: [MAIN, SECONDARY]
 *                 example: "MAIN"
 *               address:
 *                 type: string
 *                 example: "Tầng 1, Tòa nhà A"
 *     responses:
 *       201:
 *         description: Tạo kho mới thành công
 *       400:
 *         description: Thiếu thông tin bắt buộc
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Chi nhánh không tồn tại
 *       409:
 *         description: Mã kho đã tồn tại trong chi nhánh
 */
warehouseRoutes.post(
    '/',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('WAREHOUSE_MANAGE'),
    WarehouseController.create
);

/**
 * @swagger
 * /api/warehouses/{id}:
 *   get:
 *     summary: Chi tiết kho thuốc
 *     description: |
 *       Lấy thông tin chi tiết 1 kho bao gồm tên chi nhánh và cơ sở.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST, DOCTOR, NURSE (ai có quyền `WAREHOUSE_VIEW`).
 *     tags:
 *       - "5.7 Warehouse Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "WH_260317_abc12345"
 *     responses:
 *       200:
 *         description: Lấy chi tiết kho thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Kho không tồn tại
 */
warehouseRoutes.get(
    '/:id',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('WAREHOUSE_VIEW'),
    WarehouseController.getById
);

/**
 * @swagger
 * /api/warehouses/{id}:
 *   patch:
 *     summary: Cập nhật kho thuốc
 *     description: |
 *       Cập nhật tên, loại, địa chỉ kho. Không cho sửa branch_id, code (immutable).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST (ai có quyền `WAREHOUSE_MANAGE`).
 *     tags:
 *       - "5.7 Warehouse Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "WH_260317_abc12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Kho chính Q1 (mới)"
 *               warehouse_type:
 *                 type: string
 *                 enum: [MAIN, SECONDARY]
 *               address:
 *                 type: string
 *                 example: "Tầng 2, Tòa nhà B"
 *     responses:
 *       200:
 *         description: Cập nhật kho thành công
 *       400:
 *         description: Không có trường nào để cập nhật
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Kho không tồn tại
 */
warehouseRoutes.patch(
    '/:id',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('WAREHOUSE_MANAGE'),
    WarehouseController.update
);

/**
 * @swagger
 * /api/warehouses/{id}/toggle:
 *   patch:
 *     summary: Bật/tắt kho thuốc
 *     description: |
 *       Toggle trạng thái kho (active ↔ inactive). Kho inactive sẽ không xuất hiện khi nhập kho.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST (ai có quyền `WAREHOUSE_MANAGE`).
 *     tags:
 *       - "5.7 Warehouse Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "WH_260317_abc12345"
 *     responses:
 *       200:
 *         description: Thay đổi trạng thái kho thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Kho không tồn tại
 */
warehouseRoutes.patch(
    '/:id/toggle',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('WAREHOUSE_MANAGE'),
    WarehouseController.toggle
);
