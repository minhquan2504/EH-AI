import { Router } from 'express';
import { UserNotificationController } from '../../controllers/Core/user-notification.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const userNotificationRoutes = Router();

// Khu vực ADMIN - Quản lý Gửi Broadcast

/**
 * @swagger
 * tags:
 *   name: 1.7.4 Broadcast & Lõi Thông báo (Engine)
 *   description: Trigger sự kiện và bắn thông báo thủ công hàng loạt (Chỉ dành cho ADMIN/SYSTEM)
 */

/**
 * @swagger
 * /api/notifications/inbox/admin-broadcast:
 *   post:
 *     summary: Broadcast thông báo thủ công (Nhập tay text)
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *       Gửi đến 1 Role nhất định hoặc TẤT CẢ User trong luồng
 *     tags: [1.7.4 Broadcast & Lõi Thông báo (Engine)]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               role_id:
 *                 type: string
 *                 description: ID của ROLE muốn nhắm tới. Để Null nếu muốn bắn ALL hệ thống.
 *               title:
 *                 type: string
 *                 example: Thông báo nghỉ lễ 30/4
 *               content:
 *                 type: string
 *                 example: Hệ thống phòng khám sẽ nghỉ lễ từ ngày... Xin kính chúc..
 *               body_email:
 *                 type: string
 *               body_push:
 *                 type: string
 *     responses:
 *       200:
 *         description: Trả về số lượng user được phát tin thành công
 */
userNotificationRoutes.post('/admin-broadcast', [verifyAccessToken, checkSessionStatus, authorizePermissions('NOTIFICATION_TEMPLATE_UPDATE')], UserNotificationController.sendManualNotification);

// ============================================
// Khu vực NGƯỜI DÙNG - Hộp thư cá nhân Inbox
// ============================================

const inboxRouter = Router();
inboxRouter.use(verifyAccessToken, checkSessionStatus); // Tất cả User đã đăng nhập đều xài được

/**
 * @swagger
 * tags:
 *   name: 1.7.5 Hộp thư Thông báo cá nhân (User Inbox)
 *   description: Xem danh sách và đánh dấu đọc In-app Notifications
 */

/**
 * @swagger
 * /api/notifications/inbox:
 *   get:
 *     summary: Xem hộp thư của bản thân
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *     tags: [1.7.5 Hộp thư Thông báo cá nhân (User Inbox)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Trả về list và unread_count
 */
inboxRouter.get('/', UserNotificationController.getMyInbox);

/**
 * @swagger
 * /api/notifications/inbox/read-all:
 *   put:
 *     summary: Đánh dấu TẤT CẢ thông báo là đã đọc
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *     tags: [1.7.5 Hộp thư Thông báo cá nhân (User Inbox)]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
inboxRouter.put('/read-all', UserNotificationController.markAllAsRead);

/**
 * @swagger
 * /api/notifications/inbox/{id}/read:
 *   put:
 *     summary: Đánh dấu 1 thông báo là đã đọc
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *     tags: [1.7.5 Hộp thư Thông báo cá nhân (User Inbox)]
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
 *         description: Thành công
 */
inboxRouter.put('/:id/read', UserNotificationController.markAsRead);

// Kết nối Sub-router của Box vào Route gốc
userNotificationRoutes.use('/', inboxRouter);

export default userNotificationRoutes;
