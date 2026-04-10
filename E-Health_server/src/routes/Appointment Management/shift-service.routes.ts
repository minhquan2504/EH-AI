import { Router } from 'express';
import { ShiftServiceController } from '../../controllers/Appointment Management/shift-service.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

export const shiftServiceRoutes = Router();

// =====================================================================
// 3.2.6. PHÂN BIỆT CA KHÁM THEO DỊCH VỤ (Shift-Service Mapping)
// =====================================================================

/**
 * @swagger
 * /api/shift-services:
 *   post:
 *     summary: Gán dịch vụ cho ca khám
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền FACILITY_EDIT.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Tạo liên kết giữa ca làm việc và dịch vụ cơ sở (VD: Ca sáng ↔ Khám Nội).
 *       - Hỗ trợ 2 mode:
 *         1. **Đơn**: Truyền `shift_id` + `facility_service_id`
 *         2. **Hàng loạt**: Truyền `shift_id` + `facility_service_ids` (mảng)
 *       - Validate: shift + service phải tồn tại và đang active.
 *       - Nếu mapping đã tồn tại → mode đơn: trả lỗi 409; mode bulk: bỏ qua (ON CONFLICT DO NOTHING).
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
 *             properties:
 *               shift_id:
 *                 type: string
 *                 description: ID ca làm việc
 *                 example: "SHIFT_MORNING"
 *               facility_service_id:
 *                 type: string
 *                 description: ID dịch vụ cơ sở (mode đơn)
 *                 example: "FSRV_KHAMNOI"
 *               facility_service_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Danh sách ID dịch vụ (mode hàng loạt)
 *                 example: ["FSRV_KHAMNOI", "FSRV_XETNGHIEM"]
 *     responses:
 *       201:
 *         description: Gán dịch vụ cho ca thành công
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
 *       400:
 *         description: Thiếu dữ liệu bắt buộc
 *       404:
 *         description: Ca hoặc dịch vụ không tồn tại
 *       409:
 *         description: Liên kết đã tồn tại (mode đơn)
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
shiftServiceRoutes.post(
    '/',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('FACILITY_EDIT')],
    ShiftServiceController.create
);

/**
 * @swagger
 * /api/shift-services:
 *   get:
 *     summary: Lấy danh sách liên kết ca-dịch vụ
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền FACILITY_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về danh sách liên kết kèm JOIN: tên ca, mã ca, tên dịch vụ, giá, thời lượng.
 *       - Hỗ trợ filter theo `shift_id` và `facility_service_id`.
 *     tags: [3.2 Quản lý khung giờ & ca khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: shift_id
 *         schema:
 *           type: string
 *         description: Lọc theo ca
 *         example: "SHIFT_MORNING"
 *       - in: query
 *         name: facility_service_id
 *         schema:
 *           type: string
 *         description: Lọc theo dịch vụ
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
 *                       shift_service_id:
 *                         type: string
 *                       shift_code:
 *                         type: string
 *                       shift_name:
 *                         type: string
 *                       start_time:
 *                         type: string
 *                       end_time:
 *                         type: string
 *                       service_code:
 *                         type: string
 *                       service_name:
 *                         type: string
 *                       base_price:
 *                         type: string
 *                       estimated_duration_minutes:
 *                         type: integer
 *                       is_active:
 *                         type: boolean
 */
shiftServiceRoutes.get(
    '/',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('FACILITY_VIEW')],
    ShiftServiceController.getAll
);

/**
 * @swagger
 * /api/shift-services/by-shift/{shiftId}:
 *   get:
 *     summary: Lấy danh sách dịch vụ thuộc 1 ca
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền FACILITY_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE, PATIENT.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về tất cả dịch vụ được gán cho ca được chỉ định.
 *       - Dùng cho UI: "Ca sáng hỗ trợ dịch vụ nào?"
 *     tags: [3.2 Quản lý khung giờ & ca khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID ca làm việc
 *         example: "SHIFT_MORNING"
 *     responses:
 *       200:
 *         description: Lấy danh sách dịch vụ theo ca thành công
 *       404:
 *         description: Ca làm việc không tồn tại
 */
shiftServiceRoutes.get(
    '/by-shift/:shiftId',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('FACILITY_VIEW')],
    ShiftServiceController.getByShift
);

/**
 * @swagger
 * /api/shift-services/by-service/{facilityServiceId}:
 *   get:
 *     summary: Lấy danh sách ca khám hỗ trợ 1 dịch vụ
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền FACILITY_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE, PATIENT.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về tất cả ca khám mà dịch vụ được chỉ định đã được gán.
 *       - Dùng cho UI: "Dịch vụ Khám Nội khả dụng ở ca nào?"
 *     tags: [3.2 Quản lý khung giờ & ca khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facilityServiceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID dịch vụ cơ sở
 *         example: "FSRV_KHAMNOI"
 *     responses:
 *       200:
 *         description: Lấy danh sách ca khám theo dịch vụ thành công
 *       404:
 *         description: Dịch vụ không tồn tại
 */
shiftServiceRoutes.get(
    '/by-service/:facilityServiceId',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('FACILITY_VIEW')],
    ShiftServiceController.getByService
);

/**
 * @swagger
 * /api/shift-services/{id}:
 *   delete:
 *     summary: Xoá liên kết ca-dịch vụ
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền FACILITY_EDIT.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Xoá cứng (hard delete) liên kết giữa ca và dịch vụ.
 *       - Dịch vụ sẽ không còn khả dụng trong ca đó.
 *     tags: [3.2 Quản lý khung giờ & ca khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID liên kết shift-service
 *         example: "SHSV_abc12345"
 *     responses:
 *       200:
 *         description: Xoá liên kết thành công
 *       404:
 *         description: Liên kết không tồn tại
 */
shiftServiceRoutes.delete(
    '/:id',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('FACILITY_EDIT')],
    ShiftServiceController.delete
);

/**
 * @swagger
 * /api/shift-services/{id}/toggle:
 *   patch:
 *     summary: Bật/tắt liên kết ca-dịch vụ
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền FACILITY_EDIT.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Tạm vô hiệu hoá hoặc kích hoạt lại liên kết mà không cần xoá.
 *       - Khi `is_active = false`, dịch vụ sẽ không hiển thị trong danh sách ca đó.
 *     tags: [3.2 Quản lý khung giờ & ca khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "SHSV_abc12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_active
 *             properties:
 *               is_active:
 *                 type: boolean
 *                 description: true = kích hoạt, false = vô hiệu hoá
 *                 example: false
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *       404:
 *         description: Liên kết không tồn tại
 */
shiftServiceRoutes.patch(
    '/:id/toggle',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('FACILITY_EDIT')],
    ShiftServiceController.toggle
);
