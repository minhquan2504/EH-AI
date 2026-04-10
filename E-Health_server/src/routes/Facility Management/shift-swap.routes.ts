// src/routes/Facility Management/shift-swap.routes.ts
import { Router } from 'express';
import { ShiftSwapController } from '../../controllers/Facility Management/shift-swap.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const router = Router();

/**
 * @swagger
 * /api/shift-swaps:
 *   post:
 *     summary: Tạo yêu cầu đổi ca
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền SWAP_CREATE.
 *       **Vai trò được phép:** Tất cả nhân viên y tế (DOCTOR, NURSE, PHARMACIST...) và Admin.
 *
 *       **Mô tả chi tiết:**
 *       - Nhân viên A chọn 1 lịch trực của **chính mình** (requester_schedule_id) và 1 lịch trực
 *         của **nhân viên B** (target_schedule_id), kèm lý do muốn đổi.
 *       - Hệ thống tự xác thực người tạo phải là owner của requester_schedule_id.
 *       - Cả 2 lịch phải ở tương lai và không nằm trong yêu cầu Swap PENDING nào khác.
 *     tags: [2.6.6 Đổi ca làm việc]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [requester_schedule_id, target_schedule_id, reason]
 *             properties:
 *               requester_schedule_id:
 *                 type: string
 *                 description: "ID lịch trực của người yêu cầu (lịch của mình)"
 *                 example: "SCH_2603_9340a0ed"
 *               target_schedule_id:
 *                 type: string
 *                 description: "ID lịch trực của người muốn đổi (lịch của người kia)"
 *                 example: "SCH_2603_53726dec"
 *               reason:
 *                 type: string
 *                 description: "Lý do xin đổi ca"
 *                 example: "Xin đổi ca vì có lịch khám bệnh cá nhân"
 *     responses:
 *       201:
 *         description: Tạo yêu cầu đổi ca thành công
 *       400:
 *         description: Thiếu thông tin hoặc vi phạm ràng buộc
 *       403:
 *         description: Không phải owner của lịch trực
 *       409:
 *         description: Lịch trực đã có yêu cầu Swap PENDING khác
 */
router.post('/', verifyAccessToken, checkSessionStatus, authorizePermissions('SWAP_CREATE'), ShiftSwapController.createSwap);

/**
 * @swagger
 * /api/shift-swaps:
 *   get:
 *     summary: Lấy danh sách yêu cầu đổi ca
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền SWAP_VIEW.
 *       **Vai trò được phép:** Tất cả nhân viên (xem tất cả đơn), Admin/Manager.
 *
 *       **Mô tả:** Trả về danh sách yêu cầu đổi ca kèm thông tin tên NV, ngày trực, ca trực.
 *       Có thể lọc theo status (PENDING, APPROVED, REJECTED).
 *     tags: [2.6.6 Đổi ca làm việc]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', verifyAccessToken, checkSessionStatus, authorizePermissions('SWAP_VIEW'), ShiftSwapController.getSwaps);

/**
 * @swagger
 * /api/shift-swaps/{id}:
 *   get:
 *     summary: Chi tiết 1 yêu cầu đổi ca
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền SWAP_VIEW.
 *
 *       **Mô tả:** Trả về thông tin chi tiết bao gồm tên 2 nhân viên, ngày/ca trực,
 *       phòng khám, tên người duyệt (nếu có).
 *     tags: [2.6.6 Đổi ca làm việc]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "SWP_2603_abcd1234"
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Yêu cầu không tồn tại
 */
router.get('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('SWAP_VIEW'), ShiftSwapController.getSwapById);

/**
 * @swagger
 * /api/shift-swaps/{id}/approve:
 *   patch:
 *     summary: Duyệt yêu cầu đổi ca
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền SWAP_APPROVE.
 *       **Vai trò được phép:** SUPER_ADMIN, ADMIN, MANAGER.
 *
 *       **Mô tả chi tiết:**
 *       - Chuyển trạng thái yêu cầu từ PENDING sang APPROVED.
 *       - **Side-effect:** Hệ thống sử dụng **DB Transaction** để hoán đổi `user_id`
 *         giữa 2 lịch trực trong bảng `staff_schedules`. Đảm bảo nguyên vẹn dữ liệu.
 *     tags: [2.6.6 Đổi ca làm việc]
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
 *                 example: "Đã xác nhận 2 bên đồng ý đổi ca"
 *     responses:
 *       200:
 *         description: Duyệt thành công, đã hoán đổi lịch trực
 *       400:
 *         description: Yêu cầu đã được xử lý trước đó
 */
router.patch('/:id/approve', verifyAccessToken, checkSessionStatus, authorizePermissions('SWAP_APPROVE'), ShiftSwapController.approveSwap);

/**
 * @swagger
 * /api/shift-swaps/{id}/reject:
 *   patch:
 *     summary: Từ chối yêu cầu đổi ca
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền SWAP_APPROVE.
 *       **Vai trò được phép:** SUPER_ADMIN, ADMIN, MANAGER.
 *
 *       **Mô tả:** Từ chối yêu cầu đổi ca. Bắt buộc nhập lý do từ chối (approver_note).
 *     tags: [2.6.6 Đổi ca làm việc]
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
 *                 example: "Không thể đổi ca vì 2 nhân viên khác chuyên khoa"
 *     responses:
 *       200:
 *         description: Từ chối thành công
 *       400:
 *         description: Thiếu lý do hoặc đơn đã xử lý
 */
router.patch('/:id/reject', verifyAccessToken, checkSessionStatus, authorizePermissions('SWAP_APPROVE'), ShiftSwapController.rejectSwap);

export const shiftSwapRoutes = router;
