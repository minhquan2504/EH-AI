import { Router } from 'express';
import { MedicalOrderController } from '../../controllers/EMR/medical-order.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const router = Router();

// ============================================================
// API 11: Tìm kiếm dịch vụ CLS (đặt trước routes có :param)
// ============================================================

/**
 * @swagger
 * /api/medical-orders/search-services:
 *   get:
 *     tags: [4.4 Medical Orders]
 *     summary: Tìm kiếm dịch vụ CLS trong danh mục
 *     description: |
 *       Tìm kiếm dịch vụ (xét nghiệm, CĐHA, thủ thuật) để BS chỉ định cho BN.
 *       Phân quyền: Yêu cầu quyền EMR_ORDER_CREATE.
 *       Vai trò được phép: ADMIN, DOCTOR.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         example: "công thức máu"
 *         description: Từ khóa tìm kiếm (code hoặc tên)
 *       - in: query
 *         name: service_type
 *         schema:
 *           type: string
 *           enum: [LABORATORY, RADIOLOGY, PROCEDURE, CLINICAL]
 *         example: "LABORATORY"
 *         description: Loại dịch vụ
 *     responses:
 *       200:
 *         description: Danh sách dịch vụ tìm thấy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       services_id: { type: string, example: "SVC_XN_CTM" }
 *                       code: { type: string, example: "XN_CTM" }
 *                       name: { type: string, example: "Xét nghiệm công thức máu" }
 *                       service_group: { type: string, example: "XN" }
 *                       service_type: { type: string, example: "LABORATORY" }
 */
router.get(
    '/search-services',
    verifyAccessToken,
    authorizePermissions('EMR_ORDER_CREATE'),
    MedicalOrderController.searchServices
);


// ============================================================
// API 10: Dashboard chỉ định chờ thực hiện
// ============================================================

/**
 * @swagger
 * /api/medical-orders/pending:
 *   get:
 *     tags: [4.4 Medical Orders]
 *     summary: Dashboard — Danh sách chỉ định chờ thực hiện
 *     description: |
 *       KTV/BS xem danh sách chỉ định đang chờ.
 *       Ưu tiên URGENT hiển thị trước.
 *       Phân quyền: Yêu cầu quyền EMR_ORDER_VIEW.
 *       Vai trò được phép: ADMIN, DOCTOR, NURSE.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS]
 *         example: "PENDING"
 *       - in: query
 *         name: order_type
 *         schema:
 *           type: string
 *           enum: [LABORATORY, RADIOLOGY, PROCEDURE, ADMISSION, OTHER]
 *         example: "LABORATORY"
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [ROUTINE, URGENT]
 *         example: "URGENT"
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *         example: 20
 *     responses:
 *       200:
 *         description: Danh sách chỉ định chờ
 */
router.get(
    '/pending',
    verifyAccessToken,
    authorizePermissions('EMR_ORDER_VIEW'),
    MedicalOrderController.getPending
);


// ============================================================
// API 9: Lịch sử chỉ định theo bệnh nhân
// ============================================================

/**
 * @swagger
 * /api/medical-orders/by-patient/{patientId}:
 *   get:
 *     tags: [4.4 Medical Orders]
 *     summary: Lịch sử chỉ định CLS theo bệnh nhân
 *     description: |
 *       Lấy toàn bộ lịch sử chỉ định CLS của 1 bệnh nhân, hỗ trợ filter.
 *       Phân quyền: Yêu cầu quyền EMR_ORDER_HISTORY.
 *       Vai trò được phép: ADMIN, DOCTOR.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string }
 *         example: "PAT_001"
 *       - in: query
 *         name: order_type
 *         schema:
 *           type: string
 *           enum: [LABORATORY, RADIOLOGY, PROCEDURE, ADMISSION, OTHER]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED, CANCELLED]
 *       - in: query
 *         name: from_date
 *         schema: { type: string, format: date }
 *         example: "2026-01-01"
 *       - in: query
 *         name: to_date
 *         schema: { type: string, format: date }
 *         example: "2026-12-31"
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *         example: 20
 *     responses:
 *       200:
 *         description: Danh sách chỉ định kèm phân trang
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
router.get(
    '/by-patient/:patientId',
    verifyAccessToken,
    authorizePermissions('EMR_ORDER_HISTORY'),
    MedicalOrderController.getByPatient
);


// ============================================================
// API 3: Chi tiết 1 chỉ định + kết quả
// ============================================================

/**
 * @swagger
 * /api/medical-orders/detail/{orderId}:
 *   get:
 *     tags: [4.4 Medical Orders]
 *     summary: Chi tiết 1 chỉ định + kết quả CLS
 *     description: |
 *       Lấy thông tin chi tiết chỉ định kèm kết quả (nếu đã có).
 *       Phân quyền: Yêu cầu quyền EMR_ORDER_VIEW.
 *       Vai trò được phép: ADMIN, DOCTOR, NURSE.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *         example: "ORD_260316_abc12345"
 *     responses:
 *       200:
 *         description: Chi tiết chỉ định + kết quả
 *       404:
 *         description: Không tìm thấy chỉ định
 */
router.get(
    '/detail/:orderId',
    verifyAccessToken,
    authorizePermissions('EMR_ORDER_VIEW'),
    MedicalOrderController.getDetail
);


// ============================================================
// API 1: Tạo chỉ định CLS
// ============================================================

/**
 * @swagger
 * /api/medical-orders/{encounterId}:
 *   post:
 *     tags: [4.4 Medical Orders]
 *     summary: Tạo chỉ định dịch vụ CLS
 *     description: |
 *       BS chỉ định xét nghiệm, CĐHA, thủ thuật cho bệnh nhân.
 *       Encounter phải ở trạng thái IN_PROGRESS hoặc WAITING_FOR_RESULTS.
 *       Tự động chuyển encounter sang WAITING_FOR_RESULTS nếu đang IN_PROGRESS.
 *       Phân quyền: Yêu cầu quyền EMR_ORDER_CREATE.
 *       Vai trò được phép: ADMIN, DOCTOR.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema: { type: string }
 *         example: "ENC_260316_a60a783f"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [service_code, order_type]
 *             properties:
 *               service_code:
 *                 type: string
 *                 example: "XN_CTM"
 *                 description: Mã dịch vụ từ bảng services
 *               order_type:
 *                 type: string
 *                 enum: [LABORATORY, RADIOLOGY, PROCEDURE, ADMISSION, OTHER]
 *                 example: "LABORATORY"
 *               clinical_indicator:
 *                 type: string
 *                 example: "Nghi thiếu máu, kiểm tra công thức máu"
 *               priority:
 *                 type: string
 *                 enum: [ROUTINE, URGENT]
 *                 example: "ROUTINE"
 *               notes:
 *                 type: string
 *                 example: "Lấy máu buổi sáng, bệnh nhân nhịn ăn"
 *     responses:
 *       201:
 *         description: Tạo chỉ định thành công
 *       400:
 *         description: Dữ liệu không hợp lệ / Encounter không editable
 *       404:
 *         description: Encounter hoặc dịch vụ không tìm thấy
 */
router.post(
    '/:encounterId',
    verifyAccessToken,
    authorizePermissions('EMR_ORDER_CREATE'),
    MedicalOrderController.create
);


// ============================================================
// API 2: Danh sách chỉ định theo encounter
// ============================================================

/**
 * @swagger
 * /api/medical-orders/{encounterId}:
 *   get:
 *     tags: [4.4 Medical Orders]
 *     summary: Danh sách chỉ định CLS theo encounter
 *     description: |
 *       Lấy tất cả chỉ định CLS trong 1 lượt khám.
 *       Phân quyền: Yêu cầu quyền EMR_ORDER_VIEW.
 *       Vai trò được phép: ADMIN, DOCTOR, NURSE, STAFF.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema: { type: string }
 *         example: "ENC_260316_a60a783f"
 *     responses:
 *       200:
 *         description: Danh sách chỉ định
 *       404:
 *         description: Encounter không tìm thấy
 */
router.get(
    '/:encounterId',
    verifyAccessToken,
    authorizePermissions('EMR_ORDER_VIEW'),
    MedicalOrderController.getByEncounterId
);


// ============================================================
// API 12: Tóm tắt chỉ định + kết quả
// ============================================================

/**
 * @swagger
 * /api/medical-orders/{encounterId}/summary:
 *   get:
 *     tags: [4.4 Medical Orders]
 *     summary: Tóm tắt chỉ định + kết quả cho BS review
 *     description: |
 *       BS xem nhanh toàn bộ chỉ định và kết quả trong 1 encounter.
 *       Phân quyền: Yêu cầu quyền EMR_ORDER_VIEW.
 *       Vai trò được phép: ADMIN, DOCTOR.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema: { type: string }
 *         example: "ENC_260316_a60a783f"
 *     responses:
 *       200:
 *         description: Tóm tắt chỉ định + kết quả
 *       404:
 *         description: Encounter không tìm thấy
 */
router.get(
    '/:encounterId/summary',
    verifyAccessToken,
    authorizePermissions('EMR_ORDER_VIEW'),
    MedicalOrderController.getSummary
);


// ============================================================
// API 4: Cập nhật chỉ định
// ============================================================

/**
 * @swagger
 * /api/medical-orders/{orderId}:
 *   patch:
 *     tags: [4.4 Medical Orders]
 *     summary: Cập nhật chỉ định CLS (notes, priority)
 *     description: |
 *       Chỉ cập nhật được khi chỉ định ở trạng thái PENDING.
 *       Phân quyền: Yêu cầu quyền EMR_ORDER_UPDATE.
 *       Vai trò được phép: ADMIN, DOCTOR.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *         example: "ORD_260316_abc12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clinical_indicator:
 *                 type: string
 *                 example: "Bổ sung: kiểm tra chức năng thận"
 *               priority:
 *                 type: string
 *                 enum: [ROUTINE, URGENT]
 *                 example: "URGENT"
 *               notes:
 *                 type: string
 *                 example: "Cần kết quả gấp trong 2 giờ"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Chỉ định không ở trạng thái PENDING
 *       404:
 *         description: Không tìm thấy chỉ định
 */
router.patch(
    '/:orderId',
    verifyAccessToken,
    authorizePermissions('EMR_ORDER_UPDATE'),
    MedicalOrderController.update
);


// ============================================================
// API 5: Hủy chỉ định
// ============================================================

/**
 * @swagger
 * /api/medical-orders/{orderId}/cancel:
 *   patch:
 *     tags: [4.4 Medical Orders]
 *     summary: Hủy chỉ định CLS
 *     description: |
 *       Chỉ hủy được khi chỉ định ở trạng thái PENDING.
 *       Bắt buộc ghi lý do hủy.
 *       Phân quyền: Yêu cầu quyền EMR_ORDER_CANCEL.
 *       Vai trò được phép: ADMIN, DOCTOR.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *         example: "ORD_260316_abc12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cancelled_reason]
 *             properties:
 *               cancelled_reason:
 *                 type: string
 *                 example: "Bệnh nhân từ chối xét nghiệm"
 *     responses:
 *       200:
 *         description: Hủy chỉ định thành công
 *       400:
 *         description: Chỉ định không ở trạng thái PENDING / Thiếu lý do hủy
 */
router.patch(
    '/:orderId/cancel',
    verifyAccessToken,
    authorizePermissions('EMR_ORDER_CANCEL'),
    MedicalOrderController.cancel
);


// ============================================================
// API 6: Bắt đầu thực hiện chỉ định
// ============================================================

/**
 * @swagger
 * /api/medical-orders/{orderId}/start:
 *   patch:
 *     tags: [4.4 Medical Orders]
 *     summary: Bắt đầu thực hiện chỉ định CLS
 *     description: |
 *       KTV nhận chỉ định và bắt đầu thực hiện (PENDING → IN_PROGRESS).
 *       Phân quyền: Yêu cầu quyền EMR_ORDER_START.
 *       Vai trò được phép: ADMIN, DOCTOR, NURSE.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *         example: "ORD_260316_abc12345"
 *     responses:
 *       200:
 *         description: Bắt đầu thực hiện thành công
 *       400:
 *         description: Chỉ định không ở trạng thái PENDING
 */
router.patch(
    '/:orderId/start',
    verifyAccessToken,
    authorizePermissions('EMR_ORDER_START'),
    MedicalOrderController.start
);


// ============================================================
// API 7: Ghi kết quả CLS
// ============================================================

/**
 * @swagger
 * /api/medical-orders/{orderId}/result:
 *   post:
 *     tags: [4.4 Medical Orders]
 *     summary: Ghi kết quả CLS (tự động chuyển COMPLETED)
 *     description: |
 *       KTV ghi kết quả xét nghiệm/CĐHA. Chỉ ghi được khi chỉ định IN_PROGRESS.
 *       Tự động chuyển chỉ định sang COMPLETED.
 *       Phân quyền: Yêu cầu quyền EMR_ORDER_RESULT.
 *       Vai trò được phép: ADMIN, DOCTOR, NURSE.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *         example: "ORD_260316_abc12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [result_summary]
 *             properties:
 *               result_summary:
 *                 type: string
 *                 example: "Công thức máu bình thường. Hb: 14.2 g/dL, WBC: 7.5 K/uL"
 *               result_details:
 *                 type: object
 *                 example:
 *                   hemoglobin: { value: 14.2, unit: "g/dL", range: "12-16" }
 *                   wbc: { value: 7.5, unit: "K/uL", range: "4-11" }
 *               attachment_urls:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["https://storage.example.com/results/xn_001.pdf"]
 *     responses:
 *       201:
 *         description: Ghi kết quả thành công
 *       400:
 *         description: Chỉ định không ở trạng thái IN_PROGRESS
 *       409:
 *         description: Chỉ định đã có kết quả
 */
router.post(
    '/:orderId/result',
    verifyAccessToken,
    authorizePermissions('EMR_ORDER_RESULT'),
    MedicalOrderController.createResult
);


// ============================================================
// API 8: Cập nhật kết quả CLS
// ============================================================

/**
 * @swagger
 * /api/medical-orders/{orderId}/result:
 *   patch:
 *     tags: [4.4 Medical Orders]
 *     summary: Cập nhật kết quả CLS đã ghi
 *     description: |
 *       Sửa kết quả đã ghi (bổ sung, chỉnh sửa).
 *       Phân quyền: Yêu cầu quyền EMR_ORDER_RESULT.
 *       Vai trò được phép: ADMIN, DOCTOR, NURSE.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *         example: "ORD_260316_abc12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               result_summary:
 *                 type: string
 *                 example: "Cập nhật: Hb giảm nhẹ 11.8 g/dL"
 *               result_details:
 *                 type: object
 *               attachment_urls:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200:
 *         description: Cập nhật kết quả thành công
 *       404:
 *         description: Chưa có kết quả để cập nhật
 */
router.patch(
    '/:orderId/result',
    verifyAccessToken,
    authorizePermissions('EMR_ORDER_RESULT'),
    MedicalOrderController.updateResult
);


export default router;
