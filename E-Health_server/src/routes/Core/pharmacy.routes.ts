import { Router } from 'express';
import { DrugCategoryController } from '../../controllers/Core/drug-category.controller';
import { DrugController } from '../../controllers/Core/drug.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { uploadExcel } from '../../middleware/upload.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const pharmacyRoutes = Router();

// Middleware quyền truy cập
pharmacyRoutes.use(verifyAccessToken);
pharmacyRoutes.use(checkSessionStatus);

/**
 * PHARMACY - DRUG CATEGORIES (NHÓM THUỐC)
 */

/**
 * @swagger
 * /api/pharmacy/categories:
 *   get:
 *     summary: Lấy danh sách nhóm thuốc
 *     description: |
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF
 *
 *     tags: [1.5.3 Quản lý danh mục thuốc]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         example: Kháng sinh
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         example: 20
 *     responses:
 *       200:
 *         description: Thành công
 */
pharmacyRoutes.get('/categories', authorizePermissions('DRUG_CATEGORY_VIEW'), DrugCategoryController.getCategories);

/**
 * @swagger
 * /api/pharmacy/categories:
 *   post:
 *     summary: Tạo mới nhóm thuốc
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [1.5.3 Quản lý danh mục thuốc]
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
 *                 example: KS
 *               name:
 *                 type: string
 *                 example: Kháng sinh
 *               description:
 *                 type: string
 *                 example: Nhóm các loại thuốc kháng sinh
 *     responses:
 *       201:
 *         description: Thành công
 */
pharmacyRoutes.post('/categories', authorizePermissions('DRUG_CATEGORY_CREATE'), DrugCategoryController.createCategory);

/**
 * @swagger
 * /api/pharmacy/categories/export:
 *   get:
 *     summary: Xuất danh sách nhóm thuốc ra file Excel
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [1.5.3 Quản lý danh mục thuốc]
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
 */
pharmacyRoutes.get('/categories/export', authorizePermissions('DRUG_CATEGORY_EXPORT'), DrugCategoryController.exportCategories);

/**
 * @swagger
 * /api/pharmacy/categories/import:
 *   post:
 *     summary: Import danh sách nhóm thuốc bằng file Excel
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *       Tải lên file Excel (.xlsx) để thêm mới hoặc cập nhật nhóm thuốc. Yêu cầu cột "Mã Nhóm Thuốc (*)" và "Tên Nhóm Thuốc (*)".
 *     tags: [1.5.3 Quản lý danh mục thuốc]
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
 *     responses:
 *       200:
 *         description: Đã xử lý file thành công
 *       400:
 *         description: Thiếu file hoặc sai định dạng
 */
pharmacyRoutes.post('/categories/import', authorizePermissions('DRUG_CATEGORY_IMPORT'), uploadExcel.single('file'), DrugCategoryController.importCategories);

/**
 * @swagger
 * /api/pharmacy/categories/{id}:
 *   get:
 *     summary: Lấy chi tiết nhóm thuốc
 *     description: |
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF
 *
 *     tags: [1.5.3 Quản lý danh mục thuốc]
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
 *         description: Thành công
 */
pharmacyRoutes.get('/categories/:id', authorizePermissions('DRUG_CATEGORY_VIEW'), DrugCategoryController.getCategoryById);

/**
 * @swagger
 * /api/pharmacy/categories/{id}:
 *   put:
 *     summary: Cập nhật nhóm thuốc
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [1.5.3 Quản lý danh mục thuốc]
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
 *               name:
 *                 type: string
 *                 example: Kháng sinh tiêm
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
pharmacyRoutes.put('/categories/:id', authorizePermissions('DRUG_CATEGORY_UPDATE'), DrugCategoryController.updateCategory);

/**
 * @swagger
 * /api/pharmacy/categories/{id}:
 *   delete:
 *     summary: Xóa nhóm thuốc
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [1.5.3 Quản lý danh mục thuốc]
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
 *         description: Thành công
 */
pharmacyRoutes.delete('/categories/:id', authorizePermissions('DRUG_CATEGORY_DELETE'), DrugCategoryController.deleteCategory);

/**
 * =========================================================================
 * PHARMACY - DRUGS (TỪ ĐIỂN THUỐC)
 * =========================================================================
 */

/**
 * @swagger
 * /api/pharmacy/drugs/active:
 *   get:
 *     summary: Lấy danh sách thuốc cho Dropdown (Tìm kiếm theo Hoạt chất & Tên hãng)
 *     description: |
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF
 *
 *       API dùng để tra cứu nhanh khi bác sĩ kê đơn hoặc nhân viên tạo phiếu xuất/nhập kho.
 *     tags: [1.5.3 Quản lý danh mục thuốc]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         example: Paracetamol
 *     responses:
 *       200:
 *         description: Thành công (Limit 50 theo query)
 */
pharmacyRoutes.get('/drugs/active', authorizePermissions('DRUG_VIEW'), DrugController.getActiveDrugs);

/**
 * @swagger
 * /api/pharmacy/drugs/export:
 *   get:
 *     summary: Xuất danh sách thuốc ra file Excel
 *     description: |
 *       **Vai trò được phép:** ADMIN, PHARMACIST, STAFF
 *
 *     tags: [1.5.3 Quản lý danh mục thuốc]
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
 */
pharmacyRoutes.get('/drugs/export', authorizePermissions('DRUG_EXPORT'), DrugController.exportDrugs);

/**
 * @swagger
 * /api/pharmacy/drugs/import:
 *   post:
 *     summary: Import danh sách thuốc bằng file Excel
 *     description: |
 *       **Vai trò được phép:** ADMIN, PHARMACIST, STAFF
 *
 *       Tải lên file Excel (.xlsx) để thêm mới hoặc cập nhật thuốc. Bắt buộc có các cột "Mã Thuốc (*)", "Tên Thuốc (*)", "Hoạt Chất (*)", "Mã Nhóm Thuốc (*)" và "Đơn Vị Đóng Gói (*)".
 *     tags: [1.5.3 Quản lý danh mục thuốc]
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
 *     responses:
 *       200:
 *         description: Đã xử lý file thành công
 *       400:
 *         description: Thiếu file hoặc sai định dạng
 */
pharmacyRoutes.post('/drugs/import', authorizePermissions('DRUG_IMPORT'), uploadExcel.single('file'), DrugController.importDrugs);

/**
 * @swagger
 * /api/pharmacy/drugs:
 *   get:
 *     summary: Lấy danh sách Toàn bộ thuốc (Admin)
 *     description: |
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF
 *
 *     tags: [1.5.3 Quản lý danh mục thuốc]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isPrescriptionOnly
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
pharmacyRoutes.get('/drugs', authorizePermissions('DRUG_VIEW_ALL'), DrugController.getDrugsAdmin);

/**
 * @swagger
 * /api/pharmacy/drugs:
 *   post:
 *     summary: Tạo mới thuốc
 *     description: |
 *       **Vai trò được phép:** ADMIN, PHARMACIST, STAFF
 *
 *     tags: [1.5.3 Quản lý danh mục thuốc]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - drug_code
 *               - brand_name
 *               - active_ingredients
 *               - category_id
 *               - dispensing_unit
 *             properties:
 *               drug_code:
 *                 type: string
 *                 example: DRG_PANA_500
 *               national_drug_code:
 *                 type: string
 *                 example: V123-H45-67
 *               brand_name:
 *                 type: string
 *                 example: Panadol Extra 500mg
 *               active_ingredients:
 *                 type: string
 *                 example: Paracetamol 500mg, Caffeine 65mg
 *               category_id:
 *                 type: string
 *                 example: UUID_OF_CATEGORY
 *               route_of_administration:
 *                 type: string
 *                 example: ORAL
 *               dispensing_unit:
 *                 type: string
 *                 example: Viên
 *               is_prescription_only:
 *                 type: boolean
 *                 example: false
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Tạo mới thành công
 */
pharmacyRoutes.post('/drugs', authorizePermissions('DRUG_CREATE'), DrugController.createDrug);

/**
 * @swagger
 * /api/pharmacy/drugs/{id}:
 *   get:
 *     summary: Lấy chi tiết thuốc
 *     description: |
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF
 *
 *     tags: [1.5.3 Quản lý danh mục thuốc]
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
 *         description: Thành công
 */
pharmacyRoutes.get('/drugs/:id', authorizePermissions('DRUG_VIEW'), DrugController.getDrugById);

/**
 * @swagger
 * /api/pharmacy/drugs/{id}:
 *   put:
 *     summary: Cập nhật thông tin thuốc
 *     description: |
 *       **Vai trò được phép:** ADMIN, PHARMACIST, STAFF
 *
 *     tags: [1.5.3 Quản lý danh mục thuốc]
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
 *               national_drug_code:
 *                 type: string
 *                 example: V123-H45-67
 *               brand_name:
 *                 type: string
 *                 example: Panadol Extra 500mg (Update)
 *               active_ingredients:
 *                 type: string
 *                 example: Paracetamol 500mg, Caffeine 65mg
 *               category_id:
 *                 type: string
 *                 example: UUID_OF_CATEGORY
 *               route_of_administration:
 *                 type: string
 *                 example: ORAL
 *               dispensing_unit:
 *                 type: string
 *                 example: Viên sủi
 *               is_prescription_only:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Thành công
 */
pharmacyRoutes.put('/drugs/:id', authorizePermissions('DRUG_UPDATE'), DrugController.updateDrug);

/**
 * @swagger
 * /api/pharmacy/drugs/{id}/status:
 *   patch:
 *     summary: Khóa/Mở Khóa Thuốc (Toggle Active)
 *     description: |
 *       **Vai trò được phép:** ADMIN, PHARMACIST, STAFF
 *
 *       Set is_active thành true/false thay vì xóa thuốc.
 *     tags: [1.5.3 Quản lý danh mục thuốc]
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
 *             required:
 *               - is_active
 *             properties:
 *               is_active:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Vô hiệu hóa thành công
 */
pharmacyRoutes.patch('/drugs/:id/status', authorizePermissions('DRUG_UPDATE'), DrugController.toggleDrugStatus);

export default pharmacyRoutes;
