import { Router } from 'express';
import { AppointmentStatusController } from '../../controllers/Appointment Management/appointment-status.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

export const appointmentStatusRoutes = Router();

// =====================================================================
// 3.7 CHECK-IN & TRẠNG THÁI LỊCH KHÁM

// ─── Static routes (không có :id) PHẢI đặt TRƯỚC dynamic routes ───

/**
 * @swagger
 * /api/appointment-status/dashboard/today:
 *   get:
 *     summary: Dashboard trạng thái lịch khám hôm nay
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_QUEUE_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về tổng quan trạng thái lịch khám trong ngày hôm nay.
 *       - Bao gồm: số lượng theo từng trạng thái (PENDING, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW).
 *       - Thông tin hàng đợi: STT đang phục vụ, STT tiếp theo, tổng số đang chờ.
 *       - Có thể lọc theo chi nhánh (branch_id).
 *     tags: [3.7 Check-in & Trạng thái]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Lọc theo chi nhánh (optional)
 *         example: BR_HCM_001
 *     responses:
 *       200:
 *         description: Lấy dashboard thành công
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
 *                     date:
 *                       type: string
 *                       example: "2026-03-13"
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           example: 45
 *                         pending:
 *                           type: number
 *                           example: 5
 *                         confirmed:
 *                           type: number
 *                           example: 12
 *                         checked_in:
 *                           type: number
 *                           example: 8
 *                         in_progress:
 *                           type: number
 *                           example: 3
 *                         completed:
 *                           type: number
 *                           example: 15
 *                     queue:
 *                       type: object
 *                       properties:
 *                         current_serving:
 *                           type: number
 *                           example: 23
 *                         next_in_line:
 *                           type: number
 *                           example: 24
 *                         total_waiting:
 *                           type: number
 *                           example: 8
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 */
appointmentStatusRoutes.get(
    '/dashboard/today',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_QUEUE_VIEW'),
    AppointmentStatusController.getDashboard
);

/**
 * @swagger
 * /api/appointment-status/dashboard/{date}:
 *   get:
 *     summary: Dashboard trạng thái lịch khám theo ngày bất kỳ
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_QUEUE_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Giống API `/dashboard/today` nhưng cho phép chọn ngày bất kỳ.
 *       - Hữu ích để xem lại thống kê ngày trước hoặc xem trước ngày mai.
 *       - Format ngày: `YYYY-MM-DD` (ví dụ: 2026-03-20).
 *     tags: [3.7 Check-in & Trạng thái]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày cần xem dashboard (YYYY-MM-DD)
 *         example: "2026-03-20"
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Lọc theo chi nhánh (optional)
 *         example: BR_HCM_001
 *     responses:
 *       200:
 *         description: Lấy dashboard thành công
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
 *                     date:
 *                       type: string
 *                       example: "2026-03-20"
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           example: 45
 *                         pending:
 *                           type: number
 *                           example: 5
 *                         confirmed:
 *                           type: number
 *                           example: 12
 *                         checked_in:
 *                           type: number
 *                           example: 8
 *                         in_progress:
 *                           type: number
 *                           example: 3
 *                         completed:
 *                           type: number
 *                           example: 15
 *                         cancelled:
 *                           type: number
 *                           example: 1
 *                         no_show:
 *                           type: number
 *                           example: 1
 *                     queue:
 *                       type: object
 *                       properties:
 *                         current_serving:
 *                           type: number
 *                           example: 23
 *                         next_in_line:
 *                           type: number
 *                           example: 24
 *                         total_waiting:
 *                           type: number
 *                           example: 8
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 */
appointmentStatusRoutes.get(
    '/dashboard/:date',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_QUEUE_VIEW'),
    AppointmentStatusController.getDashboardByDate
);

/**
 * @swagger
 * /api/appointment-status/queue/today:
 *   get:
 *     summary: Danh sách hàng đợi hôm nay
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_QUEUE_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về danh sách lịch khám đã check-in hoặc đang khám (CHECKED_IN, IN_PROGRESS) hôm nay.
 *       - Sắp xếp theo số thứ tự (queue_number) tăng dần.
 *       - Bao gồm: tên bệnh nhân, bác sĩ, phòng, khung giờ, trạng thái trễ.
 *       - Có thể lọc theo chi nhánh, phòng khám, hoặc trạng thái cụ thể.
 *     tags: [3.7 Check-in & Trạng thái]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Lọc theo chi nhánh
 *         example: BR_HCM_001
 *       - in: query
 *         name: room_id
 *         schema:
 *           type: string
 *         description: Lọc theo phòng khám
 *         example: RM_HCM_N102
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [CHECKED_IN, IN_PROGRESS]
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Lấy hàng đợi thành công
 *       401:
 *         description: Chưa đăng nhập
 */
appointmentStatusRoutes.get(
    '/queue/today',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_QUEUE_VIEW'),
    AppointmentStatusController.getQueue
);

/**
 * @swagger
 * /api/appointment-status/room-status:
 *   get:
 *     summary: Trạng thái phòng khám (AVAILABLE / OCCUPIED)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_QUEUE_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về danh sách tất cả phòng khám đang hoạt động.
 *       - Bao gồm trạng thái phòng: AVAILABLE (trống), OCCUPIED (đang khám), MAINTENANCE (bảo trì).
 *       - Nếu phòng đang OCCUPIED: hiển thị thông tin lịch khám + bệnh nhân + bác sĩ đang làm việc.
 *     tags: [3.7 Check-in & Trạng thái]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Lọc theo chi nhánh
 *         example: BR_HCM_001
 *     responses:
 *       200:
 *         description: Lấy trạng thái phòng thành công
 *       401:
 *         description: Chưa đăng nhập
 */
appointmentStatusRoutes.get(
    '/room-status',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_QUEUE_VIEW'),
    AppointmentStatusController.getRoomStatus
);

/**
 * @swagger
 * /api/appointment-status/settings:
 *   get:
 *     summary: Lấy cấu hình check-in & No-Show
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_STATUS_CONFIG.
 *       **Vai trò được phép:** ADMIN.
 *
 *       **Mô tả chi tiết:**
 *       - Lấy cấu hình hệ thống cho chức năng check-in và phát hiện No-Show.
 *       - Bao gồm: no_show_buffer_minutes, auto_no_show_enabled, allow_qr_checkin, late_threshold_minutes.
 *     tags: [3.7 Check-in & Trạng thái]
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
 *                     no_show_buffer_minutes:
 *                       type: number
 *                       example: 30
 *                     auto_no_show_enabled:
 *                       type: boolean
 *                       example: true
 *                     allow_qr_checkin:
 *                       type: boolean
 *                       example: true
 *                     late_threshold_minutes:
 *                       type: number
 *                       example: 0
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 */
appointmentStatusRoutes.get(
    '/settings',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_STATUS_CONFIG'),
    AppointmentStatusController.getSettings
);

/**
 * @swagger
 * /api/appointment-status/settings:
 *   put:
 *     summary: Cập nhật cấu hình check-in & No-Show
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_STATUS_CONFIG.
 *       **Vai trò được phép:** ADMIN.
 *
 *       **Mô tả chi tiết:**
 *       - Cập nhật cấu hình hệ thống cho check-in và No-Show.
 *       - Có thể cập nhật từng trường riêng lẻ, không cần truyền tất cả.
 *       - `no_show_buffer_minutes`: số phút chờ sau slot_end_time trước khi tự động No-Show (5–120).
 *       - `late_threshold_minutes`: ngưỡng phút trước khi tính là trễ (0–60, 0 = trễ ngay).
 *     tags: [3.7 Check-in & Trạng thái]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               no_show_buffer_minutes:
 *                 type: number
 *                 example: 30
 *               auto_no_show_enabled:
 *                 type: boolean
 *                 example: true
 *               allow_qr_checkin:
 *                 type: boolean
 *                 example: true
 *               late_threshold_minutes:
 *                 type: number
 *                 example: 0
 *     responses:
 *       200:
 *         description: Cập nhật cấu hình thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 */
appointmentStatusRoutes.put(
    '/settings',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_STATUS_CONFIG'),
    AppointmentStatusController.updateSettings
);

/**
 * @swagger
 * /api/appointment-status/check-in-qr:
 *   post:
 *     summary: Check-in bằng QR Code
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_CHECKIN.
 *       **Vai trò được phép:** ADMIN, STAFF, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Bệnh nhân quét mã QR tại quầy kiosk / máy quét để check-in.
 *       - Hệ thống tìm lịch khám theo `qr_token`, kiểm tra hạn sử dụng và trạng thái.
 *       - Tự động cấp số thứ tự (queue_number), tính toán đến muộn (is_late, late_minutes).
 *       - Sau check-in thành công: xoá QR token, gửi email/notification.
 *       - **QR chỉ dùng 1 lần** — sau check-in sẽ bị vô hiệu hoá.
 *     tags: [3.7 Check-in & Trạng thái]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qr_token
 *             properties:
 *               qr_token:
 *                 type: string
 *                 example: "QR_a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *     responses:
 *       200:
 *         description: Check-in QR thành công
 *       400:
 *         description: QR không hợp lệ / đã hết hạn / chức năng QR đang tắt
 *       404:
 *         description: Không tìm thấy lịch khám với mã QR này
 */
appointmentStatusRoutes.post(
    '/check-in-qr',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_CHECKIN'),
    AppointmentStatusController.checkInQr
);

// ─── Dynamic routes (có :id) đặt SAU ───

/**
 * @swagger
 * /api/appointment-status/generate-qr/{id}:
 *   post:
 *     summary: Sinh mã QR check-in cho lịch khám
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_CHECKIN.
 *       **Vai trò được phép:** ADMIN, STAFF, PATIENT, CUSTOMER.
 *
 *       **Mô tả chi tiết:**
 *       - Tạo mã QR token duy nhất cho một lịch khám đã xác nhận (CONFIRMED).
 *       - Mỗi lịch khám chỉ tạo được 1 mã QR (nếu đã có → báo lỗi).
 *       - Mã QR hết hạn vào cuối ngày khám (23:59:59).
 *       - Frontend nhận `qr_token` và render thành QR image để bệnh nhân quét.
 *     tags: [3.7 Check-in & Trạng thái]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch khám (appointments_id)
 *         example: APT_bcd7f423-337
 *     responses:
 *       200:
 *         description: Tạo QR thành công
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
 *                     qr_token:
 *                       type: string
 *                       example: "QR_a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                     expires_at:
 *                       type: string
 *                       example: "2026-03-13T23:59:59+07:00"
 *       400:
 *         description: Lịch khám không ở trạng thái CONFIRMED / QR đã tạo / QR đang tắt
 *       404:
 *         description: Lịch khám không tồn tại
 */
appointmentStatusRoutes.post(
    '/generate-qr/:id',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_CHECKIN'),
    AppointmentStatusController.generateQr
);

/**
 * @swagger
 * /api/appointment-status/{id}/check-in:
 *   post:
 *     summary: Check-in bệnh nhân tại quầy lễ tân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_CHECKIN.
 *       **Vai trò được phép:** ADMIN, STAFF, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Check-in lịch khám tại quầy lễ tân: chuyển trạng thái CONFIRMED → CHECKED_IN.
 *       - Điều kiện: lịch khám phải ở trạng thái CONFIRMED và appointment_date = hôm nay.
 *       - Hệ thống tự động:
 *         - Cấp **số thứ tự** (queue_number) — tăng dần trong ngày.
 *         - Tính **đến muộn** (is_late, late_minutes) dựa trên slot_start_time.
 *         - Ghi `check_in_method = COUNTER`.
 *       - Ghi audit log + gửi email/notification cho bệnh nhân.
 *       - **Transaction**: đảm bảo tính toàn vẹn dữ liệu.
 *     tags: [3.7 Check-in & Trạng thái]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch khám (appointments_id)
 *         example: APT_bcd7f423-337
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
 *                   example: Check-in thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     queue_number:
 *                       type: number
 *                       example: 12
 *                     is_late:
 *                       type: boolean
 *                       example: false
 *                     late_minutes:
 *                       type: number
 *                       example: 0
 *       400:
 *         description: Lịch khám không ở CONFIRMED / không phải ngày hôm nay
 *       404:
 *         description: Lịch khám không tồn tại
 */
appointmentStatusRoutes.post(
    '/:id/check-in',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_CHECKIN'),
    AppointmentStatusController.checkIn
);

/**
 * @swagger
 * /api/appointment-status/{id}/check-in-test:
 *   post:
 *     summary: "[DEV] Check-in TEST — bỏ qua kiểm tra ngày"
 *     description: |
 *       **⚠️ CHỈ DÙNG ĐỂ TEST** — KHÔNG dùng trong production.
 *
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_CHECKIN.
 *
 *       **Mô tả chi tiết:**
 *       - Giống API check-in thật nhưng BỎ QUA kiểm tra appointment_date = TODAY.
 *       - Cho phép check-in lịch khám ở ngày bất kỳ (quá khứ hoặc tương lai).
 *       - Trạng thái phải là CONFIRMED.
 *       - Vẫn gán queue_number, ghi audit log.
 *     tags: [3.7 Check-in & Trạng thái]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch khám
 *         example: APT_fd5ed9f9-9d2
 *     responses:
 *       200:
 *         description: Check-in test thành công
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
 *                   example: "[TEST] Check-in thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     queue_number:
 *                       type: number
 *                       example: 5
 *       400:
 *         description: Lịch khám không ở trạng thái CONFIRMED
 *       404:
 *         description: Lịch khám không tồn tại
 */
appointmentStatusRoutes.post(
    '/:id/check-in-test',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_CHECKIN'),
    AppointmentStatusController.checkInTest
);

/**
 * @swagger
 * /api/appointment-status/{id}/start-exam:
 *   patch:
 *     summary: Bắt đầu khám bệnh (CHECKED_IN → IN_PROGRESS)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_STATUS_MANAGE.
 *       **Vai trò được phép:** ADMIN, DOCTOR.
 *
 *       **Mô tả chi tiết:**
 *       - Bác sĩ gọi bệnh nhân vào phòng, chuyển trạng thái CHECKED_IN → IN_PROGRESS.
 *       - Điều kiện: lịch khám phải có `room_id`, phòng phải đang AVAILABLE.
 *       - Hệ thống tự động:
 *         - Ghi `started_at` = thời điểm hiện tại.
 *         - Cập nhật phòng khám: `room_status = OCCUPIED`, `current_appointment_id`, `current_patient_id`.
 *       - **Transaction**: đảm bảo đồng bộ appointment + room.
 *     tags: [3.7 Check-in & Trạng thái]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch khám
 *         example: APT_bcd7f423-337
 *     responses:
 *       200:
 *         description: Bắt đầu khám thành công
 *       400:
 *         description: Không ở trạng thái CHECKED_IN / chưa gán phòng / phòng đang bận
 *       404:
 *         description: Lịch khám không tồn tại
 */
appointmentStatusRoutes.patch(
    '/:id/start-exam',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_STATUS_MANAGE'),
    AppointmentStatusController.startExam
);

/**
 * @swagger
 * /api/appointment-status/{id}/complete-exam:
 *   patch:
 *     summary: Hoàn tất khám bệnh (IN_PROGRESS → COMPLETED)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_STATUS_MANAGE.
 *       **Vai trò được phép:** ADMIN, DOCTOR.
 *
 *       **Mô tả chi tiết:**
 *       - Bác sĩ kết thúc khám, chuyển trạng thái IN_PROGRESS → COMPLETED.
 *       - Hệ thống tự động:
 *         - Ghi `completed_at` = thời điểm hiện tại.
 *         - Giải phóng phòng khám: `room_status = AVAILABLE`, xóa current_appointment/patient.
 *       - Gửi email/notification hoàn tất cho bệnh nhân.
 *       - **Transaction**: đảm bảo đồng bộ appointment + room.
 *     tags: [3.7 Check-in & Trạng thái]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch khám
 *         example: APT_bcd7f423-337
 *     responses:
 *       200:
 *         description: Hoàn tất khám thành công
 *       400:
 *         description: Không ở trạng thái IN_PROGRESS
 *       404:
 *         description: Lịch khám không tồn tại
 */
appointmentStatusRoutes.patch(
    '/:id/complete-exam',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_STATUS_MANAGE'),
    AppointmentStatusController.completeExam
);

/**
 * @swagger
 * /api/appointment-status/{id}/no-show:
 *   patch:
 *     summary: Đánh dấu No-Show (không đến khám)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_STATUS_MANAGE.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Staff đánh dấu thủ công bệnh nhân không đến khám.
 *       - Điều kiện: lịch khám phải ở PENDING hoặc CONFIRMED (chưa check-in).
 *       - Có thể kèm ghi chú (note) giải thích lý do.
 *       - Ghi audit log + gửi email/notification cho bệnh nhân.
 *       - Ngoài ra, Cron Job cũng tự động phát hiện No-Show mỗi 30 phút (nếu bật).
 *     tags: [3.7 Check-in & Trạng thái]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch khám
 *         example: APT_bcd7f423-337
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 example: "Bệnh nhân không đến, đã gọi điện 3 lần không nghe máy"
 *     responses:
 *       200:
 *         description: Đánh dấu No-Show thành công
 *       400:
 *         description: Không ở trạng thái cho phép (chỉ PENDING/CONFIRMED)
 *       404:
 *         description: Lịch khám không tồn tại
 */
appointmentStatusRoutes.patch(
    '/:id/no-show',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_STATUS_MANAGE'),
    AppointmentStatusController.markNoShow
);

// ─── SKIP & RECALL ───

/**
 * @swagger
 * /api/appointment-status/{id}/skip:
 *   patch:
 *     summary: Bỏ qua BN trong hàng đợi (CHECKED_IN → SKIPPED)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_STATUS_MANAGE.
 *       **Vai trò được phép:** ADMIN, STAFF, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Staff gọi tên BN không thấy → bỏ qua, gọi số tiếp theo.
 *       - Chuyển trạng thái: CHECKED_IN → SKIPPED.
 *       - Queue tự động nhảy sang BN tiếp theo (theo priority + queue_number).
 *       - BN bị skip có thể được gọi lại bằng API recall.
 *       - Ghi audit log.
 *     tags: [3.7 Check-in & Trạng thái]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch khám
 *         example: APT_fd5ed9f9-9d2
 *     responses:
 *       200:
 *         description: Bỏ qua BN thành công
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
 *                   example: "Bỏ qua bệnh nhân trong hàng đợi thành công"
 *       400:
 *         description: BN không ở trạng thái CHECKED_IN
 *       404:
 *         description: Lịch khám không tồn tại
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 */
appointmentStatusRoutes.patch(
    '/:id/skip',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_STATUS_MANAGE'),
    AppointmentStatusController.skipPatient
);

/**
 * @swagger
 * /api/appointment-status/{id}/recall:
 *   patch:
 *     summary: Gọi lại BN đã bị skip (SKIPPED → CHECKED_IN)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_STATUS_MANAGE.
 *       **Vai trò được phép:** ADMIN, STAFF, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Gọi lại BN đã bị bỏ qua trước đó.
 *       - Chuyển trạng thái: SKIPPED → CHECKED_IN.
 *       - Gán queue_number MỚI ở cuối hàng đợi (không giữ số cũ).
 *       - Ghi audit log.
 *     tags: [3.7 Check-in & Trạng thái]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch khám
 *         example: APT_fd5ed9f9-9d2
 *     responses:
 *       200:
 *         description: Gọi lại BN thành công
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
 *                   example: "Gọi lại bệnh nhân thành công, đã xếp vào cuối hàng"
 *       400:
 *         description: BN không ở trạng thái SKIPPED
 *       404:
 *         description: Lịch khám không tồn tại
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 */
appointmentStatusRoutes.patch(
    '/:id/recall',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_STATUS_MANAGE'),
    AppointmentStatusController.recallPatient
);
