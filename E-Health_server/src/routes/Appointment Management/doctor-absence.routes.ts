import { Router } from 'express';
import { DoctorAbsenceController } from '../../controllers/Appointment Management/doctor-absence.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

export const doctorAbsenceRoutes = Router();

// 3.3 QUẢN LÝ VẮNG ĐỘT XUẤT BÁC SĨ (Doctor Absence)

/**
 * @swagger
 * /api/doctor-absences/affected-appointments:
 *   get:
 *     summary: Xem danh sách lịch khám bị ảnh hưởng bởi vắng đột xuất
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Đếm + liệt kê appointments PENDING/CONFIRMED trên ngày + ca + bác sĩ.
 *       - Dùng để preview trước khi tạo lịch vắng, hoặc sau khi tạo.
 *     tags: [3.3 Quản lý lịch bác sĩ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: doctor_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bác sĩ (doctors_id)
 *         example: "DOC_abc12345"
 *       - in: query
 *         name: absence_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày vắng (YYYY-MM-DD)
 *         example: "2026-03-20"
 *       - in: query
 *         name: shift_id
 *         schema:
 *           type: string
 *         description: Chỉ kiểm tra 1 ca (tùy chọn)
 *         example: "SHIFT_MORNING"
 *     responses:
 *       200:
 *         description: Lấy danh sách lịch khám bị ảnh hưởng thành công
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
 *                     count:
 *                       type: integer
 *                       example: 3
 *                     appointments:
 *                       type: array
 *                       items:
 *                         type: object
 *       404:
 *         description: Bác sĩ không tồn tại
 */
doctorAbsenceRoutes.get(
    '/affected-appointments',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('APPOINTMENT_VIEW')],
    DoctorAbsenceController.getAffectedAppointments
);

/**
 * @swagger
 * /api/doctor-absences:
 *   post:
 *     summary: Tạo lịch vắng đột xuất cho bác sĩ
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_EDIT.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Tạo nhanh bản ghi vắng đột xuất (không cần quy trình duyệt Leave).
 *       - Tự động đánh dấu `staff_schedules.is_leave = true` cho BS vào ngày/ca.
 *       - Nếu `shift_id` = null → vắng cả ngày (tất cả các ca).
 *       - Trả về warning nếu có lịch khám bị ảnh hưởng.
 *       - `absence_type` hợp lệ: EMERGENCY, SICK, PERSONAL.
 *     tags: [3.3 Quản lý lịch bác sĩ]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctor_id
 *               - absence_date
 *               - absence_type
 *             properties:
 *               doctor_id:
 *                 type: string
 *                 description: ID bác sĩ
 *                 example: "DOC_abc12345"
 *               absence_date:
 *                 type: string
 *                 format: date
 *                 description: Ngày vắng (YYYY-MM-DD)
 *                 example: "2026-03-20"
 *               shift_id:
 *                 type: string
 *                 nullable: true
 *                 description: Ca vắng (null = cả ngày)
 *                 example: "SHIFT_MORNING"
 *               absence_type:
 *                 type: string
 *                 enum: [EMERGENCY, SICK, PERSONAL]
 *                 description: Loại vắng
 *                 example: "EMERGENCY"
 *               reason:
 *                 type: string
 *                 description: Lý do vắng
 *                 example: "BS Nguyễn Văn A bị sốt đột xuất"
 *     responses:
 *       201:
 *         description: Tạo lịch vắng thành công
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
 *                   example: "Tạo lịch vắng đột xuất thành công."
 *                 data:
 *                   type: object
 *                 schedules_marked:
 *                   type: integer
 *                   example: 2
 *                 warning:
 *                   type: string
 *                   nullable: true
 *                   example: "Có 3 lịch khám (PENDING/CONFIRMED) bị ảnh hưởng bởi việc vắng."
 *                 affected_appointments:
 *                   type: integer
 *                   example: 3
 *       400:
 *         description: Thiếu dữ liệu hoặc ngày quá khứ
 *       404:
 *         description: BS hoặc ca không tồn tại
 */
doctorAbsenceRoutes.post(
    '/',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('APPOINTMENT_EDIT')],
    DoctorAbsenceController.createAbsence
);

/**
 * @swagger
 * /api/doctor-absences:
 *   get:
 *     summary: Danh sách vắng đột xuất
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Hỗ trợ filter theo doctor_id, khoảng ngày, loại vắng.
 *       - JOIN thông tin BS, chuyên khoa, ca, người tạo.
 *     tags: [3.3 Quản lý lịch bác sĩ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: doctor_id
 *         schema:
 *           type: string
 *         description: Lọc theo bác sĩ
 *         example: "DOC_abc12345"
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu
 *         example: "2026-03-01"
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc
 *         example: "2026-03-31"
 *       - in: query
 *         name: absence_type
 *         schema:
 *           type: string
 *           enum: [EMERGENCY, SICK, PERSONAL]
 *         description: Lọc theo loại vắng
 *     responses:
 *       200:
 *         description: Lấy danh sách vắng thành công
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
 *                       absence_id:
 *                         type: string
 *                       doctor_name:
 *                         type: string
 *                       absence_date:
 *                         type: string
 *                       absence_type:
 *                         type: string
 *                       shift_name:
 *                         type: string
 *                         nullable: true
 *                       reason:
 *                         type: string
 *                         nullable: true
 */
doctorAbsenceRoutes.get(
    '/',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('APPOINTMENT_VIEW')],
    DoctorAbsenceController.getAbsences
);

/**
 * @swagger
 * /api/doctor-absences/{absenceId}:
 *   delete:
 *     summary: Huỷ lịch vắng đột xuất
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_EDIT.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Soft delete bản ghi vắng.
 *       - Tự động revert `staff_schedules.is_leave = false` cho lịch bị ảnh hưởng.
 *       - BS sẽ quay lại trạng thái khả dụng trong ngày/ca đó.
 *     tags: [3.3 Quản lý lịch bác sĩ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: absenceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bản ghi vắng
 *         example: "ABS_abc12345"
 *     responses:
 *       200:
 *         description: Huỷ lịch vắng thành công
 *       404:
 *         description: Bản ghi không tồn tại hoặc đã bị huỷ
 */
doctorAbsenceRoutes.delete(
    '/:absenceId',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('APPOINTMENT_EDIT')],
    DoctorAbsenceController.deleteAbsence
);
