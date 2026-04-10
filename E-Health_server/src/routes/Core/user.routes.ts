import { Router } from 'express';
import { UserController } from '../../controllers/Core/user.controller';
import { UserFacilityController } from '../../controllers/Core/user-facility.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';
import multer from 'multer';
import { UserImportController } from '../../controllers/Core/user-import.controller';
import { UserExportController } from '../../controllers/Core/user-export.controller';

const userRoutes = Router();

userRoutes.use(verifyAccessToken);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });



/**
 * @swagger
 * /api/users/import/validate:
 *   post:
 *     summary: Kiểm tra (Validate) dữ liệu file Import
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *       Tải file dữ liệu danh sách người dùng lên để hệ thống phân tích và báo lỗi trước khi import thực sự. Hỗ trợ Excel (.xlsx, .xls) và CSV.
 *     tags: [1.1.7 Import người dùng hàng loạt]
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
 *                 description: File cần import (Excel/CSV)
 *     responses:
 *       200:
 *         description: Phân tích kết quả thành công
 *       400:
 *         description: Thiếu file hoặc định dạng không hợp lệ
 */
userRoutes.post('/import/validate', authorizePermissions('USER_CREATE'), upload.single('file'), UserImportController.validateImport);

/**
 * @swagger
 * /api/users/import:
 *   post:
 *     summary: Thực thi Import Người dùng hàng loạt
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *       Tải file dữ liệu lên, hệ thống sẽ bỏ qua các dòng lỗi và chỉ import các dòng hợp lệ vào CSDL.
 *     tags: [1.1.7 Import người dùng hàng loạt]
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
 *                 description: File cần import (Excel/CSV)
 *     responses:
 *       200:
 *         description: Import dữ liệu thành công
 *       400:
 *         description: File lỗi / không có dòng nào import được
 */
userRoutes.post('/import', authorizePermissions('USER_CREATE'), upload.single('file'), UserImportController.executeImport);

/**
 * @swagger
 * /api/users/import/history:
 *   get:
 *     summary: Xem lịch sử Import
 *     description: |
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF
 *
 *       Truy xuất tất cả các lần Import danh sách nhân sự trước đó.
 *     tags: [1.1.7 Import người dùng hàng loạt]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về thành công dữ liệu Audit Logs
 */
userRoutes.get('/import/history', authorizePermissions('USER_VIEW'), UserImportController.getImportHistory);

/**
 * @swagger
 * /api/users/export:
 *   get:
 *     summary: Xuất danh sách người dùng (Excel)
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *       Tải xuống file Excel (.xlsx) chứa toàn bộ danh sách người dùng trong hệ thống (có thể lọc thông qua Query Params).
 *     tags: [1.1.8 Export danh sách người dùng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên, email, sđt
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, BANNED, PENDING]
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Từ ngày đăng ký (YYYY-MM-DD)
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Đến ngày đăng ký (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: File Excel (binary stream)
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
userRoutes.get('/export', authorizePermissions('USER_EXPORT'), UserExportController.exportUsers);

/**
 * @swagger
 * /api/users/export:
 *   post:
 *     summary: Xuất danh sách người dùng theo luồng POST (Nâng cao)
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *       Tương tự GET /export nhưng cho phép gửi filter phức tạp thông qua Request Body thay vì Query.
 *     tags: [1.1.8 Export danh sách người dùng]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               search:
 *                 type: string
 *               role:
 *                 type: string
 *                 example: DOCTOR
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, BANNED, PENDING]
 *                 example: ACTIVE
 *               fromDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               toDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-31"
 *     responses:
 *       200:
 *         description: File Excel (binary stream)
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
userRoutes.post('/export', authorizePermissions('USER_EXPORT'), UserExportController.exportUsers);

/**
 * @swagger
 * /api/users/account-status:
 *   get:
 *     summary: Lấy danh sách Trạng thái hiển thị Dropdown
 *     description: |
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF
 *
 *       Lấy danh sách map các trạng thái tài khoản cố định của hệ thống.
 *     tags: [1.1.1 Quản lý User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về thành công dữ liệu Trạng thái
 */
userRoutes.get('/account-status', authorizePermissions('USER_VIEW'), UserController.getAccountStatuses);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Tạo người dùng mới
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *     tags: [1.1.1 Quản lý User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['roles', 'full_name']
 *             properties:
 *               email:
 *                 type: string
 *                 example: doctor.nguyen@ehealth.com
 *               phone:
 *                 type: string
 *                 example: "0901234567"
 *               password:
 *                 type: string
 *                 description: Mật khẩu (Tùy chọn). Hệ thống tự sinh rỗng và gửi qua email nếu không truyền.
 *                 example: "SecurePass123!"
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["DOCTOR"]
 *               full_name:
 *                 type: string
 *                 example: "Nguyễn Văn Bác Sĩ"
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "1985-12-25"
 *               gender:
 *                 type: string
 *                 example: "MALE"
 *               identity_card_number:
 *                 type: string
 *                 example: "079085001234"
 *               address:
 *                 type: string
 *                 example: "123 Đường Y-Tế, Quận 1, TP.HCM"
 *     responses:
 *       201:
 *         description: Tạo người dùng thành công
 *       400:
 *         description: Lỗi dữ liệu đầu vào (VD thiếu thông tin, email/sdt đã tồn tại)
 *       401:
 *         description: Chưa xác thực (Missing Token)
 *       403:
 *         description: Không có quyền truy cập (Not Admin)
 */
userRoutes.post('/', authorizePermissions('USER_CREATE'), UserController.createUser);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lấy danh sách người dùng
 *     description: |
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF
 *
 *     tags: [1.1.1 Quản lý User]
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
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên, email, sđt
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, BANNED, PENDING]
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
userRoutes.get('/', authorizePermissions('USER_VIEW'), UserController.getUsers);

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Tìm kiếm người dùng nhanh (Alias của Get List)
 *     description: |
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF
 *
 *     tags: [1.1.1 Quản lý User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
userRoutes.get('/search', authorizePermissions('USER_VIEW'), UserController.searchUsers);

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Lấy chi tiết người dùng
 *     description: |
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF
 *
 *     tags: [1.1.1 Quản lý User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRoutes.get('/:userId', authorizePermissions('USER_VIEW'), UserController.getUserById);

/**
 * @swagger
 * /api/users/{userId}:
 *   put:
 *     summary: Cập nhật thông tin người dùng
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *     tags: [1.1.1 Quản lý User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               email:
 *                 type: string
 *                 example: newemail.doctor@ehealth.com
 *               phone:
 *                 type: string
 *                 example: "0909999888"
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["DOCTOR", "MANAGER"]
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, BANNED, PENDING]
 *                 example: "ACTIVE"
 *               full_name:
 *                 type: string
 *                 example: "Nguyễn Văn Đã Đổi Tên"
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "1985-12-25"
 *               gender:
 *                 type: string
 *                 example: "MALE"
 *               identity_card_number:
 *                 type: string
 *                 example: "079085004321"
 *               avatar_url:
 *                 type: string
 *                 example: "https://example.com/images/avatar.jpg"
 *               address:
 *                 type: string
 *                 example: "Số 456, Đường Y-Tế Mới, Quận 1, TP.HCM"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Email/sdt đã tồn tại
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRoutes.put('/:userId', authorizePermissions('USER_UPDATE'), UserController.updateUser);
userRoutes.patch('/:userId', authorizePermissions('USER_UPDATE'), UserController.updateUser);

/**
 * @swagger
 * /api/users/{userId}:
 *   delete:
 *     summary: Vô hiệu hóa (Soft Delete) người dùng
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *     tags: [1.1.1 Quản lý User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa người dùng thành công
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRoutes.delete('/:userId', authorizePermissions('USER_DELETE'), UserController.deleteUser);

/**
 * @swagger
 * /api/users/{userId}/lock:
 *   patch:
 *     summary: Khóa tài khoản
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *     tags: [1.1.2 Khóa / mở khóa tài khoản]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Khóa tài khoản thành công
 *       400:
 *         description: Trạng thái tài khoản không hợp lệ (Đã khóa sẵn)
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRoutes.patch('/:userId/lock', authorizePermissions('USER_UPDATE'), UserController.lockUser);

/**
 * @swagger
 * /api/users/{userId}/unlock:
 *   patch:
 *     summary: Mở khóa tài khoản
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *     tags: [1.1.2 Khóa / mở khóa tài khoản]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mở khóa tài khoản thành công
 *       400:
 *         description: Trạng thái tài khoản không hợp lệ (Không bị khóa)
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRoutes.patch('/:userId/unlock', authorizePermissions('USER_UPDATE'), UserController.unlockUser);
/**
 * @swagger
 * /api/users/{userId}/status:
 *   patch:
 *     summary: Cập nhật trạng thái người dùng
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *     tags: [1.1.3 Quản lý trạng thái tài khoản]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, BANNED, PENDING]
 *                 example: "INACTIVE"
 *               reason:
 *                 type: string
 *                 example: "Nghỉ việc tạm thời"
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *       400:
 *         description: Trạng thái không hợp lệ hoặc không thay đổi
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRoutes.patch('/:userId/status', authorizePermissions('USER_UPDATE'), UserController.updateUserStatus);

/**
 * @swagger
 * /api/users/{userId}/status-history:
 *   get:
 *     summary: Lấy lịch sử thay đổi trạng thái người dùng
 *     description: |
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF
 *
 *     tags: [1.1.3 Quản lý trạng thái tài khoản]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRoutes.get('/:userId/status-history', authorizePermissions('USER_VIEW'), UserController.getStatusHistory);
/**
 * @swagger
 * /api/users/{userId}/reset-password:
 *   post:
 *     summary: Admin reset mật khẩu cho User
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *     tags: [1.1.4 Reset mật khẩu người dùng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *                 example: "matkhaumoi123"
 *                 description: Mật khẩu mới thiết lập (Nếu để trống, hệ thống sẽ tự sinh pass ngẫu nhiên và gửi mail)
 *     responses:
 *       200:
 *         description: Reset mật khẩu thành công
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRoutes.post('/:userId/reset-password', authorizePermissions('USER_UPDATE'), UserController.resetPassword);

/**
 * @swagger
 * /api/users/{userId}/change-password:
 *   post:
 *     summary: User tự đổi mật khẩu cá nhân
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *     tags: [1.1.4 Reset mật khẩu người dùng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: "matkhaucu"
 *               newPassword:
 *                 type: string
 *                 example: "matkhaumoi"
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       400:
 *         description: Thông tin không hợp lệ, hoặc mật khẩu cũ sai
 *       403:
 *         description: Không thể đổi mật khẩu của người dùng khác
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRoutes.post('/:userId/change-password', UserController.changePassword);
/**
 * @swagger
 * /api/users/{userId}/roles:
 *   get:
 *     summary: Lấy danh sách vai trò của người dùng
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [1.1.5 Gán vai trò cho người dùng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRoutes.get('/:userId/roles', authorizePermissions('ROLE_VIEW'), UserController.getUserRoles);

/**
 * @swagger
 * /api/users/{userId}/roles:
 *   post:
 *     summary: Gán vai trò cho người dùng
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [1.1.5 Gán vai trò cho người dùng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 example: "DOCTOR"
 *                 description: "Mã code của Role (VD: DOCTOR, NURSE) hoặc UUID của Role đó"
 *     responses:
 *       200:
 *         description: Gán thành công
 *       400:
 *         description: Role không tồn tại
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRoutes.post('/:userId/roles', authorizePermissions('ROLE_UPDATE'), UserController.assignRole);

/**
 * @swagger
 * /api/users/{userId}/roles/{roleId}:
 *   delete:
 *     summary: Xoá vai trò của người dùng
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [1.1.5 Gán vai trò cho người dùng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: "Mã code của Role (VD: DOCTOR) hoặc UUID của Role"
 *     responses:
 *       200:
 *         description: Xoá thành công
 *       400:
 *         description: User không có role này
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRoutes.delete('/:userId/roles/:roleId', authorizePermissions('ROLE_UPDATE'), UserController.removeRole);
/**
 * @swagger
 * /api/users/{userId}/facilities:
 *   get:
 *     summary: Lấy danh sách Chi nhánh/Phòng ban của người dùng
 *     description: |
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF
 *
 *     tags: [1.1.6 Gán người dùng vào cơ sở y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRoutes.get('/:userId/facilities', authorizePermissions('FACILITY_VIEW'), UserFacilityController.getUserFacilities);

/**
 * @swagger
 * /api/users/{userId}/facilities:
 *   post:
 *     summary: Gán nhân sự vào Chi nhánh / Phòng ban
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *     tags: [1.1.6 Gán người dùng vào cơ sở y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               - branchId
 *             properties:
 *               branchId:
 *                 type: string
 *                 description: ID của Chi nhánh
 *               departmentId:
 *                 type: string
 *                 description: ID của Khoa/Phòng (Tùy chọn)
 *               roleTitle:
 *                 type: string
 *                 example: "Bác sĩ Trưởng khoa"
 *                 description: Chức danh tại cơ sở (Tùy chọn)
 *     responses:
 *       200:
 *         description: Gán thành công
 *       400:
 *         description: Lỗi dữ liệu hoặc Chi nhánh/Khoa không tồn tại
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRoutes.post('/:userId/facilities', authorizePermissions('FACILITY_UPDATE'), UserFacilityController.assignUserToFacility);

/**
 * @swagger
 * /api/users/{userId}/facilities/{facilityId}:
 *   delete:
 *     summary: Hủy gán nhân sự khỏi Chi nhánh
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *     tags: [1.1.6 Gán người dùng vào cơ sở y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của Chi nhánh (branchId) cũ muốn xóa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Nghỉ việc"
 *                 description: Lý do hủy bổ nhiệm
 *     responses:
 *       200:
 *         description: Hủy gán thành công
 *       400:
 *         description: Nhân sự không thuộc Chi nhánh này hoặc thiếu lý do
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRoutes.delete('/:userId/facilities/:facilityId', authorizePermissions('FACILITY_UPDATE'), UserFacilityController.removeUserFromFacility);

/**
 * @swagger
 * /api/users/{userId}/facilities/{facilityId}:
 *   put:
 *     summary: Thuyên chuyển nhân sự sang Chi nhánh / Phòng ban khác
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *     tags: [1.1.6 Gán người dùng vào cơ sở y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của Chi nhánh (branchId) hiện tại đang làm việc
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - branchId
 *             properties:
 *               branchId:
 *                 type: string
 *                 description: ID của Chi nhánh MỚI muốn chuyển đến
 *               departmentId:
 *                 type: string
 *                 description: ID của Khoa/Phòng MỚI (Tùy chọn)
 *               roleTitle:
 *                 type: string
 *                 example: "Bác sĩ Trưởng khoa"
 *                 description: Chức danh tại cơ sở MỚI (Tùy chọn)
 *     responses:
 *       200:
 *         description: Thuyên chuyển thành công
 *       400:
 *         description: Lỗi dữ liệu hoặc Chi nhánh/Khoa mới không tồn tại hoặc Nhân sự k thuộc chi nhánh cũ
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRoutes.put('/:userId/facilities/:facilityId', authorizePermissions('FACILITY_UPDATE'), UserFacilityController.transferUserToFacility);

export default userRoutes;
