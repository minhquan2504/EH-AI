import { Router } from 'express';
import { MedicationTreatmentController } from '../../controllers/EHR/medication-treatment.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';

export const medicationTreatmentRoutes = Router();

/**
 * @swagger
 * /api/ehr/patients/{patientId}/medication-records:
 *   get:
 *     summary: Lịch sử đơn thuốc tổng hợp
 *     description: |
 *       Lấy tất cả đơn thuốc xuyên suốt lịch sử khám của bệnh nhân.
 *       Hỗ trợ phân trang, filter theo trạng thái đơn, khoảng thời gian.
 *       Kèm thông tin: BS kê đơn, encounter, số thuốc, trạng thái phát thuốc.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF, PHARMACIST.
 *     tags: ["6.5 Medication & Treatment"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFT, PRESCRIBED, DISPENSED, CANCELLED], example: "" }
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
medicationTreatmentRoutes.get(
    '/patients/:patientId/medication-records',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF', 'PHARMACIST'),
    MedicationTreatmentController.getMedicationRecords
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/medication-records/current:
 *   get:
 *     summary: Thuốc đang sử dụng
 *     description: |
 *       Trả về danh sách thuốc bệnh nhân đang sử dụng: đơn có status DISPENSED
 *       và còn trong liệu trình (prescribed_at + duration_days > hiện tại).
 *       Quan trọng để BS biết BN đang uống gì khi khám mới.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST.
 *     tags: ["6.5 Medication & Treatment"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *     responses:
 *       200: { description: Lấy thuốc đang dùng thành công }
 *       404: { description: Bệnh nhân không tồn tại }
 */
medicationTreatmentRoutes.get(
    '/patients/:patientId/medication-records/current',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST'),
    MedicationTreatmentController.getCurrentMedications
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/medication-records/interaction-check:
 *   get:
 *     summary: Cảnh báo tương tác thuốc
 *     description: |
 *       So sánh thuốc đang sử dụng vs dị ứng thuốc đã ghi nhận (patient_allergies, allergen_type=DRUG).
 *       Text matching tên thuốc/hoạt chất vs tên dị ứng. Mức cảnh báo cơ bản.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST.
 *     tags: ["6.5 Medication & Treatment"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *     responses:
 *       200: { description: Kiểm tra tương tác thành công }
 *       404: { description: Bệnh nhân không tồn tại }
 */
medicationTreatmentRoutes.get(
    '/patients/:patientId/medication-records/interaction-check',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST'),
    MedicationTreatmentController.checkInteractions
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/medication-records/timeline:
 *   get:
 *     summary: Timeline thuốc & điều trị
 *     description: |
 *       Tổng hợp dòng thời gian: đơn thuốc + phát thuốc + kế hoạch điều trị
 *       sắp xếp theo thời gian mới nhất.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF.
 *     tags: ["6.5 Medication & Treatment"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *     responses:
 *       200: { description: Lấy timeline thành công }
 *       404: { description: Bệnh nhân không tồn tại }
 */
medicationTreatmentRoutes.get(
    '/patients/:patientId/medication-records/timeline',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF'),
    MedicationTreatmentController.getTimeline
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/medication-records/{prescriptionId}:
 *   get:
 *     summary: Chi tiết đơn thuốc
 *     description: |
 *       Xem chi tiết 1 đơn thuốc: header + danh sách thuốc (tên, hoạt chất, liều, tần suất,
 *       số lượng, hướng dẫn sử dụng) + trạng thái phát thuốc + DS phát.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST.
 *     tags: ["6.5 Medication & Treatment"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: path
 *         name: prescriptionId
 *         required: true
 *         schema: { type: string, example: "RX_260316_abc12345" }
 *     responses:
 *       200: { description: Lấy chi tiết thành công }
 *       403: { description: Đơn thuốc không thuộc bệnh nhân }
 *       404: { description: Không tìm thấy }
 */
medicationTreatmentRoutes.get(
    '/patients/:patientId/medication-records/:prescriptionId',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST'),
    MedicationTreatmentController.getMedicationDetail
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/treatment-records:
 *   get:
 *     summary: Lịch sử kế hoạch điều trị
 *     description: |
 *       Lấy tất cả kế hoạch điều trị của bệnh nhân (phân trang, filter status).
 *       Kèm: bác sĩ tạo, chẩn đoán chính, số ghi nhận diễn tiến.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF.
 *     tags: ["6.5 Medication & Treatment"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, COMPLETED, SUSPENDED, CANCELLED], example: "" }
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
medicationTreatmentRoutes.get(
    '/patients/:patientId/treatment-records',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF'),
    MedicationTreatmentController.getTreatmentRecords
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/treatment-records/{planId}:
 *   get:
 *     summary: Chi tiết kế hoạch điều trị
 *     description: |
 *       Xem chi tiết kế hoạch: thông tin plan + danh sách ghi nhận diễn tiến + chuỗi tái khám.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *     tags: ["6.5 Medication & Treatment"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: path
 *         name: planId
 *         required: true
 *         schema: { type: string, example: "TP_260316_abc12345" }
 *     responses:
 *       200: { description: Lấy chi tiết thành công }
 *       403: { description: Kế hoạch không thuộc bệnh nhân }
 *       404: { description: Không tìm thấy }
 */
medicationTreatmentRoutes.get(
    '/patients/:patientId/treatment-records/:planId',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'),
    MedicationTreatmentController.getTreatmentDetail
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/medication-adherence:
 *   post:
 *     summary: Ghi nhận tuân thủ dùng thuốc
 *     description: |
 *       Ghi nhận bệnh nhân đã uống thuốc hay bỏ thuốc vào 1 ngày cụ thể.
 *       Liên kết với prescription_detail_id (1 loại thuốc cụ thể).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *     tags: ["6.5 Medication & Treatment"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [prescription_detail_id, adherence_date, taken]
 *             properties:
 *               prescription_detail_id:
 *                 type: string
 *                 example: "PD_260316_abc12345"
 *               adherence_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-18"
 *               taken:
 *                 type: boolean
 *                 example: true
 *               skip_reason:
 *                 type: string
 *                 example: ""
 *     responses:
 *       201: { description: Ghi nhận thành công }
 *       400: { description: Thiếu thông tin bắt buộc }
 *       404: { description: Bệnh nhân hoặc thuốc không tồn tại }
 */
medicationTreatmentRoutes.post(
    '/patients/:patientId/medication-adherence',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'),
    MedicationTreatmentController.createAdherence
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/medication-adherence:
 *   get:
 *     summary: Lịch sử tuân thủ dùng thuốc
 *     description: |
 *       Xem lịch sử tuân thủ + thống kê tỷ lệ % (total, taken, skipped, adherence_rate).
 *       Có thể lọc theo khoảng ngày.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *     tags: ["6.5 Medication & Treatment"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: query
 *         name: from_date
 *         schema: { type: string, format: date, example: "" }
 *       - in: query
 *         name: to_date
 *         schema: { type: string, format: date, example: "" }
 *     responses:
 *       200: { description: Lấy lịch sử thành công }
 *       404: { description: Bệnh nhân không tồn tại }
 */
medicationTreatmentRoutes.get(
    '/patients/:patientId/medication-adherence',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'),
    MedicationTreatmentController.getAdherenceRecords
);
