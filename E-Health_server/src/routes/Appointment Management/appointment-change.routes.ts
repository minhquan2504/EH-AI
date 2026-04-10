// src/routes/Appointment Management/appointment-change.routes.ts
import { Router } from 'express';
import { AppointmentChangeController } from '../../controllers/Appointment Management/appointment-change.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const appointmentChangeRoutes = Router();

// =====================================================================
// 3.8  QUẢN LÝ THAY ĐỔI & DỜI LỊCH
/**
 * @swagger
 * /api/appointment-changes/stats:
 *   get:
 *     summary: Thống kê dời/hủy lịch theo khoảng thời gian
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_CHANGE_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về tổng số lần hủy, dời, hủy trễ (late cancel), và top lý do hủy.
 *       - Hữu ích cho báo cáo quản lý, đánh giá hiệu quả vận hành.
 *       - Có thể lọc theo chi nhánh qua `branch_id`.
 *     tags: [3.8 Quản lý thay đổi & dời lịch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu (YYYY-MM-DD)
 *         example: "2026-03-01"
 *       - in: query
 *         name: to_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc (YYYY-MM-DD)
 *         example: "2026-03-31"
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Lọc theo chi nhánh (optional)
 *         example: BR_HCM_001
 *     responses:
 *       200:
 *         description: Lấy thống kê thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     from_date:
 *                       type: string
 *                       example: "2026-03-01"
 *                     to_date:
 *                       type: string
 *                       example: "2026-03-31"
 *                     total_cancels:
 *                       type: number
 *                       example: 15
 *                     total_reschedules:
 *                       type: number
 *                       example: 23
 *                     late_cancels:
 *                       type: number
 *                       example: 3
 *                     cancel_reasons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           reason:
 *                             type: string
 *                             example: "Bận công việc"
 *                           count:
 *                             type: number
 *                             example: 5
 *       400:
 *         description: Thiếu hoặc sai khoảng thời gian
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 */
appointmentChangeRoutes.get(
    '/stats',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_CHANGE_VIEW'),
    AppointmentChangeController.getStats
);

/**
 * @swagger
 * /api/appointment-changes/recent:
 *   get:
 *     summary: Danh sách thay đổi gần đây (phân trang)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_CHANGE_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Liệt kê tất cả các lần dời/hủy lịch gần đây.
 *       - Hỗ trợ phân trang và lọc theo loại thay đổi (RESCHEDULE/CANCEL).
 *       - Bao gồm thông tin bệnh nhân, người thực hiện, slot cũ/mới.
 *     tags: [3.8 Quản lý thay đổi & dời lịch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: change_type
 *         schema:
 *           type: string
 *           enum: [RESCHEDULE, CANCEL]
 *         description: Lọc loại thay đổi (optional)
 *         example: CANCEL
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Lọc theo chi nhánh (optional)
 *         example: BR_HCM_001
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         example: 20
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
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
 *                       id:
 *                         type: string
 *                       appointment_id:
 *                         type: string
 *                       change_type:
 *                         type: string
 *                         example: CANCEL
 *                       old_date:
 *                         type: string
 *                         example: "2026-03-20"
 *                       new_date:
 *                         type: string
 *                         example: "2026-03-22"
 *                       reason:
 *                         type: string
 *                         example: "Bận công việc"
 *                       changed_by_name:
 *                         type: string
 *                         example: "Nguyễn Văn Admin"
 *                       patient_name:
 *                         type: string
 *                         example: "Trần Thị B"
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 */
appointmentChangeRoutes.get(
    '/recent',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_CHANGE_VIEW'),
    AppointmentChangeController.getRecentChanges
);

/**
 * @swagger
 * /api/appointment-changes/{appointmentId}/history:
 *   get:
 *     summary: Lịch sử thay đổi của 1 lịch khám
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_CHANGE_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về toàn bộ lịch sử thay đổi (dời + hủy) của lịch khám.
 *       - Bao gồm thông tin slot cũ/mới, lý do, người thực hiện, kết quả policy check.
 *       - Sắp xếp theo thời gian mới nhất trước.
 *     tags: [3.8 Quản lý thay đổi & dời lịch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch khám
 *         example: APT_bcd7f423-337
 *     responses:
 *       200:
 *         description: Lấy lịch sử thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     appointment_id:
 *                       type: string
 *                     appointment_code:
 *                       type: string
 *                     current_status:
 *                       type: string
 *                     reschedule_count:
 *                       type: number
 *                       example: 2
 *                     changes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           change_type:
 *                             type: string
 *                           old_date:
 *                             type: string
 *                           new_date:
 *                             type: string
 *                           old_slot_time:
 *                             type: string
 *                           new_slot_time:
 *                             type: string
 *                           reason:
 *                             type: string
 *                           changed_by_name:
 *                             type: string
 *                           policy_result:
 *                             type: string
 *                           created_at:
 *                             type: string
 *       404:
 *         description: Lịch khám không tồn tại
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 */
appointmentChangeRoutes.get(
    '/:appointmentId/history',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_CHANGE_VIEW'),
    AppointmentChangeController.getHistory
);

/**
 * @swagger
 * /api/appointment-changes/{appointmentId}/check-cancel-policy:
 *   post:
 *     summary: Kiểm tra chính sách hủy lịch trước khi hủy
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_CANCEL.
 *       **Vai trò được phép:** ADMIN, STAFF, PATIENT, CUSTOMER.
 *
 *       **Mô tả chi tiết:**
 *       - Preview kết quả kiểm tra chính sách hủy lịch TRƯỚC khi thực hiện hủy.
 *       - Trả về: được phép hay không, số giờ còn lại, deadline, thông báo chi tiết.
 *       - Dựa trên cấu hình `cancellation_allowed_hours` từ booking_configurations.
 *       - Admin luôn có thể hủy (late cancel), người dùng khác bị chặn nếu quá deadline.
 *     tags: [3.8 Quản lý thay đổi & dời lịch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch khám
 *         example: APT_bcd7f423-337
 *     responses:
 *       200:
 *         description: Kiểm tra thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     appointment_id:
 *                       type: string
 *                     appointment_code:
 *                       type: string
 *                     current_status:
 *                       type: string
 *                     appointment_datetime:
 *                       type: string
 *                       format: date-time
 *                     policy:
 *                       type: object
 *                       properties:
 *                         cancellation_allowed_hours:
 *                           type: number
 *                           example: 12
 *                         deadline:
 *                           type: string
 *                           format: date-time
 *                         allowed:
 *                           type: boolean
 *                           example: true
 *                         hours_remaining:
 *                           type: number
 *                           example: 23.5
 *                         message:
 *                           type: string
 *       404:
 *         description: Lịch khám không tồn tại
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 */
appointmentChangeRoutes.post(
    '/:appointmentId/check-cancel-policy',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_CANCEL'),
    AppointmentChangeController.checkCancelPolicy
);

/**
 * @swagger
 * /api/appointment-changes/{appointmentId}/can-reschedule:
 *   get:
 *     summary: Kiểm tra lịch khám có thể dời không
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_EDIT.
 *       **Vai trò được phép:** ADMIN, STAFF, PATIENT, CUSTOMER.
 *
 *       **Mô tả chi tiết:**
 *       - Kiểm tra trạng thái lịch khám có cho phép dời hay không (chỉ PENDING/CONFIRMED).
 *       - Trả về số lần đã dời + trạng thái hiện tại.
 *       - Hữu ích cho frontend hiển thị nút "Dời lịch" có sẵn hay không.
 *     tags: [3.8 Quản lý thay đổi & dời lịch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch khám
 *         example: APT_bcd7f423-337
 *     responses:
 *       200:
 *         description: Kiểm tra thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     appointment_id:
 *                       type: string
 *                     appointment_code:
 *                       type: string
 *                     current_status:
 *                       type: string
 *                       example: CONFIRMED
 *                     can_reschedule:
 *                       type: boolean
 *                       example: true
 *                     reschedule_count:
 *                       type: number
 *                       example: 1
 *                     reason:
 *                       type: string
 *       404:
 *         description: Lịch khám không tồn tại
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 */
appointmentChangeRoutes.get(
    '/:appointmentId/can-reschedule',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_EDIT'),
    AppointmentChangeController.canReschedule
);

export default appointmentChangeRoutes;
