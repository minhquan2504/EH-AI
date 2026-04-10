// src/routes/Facility Management/closed-day.routes.ts
import { Router } from 'express';
import { ClosedDayController } from '../../controllers/Facility Management/closed-day.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const router = Router();

/**
 * @swagger
 * /api/closed-days:
 *   post:
 *     summary: Tạo ngày nghỉ cố định cho cơ sở
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền CLOSED_DAY_CREATE.
 *       **Vai trò được phép:** SUPER_ADMIN, ADMIN, MANAGER.
 *
 *       **Mô tả chi tiết:**
 *       Tạo mới một khai báo ngày nghỉ cố định hằng tuần cho 1 cơ sở y tế.
 *       - `day_of_week`: 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7.
 *       - `start_time` / `end_time`: Khoảng thời gian nghỉ.
 *         - Cả ngày: `start_time = 00:00`, `end_time = 23:59`.
 *         - Nửa ngày: vd chiều T7 `start_time = 12:00`, `end_time = 23:59`.
 *       - Hệ thống chống trùng/chồng chéo giờ nghỉ trong cùng 1 ngày.
 *     tags: [2.8 Giờ hoạt động cơ sở]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [facility_id, day_of_week, title, start_time, end_time]
 *             properties:
 *               facility_id:
 *                 type: string
 *                 description: ID cơ sở y tế
 *                 example: "FAC_001"
 *               day_of_week:
 *                 type: integer
 *                 description: "0=CN, 1=T2, 2=T3, 3=T4, 4=T5, 5=T6, 6=T7"
 *                 example: 0
 *               title:
 *                 type: string
 *                 description: Tên ngày nghỉ
 *                 example: "Nghỉ Chủ nhật"
 *               start_time:
 *                 type: string
 *                 description: "Giờ bắt đầu nghỉ (HH:mm)"
 *                 example: "00:00"
 *               end_time:
 *                 type: string
 *                 description: "Giờ kết thúc nghỉ (HH:mm)"
 *                 example: "23:59"
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ (sai day_of_week, start_time >= end_time)
 *       409:
 *         description: Chồng chéo giờ nghỉ với một ngày nghỉ đã tồn tại
 */
router.post('/', verifyAccessToken, checkSessionStatus, authorizePermissions('CLOSED_DAY_CREATE'), ClosedDayController.create);

/**
 * @swagger
 * /api/closed-days:
 *   get:
 *     summary: Lấy danh sách ngày nghỉ cố định
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền CLOSED_DAY_VIEW.
 *       **Vai trò được phép:** Tất cả nhân viên có quyền CLOSED_DAY_VIEW.
 *
 *       **Mô tả chi tiết:**
 *       Trả về danh sách ngày nghỉ hằng tuần của tất cả cơ sở hoặc filter theo `facility_id`.
 *       Kết quả kèm `facility_name` và `day_name` (tên ngày tiếng Việt).
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
router.get('/', verifyAccessToken, checkSessionStatus, authorizePermissions('CLOSED_DAY_VIEW'), ClosedDayController.getAll);

/**
 * @swagger
 * /api/closed-days/{id}:
 *   delete:
 *     summary: Xóa ngày nghỉ cố định
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền CLOSED_DAY_DELETE.
 *       **Vai trò được phép:** SUPER_ADMIN, ADMIN, MANAGER.
 *
 *       **Mô tả chi tiết:**
 *       Soft-delete 1 bản ghi ngày nghỉ cố định. Sau khi xóa, có thể tạo lại cấu hình ngày nghỉ cho khoảng giờ đó.
 *     tags: [2.8 Giờ hoạt động cơ sở]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "CD_260309_abc12345"
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy hoặc đã bị xóa
 */
router.delete('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('CLOSED_DAY_DELETE'), ClosedDayController.remove);

export const closedDayRoutes = router;
