import { Router } from 'express';
import { ProfileController } from '../../controllers/Core/profile.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';

const profileRoutes = Router();

// Middleware: Yêu cầu đăng nhập hợp lệ và session còn hạn cho TOÀN BỘ API Profile
profileRoutes.use(verifyAccessToken, checkSessionStatus);

/**
 * @swagger
 * tags:
 *   name: 1.6 Quản lý hồ sơ người dùng (User Profile)
 *   description: Các API liên quan đến thông tin cá nhân và tài khoản của người dùng đang đăng nhập (Tự thao tác)
 */

/**
 * @swagger
 * /api/profile/me:
 *   get:
 *     summary: Xem hồ sơ cá nhân
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Lấy thông tin tài khoản và cấu hình hồ sơ cá nhân của người dùng hiện tại
 *     tags: [1.6 Quản lý hồ sơ người dùng (User Profile)]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Lấy thông tin hồ sơ thành công.
 *                 data:
 *                   type: object
 *                   properties:
 *                     users_id:
 *                       type: string
 *                       example: USR_12345
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     phone_number:
 *                       type: string
 *                       example: "0123456789"
 *                     full_name:
 *                       type: string
 *                       example: Nguyễn Văn A
 *                     gender:
 *                       type: string
 *                       example: MALE
 *                     preferences:
 *                       type: object
 *                       example: {"theme": "dark", "language": "vi"}
 *       401:
 *         description: Không có quyền truy cập
 */
profileRoutes.get('/me', ProfileController.getMyProfile);

/**
 * @swagger
 * /api/profile/me:
 *   put:
 *     summary: Cập nhật thông tin cá nhân (Profile)
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Cho phép người dùng cập nhật các thông tin cơ bản. (Lưu ý, gender phải khớp với mã trong Master Data)
 *     tags: [1.6 Quản lý hồ sơ người dùng (User Profile)]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: Nguyễn Văn B
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: 1990-01-01
 *               gender:
 *                 type: string
 *                 example: MALE
 *               address:
 *                 type: string
 *                 example: 123 Đường Số 1, Quận 1, TP. HCM
 *               identity_card_number:
 *                 type: string
 *                 example: 083485098765
 *               avatar_url:
 *                 type: string
 *                 example: https://example.com/avatar.jpg
 *     responses:
 *       200:
 *         description: Hoàn thành cập nhật
 *       400:
 *         description: Dữ liệu không hợp lệ (Ví dụ gender sai thực tế)
 */
profileRoutes.put('/me', ProfileController.updateMyProfile);

/**
 * @swagger
 * /api/profile/password:
 *   put:
 *     summary: Thay đổi mật khẩu
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Đổi mật khẩu. Mật khẩu thay đổi thành công sẽ ép đăng xuất tất cả các thiết bị khác.
 *     tags: [1.6 Quản lý hồ sơ người dùng (User Profile)]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - old_password
 *               - new_password
 *             properties:
 *               old_password:
 *                 type: string
 *                 example: password123
 *               new_password:
 *                 type: string
 *                 example: newpassword456
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       400:
 *         description: Mật khẩu cũ không chính xác
 */
profileRoutes.put('/password', ProfileController.changePassword);

/**
 * @swagger
 * /api/profile/sessions:
 *   get:
 *     summary: Xem lịch sử / thiết bị đăng nhập
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Lấy danh sách các thiết bị/trình duyệt đang duy trì phiên đăng nhập của người dùng
 *     tags: [1.6 Quản lý hồ sơ người dùng (User Profile)]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
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
 *                       user_sessions_id:
 *                         type: string
 *                         example: SES_98765
 *                       device_name:
 *                         type: string
 *                         example: Chrome on Windows
 *                       ip_address:
 *                         type: string
 *                         example: 192.168.1.1
 *                       is_current:
 *                         type: boolean
 *                         example: true
 */
profileRoutes.get('/sessions', ProfileController.getMySessions);

/**
 * @swagger
 * /api/profile/sessions:
 *   delete:
 *     summary: Đăng xuất tất cả thiết bị khác
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Thu hồi tất cả các phiên đăng nhập ngoại trừ phiên hiện tại của người dùng
 *     tags: [1.6 Quản lý hồ sơ người dùng (User Profile)]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
profileRoutes.delete('/sessions', ProfileController.revokeAllOtherSessions);

/**
 * @swagger
 * /api/profile/sessions/{sessionId}:
 *   delete:
 *     summary: Đăng xuất khỏi thiết bị cụ thể
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Thu hồi phiên đăng nhập của một thiết bị cụ thể dựa vào sessionId
 *     tags: [1.6 Quản lý hồ sơ người dùng (User Profile)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         example: SES_98765
 *         description: ID của phiên đăng nhập cần thu hồi
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Không thể thu hồi session hiện hành bằng API này
 *       404:
 *         description: Không tìm thấy session
 */
profileRoutes.delete('/sessions/:sessionId', ProfileController.revokeSession);

/**
 * @swagger
 * /api/profile/settings:
 *   put:
 *     summary: Cài đặt cá nhân
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Cập nhật các tùy chọn cài đặt cá nhân như ngôn ngữ, theme giao diện
 *     tags: [1.6 Quản lý hồ sơ người dùng (User Profile)]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - preferences
 *             properties:
 *               preferences:
 *                 type: object
 *                 example: {"language": "vi", "theme": "dark", "notifications": true}
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
profileRoutes.put('/settings', ProfileController.updateMySettings);

export default profileRoutes;
