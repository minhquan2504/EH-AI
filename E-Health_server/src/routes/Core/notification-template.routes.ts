import { Router } from 'express';
import { NotificationTemplateController } from '../../controllers/Core/notification-template.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const notificationTemplateRoutes = Router();

// Middleware yêu cầu quyền truy cập (Dành cho Admin/System) quản lý cấu hình cốt lõi Notifications
notificationTemplateRoutes.use(verifyAccessToken, checkSessionStatus, authorizePermissions('NOTIFICATION_TEMPLATE_VIEW', 'NOTIFICATION_TEMPLATE_CREATE', 'NOTIFICATION_TEMPLATE_UPDATE', 'NOTIFICATION_TEMPLATE_DELETE'));

/**
 * @swagger
 * tags:
 *   name: 1.7.2 Quản lý Mẫu Thông báo (Notification Templates)
 *   description: Thiết lập và tùy chỉnh các mẫu thông báo đa kênh (Chỉ dành cho ADMIN/SYSTEM)
 */

/**
 * @swagger
 * /api/notifications/templates:
 *   get:
 *     summary: Lấy danh sách mẫu thông báo
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Lấy danh sách phân trang mẫu thông báo
 *     tags: [1.7.2 Quản lý Mẫu Thông báo (Notification Templates)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo tên hoặc mã
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *         description: Lọc theo category
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
 *         description: OK
 */
notificationTemplateRoutes.get('/', NotificationTemplateController.getTemplates);

/**
 * @swagger
 * /api/notifications/templates:
 *   post:
 *     summary: Tạo mẫu thông báo mới
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *     tags: [1.7.2 Quản lý Mẫu Thông báo (Notification Templates)]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category_id
 *               - code
 *               - name
 *               - title_template
 *               - body_inapp
 *             properties:
 *               category_id:
 *                 type: string
 *               code:
 *                 type: string
 *                 example: APPOINTMENT_REMINDER
 *               name:
 *                 type: string
 *                 example: Nhắc lịch hẹn chuẩn
 *               title_template:
 *                 type: string
 *                 example: Nhắc lịch hẹn {{appointment_date}}
 *               body_inapp:
 *                 type: string
 *                 example: Xin chào {{patient_name}}, bạn có lịch khám vào...
 *               body_email:
 *                 type: string
 *                 example: <h1>Hello {{patient_name}}</h1> ...
 *               body_push:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 */
notificationTemplateRoutes.post('/', NotificationTemplateController.createTemplate);

/**
 * @swagger
 * /api/notifications/templates/{id}:
 *   put:
 *     summary: Cập nhật mẫu thông báo
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *     tags: [1.7.2 Quản lý Mẫu Thông báo (Notification Templates)]
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
 *               title_template:
 *                 type: string
 *               body_inapp:
 *                 type: string
 *               body_email:
 *                 type: string
 *               body_push:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: OK
 */
notificationTemplateRoutes.put('/:id', NotificationTemplateController.updateTemplate);

/**
 * @swagger
 * /api/notifications/templates/{id}:
 *   delete:
 *     summary: Xóa ẩn một mẫu thông báo
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *     tags: [1.7.2 Quản lý Mẫu Thông báo (Notification Templates)]
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
 *       403:
 *         description: Không thể xóa mẫu thông báo hệ thống cốt lõi
 */
notificationTemplateRoutes.delete('/:id', NotificationTemplateController.deleteTemplate);

export default notificationTemplateRoutes;
