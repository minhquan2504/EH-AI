import { Router } from 'express';
import { DrugCategoryController } from '../../controllers/Medication Management/drug-category.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { uploadExcel } from '../../middleware/upload.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const drugCategoryRoutes = Router();

// Middleware quyền truy cập
drugCategoryRoutes.use(verifyAccessToken);
drugCategoryRoutes.use(checkSessionStatus);

/**
 * @swagger
 * /api/pharmacy/categories:
 *   get:
 *     summary: Lấy danh sách nhóm thuốc
 *     description: |
 *       Trả về danh sách nhóm thuốc có phân trang và hỗ trợ tìm kiếm theo mã hoặc tên.
 *
 *       **Phân quyền:** Yêu cầu quyền `DRUG_CATEGORY_VIEW`
 *
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF
 *
 *     tags: [5.1 Quản lý danh mục thuốc]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo mã hoặc tên nhóm thuốc
 *         example: Kháng sinh
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Số trang (mặc định 1)
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng mỗi trang (mặc định 20, tối đa 100)
 *         example: 20
 *     responses:
 *       200:
 *         description: Thành công - Trả về danh sách nhóm thuốc
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
 *                       drug_categories_id:
 *                         type: string
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 */
drugCategoryRoutes.get('/', authorizePermissions('DRUG_CATEGORY_VIEW'), DrugCategoryController.getCategories);

/**
 * @swagger
 * /api/pharmacy/categories:
 *   post:
 *     summary: Tạo mới nhóm thuốc
 *     description: |
 *       Tạo mới một nhóm thuốc. Mã nhóm (code) phải là duy nhất trong hệ thống.
 *
 *       **Phân quyền:** Yêu cầu quyền `DRUG_CATEGORY_CREATE`
 *
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [5.1 Quản lý danh mục thuốc]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *             properties:
 *               code:
 *                 type: string
 *                 description: Mã nhóm thuốc (unique)
 *                 example: KS
 *               name:
 *                 type: string
 *                 description: Tên nhóm thuốc
 *                 example: Kháng sinh
 *               description:
 *                 type: string
 *                 description: Mô tả
 *                 example: Nhóm các loại thuốc kháng sinh
 *     responses:
 *       201:
 *         description: Tạo mới thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền tạo mới
 *       409:
 *         description: Mã nhóm thuốc đã tồn tại (PHM_CAT_002)
 */
drugCategoryRoutes.post('/', authorizePermissions('DRUG_CATEGORY_CREATE'), DrugCategoryController.createCategory);

/**
 * @swagger
 * /api/pharmacy/categories/export:
 *   get:
 *     summary: Xuất danh sách nhóm thuốc ra file Excel
 *     description: |
 *       Xuất toàn bộ danh sách nhóm thuốc (chưa bị xóa) ra file Excel (.xlsx).
 *       Cột dữ liệu: Mã Nhóm Thuốc, Tên Nhóm Thuốc, Mô Tả.
 *
 *       **Phân quyền:** Yêu cầu quyền `DRUG_CATEGORY_EXPORT`
 *
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [5.1 Quản lý danh mục thuốc]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về file Excel (.xlsx)
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền xuất dữ liệu
 */
drugCategoryRoutes.get('/export', authorizePermissions('DRUG_CATEGORY_EXPORT'), DrugCategoryController.exportCategories);

/**
 * @swagger
 * /api/pharmacy/categories/import:
 *   post:
 *     summary: Import danh sách nhóm thuốc bằng file Excel
 *     description: |
 *       Tải lên file Excel (.xlsx) để thêm mới hoặc cập nhật nhóm thuốc.
 *       Logic upsert: nếu mã nhóm (code) đã tồn tại → cập nhật tên & mô tả; chưa có → thêm mới.
 *
 *       **Cột bắt buộc:** "Mã Nhóm Thuốc (*)" và "Tên Nhóm Thuốc (*)".
 *
 *       **Phân quyền:** Yêu cầu quyền `DRUG_CATEGORY_IMPORT`
 *
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [5.1 Quản lý danh mục thuốc]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File Excel (.xlsx)
 *     responses:
 *       200:
 *         description: Đã xử lý file thành công
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
 *                   example: Đã xử lý file Excel thành công.
 *                 total_rows_processed:
 *                   type: integer
 *                   example: 10
 *                 inserted:
 *                   type: integer
 *                   example: 7
 *                 updated:
 *                   type: integer
 *                   example: 2
 *                 failed:
 *                   type: integer
 *                   example: 1
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Thiếu file hoặc sai định dạng
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền import
 */
drugCategoryRoutes.post('/import', authorizePermissions('DRUG_CATEGORY_IMPORT'), uploadExcel.single('file'), DrugCategoryController.importCategories);

/**
 * @swagger
 * /api/pharmacy/categories/{id}:
 *   get:
 *     summary: Lấy chi tiết nhóm thuốc
 *     description: |
 *       Trả về thông tin chi tiết của một nhóm thuốc theo ID.
 *
 *       **Phân quyền:** Yêu cầu quyền `DRUG_CATEGORY_VIEW`
 *
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF
 *
 *     tags: [5.1 Quản lý danh mục thuốc]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID nhóm thuốc
 *         example: DRC_260317_KS_abc12345
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy nhóm thuốc (PHM_CAT_001)
 */
drugCategoryRoutes.get('/:id', authorizePermissions('DRUG_CATEGORY_VIEW'), DrugCategoryController.getCategoryById);

/**
 * @swagger
 * /api/pharmacy/categories/{id}:
 *   put:
 *     summary: Cập nhật nhóm thuốc
 *     description: |
 *       Cập nhật tên hoặc mô tả nhóm thuốc. Không cho phép đổi mã code.
 *
 *       **Phân quyền:** Yêu cầu quyền `DRUG_CATEGORY_UPDATE`
 *
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [5.1 Quản lý danh mục thuốc]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID nhóm thuốc
 *         example: DRC_260317_KS_abc12345
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Kháng sinh tiêm
 *               description:
 *                 type: string
 *                 example: Nhóm thuốc kháng sinh dạng tiêm truyền
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền cập nhật
 *       404:
 *         description: Không tìm thấy nhóm thuốc (PHM_CAT_001)
 */
drugCategoryRoutes.put('/:id', authorizePermissions('DRUG_CATEGORY_UPDATE'), DrugCategoryController.updateCategory);

/**
 * @swagger
 * /api/pharmacy/categories/{id}:
 *   delete:
 *     summary: Xóa nhóm thuốc (Soft Delete)
 *     description: |
 *       Xóa mềm nhóm thuốc (set deleted_at). Không cho phép xóa nếu nhóm đang chứa thuốc.
 *
 *       **Phân quyền:** Yêu cầu quyền `DRUG_CATEGORY_DELETE`
 *
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [5.1 Quản lý danh mục thuốc]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID nhóm thuốc
 *         example: DRC_260317_KS_abc12345
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền xóa
 *       404:
 *         description: Không tìm thấy nhóm thuốc (PHM_CAT_001)
 *       409:
 *         description: Nhóm đang chứa thuốc, không thể xóa (PHM_CAT_003)
 */
drugCategoryRoutes.delete('/:id', authorizePermissions('DRUG_CATEGORY_DELETE'), DrugCategoryController.deleteCategory);

export { drugCategoryRoutes };
