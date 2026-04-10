import { Router } from 'express';
import { PatientInsuranceController } from '../../controllers/Patient Management/patient-insurance.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';

const router = Router();

/**
 * @swagger
 * /api/patient-insurances:
 *   get:
 *     summary: Lấy danh sách thẻ bảo hiểm bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_VIEW.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở, Bác sĩ, Lễ tân.
 *
 *       Trả về danh sách thẻ bảo hiểm. Truyền query param `patient_id` để lọc theo bệnh nhân.
 *       Dữ liệu trả về bao gồm tên đơn vị bảo hiểm (JOIN từ bảng insurance_providers).
 *       Thẻ chính (is_primary = true) được sắp xếp lên đầu.
 *     tags: [2.3.2 Quản lý Thẻ Bảo hiểm Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patient_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bệnh nhân cần xem thẻ bảo hiểm
 *         example: "patient_uuid_here"
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
 *         description: Trả về danh sách thẻ bảo hiểm
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_VIEW'), PatientInsuranceController.getInsurances);

/**
 * @swagger
 * /api/patient-insurances/active:
 *   get:
 *     summary: Danh sách thẻ bảo hiểm còn hiệu lực
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_VIEW.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá, Customer, Patient.
 *
 *       Trả về danh sách thẻ bảo hiểm đang có hiệu lực (start_date <= TODAY <= end_date).
 *       Hỗ trợ lọc theo bệnh nhân (patient_id), phân trang.
 *     tags: [2.3.3 Hiệu lực Bảo hiểm]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patient_id
 *         schema:
 *           type: string
 *         description: Lọc theo ID bệnh nhân
 *         example: "patient_uuid_here"
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
 *         description: Danh sách thẻ bảo hiểm còn hiệu lực
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/active', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_VIEW'), PatientInsuranceController.getActiveInsurances);

/**
 * @swagger
 * /api/patient-insurances/expired:
 *   get:
 *     summary: Danh sách thẻ bảo hiểm đã hết hạn
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_VIEW.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá, Customer, Patient.
 *
 *       Trả về danh sách thẻ bảo hiểm đã hết hạn (end_date < TODAY).
 *       Sắp xếp theo ngày hết hạn mới nhất trước.
 *     tags: [2.3.3 Hiệu lực Bảo hiểm]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patient_id
 *         schema:
 *           type: string
 *         description: Lọc theo ID bệnh nhân
 *         example: "patient_uuid_here"
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
 *         description: Danh sách thẻ bảo hiểm đã hết hạn
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/expired', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_VIEW'), PatientInsuranceController.getExpiredInsurances);

/**
 * @swagger
 * /api/patient-insurances/{id}/history:
 *   get:
 *     summary: Lịch sử thay đổi thẻ bảo hiểm
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_VIEW.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá, Customer, Patient.
 *
 *       Truy vấn bảng audit_logs để lấy toàn bộ lịch sử thay đổi của thẻ bảo hiểm.
 *       Mỗi bản ghi gồm: hành động (CREATE/UPDATE/DELETE), giá trị cũ, giá trị mới, người thực hiện, thời gian.
 *     tags: [2.3.6 Lịch sử thay đổi Bảo hiểm]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID thẻ bảo hiểm
 *         example: "PI_260311_abc123"
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
 *         description: Lịch sử thay đổi thẻ bảo hiểm
 *       404:
 *         description: Không tìm thấy thẻ bảo hiểm
 */
router.get('/:id/history', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_VIEW'), PatientInsuranceController.getInsuranceHistory);

/**
 * @swagger
 * /api/patient-insurances/{id}:
 *   get:
 *     summary: Lấy chi tiết thẻ bảo hiểm
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_VIEW.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở, Bác sĩ, Lễ tân.
 *
 *       Trả về chi tiết thẻ bảo hiểm kèm tên đơn vị bảo hiểm.
 *     tags: [2.3.2 Quản lý Thẻ Bảo hiểm Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID thẻ bảo hiểm
 *         example: "PI_260311_abc123"
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy thẻ bảo hiểm
 */
router.get('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_VIEW'), PatientInsuranceController.getInsuranceById);

/**
 * @swagger
 * /api/patient-insurances:
 *   post:
 *     summary: Thêm thẻ bảo hiểm mới cho bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_UPDATE.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở, Lễ tân.
 *
 *       Thêm mới thẻ bảo hiểm cho bệnh nhân. Hệ thống tự động:
 *       - Thẻ đầu tiên là thẻ chính.
 *       - Đánh dấu bệnh nhân has_insurance = true.
 *     tags: [2.3.2 Quản lý Thẻ Bảo hiểm Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patient_id
 *               - provider_id
 *               - insurance_number
 *               - start_date
 *               - end_date
 *             properties:
 *               patient_id:
 *                 type: string
 *                 example: "patient_uuid_here"
 *               provider_id:
 *                 type: string
 *                 example: "PRV_260311_a1b2c3"
 *               insurance_number:
 *                 type: string
 *                 example: "DK2-12345678901"
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-01"
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: "2025-12-31"
 *               coverage_percent:
 *                 type: integer
 *                 example: 80
 *               is_primary:
 *                 type: boolean
 *                 example: true
 *               document_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Thêm thẻ thành công
 *       400:
 *         description: Trùng số thẻ / Ngày không hợp lệ
 *       404:
 *         description: Không tìm thấy bệnh nhân hoặc đơn vị bảo hiểm
 */
router.post('/', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_UPDATE'), PatientInsuranceController.createInsurance);

/**
 * @swagger
 * /api/patient-insurances/{id}:
 *   put:
 *     summary: Cập nhật thông tin thẻ bảo hiểm
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_UPDATE.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở, Lễ tân.
 *
 *       Cập nhật thẻ bảo hiểm (gia hạn, đổi mức hưởng, đổi thẻ chính...).
 *     tags: [2.3.2 Quản lý Thẻ Bảo hiểm Bệnh nhân]
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
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-12-31"
 *               coverage_percent:
 *                 type: integer
 *                 example: 95
 *               is_primary:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Ngày không hợp lệ / Trùng số thẻ
 *       404:
 *         description: Không tìm thấy thẻ bảo hiểm
 */
router.put('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_UPDATE'), PatientInsuranceController.updateInsurance);

/**
 * @swagger
 * /api/patient-insurances/{id}:
 *   delete:
 *     summary: Xóa thẻ bảo hiểm
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_UPDATE.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở, Lễ tân.
 *
 *       Xóa vĩnh viễn thẻ bảo hiểm. Tự động cập nhật lại cờ has_insurance.
 *     tags: [2.3.2 Quản lý Thẻ Bảo hiểm Bệnh nhân]
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
 *         description: Không tìm thấy thẻ bảo hiểm
 */
router.delete('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_UPDATE'), PatientInsuranceController.deleteInsurance);

export default router;
