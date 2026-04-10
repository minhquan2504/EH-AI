import { Router } from 'express';
import { ClinicalResultsController } from '../../controllers/EHR/clinical-results.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';

export const clinicalResultsRoutes = Router();

/**
 * @swagger
 * /api/ehr/patients/{patientId}/clinical-results:
 *   get:
 *     summary: Danh sách kết quả CLS tổng hợp
 *     description: |
 *       Lấy tất cả kết quả xét nghiệm & cận lâm sàng xuyên suốt toàn bộ lịch sử khám.
 *       Hỗ trợ phân trang, filter theo loại chỉ định, mã dịch vụ, trạng thái, khoảng thời gian.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF.
 *     tags: ["6.4 Clinical Results"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: query
 *         name: order_type
 *         schema: { type: string, enum: [LAB, IMAGING, PROCEDURE, OTHER], example: "" }
 *         description: "Lọc theo loại chỉ định"
 *       - in: query
 *         name: service_code
 *         schema: { type: string, example: "" }
 *         description: "Lọc theo mã dịch vụ cụ thể"
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, IN_PROGRESS, COMPLETED, CANCELLED], example: "" }
 *       - in: query
 *         name: from_date
 *         schema: { type: string, format: date, example: "" }
 *       - in: query
 *         name: to_date
 *         schema: { type: string, format: date, example: "" }
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 20 }
 *     responses:
 *       200: { description: Lấy danh sách thành công }
 *       404: { description: Bệnh nhân không tồn tại }
 */
clinicalResultsRoutes.get(
    '/patients/:patientId/clinical-results',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF'),
    ClinicalResultsController.getResults
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/clinical-results/trends:
 *   get:
 *     summary: Xu hướng kết quả theo service_code
 *     description: |
 *       So sánh kết quả cùng 1 loại xét nghiệm qua thời gian để theo dõi xu hướng.
 *       Trả về mảng data points theo thứ tự thời gian — frontend dùng để vẽ chart.
 *       Tối đa 50 điểm gần nhất.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *     tags: ["6.4 Clinical Results"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: query
 *         name: service_code
 *         required: true
 *         schema: { type: string, example: "XN_DUONG_HUYET" }
 *         description: "Mã dịch vụ cần xem xu hướng"
 *     responses:
 *       200: { description: Lấy xu hướng thành công }
 *       400: { description: Thiếu service_code }
 *       404: { description: Bệnh nhân không tồn tại }
 */
clinicalResultsRoutes.get(
    '/patients/:patientId/clinical-results/trends',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'),
    ClinicalResultsController.getTrends
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/clinical-results/summary:
 *   get:
 *     summary: Thống kê tổng quan kết quả CLS
 *     description: |
 *       Thống kê: tổng chỉ định, có kết quả, pending, phân bổ theo loại, ngày gần nhất.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF.
 *     tags: ["6.4 Clinical Results"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *     responses:
 *       200: { description: Lấy thống kê thành công }
 *       404: { description: Bệnh nhân không tồn tại }
 */
clinicalResultsRoutes.get(
    '/patients/:patientId/clinical-results/summary',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF'),
    ClinicalResultsController.getSummary
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/clinical-results/attachments:
 *   get:
 *     summary: Danh sách file đính kèm kết quả CLS
 *     description: |
 *       Gom tất cả file đính kèm (ảnh X-quang, PDF kết quả...) từ medical_order_results
 *       xuyên suốt toàn bộ lịch sử khám.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *     tags: ["6.4 Clinical Results"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *     responses:
 *       200: { description: Lấy danh sách file thành công }
 *       404: { description: Bệnh nhân không tồn tại }
 */
clinicalResultsRoutes.get(
    '/patients/:patientId/clinical-results/attachments',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'),
    ClinicalResultsController.getAttachments
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/clinical-results/abnormal:
 *   get:
 *     summary: Kết quả bất thường
 *     description: |
 *       Lọc các kết quả CLS có dấu hiệu bất thường (flag is_abnormal, status abnormal
 *       trong result_details JSON). Quan trọng cho bác sĩ review nhanh.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *     tags: ["6.4 Clinical Results"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *     responses:
 *       200: { description: Lấy kết quả bất thường thành công }
 *       404: { description: Bệnh nhân không tồn tại }
 */
clinicalResultsRoutes.get(
    '/patients/:patientId/clinical-results/abnormal',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'),
    ClinicalResultsController.getAbnormalResults
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/clinical-results/by-encounter/{encounterId}:
 *   get:
 *     summary: Kết quả CLS theo encounter
 *     description: |
 *       Xem tất cả chỉ định CLS + kết quả trong 1 lượt khám cụ thể.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF.
 *     tags: ["6.4 Clinical Results"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema: { type: string, example: "ENC_260318_abc12345" }
 *     responses:
 *       200: { description: Lấy kết quả theo encounter thành công }
 *       403: { description: Encounter không thuộc bệnh nhân }
 *       404: { description: Không tìm thấy }
 */
clinicalResultsRoutes.get(
    '/patients/:patientId/clinical-results/by-encounter/:encounterId',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF'),
    ClinicalResultsController.getResultsByEncounter
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/clinical-results/{orderId}:
 *   get:
 *     summary: Chi tiết kết quả CLS
 *     description: |
 *       Xem chi tiết 1 kết quả bao gồm: chỉ định gốc, BS chỉ định, người thực hiện,
 *       result_summary, result_details (JSON chứa chỉ số), file đính kèm, encounter info.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *     tags: ["6.4 Clinical Results"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string, example: "ORD_260318_abc12345" }
 *     responses:
 *       200: { description: Lấy chi tiết thành công }
 *       403: { description: Chỉ định không thuộc bệnh nhân }
 *       404: { description: Không tìm thấy }
 */
clinicalResultsRoutes.get(
    '/patients/:patientId/clinical-results/:orderId',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'),
    ClinicalResultsController.getResultDetail
);
