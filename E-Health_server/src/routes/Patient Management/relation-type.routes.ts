// src/routes/Patient Management/relation-type.routes.ts
import { Router } from 'express';
import { RelationTypeController } from '../../controllers/Patient Management/relation-type.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const router = Router();

/**
 * @swagger
 * /api/relation-types:
 *   get:
 *     summary: Danh sách loại quan hệ (Relation Types)
 *     description: |
 *       **Chức năng:** Trả về toàn bộ danh mục loại quan hệ đang hoạt động trong hệ thống.
 *       Dùng cho dropdown chọn "Mối quan hệ" khi thêm người thân cho bệnh nhân.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_RELATION_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.4.2 Quản lý Loại quan hệ]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách loại quan hệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       relation_types_id:
 *                         type: string
 *                         example: "REL_260312_a1b2c3d4"
 *                       code:
 *                         type: string
 *                         example: "FATHER"
 *                       name:
 *                         type: string
 *                         example: "Cha"
 *                       description:
 *                         type: string
 *                         example: "Cha ruột/Cha đi kèm"
 *                       is_active:
 *                         type: boolean
 *                         example: true
 *       401:
 *         description: Chưa xác thực (Token không hợp lệ hoặc hết hạn)
 *       403:
 *         description: Không có quyền truy cập
 */
router.get('/', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_RELATION_VIEW'), RelationTypeController.getAll);

/**
 * @swagger
 * /api/relation-types:
 *   post:
 *     summary: Tạo mới loại quan hệ
 *     description: |
 *       **Chức năng:** Thêm một loại quan hệ mới vào danh mục hệ thống.
 *       Mã code sẽ được tự động chuyển sang UPPERCASE.
 *       Nếu mã code đã tồn tại, API trả về lỗi trùng lặp.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_RELATION_MANAGE`.
 *       **Vai trò được phép:** Admin, Staff.
 *     tags: [2.4.2 Quản lý Loại quan hệ]
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
 *                 description: Mã loại quan hệ (ví dụ FATHER, MOTHER, SPOUSE)
 *                 example: "UNCLE"
 *               name:
 *                 type: string
 *                 description: Tên hiển thị loại quan hệ
 *                 example: "Chú / Bác"
 *               description:
 *                 type: string
 *                 description: Mô tả thêm
 *                 example: "Chú ruột, bác ruột"
 *               is_active:
 *                 type: boolean
 *                 description: Trạng thái hoạt động
 *                 example: true
 *     responses:
 *       201:
 *         description: Tạo loại quan hệ thành công
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
 *                   example: "Tạo loại quan hệ thành công."
 *                 data:
 *                   type: object
 *       400:
 *         description: Thiếu trường bắt buộc hoặc mã code đã tồn tại
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.post('/', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_RELATION_MANAGE'), RelationTypeController.create);

/**
 * @swagger
 * /api/relation-types/{id}:
 *   put:
 *     summary: Cập nhật loại quan hệ
 *     description: |
 *       **Chức năng:** Cập nhật thông tin loại quan hệ theo ID.
 *       Chỉ các trường được gửi trong body mới được cập nhật (Partial Update).
 *       Nếu đổi code, hệ thống sẽ kiểm tra trùng lặp.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_RELATION_MANAGE`.
 *       **Vai trò được phép:** Admin, Staff.
 *     tags: [2.4.2 Quản lý Loại quan hệ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID loại quan hệ
 *         example: "REL_260312_a1b2c3d4"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: "UNCLE"
 *               name:
 *                 type: string
 *                 example: "Chú / Bác (Cập nhật)"
 *               description:
 *                 type: string
 *                 example: "Chú, bác bên nội/ngoại"
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Mã code đã tồn tại
 *       404:
 *         description: Không tìm thấy loại quan hệ
 */
router.put('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_RELATION_MANAGE'), RelationTypeController.update);

/**
 * @swagger
 * /api/relation-types/{id}:
 *   delete:
 *     summary: Xóa loại quan hệ (soft delete)
 *     description: |
 *       **Chức năng:** Xóa mềm loại quan hệ. Nếu loại quan hệ này đang được sử dụng
 *       bởi bất kỳ hồ sơ người thân nào trong bảng `patient_contacts`, hệ thống sẽ
 *       từ chối xóa và trả về lỗi 400.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_RELATION_MANAGE`.
 *       **Vai trò được phép:** Admin, Staff.
 *     tags: [2.4.2 Quản lý Loại quan hệ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID loại quan hệ
 *         example: "REL_260312_a1b2c3d4"
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       400:
 *         description: Loại quan hệ đang được sử dụng, không thể xóa
 *       404:
 *         description: Không tìm thấy loại quan hệ
 */
router.delete('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_RELATION_MANAGE'), RelationTypeController.delete);

export const relationTypeRoutes = router;
