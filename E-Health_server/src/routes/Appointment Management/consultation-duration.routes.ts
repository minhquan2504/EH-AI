import { Router } from 'express';
import { ConsultationDurationController } from '../../controllers/Appointment Management/consultation-duration.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

export const consultationDurationRoutes = Router();

// 3.2.4. QUẢN LÝ THỜI LƯỢNG MỖI LƯỢT KHÁM (Consultation Duration)

/**
 * @swagger
 * /api/facilities/{facilityId}/service-durations:
 *   get:
 *     summary: Lấy danh sách thời lượng khám tại cơ sở
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền FACILITY_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về danh sách tất cả dịch vụ tại cơ sở kèm thời lượng ước tính (`estimated_duration_minutes`).
 *       - Hỗ trợ filter theo `is_active` và `search` (tên/mã dịch vụ).
 *       - Dùng cho UI cấu hình thời lượng khám từng dịch vụ.
 *     tags: [3.2 Quản lý khung giờ & ca khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID cơ sở y tế
 *         example: "FAC_001"
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái dịch vụ
 *         example: true
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo mã hoặc tên dịch vụ
 *         example: "Khám nội"
 *     responses:
 *       200:
 *         description: Lấy danh sách thời lượng khám thành công
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
 *                   example: "Lấy danh sách thời lượng khám thành công."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       facility_services_id:
 *                         type: string
 *                         example: "FSRV_KHAMNOI"
 *                       service_code:
 *                         type: string
 *                         example: "SRV_001"
 *                       service_name:
 *                         type: string
 *                         example: "Khám Nội Tổng Quát"
 *                       estimated_duration_minutes:
 *                         type: integer
 *                         example: 15
 *                       is_active:
 *                         type: boolean
 *                         example: true
 *       404:
 *         description: Cơ sở y tế không tồn tại
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 */
consultationDurationRoutes.get(
    '/:facilityId/service-durations',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('FACILITY_VIEW')],
    ConsultationDurationController.getServiceDurations
);

/**
 * @swagger
 * /api/facilities/{facilityId}/service-durations:
 *   patch:
 *     summary: Batch cập nhật thời lượng khám nhiều dịch vụ
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền FACILITY_EDIT.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Cập nhật hàng loạt `estimated_duration_minutes` cho nhiều dịch vụ cùng lúc.
 *       - Validate: mỗi dịch vụ phải thuộc cơ sở, thời lượng từ 5-240 phút.
 *       - Toàn bộ cập nhật trong 1 Transaction (all-or-nothing).
 *     tags: [3.2 Quản lý khung giờ & ca khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema:
 *           type: string
 *         example: "FAC_001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - updates
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - facility_service_id
 *                     - estimated_duration_minutes
 *                   properties:
 *                     facility_service_id:
 *                       type: string
 *                       description: ID dịch vụ tại cơ sở
 *                       example: "FSRV_KHAMNOI"
 *                     estimated_duration_minutes:
 *                       type: integer
 *                       description: Thời lượng khám (5-240 phút)
 *                       example: 20
 *     responses:
 *       200:
 *         description: Cập nhật hàng loạt thành công
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
 *                   example: "Cập nhật hàng loạt thời lượng khám thành công."
 *                 data:
 *                   type: object
 *                   properties:
 *                     updated_count:
 *                       type: integer
 *                       example: 3
 *                     total_requested:
 *                       type: integer
 *                       example: 3
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Cơ sở hoặc dịch vụ không tồn tại
 */
consultationDurationRoutes.patch(
    '/:facilityId/service-durations',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('FACILITY_EDIT')],
    ConsultationDurationController.batchUpdateDurations
);

/**
 * @swagger
 * /api/facilities/{facilityId}/service-durations/{serviceId}:
 *   patch:
 *     summary: Cập nhật thời lượng khám cho 1 dịch vụ
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền FACILITY_EDIT.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Cập nhật `estimated_duration_minutes` cho 1 dịch vụ cụ thể tại cơ sở.
 *       - Validate: thời lượng từ 5 đến 240 phút, dịch vụ thuộc đúng cơ sở.
 *     tags: [3.2 Quản lý khung giờ & ca khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema:
 *           type: string
 *         example: "FAC_001"
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID dịch vụ tại cơ sở (facility_services_id)
 *         example: "FSRV_KHAMNOI"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estimated_duration_minutes
 *             properties:
 *               estimated_duration_minutes:
 *                 type: integer
 *                 description: Thời lượng khám mới (5-240 phút)
 *                 example: 25
 *     responses:
 *       200:
 *         description: Cập nhật thời lượng thành công
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
 *                     facility_services_id:
 *                       type: string
 *                     service_code:
 *                       type: string
 *                     service_name:
 *                       type: string
 *                     estimated_duration_minutes:
 *                       type: integer
 *                       example: 25
 *                     is_active:
 *                       type: boolean
 *       400:
 *         description: Thời lượng không hợp lệ
 *       404:
 *         description: Dịch vụ không thuộc cơ sở hoặc không tồn tại
 */
consultationDurationRoutes.patch(
    '/:facilityId/service-durations/:serviceId',
    [verifyAccessToken, checkSessionStatus, authorizePermissions('FACILITY_EDIT')],
    ConsultationDurationController.updateSingleDuration
);
