import { Router } from 'express';
import { VitalSignsController } from '../../controllers/EHR/vital-signs.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';

export const vitalSignsRoutes = Router();

/**
 * @swagger
 * /api/ehr/patients/{patientId}/vitals:
 *   get:
 *     summary: Lịch sử sinh hiệu tổng hợp
 *     description: |
 *       Lấy tất cả sinh hiệu từ clinical_examinations xuyên suốt lịch sử khám.
 *       Sinh hiệu: pulse, BP sys/dia, temperature, respiratory_rate, spo2, weight, height, bmi, blood_glucose.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF.
 *     tags: ["6.6 Vital Signs"]
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
vitalSignsRoutes.get(
    '/patients/:patientId/vitals',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF'),
    VitalSignsController.getVitals
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/vitals/latest:
 *   get:
 *     summary: Sinh hiệu mới nhất
 *     description: |
 *       Sinh hiệu từ encounter gần nhất có clinical_examination.
 *       Quan trọng cho BS khi cần biết tình trạng hiện tại.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF.
 *     tags: ["6.6 Vital Signs"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *     responses:
 *       200: { description: Lấy sinh hiệu mới nhất thành công }
 *       404: { description: Bệnh nhân không tồn tại }
 */
vitalSignsRoutes.get(
    '/patients/:patientId/vitals/latest',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF'),
    VitalSignsController.getLatestVitals
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/vitals/trends:
 *   get:
 *     summary: Xu hướng sinh hiệu theo thời gian
 *     description: |
 *       Trả về data points cho 1 loại chỉ số qua thời gian — frontend vẽ chart.
 *       Gom từ CẢ HAI nguồn: clinical_examinations (CLINIC) + patient_health_metrics (DEVICE/SELF_REPORTED).
 *       Tối đa 50 điểm.
 *
 *       **metric_type hợp lệ:** pulse, blood_pressure_systolic, blood_pressure_diastolic,
 *       temperature, respiratory_rate, spo2, weight, height, bmi, blood_glucose, HEART_RATE, BLOOD_SUGAR...
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *     tags: ["6.6 Vital Signs"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: query
 *         name: metric_type
 *         required: true
 *         schema: { type: string, example: "blood_pressure_systolic" }
 *         description: "Loại chỉ số cần xem xu hướng"
 *     responses:
 *       200: { description: Lấy xu hướng thành công }
 *       400: { description: Thiếu metric_type }
 *       404: { description: Bệnh nhân không tồn tại }
 */
vitalSignsRoutes.get(
    '/patients/:patientId/vitals/trends',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'),
    VitalSignsController.getTrends
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/vitals/abnormal:
 *   get:
 *     summary: Sinh hiệu bất thường
 *     description: |
 *       So sánh sinh hiệu vs ngưỡng chuẩn (vital_reference_ranges).
 *       Trả về danh sách chỉ số ngoài khoảng bình thường kèm mức độ (WARNING/CRITICAL).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *     tags: ["6.6 Vital Signs"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *     responses:
 *       200: { description: Lấy sinh hiệu bất thường thành công }
 *       404: { description: Bệnh nhân không tồn tại }
 */
vitalSignsRoutes.get(
    '/patients/:patientId/vitals/abnormal',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'),
    VitalSignsController.getAbnormalVitals
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/vitals/summary:
 *   get:
 *     summary: Tổng hợp sinh hiệu
 *     description: |
 *       Tổng hợp: BMI hiện tại + phân loại, BP trung bình 3 lần gần nhất,
 *       cân nặng hiện tại vs trước (trend), tổng lần đo, lần đo gần nhất.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF.
 *     tags: ["6.6 Vital Signs"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *     responses:
 *       200: { description: Lấy tổng hợp thành công }
 *       404: { description: Bệnh nhân không tồn tại }
 */
vitalSignsRoutes.get(
    '/patients/:patientId/vitals/summary',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF'),
    VitalSignsController.getSummary
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/health-metrics:
 *   get:
 *     summary: Danh sách chỉ số sức khỏe
 *     description: |
 *       Đọc từ patient_health_metrics: chỉ số liên tục từ thiết bị/tự báo cáo.
 *       Filter: metric_code, source_type, khoảng ngày.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF.
 *     tags: ["6.6 Vital Signs"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: query
 *         name: metric_code
 *         schema: { type: string, example: "" }
 *       - in: query
 *         name: source_type
 *         schema: { type: string, enum: [SELF_REPORTED, CLINIC, DEVICE], example: "" }
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
 *   post:
 *     summary: Thêm chỉ số sức khỏe
 *     description: |
 *       Ghi nhận chỉ số đo từ thiết bị (máy đo huyết áp, đường huyết...) hoặc tự báo cáo.
 *       metric_value là JSON để hỗ trợ nhiều dạng (VD: {"systolic": 130, "diastolic": 85}).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *     tags: ["6.6 Vital Signs"]
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
 *             required: [metric_code, metric_name, metric_value, unit, measured_at]
 *             properties:
 *               metric_code:
 *                 type: string
 *                 example: "BLOOD_PRESSURE"
 *               metric_name:
 *                 type: string
 *                 example: "Huyết áp"
 *               metric_value:
 *                 type: object
 *                 example: { "systolic": 130, "diastolic": 85 }
 *               unit:
 *                 type: string
 *                 example: "mmHg"
 *               measured_at:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-03-18T10:30:00+07:00"
 *               source_type:
 *                 type: string
 *                 enum: [SELF_REPORTED, CLINIC, DEVICE]
 *                 example: "DEVICE"
 *               device_info:
 *                 type: string
 *                 example: "Máy đo huyết áp Omron HEM-7124"
 *     responses:
 *       201: { description: Thêm thành công }
 *       400: { description: Thiếu thông tin bắt buộc }
 *       404: { description: Bệnh nhân không tồn tại }
 */
vitalSignsRoutes.get(
    '/patients/:patientId/health-metrics',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF'),
    VitalSignsController.getHealthMetrics
);

vitalSignsRoutes.post(
    '/patients/:patientId/health-metrics',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'),
    VitalSignsController.createHealthMetric
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/health-metrics/timeline:
 *   get:
 *     summary: Timeline hợp nhất sinh hiệu & chỉ số sức khỏe
 *     description: |
 *       UNION clinical_examinations + patient_health_metrics → dòng thời gian
 *       theo mốc thời gian, phân loại nguồn (CLINIC vs DEVICE vs SELF_REPORTED).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *     tags: ["6.6 Vital Signs"]
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
vitalSignsRoutes.get(
    '/patients/:patientId/health-metrics/timeline',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'),
    VitalSignsController.getTimeline
);
