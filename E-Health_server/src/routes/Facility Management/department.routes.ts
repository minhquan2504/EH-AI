import { Router } from 'express';
import { DepartmentController } from '../../controllers/Facility Management/department.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizeApi } from '../../middleware/authorizeApi.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const departmentRoutes = Router();

/**
 * @swagger
 * /api/departments/dropdown:
 *   get:
 *     summary: 1. Lấy danh sách Khoa/Phòng ban (Dropdown)
 *     description: |
 *       **Mục đích:** API lấy danh sách rút gọn các Khoa hoặc Phòng ban trực thuộc 1 Chi nhánh cụ thể để hiển thị Select Box (vd: Đăng ký khám, Lọc nhân viên).
 *       **Phân quyền:** Yêu cầu đăng nhập (`verifyAccessToken`).
 *       **Vai trò được phép:** Tất cả (Admin, Staff, Doctor, Nurse, Pharmacist)
 *     tags: [2.3 Quản lý Khoa/Phòng ban]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         required: true
 *         schema:
 *           type: string
 *         description: "BẮT BUỘC: Lọc khoa theo ID Chi nhánh quản lý"
 *         example: "BRN_123456"
 *     responses:
 *       200:
 *         description: Trả về danh sách thả xuống thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - departments_id: "DEPT_123456"
 *                     branch_id: "BRN_123456"
 *                     code: "KHOA_NOI"
 *                     name: "Khoa Nội Tổng Hợp"
 *       400:
 *         description: Client không truyền tham số branch_id bắt buộc.
 */
departmentRoutes.get('/dropdown', verifyAccessToken, DepartmentController.getDepartmentsForDropdown);

/**
 * @swagger
 * /api/departments:
 *   get:
 *     summary: 2. Lấy danh sách Khoa/Phòng ban (Phân trang)
 *     description: |
 *       **Mục đích:** Tra cứu toàn bộ danh sách khoa, hỗ trợ tìm kiếm Name/Code, lọc theo Trạng thái và Branch. Áp dụng JOIN truy xuất tên Chi nhánh và Cơ sở gốc.
 *       **Phân quyền:** Yêu cầu quyền `DEPARTMENT_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Doctor, Nurse, Pharmacist
 *     tags: [2.3 Quản lý Khoa/Phòng ban]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: "Tìm kiếm từ khóa theo mã code, tên khoa."
 *         example: "Khoa Nhi"
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: "Lọc phòng ban theo ID phần nhánh chứa nó."
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, UNDER_MAINTENANCE]
 *         description: "Lọc theo trạng thái."
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
 *         description: "Số lượng bản ghi."
 *     responses:
 *       200:
 *         description: Trả về danh sách khoa thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   items:
 *                     - departments_id: "DEPT_123"
 *                       branch_id: "BRN_001"
 *                       code: "KHOA_NHI"
 *                       name: "Khoa Nhi Đồng 1"
 *                       description: "Chuyên điều trị bệnh lý nhi khoa"
 *                       status: "ACTIVE"
 *                       branch_name: "Chi nhánh Quận 1"
 *                       facility_name: "Bệnh viện Đa khoa Medlatec"
 *                   pagination:
 *                     page: 1
 *                     limit: 10
 *                     total_records: 5
 *                     total_pages: 1
 *       403:
 *         description: Không có quyền truy cập.
 */
departmentRoutes.get('/',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('DEPARTMENT_VIEW'),
    DepartmentController.getDepartments
);

/**
 * @swagger
 * /api/departments/{id}:
 *   get:
 *     summary: 3. Lấy chi tiết 1 Khoa/Phòng ban
 *     description: |
 *       **Mục đích:** Trả về thông tin chi tiết một chuyên khoa dựa trên `id`.
 *       **Phân quyền:** Yêu cầu quyền `DEPARTMENT_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Doctor, Nurse, Pharmacist
 *     tags: [2.3 Quản lý Khoa/Phòng ban]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID Khoa/Phòng ban"
 *         example: "DEPT_123"
 *     responses:
 *       200:
 *         description: Thông tin chi tiết Khoa.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   departments_id: "DEPT_123"
 *                   branch_id: "BRN_001"
 *                   code: "KHOA_NHI"
 *                   name: "Khoa Nhi Đồng 1"
 *                   description: "Chuyên điều trị bệnh nhi"
 *                   status: "ACTIVE"
 *                   branch_name: "Chi nhánh Quận 1"
 *                   facility_name: "Bệnh viện Đa khoa Medlatec"
 *       404:
 *         description: Không tìm thấy Khoa/Phòng bạn.
 */
departmentRoutes.get('/:id',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('DEPARTMENT_VIEW'),
    DepartmentController.getDepartmentById
);

/**
 * @swagger
 * /api/departments:
 *   post:
 *     summary: 4. Tạo mới Khoa/Phòng ban
 *     description: |
 *       **Mục đích:** Tạo mới phòng ban và gán vào một Chi nhánh. Lưu ý: Code phải LÀ DUY NHẤT trong cùng 1 Chi nhánh. Mọi thao tác này đều được Tracking vào Audit Logs.
 *       **Phân quyền:** Yêu cầu quyền `DEPARTMENT_CREATE`.
 *       **Vai trò được phép:** Admin, Staff
 *     tags: [2.3 Quản lý Khoa/Phòng ban]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - branch_id
 *               - code
 *               - name
 *             properties:
 *               branch_id:
 *                 type: string
 *                 example: "BRN_123"
 *                 description: "ID Chi nhánh quản lý khoa này"
 *               code:
 *                 type: string
 *                 example: "KHOA_NOI"
 *                 description: "Mã khoa (VD: KHOA_NOI, PHONG_KETOAN)"
 *               name:
 *                 type: string
 *                 example: "Khoa Nội Tiêu Hóa"
 *                 description: "Tên hiển thị phòng ban/khoa"
 *               description:
 *                 type: string
 *                 example: "Tiếp nhận xét nghiệm và khám tổng quát tiêu hóa nội tạng."
 *                 description: "Mô tả chuyên sâu"
 *     responses:
 *       201:
 *         description: Tạo mới khoa thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Tạo khoa/phòng ban thành công"
 *                 data:
 *                   department_id: "DEPT_12e7a3c1"
 *       400:
 *         description: Lỗi đầu vào (trùng mã code trong cùng chi nhánh, branch_id không tồn tại).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 message: "Mã khoa này đã tồn tại trong cùng chi nhánh! Hệ thống không cho phép trùng lặp."
 *                 error_code: "DEPT_002"
 */
departmentRoutes.post('/',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('DEPARTMENT_CREATE'),
    DepartmentController.createDepartment
);

/**
 * @swagger
 * /api/departments/{id}:
 *   put:
 *     summary: 5. Cập nhật thông tin Khoa/Phòng ban
 *     description: |
 *       **Mục đích:** Thay đổi nội dung Name và Description. Cố tình thiết kế chặn không cho thay đổi `code` và `branch_id` để tránh làm hỏng cấu trúc phân cấp cây Cơ sở -> Chi nhánh -> Khoa.
 *       **Phân quyền:** Yêu cầu quyền `DEPARTMENT_UPDATE`.
 *       **Vai trò được phép:** Admin, Staff
 *     tags: [2.3 Quản lý Khoa/Phòng ban]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID Khoa/Phòng ban cần sửa"
 *         example: "DEPT_123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Khoa Nội Truyền Nhiễm Cao Cấp"
 *               description:
 *                 type: string
 *                 example: "Cập nhật mô tả mới..."
 *     responses:
 *       200:
 *         description: Cập nhật thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Cập nhật thông tin khoa/phòng ban thành công"
 */
departmentRoutes.put('/:id',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('DEPARTMENT_UPDATE'),
    DepartmentController.updateDepartment
);

/**
 * @swagger
 * /api/departments/{id}/status:
 *   patch:
 *     summary: 6. Đổi trạng thái Khoa/Phòng ban
 *     description: |
 *       **Mục đích:** Bật tắt nhanh trạng thái để cấm xếp lịch khám...
 *       **Phân quyền:** Yêu cầu quyền `DEPARTMENT_UPDATE`.
 *       **Vai trò được phép:** Admin, Staff
 *     tags: [2.3 Quản lý Khoa/Phòng ban]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID Khoa/Phòng ban"
 *         example: "DEPT_123"
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
 *                 enum: [ACTIVE, INACTIVE, UNDER_MAINTENANCE]
 *                 example: "INACTIVE"
 *     responses:
 *       200:
 *         description: Đổi khóa/mở khóa thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Cập nhật trạng thái thành công"
 */
departmentRoutes.patch('/:id/status',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('DEPARTMENT_UPDATE'),
    DepartmentController.changeDepartmentStatus
);

/**
 * @swagger
 * /api/departments/{id}:
 *   delete:
 *     summary: 7. Xóa Khoa/Phòng ban (Soft Delete)
 *     description: |
 *       **Mục đích:** Ẩn Khoa/Phòng ban khỏi hệ thống, update trường `deleted_at`.
 *       **Phân quyền:** Yêu cầu quyền `DEPARTMENT_DELETE`.
 *       **Vai trò được phép:** Admin, Staff
 *     tags: [2.3 Quản lý Khoa/Phòng ban]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID Khoa/Phòng ban"
 *         example: "DEPT_123"
 *     responses:
 *       200:
 *         description: Xóa thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Xóa khoa/phòng ban thành công"
 *       404:
 *         description: Lỗi ID truyền vào không khớp hệ thống.
 */
departmentRoutes.delete('/:id',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('DEPARTMENT_DELETE'),
    DepartmentController.deleteDepartment
);

export default departmentRoutes;
