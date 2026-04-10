// src/routes/Patient Management/patient-document.routes.ts
import { Router } from 'express';
import multer from 'multer';
import { PatientDocumentController } from '../../controllers/Patient Management/patient-document.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

/**
 * @swagger
 * /api/patient-documents:
 *   post:
 *     summary: Upload tài liệu bệnh nhân
 *     description: |
 *       **Chức năng:** Upload file tài liệu lên Cloudinary và lưu metadata vào DB.
 *       Gửi dữ liệu dạng `multipart/form-data`. File sẽ được stream trực tiếp lên Cloudinary
 *       (không lưu tạm trên server).
 *
 *       **Định dạng cho phép:** JPG, PNG, WEBP, PDF.
 *       **Kích thước tối đa:** 5MB.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_DOC_MANAGE`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.5.1 Upload tài liệu bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, patient_id, document_type_id, document_name]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File tài liệu cần upload
 *               patient_id:
 *                 type: string
 *                 description: ID bệnh nhân (UUID)
 *                 example: "cf5abd71-7d05-44df-9a50-903e93a9a20b"
 *               document_type_id:
 *                 type: string
 *                 description: ID loại tài liệu
 *                 example: "DCT_260312_a1b2c3d4"
 *               document_name:
 *                 type: string
 *                 description: Tên hiển thị tài liệu
 *                 example: "CCCD Nguyễn Văn A"
 *               notes:
 *                 type: string
 *                 description: Ghi chú thêm (tùy chọn)
 *                 example: "Bản scan mặt trước"
 *     responses:
 *       201:
 *         description: Upload tài liệu thành công
 *       400:
 *         description: |
 *           - Thiếu trường bắt buộc (DOC_002)
 *           - File không hợp lệ (DOC_005, DOC_006, DOC_007)
 *           - Loại tài liệu không hợp lệ (DOC_004)
 *       404:
 *         description: Không tìm thấy bệnh nhân (DOC_003)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 *       500:
 *         description: Lỗi upload lên Cloudinary (DOC_008)
 */
router.post('/', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_DOC_MANAGE'), upload.single('file'), PatientDocumentController.upload);

/**
 * @swagger
 * /api/patient-documents:
 *   get:
 *     summary: Danh sách tài liệu bệnh nhân
 *     description: |
 *       **Chức năng:** Trả về danh sách tài liệu đã upload cho một bệnh nhân cụ thể.
 *       Hỗ trợ phân trang và filter theo loại tài liệu.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_DOC_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.5.1 Upload tài liệu bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patient_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bệnh nhân (UUID) — bắt buộc
 *         example: "cf5abd71-7d05-44df-9a50-903e93a9a20b"
 *       - in: query
 *         name: document_type_id
 *         schema:
 *           type: string
 *         description: Filter theo loại tài liệu (tùy chọn)
 *         example: "DCT_260312_a1b2c3d4"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số bản ghi mỗi trang (tối đa 100)
 *     responses:
 *       200:
 *         description: Danh sách tài liệu (phân trang)
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
 *                 total:
 *                   type: integer
 *                   example: 5
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 20
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *       404:
 *         description: Không tìm thấy bệnh nhân (DOC_003)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_DOC_VIEW'), PatientDocumentController.getList);

/**
 * @swagger
 * /api/patient-documents/{id}:
 *   get:
 *     summary: Chi tiết tài liệu
 *     description: |
 *       **Chức năng:** Trả về thông tin chi tiết của một tài liệu cụ thể,
 *       bao gồm URL file trên Cloudinary và thông tin loại tài liệu.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_DOC_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.5.1 Upload tài liệu bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tài liệu
 *         example: "DOC_260312_abcdef12"
 *     responses:
 *       200:
 *         description: Thông tin chi tiết tài liệu
 *       404:
 *         description: Không tìm thấy tài liệu (DOC_001)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_DOC_VIEW'), PatientDocumentController.getById);

/**
 * @swagger
 * /api/patient-documents/{id}:
 *   put:
 *     summary: Cập nhật metadata tài liệu
 *     description: |
 *       **Chức năng:** Cập nhật tên hiển thị, ghi chú, hoặc loại tài liệu.
 *       API này KHÔNG cho phép upload lại file — chỉ cập nhật thông tin metadata.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_DOC_MANAGE`.
 *       **Vai trò được phép:** Admin, Staff.
 *     tags: [2.5.1 Upload tài liệu bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tài liệu
 *         example: "DOC_260312_abcdef12"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               document_name:
 *                 type: string
 *                 description: Tên hiển thị mới
 *                 example: "CCCD Nguyễn Văn A (Mặt sau)"
 *               document_type_id:
 *                 type: string
 *                 description: Đổi sang loại tài liệu khác
 *                 example: "DCT_260312_a1b2c3d4"
 *               notes:
 *                 type: string
 *                 description: Ghi chú cập nhật
 *                 example: "Bản scan mặt sau CCCD"
 *     responses:
 *       200:
 *         description: Cập nhật metadata thành công
 *       400:
 *         description: Loại tài liệu không hợp lệ (DOC_004)
 *       404:
 *         description: Không tìm thấy tài liệu (DOC_001)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.put('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_DOC_MANAGE'), PatientDocumentController.updateMetadata);

/**
 * @swagger
 * /api/patient-documents/{id}:
 *   delete:
 *     summary: Xóa tài liệu (soft delete)
 *     description: |
 *       **Chức năng:** Xóa mềm tài liệu trong DB (đánh dấu `deleted_at`).
 *       File vật lý trên Cloudinary sẽ KHÔNG bị xóa nhằm phục vụ đối chiếu
 *       Audit pháp lý sau này.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_DOC_MANAGE`.
 *       **Vai trò được phép:** Admin, Staff.
 *     tags: [2.5.1 Upload tài liệu bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tài liệu
 *         example: "DOC_260312_abcdef12"
 *     responses:
 *       200:
 *         description: Xóa tài liệu thành công
 *       404:
 *         description: Không tìm thấy tài liệu (DOC_001)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.delete('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_DOC_MANAGE'), PatientDocumentController.delete);

// 2.5.4 QUẢN LÝ PHIÊN BẢN TÀI LIỆU 

/**
 * @swagger
 * /api/patient-documents/{id}/versions:
 *   post:
 *     summary: Upload phiên bản mới của tài liệu
 *     description: |
 *       **Chức năng:** Upload file mới để tạo phiên bản kế tiếp cho tài liệu.
 *       Hệ thống sẽ tự động:
 *       1. Lưu file hiện tại vào bảng lịch sử `patient_document_versions`.
 *       2. Upload file mới lên Cloudinary với tên `doc_{id}_v{N+1}`.
 *       3. Cập nhật bảng chính `patient_documents` với `file_url` mới và tăng `version_number` lên +1.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_DOC_MANAGE`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.5.4 Phiên bản tài liệu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tài liệu gốc
 *         example: "DOC_260312_abcdef12"
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
 *                 description: File phiên bản mới (JPG, PNG, WEBP, PDF, tối đa 5MB)
 *     responses:
 *       201:
 *         description: Upload phiên bản mới thành công, trả về bản ghi tài liệu đã cập nhật
 *       400:
 *         description: File không hợp lệ (DOC_005 / DOC_006 / DOC_007)
 *       404:
 *         description: Không tìm thấy tài liệu gốc (DOCV_001)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 *       500:
 *         description: Lỗi upload Cloudinary (DOC_008)
 */
router.post('/:id/versions', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_DOC_MANAGE'), upload.single('file'), PatientDocumentController.uploadVersion);

/**
 * @swagger
 * /api/patient-documents/{id}/versions:
 *   get:
 *     summary: Danh sách lịch sử phiên bản tài liệu
 *     description: |
 *       **Chức năng:** Trả về toàn bộ danh sách các phiên bản cũ của tài liệu, sắp xếp
 *       theo version mới nhất trên cùng. Bản hiện tại (mới nhất) luôn nằm trên bảng chính.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_DOC_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.5.4 Phiên bản tài liệu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tài liệu
 *         example: "DOC_260312_abcdef12"
 *     responses:
 *       200:
 *         description: Danh sách phiên bản cũ
 *       404:
 *         description: Không tìm thấy tài liệu (DOCV_001)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/:id/versions', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_DOC_VIEW'), PatientDocumentController.listVersions);

/**
 * @swagger
 * /api/patient-documents/{id}/versions/{versionId}:
 *   get:
 *     summary: Chi tiết 1 phiên bản cụ thể
 *     description: |
 *       **Chức năng:** Lấy thông tin chi tiết về một phiên bản lịch sử cụ thể,
 *       bao gồm URL file trên Cloudinary, định dạng, và kích thước.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_DOC_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.5.4 Phiên bản tài liệu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tài liệu gốc
 *         example: "DOC_260312_abcdef12"
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID phiên bản lịch sử
 *         example: "DOCV_260312_aabb1122"
 *     responses:
 *       200:
 *         description: Thông tin phiên bản
 *       404:
 *         description: Không tìm thấy (DOCV_001 / DOCV_002)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/:id/versions/:versionId', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_DOC_VIEW'), PatientDocumentController.getVersion);

// 2.5.5 XEM / TẢI TÀI LIỆU (Proxy View / Download)

/**
 * @swagger
 * /api/patient-documents/{id}/view:
 *   get:
 *     summary: Xem tài liệu trực tiếp (inline)
 *     description: |
 *       **Chức năng:** API proxy bảo mật để xem tài liệu trực tiếp trên trình duyệt.
 *       Sau khi xác thực quyền, server sẽ trả về HTTP 302 Redirect đến URL file thật
 *       trên Cloudinary. Trình duyệt sẽ hiển thị file inline (PDF mở trên tab, ảnh hiển thị).
 *
 *       *Ưu điểm so với truy cập thẳng URL:* User không lưu được link Cloudinary để share.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_DOC_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.5.5 Xem & Tải tài liệu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tài liệu
 *         example: "DOC_260312_abcdef12"
 *     responses:
 *       302:
 *         description: Redirect đến URL Cloudinary để xem inline
 *       404:
 *         description: Không tìm thấy tài liệu (DOC_001) hoặc chưa có file (DOCV_003)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/:id/view', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_DOC_VIEW'), PatientDocumentController.viewFile);

/**
 * @swagger
 * /api/patient-documents/{id}/download:
 *   get:
 *     summary: Tải tài liệu về máy (ép download)
 *     description: |
 *       **Chức năng:** API proxy bảo mật để ép tải file về máy.
 *       Sau khi xác thực quyền, server redirect đến Cloudinary URL kèm tham số
 *       `fl_attachment` — trình duyệt sẽ hiển thị hộp thoại "Lưu file" thay vì mở inline.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_DOC_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.5.5 Xem & Tải tài liệu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tài liệu
 *         example: "DOC_260312_abcdef12"
 *     responses:
 *       302:
 *         description: Redirect đến Cloudinary URL với flag fl_attachment để ép download
 *       404:
 *         description: Không tìm thấy tài liệu (DOC_001) hoặc chưa có file (DOCV_003)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/:id/download', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_DOC_VIEW'), PatientDocumentController.downloadFile);

export const patientDocumentRoutes = router;

