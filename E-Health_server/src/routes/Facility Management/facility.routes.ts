import { Router } from 'express';
import { FacilityController } from '../../controllers/Facility Management/facility.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizeApi } from '../../middleware/authorizeApi.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';
import multer from 'multer';

// Multer lưu trữ buffer lên RAM xử lý đẩy qua Cloudinary
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

const facilityRoutes = Router();

/**
 * @swagger
 * /api/facilities/dropdown:
 *   get:
 *     summary: 1. Lấy danh sách Cơ sở Y tế (Dropdown)
 *     description: |
 *       **Mục đích:** API dùng để lấy danh sách rút gọn các Cơ sở y tế có trạng thái `ACTIVE` cho người dùng chọn lọc trên Client Form.
 *       **Phân quyền:** Yêu cầu đăng nhập hợp lệ (`verifyAccessToken`).
 *       **Vai trò được phép:** Tất cả (Admin, Staff, Doctor, Nurse, Pharmacist)
 *     tags: [2.1 Quản lý Cơ sở Y tế]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về mảng danh sách thả xuống thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - facilities_id: "FCL_123456"
 *                     code: "FCL-MED"
 *                     name: "Bệnh viện Đa khoa Medlatec"
 */
facilityRoutes.get('/dropdown', verifyAccessToken, FacilityController.getFacilitiesForDropdown);

/**
 * @swagger
 * /api/facilities:
 *   get:
 *     summary: 2. Lấy danh sách Cơ sở y tế (Phân trang)
 *     description: |
 *       **Mục đích:** API lấy toàn bộ danh sách chi tiết các cơ sở y tế với các chức năng tối ưu truy vấn dữ liệu như tìm kiếm từ khóa, lọc tình trạng hoạt động và phân trang.
 *       **Phân quyền:** Yêu cầu quyền `FACILITY_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Doctor, Nurse, Pharmacist
 *     tags: [2.1 Quản lý Cơ sở Y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: "Tìm kiếm chuỗi theo mã, tên, email, số điện thoại."
 *         example: "Medlatec"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, SUSPENDED]
 *         description: "Lọc cơ sở theo tình trạng hoạt động. (Mặc định lấy tất cả)"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: "Số thứ tự trang."
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: "Số lượng bản ghi xuất hiện trên từng trang."
 *     responses:
 *       200:
 *         description: Cấu trúc JSON chuẩn trả về danh sách phân trang (Pagination).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   items:
 *                     - facilities_id: "FCL_123"
 *                       code: "FCL-MED"
 *                       name: "Bệnh viện Đa khoa Medlatec"
 *                       tax_code: "0101234567"
 *                       email: "contact@medlatec.vn"
 *                       phone: "0909123456"
 *                       website: "https://medlatec.vn"
 *                       headquarters_address: "123 Láng Hạ, Đống Đa, HN"
 *                       logo_url: "https://res.cloudinary.com/..."
 *                       status: "ACTIVE"
 *                   pagination:
 *                     page: 1
 *                     limit: 10
 *                     total_records: 12
 *                     total_pages: 2
 *       403:
 *         description: Không có quyền truy cập.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 error_code: "FORBIDDEN_ACCESS"
 *                 message: "Bạn không có quyền thực hiện thao tác này. Yêu cầu một trong các quyền: FACILITY_VIEW"
 */
facilityRoutes.get('/',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('FACILITY_VIEW'),
    FacilityController.getFacilities
);

/**
 * @swagger
 * /api/facilities/{id}:
 *   get:
 *     summary: 3. Lấy chi tiết 1 Cơ sở y tế
 *     description: |
 *       **Mục đích:** API Lấy chi tiết thông tin của một cơ sở y tế dựa theo `id`.
 *       **Phân quyền:** Yêu cầu quyền `FACILITY_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Doctor, Nurse, Pharmacist
 *     tags: [2.1 Quản lý Cơ sở Y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "FCL_123"
 *         description: "ID UUID/String của Cơ sở Y tế"
 *     responses:
 *       200:
 *         description: Thành công trả về thông tin chi tiết.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   facilities_id: "FCL_123"
 *                   code: "FCL-MED"
 *                   name: "Bệnh viện Medlatec"
 *                   tax_code: "0101234567"
 *                   email: "contact@medlatec.vn"
 *                   phone: "0909123456"
 *                   website: "https://medlatec.vn"
 *                   headquarters_address: "123 Láng Hạ, Đống Đa, Hà Nội"
 *                   logo_url: "https://res.cloudinary.com/logo.png"
 *                   status: "ACTIVE"
 *       404:
 *         description: Không tìm thấy Facility.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 error_code: "SYS_001"
 *                 message: "Không tìm thấy thông tin cơ sở y tế."
 */
facilityRoutes.get('/:id',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('FACILITY_VIEW'),
    FacilityController.getFacilityById
);

/**
 * @swagger
 * /api/facilities:
 *   post:
 *     summary: 4. Thêm mới Cơ sở y tế (Hỗ trợ upload Image)
 *     description: |
 *       **Mục đích:** Khởi tạo một cơ sở khám chữa bệnh nguyên gốc. Mã `code` phải là duy nhất. API hỗ trợ `multipart/form-data` để upload hình ảnh trực tiếp lên **Cloudinary**.
 *       **Phân quyền:** Yêu cầu quyền `FACILITY_CREATE`.
 *       **Vai trò được phép:** Admin, Staff
 *     tags: [2.1 Quản lý Cơ sở Y tế]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *             properties:
 *               code:
 *                 type: string
 *                 example: "FCL_HM"
 *                 description: "Mã định danh duy nhất của cơ sở"
 *               name:
 *                 type: string
 *                 example: "Phòng khám Đa khoa Hoàn Mỹ"
 *                 description: "Tên cơ sở"
 *               tax_code:
 *                 type: string
 *                 example: "0101234567"
 *                 description: "Mã số thuế"
 *               email:
 *                 type: string
 *                 example: "contact@hoanmy.vn"
 *                 description: "Hòm thư"
 *               phone:
 *                 type: string
 *                 example: "0909123456"
 *                 description: "Điện thoại liên hệ"
 *               website:
 *                 type: string
 *                 example: "https://hoanmy.vn"
 *                 description: "Đường dẫn website trang chủ"
 *               headquarters_address:
 *                 type: string
 *                 example: "Số 1 Tân Bình, TP.HCM"
 *                 description: "Vị trí địa lý trụ sở chính"
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: "File ảnh thương hiệu (Optional) (Đuôi JPG, PNG, WEBP. Max 5MB)"
 *     responses:
 *       201:
 *         description: Tạo mới thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Tạo Cơ sở Y tế thành công"
 *                 data:
 *                   facility_id: "FCL_abc123"
 *       400:
 *         description: Validation lỗi, trùng mã, hoặc định dạng ảnh sai.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 message: "Chỉ cho phép định dạng hình ảnh!"
 *                 error_code: "SYS_002"
 */
facilityRoutes.post('/',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('FACILITY_CREATE'),
    upload.single('logo'),
    FacilityController.createFacility
);

/**
 * @swagger
 * /api/facilities/{id}:
 *   put:
 *     summary: 5. Cập nhật thông tin Cơ sở y tế
 *     description: |
 *       **Mục đích:** Sửa thông tin định kỳ của doanh nghiệp cơ sở (Không thể sửa mã `code` chống lệch đồng bộ). Gửi ảnh mới trên Swagger Form sẽ tự động ghi đè ảnh cũ.
 *       **Phân quyền:** Yêu cầu quyền `FACILITY_UPDATE`.
 *       **Vai trò được phép:** Admin, Staff
 *     tags: [2.1 Quản lý Cơ sở Y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "FCL_123"
 *         description: "ID Cơ sở cần sửa"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Phòng khám Đa khoa Hoàn Mỹ - CN2"
 *               tax_code:
 *                 type: string
 *                 example: "0109999999"
 *               email:
 *                 type: string
 *                 example: "contact@hoanmy.vn"
 *               phone:
 *                 type: string
 *                 example: "0808111222"
 *               website:
 *                 type: string
 *                 example: "https://hoanmy.com.vn"
 *               headquarters_address:
 *                 type: string
 *                 example: "123 Quận Nhất, Thành Phố HCM"
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: "Up file ảnh JPEG/PNG mới nếu bạn muốn thay thế Logo thương hiệu."
 *     responses:
 *       200:
 *         description: Sửa đổi thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Cập nhật thông tin thành công"
 *       404:
 *         description: Cập nhật thất bại, không tìm thấy cơ sở.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 message: "Không tìm thấy cơ sở hoặc cơ sở đã bị vô hiệu hóa."
 */
facilityRoutes.put('/:id',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('FACILITY_UPDATE'),
    upload.single('logo'),
    FacilityController.updateFacility
);

/**
 * @swagger
 * /api/facilities/{id}/status:
 *   patch:
 *     summary: 6. Đổi trạng thái Cơ sở y tế
 *     description: |
 *       **Mục đích:** Thay đổi tình trạng hoạt động nhanh gọn bằng phương thức PATCH.
 *       **Phân quyền:** Yêu cầu quyền `FACILITY_UPDATE`.
 *       **Vai trò được phép:** Admin, Staff
 *     tags: [2.1 Quản lý Cơ sở Y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "FCL_123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, SUSPENDED]
 *                 example: "SUSPENDED"
 *                 description: "Cấm (SUSPENDED), Đóng cửa (INACTIVE), Kích hoạt (ACTIVE)"
 *     responses:
 *       200:
 *         description: Đổi thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Cập nhật trạng thái thành công"
 */
facilityRoutes.patch('/:id/status',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('FACILITY_UPDATE'),
    FacilityController.changeFacilityStatus
);

/**
 * @swagger
 * /api/facilities/{id}:
 *   delete:
 *     summary: 7. Xóa mềm Cơ sở y tế
 *     description: |
 *       **Mục đích:** Ẩn cơ sở y tế (Soft-Delete) mà không gây ảnh hưởng đến dữ liệu tham chiếu Foreign Key ở các chi nhánh. Cột `deleted_at` sẽ được cập nhật mốc thời gian.
 *       **Phân quyền:** Yêu cầu quyền `FACILITY_DELETE`.
 *       **Vai trò được phép:** Admin, Staff
 *     tags: [2.1 Quản lý Cơ sở Y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "FCL_123"
 *     responses:
 *       200:
 *         description: Xóa mềm thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Xóa cơ sở y tế thành công"
 *       404:
 *         description: Lỗi không tìm thấy Cơ sở nào khớp.
 */
facilityRoutes.delete('/:id',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('FACILITY_DELETE'),
    FacilityController.deleteFacility
);

export default facilityRoutes;
