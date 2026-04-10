import { Router } from 'express';
import { MasterDataController } from '../../controllers/Core/master-data.controller';
import { MasterDataItemController } from '../../controllers/Core/master-data-item.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';
import { uploadExcel } from '../../middleware/upload.middleware';

const masterDataRoutes = Router();

// Middleware: Yêu cầu đăng nhập hợp lệ, session còn hạn và phải có Role ADMIN hoặc SYSTEM
masterDataRoutes.use(verifyAccessToken);
masterDataRoutes.use(checkSessionStatus);

/**
 * @swagger
 * /api/master-data/categories:
 *   get:
 *     summary: Lấy danh sách nhóm danh mục
 *     description: |
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF
 *
 *       Trả về danh sách các nhóm danh mục nền của hệ thống.
 *       Hỗ trợ:
 *       - Tìm kiếm theo `code` hoặc `name`
 *       - Phân trang dữ liệu
 *       - Không bao gồm các bản ghi đã bị xóa mềm (`deleted_at`)
 *     tags: [1.5.2 Quản lý danh mục]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         example: MEDICAL
 *         description: Tìm kiếm theo code hoặc name
 *
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         example: 1
 *         description: Trang hiện tại
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         example: 20
 *         description: Số bản ghi mỗi trang (max 100)
 *
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       master_data_categories_id:
 *                         type: string
 *                         example: MDC_260307_BLOOD_TYPE_a1b2c3d4
 *
 *                       code:
 *                         type: string
 *                         example: BLOOD_TYPE
 *
 *                       name:
 *                         type: string
 *                         example: Nhóm máu
 *
 *                       description:
 *                         type: string
 *                         example: Danh mục các nhóm máu hệ ABO
 *
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 1
 *
 *                     page:
 *                       type: integer
 *                       example: 1
 *
 *                     limit:
 *                       type: integer
 *                       example: 20
 *
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *
 *       401:
 *         description: Chưa xác thực token (AUTH_401)
 *
 *       403:
 *         description: Không có quyền truy cập (FORBIDDEN_ACCESS)
 */
masterDataRoutes.get('/categories', authorizePermissions('MASTER_DATA_VIEW'), MasterDataController.getCategories);

/**
 * @swagger
 * /api/master-data/categories:
 *   post:
 *     summary: Tạo mới nhóm danh mục
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *       Tạo một nhóm danh mục mới cho hệ thống.
 *
 *       Quy tắc:
 *       - `code` phải **duy nhất**
 *       - `code` nên viết **IN HOA**
 *       - Không được sửa `code` sau khi đã tạo
 *
 *     tags: [1.5.2 Quản lý danh mục]
 *     security:
 *       - bearerAuth: []
 *
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
 *                 example: MEDICAL_TITLE
 *
 *               name:
 *                 type: string
 *                 example: Chức danh Y tế
 *
 *               description:
 *                 type: string
 *                 example: Danh sách học hàm học vị bác sĩ
 *
 *     responses:
 *       201:
 *         description: Tạo thành công
 *
 *       400:
 *         description: |
 *           Lỗi nghiệp vụ
 *
 *           - **MD_CAT_002**: Code đã tồn tại
 *
 *       401:
 *         description: Chưa xác thực token
 *
 *       403:
 *         description: Không có quyền truy cập
 */
masterDataRoutes.post('/categories', authorizePermissions('MASTER_DATA_CREATE'), MasterDataController.createCategory);

/**
 * @swagger
 * /api/master-data/categories/export:
 *   get:
 *     summary: Xuất danh sách nhóm danh mục ra file Excel
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *     tags: [1.5.2 Quản lý danh mục]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về file Excel (.xlsx) chứa dòng tiêu đề và dữ liệu
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
masterDataRoutes.get('/categories/export', authorizePermissions('MASTER_DATA_EXPORT'), MasterDataController.exportCategories);

/**
 * @swagger
 * /api/master-data/categories/import:
 *   post:
 *     summary: Import danh sách nhóm danh mục bằng file Excel
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *       Tải lên file Excel (.xlsx) để thêm mới hoặc cập nhật hàng loạt nhóm danh mục. Yêu cầu có cột "Mã Dữ Liệu (*)" và "Tên Danh Mục (*)".
 *     tags: [1.5.2 Quản lý danh mục]
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
 *                 description: File Excel (giới hạn 5MB)
 *     responses:
 *       200:
 *         description: Đã xử lý file thành công (gồm logs update, insert, error)
 *       400:
 *         description: Thiếu file hoặc sai định dạng
 */
masterDataRoutes.post('/categories/import', authorizePermissions('MASTER_DATA_IMPORT'), uploadExcel.single('file'), MasterDataController.importCategories);

/**
 * @swagger
 * /api/master-data/categories/{id}:
 *   get:
 *     summary: Lấy chi tiết nhóm danh mục
 *     description: |
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF
 *
 *       Lấy thông tin chi tiết của một nhóm danh mục theo ID
 *
 *     tags: [1.5.2 Quản lý danh mục]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: MDC_260307_BLOOD_TYPE_a1b2c3d4
 *         description: ID của nhóm danh mục
 *
 *     responses:
 *       200:
 *         description: Lấy dữ liệu thành công
 *
 *       404:
 *         description: |
 *           **MD_CAT_001**
 *
 *           Không tìm thấy nhóm danh mục hoặc đã bị xóa
 */
masterDataRoutes.get('/categories/:id', authorizePermissions('MASTER_DATA_VIEW'), MasterDataController.getCategoryById);

/**
 * @swagger
 * /api/master-data/categories/{id}:
 *   put:
 *     summary: Cập nhật nhóm danh mục
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *       Cập nhật thông tin nhóm danh mục.
 *
 *       Lưu ý:
 *       - Không cho phép sửa `code`
 *       - Chỉ cập nhật `name` và `description`
 *
 *     tags: [1.5.2 Quản lý danh mục]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: MDC_260307_BLOOD_TYPE_a1b2c3d4
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Nhóm máu (Cập nhật)
 *
 *               description:
 *                 type: string
 *                 example: Danh mục nhóm máu đã được cập nhật
 *
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *
 *       404:
 *         description: |
 *           **MD_CAT_001**
 *
 *           Không tìm thấy nhóm danh mục
 */
masterDataRoutes.put('/categories/:id', authorizePermissions('MASTER_DATA_UPDATE'), MasterDataController.updateCategory);

/**
 * @swagger
 * /api/master-data/categories/{id}:
 *   delete:
 *     summary: Xóa nhóm danh mục
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *       Thực hiện **Soft Delete** nhóm danh mục.
 *
 *       Hệ thống sẽ chặn xóa nếu:
 *
 *       - Danh mục đang chứa các item hoạt động (`is_active = true`)
 *
 *       Khi đó trả về lỗi:
 *
 *       **MD_CAT_003**
 *
 *     tags: [1.5.2 Quản lý danh mục]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: MDC_260307_BLOOD_TYPE_a1b2c3d4
 *
 *     responses:
 *       200:
 *         description: Xóa mềm thành công
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: Đã xóa nhóm danh mục thành công
 *
 *       400:
 *         description: |
 *           **MD_CAT_003**
 *
 *           Không thể xóa do danh mục đang chứa dữ liệu
 *
 *       404:
 *         description: |
 *           **MD_CAT_001**
 *
 *           Không tìm thấy nhóm danh mục
 */
masterDataRoutes.delete('/categories/:id', authorizePermissions('MASTER_DATA_DELETE'), MasterDataController.deleteCategory);

/**
 * MASTER DATA ITEMS (CHI TIẾT DANH MỤC)
 */

/**
 * @swagger
 * /api/master-data/categories/{categoryCode}/items/export:
 *   get:
 *     summary: Xuất danh sách chi tiết danh mục ra file Excel
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *     tags: [1.5.2 Quản lý danh mục]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trả về file Excel (.xlsx)
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
masterDataRoutes.get('/categories/:categoryCode/items/export', authorizePermissions('MASTER_DATA_EXPORT'), MasterDataItemController.exportItems);

/**
 * @swagger
 * /api/master-data/categories/{categoryCode}/items/import:
 *   post:
 *     summary: Import chi tiết danh mục bằng file Excel
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *       Tải lên file Excel (.xlsx) để thêm mới hoặc cập nhật hàng loạt chi tiết danh mục. Bắt buộc có 2 cột "Mã Giá Trị (*)" và "Giá Trị (*)".
 *     tags: [1.5.2 Quản lý danh mục]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryCode
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Đã xử lý file thành công
 *       400:
 *         description: Thiếu file hoặc sai định dạng
 */
masterDataRoutes.post('/categories/:categoryCode/items/import', authorizePermissions('MASTER_DATA_IMPORT'), uploadExcel.single('file'), MasterDataItemController.importItems);

/**
 * @swagger
 * /api/master-data/categories/{categoryCode}/items:
 *   get:
 *     summary: Lấy danh sách items để hiển thị Dropdown
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Lấy toàn bộ items của 1 category để hiển thị trên giao diện (Dropdown).
 *       Chỉ lấy các items có `is_active = true` và được sắp xếp theo `sort_order` tăng dần.
 *     tags: [1.5.2 Quản lý danh mục]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryCode
 *         required: true
 *         schema:
 *           type: string
 *         example: BLOOD_TYPE
 *         description: Mã nhóm danh mục
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
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
 *                       master_data_items_id:
 *                         type: string
 *                         example: MDI_260307_BLOOD_OTHER_a1b2c3d4
 *                       category_code:
 *                         type: string
 *                         example: BLOOD_TYPE
 *                       code:
 *                         type: string
 *                         example: A_PLUS
 *                       value:
 *                         type: string
 *                         example: Nhóm máu A
 *                       sort_order:
 *                         type: integer
 *                         example: 1
 *                       is_active:
 *                         type: boolean
 *                         example: true
 *       404:
 *         description: Mã nhóm danh mục không tồn tại
 *       401:
 *         description: Chưa xác thực token (AUTH_401)
 */
masterDataRoutes.get('/categories/:categoryCode/items', verifyAccessToken, checkSessionStatus, MasterDataItemController.getActiveItemsByCategory);

/**
 * @swagger
 * /api/master-data/items:
 *   get:
 *     summary: Lấy danh sách tất cả items (Quản trị)
 *     description: |
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF
 *
 *       Lấy danh sách chi tiết danh mục dành cho Admin.
 *       Hỗ trợ tìm kiếm theo `code` hoặc `value`, lọc theo `categoryCode`, và phân trang.
 *     tags: [1.5.2 Quản lý danh mục]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         example: PLUS
 *         description: Tìm kiếm theo code hoặc value
 *       - in: query
 *         name: categoryCode
 *         schema:
 *           type: string
 *         example: BLOOD_TYPE
 *         description: Lọc theo mã nhóm danh mục
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         example: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         example: 20
 *         description: Số bản ghi mỗi trang
 *     responses:
 *       200:
 *         description: Lấy dữ liệu thành công
 *       401:
 *         description: Lỗi xác thực
 *       403:
 *         description: Lỗi phân quyền
 */
masterDataRoutes.get('/items', authorizePermissions('MASTER_DATA_VIEW'), MasterDataItemController.getItems);

/**
 * @swagger
 * /api/master-data/categories/{categoryCode}/items:
 *   post:
 *     summary: Thêm mới 1 item
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *       Thêm mới một chi tiết danh mục vào một nhóm danh mục cụ thể.
 *     tags: [1.5.2 Quản lý danh mục]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryCode
 *         required: true
 *         schema:
 *           type: string
 *         example: BLOOD_TYPE
 *         description: Mã nhóm danh mục
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - value
 *             properties:
 *               code:
 *                 type: string
 *                 example: A_PLUS
 *               value:
 *                 type: string
 *                 example: Nhóm máu A+
 *               sort_order:
 *                 type: integer
 *                 example: 1
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Tạo mới thành công
 *       400:
 *         description: Mã chi tiết danh mục (code) đã tồn tại trong nhóm này
 *       404:
 *         description: Nhóm danh mục không tồn tại
 */
masterDataRoutes.post('/categories/:categoryCode/items', authorizePermissions('MASTER_DATA_CREATE'), MasterDataItemController.createItem);

/**
 * @swagger
 * /api/master-data/items/{id}:
 *   put:
 *     summary: Cập nhật 1 item
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *       Cập nhật thông tin của chi tiết danh mục (value, sort_order, is_active). Không hỗ trợ đổi code hoặc category_code.
 *     tags: [1.5.2 Quản lý danh mục]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: MDI_260307_BLOOD_OTHER_a1b2c3d4
 *         description: ID của chi tiết danh mục
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *                 example: Nhóm máu A hợp âm
 *               sort_order:
 *                 type: integer
 *                 example: 2
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy item
 */
masterDataRoutes.put('/items/:id', authorizePermissions('MASTER_DATA_UPDATE'), MasterDataItemController.updateItem);

/**
 * @swagger
 * /api/master-data/items/{id}:
 *   delete:
 *     summary: Vô hiệu hóa 1 item
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *       Set `is_active = false` cho item thay vì xóa cứng khỏi Database để bảo toàn dữ liệu lịch sử.
 *     tags: [1.5.2 Quản lý danh mục]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: MDI_260307_BLOOD_OTHER_a1b2c3d4
 *         description: ID của chi tiết danh mục
 *     responses:
 *       200:
 *         description: Vô hiệu hóa thành công
 *       404:
 *         description: Không tìm thấy item
 */
masterDataRoutes.delete('/items/:id', authorizePermissions('MASTER_DATA_DELETE'), MasterDataItemController.deleteItem);

export default masterDataRoutes;