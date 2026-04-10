import { Router } from 'express';
import { AppointmentConfirmationController } from '../../controllers/Appointment Management/appointment-confirmation.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

export const appointmentConfirmationRoutes = Router();

// =====================================================================
// 3.6.1. XÁC NHẬN LỊCH KHÁM (Appointment Confirmation)
// =====================================================================

/**
 * @swagger
 * /api/appointment-confirmations/{id}/confirm:
 *   patch:
 *     summary: Xác nhận 1 lịch khám (PENDING → CONFIRMED)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_CONFIRM.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, PATIENT.
 *
 *       **Mô tả chi tiết:**
 *       - Chuyển trạng thái lịch khám từ `PENDING` sang `CONFIRMED`.
 *       - Cập nhật `confirmed_at` = thời điểm hiện tại, `confirmed_by` = ID người xác nhận.
 *       - Ghi audit log ghi nhận thao tác xác nhận.
 *       - **Tự động gửi thông báo** (In-App / Email / Push) tới bệnh nhân nếu bệnh nhân có tài khoản.
 *       - **Toàn bộ logic chạy trong Transaction** (BEGIN/COMMIT/ROLLBACK).
 *       - Nếu lịch không ở trạng thái PENDING → trả lỗi 400.
 *     tags: [3.6 Xác nhận & Nhắc lịch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch khám cần xác nhận
 *         example: "APT_abc123def45"
 *     responses:
 *       200:
 *         description: Xác nhận lịch khám thành công
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
 *                   example: "Xác nhận lịch khám thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     appointments_id:
 *                       type: string
 *                       example: "APT_abc123def45"
 *                     status:
 *                       type: string
 *                       example: "CONFIRMED"
 *                     confirmed_at:
 *                       type: string
 *                       format: date-time
 *                     confirmed_by:
 *                       type: string
 *       400:
 *         description: Lịch khám không ở trạng thái PENDING
 *       404:
 *         description: Lịch khám không tồn tại
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
appointmentConfirmationRoutes.patch(
    '/:id/confirm',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('APPOINTMENT_CONFIRM')],
    AppointmentConfirmationController.confirm
);

/**
 * @swagger
 * /api/appointment-confirmations/batch-confirm:
 *   patch:
 *     summary: Xác nhận hàng loạt nhiều lịch khám
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_CONFIRM.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Xác nhận nhiều lịch khám cùng lúc (PENDING → CONFIRMED).
 *       - Xử lý từng lịch độc lập: lịch nào lỗi thì bỏ qua, lịch hợp lệ vẫn được xác nhận.
 *       - **Mỗi lịch chạy trong Transaction riêng biệt.**
 *       - Mỗi lịch xác nhận thành công → gửi thông báo tới bệnh nhân tương ứng.
 *       - Trả về kết quả chi tiết: `succeeded[]` (thành công) + `failed[]` (thất bại kèm lý do).
 *     tags: [3.6 Xác nhận & Nhắc lịch]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - appointment_ids
 *             properties:
 *               appointment_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Danh sách ID lịch khám cần xác nhận
 *                 example: ["APT_abc123def45", "APT_xyz789ghi01", "APT_qwe456jkl78"]
 *     responses:
 *       200:
 *         description: Xác nhận hàng loạt hoàn tất
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
 *                   example: "Xác nhận hàng loạt hoàn tất"
 *                 data:
 *                   type: object
 *                   properties:
 *                     succeeded:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["APT_abc123def45", "APT_qwe456jkl78"]
 *                     failed:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           reason:
 *                             type: string
 *                       example: [{"id": "APT_xyz789ghi01", "reason": "Chỉ lịch khám ở trạng thái PENDING mới được xác nhận"}]
 *       400:
 *         description: Thiếu danh sách appointment_ids
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
appointmentConfirmationRoutes.patch(
    '/batch-confirm',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('APPOINTMENT_CONFIRM')],
    AppointmentConfirmationController.batchConfirm
);

// =====================================================================
// 3.6.2. CHECK-IN & HOÀN TẤT (Status Transitions)
// =====================================================================

/**
 * @swagger
 * /api/appointment-confirmations/{id}/check-in:
 *   patch:
 *     summary: Check-in lịch khám (CONFIRMED → CHECKED_IN)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_CONFIRM.
 *       **Vai trò được phép:** ADMIN, STAFF, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Bệnh nhân đến phòng khám → lễ tân/y tá check-in.
 *       - Chuyển trạng thái `CONFIRMED → CHECKED_IN`, ghi `checked_in_at`.
 *       - Ghi audit log, gửi thông báo check-in tới bệnh nhân.
 *       - **Toàn bộ logic chạy trong Transaction.**
 *       - Chỉ lịch ở trạng thái CONFIRMED mới được check-in.
 *     tags: [3.6 Xác nhận & Nhắc lịch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch khám
 *         example: "APT_abc123def45"
 *     responses:
 *       200:
 *         description: Check-in thành công
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
 *                   example: "Check-in lịch khám thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "CHECKED_IN"
 *                     checked_in_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Lịch khám không ở trạng thái CONFIRMED
 *       404:
 *         description: Lịch khám không tồn tại
 */
appointmentConfirmationRoutes.patch(
    '/:id/check-in',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('APPOINTMENT_CONFIRM')],
    AppointmentConfirmationController.checkIn
);


// =====================================================================
// 3.6.3. NHẮC LỊCH KHÁM (Appointment Reminder)
// =============================================================================

/**
 * @swagger
 * /api/appointment-confirmations/{id}/send-reminder:
 *   post:
 *     summary: Gửi nhắc lịch thủ công cho 1 lịch khám
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_REMINDER_SEND.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Nhân viên nhấn nút gửi nhắc lịch cho 1 bệnh nhân cụ thể.
 *       - Gửi thông báo nhắc lịch (In-App / Email / Push) tới bệnh nhân.
 *       - Ghi bản ghi vào bảng `appointment_reminders` để tracking.
 *       - Chỉ nhắc được cho lịch ở trạng thái PENDING hoặc CONFIRMED.
 *     tags: [3.6 Xác nhận & Nhắc lịch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch khám
 *         example: "APT_abc123def45"
 *     responses:
 *       200:
 *         description: Gửi nhắc lịch thành công
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
 *                   example: "Gửi nhắc lịch thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reminder_id:
 *                       type: string
 *                     reminder_type:
 *                       type: string
 *                       example: "MANUAL"
 *                     trigger_source:
 *                       type: string
 *                       example: "STAFF_MANUAL"
 *                     sent_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Lịch khám không ở trạng thái cho phép nhắc
 *       404:
 *         description: Lịch khám không tồn tại
 */
appointmentConfirmationRoutes.post(
    '/:id/send-reminder',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('APPOINTMENT_REMINDER_SEND')],
    AppointmentConfirmationController.sendReminder
);

/**
 * @swagger
 * /api/appointment-confirmations/batch-send-reminder:
 *   post:
 *     summary: Gửi nhắc lịch thủ công hàng loạt
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_REMINDER_SEND.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Gửi nhắc lịch cho nhiều lịch khám cùng lúc.
 *       - Xử lý từng lịch độc lập: lịch nào lỗi thì bỏ qua.
 *       - Trả về `succeeded[]` + `failed[]` với chi tiết.
 *     tags: [3.6 Xác nhận & Nhắc lịch]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - appointment_ids
 *             properties:
 *               appointment_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["APT_abc123def45", "APT_xyz789ghi01"]
 *     responses:
 *       200:
 *         description: Gửi nhắc lịch hàng loạt hoàn tất
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
 *                     succeeded:
 *                       type: array
 *                       items:
 *                         type: string
 *                     failed:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Thiếu appointment_ids
 */
appointmentConfirmationRoutes.post(
    '/batch-send-reminder',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('APPOINTMENT_REMINDER_SEND')],
    AppointmentConfirmationController.batchSendReminder
);

/**
 * @swagger
 * /api/appointment-confirmations/{id}/reminders:
 *   get:
 *     summary: Lấy lịch sử nhắc lịch của 1 lịch khám
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về danh sách tất cả lần nhắc lịch (tự động + thủ công) cho 1 appointment.
 *       - Bao gồm: loại nhắc, kênh, thời gian gửi, người gửi.
 *     tags: [3.6 Xác nhận & Nhắc lịch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch khám
 *         example: "APT_abc123def45"
 *     responses:
 *       200:
 *         description: Lấy lịch sử nhắc lịch thành công
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
 *                       reminder_id:
 *                         type: string
 *                       reminder_type:
 *                         type: string
 *                         enum: [AUTO, MANUAL]
 *                       channel:
 *                         type: string
 *                         enum: [INAPP, EMAIL, PUSH]
 *                       sent_at:
 *                         type: string
 *                         format: date-time
 *                       sent_by_name:
 *                         type: string
 *                         nullable: true
 *                       trigger_source:
 *                         type: string
 *                         enum: [CRON_JOB, STAFF_MANUAL]
 *       404:
 *         description: Lịch khám không tồn tại
 */
appointmentConfirmationRoutes.get(
    '/:id/reminders',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('APPOINTMENT_VIEW')],
    AppointmentConfirmationController.getReminderHistory
);

// =====================================================================
// 3.6.4. CẤU HÌNH NHẮC LỊCH (Reminder Settings)
// =====================================================================

/**
 * @swagger
 * /api/appointment-confirmations/reminder-settings:
 *   get:
 *     summary: Lấy cấu hình nhắc lịch hiện tại
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về 3 cấu hình:
 *         1. `reminder_before_hours`: Danh sách mốc nhắc trước giờ khám (VD: [24, 2])
 *         2. `auto_reminder_enabled`: Bật/tắt cron nhắc tự động
 *         3. `cron_interval`: Biểu thức cron cho job nhắc tự động
 *     tags: [3.6 Xác nhận & Nhắc lịch]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy cấu hình thành công
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
 *                     reminder_before_hours:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: [24, 2]
 *                     auto_reminder_enabled:
 *                       type: boolean
 *                       example: true
 *                     cron_interval:
 *                       type: string
 *                       example: "every 15 minutes"
 */
appointmentConfirmationRoutes.get(
    '/reminder-settings',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('APPOINTMENT_VIEW')],
    AppointmentConfirmationController.getReminderSettings
);

/**
 * @swagger
 * /api/appointment-confirmations/reminder-settings:
 *   put:
 *     summary: Cập nhật cấu hình nhắc lịch
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_REMINDER_CONFIG.
 *       **Vai trò được phép:** ADMIN.
 *
 *       **Mô tả chi tiết:**
 *       - Cập nhật cấu hình nhắc lịch (partial update — chỉ gửi field cần đổi).
 *       - `reminder_before_hours`: Mảng số nguyên (1-168), tối đa 5 mốc.
 *       - `auto_reminder_enabled`: true/false.
 *       - `cron_interval`: Biểu thức cron hợp lệ.
 *     tags: [3.6 Xác nhận & Nhắc lịch]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reminder_before_hours:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: "Danh sách mốc nhắc trước giờ khám (giờ). Tối đa 5 mốc, mỗi mốc 1-168h."
 *                 example: [24, 4, 1]
 *               auto_reminder_enabled:
 *                 type: boolean
 *                 description: "Bật/tắt cron nhắc lịch tự động"
 *                 example: true
 *               cron_interval:
 *                 type: string
 *                 description: "Biểu thức cron cho job nhắc tự động"
 *                 example: "every 15 minutes"
 *     responses:
 *       200:
 *         description: Cập nhật cấu hình thành công
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
 *                   example: "Cập nhật cấu hình nhắc lịch thành công"
 *                 data:
 *                   type: object
 *       400:
 *         description: Giá trị cấu hình không hợp lệ
 */
appointmentConfirmationRoutes.put(
    '/reminder-settings',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('APPOINTMENT_REMINDER_CONFIG')],
    AppointmentConfirmationController.updateReminderSettings
);
