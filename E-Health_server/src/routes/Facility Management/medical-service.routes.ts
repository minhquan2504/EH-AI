import { Router } from 'express';
import { MasterServiceController } from '../../controllers/Core/service.controller';
import { FacilityServiceController } from '../../controllers/Facility Management/facility-service.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';
import { uploadExcel } from '../../middleware/upload.middleware';

const router = Router();

// Middleware chung cho nhóm API này
router.use(verifyAccessToken);
router.use(checkSessionStatus);

/**
 * 1. DANH MỤC DỊCH VỤ CHUẨN QUỐC GIA (MASTER SERVICES)
 */

/**
 * @swagger
 * tags:
 *   name: 2.9.3 Quản lý danh mục dịch vụ chuẩn
 *   description: Quản lý danh mục gốc các dịch vụ y tế (chưa bao gồm giá)
 */

/**
 * @swagger
 * /api/medical-services/master:
 *   get:
 *     summary: Lấy danh sách dịch vụ chuẩn
 *     description: |
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF
 *
 *     tags: [2.9.3 Quản lý danh mục dịch vụ chuẩn]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo tên hoặc mã
 *       - in: query
 *         name: serviceGroup
 *         schema:
 *           type: string
 *           example: KHAM
 *         description: Nhóm dịch vụ (KHAM, XN, CDHA, THUTHUAT)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái
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
 *         description: Danh sách dịch vụ chuẩn
 */
router.get('/master', authorizePermissions('SERVICE_VIEW'), MasterServiceController.getServices);

/**
 * @swagger
 * /api/medical-services/master/export:
 *   get:
 *     summary: Xuất danh sách dịch vụ chuẩn ra file Excel
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *     tags: [2.9.3 Quản lý danh mục dịch vụ chuẩn]
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
router.get('/master/export', authorizePermissions('SERVICE_EXPORT'), MasterServiceController.exportServices);

/**
 * @swagger
 * /api/medical-services/master/import:
 *   post:
 *     summary: Import danh sách dịch vụ chuẩn bằng file Excel
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *       Tải lên file Excel (.xlsx). Yêu cầu cột "Mã Dịch Vụ (*)" và "Tên Dịch Vụ (*)".
 *     tags: [2.9.3 Quản lý danh mục dịch vụ chuẩn]
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
router.post('/master/import', authorizePermissions('SERVICE_IMPORT'), uploadExcel.single('file'), MasterServiceController.importServices);

/**
 * @swagger
 * /api/medical-services/master/{id}:
 *   get:
 *     summary: Lấy chi tiết dịch vụ chuẩn
 *     description: |
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF
 *
 *     tags: [2.9.3 Quản lý danh mục dịch vụ chuẩn]
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
 *         description: Chi tiết dịch vụ
 *       404:
 *         description: Không tìm thấy (SRV_001)
 */
router.get('/master/:id', authorizePermissions('SERVICE_VIEW'), MasterServiceController.getServiceById);

/**
 * @swagger
 * /api/medical-services/master:
 *   post:
 *     summary: Tạo dịch vụ chuẩn mới
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *     tags: [2.9.3 Quản lý danh mục dịch vụ chuẩn]
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
 *                 example: "XN_MAU_TONG_QUAT"
 *               name:
 *                 type: string
 *                 example: "Xét nghiệm máu tổng quát 32 chỉ số"
 *               service_group:
 *                 type: string
 *                 example: "XN"
 *               service_type:
 *                 type: string
 *                 example: "LABORATORY"
 *                 description: "Phân loại: CLINICAL, LABORATORY, RADIOLOGY, PROCEDURE"
 *               insurance_code:
 *                 type: string
 *                 example: "XN.2001"
 *                 description: "Mã dịch vụ BHYT quốc gia (nếu có)"
 *               description:
 *                 type: string
 *                 example: "Bao gồm công thức máu, sinh hóa, miễn dịch cơ bản"
 *               is_active:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Khởi tạo thành công
 *       400:
 *         description: Lỗi trùng mã (SRV_002)
 */
router.post('/master', authorizePermissions('SERVICE_CREATE'), MasterServiceController.createService);

/**
 * @swagger
 * /api/medical-services/master/{id}:
 *   put:
 *     summary: Cập nhật dịch vụ chuẩn
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *     tags: [2.9.3 Quản lý danh mục dịch vụ chuẩn]
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
 *                 example: "Xét nghiệm máu tổng quát nâng cao"
 *               service_group:
 *                 type: string
 *                 example: "XN"
 *               service_type:
 *                 type: string
 *                 example: "LABORATORY"
 *                 description: "Phân loại: CLINICAL, LABORATORY, RADIOLOGY, PROCEDURE"
 *               insurance_code:
 *                 type: string
 *                 example: "XN.2001"
 *                 description: "Mã dịch vụ BHYT quốc gia (nếu có)"
 *               description:
 *                 type: string
 *                 example: "Đã cập nhật mô tả"
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy (SRV_001)
 */
router.put('/master/:id', authorizePermissions('SERVICE_UPDATE'), MasterServiceController.updateService);

/**
 * @swagger
 * /api/medical-services/master/{id}/status:
 *   patch:
 *     summary: Khóa / Mở khóa dịch vụ chuẩn
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *     tags: [2.9.3 Quản lý danh mục dịch vụ chuẩn]
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
 *         description: Thành công
 */
router.patch('/master/:id/status', authorizePermissions('SERVICE_UPDATE'), MasterServiceController.toggleServiceStatus);

/**
 * @swagger
 * /api/medical-services/master/{id}:
 *   delete:
 *     summary: Xóa mềm dịch vụ chuẩn
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *     tags: [2.9.3 Quản lý danh mục dịch vụ chuẩn]
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
 *         description: Đã xóa thành công
 *       404:
 *         description: Không tìm thấy
 */
router.delete('/master/:id', authorizePermissions('SERVICE_DELETE'), MasterServiceController.deleteService);

/**
 * =========================================================================
 * 2. CẤU HÌNH DỊCH VỤ TẠI CƠ SỞ (FACILITY SERVICES)
 * Nhóm API này dùng để cấu hình giá, thời gian thủ thuật, gán vào Khoa/Phòng
 * =========================================================================
 */

/**
 * @swagger
 * tags:
 *   name: 2.9.4 Quản lý dịch vụ cơ sở
 *   description: Cấu hình giá tiền, phòng ban thực hiện tại từng cơ sở
 */

/**
 * @swagger
 * /api/medical-services/facilities/{facilityId}/services:
 *   get:
 *     summary: Lấy danh sách dịch vụ tại 1 cơ sở
 *     description: |
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF
 *
 *     tags: [2.9.4 Quản lý dịch vụ cơ sở]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema:
 *           type: string
 *           example: "FAC_01"
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: Lọc theo khoa phòng (VD Khoa Nội)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo tên dịch vụ
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
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
 *         description: Danh sách dịch vụ kèm giá
 */
router.get('/facilities/:facilityId/services', authorizePermissions('FACILITY_SERVICE_VIEW'), FacilityServiceController.getFacilityServices);

/**
 * @swagger
 * /api/medical-services/facilities/{facilityId}/services/export:
 *   get:
 *     summary: Xuất danh sách dịch vụ cơ sở ra file Excel
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *     tags: [2.9.4 Quản lý dịch vụ cơ sở]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facilityId
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
router.get('/facilities/:facilityId/services/export', authorizePermissions('FACILITY_SERVICE_EXPORT'), FacilityServiceController.exportFacilityServices);

/**
 * @swagger
 * /api/medical-services/facilities/{facilityId}/services/import:
 *   post:
 *     summary: Import danh sách dịch vụ cơ sở bằng file Excel
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *       Tải lên file Excel (.xlsx). Yêu cầu cột "Mã Dịch Vụ Chuẩn (*)" và "Giá Cơ Bản (VNĐ) (*)". Phải thuộc 1 cơ sở cụ thể.
 *     tags: [2.9.4 Quản lý dịch vụ cơ sở]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facilityId
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
router.post('/facilities/:facilityId/services/import', authorizePermissions('FACILITY_SERVICE_IMPORT'), uploadExcel.single('file'), FacilityServiceController.importFacilityServices);

/**
 * @swagger
 * /api/medical-services/facilities/{facilityId}/active-services:
 *   get:
 *     summary: API load nhanh dịch vụ đang Hoạt động cho Dropdown Bác sĩ
 *     description: |
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF
 *
 *     tags: [2.9.4 Quản lý dịch vụ cơ sở]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema:
 *           type: string
 *           example: "FAC_01"
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách tối đa 50 dịch vụ khớp tiêu chí
 */
router.get('/facilities/:facilityId/active-services', authorizePermissions('FACILITY_SERVICE_VIEW'), FacilityServiceController.getActiveFacilityServices);

/**
 * @swagger
 * /api/medical-services/facilities/services/{id}:
 *   get:
 *     summary: Lấy chi tiết cấu hình dịch vụ cơ sở
 *     description: |
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF
 *
 *     tags: [2.9.4 Quản lý dịch vụ cơ sở]
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
 *         description: Chi tiết
 *       404:
 *         description: Không tìm thấy (FSRV_001)
 */
router.get('/facilities/services/:id', authorizePermissions('FACILITY_SERVICE_VIEW'), FacilityServiceController.getFacilityServiceById);

/**
 * @swagger
 * /api/medical-services/facilities/{facilityId}/services:
 *   post:
 *     summary: Thêm dịch vụ vào cơ sở
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *     tags: [2.9.4 Quản lý dịch vụ cơ sở]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema:
 *           type: string
 *           example: "FAC_01"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - service_id
 *               - base_price
 *             properties:
 *               service_id:
 *                 type: string
 *                 example: "SRV_MASTER_SA_BUNG"
 *                 description: ID dịch vụ chuẩn
 *               department_id:
 *                 type: string
 *                 example: "DEPT_HCM_CDHA"
 *                 description: Nên gán vào khoa Chẩn đoán hình ảnh
 *               base_price:
 *                 type: number
 *                 example: 300000
 *               insurance_price:
 *                 type: number
 *                 example: 120000
 *               estimated_duration_minutes:
 *                 type: number
 *                 example: 20
 *               is_active:
 *                 type: boolean
 *                 default: true
 *               vip_price:
 *                 type: number
 *                 example: 500000
 *                 description: "Giá VIP dành cho bệnh nhân ưu tiên (VNĐ)"
 *     responses:
 *       201:
 *         description: Thành công
 *       400:
 *         description: Lỗi trùng lặp hoặc sai ID (FSRV_002, SRV_001)
 */
router.post('/facilities/:facilityId/services', authorizePermissions('FACILITY_SERVICE_CREATE'), FacilityServiceController.createFacilityService);

/**
 * @swagger
 * /api/medical-services/facilities/services/{id}:
 *   put:
 *     summary: Sửa cấu hình (Đổi giá, đổi phòng) cho dịch vụ cơ sở
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *     tags: [2.9.4 Quản lý dịch vụ cơ sở]
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
 *               department_id:
 *                 type: string
 *                 example: "DEPT_HCM_NOI"
 *               base_price:
 *                 type: number
 *                 example: 500000
 *               insurance_price:
 *                 type: number
 *                 example: 150000
 *               estimated_duration_minutes:
 *                 type: number
 *                 example: 30
 *               is_active:
 *                 type: boolean
 *               vip_price:
 *                 type: number
 *                 example: 700000
 *                 description: "Giá VIP (VNĐ)"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/facilities/services/:id', authorizePermissions('FACILITY_SERVICE_UPDATE'), FacilityServiceController.updateFacilityService);

/**
 * @swagger
 * /api/medical-services/facilities/services/{id}/status:
 *   patch:
 *     summary: Ngưng/Bật cung cấp dịch vụ tại cơ sở
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *     tags: [2.9.4 Quản lý dịch vụ cơ sở]
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
 *         description: Ngưng cung cấp thành công
 */
router.patch('/facilities/services/:id/status', authorizePermissions('FACILITY_SERVICE_UPDATE'), FacilityServiceController.toggleFacilityServiceStatus);

export default router;
