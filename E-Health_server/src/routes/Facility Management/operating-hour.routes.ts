// src/routes/Facility Management/operating-hour.routes.ts
import { Router } from 'express';
import { OperatingHourController } from '../../controllers/Facility Management/operating-hour.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const router = Router();

/**
 * @swagger
 * /api/operating-hours:
 *   post:
 *     summary: Tạo cấu hình giờ hoạt động cho cơ sở
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền OP_HOURS_CREATE.
 *       **Vai trò được phép:** SUPER_ADMIN.
 *
 *       **Mô tả chi tiết:**
 *       Tạo mới một bản ghi giờ mở/đóng cửa cho 1 ngày trong tuần của 1 cơ sở y tế.
 *       - `day_of_week`: 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7.
 *       - Nếu `is_closed = true`: Cơ sở nghỉ ngày đó, không cần truyền `open_time`/`close_time`.
 *       - Nếu `is_closed = false`: Bắt buộc `open_time < close_time`.
 *       - Mỗi cơ sở chỉ được có 1 cấu hình cho 1 ngày (Unique constraint).
 *     tags: [2.8 Giờ hoạt động cơ sở]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [facility_id, day_of_week]
 *             properties:
 *               facility_id:
 *                 type: string
 *                 description: ID cơ sở y tế
 *                 example: "FAC_001"
 *               day_of_week:
 *                 type: integer
 *                 description: "0=CN, 1=T2, 2=T3, 3=T4, 4=T5, 5=T6, 6=T7"
 *                 example: 1
 *               open_time:
 *                 type: string
 *                 description: "Giờ mở cửa (HH:mm)"
 *                 example: "08:00"
 *               close_time:
 *                 type: string
 *                 description: "Giờ đóng cửa (HH:mm)"
 *                 example: "17:00"
 *               is_closed:
 *                 type: boolean
 *                 description: "true = nghỉ, false = mở cửa"
 *                 example: false
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ (sai day_of_week, open_time >= close_time)
 *       409:
 *         description: Đã tồn tại cấu hình cho ngày này tại cơ sở
 */
router.post('/', verifyAccessToken, checkSessionStatus, authorizePermissions('OP_HOURS_CREATE'), OperatingHourController.create);

/**
 * @swagger
 * /api/operating-hours:
 *   get:
 *     summary: Lấy danh sách giờ hoạt động
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền OP_HOURS_VIEW.
 *       **Vai trò được phép:** Tất cả nhân viên có quyền OP_HOURS_VIEW.
 *
 *       **Mô tả chi tiết:**
 *       Trả về danh sách giờ hoạt động của tất cả cơ sở hoặc filter theo `facility_id`.
 *       Kết quả kèm `facility_name` (tên cơ sở) và `day_name` (tên ngày tiếng Việt).
 *     tags: [2.8 Giờ hoạt động cơ sở]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: facility_id
 *         schema:
 *           type: string
 *         description: Lọc theo ID cơ sở
 *         example: "FAC_001"
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', verifyAccessToken, checkSessionStatus, authorizePermissions('OP_HOURS_VIEW'), OperatingHourController.getAll);

/**
 * @swagger
 * /api/operating-hours/{id}:
 *   get:
 *     summary: Chi tiết 1 cấu hình giờ hoạt động
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền OP_HOURS_VIEW.
 *       **Vai trò được phép:** Tất cả nhân viên có quyền OP_HOURS_VIEW.
 *
 *       **Mô tả chi tiết:** Trả về thông tin chi tiết 1 bản ghi giờ hoạt động theo ID.
 *     tags: [2.8 Giờ hoạt động cơ sở]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "OPH_260309_abc12345"
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('OP_HOURS_VIEW'), OperatingHourController.getById);

/**
 * @swagger
 * /api/operating-hours/{id}:
 *   put:
 *     summary: Cập nhật giờ hoạt động
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền OP_HOURS_UPDATE.
 *       **Vai trò được phép:** SUPER_ADMIN, ADMIN, MANAGER.
 *
 *       **Mô tả chi tiết:**
 *       Cập nhật giờ mở/đóng cửa hoặc trạng thái đóng cửa cho 1 bản ghi.
 *       Chỉ cần gửi các trường cần sửa. Ví dụ thay đổi riêng `close_time` hoặc chuyển ngày sang `is_closed = true`.
 *       Validation: `open_time < close_time` nếu `is_closed = false`.
 *     tags: [2.8 Giờ hoạt động cơ sở]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "OPH_260309_abc12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               open_time:
 *                 type: string
 *                 example: "07:30"
 *               close_time:
 *                 type: string
 *                 example: "18:00"
 *               is_closed:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: open_time >= close_time
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('OP_HOURS_UPDATE'), OperatingHourController.update);

/**
 * @swagger
 * /api/operating-hours/{id}:
 *   delete:
 *     summary: Xóa cấu hình giờ hoạt động
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền OP_HOURS_DELETE.
 *       **Vai trò được phép:** SUPER_ADMIN.
 *
 *       **Mô tả chi tiết:**
 *       Soft-delete 1 bản ghi giờ hoạt động. Sau khi xóa, có thể tạo lại cấu hình cho ngày đó.
 *     tags: [2.8 Giờ hoạt động cơ sở]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "OPH_260309_abc12345"
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy hoặc đã bị xóa
 */
router.delete('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('OP_HOURS_DELETE'), OperatingHourController.remove);

export const operatingHourRoutes = router;
