// src/routes/Facility Management/appointment-slot.routes.ts
import { Router } from 'express';
import { AppointmentSlotController } from '../../controllers/Facility Management/appointment-slot.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const router = Router();

// THÔNG TIN CHUNG SLOT KHÁM BỆNH (APPOINTMENT SLOTS)

/**
 * @swagger
 * /api/slots:
 *   post:
 *     summary: Tạo mới Slot khám bệnh hoặc Gen tự động hàng loạt
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền SLOT_CREATE.
 *       **Vai trò được phép:** Những người có quyền SLOT_CREATE (Thường là SUPER_ADMIN, ADMIN, MANAGER).
 *       
 *       **Mô tả chi tiết:**
 *       - Bạn có 2 cách gọi API này:
 *         1. **Tạo 1 Slot đơn lẻ**: Truyền `shift_id`, `start_time` và `end_time`.
 *         2. **Sinh tự động hàng loạt Slot (Bulk Generate)**: Truyền `shift_id` và `interval_minutes` (Ví dụ 15). Hệ thống sẽ chia Ca đó ra thành chuỗi mảng các Slot kéo dài 15p.
 *     tags: [2.6.2 Quản lý Lịch làm việc & Slot Khám]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shift_id:
 *                 type: string
 *                 example: "SHF_2408_1a2b3c4d"
 *               start_time:
 *                 type: string
 *                 example: "08:00:00"
 *               end_time:
 *                 type: string
 *                 example: "08:15:00"
 *               interval_minutes:
 *                 type: integer
 *                 description: (Có thể truyền để Auto Gen Slot thay vì nhập tay giờ bắt đầu và kết thúc)
 *                 example: 15
 *     responses:
 *       201:
 *         description: Tạo Slot khám bệnh thành công
 *       400:
 *         description: Lỗi logic thời gian trùng lặp hoăc văng ra ngoài khung giờ Ca
 *       404:
 *         description: Không tìm thấy ID Ca làm việc
 */
router.post('/', verifyAccessToken, checkSessionStatus, authorizePermissions('SLOT_CREATE'), AppointmentSlotController.createSlot);

/**
 * @swagger
 * /api/slots:
 *   get:
 *     summary: Lấy danh sách Slot khám bệnh
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền SLOT_VIEW.
 *       **Vai trò được phép:** Những người có quyền SLOT_VIEW.
 *     tags: [2.6.2 Quản lý Lịch làm việc & Slot Khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: shift_id
 *         schema:
 *           type: string
 *         description: Lọc Slot theo Khóa ngoại Ca làm việc
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Lọc theo Trạng thái hoạt động (true/false)
 *     responses:
 *       200:
 *         description: Trả về danh sách Slot thành công
 */
router.get('/', verifyAccessToken, checkSessionStatus, authorizePermissions('SLOT_VIEW'), AppointmentSlotController.getSlots);

/**
 * @swagger
 * /api/slots/{id}:
 *   get:
 *     summary: Lấy chi tiết một Slot Khám Bệnh
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền SLOT_VIEW.
 *       **Vai trò được phép:** Những người có quyền SLOT_VIEW.
 *     tags: [2.6.2 Quản lý Lịch làm việc & Slot Khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Khóa chính Slot ID
 *     responses:
 *       200:
 *         description: Lấy dữ liệu chi tiết thành công
 *       404:
 *         description: Không tìm thấy Slot
 */
router.get('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('SLOT_VIEW'), AppointmentSlotController.getSlotById);

/**
 * @swagger
 * /api/slots/{id}:
 *   put:
 *     summary: Cập nhật thông tin cấu hình Slot (Update)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền SLOT_UPDATE.
 *       **Vai trò được phép:** Những người có quyền SLOT_UPDATE.
 *     tags: [2.6.2 Quản lý Lịch làm việc & Slot Khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Khóa chính Slot ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shift_id:
 *                 type: string
 *                 example: "SHF_2408_1a2b3c4d"
 *               start_time:
 *                 type: string
 *                 example: "08:15:00"
 *               end_time:
 *                 type: string
 *                 example: "08:30:00"
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Khung giờ cập nhật bị lỗi
 *       404:
 *         description: Không tìm thấy Slot
 */
router.put('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('SLOT_UPDATE'), AppointmentSlotController.updateSlot);

/**
 * @swagger
 * /api/slots/{id}:
 *   delete:
 *     summary: Vô hiệu hóa (Disable) Slot khỏi hệ thống
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền SLOT_DELETE.
 *       **Vai trò được phép:** Những người có quyền SLOT_DELETE.
 *       
 *       **Mô tả chi tiết:**
 *       - Soft Delete: Khi Admin loại bỏ Slot này, slot sẽ chuyển sang trạng thái `is_active: false` thay vì xóa mất hoàn toàn để bảo vệ tính toàn vẹn DB cho những Lịch Khám cũ.
 *     tags: [2.6.2 Quản lý Lịch làm việc & Slot Khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Khóa chính Slot ID
 *     responses:
 *       200:
 *         description: Vô hiệu hóa thành công
 *       404:
 *         description: Không tìm thấy Slot
 */
router.delete('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('SLOT_DELETE'), AppointmentSlotController.disableSlot);

export const slotRoutes = router;
