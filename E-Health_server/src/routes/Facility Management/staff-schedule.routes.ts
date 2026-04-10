// src/routes/Facility Management/staff-schedule.routes.ts
import { Router } from 'express';
import { StaffScheduleController } from '../../controllers/Facility Management/staff-schedule.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const router = Router();

/**
 * @swagger
 * /api/staff-schedules:
 *   post:
 *     summary: Phân công lịch làm việc mới cho Nhân viên
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền SCHEDULE_CREATE.
 *       **Vai trò được phép:** Thường là SUPER_ADMIN, ADMIN, MANAGER.
 *       
 *       **Mô tả:** Chọn 1 Ca, chọn 1 Nhân viên và xếp vào 1 Ngày. Hệ thống sẽ tự kiểm tra trùng lặp thời gian trong cùng ngày.
 *     tags: [2.6.3 Quản lý Lịch Nhân viên]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *                 example: "USR_123456"
 *               medical_room_id:
 *                 type: string
 *                 example: "MRM_123"
 *               shift_id:
 *                 type: string
 *                 example: "SHF_2408_1a2b3c4d"
 *               working_date:
 *                 type: string
 *                 example: "2026-03-10"
 *     responses:
 *       201:
 *         description: Phân công thành công
 *       400:
 *         description: Trùng giờ làm việc hoặc sai thông tin
 */
router.post('/', verifyAccessToken, checkSessionStatus, authorizePermissions('SCHEDULE_CREATE'), StaffScheduleController.createSchedule);

/**
 * @swagger
 * /api/staff-schedules:
 *   get:
 *     summary: Lấy danh sách toàn bộ lịch làm việc
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền SCHEDULE_VIEW.
 *     tags: [2.6.3 Quản lý Lịch Nhân viên]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: Lọc theo khóa ngoại nhân viên
 *       - in: query
 *         name: working_date
 *         schema:
 *           type: string
 *         description: Lọc theo Ngày (YYYY-MM-DD)
 *       - in: query
 *         name: shift_id
 *         schema:
 *           type: string
 *         description: Lọc theo Ca làm việc
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', verifyAccessToken, checkSessionStatus, authorizePermissions('SCHEDULE_VIEW'), StaffScheduleController.getSchedules);

/**
 * @swagger
 * /api/staff-schedules/calendar:
 *   get:
 *     summary: Vẽ giao diện Lịch (Calendar View)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền SCHEDULE_VIEW.
 *     tags: [2.6.3 Quản lý Lịch Nhân viên]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/calendar', verifyAccessToken, checkSessionStatus, authorizePermissions('SCHEDULE_VIEW'), StaffScheduleController.getScheduleCalendar);

/**
 * @swagger
 * /api/staff-schedules/staff/{staffId}:
 *   get:
 *     summary: Danh sách lịch trực của một Nhân viên cụ thể
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền SCHEDULE_VIEW.
 *     tags: [2.6.3 Quản lý Lịch Nhân viên]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/staff/:staffId', verifyAccessToken, checkSessionStatus, authorizePermissions('SCHEDULE_VIEW'), StaffScheduleController.getSchedulesByStaff);

/**
 * @swagger
 * /api/staff-schedules/date/{date}:
 *   get:
 *     summary: Lịch vắn tắt trong 1 Ngày (Ai đang làm phòng nào)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền SCHEDULE_VIEW.
 *     tags: [2.6.3 Quản lý Lịch Nhân viên]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           example: "2026-03-10"
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/date/:date', verifyAccessToken, checkSessionStatus, authorizePermissions('SCHEDULE_VIEW'), StaffScheduleController.getSchedulesByDate);

/**
 * @swagger
 * /api/staff-schedules/{id}:
 *   get:
 *     summary: Lấy chi tiết lịch theo ID ID
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền SCHEDULE_VIEW.
 *     tags: [2.6.3 Quản lý Lịch Nhân viên]
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
router.get('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('SCHEDULE_VIEW'), StaffScheduleController.getScheduleById);

/**
 * @swagger
 * /api/staff-schedules/{id}:
 *   put:
 *     summary: Cập nhật Lịch Phân công
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền SCHEDULE_UPDATE.
 *     tags: [2.6.3 Quản lý Lịch Nhân viên]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               medical_room_id:
 *                 type: string
 *                 example: "MRM_123"
 *               shift_id:
 *                 type: string
 *                 example: "SHF_2408_1a2b3c4d"
 *               working_date:
 *                 type: string
 *                 example: "2026-03-10"
 *               is_leave:
 *                 type: boolean
 *                 example: false
 *               leave_reason:
 *                 type: string
 *                 example: ""
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('SCHEDULE_UPDATE'), StaffScheduleController.updateSchedule);

/**
 * @swagger
 * /api/staff-schedules/{id}:
 *   delete:
 *     summary: Hủy/Xóa Lịch Phân công
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền SCHEDULE_DELETE.
 *       **Điều kiện Xóa:** Chỉ cho phép xóa nếu lịch làm việc là NGÀY TƯƠNG LAI. Lịch quá khứ sẽ bị chặn.
 *     tags: [2.6.3 Quản lý Lịch Nhân viên]
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
 *         description: Xóa thành công
 *       400:
 *         description: Lịch trong quá khứ không thể xóa
 */
router.delete('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('SCHEDULE_DELETE'), StaffScheduleController.deleteSchedule);

/**
 * @swagger
 * /api/staff-schedules/{id}/suspend:
 *   patch:
 *     summary: Tạm ngưng lịch làm việc
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền SCHEDULE_SUSPEND.
 *       **Điều kiện:** Không thể tạm ngưng lịch ở ngày quá khứ.
 *     tags: [2.6.4 Tạm ngưng lịch làm việc]
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
 *         description: Tạm ngưng thành công
 *       400:
 *         description: Lịch đã qua hoặc đã bị ngưng
 */
router.patch('/:id/suspend', verifyAccessToken, checkSessionStatus, authorizePermissions('SCHEDULE_SUSPEND'), StaffScheduleController.suspendSchedule);

/**
 * @swagger
 * /api/staff-schedules/{id}/resume:
 *   patch:
 *     summary: Mở lại lịch làm việc
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền SCHEDULE_RESUME.
 *       **Điều kiện:** Chỉ áp dụng cho lịch đang bị SUSPENDED.
 *     tags: [2.6.4 Tạm ngưng lịch làm việc]
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
 *         description: Mở lại thành công
 *       400:
 *         description: Lịch đang active sẵn
 */
router.patch('/:id/resume', verifyAccessToken, checkSessionStatus, authorizePermissions('SCHEDULE_RESUME'), StaffScheduleController.resumeSchedule);

export const staffScheduleRoutes = router;
