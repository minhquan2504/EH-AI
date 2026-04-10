import { Router } from 'express';
import { ApiPermissionController } from '../../controllers/Core/api-permission.controller';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';

const apiPermissionRoutes = Router();

apiPermissionRoutes.use(verifyAccessToken);



/**
 * @swagger
 * /api/api-permissions:
 *   get:
 *     summary: Lấy danh sách API Endpoints
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [1.3.6 Kiểm soát API theo vai trò]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo Endpoint (ví dụ /api/users)
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *         description: Lọc theo tên tính năng module
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *         description: Lọc theo Method Request (GET, POST, PUT, DELETE)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Danh sách API trả về.
 */
apiPermissionRoutes.get('/', authorizePermissions('API_PERMISSION_VIEW'), ApiPermissionController.getApiPermissions);

/**
 * @swagger
 * /api/api-permissions:
 *   post:
 *     summary: Đăng ký API Endpoint mới
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [1.3.6 Kiểm soát API theo vai trò]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [method, endpoint]
 *             properties:
 *               method:
 *                 type: string
 *                 example: "GET"
 *               endpoint:
 *                 type: string
 *                 example: "/api/users"
 *               description:
 *                 type: string
 *                 example: "Lấy danh sách người dùng"
 *               module:
 *                 type: string
 *                 example: "USER_MANAGEMENT"
 *     responses:
 *       201:
 *         description: Trả về API vừa khai báo
 */
apiPermissionRoutes.post('/', authorizePermissions('API_PERMISSION_CREATE'), ApiPermissionController.createApiPermission);

/**
 * @swagger
 * /api/api-permissions/{apiId}:
 *   patch:
 *     summary: Chỉnh sửa thông số API Endpoint
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [1.3.6 Kiểm soát API theo vai trò]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: apiId
 *         required: true
 *         schema:
 *           type: string
 *           description: ID của API Permission
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               method:
 *                 type: string
 *               endpoint:
 *                 type: string
 *               description:
 *                 type: string
 *               module:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 example: "ACTIVE"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
apiPermissionRoutes.patch('/:apiId', authorizePermissions('API_PERMISSION_UPDATE'), ApiPermissionController.updateApiPermission);

/**
 * @swagger
 * /api/api-permissions/{apiId}:
 *   delete:
 *     summary: Xóa API Endpoint khỏi cấu hình
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [1.3.6 Kiểm soát API theo vai trò]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: apiId
 *         required: true
 *         schema:
 *           type: string
 *           description: ID của API Permission
 *     responses:
 *       200:
 *         description: Xóa API thành công
 */
apiPermissionRoutes.delete('/:apiId', authorizePermissions('API_PERMISSION_DELETE'), ApiPermissionController.deleteApiPermission);

export default apiPermissionRoutes;
