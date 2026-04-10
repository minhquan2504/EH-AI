import { Router } from 'express';
import { MenuController } from '../../controllers/Core/menu.controller';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';

const menuRoutes = Router();

menuRoutes.use(verifyAccessToken);



/**
 * @swagger
 * /api/menus:
 *   get:
 *     summary: Lấy danh sách toàn bộ Menu hệ thống
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [1.3.5 Kiểm soát hiển thị menu theo vai trò]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
menuRoutes.get('/', authorizePermissions('MENU_VIEW'), MenuController.getMenus);

/**
 * @swagger
 * /api/menus:
 *   post:
 *     summary: Tạo mới Menu hệ thống
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [1.3.5 Kiểm soát hiển thị menu theo vai trò]
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
 *                 example: "NEW_MENU_01"
 *               name:
 *                 type: string
 *                 example: "Menu Mới"
 *               url:
 *                 type: string
 *                 example: "/new-menu"
 *               icon:
 *                 type: string
 *                 example: "star-icon"
 *               parent_id:
 *                 type: string
 *                 example: "MENU_DASHBOARD"
 *               sort_order:
 *                 type: number
 *                 example: 10
 *     responses:
 *       201:
 *         description: Trả về Menu vừa tạo
 */
menuRoutes.post('/', authorizePermissions('MENU_CREATE'), MenuController.createMenu);

/**
 * @swagger
 * /api/menus/{menuId}:
 *   patch:
 *     summary: Cập nhật thông tin Menu
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [1.3.5 Kiểm soát hiển thị menu theo vai trò]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: menuId
 *         required: true
 *         schema:
 *           type: string
 *           description: ID hoặc Mã Code của Menu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Menu Đã Đổi Tên"
 *               url:
 *                 type: string
 *                 example: "/new-url"
 *                 nullable: true
 *               icon:
 *                 type: string
 *                 example: "new-icon"
 *                 nullable: true
 *               parent_id:
 *                 type: string
 *                 example: null
 *                 nullable: true
 *               sort_order:
 *                 type: number
 *                 example: 1
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 example: "ACTIVE"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
menuRoutes.patch('/:menuId', authorizePermissions('MENU_UPDATE'), MenuController.updateMenu);

/**
 * @swagger
 * /api/menus/{menuId}:
 *   delete:
 *     summary: Xóa một Menu khỏi hệ thống
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [1.3.5 Kiểm soát hiển thị menu theo vai trò]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: menuId
 *         required: true
 *         schema:
 *           type: string
 *           description: ID hoặc Mã Code của Menu
 *     responses:
 *       200:
 *         description: Xóa Menu thành công
 */
menuRoutes.delete('/:menuId', authorizePermissions('MENU_DELETE'), MenuController.deleteMenu);

export default menuRoutes;
