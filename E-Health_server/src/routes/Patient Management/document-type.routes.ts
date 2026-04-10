// src/routes/Patient Management/document-type.routes.ts
import { Router } from 'express';
import { DocumentTypeController } from '../../controllers/Patient Management/document-type.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const router = Router();

/**
 * @swagger
 * /api/document-types:
 *   get:
 *     summary: Danh sách loại tài liệu
 *     description: |
 *       **Chức năng:** Trả về toàn bộ danh mục loại tài liệu đang hoạt động trong hệ thống.
 *       Dùng cho dropdown chọn "Loại tài liệu" khi upload tài liệu bệnh nhân.
 *
 *       **Phân quyền:** Yêu cầu quyền `DOCUMENT_TYPE_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.5.2 Phân loại tài liệu]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách loại tài liệu
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
 *                       document_type_id:
 *                         type: string
 *                         example: "DCT_260312_a1b2c3d4"
 *                       code:
 *                         type: string
 *                         example: "CMND"
 *                       name:
 *                         type: string
 *                         example: "Giấy CMND / CCCD"
 *                       description:
 *                         type: string
 *                         example: "Căn cước công dân hoặc chứng minh nhân dân"
 *                       is_active:
 *                         type: boolean
 *                         example: true
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/', verifyAccessToken, checkSessionStatus, authorizePermissions('DOCUMENT_TYPE_VIEW'), DocumentTypeController.getAll);

/**
 * @swagger
 * /api/document-types:
 *   post:
 *     summary: Tạo mới loại tài liệu
 *     description: |
 *       **Chức năng:** Thêm một loại tài liệu mới vào danh mục hệ thống.
 *       Mã code sẽ được tự động chuyển sang UPPERCASE.
 *       Nếu mã code đã tồn tại, API trả về lỗi trùng lặp (DCT_002).
 *
 *       **Phân quyền:** Yêu cầu quyền `DOCUMENT_TYPE_MANAGE`.
 *       **Vai trò được phép:** Admin, Staff.
 *     tags: [2.5.2 Phân loại tài liệu]
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
 *                 description: Mã loại tài liệu (sẽ tự chuyển UPPERCASE)
 *                 example: "GIAY_KHAM_SK"
 *               name:
 *                 type: string
 *                 description: Tên hiển thị loại tài liệu
 *                 example: "Giấy khám sức khỏe"
 *               description:
 *                 type: string
 *                 description: Mô tả thêm
 *                 example: "Giấy khám sức khỏe tổng quát"
 *               is_active:
 *                 type: boolean
 *                 description: Trạng thái hoạt động
 *                 example: true
 *     responses:
 *       201:
 *         description: Tạo loại tài liệu thành công
 *       400:
 *         description: Thiếu trường bắt buộc (DCT_004) hoặc mã code đã tồn tại (DCT_002)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.post('/', verifyAccessToken, checkSessionStatus, authorizePermissions('DOCUMENT_TYPE_MANAGE'), DocumentTypeController.create);

/**
 * @swagger
 * /api/document-types/{id}:
 *   put:
 *     summary: Cập nhật loại tài liệu
 *     description: |
 *       **Chức năng:** Cập nhật thông tin loại tài liệu theo ID.
 *       Chỉ các trường được gửi trong body mới được cập nhật (Partial Update).
 *       Nếu đổi code, hệ thống sẽ kiểm tra trùng lặp.
 *
 *       **Phân quyền:** Yêu cầu quyền `DOCUMENT_TYPE_MANAGE`.
 *       **Vai trò được phép:** Admin, Staff.
 *     tags: [2.5.2 Phân loại tài liệu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID loại tài liệu
 *         example: "DCT_260312_a1b2c3d4"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: "GIAY_KHAM_SK"
 *               name:
 *                 type: string
 *                 example: "Giấy khám sức khỏe (Cập nhật)"
 *               description:
 *                 type: string
 *                 example: "Giấy khám sức khỏe tổng quát bổ sung"
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Mã code đã tồn tại (DCT_002)
 *       404:
 *         description: Không tìm thấy loại tài liệu (DCT_001)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.put('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('DOCUMENT_TYPE_MANAGE'), DocumentTypeController.update);

/**
 * @swagger
 * /api/document-types/{id}:
 *   delete:
 *     summary: Xóa loại tài liệu (soft delete)
 *     description: |
 *       **Chức năng:** Xóa mềm loại tài liệu. Nếu loại tài liệu đang được sử dụng
 *       bởi bất kỳ hồ sơ tài liệu bệnh nhân nào trong bảng `patient_documents`,
 *       hệ thống sẽ từ chối xóa và trả về lỗi (DCT_003).
 *
 *       **Phân quyền:** Yêu cầu quyền `DOCUMENT_TYPE_MANAGE`.
 *       **Vai trò được phép:** Admin, Staff.
 *     tags: [2.5.2 Phân loại tài liệu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID loại tài liệu
 *         example: "DCT_260312_a1b2c3d4"
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       400:
 *         description: Loại tài liệu đang được sử dụng, không thể xóa (DCT_003)
 *       404:
 *         description: Không tìm thấy loại tài liệu (DCT_001)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.delete('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('DOCUMENT_TYPE_MANAGE'), DocumentTypeController.delete);

export const documentTypeRoutes = router;
