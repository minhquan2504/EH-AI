import { Router } from 'express';
import { SpecialtyServiceController } from '../../controllers/Facility Management/specialty-service.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const router = Router();

router.use(verifyAccessToken);
router.use(checkSessionStatus);

/**
 * @swagger
 * tags:
 *   name: 2.9.1 Gán dịch vụ - Chuyên khoa
 *   description: |
 *     Quản lý liên kết giữa Dịch vụ y tế chuẩn và Chuyên khoa.
 *     Một chuyên khoa có thể thực hiện nhiều dịch vụ, một dịch vụ có thể thuộc nhiều chuyên khoa.
 */

/**
 * @swagger
 * /api/specialty-services/{specialtyId}/services:
 *   get:
 *     summary: Lấy danh sách dịch vụ đã gán cho chuyên khoa
 *     description: |
 *       Trả về danh sách tất cả dịch vụ y tế chuẩn (Master Service) đã được gán cho chuyên khoa chỉ định.
 *
 *       **Phân quyền:** Yêu cầu quyền `SPECIALTY_SERVICE_VIEW`
 *
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF
 *     tags: [2.9.1 Gán dịch vụ - Chuyên khoa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: specialtyId
 *         required: true
 *         schema:
 *           type: string
 *           example: "SPEC_CARDIOLOGY"
 *         description: ID của chuyên khoa
 *     responses:
 *       200:
 *         description: Danh sách dịch vụ thuộc chuyên khoa
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
 *                       specialty_id:
 *                         type: string
 *                       service_id:
 *                         type: string
 *                       service_code:
 *                         type: string
 *                       service_name:
 *                         type: string
 *                       service_group:
 *                         type: string
 *                       service_type:
 *                         type: string
 *       404:
 *         description: Chuyên khoa không tồn tại (SSRV_001)
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
router.get('/:specialtyId/services', authorizePermissions('SPECIALTY_SERVICE_VIEW'), SpecialtyServiceController.getServicesBySpecialty);

/**
 * @swagger
 * /api/specialty-services/by-service/{serviceId}:
 *   get:
 *     summary: Lấy danh sách chuyên khoa đã gán cho 1 dịch vụ
 *     description: |
 *       Tra cứu ngược: Xem dịch vụ này thuộc những chuyên khoa nào.
 *
 *       **Phân quyền:** Yêu cầu quyền `SPECIALTY_SERVICE_VIEW`
 *
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF
 *     tags: [2.9.1 Gán dịch vụ - Chuyên khoa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *           example: "SRV_260310_abc1234567"
 *         description: ID của dịch vụ chuẩn (services_id)
 *     responses:
 *       200:
 *         description: Danh sách chuyên khoa gán cho dịch vụ
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
 *                       specialty_id:
 *                         type: string
 *                       service_id:
 *                         type: string
 *                       specialty_code:
 *                         type: string
 *                       specialty_name:
 *                         type: string
 *       404:
 *         description: Dịch vụ không tồn tại (SRV_001)
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
router.get('/by-service/:serviceId', authorizePermissions('SPECIALTY_SERVICE_VIEW'), SpecialtyServiceController.getSpecialtiesByService);

/**
 * @swagger
 * /api/specialty-services/{specialtyId}/services:
 *   post:
 *     summary: Gán danh sách dịch vụ vào chuyên khoa
 *     description: |
 *       Gán (Replace) toàn bộ danh sách dịch vụ cho chuyên khoa.
 *       Chiến lược: Xoá hết mapping cũ → Gán mới theo danh sách `service_ids` gửi lên.
 *       Phù hợp với UI dạng checkbox (chọn tất cả rồi Submit).
 *
 *       **Phân quyền:** Yêu cầu quyền `SPECIALTY_SERVICE_ASSIGN`
 *
 *       **Vai trò được phép:** ADMIN, STAFF
 *     tags: [2.9.1 Gán dịch vụ - Chuyên khoa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: specialtyId
 *         required: true
 *         schema:
 *           type: string
 *           example: "SPEC_CARDIOLOGY"
 *         description: ID của chuyên khoa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - service_ids
 *             properties:
 *               service_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["SRV_260310_abc1234567", "SRV_260310_def7891011"]
 *                 description: Danh sách services_id cần gán
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
 *                   example: "Đã gán 3 dịch vụ cho chuyên khoa thành công."
 *                 assigned:
 *                   type: number
 *                   example: 3
 *                 skipped:
 *                   type: number
 *                   example: 0
 *       400:
 *         description: Danh sách rỗng (SSRV_004) hoặc service_id không hợp lệ (SRV_001)
 *       404:
 *         description: Chuyên khoa không tồn tại (SSRV_001)
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
router.post('/:specialtyId/services', authorizePermissions('SPECIALTY_SERVICE_ASSIGN'), SpecialtyServiceController.assignServices);

/**
 * @swagger
 * /api/specialty-services/{specialtyId}/services/{serviceId}:
 *   delete:
 *     summary: Gỡ 1 dịch vụ khỏi chuyên khoa
 *     description: |
 *       Xoá liên kết giữa 1 dịch vụ chuẩn và chuyên khoa.
 *
 *       **Phân quyền:** Yêu cầu quyền `SPECIALTY_SERVICE_ASSIGN`
 *
 *       **Vai trò được phép:** ADMIN, STAFF
 *     tags: [2.9.1 Gán dịch vụ - Chuyên khoa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: specialtyId
 *         required: true
 *         schema:
 *           type: string
 *           example: "SPEC_CARDIOLOGY"
 *         description: ID của chuyên khoa
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *           example: "SRV_260310_abc1234567"
 *         description: ID của dịch vụ chuẩn cần gỡ
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
 *                   example: "Đã gỡ dịch vụ khỏi chuyên khoa thành công."
 *       404:
 *         description: Không tìm thấy liên kết (SSRV_003)
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
router.delete('/:specialtyId/services/:serviceId', authorizePermissions('SPECIALTY_SERVICE_ASSIGN'), SpecialtyServiceController.removeService);

export default router;
