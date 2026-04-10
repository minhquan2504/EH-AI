// src/routes/Facility Management/facility-status.routes.ts
import { Router } from 'express';
import { FacilityStatusController } from '../../controllers/Facility Management/facility-status.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const router = Router();

/**
 * @swagger
 * /api/facility-status/today:
 *   get:
 *     summary: Trạng thái cơ sở hôm nay
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền OP_HOURS_VIEW.
 *       **Vai trò được phép:** Tất cả nhân viên.
 *
 *       **Mô tả chi tiết:**
 *       Kiểm tra cơ sở hôm nay có mở cửa hay không.
 *       Hệ thống kiểm tra theo thứ tự ưu tiên:
 *       1. **Holiday** — Ngày lễ (đóng cửa hoặc mở giờ đặc biệt)
 *       2. **Closed Days** — Ngày nghỉ cố định theo tuần
 *       3. **Operating Hours** — Giờ hoạt động thường
 *
 *       Trả về `is_open`, `open_time`, `close_time`, và `reason` (HOLIDAY, CLOSED_DAY, OPERATING_HOURS, NO_CONFIG).
 *     tags: [2.8 Giờ hoạt động cơ sở]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: facility_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID cơ sở y tế
 *         example: "FAC_001"
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                       example: "2026-03-10"
 *                     day_name:
 *                       type: string
 *                       example: "Thứ 3"
 *                     is_open:
 *                       type: boolean
 *                       example: true
 *                     open_time:
 *                       type: string
 *                       example: "08:00"
 *                     close_time:
 *                       type: string
 *                       example: "17:00"
 *                     reason:
 *                       type: string
 *                       enum: [HOLIDAY, HOLIDAY_SPECIAL, CLOSED_DAY, CLOSED, OPERATING_HOURS, NO_CONFIG]
 *                     note:
 *                       type: string
 *                       nullable: true
 *       400:
 *         description: Thiếu facility_id
 */
router.get('/today', verifyAccessToken, checkSessionStatus, authorizePermissions('OP_HOURS_VIEW'), FacilityStatusController.getToday);

/**
 * @swagger
 * /api/facility-status/date/{date}:
 *   get:
 *     summary: Trạng thái cơ sở theo ngày
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền OP_HOURS_VIEW.
 *       **Vai trò được phép:** Tất cả nhân viên.
 *
 *       **Mô tả chi tiết:**
 *       Kiểm tra cơ sở có mở cửa vào ngày bất kỳ hay không.
 *       Logic tương tự API `/today` nhưng cho phép truyền ngày cụ thể.
 *       Hữu ích cho hệ thống đặt lịch khám (Booking System).
 *     tags: [2.8 Giờ hoạt động cơ sở]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: "Ngày cần kiểm tra (YYYY-MM-DD)"
 *         example: "2026-09-02"
 *       - in: query
 *         name: facility_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID cơ sở y tế
 *         example: "FAC_001"
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Thiếu facility_id hoặc date
 */
router.get('/date/:date', verifyAccessToken, checkSessionStatus, authorizePermissions('OP_HOURS_VIEW'), FacilityStatusController.getByDate);

/**
 * @swagger
 * /api/facility-status/calendar:
 *   get:
 *     summary: Calendar hoạt động 1 tháng
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền OP_HOURS_VIEW.
 *       **Vai trò được phép:** Tất cả nhân viên.
 *
 *       **Mô tả chi tiết:**
 *       Trả về danh sách trạng thái cho TẤT CẢ các ngày trong 1 tháng.
 *       Mỗi ngày bao gồm: `is_open`, `open_time`, `close_time`, `reason`, `note`.
 *       Frontend dùng để render Calendar view hiển thị ngày mở/đóng/lễ.
 *
 *       Nếu không truyền `month`/`year`, mặc định lấy tháng hiện tại.
 *     tags: [2.8 Giờ hoạt động cơ sở]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: facility_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID cơ sở y tế
 *         example: "FAC_001"
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: "Tháng (1-12), mặc định tháng hiện tại"
 *         example: 3
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: "Năm, mặc định năm hiện tại"
 *         example: 2026
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     facility_id:
 *                       type: string
 *                     month:
 *                       type: integer
 *                     year:
 *                       type: integer
 *                     days:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                           day_name:
 *                             type: string
 *                           is_open:
 *                             type: boolean
 *                           open_time:
 *                             type: string
 *                           close_time:
 *                             type: string
 *                           reason:
 *                             type: string
 *                           note:
 *                             type: string
 *       400:
 *         description: Thiếu facility_id hoặc month/year không hợp lệ
 */
router.get('/calendar', verifyAccessToken, checkSessionStatus, authorizePermissions('OP_HOURS_VIEW'), FacilityStatusController.getCalendar);

export const facilityStatusRoutes = router;
