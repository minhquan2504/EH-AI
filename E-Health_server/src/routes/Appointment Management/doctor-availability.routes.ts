import { Router } from 'express';
import { DoctorAvailabilityController } from '../../controllers/Appointment Management/doctor-availability.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

export const doctorAvailabilityRoutes = Router();

// 3.3 QUẢN LÝ LỊCH BÁC SĨ (Doctor Availability)

/**
 * @swagger
 * /api/doctor-availability/by-specialty/{specialtyId}:
 *   get:
 *     summary: Danh sách BS khả dụng theo chuyên khoa + ngày
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về tất cả BS thuộc 1 chuyên khoa, kèm trạng thái khả dụng (AVAILABLE / BUSY / ON_LEAVE / ABSENT).
 *       - Hỗ trợ filter theo ca (shift_id) để biết BS nào đang rảnh trong ca chỉ định.
 *       - Dùng cho FE hiển thị dropdown chọn bác sĩ khi đặt lịch.
 *     tags: [3.3 Quản lý lịch bác sĩ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: specialtyId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID chuyên khoa
 *         example: "SPEC_NhiKhoa"
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
 *         description: Lọc theo ca làm việc (tùy chọn)
 *         example: "SHIFT_MORNING"
 *     responses:
 *       200:
 *         description: Lấy danh sách BS theo chuyên khoa thành công
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
 *                       doctors_id:
 *                         type: string
 *                       doctor_name:
 *                         type: string
 *                       title:
 *                         type: string
 *                       availability_status:
 *                         type: string
 *                         enum: [AVAILABLE, BUSY, ON_LEAVE, ABSENT]
 *       404:
 *         description: Chuyên khoa không tồn tại
 */
doctorAvailabilityRoutes.get(
    '/by-specialty/:specialtyId',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('APPOINTMENT_VIEW')],
    DoctorAvailabilityController.getDoctorsBySpecialty
);

/**
 * @swagger
 * /api/doctor-availability/by-date/{date}:
 *   get:
 *     summary: Tổng quan tất cả BS đang làm việc trong ngày
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về tất cả BS có lịch trong ngày, nhóm theo ca làm việc.
 *       - Mỗi BS kèm thông tin phòng khám, chuyên khoa, trạng thái (WORKING / ON_LEAVE / SUSPENDED).
 *       - Dùng cho calendar view tổng quan.
 *     tags: [3.3 Quản lý lịch bác sĩ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày cần xem (YYYY-MM-DD)
 *         example: "2026-03-20"
 *     responses:
 *       200:
 *         description: Lấy tổng quan ngày thành công (nhóm theo ca)
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
 *                   description: "Object nhóm theo shift_name, mỗi key là tên ca"
 *       400:
 *         description: Định dạng ngày không hợp lệ
 */
doctorAvailabilityRoutes.get(
    '/by-date/:date',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('APPOINTMENT_VIEW')],
    DoctorAvailabilityController.getDoctorOverviewByDate
);

/**
 * @swagger
 * /api/doctor-availability/{doctorId}:
 *   get:
 *     summary: Lịch làm việc tổng hợp của 1 BS theo khoảng ngày
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về lịch làm việc của BS trong khoảng ngày, nhóm theo ngày.
 *       - Mỗi entry kèm thông tin ca, phòng khám, chuyên khoa, trạng thái (WORKING / ON_LEAVE / SUSPENDED).
 *       - Tích hợp leave_requests (đánh dấu ngày nghỉ).
 *     tags: [3.3 Quản lý lịch bác sĩ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bác sĩ (doctors_id)
 *         example: "DOC_abc12345"
 *       - in: query
 *         name: start_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu (YYYY-MM-DD)
 *         example: "2026-03-15"
 *       - in: query
 *         name: end_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc (YYYY-MM-DD)
 *         example: "2026-03-25"
 *     responses:
 *       200:
 *         description: Lấy lịch BS thành công
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
 *                   description: "Object nhóm theo ngày (YYYY-MM-DD)"
 *       404:
 *         description: Bác sĩ không tồn tại
 */
doctorAvailabilityRoutes.get(
    '/:doctorId',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('APPOINTMENT_VIEW')],
    DoctorAvailabilityController.getDoctorSchedule
);

/**
 * @swagger
 * /api/doctor-availability/{doctorId}/conflicts:
 *   get:
 *     summary: Kiểm tra xung đột lịch BS trước khi gán ca mới
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Kiểm tra leave APPROVED trùng ngày.
 *       - Kiểm tra schedule overlap (so sánh thời gian ca mới vs lịch hiện có).
 *       - Trả về `has_conflict = true / false` kèm danh sách chi tiết xung đột.
 *       - Dùng trước khi gọi `POST /api/staff-schedules` để validate.
 *     tags: [3.3 Quản lý lịch bác sĩ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bác sĩ (doctors_id)
 *         example: "DOC_abc12345"
 *       - in: query
 *         name: working_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày muốn gán ca
 *         example: "2026-03-20"
 *       - in: query
 *         name: shift_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ca muốn gán
 *         example: "SHIFT_MORNING"
 *     responses:
 *       200:
 *         description: Kết quả kiểm tra xung đột
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
 *                     has_conflict:
 *                       type: boolean
 *                       example: false
 *                     conflicts:
 *                       type: array
 *                       items:
 *                         type: object
 *                     warnings:
 *                       type: array
 *                       items:
 *                         type: object
 *       404:
 *         description: Bác sĩ không tồn tại
 */
doctorAvailabilityRoutes.get(
    '/:doctorId/conflicts',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('APPOINTMENT_VIEW')],
    DoctorAvailabilityController.checkConflicts
);

/**
 * @swagger
 * /api/doctor-availability/{doctorId}/facilities:
 *   get:
 *     summary: Lịch BS ở tất cả cơ sở (đa cơ sở)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về lịch BS ở tất cả chi nhánh/cơ sở → nhóm theo branch_name.
 *       - Dùng cho BS làm việc đa cơ sở hoặc ADMIN xem tổng thể.
 *       - Tự JOIN: staff_schedules → medical_rooms → departments → branches → facilities.
 *     tags: [3.3 Quản lý lịch bác sĩ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bác sĩ (doctors_id)
 *         example: "DOC_abc12345"
 *       - in: query
 *         name: start_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu
 *         example: "2026-03-15"
 *       - in: query
 *         name: end_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc
 *         example: "2026-03-25"
 *     responses:
 *       200:
 *         description: Lấy lịch đa cơ sở thành công (nhóm theo branch)
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
 *                   description: "Object nhóm theo branch_name"
 *       404:
 *         description: Bác sĩ không tồn tại
 */
doctorAvailabilityRoutes.get(
    '/:doctorId/facilities',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('APPOINTMENT_VIEW')],
    DoctorAvailabilityController.getDoctorMultiFacilitySchedule
);
