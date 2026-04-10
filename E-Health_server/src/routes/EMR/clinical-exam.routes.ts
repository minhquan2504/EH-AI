import { Router } from 'express';
import { ClinicalExamController } from '../../controllers/EMR/clinical-exam.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

export const clinicalExamRoutes = Router();

// ─── Static routes PHẢI đặt TRƯỚC dynamic routes ───

/**
 * @swagger
 * /api/clinical-examinations/by-patient/{patientId}:
 *   get:
 *     summary: Lịch sử khám lâm sàng theo bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_CLINICAL_EXAM_VIEW.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về danh sách phiếu khám lâm sàng qua nhiều encounter của 1 bệnh nhân.
 *       - Dùng để so sánh sinh hiệu, theo dõi tiến triển bệnh.
 *       - Hỗ trợ lọc theo khoảng thời gian + phân trang.
 *     tags: [4.2 Clinical Examination]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           example: "PAT_002"
 *         description: ID bệnh nhân
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           example: "2026-01-01"
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           example: "2026-12-31"
 *     responses:
 *       200:
 *         description: Lấy lịch sử khám lâm sàng thành công
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
 *                   example: "Lấy lịch sử khám lâm sàng thành công"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
clinicalExamRoutes.get(
    '/by-patient/:patientId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_CLINICAL_EXAM_VIEW'),
    ClinicalExamController.getByPatient
);


/**
 * @swagger
 * /api/clinical-examinations/{encounterId}/vitals:
 *   patch:
 *     summary: Cập nhật riêng sinh hiệu (Y tá dùng)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_CLINICAL_EXAM_EDIT.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - API chuyên để Y tá cập nhật sinh hiệu, KHÔNG đụng vào phần khám lâm sàng của BS.
 *       - Cho phép cập nhật cả khi phiếu khám đã FINAL (sinh hiệu có thể đo lại bất cứ lúc nào).
 *       - Encounter phải ở trạng thái IN_PROGRESS hoặc WAITING_FOR_RESULTS.
 *       - BMI được tự động tính lại nếu có weight hoặc height.
 *     tags: [4.2 Clinical Examination]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260316_b098c91c"
 *         description: ID lượt khám
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pulse:
 *                 type: integer
 *                 example: 78
 *                 description: "Mạch (bpm). Bình thường: 60-100"
 *               blood_pressure_systolic:
 *                 type: integer
 *                 example: 125
 *                 description: "Huyết áp tâm thu (mmHg). Bình thường: 90-140"
 *               blood_pressure_diastolic:
 *                 type: integer
 *                 example: 80
 *                 description: "Huyết áp tâm trương (mmHg). Bình thường: 60-90"
 *               temperature:
 *                 type: number
 *                 example: 36.8
 *                 description: "Nhiệt độ (°C). Bình thường: 36.0-37.5"
 *               respiratory_rate:
 *                 type: integer
 *                 example: 16
 *                 description: "Nhịp thở (lần/phút). Bình thường: 12-20"
 *               spo2:
 *                 type: integer
 *                 example: 98
 *                 description: "Độ bão hòa Oxy (%). Bình thường: 95-100"
 *               weight:
 *                 type: number
 *                 example: 65.5
 *                 description: "Cân nặng (kg)"
 *               height:
 *                 type: number
 *                 example: 168
 *                 description: "Chiều cao (cm)"
 *               blood_glucose:
 *                 type: number
 *                 example: 5.4
 *                 description: "Đường huyết (mmol/L). Bình thường: 3.9-7.0"
 *     responses:
 *       200:
 *         description: Cập nhật sinh hiệu thành công
 *       400:
 *         description: Encounter đã hoàn tất
 *       404:
 *         description: Không tìm thấy phiếu khám
 */
clinicalExamRoutes.patch(
    '/:encounterId/vitals',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_CLINICAL_EXAM_EDIT'),
    ClinicalExamController.updateVitals
);


/**
 * @swagger
 * /api/clinical-examinations/{encounterId}/finalize:
 *   patch:
 *     summary: Xác nhận hoàn tất phiếu khám lâm sàng (DRAFT → FINAL)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_CLINICAL_EXAM_EDIT.
 *       **Vai trò được phép:** ADMIN, DOCTOR.
 *
 *       **Mô tả chi tiết:**
 *       - Chuyển phiếu khám từ DRAFT → FINAL.
 *       - Chỉ BS mới được finalize.
 *       - Yêu cầu bắt buộc trước khi finalize:
 *         + Phải có triệu chứng chính (chief_complaint)
 *         + Phải có ít nhất 1 chỉ số sinh hiệu
 *       - Sau khi FINAL: không cho PATCH (trừ sinh hiệu qua API /vitals).
 *     tags: [4.2 Clinical Examination]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260316_b098c91c"
 *         description: ID lượt khám
 *     responses:
 *       200:
 *         description: Hoàn tất phiếu khám lâm sàng
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
 *                   example: "Hoàn tất phiếu khám lâm sàng"
 *       400:
 *         description: |
 *           - Phiếu khám không ở trạng thái DRAFT
 *           - Thiếu chief_complaint
 *           - Thiếu sinh hiệu
 *       404:
 *         description: Không tìm thấy phiếu khám
 */
clinicalExamRoutes.patch(
    '/:encounterId/finalize',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_CLINICAL_EXAM_EDIT'),
    ClinicalExamController.finalize
);


/**
 * @swagger
 * /api/clinical-examinations/{encounterId}/summary:
 *   get:
 *     summary: Tóm tắt khám lâm sàng
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_CLINICAL_EXAM_VIEW.
 *       **Vai trò được phép:** ADMIN, DOCTOR.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về tóm tắt ngắn gọn: triệu chứng, mức độ bệnh, sinh hiệu text, cờ bất thường.
 *       - Dùng cho module 4.3 (Diagnosis) hiển thị context khi bác sĩ chẩn đoán.
 *     tags: [4.2 Clinical Examination]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260316_b098c91c"
 *         description: ID lượt khám
 *     responses:
 *       200:
 *         description: Tóm tắt khám lâm sàng
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
 *                     chief_complaint:
 *                       type: string
 *                       example: "Đau đầu, chóng mặt 2 ngày nay"
 *                     severity_level:
 *                       type: string
 *                       example: "MODERATE"
 *                     vitals_summary:
 *                       type: string
 *                       example: "Mạch 82, HA 130/85, Nhiệt 37.2°C, SpO2 97%"
 *                     has_abnormal_vitals:
 *                       type: boolean
 *                       example: true
 *                     status:
 *                       type: string
 *                       example: "FINAL"
 *       404:
 *         description: Không tìm thấy phiếu khám
 */
clinicalExamRoutes.get(
    '/:encounterId/summary',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_CLINICAL_EXAM_VIEW'),
    ClinicalExamController.getSummary
);


// ─── Dynamic routes ───

/**
 * @swagger
 * /api/clinical-examinations/{encounterId}:
 *   post:
 *     summary: Tạo phiếu khám lâm sàng cho encounter
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_CLINICAL_EXAM_CREATE.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Tạo phiếu khám lâm sàng mới gắn với 1 encounter (quan hệ 1:1).
 *       - Y tá có thể tạo trước (chỉ nhập sinh hiệu), BS bổ sung phần khám sau.
 *       - Encounter phải ở trạng thái IN_PROGRESS hoặc WAITING_FOR_RESULTS.
 *       - Nếu đã có phiếu khám cho encounter → trả 409 Conflict.
 *       - BMI được tự động tính từ weight + height.
 *       - Phiếu khám mặc định ở trạng thái DRAFT.
 *     tags: [4.2 Clinical Examination]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260316_b098c91c"
 *         description: ID lượt khám
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chief_complaint:
 *                 type: string
 *                 example: "Đau đầu, chóng mặt 2 ngày nay"
 *                 description: "Triệu chứng chính / lý do khám"
 *               pulse:
 *                 type: integer
 *                 example: 82
 *                 description: "Mạch (bpm)"
 *               blood_pressure_systolic:
 *                 type: integer
 *                 example: 130
 *                 description: "Huyết áp tâm thu (mmHg)"
 *               blood_pressure_diastolic:
 *                 type: integer
 *                 example: 85
 *                 description: "Huyết áp tâm trương (mmHg)"
 *               temperature:
 *                 type: number
 *                 example: 37.2
 *                 description: "Nhiệt độ (°C)"
 *               respiratory_rate:
 *                 type: integer
 *                 example: 18
 *                 description: "Nhịp thở (lần/phút)"
 *               spo2:
 *                 type: integer
 *                 example: 97
 *                 description: "Độ bão hòa Oxy (%)"
 *               weight:
 *                 type: number
 *                 example: 65.5
 *                 description: "Cân nặng (kg)"
 *               height:
 *                 type: number
 *                 example: 168
 *                 description: "Chiều cao (cm)"
 *               blood_glucose:
 *                 type: number
 *                 example: 5.6
 *                 description: "Đường huyết (mmol/L)"
 *               physical_examination:
 *                 type: string
 *                 example: "Tim đều, phổi trong, bụng mềm"
 *                 description: "Kết quả khám thực thể"
 *               medical_history_notes:
 *                 type: string
 *                 example: "Tiền sử tăng huyết áp, đang uống thuốc"
 *                 description: "Tiền sử bệnh liên quan"
 *               relevant_history:
 *                 type: string
 *                 example: "Bệnh nhân quên uống thuốc HA 3 ngày"
 *                 description: "Tiền sử liên quan trực tiếp đến lượt khám này"
 *               clinical_notes:
 *                 type: string
 *                 example: "Cần theo dõi HA liên tục 24h"
 *                 description: "Ghi chú lâm sàng tự do của BS"
 *               severity_level:
 *                 type: string
 *                 enum: [MILD, MODERATE, SEVERE, CRITICAL]
 *                 example: "MODERATE"
 *                 description: "Phân loại mức độ bệnh"
 *     responses:
 *       201:
 *         description: Ghi nhận khám lâm sàng thành công
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
 *                   example: "Ghi nhận khám lâm sàng thành công"
 *                 data:
 *                   type: object
 *       400:
 *         description: |
 *           - Encounter đã hoàn tất/đóng
 *           - severity_level không hợp lệ
 *       404:
 *         description: Encounter không tồn tại
 *       409:
 *         description: Phiếu khám lâm sàng đã tồn tại cho encounter này
 */
clinicalExamRoutes.post(
    '/:encounterId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_CLINICAL_EXAM_CREATE'),
    ClinicalExamController.create
);


/**
 * @swagger
 * /api/clinical-examinations/{encounterId}:
 *   get:
 *     summary: Lấy chi tiết phiếu khám lâm sàng theo encounter
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_CLINICAL_EXAM_VIEW.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về toàn bộ thông tin phiếu khám: sinh hiệu, triệu chứng, khám thực thể, ghi chú, mức độ.
 *       - Kèm tên người ghi nhận (recorder_name).
 *     tags: [4.2 Clinical Examination]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260316_b098c91c"
 *         description: ID lượt khám
 *     responses:
 *       200:
 *         description: Lấy chi tiết khám lâm sàng thành công
 *       404:
 *         description: |
 *           - Encounter không tồn tại
 *           - Chưa có phiếu khám lâm sàng
 */
clinicalExamRoutes.get(
    '/:encounterId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_CLINICAL_EXAM_VIEW'),
    ClinicalExamController.getByEncounterId
);


/**
 * @swagger
 * /api/clinical-examinations/{encounterId}:
 *   patch:
 *     summary: Cập nhật phiếu khám lâm sàng
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_CLINICAL_EXAM_EDIT.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Cập nhật toàn bộ hoặc từng phần phiếu khám (partial update).
 *       - Chỉ cho cập nhật khi phiếu ở trạng thái DRAFT.
 *       - Phiếu FINAL không cho sửa (trừ sinh hiệu qua API /vitals).
 *       - BMI được tự động tính lại nếu cập nhật weight hoặc height.
 *       - Encounter phải ở trạng thái IN_PROGRESS hoặc WAITING_FOR_RESULTS.
 *     tags: [4.2 Clinical Examination]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260316_b098c91c"
 *         description: ID lượt khám
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chief_complaint:
 *                 type: string
 *                 example: "Đau đầu kèm buồn nôn"
 *               physical_examination:
 *                 type: string
 *                 example: "Tim đều, phổi trong, bụng mềm, không đau"
 *               medical_history_notes:
 *                 type: string
 *                 example: "Tiền sử tăng huyết áp 5 năm"
 *               relevant_history:
 *                 type: string
 *                 example: "Quên uống thuốc 3 ngày"
 *               clinical_notes:
 *                 type: string
 *                 example: "Theo dõi Holter HA 24h"
 *               severity_level:
 *                 type: string
 *                 enum: [MILD, MODERATE, SEVERE, CRITICAL]
 *                 example: "SEVERE"
 *               pulse:
 *                 type: integer
 *                 example: 90
 *               blood_pressure_systolic:
 *                 type: integer
 *                 example: 150
 *               blood_pressure_diastolic:
 *                 type: integer
 *                 example: 95
 *               temperature:
 *                 type: number
 *                 example: 38.2
 *     responses:
 *       200:
 *         description: Cập nhật phiếu khám lâm sàng thành công
 *       400:
 *         description: |
 *           - Phiếu khám đã FINAL
 *           - Encounter đã hoàn tất
 *       404:
 *         description: Không tìm thấy phiếu khám
 */
clinicalExamRoutes.patch(
    '/:encounterId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_CLINICAL_EXAM_EDIT'),
    ClinicalExamController.update
);
