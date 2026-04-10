import { Router } from 'express';
import { SupplierController } from '../../controllers/Medication Management/supplier.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

export const supplierRoutes = Router();

/**
 * @swagger
 * /api/suppliers:
 *   get:
 *     summary: Danh sách nhà cung cấp
 *     description: |
 *       Lấy danh sách tất cả nhà cung cấp, hỗ trợ tìm kiếm và filter active.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST (ai có quyền `STOCK_IN_VIEW`).
 *     tags:
 *       - "5.8 Stock-In Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: ""
 *         description: Tìm theo mã, tên, người liên hệ
 *       - in: query
 *         name: active_only
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *           example: ""
 *         description: Chỉ NCC đang hoạt động
 *     responses:
 *       200:
 *         description: Lấy danh sách NCC thành công
 *       401:
 *         description: Chưa đăng nhập
 */
supplierRoutes.get('/', verifyAccessToken, checkSessionStatus, authorizePermissions('STOCK_IN_VIEW'), SupplierController.getAll);

/**
 * @swagger
 * /api/suppliers:
 *   post:
 *     summary: Tạo nhà cung cấp mới
 *     description: |
 *       Tạo NCC mới. Mã NCC (code) phải UNIQUE.
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
 *             required: [code, name]
 *             properties:
 *               code:
 *                 type: string
 *                 example: "NCC-001"
 *               name:
 *                 type: string
 *                 example: "Công ty Dược phẩm ABC"
 *               contact_person:
 *                 type: string
 *                 example: "Nguyễn Văn A"
 *               phone:
 *                 type: string
 *                 example: "0901234567"
 *               email:
 *                 type: string
 *                 example: "abc@duocpham.vn"
 *               address:
 *                 type: string
 *                 example: "123 Nguyễn Trãi, Q5, HCM"
 *               tax_code:
 *                 type: string
 *                 example: "0123456789"
 *     responses:
 *       201:
 *         description: Tạo NCC thành công
 *       400:
 *         description: Thiếu thông tin
 *       409:
 *         description: Mã NCC đã tồn tại
 */
supplierRoutes.post('/', verifyAccessToken, checkSessionStatus, authorizePermissions('STOCK_IN_MANAGE'), SupplierController.create);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   get:
 *     summary: Chi tiết nhà cung cấp
 *     description: |
 *       Lấy thông tin chi tiết 1 nhà cung cấp.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST (ai có quyền `STOCK_IN_VIEW`).
 *     tags:
 *       - "5.8 Stock-In Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "SUP_260317_abc12345"
 *     responses:
 *       200:
 *         description: Lấy chi tiết NCC thành công
 *       404:
 *         description: NCC không tồn tại
 */
supplierRoutes.get('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('STOCK_IN_VIEW'), SupplierController.getById);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   patch:
 *     summary: Cập nhật nhà cung cấp
 *     description: |
 *       Cập nhật thông tin NCC. Không cho sửa mã (code).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST (ai có quyền `STOCK_IN_MANAGE`).
 *     tags:
 *       - "5.8 Stock-In Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "SUP_260317_abc12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Công ty Dược phẩm ABC (cập nhật)"
 *               contact_person:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *               tax_code:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật NCC thành công
 *       404:
 *         description: NCC không tồn tại
 */
supplierRoutes.patch('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('STOCK_IN_MANAGE'), SupplierController.update);
