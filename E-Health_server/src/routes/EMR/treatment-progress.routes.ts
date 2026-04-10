import { Router } from 'express';
import { TreatmentProgressController } from '../../controllers/EMR/treatment-progress.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

export const treatmentProgressRoutes = Router();

// =====================================================================
// HỖ TRỢ (đặt trước param routes)
// =====================================================================

/**
 * @swagger
 * /api/treatment-plans/by-patient/{patientId}:
 *   get:
 *     summary: Danh sách kế hoạch điều trị theo bệnh nhân
 *     description: |
 *       Lấy tất cả kế hoạch điều trị của bệnh nhân, hỗ trợ lọc theo trạng thái và phân trang.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST (ai có quyền `TREATMENT_PLAN_VIEW`).
 *     tags:
 *       - "4.7 Treatment Progress"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           example: "PAT_001"
 *         description: ID bệnh nhân
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, ON_HOLD, COMPLETED, CANCELLED]
 *           example: ""
 *         description: Lọc theo trạng thái
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
 *     responses:
 *       200:
 *         description: Lấy danh sách kế hoạch thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
treatmentProgressRoutes.get(
    '/by-patient/:patientId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('TREATMENT_PLAN_VIEW'),
    TreatmentProgressController.getPatientPlans
);

// =====================================================================
// KẾ HOẠCH ĐIỀU TRỊ (CRUD)
// =====================================================================

/**
 * @swagger
 * /api/treatment-plans:
 *   post:
 *     summary: Tạo kế hoạch điều trị
 *     description: |
 *       Tạo kế hoạch điều trị mới cho bệnh nhân. Mỗi BN có thể có nhiều kế hoạch active
 *       (VD: Tăng HA + Đái tháo đường riêng). Tự ghi timeline event.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR (ai có quyền `TREATMENT_PLAN_CREATE`).
 *     tags:
 *       - "4.7 Treatment Progress"
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient_id, primary_diagnosis_code, primary_diagnosis_name, title, start_date]
 *             properties:
 *               patient_id:
 *                 type: string
 *                 example: "PAT_001"
 *               primary_diagnosis_code:
 *                 type: string
 *                 example: "I10"
 *               primary_diagnosis_name:
 *                 type: string
 *                 example: "Tăng huyết áp vô căn"
 *               title:
 *                 type: string
 *                 example: "Điều trị tăng huyết áp"
 *               description:
 *                 type: string
 *                 example: "Theo dõi HA, uống thuốc hàng ngày, tái khám mỗi 2 tuần"
 *               goals:
 *                 type: string
 *                 example: "HA < 140/90, giảm cân 2kg/tháng"
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-17"
 *               expected_end_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-09-17"
 *               created_encounter_id:
 *                 type: string
 *                 example: "ENC_260316_a60a783f"
 *                 description: Encounter hiện tại (optional)
 *     responses:
 *       201:
 *         description: Tạo kế hoạch thành công
 *       400:
 *         description: Thiếu thông tin bắt buộc
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Bệnh nhân / Encounter không tồn tại
 */
treatmentProgressRoutes.post(
    '/',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('TREATMENT_PLAN_CREATE'),
    TreatmentProgressController.createPlan
);

/**
 * @swagger
 * /api/treatment-plans/{planId}:
 *   get:
 *     summary: Chi tiết kế hoạch điều trị
 *     description: |
 *       Trả về plan header + 5 ghi nhận gần nhất + chuỗi encounters liên kết + thống kê nhanh.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST (ai có quyền `TREATMENT_PLAN_VIEW`).
 *     tags:
 *       - "4.7 Treatment Progress"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           example: "TP_260317_a1b2c3d4"
 *         description: ID kế hoạch
 *     responses:
 *       200:
 *         description: Lấy chi tiết thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Kế hoạch không tồn tại
 */
treatmentProgressRoutes.get(
    '/:planId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('TREATMENT_PLAN_VIEW'),
    TreatmentProgressController.getPlanDetail
);

/**
 * @swagger
 * /api/treatment-plans/{planId}:
 *   patch:
 *     summary: Cập nhật kế hoạch điều trị
 *     description: |
 *       Cập nhật title, description, goals, expected_end_date.
 *       Chỉ cho phép khi kế hoạch ở trạng thái **ACTIVE** hoặc **ON_HOLD**.
 *       Tự ghi 1 progress note (PLAN_UPDATE).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR (ai có quyền `TREATMENT_PLAN_EDIT`).
 *     tags:
 *       - "4.7 Treatment Progress"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           example: "TP_260317_a1b2c3d4"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Điều trị tăng HA (cập nhật)"
 *               description:
 *                 type: string
 *                 example: "Đổi sang Losartan do phản ứng Enalapril"
 *               goals:
 *                 type: string
 *                 example: "HA < 130/85, không ho khan"
 *               expected_end_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-12-31"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Kế hoạch không ở trạng thái cho phép
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Kế hoạch không tồn tại
 */
treatmentProgressRoutes.patch(
    '/:planId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('TREATMENT_PLAN_EDIT'),
    TreatmentProgressController.updatePlan
);

/**
 * @swagger
 * /api/treatment-plans/{planId}/status:
 *   patch:
 *     summary: Chuyển trạng thái kế hoạch
 *     description: |
 *       Chuyển trạng thái theo state machine:
 *       - ACTIVE → ON_HOLD / COMPLETED / CANCELLED
 *       - ON_HOLD → ACTIVE / CANCELLED
 *       - COMPLETED / CANCELLED → không cho chuyển
 *
 *       Khi COMPLETED: ghi actual_end_date + timeline event.
 *       Tự ghi progress note (PLAN_UPDATE).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR (ai có quyền `TREATMENT_PLAN_EDIT`).
 *     tags:
 *       - "4.7 Treatment Progress"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           example: "TP_260317_a1b2c3d4"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, ON_HOLD, COMPLETED, CANCELLED]
 *                 example: "COMPLETED"
 *               reason:
 *                 type: string
 *                 example: "HA ổn định dưới 130/85 sau 3 tháng"
 *     responses:
 *       200:
 *         description: Chuyển trạng thái thành công
 *       400:
 *         description: Chuyển trạng thái không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Kế hoạch không tồn tại
 */
treatmentProgressRoutes.patch(
    '/:planId/status',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('TREATMENT_PLAN_EDIT'),
    TreatmentProgressController.changeStatus
);

// =====================================================================
// GHI NHẬN DIỄN TIẾN (NOTES)
// =====================================================================

/**
 * @swagger
 * /api/treatment-plans/{planId}/notes:
 *   post:
 *     summary: Thêm ghi nhận diễn tiến
 *     description: |
 *       Ghi nhận diễn tiến bệnh, phản ứng điều trị, thay đổi triệu chứng...
 *       Kế hoạch phải ở trạng thái ACTIVE hoặc ON_HOLD.
 *
 *       **Loại note:** PROGRESS, REACTION, SYMPTOM_CHANGE, FOLLOW_UP, PLAN_UPDATE, COMPLICATION, OTHER
 *       **Severity:** NORMAL, IMPORTANT, CRITICAL
 *
 *       Nếu severity = CRITICAL hoặc type = COMPLICATION → auto ghi timeline event.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE (ai có quyền `TREATMENT_NOTE_CREATE`).
 *     tags:
 *       - "4.7 Treatment Progress"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           example: "TP_260317_a1b2c3d4"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [note_type, content]
 *             properties:
 *               encounter_id:
 *                 type: string
 *                 example: "ENC_260316_a60a783f"
 *                 description: Encounter liên quan (optional)
 *               note_type:
 *                 type: string
 *                 enum: [PROGRESS, REACTION, SYMPTOM_CHANGE, FOLLOW_UP, PLAN_UPDATE, COMPLICATION, OTHER]
 *                 example: "PROGRESS"
 *               title:
 *                 type: string
 *                 example: "HA giảm sau 2 tuần"
 *               content:
 *                 type: string
 *                 example: "HA giảm từ 150/95 xuống 135/85. BN không còn đau đầu."
 *               severity:
 *                 type: string
 *                 enum: [NORMAL, IMPORTANT, CRITICAL]
 *                 example: "NORMAL"
 *     responses:
 *       201:
 *         description: Thêm ghi nhận thành công
 *       400:
 *         description: Thiếu thông tin hoặc loại note không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Kế hoạch / Encounter không tồn tại
 */
treatmentProgressRoutes.post(
    '/:planId/notes',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('TREATMENT_NOTE_CREATE'),
    TreatmentProgressController.createNote
);

/**
 * @swagger
 * /api/treatment-plans/{planId}/notes:
 *   get:
 *     summary: Danh sách ghi nhận diễn tiến
 *     description: |
 *       Lấy các ghi nhận theo plan, hỗ trợ filter theo: loại, severity, encounter, thời gian.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST (ai có quyền `TREATMENT_PLAN_VIEW`).
 *     tags:
 *       - "4.7 Treatment Progress"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           example: "TP_260317_a1b2c3d4"
 *       - in: query
 *         name: note_type
 *         schema:
 *           type: string
 *           enum: [PROGRESS, REACTION, SYMPTOM_CHANGE, FOLLOW_UP, PLAN_UPDATE, COMPLICATION, OTHER]
 *           example: ""
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [NORMAL, IMPORTANT, CRITICAL]
 *           example: ""
 *       - in: query
 *         name: encounter_id
 *         schema:
 *           type: string
 *           example: ""
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *           example: ""
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *           example: ""
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
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Kế hoạch không tồn tại
 */
treatmentProgressRoutes.get(
    '/:planId/notes',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('TREATMENT_PLAN_VIEW'),
    TreatmentProgressController.getNotes
);

/**
 * @swagger
 * /api/treatment-plans/{planId}/notes/{noteId}:
 *   patch:
 *     summary: Sửa ghi nhận diễn tiến
 *     description: |
 *       Sửa nội dung ghi nhận. Chỉ **tác giả** (recorded_by) mới có quyền sửa.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR (ai có quyền `TREATMENT_NOTE_EDIT`).
 *     tags:
 *       - "4.7 Treatment Progress"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           example: "TP_260317_a1b2c3d4"
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *           example: "TPN_260317_a1b2c3d4"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note_type:
 *                 type: string
 *                 enum: [PROGRESS, REACTION, SYMPTOM_CHANGE, FOLLOW_UP, PLAN_UPDATE, COMPLICATION, OTHER]
 *               title:
 *                 type: string
 *                 example: "HA giảm rõ rệt"
 *               content:
 *                 type: string
 *                 example: "Cập nhật: HA 130/80, BN ổn định"
 *               severity:
 *                 type: string
 *                 enum: [NORMAL, IMPORTANT, CRITICAL]
 *     responses:
 *       200:
 *         description: Sửa ghi nhận thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không phải tác giả
 *       404:
 *         description: Ghi nhận không tồn tại
 */
treatmentProgressRoutes.patch(
    '/:planId/notes/:noteId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('TREATMENT_NOTE_EDIT'),
    TreatmentProgressController.updateNote
);

/**
 * @swagger
 * /api/treatment-plans/{planId}/notes/{noteId}:
 *   delete:
 *     summary: Xóa ghi nhận diễn tiến
 *     description: |
 *       Xóa vĩnh viễn ghi nhận (hard delete). Chỉ **tác giả** (recorded_by) mới có quyền xóa.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR (ai có quyền `TREATMENT_NOTE_EDIT`).
 *     tags:
 *       - "4.7 Treatment Progress"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           example: "TP_260317_a1b2c3d4"
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *           example: "TPN_260317_a1b2c3d4"
 *     responses:
 *       200:
 *         description: Xóa ghi nhận thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không phải tác giả
 *       404:
 *         description: Ghi nhận không tồn tại
 */
treatmentProgressRoutes.delete(
    '/:planId/notes/:noteId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('TREATMENT_NOTE_EDIT'),
    TreatmentProgressController.deleteNote
);

// =====================================================================
// LIÊN KẾT TÁI KHÁM & TỔNG HỢP
// =====================================================================

/**
 * @swagger
 * /api/treatment-plans/{planId}/follow-ups:
 *   post:
 *     summary: Liên kết encounter tái khám
 *     description: |
 *       Gắn encounter tái khám vào chuỗi: ENC_1 → ENC_2 → ENC_3...
 *       Cả 2 encounter phải cùng bệnh nhân và không được trùng.
 *       Tự ghi FOLLOW_UP note + timeline event.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR (ai có quyền `TREATMENT_PLAN_EDIT`).
 *     tags:
 *       - "4.7 Treatment Progress"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           example: "TP_260317_a1b2c3d4"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [previous_encounter_id, follow_up_encounter_id]
 *             properties:
 *               previous_encounter_id:
 *                 type: string
 *                 example: "ENC_260316_a60a783f"
 *               follow_up_encounter_id:
 *                 type: string
 *                 example: "ENC_260330_b71c894e"
 *               follow_up_reason:
 *                 type: string
 *                 example: "Tái khám kiểm tra HA sau 2 tuần"
 *               scheduled_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-30"
 *               notes:
 *                 type: string
 *                 example: "BN hẹn tái khám 2 tuần"
 *     responses:
 *       201:
 *         description: Liên kết thành công
 *       400:
 *         description: Encounter trùng / khác BN / plan không active
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Kế hoạch / Encounter không tồn tại
 *       409:
 *         description: Liên kết đã tồn tại
 */
treatmentProgressRoutes.post(
    '/:planId/follow-ups',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('TREATMENT_PLAN_EDIT'),
    TreatmentProgressController.createFollowUp
);

/**
 * @swagger
 * /api/treatment-plans/{planId}/follow-up-chain:
 *   get:
 *     summary: Xem chuỗi tái khám
 *     description: |
 *       Trả về toàn bộ chain encounter theo thứ tự thời gian,
 *       kèm chẩn đoán + sinh hiệu + số notes từng lần.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE (ai có quyền `TREATMENT_PLAN_VIEW`).
 *     tags:
 *       - "4.7 Treatment Progress"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           example: "TP_260317_a1b2c3d4"
 *     responses:
 *       200:
 *         description: Lấy chuỗi tái khám thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Kế hoạch không tồn tại
 */
treatmentProgressRoutes.get(
    '/:planId/follow-up-chain',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('TREATMENT_PLAN_VIEW'),
    TreatmentProgressController.getFollowUpChain
);

/**
 * @swagger
 * /api/treatment-plans/{planId}/summary:
 *   get:
 *     summary: Tổng hợp lịch sử điều trị
 *     description: |
 *       Tổng hợp toàn bộ diễn tiến điều trị bao gồm:
 *       - Kế hoạch header + thống kê
 *       - Notes theo type/severity
 *       - Xu hướng sinh hiệu (HA, mạch, cân nặng) qua các lần khám
 *       - Lịch sử đơn thuốc
 *       - Chuỗi tái khám
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST (ai có quyền `TREATMENT_PLAN_VIEW`).
 *     tags:
 *       - "4.7 Treatment Progress"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           example: "TP_260317_a1b2c3d4"
 *     responses:
 *       200:
 *         description: Lấy tổng hợp thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Kế hoạch không tồn tại
 */
treatmentProgressRoutes.get(
    '/:planId/summary',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('TREATMENT_PLAN_VIEW'),
    TreatmentProgressController.getSummary
);
