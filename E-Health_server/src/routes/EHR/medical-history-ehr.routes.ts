import { Router } from 'express';
import { MedicalHistoryEhrController } from '../../controllers/EHR/medical-history-ehr.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';

export const medicalHistoryEhrRoutes = Router();

// ══════════════════════════════════════════════════════════════════════
// NHÓM A: TIỀN SỬ BỆNH (Medical Histories)
// ══════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/ehr/patients/{patientId}/medical-histories:
 *   get:
 *     summary: Danh sách tiền sử bệnh
 *     description: |
 *       Lấy danh sách tiền sử bệnh cá nhân (PERSONAL) và gia đình (FAMILY).
 *       Hỗ trợ filter theo loại, trạng thái, từ khóa.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF, PHARMACIST.
 *     tags: ["6.3 Medical History"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: query
 *         name: history_type
 *         schema: { type: string, enum: [PERSONAL, FAMILY], example: "" }
 *         description: "Lọc theo loại: PERSONAL hoặc FAMILY"
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, RESOLVED], example: "" }
 *       - in: query
 *         name: keyword
 *         schema: { type: string, example: "" }
 *         description: "Tìm kiếm theo tên bệnh hoặc mã ICD-10"
 *     responses:
 *       200: { description: Lấy danh sách thành công }
 *       404: { description: Bệnh nhân không tồn tại }
 */
medicalHistoryEhrRoutes.get(
    '/patients/:patientId/medical-histories',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF', 'PHARMACIST'),
    MedicalHistoryEhrController.getHistories
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/medical-histories/{historyId}:
 *   get:
 *     summary: Chi tiết tiền sử bệnh
 *     description: |
 *       Xem chi tiết 1 bản ghi tiền sử bệnh.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF, PHARMACIST.
 *     tags: ["6.3 Medical History"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: path
 *         name: historyId
 *         required: true
 *         schema: { type: string, example: "PMH_260318_abc12345" }
 *     responses:
 *       200: { description: Lấy chi tiết thành công }
 *       404: { description: Không tìm thấy }
 */
medicalHistoryEhrRoutes.get(
    '/patients/:patientId/medical-histories/:historyId',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF', 'PHARMACIST'),
    MedicalHistoryEhrController.getHistoryById
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/medical-histories:
 *   post:
 *     summary: Thêm tiền sử bệnh
 *     description: |
 *       Thêm tiền sử bệnh cá nhân hoặc gia đình.
 *       - **PERSONAL**: Bệnh chính BN mắc. Gắn mã ICD-10.
 *       - **FAMILY**: Bệnh gia đình, bắt buộc trường `relationship`.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *     tags: ["6.3 Medical History"]
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
 *             required: [condition_name, history_type]
 *             properties:
 *               condition_code: { type: string, example: "E11", description: "Mã ICD-10" }
 *               condition_name: { type: string, example: "Đái tháo đường type 2" }
 *               history_type: { type: string, enum: [PERSONAL, FAMILY], example: "PERSONAL" }
 *               relationship: { type: string, enum: [FATHER, MOTHER, SIBLING, GRANDPARENT, UNCLE_AUNT, CHILD, SPOUSE, OTHER], example: "", description: "Bắt buộc khi FAMILY" }
 *               diagnosis_date: { type: string, format: date, example: "2024-06-15" }
 *               status: { type: string, enum: [ACTIVE, RESOLVED], example: "ACTIVE" }
 *               notes: { type: string, example: "Phát hiện khi khám định kỳ 2024" }
 *     responses:
 *       201: { description: Thêm thành công }
 *       400: { description: Dữ liệu không hợp lệ }
 *       404: { description: Bệnh nhân không tồn tại }
 */
medicalHistoryEhrRoutes.post(
    '/patients/:patientId/medical-histories',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'),
    MedicalHistoryEhrController.createHistory
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/medical-histories/{historyId}:
 *   put:
 *     summary: Cập nhật tiền sử bệnh
 *     description: |
 *       Cập nhật thông tin tiền sử bệnh. Chỉ cần truyền trường muốn sửa.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *     tags: ["6.3 Medical History"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: path
 *         name: historyId
 *         required: true
 *         schema: { type: string, example: "PMH_260318_abc12345" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               condition_code: { type: string, example: "E11" }
 *               condition_name: { type: string, example: "Đái tháo đường type 2" }
 *               diagnosis_date: { type: string, format: date, example: "2024-06-15" }
 *               status: { type: string, enum: [ACTIVE, RESOLVED], example: "RESOLVED" }
 *               notes: { type: string, example: "Đã kiểm soát tốt bằng thuốc" }
 *     responses:
 *       200: { description: Cập nhật thành công }
 *       404: { description: Không tìm thấy }
 */
medicalHistoryEhrRoutes.put(
    '/patients/:patientId/medical-histories/:historyId',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'),
    MedicalHistoryEhrController.updateHistory
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/medical-histories/{historyId}/status:
 *   patch:
 *     summary: Đổi trạng thái tiền sử (ACTIVE ↔ RESOLVED)
 *     description: |
 *       Chuyển trạng thái bệnh: ACTIVE → RESOLVED (đã khỏi) hoặc ngược lại.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *     tags: ["6.3 Medical History"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: path
 *         name: historyId
 *         required: true
 *         schema: { type: string, example: "PMH_260318_abc12345" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [ACTIVE, RESOLVED], example: "RESOLVED" }
 *     responses:
 *       200: { description: Cập nhật trạng thái thành công }
 *       400: { description: Trạng thái không hợp lệ }
 *       404: { description: Không tìm thấy }
 */
medicalHistoryEhrRoutes.patch(
    '/patients/:patientId/medical-histories/:historyId/status',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'),
    MedicalHistoryEhrController.updateHistoryStatus
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/medical-histories/{historyId}:
 *   delete:
 *     summary: Xóa tiền sử bệnh
 *     description: |
 *       Soft delete bản ghi tiền sử bệnh.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR.
 *     tags: ["6.3 Medical History"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: path
 *         name: historyId
 *         required: true
 *         schema: { type: string, example: "PMH_260318_abc12345" }
 *     responses:
 *       200: { description: Xóa thành công }
 *       404: { description: Không tìm thấy }
 */
medicalHistoryEhrRoutes.delete(
    '/patients/:patientId/medical-histories/:historyId',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR'),
    MedicalHistoryEhrController.deleteHistory
);

// ══════════════════════════════════════════════════════════════════════
// NHÓM B: DỊ ỨNG (Allergies)
// ══════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/ehr/patients/{patientId}/allergies:
 *   get:
 *     summary: Danh sách dị ứng
 *     description: |
 *       Lấy danh sách dị ứng bệnh nhân. Sắp xếp theo mức độ (SEVERE trước).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF, PHARMACIST.
 *     tags: ["6.3 Medical History"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: query
 *         name: allergen_type
 *         schema: { type: string, enum: [DRUG, FOOD, ENVIRONMENT, OTHER], example: "" }
 *       - in: query
 *         name: severity
 *         schema: { type: string, enum: [MILD, MODERATE, SEVERE], example: "" }
 *     responses:
 *       200: { description: Lấy danh sách thành công }
 *       404: { description: Bệnh nhân không tồn tại }
 */
medicalHistoryEhrRoutes.get(
    '/patients/:patientId/allergies',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF', 'PHARMACIST'),
    MedicalHistoryEhrController.getAllergies
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/allergies/{allergyId}:
 *   get:
 *     summary: Chi tiết dị ứng
 *     description: |
 *       Xem chi tiết 1 bản ghi dị ứng.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF, PHARMACIST.
 *     tags: ["6.3 Medical History"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: path
 *         name: allergyId
 *         required: true
 *         schema: { type: string, example: "PA_260318_abc12345" }
 *     responses:
 *       200: { description: Lấy chi tiết thành công }
 *       404: { description: Không tìm thấy }
 */
medicalHistoryEhrRoutes.get(
    '/patients/:patientId/allergies/:allergyId',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF', 'PHARMACIST'),
    MedicalHistoryEhrController.getAllergyById
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/allergies:
 *   post:
 *     summary: Thêm dị ứng
 *     description: |
 *       Thêm dị ứng mới. Kiểm tra trùng theo tên dị nguyên (allergen_name).
 *       - **DRUG**: Dị ứng thuốc — quan trọng cho kê đơn
 *       - **FOOD**: Dị ứng thực phẩm
 *       - **ENVIRONMENT**: Dị ứng môi trường
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *     tags: ["6.3 Medical History"]
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
 *             required: [allergen_name, allergen_type]
 *             properties:
 *               allergen_type: { type: string, enum: [DRUG, FOOD, ENVIRONMENT, OTHER], example: "DRUG" }
 *               allergen_name: { type: string, example: "Penicillin" }
 *               reaction: { type: string, example: "Phát ban toàn thân, khó thở" }
 *               severity: { type: string, enum: [MILD, MODERATE, SEVERE], example: "SEVERE" }
 *               notes: { type: string, example: "Phản ứng xảy ra 2023 sau tiêm Amoxicillin" }
 *     responses:
 *       201: { description: Thêm thành công }
 *       400: { description: Dữ liệu không hợp lệ hoặc trùng }
 *       404: { description: Bệnh nhân không tồn tại }
 */
medicalHistoryEhrRoutes.post(
    '/patients/:patientId/allergies',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'),
    MedicalHistoryEhrController.createAllergy
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/allergies/{allergyId}:
 *   put:
 *     summary: Cập nhật dị ứng
 *     description: |
 *       Cập nhật thông tin dị ứng. Chỉ cần truyền trường muốn sửa.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *     tags: ["6.3 Medical History"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: path
 *         name: allergyId
 *         required: true
 *         schema: { type: string, example: "PA_260318_abc12345" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               allergen_type: { type: string, enum: [DRUG, FOOD, ENVIRONMENT, OTHER], example: "DRUG" }
 *               allergen_name: { type: string, example: "Penicillin" }
 *               reaction: { type: string, example: "Phát ban toàn thân" }
 *               severity: { type: string, enum: [MILD, MODERATE, SEVERE], example: "MODERATE" }
 *               notes: { type: string, example: "Cập nhật phản ứng nhẹ hơn so với lần đầu" }
 *     responses:
 *       200: { description: Cập nhật thành công }
 *       404: { description: Không tìm thấy }
 */
medicalHistoryEhrRoutes.put(
    '/patients/:patientId/allergies/:allergyId',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'),
    MedicalHistoryEhrController.updateAllergy
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/allergies/{allergyId}:
 *   delete:
 *     summary: Xóa dị ứng
 *     description: |
 *       Soft delete bản ghi dị ứng.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR.
 *     tags: ["6.3 Medical History"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: path
 *         name: allergyId
 *         required: true
 *         schema: { type: string, example: "PA_260318_abc12345" }
 *     responses:
 *       200: { description: Xóa thành công }
 *       404: { description: Không tìm thấy }
 */
medicalHistoryEhrRoutes.delete(
    '/patients/:patientId/allergies/:allergyId',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR'),
    MedicalHistoryEhrController.deleteAllergy
);

// ══════════════════════════════════════════════════════════════════════
// NHÓM C: YẾU TỐ NGUY CƠ (Risk Factors)
// ══════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/ehr/patients/{patientId}/risk-factors:
 *   get:
 *     summary: Danh sách yếu tố nguy cơ
 *     description: |
 *       Lấy tất cả yếu tố nguy cơ của bệnh nhân.
 *       Sắp xếp: HIGH trước, mới nhất trước.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF.
 *     tags: ["6.3 Medical History"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *     responses:
 *       200: { description: Lấy danh sách thành công }
 *       404: { description: Bệnh nhân không tồn tại }
 */
medicalHistoryEhrRoutes.get(
    '/patients/:patientId/risk-factors',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF'),
    MedicalHistoryEhrController.getRiskFactors
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/risk-factors:
 *   post:
 *     summary: Thêm yếu tố nguy cơ
 *     description: |
 *       Ghi nhận yếu tố nguy cơ cho bệnh nhân.
 *       Loại: SMOKING, ALCOHOL, OCCUPATION, LIFESTYLE, GENETIC, OTHER.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *     tags: ["6.3 Medical History"]
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
 *             required: [factor_type, details]
 *             properties:
 *               factor_type: { type: string, enum: [SMOKING, ALCOHOL, OCCUPATION, LIFESTYLE, GENETIC, OTHER], example: "SMOKING" }
 *               severity: { type: string, enum: [LOW, MODERATE, HIGH], example: "HIGH" }
 *               details: { type: string, example: "Hút 1 gói/ngày, liên tục 20 năm" }
 *               start_date: { type: string, format: date, example: "2005-01-01" }
 *               end_date: { type: string, format: date, example: "" }
 *               is_active: { type: boolean, example: true }
 *     responses:
 *       201: { description: Thêm thành công }
 *       400: { description: Dữ liệu không hợp lệ }
 *       404: { description: Bệnh nhân không tồn tại }
 */
medicalHistoryEhrRoutes.post(
    '/patients/:patientId/risk-factors',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'),
    MedicalHistoryEhrController.createRiskFactor
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/risk-factors/{factorId}:
 *   put:
 *     summary: Cập nhật yếu tố nguy cơ
 *     description: |
 *       Cập nhật thông tin yếu tố nguy cơ. Chỉ truyền trường muốn sửa.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *     tags: ["6.3 Medical History"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: path
 *         name: factorId
 *         required: true
 *         schema: { type: string, example: "RF_260318_abc12345" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               severity: { type: string, enum: [LOW, MODERATE, HIGH], example: "MODERATE" }
 *               details: { type: string, example: "Đã giảm xuống 5 điếu/ngày" }
 *               end_date: { type: string, format: date, example: "2026-03-01" }
 *               is_active: { type: boolean, example: false }
 *     responses:
 *       200: { description: Cập nhật thành công }
 *       404: { description: Không tìm thấy }
 */
medicalHistoryEhrRoutes.put(
    '/patients/:patientId/risk-factors/:factorId',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'),
    MedicalHistoryEhrController.updateRiskFactor
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/risk-factors/{factorId}:
 *   delete:
 *     summary: Xóa yếu tố nguy cơ
 *     description: |
 *       Soft delete yếu tố nguy cơ.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR.
 *     tags: ["6.3 Medical History"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: path
 *         name: factorId
 *         required: true
 *         schema: { type: string, example: "RF_260318_abc12345" }
 *     responses:
 *       200: { description: Xóa thành công }
 *       404: { description: Không tìm thấy }
 */
medicalHistoryEhrRoutes.delete(
    '/patients/:patientId/risk-factors/:factorId',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR'),
    MedicalHistoryEhrController.deleteRiskFactor
);

// ══════════════════════════════════════════════════════════════════════
// NHÓM D: TÌNH TRẠNG ĐẶC BIỆT (Special Conditions)
// ══════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/ehr/patients/{patientId}/special-conditions:
 *   get:
 *     summary: Danh sách tình trạng đặc biệt
 *     description: |
 *       Lấy tất cả tình trạng đặc biệt: mang thai, khuyết tật, cấy ghép, bệnh truyền nhiễm...
 *       Sắp xếp: active trước, mới nhất trước.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF.
 *     tags: ["6.3 Medical History"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *     responses:
 *       200: { description: Lấy danh sách thành công }
 *       404: { description: Bệnh nhân không tồn tại }
 */
medicalHistoryEhrRoutes.get(
    '/patients/:patientId/special-conditions',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF'),
    MedicalHistoryEhrController.getSpecialConditions
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/special-conditions:
 *   post:
 *     summary: Thêm tình trạng đặc biệt
 *     description: |
 *       Ghi nhận tình trạng đặc biệt ảnh hưởng đến kê đơn / phẫu thuật / chăm sóc.
 *       Loại: PREGNANCY, DISABILITY, IMPLANT, TRANSPLANT, INFECTIOUS, MENTAL_HEALTH, OTHER.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *     tags: ["6.3 Medical History"]
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
 *             required: [condition_type, description]
 *             properties:
 *               condition_type: { type: string, enum: [PREGNANCY, DISABILITY, IMPLANT, TRANSPLANT, INFECTIOUS, MENTAL_HEALTH, OTHER], example: "PREGNANCY" }
 *               description: { type: string, example: "Thai kỳ 28 tuần, dự sinh 15/06/2026" }
 *               start_date: { type: string, format: date, example: "2025-09-15" }
 *               end_date: { type: string, format: date, example: "2026-06-15" }
 *               is_active: { type: boolean, example: true }
 *     responses:
 *       201: { description: Thêm thành công }
 *       400: { description: Dữ liệu không hợp lệ }
 *       404: { description: Bệnh nhân không tồn tại }
 */
medicalHistoryEhrRoutes.post(
    '/patients/:patientId/special-conditions',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'),
    MedicalHistoryEhrController.createSpecialCondition
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/special-conditions/{conditionId}:
 *   delete:
 *     summary: Xóa tình trạng đặc biệt
 *     description: |
 *       Soft delete tình trạng đặc biệt.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR.
 *     tags: ["6.3 Medical History"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: path
 *         name: conditionId
 *         required: true
 *         schema: { type: string, example: "PSC_260318_abc12345" }
 *     responses:
 *       200: { description: Xóa thành công }
 *       404: { description: Không tìm thấy }
 */
medicalHistoryEhrRoutes.delete(
    '/patients/:patientId/special-conditions/:conditionId',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR'),
    MedicalHistoryEhrController.deleteSpecialCondition
);
