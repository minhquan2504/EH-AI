import { Router } from 'express';
import { TeleResultController } from '../../controllers/Remote Consultation/tele-result.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';

const router = Router();

// ═══════════════════════════════════════════════════
// NHÓM 4: TRA CỨU (static routes trước)
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/results:
 *   get:
 *     summary: Danh sách kết quả khám từ xa (phân trang, filter)
 *     description: |
 *       Filter theo status, doctor_id, keyword (search conclusion, chief_complaint, tên BN).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.5.4 Tra cứu & Thống kê]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFT, COMPLETED, SIGNED] }
 *       - in: query
 *         name: doctor_id
 *         schema: { type: string }
 *       - in: query
 *         name: keyword
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: DS kết quả
 */
router.get('/results', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleResultController.listResults);

/**
 * @swagger
 * /api/teleconsultation/results/unsigned:
 *   get:
 *     summary: DS kết quả chờ ký (COMPLETED, chưa signed)
 *     description: |
 *       Trả về kết quả thuộc BS hiện tại đã COMPLETED nhưng chưa ký xác nhận.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.5.4 Tra cứu & Thống kê]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: DS chờ ký
 */
router.get('/results/unsigned', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleResultController.getUnsigned);

/**
 * @swagger
 * /api/teleconsultation/results/follow-ups:
 *   get:
 *     summary: DS kết quả cần tái khám
 *     description: |
 *       Trả về kết quả có follow_up_needed = true thuộc BS hiện tại, sắp xếp theo follow_up_date ASC.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.5.4 Tra cứu & Thống kê]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: DS cần tái khám
 */
router.get('/results/follow-ups', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleResultController.getFollowUps);

/**
 * @swagger
 * /api/teleconsultation/results/patient/{patientId}:
 *   get:
 *     summary: Lịch sử kết quả khám từ xa của BN
 *     description: |
 *       BN xem lịch sử kết quả của mình, BS/ADMIN xem của bất kỳ BN.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT (chỉ xem mình)
 *     tags: [8.5.4 Tra cứu & Thống kê]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: '1' }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Lịch sử kết quả
 */
router.get('/results/patient/:patientId', verifyAccessToken, TeleResultController.getPatientResults);

// ═══════════════════════════════════════════════════
// NHÓM 1: GHI NHẬN KẾT QUẢ (dynamic routes)
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/results/{consultationId}:
 *   post:
 *     summary: Tạo kết quả khám (DRAFT)
 *     description: |
 *       Tạo bản ghi kết quả cho phiên tư vấn. 1 phiên = 1 kết quả (UNIQUE).
 *       BS có thể nhập sơ bộ triệu chứng ban đầu.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.5.1 Ghi nhận kết quả]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chief_complaint: { type: string, example: 'Đau đầu và sốt 3 ngày' }
 *               symptom_description: { type: string, example: 'BN đau đầu vùng trán, sốt nhẹ 37.8°C, mệt mỏi toàn thân' }
 *               symptom_duration: { type: string, example: '3 ngày' }
 *               symptom_severity: { type: string, enum: [MILD, MODERATE, SEVERE], example: 'MODERATE' }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       409:
 *         description: Phiên đã có kết quả
 *   put:
 *     summary: Cập nhật kết quả (DRAFT/COMPLETED chưa ký)
 *     description: |
 *       Cập nhật toàn bộ thông tin kết quả. Không thể sửa sau khi SIGNED.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.5.1 Ghi nhận kết quả]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remote_examination_notes: { type: string, example: 'BN tỉnh táo, da hơi đỏ vùng mặt qua video' }
 *               examination_limitations: { type: string, example: 'Không thể nghe phổi, sờ bụng qua teleconsultation' }
 *               clinical_impression: { type: string, example: 'Nghi ngờ viêm đường hô hấp trên' }
 *               medical_conclusion: { type: string, example: 'Viêm đường hô hấp trên do virus, chẩn đoán sơ bộ' }
 *               conclusion_type: { type: string, enum: [PRELIMINARY, FINAL], example: 'PRELIMINARY' }
 *               treatment_plan: { type: string, example: 'Điều trị triệu chứng, theo dõi 3 ngày' }
 *               treatment_advice: { type: string, example: 'Nghỉ ngơi, uống nhiều nước, hạ sốt khi > 38.5°C' }
 *               lifestyle_recommendations: { type: string, example: 'Ăn nhẹ, tránh đồ lạnh, giữ ấm cơ thể' }
 *               medication_notes: { type: string, example: 'Paracetamol 500mg x 3 lần/ngày khi sốt' }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Kết quả đã ký, không sửa được
 *   get:
 *     summary: Chi tiết kết quả khám từ xa
 *     description: |
 *       Trả về đầy đủ thông tin kết quả + JOINed data (tên BN, BS, CK, loại hình).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.5.1 Ghi nhận kết quả]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     responses:
 *       200:
 *         description: Chi tiết kết quả
 *       404:
 *         description: Không tìm thấy
 */
router.post('/results/:consultationId', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleResultController.createResult);
router.put('/results/:consultationId', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleResultController.updateResult);
router.get('/results/:consultationId', verifyAccessToken, TeleResultController.getResult);

/**
 * @swagger
 * /api/teleconsultation/results/{consultationId}/complete:
 *   put:
 *     summary: Hoàn thiện kết quả (DRAFT → COMPLETED)
 *     description: |
 *       Validate: bắt buộc có medical_conclusion và examination_limitations.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.5.1 Ghi nhận kết quả]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     responses:
 *       200:
 *         description: Hoàn thiện thành công
 *       400:
 *         description: Thiếu kết luận / giới hạn khám
 */
router.put('/results/:consultationId/complete', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleResultController.completeResult);

/**
 * @swagger
 * /api/teleconsultation/results/{consultationId}/sign:
 *   put:
 *     summary: Ký xác nhận kết quả (COMPLETED → SIGNED)
 *     description: |
 *       Sau khi ký → kết quả immutable, không sửa được.
 *       Ghi nhận signed_by, signed_at.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.5.1 Ghi nhận kết quả]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               signature_notes: { type: string, example: 'Đã xác nhận kết quả khám.' }
 *     responses:
 *       200:
 *         description: Ký thành công
 *       400:
 *         description: Chưa COMPLETED / đã ký rồi
 */
router.put('/results/:consultationId/sign', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleResultController.signResult);

// ═══════════════════════════════════════════════════
// NHÓM 2: TRIỆU CHỨNG & SINH HIỆU
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/results/{consultationId}/symptoms:
 *   put:
 *     summary: Cập nhật triệu chứng
 *     description: |
 *       BN hoặc BS cập nhật triệu chứng. Không thể sửa sau khi SIGNED.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.5.2 Triệu chứng & Sinh hiệu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chief_complaint: { type: string, example: 'Đau đầu và sốt' }
 *               symptom_description: { type: string, example: 'Đau nhức vùng trán, sốt nhẹ từ 3 ngày trước' }
 *               symptom_duration: { type: string, example: '3 ngày' }
 *               symptom_severity: { type: string, enum: [MILD, MODERATE, SEVERE], example: 'MODERATE' }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/results/:consultationId/symptoms', verifyAccessToken, TeleResultController.updateSymptoms);

/**
 * @swagger
 * /api/teleconsultation/results/{consultationId}/vitals:
 *   put:
 *     summary: BN tự báo sinh hiệu
 *     description: |
 *       BN tự đo và gửi sinh hiệu (nhiệt độ, mạch, huyết áp, SpO2, cân nặng).
 *       Lưu dưới dạng JSONB (phân biệt với clinical_examinations do BS ghi).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.5.2 Triệu chứng & Sinh hiệu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               temperature: { type: number, example: 37.8 }
 *               pulse: { type: integer, example: 88 }
 *               bp_systolic: { type: integer, example: 130 }
 *               bp_diastolic: { type: integer, example: 85 }
 *               spo2: { type: integer, example: 97 }
 *               weight: { type: number, example: 65.5 }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/results/:consultationId/vitals', verifyAccessToken, TeleResultController.updateVitals);

// ═══════════════════════════════════════════════════
// NHÓM 3: CHUYỂN TUYẾN & TÁI KHÁM
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/results/{consultationId}/referral:
 *   put:
 *     summary: Ghi nhận chuyển tuyến
 *     description: |
 *       BS đánh dấu BN cần khám trực tiếp, ghi lý do và chuyên khoa chuyển.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.5.3 Chuyển tuyến & Tái khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [referral_needed]
 *             properties:
 *               referral_needed: { type: boolean, example: true }
 *               referral_reason: { type: string, example: 'Cần nghe phổi trực tiếp, nghi ngờ viêm phổi' }
 *               referral_specialty: { type: string, example: 'SPEC_NOI_TIM_MACH' }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/results/:consultationId/referral', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleResultController.updateReferral);

/**
 * @swagger
 * /api/teleconsultation/results/{consultationId}/follow-up:
 *   put:
 *     summary: Ghi nhận kế hoạch tái khám
 *     description: |
 *       BS ghi nhận cần tái khám, ngày, loại (TELECONSULTATION/IN_PERSON).
 *       Validate: follow_up_date phải >= ngày hiện tại.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.5.3 Chuyển tuyến & Tái khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [follow_up_needed]
 *             properties:
 *               follow_up_needed: { type: boolean, example: true }
 *               follow_up_date: { type: string, format: date, example: '2026-04-05' }
 *               follow_up_notes: { type: string, example: 'Tái khám kiểm tra lại sau 2 tuần điều trị' }
 *               follow_up_type: { type: string, enum: [TELECONSULTATION, IN_PERSON], example: 'TELECONSULTATION' }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Ngày tái khám không hợp lệ
 */
router.put('/results/:consultationId/follow-up', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleResultController.updateFollowUp);

/**
 * @swagger
 * /api/teleconsultation/results/{consultationId}/summary:
 *   get:
 *     summary: Tổng kết đầy đủ (kết quả + EMR)
 *     description: |
 *       Trả về kết quả + encounter_diagnoses + prescriptions + emr_signatures.
 *       Dùng cho BS review toàn bộ hồ sơ khám từ xa.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.5.4 Tra cứu & Thống kê]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     responses:
 *       200:
 *         description: Tổng kết đầy đủ
 */
router.get('/results/:consultationId/summary', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleResultController.getSummary);

export { router as teleResultRoutes };
