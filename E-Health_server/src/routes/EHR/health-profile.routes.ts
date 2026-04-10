import { Router } from 'express';
import { HealthProfileController } from '../../controllers/EHR/health-profile.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';

export const healthProfileRoutes = Router();

// =====================================================================
// HỒ SƠ SỨC KHỎE TỔNG HỢP (READ-ONLY AGGREGATE)
// =====================================================================

/**
 * @swagger
 * /api/ehr/patients/{patientId}/profile:
 *   get:
 *     summary: Hồ sơ sức khỏe tổng hợp
 *     description: |
 *       Trả về **panorama sức khỏe toàn diện** của bệnh nhân, tổng hợp dữ liệu từ 12+ nguồn:
 *       - Thông tin hành chính cơ bản
 *       - Tóm tắt sức khỏe (tổng encounters, lần khám cuối, số bệnh lý, dị ứng, thuốc...)
 *       - Sinh hiệu lần khám gần nhất (mạch, HA, SpO2, BMI...)
 *       - Bệnh lý đang hoạt động (tiền sử ACTIVE)
 *       - Danh sách dị ứng (xếp SEVERE lên đầu)
 *       - Thuốc đang sử dụng (đơn PRESCRIBED/DISPENSED còn hiệu lực)
 *       - 10 chẩn đoán gần nhất
 *       - Tình trạng bảo hiểm
 *       - Thẻ phân loại (VIP, Mãn tính, Nguy cơ cao)
 *       - Cảnh báo y tế (tự động + thủ công)
 *       - Ghi chú EHR
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, RECEPTIONIST.
 *     tags:
 *       - "6.1 Patient Health Profile"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           example: "1"
 *         description: ID bệnh nhân (UUID hoặc auto-increment)
 *     responses:
 *       200:
 *         description: Lấy hồ sơ sức khỏe tổng hợp thành công
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
 *                   example: "Lấy hồ sơ sức khỏe tổng hợp thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     patient_info:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         patient_code: { type: string }
 *                         full_name: { type: string }
 *                         age: { type: integer }
 *                     health_summary:
 *                       type: object
 *                       properties:
 *                         total_encounters: { type: integer, example: 15 }
 *                         last_encounter_date: { type: string, nullable: true }
 *                         active_conditions_count: { type: integer, example: 3 }
 *                         allergy_count: { type: integer, example: 2 }
 *                         risk_level: { type: string, example: "MODERATE" }
 *                     latest_vitals:
 *                       type: object
 *                       nullable: true
 *                     active_conditions:
 *                       type: array
 *                       items: { type: object }
 *                     allergies:
 *                       type: array
 *                       items: { type: object }
 *                     current_medications:
 *                       type: array
 *                       items: { type: object }
 *                     alerts:
 *                       type: array
 *                       items: { type: object }
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
healthProfileRoutes.get(
    '/patients/:patientId/profile',
    verifyAccessToken,
    checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF'),
    HealthProfileController.getFullProfile
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/health-summary:
 *   get:
 *     summary: Tóm tắt sức khỏe nhanh
 *     description: |
 *       Phiên bản rút gọn cho tra cứu nhanh (dashboard, popup bệnh nhân).
 *       Chỉ trả: health_summary + latest_vitals + alerts.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, RECEPTIONIST, PHARMACIST.
 *     tags:
 *       - "6.1 Patient Health Profile"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           example: "1"
 *         description: ID bệnh nhân
 *     responses:
 *       200:
 *         description: Lấy tóm tắt sức khỏe thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
healthProfileRoutes.get(
    '/patients/:patientId/health-summary',
    verifyAccessToken,
    checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF', 'PHARMACIST'),
    HealthProfileController.getHealthSummary
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/latest-vitals:
 *   get:
 *     summary: Sinh hiệu gần nhất
 *     description: |
 *       Lấy bản ghi sinh hiệu (mạch, huyết áp, nhiệt độ, SpO2, cân nặng, chiều cao, BMI)
 *       từ lượt khám gần nhất có dữ liệu clinical_examinations.
 *       Trả `null` nếu bệnh nhân chưa có lượt khám nào.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, RECEPTIONIST.
 *     tags:
 *       - "6.1 Patient Health Profile"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           example: "1"
 *         description: ID bệnh nhân
 *     responses:
 *       200:
 *         description: Lấy sinh hiệu gần nhất thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     encounter_id: { type: string }
 *                     encounter_date: { type: string }
 *                     pulse: { type: integer, example: 72 }
 *                     blood_pressure_systolic: { type: integer, example: 120 }
 *                     blood_pressure_diastolic: { type: integer, example: 80 }
 *                     temperature: { type: number, example: 36.5 }
 *                     spo2: { type: number, example: 98 }
 *                     weight: { type: number, example: 65 }
 *                     height: { type: number, example: 170 }
 *                     bmi: { type: number, example: 22.5 }
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
healthProfileRoutes.get(
    '/patients/:patientId/latest-vitals',
    verifyAccessToken,
    checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF'),
    HealthProfileController.getLatestVitals
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/active-conditions:
 *   get:
 *     summary: Danh sách bệnh lý đang hoạt động
 *     description: |
 *       Lấy từ bảng patient_medical_histories với status = 'ACTIVE'.
 *       Phân biệt PERSONAL (tiền sử cá nhân) vs FAMILY (tiền sử gia đình).
 *       Kèm mã ICD-10 (condition_code) nếu có.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, RECEPTIONIST.
 *     tags:
 *       - "6.1 Patient Health Profile"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           example: "1"
 *         description: ID bệnh nhân
 *     responses:
 *       200:
 *         description: Lấy danh sách bệnh lý thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
healthProfileRoutes.get(
    '/patients/:patientId/active-conditions',
    verifyAccessToken,
    checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF'),
    HealthProfileController.getActiveConditions
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/allergy-list:
 *   get:
 *     summary: Danh sách dị ứng
 *     description: |
 *       Lấy toàn bộ dị ứng của bệnh nhân từ patient_allergies.
 *       **Quan trọng nhất trong EHR** — bác sĩ cần biết trước khi kê đơn.
 *       Nhóm theo allergen_type (DRUG, FOOD, ENVIRONMENT).
 *       Dị ứng mức **SEVERE** được xếp lên đầu.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, RECEPTIONIST, PHARMACIST.
 *     tags:
 *       - "6.1 Patient Health Profile"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           example: "1"
 *         description: ID bệnh nhân
 *     responses:
 *       200:
 *         description: Lấy danh sách dị ứng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     total: { type: integer, example: 3 }
 *                     by_type:
 *                       type: object
 *                       example: { "DRUG": [...], "FOOD": [...] }
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           allergen_name: { type: string, example: "Penicillin" }
 *                           severity: { type: string, example: "SEVERE" }
 *                           reaction: { type: string, example: "Phù nề, khó thở" }
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
healthProfileRoutes.get(
    '/patients/:patientId/allergy-list',
    verifyAccessToken,
    checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF', 'PHARMACIST'),
    HealthProfileController.getAllergies
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/current-medications:
 *   get:
 *     summary: Thuốc đang sử dụng
 *     description: |
 *       Lấy các thuốc từ đơn PRESCRIBED/DISPENSED mà thời gian sử dụng chưa hết.
 *       Tính toán: `estimated_end_date = prescribed_at + duration_days`.
 *       Chỉ hiển thị thuốc còn trong khoảng thời gian sử dụng.
 *       Thuốc không có duration_days (dùng dài hạn) cũng được hiển thị.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST.
 *     tags:
 *       - "6.1 Patient Health Profile"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           example: "1"
 *         description: ID bệnh nhân
 *     responses:
 *       200:
 *         description: Lấy danh sách thuốc đang dùng thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
healthProfileRoutes.get(
    '/patients/:patientId/current-medications',
    verifyAccessToken,
    checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST'),
    HealthProfileController.getCurrentMedications
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/diagnosis-history:
 *   get:
 *     summary: Lịch sử chẩn đoán
 *     description: |
 *       Lấy tất cả chẩn đoán ICD-10 từ các lượt khám, có phân trang và filter theo khoảng thời gian.
 *       Xếp thứ tự: mới nhất trước, PRIMARY trước SECONDARY.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *     tags:
 *       - "6.1 Patient Health Profile"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           example: "1"
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
 *           format: date
 *           example: ""
 *         description: Từ ngày
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *           example: ""
 *         description: Đến ngày
 *     responses:
 *       200:
 *         description: Lấy lịch sử chẩn đoán thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
healthProfileRoutes.get(
    '/patients/:patientId/diagnosis-history',
    verifyAccessToken,
    checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'),
    HealthProfileController.getDiagnosisHistory
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/insurance-status:
 *   get:
 *     summary: Tình trạng bảo hiểm
 *     description: |
 *       Lấy tất cả thẻ bảo hiểm của bệnh nhân. Tự động tính:
 *       - `is_expired`: so sánh end_date với ngày hiện tại
 *       - `days_until_expiry`: số ngày còn lại trước khi hết hạn (âm = đã hết)
 *       Thẻ `is_primary` được xếp lên đầu.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, RECEPTIONIST.
 *     tags:
 *       - "6.1 Patient Health Profile"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           example: "1"
 *         description: ID bệnh nhân
 *     responses:
 *       200:
 *         description: Lấy tình trạng bảo hiểm thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
healthProfileRoutes.get(
    '/patients/:patientId/insurance-status',
    verifyAccessToken,
    checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF'),
    HealthProfileController.getInsuranceStatus
);

// =====================================================================
// CẢNH BÁO Y TẾ (AUTO + MANUAL)
// =====================================================================

/**
 * @swagger
 * /api/ehr/patients/{patientId}/alerts:
 *   get:
 *     summary: Lấy danh sách cảnh báo y tế
 *     description: |
 *       Trả về **tất cả cảnh báo y tế** của bệnh nhân, bao gồm:
 *
 *       **Cảnh báo TỰ ĐỘNG (source=AUTO)** — tính runtime, không lưu DB:
 *       - `CRITICAL_ALLERGY`: Có dị ứng mức SEVERE
 *       - `CHRONIC_CONDITION`: Bệnh mãn tính (tiền sử ACTIVE > 12 tháng)
 *       - `INSURANCE_EXPIRING`: Thẻ BH sắp hết hạn (< 30 ngày)
 *       - `INSURANCE_EXPIRED`: Thẻ BH đã hết hạn
 *       - `NO_RECENT_VISIT`: Chưa tái khám > 6 tháng (BN mãn tính)
 *       - `ACTIVE_TREATMENT`: Đang có kế hoạch điều trị ACTIVE
 *
 *       **Cảnh báo THỦ CÔNG (source=MANUAL)** — BS tạo, lưu DB:
 *       - `MANUAL_NOTE`, `DRUG_WARNING`, `CONDITION_NOTE`
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, RECEPTIONIST, PHARMACIST.
 *     tags:
 *       - "6.1 Patient Health Profile"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           example: "1"
 *         description: ID bệnh nhân
 *     responses:
 *       200:
 *         description: Lấy danh sách cảnh báo thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
healthProfileRoutes.get(
    '/patients/:patientId/alerts',
    verifyAccessToken,
    checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF', 'PHARMACIST'),
    HealthProfileController.getAlerts
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/alerts:
 *   post:
 *     summary: Thêm cảnh báo y tế thủ công
 *     description: |
 *       Bác sĩ thêm cảnh báo/lưu ý y tế đặc biệt cho bệnh nhân.
 *       VD: "BN không dung nạp Metformin liều cao", "Cần theo dõi đường huyết hàng tuần".
 *
 *       **Loại cảnh báo cho phép:** MANUAL_NOTE, DRUG_WARNING, CONDITION_NOTE
 *       **Mức độ:** INFO, WARNING, CRITICAL (mặc định: INFO)
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR.
 *     tags:
 *       - "6.1 Patient Health Profile"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           example: "1"
 *         description: ID bệnh nhân
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [alert_type, title]
 *             properties:
 *               alert_type:
 *                 type: string
 *                 enum: [MANUAL_NOTE, DRUG_WARNING, CONDITION_NOTE]
 *                 example: "DRUG_WARNING"
 *               severity:
 *                 type: string
 *                 enum: [INFO, WARNING, CRITICAL]
 *                 example: "WARNING"
 *               title:
 *                 type: string
 *                 example: "Không dung nạp Metformin liều cao"
 *               description:
 *                 type: string
 *                 example: "BN bị buồn nôn, tiêu chảy khi dùng Metformin > 1500mg/ngày. Cần giảm liều."
 *     responses:
 *       201:
 *         description: Thêm cảnh báo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ (thiếu title, loại cảnh báo sai...)
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền (chỉ ADMIN, DOCTOR)
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
healthProfileRoutes.post(
    '/patients/:patientId/alerts',
    verifyAccessToken,
    checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR'),
    HealthProfileController.createAlert
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/alerts/{alertId}:
 *   put:
 *     summary: Cập nhật cảnh báo thủ công
 *     description: |
 *       Cập nhật nội dung, mức độ, hoặc trạng thái is_active của cảnh báo thủ công.
 *       Không thể sửa cảnh báo tự động (source=AUTO).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR.
 *     tags:
 *       - "6.1 Patient Health Profile"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           example: "1"
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *           example: "EHRA_260318_abc12345"
 *         description: ID cảnh báo (chỉ cảnh báo thủ công)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               severity:
 *                 type: string
 *                 enum: [INFO, WARNING, CRITICAL]
 *                 example: "CRITICAL"
 *               title:
 *                 type: string
 *                 example: "Cập nhật: Dị ứng thuốc mới phát hiện"
 *               description:
 *                 type: string
 *                 example: "Bổ sung thông tin từ kết quả test dị ứng ngày 18/03"
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật cảnh báo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Cảnh báo không thuộc bệnh nhân này
 *       404:
 *         description: Cảnh báo không tồn tại
 */
healthProfileRoutes.put(
    '/patients/:patientId/alerts/:alertId',
    verifyAccessToken,
    checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR'),
    HealthProfileController.updateAlert
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/alerts/{alertId}:
 *   delete:
 *     summary: Xóa cảnh báo thủ công
 *     description: |
 *       Soft delete cảnh báo thủ công. Cảnh báo tự động không thể xóa
 *       (chúng tự mất khi điều kiện trigger không còn).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR.
 *     tags:
 *       - "6.1 Patient Health Profile"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           example: "1"
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *           example: "EHRA_260318_abc12345"
 *     responses:
 *       200:
 *         description: Xóa cảnh báo thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Cảnh báo không thuộc bệnh nhân này
 *       404:
 *         description: Cảnh báo không tồn tại
 */
healthProfileRoutes.delete(
    '/patients/:patientId/alerts/:alertId',
    verifyAccessToken,
    checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR'),
    HealthProfileController.deleteAlert
);

// =====================================================================
// GHI CHÚ EHR
// =====================================================================

/**
 * @swagger
 * /api/ehr/patients/{patientId}/notes:
 *   put:
 *     summary: Cập nhật ghi chú & mức rủi ro EHR
 *     description: |
 *       Cập nhật ghi chú tổng hợp EHR và/hoặc mức rủi ro sức khỏe.
 *       Nếu chưa có hồ sơ EHR sẽ tự động tạo mới (upsert).
 *       Ghi lại thời điểm và BS review gần nhất.
 *
 *       **Mức rủi ro:** LOW, MODERATE, HIGH, CRITICAL
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR.
 *     tags:
 *       - "6.1 Patient Health Profile"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           example: "1"
 *         description: ID bệnh nhân
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ehr_notes:
 *                 type: string
 *                 example: "BN có tiền sử tăng huyết áp, đái tháo đường type 2. Đang kiểm soát bằng Metformin 500mg x2/ngày."
 *               risk_level:
 *                 type: string
 *                 enum: [LOW, MODERATE, HIGH, CRITICAL]
 *                 example: "MODERATE"
 *     responses:
 *       200:
 *         description: Cập nhật ghi chú EHR thành công
 *       400:
 *         description: Mức rủi ro không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền (chỉ ADMIN, DOCTOR)
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
healthProfileRoutes.put(
    '/patients/:patientId/notes',
    verifyAccessToken,
    checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR'),
    HealthProfileController.updateNotes
);
