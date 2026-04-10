// src/routes/Facility Management/leave.routes.ts
import { Router } from 'express';
import { LeaveController } from '../../controllers/Facility Management/leave.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const router = Router();

/**
 * @swagger
 * /api/leaves:
 *   post:
 *     summary: Tạo đơn xin nghỉ phép
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền LEAVE_CREATE.
 *       **Vai trò được phép:** Tất cả nhân viên y tế (DOCTOR, NURSE, PHARMACIST...) và Admin.
 *
 *       **Mô tả:** Nhân viên gửi đơn xin nghỉ phép từ ngày nào đến ngày nào kèm lý do.
 *       Hệ thống tự gán user_id từ token đăng nhập. Trạng thái ban đầu là PENDING.
 *     tags: [2.6.5 Quản lý Nghỉ phép]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [start_date, end_date, reason]
 *             properties:
 *               start_date:
 *                 type: string
 *                 description: "Ngày bắt đầu nghỉ (YYYY-MM-DD)"
 *                 example: "2026-03-15"
 *               end_date:
 *                 type: string
 *                 description: "Ngày kết thúc nghỉ (YYYY-MM-DD)"
 *                 example: "2026-03-17"
 *               reason:
 *                 type: string
 *                 description: "Lý do xin nghỉ"
 *                 example: "Nghỉ phép năm, về quê thăm gia đình"
 *     responses:
 *       201:
 *         description: Tạo đơn nghỉ phép thành công
 *       400:
 *         description: Thiếu thông tin hoặc ngày không hợp lệ
 */
router.post('/', verifyAccessToken, checkSessionStatus, authorizePermissions('LEAVE_CREATE'), LeaveController.createLeave);

/**
 * @swagger
 * /api/leaves:
 *   get:
 *     summary: Lấy danh sách đơn nghỉ phép
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền LEAVE_VIEW.
 *       **Vai trò được phép:** Tất cả nhân viên (xem đơn của mình), Admin/Manager (xem tất cả).
 *
 *       **Mô tả:** Có thể lọc theo user_id hoặc status (PENDING, APPROVED, REJECTED).
 *     tags: [2.6.5 Quản lý Nghỉ phép]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: Lọc theo nhân viên
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: Lọc theo trạng thái đơn
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', verifyAccessToken, checkSessionStatus, authorizePermissions('LEAVE_VIEW'), LeaveController.getLeaves);

/**
 * @swagger
 * /api/leaves/{id}:
 *   get:
 *     summary: Chi tiết 1 đơn nghỉ phép
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền LEAVE_VIEW.
 *     tags: [2.6.5 Quản lý Nghỉ phép]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "LV_2603_abcd1234"
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Đơn không tồn tại
 */
router.get('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('LEAVE_VIEW'), LeaveController.getLeaveById);

/**
 * @swagger
 * /api/leaves/{id}:
 *   put:
 *     summary: Chỉnh sửa đơn nghỉ phép (chỉ khi PENDING)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền LEAVE_UPDATE.
 *       **Điều kiện:** Đơn phải đang ở trạng thái PENDING mới cho phép sửa.
 *     tags: [2.6.5 Quản lý Nghỉ phép]
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
 *               start_date:
 *                 type: string
 *                 example: "2026-03-16"
 *               end_date:
 *                 type: string
 *                 example: "2026-03-18"
 *               reason:
 *                 type: string
 *                 example: "Cập nhật lý do: Đi khám bệnh"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Đơn không ở trạng thái PENDING
 */
router.put('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('LEAVE_UPDATE'), LeaveController.updateLeave);

/**
 * @swagger
 * /api/leaves/{id}:
 *   delete:
 *     summary: Hủy / Rút đơn nghỉ phép
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền LEAVE_DELETE.
 *       **Điều kiện:** Chỉ cho phép hủy khi đơn đang ở trạng thái PENDING.
 *     tags: [2.6.5 Quản lý Nghỉ phép]
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
 *         description: Hủy đơn thành công
 *       400:
 *         description: Đơn không ở trạng thái PENDING
 */
router.delete('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('LEAVE_DELETE'), LeaveController.deleteLeave);

/**
 * @swagger
 * /api/leaves/{id}/approve:
 *   patch:
 *     summary: Duyệt đơn nghỉ phép
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền LEAVE_APPROVE.
 *       **Vai trò được phép:** SUPER_ADMIN, ADMIN, MANAGER.
 *
 *       **Mô tả chi tiết:**
 *       - Chuyển trạng thái đơn từ PENDING sang APPROVED.
 *       - **Side-effect:** Hệ thống tự động quét bảng `staff_schedules` và đánh dấu `is_leave = true`
 *         cho tất cả lịch trực của nhân viên đó nằm trong khoảng ngày nghỉ.
 *     tags: [2.6.5 Quản lý Nghỉ phép]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approver_note:
 *                 type: string
 *                 description: "Ghi chú của người duyệt (tùy chọn)"
 *                 example: "Đã duyệt nghỉ phép năm"
 *     responses:
 *       200:
 *         description: Duyệt đơn thành công
 *       400:
 *         description: Đơn đã được xử lý trước đó
 */
router.patch('/:id/approve', verifyAccessToken, checkSessionStatus, authorizePermissions('LEAVE_APPROVE'), LeaveController.approveLeave);

/**
 * @swagger
 * /api/leaves/{id}/reject:
 *   patch:
 *     summary: Từ chối đơn nghỉ phép
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền LEAVE_APPROVE.
 *       **Vai trò được phép:** SUPER_ADMIN, ADMIN, MANAGER.
 *
 *       **Mô tả:** Từ chối đơn nghỉ phép. Bắt buộc phải nhập lý do từ chối (approver_note).
 *     tags: [2.6.5 Quản lý Nghỉ phép]
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
 *             required: [approver_note]
 *             properties:
 *               approver_note:
 *                 type: string
 *                 description: "Lý do từ chối (bắt buộc)"
 *                 example: "Ngày đó phòng khám thiếu người trực, không thể duyệt nghỉ"
 *     responses:
 *       200:
 *         description: Từ chối đơn thành công
 *       400:
 *         description: Thiếu lý do từ chối hoặc đơn đã xử lý
 */
router.patch('/:id/reject', verifyAccessToken, checkSessionStatus, authorizePermissions('LEAVE_APPROVE'), LeaveController.rejectLeave);

export const leaveRoutes = router;
