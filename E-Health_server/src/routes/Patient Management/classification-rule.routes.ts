import { Router } from 'express';
import { ClassificationRuleController } from '../../controllers/Patient Management/classification-rule.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const router = Router();

/**
 * @swagger
 * /api/patient-classification-rules:
 *   post:
 *     summary: Tạo mới luật phân loại bệnh nhân
 *     description: |
 *       **Chức năng:** Thiết lập một luật (rule) để hệ thống tự động gắn thẻ cho bệnh nhân.
 *       Ví dụ: "Khám > 10 lần/năm → gắn tag VIP".
 *
 *       **Các loại tiêu chí hỗ trợ:**
 *       - `VISIT_COUNT`: Số lần khám.
 *       - `DIAGNOSIS`: Mã chẩn đoán ICD-10.
 *       - `TOTAL_SPEND`: Tổng chi tiêu.
 *
 *       **Toán tử:** `>`, `<`, `=`, `>=`, `<=`, `IN`.
 *
 *       **Phân quyền:** Yêu cầu quyền `TAG_MANAGE`.
 *       **Vai trò được phép:** Admin, Staff.
 *     tags: [2.6.5 Luật phân loại tự động]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, criteria_type, criteria_operator, criteria_value, target_tag_id]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Auto VIP - Khám trên 10 lần/năm"
 *               criteria_type:
 *                 type: string
 *                 enum: [VISIT_COUNT, DIAGNOSIS, TOTAL_SPEND]
 *                 example: "VISIT_COUNT"
 *               criteria_operator:
 *                 type: string
 *                 enum: [">", "<", "=", ">=", "<=", "IN"]
 *                 example: ">="
 *               criteria_value:
 *                 type: string
 *                 example: "10"
 *               target_tag_id:
 *                 type: string
 *                 description: ID thẻ sẽ gắn khi thỏa mãn
 *                 example: "TAG_260312_ab12cd34"
 *               timeframe_days:
 *                 type: integer
 *                 nullable: true
 *                 description: Khung thời gian (ngày). Null = tính all time
 *                 example: 365
 *     responses:
 *       201:
 *         description: Tạo luật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ (RUL_002/003/005)
 *       404:
 *         description: Tag đích không tồn tại (RUL_004)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.post('/', verifyAccessToken, checkSessionStatus, authorizePermissions('TAG_MANAGE'), ClassificationRuleController.create);

/**
 * @swagger
 * /api/patient-classification-rules:
 *   get:
 *     summary: Danh sách luật phân loại
 *     description: |
 *       **Chức năng:** Trả về danh sách tất cả luật phân loại trong hệ thống (phân trang).
 *       Mỗi rule bao gồm thông tin tag đích (code, tên, mã màu).
 *
 *       **Phân quyền:** Yêu cầu quyền `TAG_VIEW`.
 *       **Vai trò được phép:** Admin, Staff.
 *     tags: [2.6.5 Luật phân loại tự động]
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
 *         description: Danh sách luật (phân trang, kèm thông tin tag đích)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/', verifyAccessToken, checkSessionStatus, authorizePermissions('TAG_VIEW'), ClassificationRuleController.getAll);

/**
 * @swagger
 * /api/patient-classification-rules/{id}:
 *   get:
 *     summary: Chi tiết luật phân loại
 *     description: |
 *       **Chức năng:** Lấy thông tin chi tiết một luật theo ID.
 *
 *       **Phân quyền:** Yêu cầu quyền `TAG_VIEW`.
 *       **Vai trò được phép:** Admin, Staff.
 *     tags: [2.6.5 Luật phân loại tự động]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "RUL_260312_ab12cd34"
 *     responses:
 *       200:
 *         description: Thông tin chi tiết rule
 *       404:
 *         description: Không tìm thấy (RUL_001)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('TAG_VIEW'), ClassificationRuleController.getById);

/**
 * @swagger
 * /api/patient-classification-rules/{id}:
 *   put:
 *     summary: Cập nhật luật phân loại
 *     description: |
 *       **Chức năng:** Sửa cấu hình luật phân loại (tên, tiêu chí, tag đích, trạng thái).
 *
 *       **Phân quyền:** Yêu cầu quyền `TAG_MANAGE`.
 *       **Vai trò được phép:** Admin, Staff.
 *     tags: [2.6.5 Luật phân loại tự động]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "RUL_260312_ab12cd34"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Auto VIP - Khám trên 15 lần/năm"
 *               criteria_value:
 *                 type: string
 *                 example: "15"
 *               is_active:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy (RUL_001)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.put('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('TAG_MANAGE'), ClassificationRuleController.update);

/**
 * @swagger
 * /api/patient-classification-rules/{id}:
 *   delete:
 *     summary: Xóa luật phân loại (soft delete)
 *     description: |
 *       **Chức năng:** Vô hiệu hóa luật phân loại (`deleted_at` + `is_active = false`).
 *       Dữ liệu cấu hình vẫn được lưu để tham khảo.
 *
 *       **Phân quyền:** Yêu cầu quyền `TAG_MANAGE`.
 *       **Vai trò được phép:** Admin, Staff.
 *     tags: [2.6.5 Luật phân loại tự động]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "RUL_260312_ab12cd34"
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy (RUL_001)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.delete('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('TAG_MANAGE'), ClassificationRuleController.delete);

export const classificationRuleRoutes = router;
