// src/routes/Facility Management/license.routes.ts
import { Router } from 'express';
import { LicenseController } from '../../controllers/Facility Management/license.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';
import multer from 'multer';
import { LICENSE_CONFIG } from '../../constants/system.constant';

const router = Router();

// Multer dùng memoryStorage để upload buffer thẳng lên Cloudinary
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: LICENSE_CONFIG.MAX_FILE_SIZE },
});

/**
 * @swagger
 * /api/licenses:
 *   post:
 *     summary: Tạo giấy phép / chứng chỉ mới
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền LICENSE_CREATE.
 *       **Vai trò được phép:** SUPER_ADMIN, ADMIN, MANAGER.
 *
 *       **Mô tả chi tiết:**
 *       Thêm một giấy phép/chứng chỉ hành nghề cho nhân viên y tế.
 *       - `license_type`: Loại chứng chỉ (vd: Chứng chỉ hành nghề, Bằng đại học, Chứng chỉ chuyên khoa, Chứng chỉ đào tạo).
 *       - `license_number`: Số hiệu giấy phép (UNIQUE trên toàn hệ thống).
 *       - `expiry_date`: Có thể null nếu chứng chỉ không có hạn.
 *       - `document_url`: Link ảnh/PDF bản scan chứng chỉ gốc.
 *     tags: [2.7 Giấy phép & Chứng chỉ]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, license_type, license_number, issue_date]
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: "ID nhân viên sở hữu giấy phép"
 *                 example: "USR_1772759878344_3d2f6458"
 *               license_type:
 *                 type: string
 *                 description: "Loại giấy phép"
 *                 example: "Chứng chỉ hành nghề"
 *               license_number:
 *                 type: string
 *                 description: "Số hiệu giấy phép (Unique)"
 *                 example: "CCHN-2024-001234"
 *               issue_date:
 *                 type: string
 *                 format: date
 *                 description: "Ngày cấp"
 *                 example: "2024-06-15"
 *               expiry_date:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 description: "Ngày hết hạn (null nếu vô thời hạn)"
 *                 example: "2029-06-15"
 *               issued_by:
 *                 type: string
 *                 nullable: true
 *                 description: "Nơi cấp"
 *                 example: "Sở Y tế TP.HCM"
 *               document_url:
 *                 type: string
 *                 nullable: true
 *                 description: "Link ảnh/PDF bản scan"
 *                 example: "https://storage.example.com/licenses/cchn-001234.pdf"
 *     responses:
 *       201:
 *         description: Tạo giấy phép thành công
 *       400:
 *         description: Thiếu thông tin hoặc ngày cấp > ngày hết hạn
 *       409:
 *         description: Số giấy phép đã tồn tại
 */
router.post('/', verifyAccessToken, checkSessionStatus, authorizePermissions('LICENSE_CREATE'), LicenseController.createLicense);

/**
 * @swagger
 * /api/licenses:
 *   get:
 *     summary: Lấy danh sách giấy phép
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền LICENSE_VIEW.
 *       **Vai trò được phép:** Tất cả nhân viên (View), Admin/Manager.
 *
 *       **Mô tả:** Trả về danh sách giấy phép kèm tên nhân viên, số ngày còn lại, trạng thái hết hạn.
 *       Có thể lọc theo `user_id`, `license_type`, `expiring_in_days` (cảnh báo sắp hết hạn).
 *
 *       **Ví dụ cảnh báo:** `?expiring_in_days=30` sẽ trả về tất cả giấy phép hết hạn trong vòng 30 ngày tới + đã hết hạn.
 *     tags: [2.7 Giấy phép & Chứng chỉ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: Lọc theo nhân viên
 *       - in: query
 *         name: license_type
 *         schema:
 *           type: string
 *         description: "Lọc theo loại (vd: Chứng chỉ hành nghề)"
 *       - in: query
 *         name: expiring_in_days
 *         schema:
 *           type: integer
 *         description: "Cảnh báo: lọc giấy phép hết hạn trong X ngày tới"
 *         example: 30
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', verifyAccessToken, checkSessionStatus, authorizePermissions('LICENSE_VIEW'), LicenseController.getLicenses);

/**
 * @swagger
 * /api/licenses/dashboard/expiring:
 *   get:
 *     summary: Dashboard - Giấy phép sắp hết hạn
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền LICENSE_VIEW.
 *       **Vai trò được phép:** SUPER_ADMIN, ADMIN, MANAGER.
 *
 *       **Mô tả chi tiết:**
 *       Trả về danh sách giấy phép **sắp hết hạn** trong vòng N ngày tới (mặc định 30 ngày).
 *       Kết quả trả về kèm `days_remaining` (số ngày còn lại), `full_name` (tên nhân viên).
 *       Sắp xếp theo ngày hết hạn tăng dần (sắp hết hạn nhất ở đầu).
 *     tags: [2.7 Giấy phép & Chứng chỉ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: "Số ngày tới để lọc (vd: 30, 60, 90)"
 *         example: 30
 *     responses:
 *       200:
 *         description: Thành công
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
 *                   example: "Danh sách giấy phép sắp hết hạn trong 30 ngày"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       licenses_id:
 *                         type: string
 *                       full_name:
 *                         type: string
 *                       license_type:
 *                         type: string
 *                       expiry_date:
 *                         type: string
 *                       days_remaining:
 *                         type: integer
 */
router.get('/dashboard/expiring', verifyAccessToken, checkSessionStatus, authorizePermissions('LICENSE_VIEW'), LicenseController.getExpiringLicenses);

/**
 * @swagger
 * /api/licenses/dashboard/expired:
 *   get:
 *     summary: Dashboard - Giấy phép đã hết hạn
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền LICENSE_VIEW.
 *       **Vai trò được phép:** SUPER_ADMIN, ADMIN, MANAGER.
 *
 *       **Mô tả chi tiết:**
 *       Trả về danh sách giấy phép **đã quá hạn** (expiry_date < ngày hiện tại).
 *       Kết quả kèm `days_remaining` (giá trị âm = số ngày đã quá hạn), `full_name` (tên nhân viên).
 *       Sắp xếp theo ngày hết hạn tăng dần (quá hạn lâu nhất ở đầu).
 *     tags: [2.7 Giấy phép & Chứng chỉ]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
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
 *                   example: "Danh sách giấy phép đã hết hạn"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       licenses_id:
 *                         type: string
 *                       full_name:
 *                         type: string
 *                       license_type:
 *                         type: string
 *                       expiry_date:
 *                         type: string
 *                       days_remaining:
 *                         type: integer
 *                         description: "Giá trị âm = số ngày đã quá hạn"
 */
router.get('/dashboard/expired', verifyAccessToken, checkSessionStatus, authorizePermissions('LICENSE_VIEW'), LicenseController.getExpiredLicenses);

/**
 * @swagger
 * /api/licenses/{id}:
 *   get:
 *     summary: Chi tiết 1 giấy phép
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền LICENSE_VIEW.
 *
 *       **Mô tả:** Trả về thông tin chi tiết giấy phép bao gồm tên nhân viên, số ngày còn lại (days_remaining), cờ hết hạn (is_expired).
 *     tags: [2.7 Giấy phép & Chứng chỉ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "LIC_2603_abcd1234"
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Giấy phép không tồn tại
 */
router.get('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('LICENSE_VIEW'), LicenseController.getLicenseById);

/**
 * @swagger
 * /api/licenses/{id}:
 *   put:
 *     summary: Cập nhật giấy phép
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền LICENSE_UPDATE.
 *       **Vai trò được phép:** SUPER_ADMIN, ADMIN, MANAGER.
 *
 *       **Mô tả:** Cập nhật thông tin giấy phép (loại, số hiệu, ngày, nơi cấp, link bản scan).
 *     tags: [2.7 Giấy phép & Chứng chỉ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               license_type:
 *                 type: string
 *                 example: "Chứng chỉ chuyên khoa"
 *               license_number:
 *                 type: string
 *                 example: "CCCK-2024-005678"
 *               issue_date:
 *                 type: string
 *                 format: date
 *                 example: "2024-08-01"
 *               expiry_date:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 example: "2029-08-01"
 *               issued_by:
 *                 type: string
 *                 example: "Bộ Y tế"
 *               document_url:
 *                 type: string
 *                 example: "https://storage.example.com/licenses/ccck-005678.pdf"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Ngày cấp > ngày hết hạn
 *       404:
 *         description: Giấy phép không tồn tại
 *       409:
 *         description: Số giấy phép đã tồn tại
 */
router.put('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('LICENSE_UPDATE'), LicenseController.updateLicense);

/**
 * @swagger
 * /api/licenses/{id}:
 *   delete:
 *     summary: Xóa / disable giấy phép
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền LICENSE_DELETE.
 *       **Vai trò được phép:** SUPER_ADMIN, ADMIN, MANAGER.
 *
 *       **Mô tả:** Thực hiện Soft Delete (đánh dấu deleted_at). Giấy phép sẽ không hiển thị trong danh sách nữa.
 *     tags: [2.7 Giấy phép & Chứng chỉ]
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
 *         description: Xóa thành công
 *       404:
 *         description: Giấy phép không tồn tại
 */
router.delete('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('LICENSE_DELETE'), LicenseController.deleteLicense);

/**
 * @swagger
 * /api/licenses/{id}/upload:
 *   post:
 *     summary: Upload file giấy phép (PDF, JPG, PNG)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền LICENSE_UPDATE.
 *       **Vai trò được phép:** SUPER_ADMIN, ADMIN, MANAGER.
 *
 *       **Mô tả chi tiết:**
 *       Upload bản scan/ảnh chụp giấy phép hành nghề lên hệ thống (Cloudinary).
 *       - Hỗ trợ định dạng: **PDF, JPG, PNG** (giới hạn **10MB**).
 *       - File sẽ ghi đè nếu giấy phép này đã có file trước đó.
 *       - Sau khi upload, hệ thống tự cập nhật `document_url` trong database.
 *     tags: [2.7 Giấy phép & Chứng chỉ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID giấy phép cần upload file"
 *         example: "LIC_2603_abcd1234"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: "File PDF, JPG hoặc PNG (tối đa 10MB)"
 *     responses:
 *       200:
 *         description: Upload thành công
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
 *                   example: "Upload file giấy phép thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     document_url:
 *                       type: string
 *                       example: "https://res.cloudinary.com/demo/raw/upload/ehealth/licenses/license_LIC_2603_abcd1234.pdf"
 *       400:
 *         description: Thiếu file hoặc định dạng không hợp lệ
 *       404:
 *         description: Giấy phép không tồn tại
 *       500:
 *         description: Lỗi upload lên Cloudinary
 */
router.post('/:id/upload', verifyAccessToken, checkSessionStatus, authorizePermissions('LICENSE_UPDATE'), upload.single('file'), LicenseController.uploadFile);

/**
 * @swagger
 * /api/licenses/{id}/file:
 *   get:
 *     summary: Xem file giấy phép
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền LICENSE_VIEW.
 *
 *       **Mô tả:** Trả về URL file đính kèm (ảnh/PDF bản scan). Frontend có thể dùng URL này để hiển thị hoặc tải xuống.
 *     tags: [2.7 Giấy phép & Chứng chỉ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "LIC_2603_abcd1234"
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     document_url:
 *                       type: string
 *                       example: "https://res.cloudinary.com/demo/image/upload/ehealth/licenses/license_LIC_2603_abcd1234.jpg"
 *       404:
 *         description: Giấy phép không tồn tại hoặc chưa có file đính kèm
 */
router.get('/:id/file', verifyAccessToken, checkSessionStatus, authorizePermissions('LICENSE_VIEW'), LicenseController.getFile);

/**
 * @swagger
 * /api/licenses/{id}/file:
 *   delete:
 *     summary: Xóa file giấy phép
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền LICENSE_DELETE.
 *       **Vai trò được phép:** SUPER_ADMIN, ADMIN, MANAGER.
 *
 *       **Mô tả:** Xóa vĩnh viễn file trên Cloudinary và set `document_url = null` trong database.
 *       Chỉ xóa file đính kèm, bản ghi giấy phép vẫn còn trong hệ thống.
 *     tags: [2.7 Giấy phép & Chứng chỉ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "LIC_2603_abcd1234"
 *     responses:
 *       200:
 *         description: Xóa file thành công
 *       404:
 *         description: Giấy phép không tồn tại hoặc chưa có file đính kèm
 */
router.delete('/:id/file', verifyAccessToken, checkSessionStatus, authorizePermissions('LICENSE_DELETE'), LicenseController.deleteFile);

export const licenseRoutes = router;
