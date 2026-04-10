import { Router } from 'express';
import { DiagnosisController } from '../../controllers/EMR/diagnosis.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

export const diagnosisRoutes = Router();

// ─── Static routes PHẢI đặt TRƯỚC dynamic routes ───

/**
 * @swagger
 * /api/diagnoses/search-icd:
 *   get:
 *     summary: Tìm kiếm mã ICD-10
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_DIAGNOSIS_VIEW.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - BS nhập từ khóa → hệ thống gợi ý mã ICD-10 + tên bệnh.
 *       - Tìm cả trong code và name (case-insensitive).
 *       - Giới hạn 30 kết quả.
 *     tags: [4.3 Diagnosis Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           example: "huyết áp"
 *         description: Từ khóa tìm kiếm (mã ICD hoặc tên bệnh)
 *     responses:
 *       200:
 *         description: Tìm kiếm mã ICD-10 thành công
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
 *                       code:
 *                         type: string
 *                         example: "I10"
 *                       name:
 *                         type: string
 *                         example: "Tăng huyết áp vô căn (nguyên phát)"
 *       400:
 *         description: Thiếu từ khóa tìm kiếm
 */
diagnosisRoutes.get(
    '/search-icd',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_DIAGNOSIS_VIEW'),
    DiagnosisController.searchICD
);


/**
 * @swagger
 * /api/diagnoses/by-patient/{patientId}:
 *   get:
 *     summary: Lịch sử chẩn đoán theo bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_DIAGNOSIS_VIEW.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về tất cả chẩn đoán qua nhiều encounter của 1 BN.
 *       - Hỗ trợ lọc theo mã ICD-10, khoảng thời gian.
 *       - Phân trang.
 *     tags: [4.3 Diagnosis Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           example: "PAT_002"
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
 *         name: icd10_code
 *         schema:
 *           type: string
 *           example: "I10"
 *         description: Lọc theo mã ICD-10
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
 *         description: Lấy lịch sử chẩn đoán thành công
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
diagnosisRoutes.get(
    '/by-patient/:patientId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_DIAGNOSIS_VIEW'),
    DiagnosisController.getByPatient
);


// ─── Sub-path routes (trước dynamic) ───

/**
 * @swagger
 * /api/diagnoses/{encounterId}/conclusion:
 *   put:
 *     summary: Ghi / cập nhật kết luận khám
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_DIAGNOSIS_EDIT.
 *       **Vai trò được phép:** ADMIN, DOCTOR.
 *
 *       **Mô tả chi tiết:**
 *       - Lưu kết luận khám tổng hợp vào bảng encounters.conclusion.
 *       - Encounter phải ở trạng thái IN_PROGRESS hoặc WAITING_FOR_RESULTS.
 *       - BS ghi tóm tắt toàn bộ kết quả khám.
 *     tags: [4.3 Diagnosis Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260316_b098c91c"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [conclusion]
 *             properties:
 *               conclusion:
 *                 type: string
 *                 example: "Bệnh nhân tăng HA vô căn, cần theo dõi HA 24h. Kê thuốc hạ áp + tái khám 2 tuần."
 *     responses:
 *       200:
 *         description: Lưu kết luận khám thành công
 *       400:
 *         description: Encounter đã hoàn tất hoặc thiếu nội dung
 *       404:
 *         description: Encounter không tồn tại
 */
diagnosisRoutes.put(
    '/:encounterId/conclusion',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_DIAGNOSIS_EDIT'),
    DiagnosisController.setConclusion
);


/**
 * @swagger
 * /api/diagnoses/{encounterId}/conclusion:
 *   get:
 *     summary: Lấy kết luận khám
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_DIAGNOSIS_VIEW.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF.
 *     tags: [4.3 Diagnosis Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260316_b098c91c"
 *     responses:
 *       200:
 *         description: Lấy kết luận khám thành công
 *       404:
 *         description: Encounter không tồn tại
 */
diagnosisRoutes.get(
    '/:encounterId/conclusion',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_DIAGNOSIS_VIEW'),
    DiagnosisController.getConclusion
);


// ─── diagnosisId sub-routes ───

/**
 * @swagger
 * /api/diagnoses/{diagnosisId}/type:
 *   patch:
 *     summary: Chuyển loại chẩn đoán
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_DIAGNOSIS_EDIT.
 *       **Vai trò được phép:** ADMIN, DOCTOR.
 *
 *       **Mô tả chi tiết:**
 *       - Chuyển loại chẩn đoán khi BS có thêm thông tin (kết quả CLS).
 *       - Chuyển hợp lệ: PRELIMINARY → PRIMARY, PRELIMINARY → FINAL, SECONDARY → PRIMARY.
 *       - Nếu chuyển thành PRIMARY → kiểm tra chưa có PRIMARY khác.
 *     tags: [4.3 Diagnosis Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: diagnosisId
 *         required: true
 *         schema:
 *           type: string
 *           example: "DIAG_260316_xxxx"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [new_type]
 *             properties:
 *               new_type:
 *                 type: string
 *                 enum: [PRIMARY, FINAL]
 *                 example: "PRIMARY"
 *     responses:
 *       200:
 *         description: Chuyển loại chẩn đoán thành công
 *       400:
 *         description: Chuyển loại không hợp lệ hoặc encounter đã đóng
 *       409:
 *         description: Đã có chẩn đoán PRIMARY
 */
diagnosisRoutes.patch(
    '/:diagnosisId/type',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_DIAGNOSIS_EDIT'),
    DiagnosisController.changeType
);


// ─── Dynamic routes (encounterId hoặc diagnosisId) ───

/**
 * @swagger
 * /api/diagnoses/{encounterId}:
 *   post:
 *     summary: Thêm chẩn đoán cho encounter
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_DIAGNOSIS_CREATE.
 *       **Vai trò được phép:** ADMIN, DOCTOR.
 *
 *       **Mô tả chi tiết:**
 *       - Thêm 1 chẩn đoán mới cho encounter (1 encounter có thể có nhiều chẩn đoán).
 *       - Encounter phải ở trạng thái IN_PROGRESS hoặc WAITING_FOR_RESULTS.
 *       - Nếu diagnosis_type = PRIMARY → kiểm tra chưa có PRIMARY nào active.
 *       - Mặc định diagnosis_type = PRELIMINARY nếu không truyền.
 *       - icd10_code + diagnosis_name bắt buộc (dùng API search-icd để tra mã).
 *     tags: [4.3 Diagnosis Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260316_b098c91c"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [icd10_code, diagnosis_name]
 *             properties:
 *               icd10_code:
 *                 type: string
 *                 example: "I10"
 *                 description: "Mã ICD-10"
 *               diagnosis_name:
 *                 type: string
 *                 example: "Tăng huyết áp vô căn (nguyên phát)"
 *                 description: "Tên chẩn đoán"
 *               diagnosis_type:
 *                 type: string
 *                 enum: [PRELIMINARY, PRIMARY, SECONDARY, FINAL]
 *                 example: "PRIMARY"
 *                 description: "Loại chẩn đoán (mặc định PRELIMINARY)"
 *               notes:
 *                 type: string
 *                 example: "HA tâm thu > 140 mmHg liên tục, kết hợp sinh hiệu bất thường"
 *     responses:
 *       201:
 *         description: Thêm chẩn đoán thành công
 *       400:
 *         description: Thiếu trường bắt buộc hoặc encounter đã đóng
 *       404:
 *         description: Encounter không tồn tại
 *       409:
 *         description: Đã có chẩn đoán PRIMARY
 */
diagnosisRoutes.post(
    '/:encounterId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_DIAGNOSIS_CREATE'),
    DiagnosisController.create
);


/**
 * @swagger
 * /api/diagnoses/{encounterId}:
 *   get:
 *     summary: Lấy tất cả chẩn đoán của encounter
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_DIAGNOSIS_VIEW.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về danh sách chẩn đoán active, sắp xếp: PRIMARY → FINAL → SECONDARY → PRELIMINARY.
 *       - Kèm tên bác sĩ chẩn đoán.
 *     tags: [4.3 Diagnosis Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260316_b098c91c"
 *     responses:
 *       200:
 *         description: Lấy danh sách chẩn đoán thành công
 *       404:
 *         description: Encounter không tồn tại
 */
diagnosisRoutes.get(
    '/:encounterId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_DIAGNOSIS_VIEW'),
    DiagnosisController.getByEncounterId
);


/**
 * @swagger
 * /api/diagnoses/{diagnosisId}:
 *   patch:
 *     summary: Cập nhật chẩn đoán
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_DIAGNOSIS_EDIT.
 *       **Vai trò được phép:** ADMIN, DOCTOR.
 *
 *       **Mô tả chi tiết:**
 *       - Cập nhật nội dung chẩn đoán (icd10_code, diagnosis_name, notes).
 *       - KHÔNG cho sửa diagnosis_type ở đây (dùng PATCH /:diagnosisId/type).
 *       - Encounter phải ở trạng thái editable.
 *     tags: [4.3 Diagnosis Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: diagnosisId
 *         required: true
 *         schema:
 *           type: string
 *           example: "DIAG_260316_xxxx"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               icd10_code:
 *                 type: string
 *                 example: "I11"
 *               diagnosis_name:
 *                 type: string
 *                 example: "Bệnh tim do tăng huyết áp"
 *               notes:
 *                 type: string
 *                 example: "Cập nhật sau khi có kết quả siêu âm tim"
 *     responses:
 *       200:
 *         description: Cập nhật chẩn đoán thành công
 *       404:
 *         description: Chẩn đoán không tồn tại
 */
diagnosisRoutes.patch(
    '/:diagnosisId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_DIAGNOSIS_EDIT'),
    DiagnosisController.update
);


/**
 * @swagger
 * /api/diagnoses/{diagnosisId}:
 *   delete:
 *     summary: Xóa chẩn đoán (soft delete)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_DIAGNOSIS_EDIT.
 *       **Vai trò được phép:** ADMIN, DOCTOR.
 *
 *       **Mô tả chi tiết:**
 *       - Đánh dấu is_active = false (không xóa thật).
 *       - Encounter phải ở trạng thái editable.
 *     tags: [4.3 Diagnosis Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: diagnosisId
 *         required: true
 *         schema:
 *           type: string
 *           example: "DIAG_260316_xxxx"
 *     responses:
 *       200:
 *         description: Xóa chẩn đoán thành công
 *       404:
 *         description: Chẩn đoán không tồn tại
 */
diagnosisRoutes.delete(
    '/:diagnosisId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_DIAGNOSIS_EDIT'),
    DiagnosisController.delete
);
