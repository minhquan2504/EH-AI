// src/routes/Facility Management/bed.routes.ts
import { Router } from 'express';
import { BedController } from '../../controllers/Facility Management/bed.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const router = Router();

/**
 * @swagger
 * /api/beds:
 *   get:
 *     summary: Lấy danh sách giường bệnh
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền BED_VIEW.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở, Quản lý khoa.
 *
 *       **Mô tả chi tiết:**
 *       Trả về danh sách giường bệnh có phân trang, hỗ trợ lọc theo cơ sở, chi nhánh, khoa, phòng, loại giường, trạng thái, và tìm kiếm theo tên/mã.
 *     tags: [2.11 Quản lý Giường bệnh]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: facility_id
 *         schema:
 *           type: string
 *         description: Lọc theo cơ sở
 *         example: "FAC_001"
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Lọc theo chi nhánh
 *         example: "BR_001"
 *       - in: query
 *         name: department_id
 *         schema:
 *           type: string
 *         description: Lọc theo khoa
 *       - in: query
 *         name: room_id
 *         schema:
 *           type: string
 *         description: Lọc theo phòng
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [STANDARD, EMERGENCY, ICU]
 *         description: Lọc theo loại giường
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [EMPTY, OCCUPIED, CLEANING, MAINTENANCE]
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên hoặc mã giường
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số lượng mỗi trang (tối đa 100)
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/', verifyAccessToken, checkSessionStatus, authorizePermissions('BED_VIEW'), BedController.getBeds);

/**
 * @swagger
 * /api/beds/{id}:
 *   get:
 *     summary: Lấy chi tiết giường bệnh
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền BED_VIEW.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở, Quản lý khoa.
 *
 *       Trả về thông tin chi tiết giường kèm tên cơ sở, chi nhánh, khoa, phòng.
 *     tags: [2.11 Quản lý Giường bệnh]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID giường bệnh
 *         example: "BED_abc123"
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy giường
 */
router.get('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('BED_VIEW'), BedController.getBedById);

/**
 * @swagger
 * /api/beds:
 *   post:
 *     summary: Tạo mới giường bệnh
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền BED_CREATE.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở.
 *
 *       **Mô tả chi tiết:**
 *       Tạo giường mới trong cơ sở y tế. Hệ thống tự sinh `bed_id`.
 *       - `facility_id` và `branch_id` bắt buộc.
 *       - `code` phải duy nhất trong cùng chi nhánh.
 *       - `department_id` và `room_id` là tùy chọn (có thể gán sau).
 *       - `type` mặc định là `STANDARD`, `status` mặc định là `EMPTY`.
 *     tags: [2.11 Quản lý Giường bệnh]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [facility_id, branch_id, name, code]
 *             properties:
 *               facility_id:
 *                 type: string
 *                 example: "FAC_001"
 *               branch_id:
 *                 type: string
 *                 example: "BR_001"
 *               department_id:
 *                 type: string
 *                 example: "DEPT_001"
 *               room_id:
 *                 type: string
 *                 example: "MR_001"
 *               name:
 *                 type: string
 *                 example: "Giường 01"
 *               code:
 *                 type: string
 *                 example: "B01"
 *               type:
 *                 type: string
 *                 enum: [STANDARD, EMERGENCY, ICU]
 *                 example: "STANDARD"
 *               status:
 *                 type: string
 *                 enum: [EMPTY, OCCUPIED, CLEANING, MAINTENANCE]
 *                 example: "EMPTY"
 *               description:
 *                 type: string
 *                 example: "Giường bệnh thường, tầng 2"
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post('/', verifyAccessToken, checkSessionStatus, authorizePermissions('BED_CREATE'), BedController.createBed);

/**
 * @swagger
 * /api/beds/{id}:
 *   put:
 *     summary: Cập nhật thông tin giường bệnh
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền BED_UPDATE.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở.
 *
 *       Cập nhật tên, mã, loại giường, mô tả. Không dùng API này để đổi phòng/khoa (dùng API `/assign`) hay trạng thái (dùng API `/status`).
 *     tags: [2.11 Quản lý Giường bệnh]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID giường bệnh
 *         example: "BED_abc123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Giường VIP 01"
 *               code:
 *                 type: string
 *                 example: "VIP01"
 *               type:
 *                 type: string
 *                 enum: [STANDARD, EMERGENCY, ICU]
 *                 example: "ICU"
 *               description:
 *                 type: string
 *                 example: "Giường hồi sức tích cực"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy giường
 */
router.put('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('BED_UPDATE'), BedController.updateBed);

/**
 * @swagger
 * /api/beds/{id}/assign:
 *   put:
 *     summary: Gán giường vào phòng/khoa (hoặc thu hồi)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền BED_UPDATE.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở.
 *
 *       **Mô tả chi tiết:**
 *       Gán giường vào phòng và/hoặc khoa mới. Truyền `null` để thu hồi giường khỏi phòng/khoa.
 *       - `department_id` và `room_id` phải thuộc cùng chi nhánh với giường.
 *       - Có thể chỉ truyền 1 trong 2 trường (trường không truyền giữ nguyên giá trị cũ).
 *     tags: [2.11 Quản lý Giường bệnh]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID giường bệnh
 *         example: "BED_abc123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               department_id:
 *                 type: string
 *                 nullable: true
 *                 example: "DEPT_001"
 *               room_id:
 *                 type: string
 *                 nullable: true
 *                 example: "MR_001"
 *     responses:
 *       200:
 *         description: Gán thành công
 *       400:
 *         description: Phòng/Khoa không thuộc cùng chi nhánh
 *       404:
 *         description: Không tìm thấy giường
 */
router.put('/:id/assign', verifyAccessToken, checkSessionStatus, authorizePermissions('BED_UPDATE'), BedController.assignBed);

/**
 * @swagger
 * /api/beds/{id}/status:
 *   put:
 *     summary: Cập nhật trạng thái giường bệnh
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền BED_UPDATE.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở, Y tá trưởng.
 *
 *       **Mô tả chi tiết:**
 *       Thay đổi trạng thái giường bệnh theo luồng nghiệp vụ:
 *       - `EMPTY` → `OCCUPIED` (Tiếp nhận bệnh nhân) hoặc `MAINTENANCE`
 *       - `OCCUPIED` → `CLEANING` (Bệnh nhân xuất viện) hoặc `MAINTENANCE`
 *       - `CLEANING` → `EMPTY` (Dọn dẹp xong) hoặc `MAINTENANCE`
 *       - `MAINTENANCE` → `EMPTY` (Bảo trì xong)
 *
 *       Nếu chuyển trạng thái không hợp lệ, API sẽ trả về mã lỗi `BED_009`.
 *     tags: [2.11 Quản lý Giường bệnh]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID giường bệnh
 *         example: "BED_abc123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [EMPTY, OCCUPIED, CLEANING, MAINTENANCE]
 *                 example: "OCCUPIED"
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *       400:
 *         description: Luồng chuyển trạng thái không hợp lệ
 *       404:
 *         description: Không tìm thấy giường
 */
router.put('/:id/status', verifyAccessToken, checkSessionStatus, authorizePermissions('BED_UPDATE'), BedController.updateStatus);

/**
 * @swagger
 * /api/beds/{id}:
 *   delete:
 *     summary: Xóa giường bệnh (soft delete)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền BED_DELETE.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở.
 *
 *       **Mô tả chi tiết:**
 *       Xóa mềm giường bệnh. Không thể xóa giường đang có bệnh nhân sử dụng (trạng thái `OCCUPIED`).
 *     tags: [2.11 Quản lý Giường bệnh]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID giường bệnh
 *         example: "BED_abc123"
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       400:
 *         description: Không thể xóa giường đang có bệnh nhân
 *       404:
 *         description: Không tìm thấy giường
 */
router.delete('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('BED_DELETE'), BedController.deleteBed);

export const bedRoutes = router;
