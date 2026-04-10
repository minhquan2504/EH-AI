import { Router } from 'express';
import { RoomMaintenanceController } from '../../controllers/Facility Management/room-maintenance.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

export const roomMaintenanceRoutes = Router();

// 3.4 QUẢN LÝ LỊCH BẢO TRÌ PHÒNG

/**
 * @swagger
 * /api/room-maintenance/active:
 *   get:
 *     summary: DS phòng đang/sắp bảo trì (tổng quát)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền FACILITY_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Liệt kê tất cả lịch bảo trì active (end_date >= today).
 *       - Mỗi record kèm `maintenance_status`: IN_PROGRESS / UPCOMING.
 *       - Dùng cho dashboard tổng quan hoặc khi xếp lịch khám.
 *     tags: [3.4 Quản lý phòng khám & tài nguyên]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy DS phòng đang/sắp bảo trì thành công
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
 *                       maintenance_id:
 *                         type: string
 *                       room_name:
 *                         type: string
 *                       start_date:
 *                         type: string
 *                       end_date:
 *                         type: string
 *                       reason:
 *                         type: string
 *                       maintenance_status:
 *                         type: string
 *                         enum: [IN_PROGRESS, UPCOMING]
 */
roomMaintenanceRoutes.get(
    '/active',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('FACILITY_VIEW')],
    RoomMaintenanceController.getActiveMaintenances
);

/**
 * @swagger
 * /api/room-maintenance/schedule/{maintenanceId}:
 *   delete:
 *     summary: Huỷ lịch bảo trì
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền FACILITY_EDIT.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Soft delete lịch bảo trì.
 *       - Phòng sẽ quay lại trạng thái khả dụng trong thời gian đã lên lịch.
 *     tags: [3.4 Quản lý phòng khám & tài nguyên]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: maintenanceId
 *         required: true
 *         schema:
 *           type: string
 *         example: "MAINT_abc12345"
 *     responses:
 *       200:
 *         description: Huỷ lịch bảo trì thành công
 *       404:
 *         description: Lịch bảo trì không tồn tại
 */
roomMaintenanceRoutes.delete(
    '/schedule/:maintenanceId',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('FACILITY_EDIT')],
    RoomMaintenanceController.deleteMaintenance
);

/**
 * @swagger
 * /api/room-maintenance/{roomId}:
 *   post:
 *     summary: Tạo lịch bảo trì phòng
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền FACILITY_EDIT.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Khoá phòng theo thời gian (start_date → end_date).
 *       - Kiểm tra overlap: nếu phòng đã có lịch bảo trì trùng khoảng → reject.
 *       - Khi xếp lịch `staff-schedule`, phòng bị khoá bảo trì sẽ bị chặn.
 *     tags: [3.4 Quản lý phòng khám & tài nguyên]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         example: "ROOM_abc"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - start_date
 *               - end_date
 *             properties:
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-04-01"
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-04-05"
 *               reason:
 *                 type: string
 *                 example: "Bảo trì hệ thống điều hoà và thiết bị y tế"
 *     responses:
 *       201:
 *         description: Tạo lịch bảo trì thành công
 *       400:
 *         description: Ngày không hợp lệ hoặc trùng lấp
 *       404:
 *         description: Phòng không tồn tại
 */
roomMaintenanceRoutes.post(
    '/:roomId',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('FACILITY_EDIT')],
    RoomMaintenanceController.createMaintenance
);

/**
 * @swagger
 * /api/room-maintenance/{roomId}:
 *   get:
 *     summary: Xem lịch bảo trì của 1 phòng
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền FACILITY_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về toàn bộ lịch bảo trì (active, chưa bị delete) của 1 phòng cụ thể.
 *       - Sắp xếp theo start_date giảm dần.
 *     tags: [3.4 Quản lý phòng khám & tài nguyên]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         example: "ROOM_abc"
 *     responses:
 *       200:
 *         description: Lấy lịch bảo trì thành công
 *       404:
 *         description: Phòng không tồn tại
 */
roomMaintenanceRoutes.get(
    '/:roomId',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('FACILITY_VIEW')],
    RoomMaintenanceController.getMaintenanceByRoom
);
