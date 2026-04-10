// src/routes/Facility Management/holiday.routes.ts
import { Router } from 'express';
import { HolidayController } from '../../controllers/Facility Management/holiday.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const router = Router();

/**
 * @swagger
 * /api/holidays:
 *   post:
 *     summary: Tạo ngày lễ cho cơ sở
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền HOLIDAY_CREATE.
 *       **Vai trò được phép:** SUPER_ADMIN, ADMIN, MANAGER.
 *
 *       **Mô tả chi tiết:**
 *       Tạo mới một bản ghi ngày lễ cho 1 cơ sở y tế.
 *       - `is_closed = true` (mặc định): Đóng cửa hoàn toàn ngày đó.
 *       - `is_closed = false`: Mở giờ đặc biệt, bắt buộc `special_open_time` và `special_close_time`.
 *       - `is_recurring = true`: Ngày lễ lặp lại hàng năm (vd: Quốc khánh 2/9).
 *       - Mỗi cơ sở chỉ được 1 ngày lễ/ngày (Unique constraint).
 *
 *       **Thứ tự ưu tiên Override:**
 *       Holiday > Closed Days > Operating Hours.
 *     tags: [2.8 Giờ hoạt động cơ sở]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [facility_id, holiday_date, title]
 *             properties:
 *               facility_id:
 *                 type: string
 *                 example: "FAC_001"
 *               holiday_date:
 *                 type: string
 *                 format: date
 *                 description: "Ngày lễ cụ thể (YYYY-MM-DD)"
 *                 example: "2026-09-02"
 *               title:
 *                 type: string
 *                 description: "Tên ngày lễ"
 *                 example: "Quốc khánh 2/9"
 *               is_closed:
 *                 type: boolean
 *                 description: "true = đóng cửa, false = mở giờ đặc biệt"
 *                 example: true
 *               special_open_time:
 *                 type: string
 *                 description: "Giờ mở cửa đặc biệt (khi is_closed=false)"
 *                 example: "08:00"
 *               special_close_time:
 *                 type: string
 *                 description: "Giờ đóng cửa đặc biệt (khi is_closed=false)"
 *                 example: "11:00"
 *               description:
 *                 type: string
 *                 description: "Ghi chú"
 *                 example: "Nghỉ lễ Quốc khánh"
 *               is_recurring:
 *                 type: boolean
 *                 description: "true = lặp lại hàng năm"
 *                 example: true
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       409:
 *         description: Đã tồn tại ngày lễ cho ngày này tại cơ sở
 */
router.post('/', verifyAccessToken, checkSessionStatus, authorizePermissions('HOLIDAY_CREATE'), HolidayController.create);

/**
 * @swagger
 * /api/holidays:
 *   get:
 *     summary: Lấy danh sách ngày lễ
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền HOLIDAY_VIEW.
 *       **Vai trò được phép:** Tất cả nhân viên có quyền HOLIDAY_VIEW.
 *
 *       **Mô tả chi tiết:**
 *       Trả về danh sách ngày lễ. Filter linh hoạt theo `facility_id`, `year`, `from`, `to`.
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
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Lọc theo năm
 *         example: 2026
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: "Từ ngày (YYYY-MM-DD)"
 *         example: "2026-01-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: "Đến ngày (YYYY-MM-DD)"
 *         example: "2026-12-31"
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', verifyAccessToken, checkSessionStatus, authorizePermissions('HOLIDAY_VIEW'), HolidayController.getAll);

/**
 * @swagger
 * /api/holidays/{id}:
 *   get:
 *     summary: Chi tiết 1 ngày lễ
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền HOLIDAY_VIEW.
 *       **Vai trò được phép:** Tất cả nhân viên có quyền HOLIDAY_VIEW.
 *     tags: [2.8 Giờ hoạt động cơ sở]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "HOL_260310_abc12345"
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('HOLIDAY_VIEW'), HolidayController.getById);

/**
 * @swagger
 * /api/holidays/{id}:
 *   put:
 *     summary: Cập nhật ngày lễ
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền HOLIDAY_UPDATE.
 *       **Vai trò được phép:** SUPER_ADMIN, ADMIN, MANAGER.
 *
 *       **Mô tả chi tiết:**
 *       Cập nhật thông tin ngày lễ. Có thể chuyển từ đóng cửa sang mở giờ đặc biệt và ngược lại.
 *       Nếu chuyển `is_closed = false`, bắt buộc `special_open_time < special_close_time`.
 *     tags: [2.8 Giờ hoạt động cơ sở]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "HOL_260310_abc12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Tết Nguyên Đán (cập nhật)"
 *               is_closed:
 *                 type: boolean
 *                 example: false
 *               special_open_time:
 *                 type: string
 *                 example: "08:00"
 *               special_close_time:
 *                 type: string
 *                 example: "11:00"
 *               description:
 *                 type: string
 *                 example: "Chỉ mở buổi sáng"
 *               is_recurring:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: special_open_time >= special_close_time
 *       404:
 *         description: Không tìm thấy
 */
router.put('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('HOLIDAY_UPDATE'), HolidayController.update);

/**
 * @swagger
 * /api/holidays/{id}:
 *   delete:
 *     summary: Xóa ngày lễ
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền HOLIDAY_DELETE.
 *       **Vai trò được phép:** SUPER_ADMIN, ADMIN, MANAGER.
 *
 *       **Mô tả chi tiết:** Soft-delete 1 bản ghi ngày lễ.
 *     tags: [2.8 Giờ hoạt động cơ sở]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "HOL_260310_abc12345"
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy hoặc đã bị xóa
 */
router.delete('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('HOLIDAY_DELETE'), HolidayController.remove);

export const holidayRoutes = router;
