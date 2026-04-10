import { Router } from 'express';
import { NotificationCategoryController } from '../../controllers/Core/notification-category.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const notificationCategoryRoutes = Router();

notificationCategoryRoutes.get('/dropdown', verifyAccessToken, checkSessionStatus, NotificationCategoryController.getActiveCategories);

notificationCategoryRoutes.use(verifyAccessToken, checkSessionStatus, authorizePermissions('NOTIFICATION_CATEGORY_VIEW', 'NOTIFICATION_CATEGORY_CREATE', 'NOTIFICATION_CATEGORY_UPDATE', 'NOTIFICATION_CATEGORY_DELETE'));

/**
 * @swagger
 * tags:
 *   name: 1.7.1 Quản lý Loại Thông báo (Notification Categories)
 *   description: Thiết lập các cấu hình nhóm thông báo cốt lõi của hệ thống (Chỉ dành cho ADMIN/SYSTEM)
 */

/**
 * @swagger
 * /api/notifications/categories:
 *   get:
 *     summary: Lấy danh sách loại thông báo
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Lấy danh sách phân trang (Hỗ trợ tìm kiếm theo name hoặc code)
 *     tags: [1.7.1 Quản lý Loại Thông báo (Notification Categories)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo tên hoặc mã
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xem schema chung ở các module trước
 */
notificationCategoryRoutes.get('/', NotificationCategoryController.getCategories);

/**
 * @swagger
 * /api/notifications/categories:
 *   post:
 *     summary: Tạo loại thông báo mới
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *     tags: [1.7.1 Quản lý Loại Thông báo (Notification Categories)]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *             properties:
 *               code:
 *                 type: string
 *                 example: APPOINTMENT
 *               name:
 *                 type: string
 *                 example: Thông báo lịch hẹn
 *               description:
 *                 type: string
 *                 example: Dùng cho toàn bộ kịch bản nhắc hẹn, đặt hẹn, đổi lịch..
 *     responses:
 *       201:
 *         description: Created
 */
notificationCategoryRoutes.post('/', NotificationCategoryController.createCategory);

/**
 * @swagger
 * /api/notifications/categories/{id}:
 *   put:
 *     summary: Cập nhật loại thông báo
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *     tags: [1.7.1 Quản lý Loại Thông báo (Notification Categories)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Thông báo lịch hẹn & Khám
 *               description:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: OK
 */
notificationCategoryRoutes.put('/:id', NotificationCategoryController.updateCategory);

/**
 * @swagger
 * /api/notifications/categories/{id}:
 *   delete:
 *     summary: Xóa ẩn một loại thông báo
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *     tags: [1.7.1 Quản lý Loại Thông báo (Notification Categories)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
notificationCategoryRoutes.delete('/:id', NotificationCategoryController.deleteCategory);

export default notificationCategoryRoutes;
