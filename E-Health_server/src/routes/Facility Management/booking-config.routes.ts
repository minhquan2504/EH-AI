import { Router } from 'express';
import { BookingConfigController } from '../../controllers/Facility Management/booking-config.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const bookingConfigRoutes = Router();

// CẤU HÌNH QUY TẮC ĐẶT KHÁM (BOOKING CONFIGURATIONS)

/**
 * @swagger
 * /api/booking-configs/branch/{branchId}:
 *   get:
 *     summary: Lấy cấu hình đặt khám ĐÃ KẾT HỢP (Resolved) của chi nhánh
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền BOOKING_CONFIG_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về cấu hình đặt khám **cuối cùng có hiệu lực** cho chi nhánh được chỉ định.
 *       - Hệ thống áp dụng cơ chế **Kế thừa (Inheritance)**:
 *         1. **Branch Override:** Nếu chi nhánh đã được setup cấu hình riêng → Dùng giá trị của nhánh.
 *         2. **Global Fallback:** Nếu nhánh chưa setup (field = NULL) → Lấy giá trị từ bảng `system_settings` (Module 1.4).
 *         3. **Default:** Nếu `system_settings` cũng chưa có → Dùng giá trị mặc định của hệ thống.
 *       - Trường `sources` trong response cho biết nguồn gốc từng field: `"branch"`, `"global"`, hoặc `"default"`.
 *       - **Endpoint này là API chính** mà Module Đặt lịch (Module 3) sẽ gọi để validate slot.
 *     tags: [2.12 Cấu hình Quy tắc đặt khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của chi nhánh cần lấy cấu hình
 *         example: "BRANCH_001"
 *     responses:
 *       200:
 *         description: Lấy cấu hình Resolved thành công
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
 *                   example: "Lấy cấu hình đặt khám (Resolved) thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     branch_id:
 *                       type: string
 *                       example: "BRANCH_001"
 *                     max_patients_per_slot:
 *                       type: integer
 *                       description: "Số bệnh nhân tối đa / slot"
 *                       example: 2
 *                     buffer_duration:
 *                       type: integer
 *                       description: "Thời gian đệm giữa các slot (phút)"
 *                       example: 5
 *                     advance_booking_days:
 *                       type: integer
 *                       description: "Cho phép đặt trước tối đa bao nhiêu ngày"
 *                       example: 30
 *                     minimum_booking_hours:
 *                       type: integer
 *                       description: "Phải đặt lịch trước ít nhất bao nhiêu giờ"
 *                       example: 2
 *                     cancellation_allowed_hours:
 *                       type: integer
 *                       description: "Cho phép hủy lịch trước bao nhiêu giờ"
 *                       example: 12
 *                     sources:
 *                       type: object
 *                       description: "Nguồn gốc từng field (branch / global / default)"
 *                       example:
 *                         max_patients_per_slot: "branch"
 *                         buffer_duration: "default"
 *                         advance_booking_days: "global"
 *                         minimum_booking_hours: "default"
 *                         cancellation_allowed_hours: "global"
 *       404:
 *         description: Chi nhánh không tồn tại
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 */
bookingConfigRoutes.get(
    '/branch/:branchId',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('BOOKING_CONFIG_VIEW')],
    BookingConfigController.getResolvedConfig,
);

/**
 * @swagger
 * /api/booking-configs/branch/{branchId}/raw:
 *   get:
 *     summary: Lấy cấu hình thô (Raw) riêng của chi nhánh
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền BOOKING_CONFIG_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về đúng dữ liệu **thô (Raw)** đang lưu trong bảng `booking_configurations` cho chi nhánh.
 *       - Nếu chi nhánh **chưa từng được setup cấu hình riêng**, `data` sẽ trả về `null`.
 *       - **Mục đích sử dụng:**
 *         - Load dữ liệu cho form admin chỉnh sửa.
 *         - Client có thể so sánh Raw vs Resolved để hiển thị UI checkbox kiểu:
 *           "☑ Sử dụng cấu hình mặc định hệ thống" hoặc "☐ Thiết lập riêng cho chi nhánh".
 *     tags: [2.12 Cấu hình Quy tắc đặt khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của chi nhánh
 *         example: "BRANCH_001"
 *     responses:
 *       200:
 *         description: Lấy cấu hình thô thành công (data có thể null nếu chưa setup)
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
 *                 data:
 *                   nullable: true
 *                   type: object
 *                   description: "null nếu chưa có cấu hình riêng"
 *                   properties:
 *                     config_id:
 *                       type: string
 *                       example: "BKCFG_a1b2c3d4"
 *                     facility_id:
 *                       type: string
 *                     branch_id:
 *                       type: string
 *                     max_patients_per_slot:
 *                       type: integer
 *                       nullable: true
 *                       example: 2
 *                     buffer_duration:
 *                       type: integer
 *                       nullable: true
 *                       example: null
 *                     advance_booking_days:
 *                       type: integer
 *                       nullable: true
 *                       example: 15
 *                     minimum_booking_hours:
 *                       type: integer
 *                       nullable: true
 *                       example: null
 *                     cancellation_allowed_hours:
 *                       type: integer
 *                       nullable: true
 *                       example: null
 *       404:
 *         description: Chi nhánh không tồn tại
 */
bookingConfigRoutes.get(
    '/branch/:branchId/raw',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('BOOKING_CONFIG_VIEW')],
    BookingConfigController.getRawConfig,
);

/**
 * @swagger
 * /api/booking-configs/branch/{branchId}:
 *   put:
 *     summary: Cập nhật (UPSERT) cấu hình đặt khám cho chi nhánh
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền BOOKING_CONFIG_EDIT.
 *       **Vai trò được phép:** ADMIN, STAFF (Quản lý vận hành).
 *
 *       **Mô tả chi tiết:**
 *       - Tạo mới hoặc cập nhật cấu hình cho chi nhánh (UPSERT).
 *       - Chỉ gửi những field muốn Override. Các field **không gửi** sẽ giữ nguyên giá trị cũ (nếu đã có).
 *       - Gửi giá trị `null` cho 1 field = xóa Override, trả về dùng Global/Default.
 *       - Response trả về cấu hình **Resolved** (đã kết hợp) để Client cập nhật UI ngay.
 *
 *       **Giới hạn giá trị:**
 *       | Field | Min | Max | Đơn vị |
 *       |---|---|---|---|
 *       | max_patients_per_slot | 1 | 50 | người |
 *       | buffer_duration | 0 | 60 | phút |
 *       | advance_booking_days | 1 | 365 | ngày |
 *       | minimum_booking_hours | 0 | 72 | giờ |
 *       | cancellation_allowed_hours | 0 | 168 | giờ |
 *     tags: [2.12 Cấu hình Quy tắc đặt khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của chi nhánh
 *         example: "BRANCH_001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               max_patients_per_slot:
 *                 type: integer
 *                 nullable: true
 *                 description: "Số BN tối đa / slot (1-50). Gửi null để xóa override."
 *                 example: 2
 *               buffer_duration:
 *                 type: integer
 *                 nullable: true
 *                 description: "Thời gian đệm giữa các slot, tính bằng phút (0-60)"
 *                 example: 5
 *               advance_booking_days:
 *                 type: integer
 *                 nullable: true
 *                 description: "Số ngày cho phép đặt trước (1-365)"
 *                 example: 15
 *               minimum_booking_hours:
 *                 type: integer
 *                 nullable: true
 *                 description: "Đặt lịch trước ít nhất bao nhiêu giờ (0-72)"
 *                 example: 2
 *               cancellation_allowed_hours:
 *                 type: integer
 *                 nullable: true
 *                 description: "Cho phép hủy lịch trước bao nhiêu giờ (0-168)"
 *                 example: 24
 *     responses:
 *       200:
 *         description: Cập nhật cấu hình chi nhánh thành công. Trả về Resolved config.
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
 *                   example: "Cập nhật cấu hình đặt khám cho chi nhánh thành công"
 *                 data:
 *                   type: object
 *                   description: "Resolved config (đã kết hợp Branch + Global + Default)"
 *       400:
 *         description: Giá trị không hợp lệ (vượt giới hạn min/max)
 *       404:
 *         description: Chi nhánh không tồn tại
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền BOOKING_CONFIG_EDIT
 */
bookingConfigRoutes.put(
    '/branch/:branchId',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('BOOKING_CONFIG_EDIT')],
    BookingConfigController.upsertConfig,
);

export default bookingConfigRoutes;
