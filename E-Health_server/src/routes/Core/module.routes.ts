import { Router } from 'express';
import { ModuleController } from '../../controllers/Core/module.controller';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';

const moduleRoutes = Router();

moduleRoutes.use(verifyAccessToken);



/**
 * @swagger
 * /api/modules:
 *   get:
 *     summary: Lấy danh sách các Module riêng biệt
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *       API trả về mảng danh sách tên các Module có sẵn trong hệ thống phục vụ việc nhóm quyền hạn.
 *     tags: [1.3.4 Phân quyền theo module]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
moduleRoutes.get('/', authorizePermissions('MODULE_VIEW'), ModuleController.getModules);

/**
 * @swagger
 * /api/modules/{moduleName}/permissions:
 *   get:
 *     summary: Lấy danh sách Quyền của một Module cụ thể
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [1.3.4 Phân quyền theo module]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleName
 *         required: true
 *         schema:
 *           type: string
 *           example: "USER_MANAGEMENT"
 *     responses:
 *       200:
 *         description: Thành công
 */
moduleRoutes.get('/:moduleName/permissions', authorizePermissions('MODULE_VIEW'), ModuleController.getPermissionsByModule);

export default moduleRoutes;
