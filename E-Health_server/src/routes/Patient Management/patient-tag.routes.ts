import { Router } from 'express';
import { PatientTagController } from '../../controllers/Patient Management/patient-tag.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const router = Router();

// 2.6.1 QUẢN LÝ DANH MỤC THẺ (TAGS)

/**
 * @swagger
 * /api/patient-tags:
 *   post:
 *     summary: Tạo mới thẻ phân loại bệnh nhân
 *     description: |
 *       **Chức năng:** Tạo một thẻ phân loại mới cho hệ thống.
 *       Code phải duy nhất trong toàn hệ thống. Mã màu HEX dùng để hiển thị
 *       trên giao diện (badge/chip). Ví dụ: VIP → Vàng, HIGH_RISK → Đỏ đậm.
 *
 *       **Phân quyền:** Yêu cầu quyền `TAG_MANAGE`.
 *       **Vai trò được phép:** Admin, Staff.
 *     tags: [2.6.1 Danh mục thẻ bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name]
 *             properties:
 *               code:
 *                 type: string
 *                 description: Mã code duy nhất (UPPER_SNAKE_CASE)
 *                 example: "ELDERLY"
 *               name:
 *                 type: string
 *                 description: Tên hiển thị
 *                 example: "Người cao tuổi"
 *               color_hex:
 *                 type: string
 *                 description: Mã màu HEX (#RRGGBB)
 *                 example: "#8B4513"
 *               description:
 *                 type: string
 *                 description: Mô tả chi tiết
 *                 example: "Bệnh nhân trên 60 tuổi, cần ưu tiên phục vụ"
 *     responses:
 *       201:
 *         description: Tạo thẻ thành công
 *       400:
 *         description: Code đã tồn tại (TAG_002) hoặc mã màu không hợp lệ (TAG_003)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.post('/', verifyAccessToken, checkSessionStatus, authorizePermissions('TAG_MANAGE'), PatientTagController.create);

/**
 * @swagger
 * /api/patient-tags:
 *   get:
 *     summary: Danh sách thẻ phân loại
 *     description: |
 *       **Chức năng:** Lấy danh sách tất cả thẻ phân loại (phân trang).
 *       Hỗ trợ filter theo trạng thái active/inactive.
 *
 *       **Phân quyền:** Yêu cầu quyền `TAG_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.6.1 Danh mục thẻ bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter theo trạng thái (true = đang hoạt động)
 *     responses:
 *       200:
 *         description: Danh sách thẻ (phân trang)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/', verifyAccessToken, checkSessionStatus, authorizePermissions('TAG_VIEW'), PatientTagController.getAll);

/**
 * @swagger
 * /api/patient-tags/{id}:
 *   get:
 *     summary: Chi tiết thẻ phân loại
 *     description: |
 *       **Chức năng:** Lấy thông tin chi tiết một thẻ theo ID.
 *
 *       **Phân quyền:** Yêu cầu quyền `TAG_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.6.1 Danh mục thẻ bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID thẻ
 *         example: "TAG_260312_ab12cd34"
 *     responses:
 *       200:
 *         description: Thông tin thẻ
 *       404:
 *         description: Không tìm thấy thẻ (TAG_001)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('TAG_VIEW'), PatientTagController.getById);

/**
 * @swagger
 * /api/patient-tags/{id}:
 *   put:
 *     summary: Cập nhật thẻ phân loại
 *     description: |
 *       **Chức năng:** Cập nhật tên, mã màu, mô tả của thẻ.
 *       **Lưu ý:** Không cho phép thay đổi `code` sau khi tạo.
 *
 *       **Phân quyền:** Yêu cầu quyền `TAG_MANAGE`.
 *       **Vai trò được phép:** Admin, Staff.
 *     tags: [2.6.1 Danh mục thẻ bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID thẻ
 *         example: "TAG_260312_ab12cd34"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Khách VIP Platinum"
 *               color_hex:
 *                 type: string
 *                 example: "#DAA520"
 *               description:
 *                 type: string
 *                 example: "Khách hàng VIP hạng Platinum"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Mã màu HEX không hợp lệ (TAG_003)
 *       404:
 *         description: Không tìm thấy thẻ (TAG_001)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.put('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('TAG_MANAGE'), PatientTagController.update);

/**
 * @swagger
 * /api/patient-tags/{id}:
 *   delete:
 *     summary: Xóa thẻ phân loại (soft delete)
 *     description: |
 *       **Chức năng:** Vô hiệu hóa thẻ (đánh dấu `deleted_at` + `is_active = false`).
 *       Các bệnh nhân đã được gắn thẻ này sẽ vẫn giữ mapping nhưng thẻ
 *       sẽ không còn xuất hiện trong danh sách Active.
 *
 *       **Phân quyền:** Yêu cầu quyền `TAG_MANAGE`.
 *       **Vai trò được phép:** Admin, Staff.
 *     tags: [2.6.1 Danh mục thẻ bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID thẻ
 *         example: "TAG_260312_ab12cd34"
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy thẻ (TAG_001)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.delete('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('TAG_MANAGE'), PatientTagController.delete);

export const patientTagRoutes = router;
