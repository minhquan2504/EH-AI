import { Router } from 'express';
import { StaffController } from '../../controllers/Facility Management/staff.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';
import { uploadImage as upload } from '../../middleware/upload.middleware';

const staffRoutes = Router();

// THÔNG TIN CHUNG NHÂN SỰ Y TẾ (STAFF)

/**
 * @swagger
 * /api/staff:
 *   get:
 *     summary: Lấy danh sách nhân sự y tế (Bác sĩ, Y tá, NV Kho...)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền STAFF_VIEW.
 *       **Vai trò được phép:** Những người có quyền STAFF_VIEW (Ví dụ: SUPER_ADMIN, ADMIN, DOCTOR, NURSE...).
 *       
 *       **Mô tả chi tiết:**
 *       - API dùng để lấy danh sách hồ sơ nhân sự y tế (Bác sĩ, Y tá, Dược sĩ, Nhân viên kho...).
 *       - Mặc định kết quả trả về KHÔNG bao gồm trường hợp ROLE là PATIENT (Bệnh nhân) để tránh nhầm lẫn dữ liệu.
 *       - Hỗ trợ phân trang (`page`, `limit`) và tìm kiếm, lọc linh hoạt (theo từ khóa, trạng thái, vai trò).
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại (Mặc định 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng nhân sự mỗi trang (Mặc định 10)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên, email, sdt
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, BANNED]
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Lọc theo Mã role (Code) ví dụ DOCTOR, NURSE, PHARMACIST...
 *     responses:
 *       200:
 *         description: Thành công
 */
staffRoutes.get('/', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_VIEW')], StaffController.getStaffs);

/**
 * @swagger
 * /api/staff/{staffId}:
 *   get:
 *     summary: Chi tiết thông tin nhân sự y tế
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền STAFF_VIEW.
 *       **Vai trò được phép:** Những người có quyền STAFF_VIEW.
 *       
 *       **Mô tả chi tiết:**
 *       - Trích xuất toàn bộ thông tin chi tiết của một thẻ hồ sơ nhân sự dựa theo UUID.
 *       - Kết quả phản hồi sẽ bao gồm: Dữ liệu cá nhân (Profile), Danh sách các vai trò (Roles) nắm giữ, và các Chi nhánh/Phòng ban trực thuộc.
 *       - Đối với trường hợp là Bác sĩ (Role `DOCTOR`), thông tin chuyên môn mở rộng (Học vị, giá khám, tiểu sử công tác) cũng sẽ được đính kèm.
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy thành công
 *       404:
 *         description: Không tìm thấy nhân sự
 */
staffRoutes.get('/:staffId', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_VIEW')], StaffController.getStaffById);

/**
 * @swagger
 * /api/staff:
 *   post:
 *     summary: Tạo hồ sơ nhân sự y tế mới
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền STAFF_CREATE.
 *       **Vai trò được phép:** Những người có quyền STAFF_CREATE (Thường là ADMIN, SUPER_ADMIN).
 *       
 *       **Mô tả chi tiết:**
 *       - API tạo mới một hồ sơ nhân sự y tế quy chuẩn chỉ trong một bước. Hệ thống sẽ tự động tổng hợp:
 *         1. Tạo một tài khoản trên hệ thống đăng nhập.
 *         2. Khởi tạo hồ sơ định danh (User Profile).
 *         3. Map tài khoản với các quyền tương ứng.
 *         4. (Tùy chọn) Phân công luôn cho người này vào làm tại Chi nhánh nào (`branch_id`).
 *       - **Lưu ý:** Mảng cấu hình vai trò `roles` bắt buộc phải có ít nhất 1 Role Code (Ví dụ: `["DOCTOR"]` hoặc `["DOCTOR", "STAFF"]`). Không cho phép gán `PATIENT` tại Endpoint này.
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, full_name, roles]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "test.doctor@clinic.com"
 *               phone_number:
 *                 type: string
 *                 example: "0901234567"
 *               password:
 *                 type: string
 *                 description: "Nếu bỏ trống sẽ tự phát sinh"
 *                 example: "Pwd1234@"
 *               full_name:
 *                 type: string
 *                 example: "Nguyễn Văn Test"
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "1980-01-01"
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *                 example: "MALE"
 *               identity_card_number:
 *                 type: string
 *                 example: "079080001234"
 *               address:
 *                 type: string
 *                 example: "123 Đường A, Quận B, TP.HCM"
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["DOCTOR"]
 *               branch_id:
 *                 type: string
 *                 description: "ID Chi nhánh sẽ phân công làm việc chính"
 *                 example: "BRANCH_123"
 *               department_id:
 *                 type: string
 *                 description: "ID Phòng ban (tùy chọn)"
 *                 example: "DEPT_456"
 *               role_title:
 *                 type: string
 *                 description: "Chức vụ tại nhánh"
 *                 example: "Trưởng khoa Nội"
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
staffRoutes.post('/', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_CREATE')], StaffController.createStaff);

/**
 * @swagger
 * /api/staff/{staffId}:
 *   put:
 *     summary: Cập nhật thông tin cơ bản nhân sự
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền STAFF_UPDATE.
 *       **Vai trò được phép:** Những người có quyền STAFF_UPDATE.
 *       
 *       **Mô tả chi tiết:**
 *       - API dùng để cập nhật những yếu tố cá nhân cơ bản: Họ tên, Ngày tháng năm sinh, Giới tính, CCCD, Email, SĐT.
 *       - Hệ thống tự động kiểm tra xem Email / SĐT mới có bị trùng lặp với bất kì nhân viên nào khác không, trước khi thiết lập.
 *       - **Quan trọng:** API này KHÔNG can thiệp vào Role (quyền hạn), Status (Trạng thái Banned/Active), hay Branch (Chi nhánh). Để thao tác các phần đó, cần dùng các API riêng biệt.
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
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
 *                 example: "test.doctor.updated@clinic.com"
 *               phone_number:
 *                 type: string
 *                 example: "0901234567"
 *               full_name:
 *                 type: string
 *                 example: "Nguyễn Văn Test Updated"
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "1980-01-01"
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *                 example: "MALE"
 *               identity_card_number:
 *                 type: string
 *                 example: "079080001234"
 *               address:
 *                 type: string
 *                 example: "123 Đường A, Quận B, TP.HCM"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
staffRoutes.put('/:staffId', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_UPDATE')], StaffController.updateStaff);

/**
 * @swagger
 * /api/staff/{staffId}/signature:
 *   patch:
 *     summary: Cập nhật file ảnh chữ ký số
 *     description: Tải lên file ảnh chứa chữ ký số (.png, .jpg)
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
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
 *         description: Cập nhật chữ ký thành công
 */
staffRoutes.patch('/:staffId/signature', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_UPDATE'), upload.single('file')], StaffController.updateSignature);

// ==========================================
// THÔNG TIN CHUYÊN MÔN BÁC SĨ (Dành cho DOCTOR)
// ==========================================

/**
 * @swagger
 * /api/staff/{staffId}/doctor-info:
 *   put:
 *     summary: Khai báo / Cập nhật chuyên môn Bác sĩ
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền STAFF_UPDATE.
 *       **Vai trò được phép:** Những người có quyền STAFF_UPDATE.
 *       
 *       **Mô tả chi tiết:**
 *       - API đặc quyền chỉ dành riêng cho các hồ sơ đang giữ mã quy chuẩn `DOCTOR`.
 *       - Nhiệm vụ: Ghi nhận và tổ chức các thông số Phân khoa & Học vị của nhân sự (Dùng cho UI Patient Booking App ở ứng dụng bệnh nhân).
 *       - Các thông tin bắt buộc: `specialty_id` (Link Chuyên khoa), `title` (Học hàm/Học vị hiển thị VD ThS.BS CKII), `consultation_fee` (Giá tham chiếu cho 1 suất khám).
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [specialty_id]
 *             properties:
 *               specialty_id:
 *                 type: string
 *                 example: "SPEC_001"
 *               title:
 *                 type: string
 *                 example: "ThS. Bs. CKII"
 *               biography:
 *                 type: string
 *                 example: "Hơn 20 năm kinh nghiệm trong lĩnh vực Tim mạch, từng tu nghiệp tại Pháp."
 *               consultation_fee:
 *                 type: number
 *                 example: 500000
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
staffRoutes.put('/:staffId/doctor-info', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_UPDATE')], StaffController.updateDoctorInfo);

// ==========================================
// QUẢN LÝ BẰNG CẤP / CHỨNG CHỈ (LICENSES)
// ==========================================

/**
 * @swagger
 * /api/staff/{staffId}/licenses:
 *   get:
 *     summary: Lấy danh sách bằng cấp/chứng chỉ
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền STAFF_VIEW.
 *       **Vai trò được phép:** Những người có quyền STAFF_VIEW.
 *       
 *       **Mô tả chi tiết:**
 *       - Lấy chi tiết toàn bộ hồ sơ trình độ chuyên môn, bằng đại học, chứng chỉ hành nghề khoa học kỹ thuật, được gán dưới tên của Staff này.
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy thành công
 */
staffRoutes.get('/:staffId/licenses', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_VIEW')], StaffController.getLicensesByUserId);

/**
 * @swagger
 * /api/staff/{staffId}/licenses:
 *   post:
 *     summary: Thêm bằng cấp/chứng chỉ hành nghề
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền STAFF_CREATE hoặc STAFF_UPDATE.
 *       **Vai trò được phép:** Những người có quyền STAFF_CREATE hoặc STAFF_UPDATE.
 *       
 *       **Mô tả chi tiết:**
 *       - Thêm thông tin mô tả chi tiết của Bằng cấp / Chứng chỉ hành nghề liên quan tới nhân sự.
 *       - Bao gồm loại giấy, nơi cấp phép (VD: Sở y tế Thành Phố), thông tin về thời điểm hết hạn của chứng chỉ nếu có.
 *       - Cho phép khai báo `document_url` lưu file PDF/Hình ảnh gốc của chứng chỉ.
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [license_type, license_number, issue_date]
 *             properties:
 *               license_type:
 *                 type: string
 *                 description: "Loại (VD: Chứng chỉ hành nghề, Bằng Đại học)"
 *                 example: "Chứng chỉ hành nghề khám bệnh, chữa bệnh"
 *               license_number:
 *                 type: string
 *                 description: "Số hiệu"
 *                 example: "010045/HCM-CCHN"
 *               issue_date:
 *                 type: string
 *                 format: date
 *                 example: "2015-10-30"
 *               expiry_date:
 *                 type: string
 *                 format: date
 *                 example: "2030-10-30"
 *               issued_by:
 *                 type: string
 *                 description: "Nơi cấp"
 *                 example: "Sở Y Tế TP.HCM"
 *               document_url:
 *                 type: string
 *                 description: "Link file scan"
 *                 example: "https://example.com/scan.pdf"
 *     responses:
 *       201:
 *         description: Thêm thành công
 */
staffRoutes.post('/:staffId/licenses', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_CREATE', 'STAFF_UPDATE')], StaffController.createLicense);

/**
 * @swagger
 * /api/staff/{staffId}/licenses/{licenseId}:
 *   put:
 *     summary: Trọng Số Bằng cấp/Chứng chỉ
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền STAFF_UPDATE.
 *       **Vai trò được phép:** Những người có quyền STAFF_UPDATE.
 *       
 *       **Mô tả chi tiết:**
 *       - Cập nhật thông tin chi tiết của một Bằng cấp/Chứng chỉ đã lưu trữ theo `licenseId`.
 *       - Dùng trong các trường hợp tải lên chứng chỉ bị lỗi, sai thông tin ngày tháng năm, hoặc văn bằng vừa được gia hạn.
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: licenseId
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
 *               license_type:
 *                 type: string
 *                 example: "Chứng chỉ hành nghề"
 *               license_number:
 *                 type: string
 *                 example: "010045/HCM-CCHN"
 *               issue_date:
 *                 type: string
 *                 format: date
 *                 example: "2015-10-30"
 *               expiry_date:
 *                 type: string
 *                 format: date
 *                 example: "2030-10-30"
 *               issued_by:
 *                 type: string
 *                 example: "Sở Y Tế Hà Nội"
 *               document_url:
 *                 type: string
 *                 example: "https://example.com/scan.pdf"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
staffRoutes.put('/:staffId/licenses/:licenseId', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_UPDATE')], StaffController.updateLicense);

/**
 * @swagger
 * /api/staff/{staffId}/licenses/{licenseId}:
 *   delete:
 *     summary: Xóa Bằng cấp/Chứng chỉ
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền STAFF_UPDATE hoặc STAFF_DELETE.
 *       **Vai trò được phép:** Những người có quyền STAFF_UPDATE hoặc STAFF_DELETE.
 *       
 *       **Mô tả chi tiết:**
 *       - Xóa bỏ hoàn toàn một bản ghi chứng chỉ hành nghề hoặc bằng cấp khỏi hồ sơ của nhân viên.
 *       - Hành động này không thể hoàn tác.
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: licenseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xoá thành công
 */
staffRoutes.delete('/:staffId/licenses/:licenseId', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_UPDATE', 'STAFF_DELETE')], StaffController.deleteLicense);

// QUẢN LÝ TRẠNG THÁI VÀ VAI TRÒ

/**
 * @swagger
 * /api/staff/{staffId}/status:
 *   put:
 *     summary: Cập nhật trạng thái nhân sự
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền STAFF_UPDATE.
 *       **Vai trò được phép:** Những người có quyền có vai trò Quản lý (VD: ADMIN, SUPER_ADMIN).
 *       
 *       **Mô tả chi tiết:**
 *       - Cập nhật cờ trạng thái hoạt động (Status) của nhân viên trên hệ thống. Trạng thái hỗ trợ: `ACTIVE` (Hoạt động), `INACTIVE` (Tạm ngưng), `BANNED` (Rời đi/Cấm).
 *       - Bạn có thể ghi chú thêm lý do cập nhật vào trường `reason`.
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, BANNED]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
staffRoutes.put('/:staffId/status', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_UPDATE')], StaffController.updateStaffStatus);

/**
 * @swagger
 * /api/staff/{staffId}/roles:
 *   post:
 *     summary: Gán vai trò cho nhân sự
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền STAFF_UPDATE.
 *       **Vai trò được phép:** Những người quản trị hệ thống (Thường là ADMIN, SUPER_ADMIN).
 *       
 *       **Mô tả chi tiết:**
 *       - Cấp thêm một mã Vai trò (Role) mới cho Nhân sự.
 *       - Vì hệ thống cấp quyền đa dạng (Một người nắm lập nhiều Role), API này dùng để *thêm mới* (append) quyền cho user thay vì ghi đè bằng một mảng toàn bộ. Đóng vai trò nâng cấp quyền nhân sự.
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 description: Mã Role (VD DOCTOR, NURSE)
 *     responses:
 *       200:
 *         description: Cấp quyền thành công
 */
staffRoutes.post('/:staffId/roles', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_UPDATE')], StaffController.assignStaffRole);

/**
 * @swagger
 * /api/staff/{staffId}/roles/{roleId}:
 *   delete:
 *     summary: Thu hồi vai trò của nhân sự
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền STAFF_UPDATE.
 *       **Vai trò được phép:** Những người quản trị hệ thống (Thường là ADMIN, SUPER_ADMIN).
 *       
 *       **Mô tả chi tiết:**
 *       - Thu hồi/Xóa bỏ một Vai trò (Role) cụ thể khỏi Nhân sự (Xóa theo `roleId` hoặc `RoleCode` vd: `DOCTOR`).
 *       - Việc xóa 1 role chỉ ảnh hưởng đến quyền đó của nhân viên, các role khác mà nhân sự sở hữu vẫn được bảo toàn trọn vẹn.
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thu hồi thành công
 */
staffRoutes.delete('/:staffId/roles/:roleId', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_UPDATE')], StaffController.removeStaffRole);


// QUẢN LÝ CHI NHÁNH / KHÁM CHỮA BỆNH

/**
 * @swagger
 * /api/staff/{staffId}/branches:
 *   post:
 *     summary: Gán nhân sự vào chi nhánh / phòng ban
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền STAFF_UPDATE.
 *       **Vai trò được phép:** Những người có quyền xếp lịch hoặc Quản trị hệ thống (ADMIN, SUPER_ADMIN, MANAGER).
 *       
 *       **Mô tả chi tiết:**
 *       - Điều chuyển, Gán, Phân công nhân sự về trực thuộc làm việc tại một Chi nhánh (`branchId`) và phân khoa (`departmentId`) cụ thể.
 *       - Mỗi nhân sự có thể có một chức danh/vị trí (`roleTitle`) khác nhau ở từng chi nhánh.
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [branchId]
 *             properties:
 *               branchId:
 *                 type: string
 *               departmentId:
 *                 type: string
 *               roleTitle:
 *                 type: string
 *     responses:
 *       200:
 *         description: Phân công thành công
 */
staffRoutes.post('/:staffId/branches', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_UPDATE')], StaffController.assignStaffFacility);

/**
 * @swagger
 * /api/staff/{staffId}/branches/{branchId}:
 *   delete:
 *     summary: Xóa phân công nhân sự khỏi chi nhánh
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền STAFF_UPDATE.
 *       **Vai trò được phép:** Những người có quyền xếp lịch hoặc Quản trị hệ thống (ADMIN, SUPER_ADMIN, MANAGER).
 *       
 *       **Mô tả chi tiết:**
 *       - Chấm dứt điều động/Xóa phân công của một nhân sự khỏi một Chi nhánh chỉ định.
 *       - Có thể điền kèm `reason` (Lý do điều chuyển công tác). Record tại bảng `user_branch_dept` sẽ bị xóa đi lịch sử công tác.
 *     tags: [2.5 Quản lý Nhân sự y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Xóa phân công thành công
 */
staffRoutes.delete('/:staffId/branches/:branchId', [verifyAccessToken, checkSessionStatus, authorizePermissions('STAFF_UPDATE')], StaffController.removeStaffFacility);

export default staffRoutes;
