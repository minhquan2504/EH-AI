import { Router } from 'express';
import { BranchController } from '../../controllers/Facility Management/branch.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizeApi } from '../../middleware/authorizeApi.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const branchRoutes = Router();

/**
 * @swagger
 * /api/branches/dropdown:
 *   get:
 *     summary: 1. Lấy danh sách Chi nhánh (Dropdown)
 *     description: |
 *       **Mục đích:** API dùng để lấy danh sách rút gọn các Chi nhánh có trạng thái `ACTIVE`.
 *       **Phân quyền:** Yêu cầu người dùng đã đăng nhập `verifyAccessToken`.
 *       **Vai trò được phép:** Tất cả (Admin, Staff, Doctor, Nurse, Pharmacist)
 *     tags: [2.2 Quản lý Chi nhánh]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về danh sách chi nhánh thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - branches_id: "BRN_123456"
 *                     facility_id: "FCL_789012"
 *                     code: "BRN-HCM-01"
 *                     name: "Chi nhánh Quận 1"
 *       401:
 *         description: Chưa đăng nhập hoặc Token hết hạn / không hợp lệ.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 message: "Unauthorized: Token đã hết hạn."
 *                 error_code: "TOKEN_EXPIRED"
 */
branchRoutes.get('/dropdown', verifyAccessToken, BranchController.getBranchesForDropdown);

/**
 * @swagger
 * /api/branches:
 *   get:
 *     summary: 2. Lấy danh sách Chi nhánh (Phân trang)
 *     description: |
 *       **Mục đích:** Lấy danh sách phân trang các chi nhánh, hỗ trợ tìm kiếm và lọc.
 *       **Phân quyền:** Yêu cầu quyền `BRANCH_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Doctor, Nurse, Pharmacist
 *     tags: [2.2 Quản lý Chi nhánh]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: "Tìm kiếm từ khóa theo mã, tên, email, số điện thoại."
 *         example: "Quận 1"
 *       - in: query
 *         name: facility_id
 *         schema:
 *           type: string
 *         description: "Lọc chi nhánh theo ID cơ sở y tế gốc."
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
 *         description: "Số trang hiện tại."
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: "Số bản ghi trên mỗi trang."
 *     responses:
 *       200:
 *         description: Cấu trúc trả về danh sách phân trang thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   items:
 *                     - branches_id: "BRN_123"
 *                       facility_id: "FCL_001"
 *                       code: "BRN-01"
 *                       name: "Chi nhánh Đống Đa"
 *                       address: "123 Đống Đa, HN"
 *                       phone: "0987654321"
 *                       status: "ACTIVE"
 *                       established_date: "2023-01-01T00:00:00.000Z"
 *                       facility_name: "Bệnh viện Đa khoa Medlatec"
 *                   pagination:
 *                     page: 1
 *                     limit: 10
 *                     total_records: 1
 *                     total_pages: 1
 *       403:
 *         description: Không có quyền truy cập.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 error_code: "FORBIDDEN_ACCESS"
 *                 message: "Bạn không có quyền thực hiện thao tác này. Yêu cầu một trong các quyền: BRANCH_VIEW"
 */
branchRoutes.get('/',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('BRANCH_VIEW'),
    BranchController.getBranches
);

/**
 * @swagger
 * /api/branches/{id}:
 *   get:
 *     summary: 3. Lấy chi tiết 1 Chi nhánh
 *     description: |
 *       **Mục đích:** Trả về thông tin chi tiết một chi nhánh dựa trên `id` truyền vào params.
 *       **Phân quyền:** Yêu cầu quyền `BRANCH_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Doctor, Nurse, Pharmacist
 *     tags: [2.2 Quản lý Chi nhánh]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID Chi nhánh"
 *         example: "BRN_123"
 *     responses:
 *       200:
 *         description: Trả về thông tin chi nhánh thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   branches_id: "BRN_123"
 *                   facility_id: "FCL_001"
 *                   code: "BRN-01"
 *                   name: "Chi nhánh Đống Đa"
 *                   address: "123 Đống Đa, HN"
 *                   phone: "0987654321"
 *                   status: "ACTIVE"
 *                   established_date: "2023-01-01T00:00:00.000Z"
 *                   facility_name: "Bệnh viện Đa khoa Medlatec"
 *       404:
 *         description: Chi nhánh không tồn tại.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 message: "Chi nhánh không tồn tại hoặc đã bị xóa."
 *                 error_code: "BRANCH_NOT_FOUND"
 */
branchRoutes.get('/:id',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('BRANCH_VIEW'),
    BranchController.getBranchById
);

/**
 * @swagger
 * /api/branches:
 *   post:
 *     summary: 4. Thêm mới Chi nhánh
 *     description: |
 *       **Mục đích:** Tạo mới một chi nhánh và gán nó vào cơ sở y tế gốc.
 *       **Lưu ý:** `code` phải là duy nhất trên toàn hệ thống. Mọi tương tác của API này đều được lưu qua **Audit Logs**.
 *       **Phân quyền:** Yêu cầu quyền `BRANCH_CREATE`.
 *       **Vai trò được phép:** Admin, Staff
 *     tags: [2.2 Quản lý Chi nhánh]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - facility_id
 *               - code
 *               - name
 *               - address
 *             properties:
 *               facility_id:
 *                 type: string
 *                 example: "FCL_001"
 *                 description: "ID của Cơ sở Y tế mà chi nhánh trực thuộc"
 *               code:
 *                 type: string
 *                 example: "BRN-HOANKIEM"
 *                 description: "Mã code nhánh (Bắt buộc duy nhất)"
 *               name:
 *                 type: string
 *                 example: "Chi nhánh Hoàn Kiếm T1"
 *                 description: "Tên chi nhánh"
 *               address:
 *                 type: string
 *                 example: "124 Hoàn Kiếm, Hà Nội"
 *                 description: "Địa chỉ chi tiết"
 *               phone:
 *                 type: string
 *                 example: "0909123456"
 *                 description: "Số điện thoại hotline chi nhánh (Tùy chọn)"
 *               established_date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *                 description: "Ngày thành lập (Tùy chọn)"
 *     responses:
 *       201:
 *         description: Tạo mới chi nhánh thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Tạo chi nhánh thành công"
 *                 data:
 *                   branch_id: "BRN_d82a3c1f"
 *       400:
 *         description: Lỗi đầu vào (trùng mã code, cơ sở gốc không tồn tại).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 message: "Mã chi nhánh đã tồn tại trong hệ thống."
 *                 error_code: "BRANCH_CODE_EXISTS"
 */
branchRoutes.post('/',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('BRANCH_CREATE'),
    BranchController.createBranch
);

/**
 * @swagger
 * /api/branches/{id}:
 *   put:
 *     summary: 5. Cập nhật thông tin Chi nhánh toàn diện
 *     description: |
 *       **Mục đích:** Cập nhật thông tin chi nhánh định kỳ. Có thể đổi `facility_id` nếu muốn thuyên chuyển sang cơ sở cha khác. Không update trường `code`.
 *       **Phân quyền:** Yêu cầu quyền `BRANCH_UPDATE`.
 *       **Vai trò được phép:** Admin, Staff
 *     tags: [2.2 Quản lý Chi nhánh]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID Chi nhánh"
 *         example: "BRN_123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               facility_id:
 *                 type: string
 *                 description: "Điền ID Cơ sở mới nếu muốn THUYÊN CHUYỂN chi nhánh"
 *                 example: "FCL_456"
 *               name:
 *                 type: string
 *                 example: "Chi nhánh Hoàn Kiếm VIP"
 *               address:
 *                 type: string
 *                 example: "2b Hàng Tre, Hoàn Kiếm, HN"
 *               phone:
 *                 type: string
 *                 example: "0243123456"
 *               established_date:
 *                 type: string
 *                 format: date
 *                 example: "2024-02-01"
 *     responses:
 *       200:
 *         description: Cập nhật thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Cập nhật thông tin chi nhánh thành công"
 *       400:
 *         description: Cơ sở thuyên chuyển (facility_id) không tồn tại.
 *       404:
 *         description: Chi nhánh không tồn tại.
 */
branchRoutes.put('/:id',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('BRANCH_UPDATE'),
    BranchController.updateBranch
);

/**
 * @swagger
 * /api/branches/{id}/status:
 *   patch:
 *     summary: 6. Đổi trạng thái Chi nhánh
 *     description: |
 *       **Mục đích:** Chuyển đổi trạng thái đóng/mở nhanh cho chi nhánh.
 *       **Phân quyền:** Yêu cầu quyền `BRANCH_UPDATE`.
 *       **Vai trò được phép:** Admin, Staff
 *     tags: [2.2 Quản lý Chi nhánh]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID Chi nhánh"
 *         example: "BRN_123"
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
 *                 example: "UNDER_MAINTENANCE"
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Cập nhật trạng thái thành công"
 *       400:
 *         description: Trạng thái truyền vào không đúng Enum.
 *       404:
 *         description: Chi nhánh không tồn tại.
 */
branchRoutes.patch('/:id/status',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('BRANCH_UPDATE'),
    BranchController.changeBranchStatus
);

/**
 * @swagger
 * /api/branches/{id}:
 *   delete:
 *     summary: 7. Xóa mềm Chi nhánh (Soft Delete)
 *     description: |
 *       **Mục đích:** Đưa chi nhánh vào trạng thái rác (`deleted_at` = now()).
 *       **Phân quyền:** Yêu cầu quyền `BRANCH_DELETE`.
 *       **Vai trò được phép:** Admin, Staff
 *     tags: [2.2 Quản lý Chi nhánh]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID Chi nhánh"
 *         example: "BRN_123"
 *     responses:
 *       200:
 *         description: Xóa chi nhánh thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Xóa chi nhánh thành công"
 *       404:
 *         description: Chi nhánh không tồn tại để xóa.
 */
branchRoutes.delete('/:id',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('BRANCH_DELETE'),
    BranchController.deleteBranch
);

export default branchRoutes;
