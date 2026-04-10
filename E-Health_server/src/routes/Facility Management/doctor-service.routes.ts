import { Router } from 'express';
import { DoctorServiceController } from '../../controllers/Facility Management/doctor-service.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const router = Router();

router.use(verifyAccessToken);
router.use(checkSessionStatus);

/**
 * @swagger
 * tags:
 *   name: 2.9.2 Gán dịch vụ - Bác sĩ
 *   description: |
 *     Quản lý liên kết giữa Bác sĩ và Dịch vụ cơ sở (Facility Service).
 *     Không phải bác sĩ nào cũng được phép thực hiện mọi dịch vụ.
 *     Bảng mapping này xác định chính xác bác sĩ nào làm dịch vụ nào tại cơ sở.
 */

/**
 * @swagger
 * /api/doctor-services/active-doctors:
 *   get:
 *     summary: Lấy danh sách bác sĩ đang hoạt động (dropdown đặt lịch)
 *     description: |
 *       Truy vấn trực tiếp bảng `doctors` với `is_active = true`.
 *       Trả về `doctors_id`, `full_name`, `specialty_name`, `title`, `consultation_fee`.
 *       **Dùng cho dropdown đặt lịch khám** — giá trị value là `doctors_id`.
 *
 *       **Phân quyền:** Yêu cầu quyền `DOCTOR_SERVICE_VIEW`
 *
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF
 *     tags: [2.9.2 Gán dịch vụ - Bác sĩ]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách bác sĩ hoạt động
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
 *                       doctors_id:
 *                         type: string
 *                         example: "DOC_99f009e8-db9f-4298-81b0-1ae000e48664"
 *                       full_name:
 *                         type: string
 *                         example: "BS. Nguyễn Văn A"
 *                       specialty_name:
 *                         type: string
 *                         example: "Nội tổng quát"
 *                       title:
 *                         type: string
 *                         example: "ThS.BS"
 *                       consultation_fee:
 *                         type: number
 *                         example: 200000
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
router.get('/active-doctors', authorizePermissions('DOCTOR_SERVICE_VIEW'), DoctorServiceController.getActiveDoctors);

/**
 * @swagger
 * /api/doctor-services/{doctorId}/services:
 *   get:
 *     summary: Lấy danh sách dịch vụ được gán cho bác sĩ
 *     description: |
 *       Trả về danh sách tất cả dịch vụ cơ sở (Facility Services) mà bác sĩ được phép thực hiện.
 *       Bao gồm thông tin giá, mã dịch vụ, nhóm dịch vụ.
 *
 *       **Phân quyền:** Yêu cầu quyền `DOCTOR_SERVICE_VIEW`
 *
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF
 *     tags: [2.9.2 Gán dịch vụ - Bác sĩ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *           example: "DOC_001"
 *         description: ID của bác sĩ (doctors_id)
 *     responses:
 *       200:
 *         description: Danh sách dịch vụ của bác sĩ
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
 *                       doctor_id:
 *                         type: string
 *                       facility_service_id:
 *                         type: string
 *                       is_primary:
 *                         type: boolean
 *                       service_code:
 *                         type: string
 *                       service_name:
 *                         type: string
 *                       service_group:
 *                         type: string
 *                       base_price:
 *                         type: string
 *                       insurance_price:
 *                         type: string
 *                       vip_price:
 *                         type: string
 *       404:
 *         description: Bác sĩ không tồn tại (DSRV_001)
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
router.get('/:doctorId/services', authorizePermissions('DOCTOR_SERVICE_VIEW'), DoctorServiceController.getServicesByDoctor);

/**
 * @swagger
 * /api/doctor-services/by-facility-service/{facilityServiceId}:
 *   get:
 *     summary: Lấy danh sách bác sĩ thực hiện 1 dịch vụ cơ sở
 *     description: |
 *       Tra cứu ngược: Xem dịch vụ cơ sở này có bao nhiêu bác sĩ được phép thực hiện.
 *       Hữu ích khi đặt lịch khám hoặc chỉ định dịch vụ.
 *
 *       **Phân quyền:** Yêu cầu quyền `DOCTOR_SERVICE_VIEW`
 *
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF
 *     tags: [2.9.2 Gán dịch vụ - Bác sĩ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facilityServiceId
 *         required: true
 *         schema:
 *           type: string
 *           example: "FSRV_001"
 *         description: ID của dịch vụ cơ sở (facility_services_id)
 *     responses:
 *       200:
 *         description: Danh sách bác sĩ thực hiện dịch vụ
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
 *                       doctor_id:
 *                         type: string
 *                       facility_service_id:
 *                         type: string
 *                       is_primary:
 *                         type: boolean
 *                       doctor_name:
 *                         type: string
 *       404:
 *         description: Dịch vụ cơ sở không tồn tại (FSRV_001)
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
router.get('/by-facility-service/:facilityServiceId', authorizePermissions('DOCTOR_SERVICE_VIEW'), DoctorServiceController.getDoctorsByFacilityService);

/**
 * @swagger
 * /api/doctor-services/{doctorId}/services:
 *   post:
 *     summary: Gán danh sách dịch vụ cơ sở cho bác sĩ
 *     description: |
 *       Gán (Replace) toàn bộ danh sách dịch vụ cơ sở cho bác sĩ.
 *       Chiến lược: Xoá hết mapping cũ → Gán mới theo danh sách `facility_service_ids`.
 *       Phù hợp với UI dạng checkbox.
 *
 *       **Phân quyền:** Yêu cầu quyền `DOCTOR_SERVICE_ASSIGN`
 *
 *       **Vai trò được phép:** ADMIN, STAFF
 *     tags: [2.9.2 Gán dịch vụ - Bác sĩ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *           example: "DOC_001"
 *         description: ID của bác sĩ (doctors_id)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - facility_service_ids
 *             properties:
 *               facility_service_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["FSRV_001", "FSRV_002"]
 *                 description: Danh sách facility_services_id cần gán cho bác sĩ
 *               is_primary:
 *                 type: boolean
 *                 default: true
 *                 description: Bác sĩ là người thực hiện chính hay không
 *     responses:
 *       200:
 *         description: Gán thành công
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
 *                   example: "Đã gán 2 dịch vụ cho bác sĩ thành công."
 *                 assigned:
 *                   type: number
 *                   example: 2
 *                 skipped:
 *                   type: number
 *                   example: 0
 *       400:
 *         description: Danh sách rỗng (DSRV_004) hoặc facility_service_id không hợp lệ (FSRV_001)
 *       404:
 *         description: Bác sĩ không tồn tại (DSRV_001)
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
router.post('/:doctorId/services', authorizePermissions('DOCTOR_SERVICE_ASSIGN'), DoctorServiceController.assignServices);

/**
 * @swagger
 * /api/doctor-services/{doctorId}/services/{facilityServiceId}:
 *   delete:
 *     summary: Gỡ 1 dịch vụ khỏi bác sĩ
 *     description: |
 *       Xoá liên kết giữa bác sĩ và 1 dịch vụ cơ sở cụ thể.
 *
 *       **Phân quyền:** Yêu cầu quyền `DOCTOR_SERVICE_ASSIGN`
 *
 *       **Vai trò được phép:** ADMIN, STAFF
 *     tags: [2.9.2 Gán dịch vụ - Bác sĩ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *           example: "DOC_001"
 *         description: ID của bác sĩ
 *       - in: path
 *         name: facilityServiceId
 *         required: true
 *         schema:
 *           type: string
 *           example: "FSRV_001"
 *         description: ID của dịch vụ cơ sở cần gỡ
 *     responses:
 *       200:
 *         description: Gỡ thành công
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
 *                   example: "Đã gỡ dịch vụ khỏi bác sĩ thành công."
 *       404:
 *         description: Không tìm thấy liên kết (DSRV_003)
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
router.delete('/:doctorId/services/:facilityServiceId', authorizePermissions('DOCTOR_SERVICE_ASSIGN'), DoctorServiceController.removeService);

export default router;
