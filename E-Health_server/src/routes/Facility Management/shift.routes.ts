// src/routes/shift.routes.ts
import { Router } from 'express';
import { ShiftController } from '../../controllers/Facility Management/shift.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const shiftRoutes = Router();

// THIẾT LẬP VÀ QUẢN LÝ TIÊU CHUẨN CA LÀM VIỆC (SHIFT MANAGEMENT)

/**
 * @swagger
 * /api/shifts:
 *   get:
 *     summary: Lấy danh sách hệ thống Ca làm việc
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền SHIFT_VIEW.
 *       **Vai trò được phép:** Những người có quyền SHIFT_VIEW (Ví dụ: SUPER_ADMIN, ADMIN, MANAGER, Cán bộ sắp lịch).
 *       
 *       **Mô tả chi tiết:**
 *       - Lấy toàn bộ các thiết lập Ca Làm Việc đang có trên hệ thống.
 *       - Mặc định hệ thống tự lọc đi các ca đã bị thu hồi/xóa `deleted_at IS NULL`.
 *       - Dùng làm bộ lọc thả xuống khi gán lịch trực cho nhân sự.
 *     tags: [2.6.1 Quản lý Lịch làm việc & Ca trực]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm ca theo code (MORNING_SHIFT) hoặc name (Ca Sáng)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *         description: Trạng thái hiển thị ca làm
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
shiftRoutes.get('/', [verifyAccessToken, checkSessionStatus, authorizePermissions('SHIFT_VIEW')], ShiftController.getShifts);

/**
 * @swagger
 * /api/shifts/{id}:
 *   get:
 *     summary: Chi tiết một Ca làm việc thiết lập sẵn
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền SHIFT_VIEW.
 *       **Vai trò được phép:** Những người có quyền SHIFT_VIEW.
 *     tags: [2.6.1 Quản lý Lịch làm việc & Ca trực]
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
 *         description: Lấy thành công
 *       404:
 *         description: Không tìm thấy ID quy định ca làm việc
 */
shiftRoutes.get('/:id', [verifyAccessToken, checkSessionStatus, authorizePermissions('SHIFT_VIEW')], ShiftController.getShiftById);

/**
 * @swagger
 * /api/shifts:
 *   post:
 *     summary: Thêm & Thiết lập Khung Ca mới
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền SHIFT_CREATE.
 *       **Vai trò được phép:** Những người có quyền quản trị vận hành (Ví dụ: SUPER_ADMIN, ADMIN, MANAGER).
 *       
 *       **Mô tả chi tiết:**
 *       - Khai báo một ca mới mở vào hệ thống danh sách (Ví dụ mảng ca Mổ buổi tối `20:00:00 -> 04:00:00`).
 *       - Hệ thống tự động Validate chuẩn thời gian `start_time` và `end_time` (Format HH:mm:ss).
 *     tags: [2.6.1 Quản lý Lịch làm việc & Ca trực]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name, start_time, end_time]
 *             properties:
 *               code:
 *                 type: string
 *                 description: "Mã ca chuẩn (Unique)"
 *                 example: "MORNING_SHIFT"
 *               name:
 *                 type: string
 *                 description: "Tên hiển thị nội bộ"
 *                 example: "Ca Sáng Tiêu Chuẩn"
 *               start_time:
 *                 type: string
 *                 description: "Giờ mở ca (HH:mm:ss)"
 *                 example: "08:00:00"
 *               end_time:
 *                 type: string
 *                 description: "Giờ đóng ca (HH:mm:ss)"
 *                 example: "12:00:00"
 *               description:
 *                 type: string
 *                 description: "Ghi chú công việc ca này"
 *                 example: "Dành cho khối phòng khám nội khoa"
 *     responses:
 *       201:
 *         description: Tạo thông tin ca chuẩn hóa thành công
 *       400:
 *         description: Thời gian ko hợp lệ hoặc trùng lặp `code`
 */
shiftRoutes.post('/', [verifyAccessToken, checkSessionStatus, authorizePermissions('SHIFT_CREATE')], ShiftController.createShift);

/**
 * @swagger
 * /api/shifts/{id}:
 *   put:
 *     summary: Cập nhật Giờ / Cấu hình Ca làm việc
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền SHIFT_UPDATE.
 *       **Vai trò được phép:** Những người có quyền SHIFT_UPDATE.
 *       
 *       **Mô tả chi tiết:**
 *       - Cho phép Cán bộ quản lý điều chỉnh giờ đóng/mở của Ca khi có chính sách giao ca mới.
 *     tags: [2.6.1 Quản lý Lịch làm việc & Ca trực]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: "MORNING_SHIFT"
 *               name:
 *                 type: string
 *                 example: "Ca Sáng Khám Bệnh Trễ"
 *               start_time:
 *                 type: string
 *                 example: "08:30:00"
 *               end_time:
 *                 type: string
 *                 example: "12:30:00"
 *               description:
 *                 type: string
 *                 example: "Tăng thêm 30 phút buổi trưa"
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 example: "ACTIVE"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
shiftRoutes.put('/:id', [verifyAccessToken, checkSessionStatus, authorizePermissions('SHIFT_UPDATE')], ShiftController.updateShift);

/**
 * @swagger
 * /api/shifts/{id}:
 *   delete:
 *     summary: Xóa (Vô hiệu hóa) Ca làm việc
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền SHIFT_DELETE.
 *       **Vai trò được phép:** Những người có quyền SHIFT_DELETE.
 *       
 *       **Mô tả chi tiết:**
 *       - Soft Delete: Khi Admin loại bỏ ca này khỏi danh mục, ca sẽ chuyển sang trạng thái `INACTIVE` thay vì xóa mất hoàn toàn. 
 *       - Điều này đảm bảo rằng lịch sử những người từng đi làm ca này trong 1 tháng trước vẫn lưu giữ nguyên vẹn. Mọi kết nối Database Không bị đứt gãy.
 *     tags: [2.6.1 Quản lý Lịch làm việc & Ca trực]
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
 *         description: Đã xóa mềm ca làm việc thành công
 */
shiftRoutes.delete('/:id', [verifyAccessToken, checkSessionStatus, authorizePermissions('SHIFT_DELETE')], ShiftController.deleteShift);

export default shiftRoutes;
