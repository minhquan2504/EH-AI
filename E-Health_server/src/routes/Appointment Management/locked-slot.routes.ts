import { Router } from 'express';
import { LockedSlotController } from '../../controllers/Appointment Management/locked-slot.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

export const lockedSlotRoutes = Router();

// =====================================================================
// 3.2.5. KHOÁ KHUNG GIỜ KHÔNG KHẢ DỤNG (Locked Slots)
// =====================================================================

/**
 * @swagger
 * /api/locked-slots/lock:
 *   post:
 *     summary: Khoá 1 hoặc nhiều slot theo ngày cụ thể
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_EDIT.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Khoá slot khám bệnh vào 1 ngày cụ thể (VD: BS nghỉ đột xuất ngày 20/3).
 *       - Slot bị khoá sẽ KHÔNG hiển thị trong API lấy slot trống (`GET /api/appointments/available-slots`).
 *       - Hỗ trợ khoá nhiều slot cùng lúc.
 *       - **Cảnh báo** (không block): nếu ngày đó đã có lịch khám PENDING/CONFIRMED → trả warning kèm số lịch bị ảnh hưởng.
 *       - Ghi `locked_by` = user_id từ JWT.
 *       - Nếu slot đã bị khoá ngày đó → bỏ qua (không lỗi).
 *     tags: [3.2 Quản lý khung giờ & ca khám]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slot_ids
 *               - locked_date
 *             properties:
 *               slot_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Danh sách slot_id cần khoá
 *                 example: ["SLT_2603_abc12345", "SLT_2603_def67890"]
 *               locked_date:
 *                 type: string
 *                 format: date
 *                 description: Ngày cần khoá (YYYY-MM-DD), phải >= hôm nay
 *                 example: "2026-03-20"
 *               lock_reason:
 *                 type: string
 *                 description: Lý do khoá
 *                 example: "BS Nguyễn Văn A nghỉ đột xuất"
 *     responses:
 *       201:
 *         description: Khoá slot thành công
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
 *                   example: "Khoá slot thành công."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 warning:
 *                   type: string
 *                   nullable: true
 *                   example: "Có 2 lịch khám (PENDING/CONFIRMED) bị ảnh hưởng bởi việc khoá slot."
 *                 affected_appointments:
 *                   type: integer
 *                   example: 2
 *       400:
 *         description: Thiếu dữ liệu hoặc ngày trong quá khứ
 *       404:
 *         description: Slot không tồn tại hoặc đã bị vô hiệu hoá
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
lockedSlotRoutes.post(
    '/lock',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('APPOINTMENT_EDIT')],
    LockedSlotController.lockSlots
);

/**
 * @swagger
 * /api/locked-slots/locked:
 *   get:
 *     summary: Xem danh sách slot đã khoá
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về danh sách slot bị khoá theo ngày, kèm thông tin ca và người khoá.
 *       - Hỗ trợ filter theo `date` (bắt buộc), `shift_id`, `slot_id`.
 *     tags: [3.2 Quản lý khung giờ & ca khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày cần kiểm tra (YYYY-MM-DD)
 *         example: "2026-03-20"
 *       - in: query
 *         name: shift_id
 *         schema:
 *           type: string
 *         description: Lọc theo ca làm việc
 *         example: "SHIFT_MORNING"
 *       - in: query
 *         name: slot_id
 *         schema:
 *           type: string
 *         description: Lọc theo slot cụ thể
 *     responses:
 *       200:
 *         description: Lấy danh sách slot đã khoá thành công
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
 *                       locked_slot_id:
 *                         type: string
 *                       slot_id:
 *                         type: string
 *                       locked_date:
 *                         type: string
 *                       lock_reason:
 *                         type: string
 *                       start_time:
 *                         type: string
 *                       end_time:
 *                         type: string
 *                       shift_name:
 *                         type: string
 *                       locked_by_name:
 *                         type: string
 *       400:
 *         description: Thiếu tham số date
 *       401:
 *         description: Chưa đăng nhập
 */
lockedSlotRoutes.get(
    '/locked',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('APPOINTMENT_VIEW')],
    LockedSlotController.getLockedSlots
);

/**
 * @swagger
 * /api/locked-slots/lock/{lockedSlotId}:
 *   delete:
 *     summary: Mở khoá 1 slot
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_EDIT.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Soft delete bản ghi khoá slot (set `deleted_at`).
 *       - Slot sẽ trở lại khả dụng cho ngày đó.
 *     tags: [3.2 Quản lý khung giờ & ca khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lockedSlotId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bản ghi khoá slot
 *         example: "LKSL_abc12345"
 *     responses:
 *       200:
 *         description: Mở khoá slot thành công
 *       404:
 *         description: Bản ghi khoá không tồn tại hoặc đã được mở khoá
 */
lockedSlotRoutes.delete(
    '/lock/:lockedSlotId',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('APPOINTMENT_EDIT')],
    LockedSlotController.unlockSlot
);

/**
 * @swagger
 * /api/locked-slots/lock-by-shift:
 *   post:
 *     summary: Khoá tất cả slot trong 1 ca theo ngày
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_EDIT.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Tìm tất cả `appointment_slots` active thuộc `shift_id` → bulk insert vào `locked_slots`.
 *       - Slot đã bị khoá ngày đó → bỏ qua (không lỗi).
 *       - Trả về danh sách đã khoá + số lịch khám bị ảnh hưởng.
 *     tags: [3.2 Quản lý khung giờ & ca khám]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shift_id
 *               - locked_date
 *             properties:
 *               shift_id:
 *                 type: string
 *                 description: ID ca làm việc
 *                 example: "SHIFT_MORNING"
 *               locked_date:
 *                 type: string
 *                 format: date
 *                 description: Ngày cần khoá
 *                 example: "2026-03-20"
 *               lock_reason:
 *                 type: string
 *                 description: Lý do khoá
 *                 example: "Nghỉ lễ đặc biệt — chỉ ca sáng"
 *     responses:
 *       201:
 *         description: Khoá tất cả slot trong ca thành công
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
 *                 total_slots_in_shift:
 *                   type: integer
 *                   example: 8
 *                 affected_appointments:
 *                   type: integer
 *                   example: 3
 *       400:
 *         description: Thiếu dữ liệu hoặc không có slot nào active
 *       404:
 *         description: Ca làm việc không tồn tại
 */
lockedSlotRoutes.post(
    '/lock-by-shift',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('APPOINTMENT_EDIT')],
    LockedSlotController.lockByShift
);

/**
 * @swagger
 * /api/locked-slots/unlock-by-shift:
 *   delete:
 *     summary: Mở khoá tất cả slot trong 1 ca theo ngày
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_EDIT.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Tìm tất cả `locked_slots` thuộc slot của `shift_id` vào `locked_date` → soft delete batch.
 *       - Nếu không có slot nào bị khoá trong ca đó → trả lỗi 404.
 *       - Trả về số lượng slot đã mở khoá.
 *     tags: [3.2 Quản lý khung giờ & ca khám]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shift_id
 *               - locked_date
 *             properties:
 *               shift_id:
 *                 type: string
 *                 description: ID ca làm việc
 *                 example: "SHIFT_MORNING"
 *               locked_date:
 *                 type: string
 *                 format: date
 *                 description: Ngày cần mở khoá
 *                 example: "2026-03-20"
 *     responses:
 *       200:
 *         description: Mở khoá tất cả slot trong ca thành công
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
 *                   example: "Mở khoá tất cả slot trong ca thành công."
 *                 unlocked_count:
 *                   type: integer
 *                   example: 8
 *       400:
 *         description: Thiếu dữ liệu bắt buộc
 *       404:
 *         description: Ca không tồn tại hoặc không có slot bị khoá
 */
lockedSlotRoutes.delete(
    '/unlock-by-shift',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('APPOINTMENT_EDIT')],
    LockedSlotController.unlockByShift
);
