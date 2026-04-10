import { Router } from 'express';
import { DrugController } from '../../controllers/Medication Management/drug.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { uploadExcel } from '../../middleware/upload.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const drugRoutes = Router();

// Middleware quyền truy cập
drugRoutes.use(verifyAccessToken);
drugRoutes.use(checkSessionStatus);

/**
 * @swagger
 * /api/pharmacy/drugs/active:
 *   get:
 *     summary: Tra cứu thuốc nhanh cho Dropdown kê đơn
 *     description: |
 *       API dùng để tra cứu nhanh thuốc đang hoạt động khi bác sĩ kê đơn hoặc nhân viên tạo phiếu xuất/nhập kho.
 *       Chỉ trả về thuốc có `is_active = TRUE`. Giới hạn tối đa 50 kết quả.
 *       Tìm kiếm theo tên thương mại (brand_name) và hoạt chất (active_ingredients).
 *
 *       **Phân quyền:** Yêu cầu quyền `DRUG_VIEW`
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
 *         description: Từ khóa tìm theo tên thuốc hoặc hoạt chất
 *         example: Paracetamol
 *     responses:
 *       200:
 *         description: Thành công (Limit 50 theo query)
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
 *                       drugs_id:
 *                         type: string
 *                       drug_code:
 *                         type: string
 *                       brand_name:
 *                         type: string
 *                       active_ingredients:
 *                         type: string
 *                       dispensing_unit:
 *                         type: string
 *                       route_of_administration:
 *                         type: string
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 */
drugRoutes.get('/active', authorizePermissions('DRUG_VIEW'), DrugController.getActiveDrugs);

/**
 * @swagger
 * /api/pharmacy/drugs/export:
 *   get:
 *     summary: Xuất danh sách thuốc ra file Excel
 *     description: |
 *       Xuất toàn bộ danh sách thuốc ra file Excel (.xlsx).
 *       Bao gồm: Mã Thuốc, Mã Quốc Gia, Tên Thuốc, Hoạt Chất, Mã Nhóm Thuốc, Đường Dùng, Đơn Vị Đóng Gói, Thuốc Kê Đơn, Kích Hoạt.
 *
 *       **Phân quyền:** Yêu cầu quyền `DRUG_EXPORT`
 *
 *       **Vai trò được phép:** ADMIN, PHARMACIST, STAFF
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
drugRoutes.get('/export', authorizePermissions('DRUG_EXPORT'), DrugController.exportDrugs);

/**
 * @swagger
 * /api/pharmacy/drugs/import:
 *   post:
 *     summary: Import danh sách thuốc bằng file Excel
 *     description: |
 *       Tải lên file Excel (.xlsx) để thêm mới hoặc cập nhật thuốc.
 *       Logic upsert: nếu mã thuốc (drug_code) đã tồn tại → cập nhật; chưa có → thêm mới.
 *       Mã Nhóm Thuốc trong Excel sẽ được map sang category_id thông qua bảng drug_categories.
 *
 *       **Cột bắt buộc:** "Mã Thuốc (*)", "Tên Thuốc (*)", "Hoạt Chất (*)", "Mã Nhóm Thuốc (*)", "Đơn Vị Đóng Gói (*)".
 *
 *       **Phân quyền:** Yêu cầu quyền `DRUG_IMPORT`
 *
 *       **Vai trò được phép:** ADMIN, PHARMACIST, STAFF
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
 *                   example: 50
 *                 inserted:
 *                   type: integer
 *                   example: 40
 *                 updated:
 *                   type: integer
 *                   example: 8
 *                 failed:
 *                   type: integer
 *                   example: 2
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
drugRoutes.post('/import', authorizePermissions('DRUG_IMPORT'), uploadExcel.single('file'), DrugController.importDrugs);

/**
 * @swagger
 * /api/pharmacy/drugs:
 *   get:
 *     summary: Lấy danh sách toàn bộ thuốc (Admin)
 *     description: |
 *       Trả về danh sách tất cả thuốc (bao gồm cả thuốc đã bị khóa) với các bộ lọc nâng cao.
 *       Hỗ trợ lọc theo nhóm thuốc, trạng thái kích hoạt, loại thuốc kê đơn, và tìm kiếm tự do.
 *
 *       **Phân quyền:** Yêu cầu quyền `DRUG_VIEW_ALL`
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
 *         description: Tìm kiếm theo mã, tên, hoạt chất hoặc mã quốc gia
 *         example: Panadol
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Lọc theo ID nhóm thuốc
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái kích hoạt
 *         example: true
 *       - in: query
 *         name: isPrescriptionOnly
 *         schema:
 *           type: boolean
 *         description: Lọc thuốc kê đơn (true) hoặc không kê đơn (false)
 *         example: true
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
 *         description: Thành công
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 */
drugRoutes.get('/', authorizePermissions('DRUG_VIEW_ALL'), DrugController.getDrugsAdmin);

/**
 * @swagger
 * /api/pharmacy/drugs:
 *   post:
 *     summary: Tạo mới thuốc
 *     description: |
 *       Tạo mới một loại thuốc vào danh mục. Validate: mã thuốc (drug_code) phải unique,
 *       mã quốc gia (national_drug_code) phải unique nếu có, nhóm thuốc (category_id) phải tồn tại.
 *
 *       **Phân quyền:** Yêu cầu quyền `DRUG_CREATE`
 *
 *       **Vai trò được phép:** ADMIN, PHARMACIST, STAFF
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
 *               - drug_code
 *               - brand_name
 *               - active_ingredients
 *               - category_id
 *               - dispensing_unit
 *             properties:
 *               drug_code:
 *                 type: string
 *                 description: Mã thuốc nội bộ (unique)
 *                 example: DRG_PANA_500
 *               national_drug_code:
 *                 type: string
 *                 description: Mã thuốc Quốc gia
 *                 example: V123-H45-67
 *               brand_name:
 *                 type: string
 *                 description: Tên thương mại
 *                 example: Panadol Extra 500mg
 *               active_ingredients:
 *                 type: string
 *                 description: Hoạt chất
 *                 example: Paracetamol 500mg, Caffeine 65mg
 *               category_id:
 *                 type: string
 *                 description: ID nhóm thuốc
 *                 example: DRC_260317_KS_abc12345
 *               route_of_administration:
 *                 type: string
 *                 description: Đường dùng thuốc (ORAL, INJECTION, TOPICAL)
 *                 example: ORAL
 *               dispensing_unit:
 *                 type: string
 *                 description: Đơn vị đóng gói
 *                 example: Viên
 *               is_prescription_only:
 *                 type: boolean
 *                 description: Thuốc kê đơn (mặc định true)
 *                 example: false
 *               is_active:
 *                 type: boolean
 *                 description: Trạng thái kích hoạt (mặc định true)
 *                 example: true
 *     responses:
 *       201:
 *         description: Tạo mới thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền tạo mới
 *       404:
 *         description: Nhóm thuốc không tồn tại (DRG_004)
 *       409:
 *         description: Mã thuốc đã tồn tại (DRG_002) hoặc mã quốc gia đã tồn tại (DRG_003)
 */
drugRoutes.post('/', authorizePermissions('DRUG_CREATE'), DrugController.createDrug);

/**
 * @swagger
 * /api/pharmacy/drugs/{id}:
 *   get:
 *     summary: Lấy chi tiết thuốc
 *     description: |
 *       Trả về thông tin chi tiết của một loại thuốc theo ID.
 *
 *       **Phân quyền:** Yêu cầu quyền `DRUG_VIEW`
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
 *         description: ID thuốc
 *         example: DRG_260317_abc123456789
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy thuốc (DRG_001)
 */
drugRoutes.get('/:id', authorizePermissions('DRUG_VIEW'), DrugController.getDrugById);

/**
 * @swagger
 * /api/pharmacy/drugs/{id}:
 *   put:
 *     summary: Cập nhật thông tin thuốc
 *     description: |
 *       Cập nhật thông tin thuốc (trừ drug_code). Nếu đổi nhóm thuốc, validate nhóm mới phải tồn tại.
 *       Nếu đổi mã quốc gia, validate không trùng với thuốc khác.
 *
 *       **Phân quyền:** Yêu cầu quyền `DRUG_UPDATE`
 *
 *       **Vai trò được phép:** ADMIN, PHARMACIST, STAFF
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
 *         description: ID thuốc
 *         example: DRG_260317_abc123456789
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
 *                 example: DRC_260317_KS_abc12345
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
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền cập nhật
 *       404:
 *         description: Không tìm thấy thuốc (DRG_001) hoặc nhóm thuốc (DRG_004)
 *       409:
 *         description: Mã quốc gia đã tồn tại (DRG_003)
 */
drugRoutes.put('/:id', authorizePermissions('DRUG_UPDATE'), DrugController.updateDrug);

/**
 * @swagger
 * /api/pharmacy/drugs/{id}/status:
 *   patch:
 *     summary: Khóa/Mở Khóa Thuốc (Toggle Active)
 *     description: |
 *       Vô hiệu hóa hoặc mở khóa thuốc bằng cách set `is_active` = true/false.
 *       Thuốc bị khóa sẽ không xuất hiện trong dropdown kê đơn nhưng vẫn hiện trong danh sách admin.
 *       Sử dụng toggle thay vì xóa để bảo toàn dữ liệu lịch sử.
 *
 *       **Phân quyền:** Yêu cầu quyền `DRUG_UPDATE`
 *
 *       **Vai trò được phép:** ADMIN, PHARMACIST, STAFF
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
 *         description: ID thuốc
 *         example: DRG_260317_abc123456789
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
 *                 description: true = mở khóa, false = vô hiệu hóa
 *                 example: false
 *     responses:
 *       200:
 *         description: Vô hiệu hóa / Mở khóa thành công
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
 *                   example: Đã vô hiệu hóa thuốc thành công.
 *                 data:
 *                   type: object
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền cập nhật
 *       404:
 *         description: Không tìm thấy thuốc (DRG_001)
 */
drugRoutes.patch('/:id/status', authorizePermissions('DRUG_UPDATE'), DrugController.toggleDrugStatus);

export { drugRoutes };
