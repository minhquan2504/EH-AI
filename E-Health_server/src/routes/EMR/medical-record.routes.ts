import { Router } from 'express';
import { MedicalRecordController } from '../../controllers/EMR/medical-record.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

export const medicalRecordRoutes = Router();

// =====================================================================
// HỖ TRỢ (đặt trước param routes)
// =====================================================================

/**
 * @swagger
 * /api/medical-records/search:
 *   get:
 *     summary: Tìm kiếm bệnh án nâng cao
 *     description: |
 *       Tìm kiếm bệnh án trên toàn hệ thống theo nhiều tiêu chí:
 *       tên/mã bệnh nhân, mã ICD-10, bác sĩ, loại hồ sơ, trạng thái finalize, khoảng thời gian.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF (ai có quyền `EMR_RECORD_VIEW`).
 *     tags:
 *       - "4.6 Medical Records"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *           example: "Trần"
 *         description: Tên/mã bệnh nhân hoặc mã encounter
 *       - in: query
 *         name: icd10_code
 *         schema:
 *           type: string
 *           example: "I10"
 *         description: Mã ICD-10 chẩn đoán
 *       - in: query
 *         name: doctor_id
 *         schema:
 *           type: string
 *           example: ""
 *         description: ID bác sĩ
 *       - in: query
 *         name: record_type
 *         schema:
 *           type: string
 *           enum: [OUTPATIENT, INPATIENT, EMERGENCY, TELEMED, FIRST_VISIT, FOLLOW_UP]
 *           example: ""
 *         description: Loại hồ sơ
 *       - in: query
 *         name: is_finalized
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *           example: ""
 *         description: Đã hoàn tất hay chưa
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
 *         description: Tìm kiếm thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
medicalRecordRoutes.get(
    '/search',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_RECORD_VIEW'),
    MedicalRecordController.searchRecords
);

// =====================================================================
// BỆNH ÁN THEO BỆNH NHÂN
// =====================================================================

/**
 * @swagger
 * /api/medical-records/by-patient/{patientId}:
 *   get:
 *     summary: Danh sách bệnh án theo bệnh nhân
 *     description: |
 *       Lấy tất cả bệnh án (encounters) của bệnh nhân, hỗ trợ lọc theo:
 *       loại hồ sơ, trạng thái finalize, khoảng thời gian. Có phân trang.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF (ai có quyền `EMR_RECORD_VIEW`).
 *     tags:
 *       - "4.6 Medical Records"
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
 *         name: record_type
 *         schema:
 *           type: string
 *           enum: [OUTPATIENT, INPATIENT, EMERGENCY, TELEMED, FIRST_VISIT, FOLLOW_UP]
 *           example: ""
 *         description: Lọc theo loại hồ sơ
 *       - in: query
 *         name: is_finalized
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *           example: ""
 *         description: Lọc theo trạng thái hoàn tất
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
 *     responses:
 *       200:
 *         description: Lấy danh sách bệnh án thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
medicalRecordRoutes.get(
    '/by-patient/:patientId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_RECORD_VIEW'),
    MedicalRecordController.getPatientRecords
);

/**
 * @swagger
 * /api/medical-records/by-patient/{patientId}/timeline:
 *   get:
 *     summary: Dòng thời gian y tế bệnh nhân
 *     description: |
 *       Lấy các sự kiện y tế theo trình tự thời gian: lượt khám, chẩn đoán,
 *       đơn thuốc, kết quả CLS, hoàn tất bệnh án, ký số.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE (ai có quyền `EMR_RECORD_VIEW`).
 *     tags:
 *       - "4.6 Medical Records"
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
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *           example: ""
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *           example: ""
 *       - in: query
 *         name: event_type
 *         schema:
 *           type: string
 *           enum: [ENCOUNTER, DIAGNOSIS, PRESCRIPTION, LAB_RESULT, EMR_FINALIZED, EMR_SIGNED]
 *           example: ""
 *         description: Lọc loại sự kiện
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 50
 *     responses:
 *       200:
 *         description: Lấy dòng thời gian thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
medicalRecordRoutes.get(
    '/by-patient/:patientId/timeline',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_RECORD_VIEW'),
    MedicalRecordController.getTimeline
);

/**
 * @swagger
 * /api/medical-records/by-patient/{patientId}/statistics:
 *   get:
 *     summary: Thống kê y tế xuyên encounter
 *     description: |
 *       Phân tích lịch sử y tế tổng quan của bệnh nhân:
 *       - Tổng số lần khám, số bệnh án đã finalize
 *       - Phân bổ theo loại (ngoại trú/nội trú/cấp cứu)
 *       - Phân bổ theo năm
 *       - Top chẩn đoán lặp lại nhiều nhất (ICD-10)
 *       - Top thuốc được kê nhiều nhất
 *       - Xu hướng sinh hiệu (HA, mạch, cân nặng)
 *       - Thông tin lần khám gần nhất
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE (ai có quyền `EMR_RECORD_VIEW`).
 *     tags:
 *       - "4.6 Medical Records"
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
 *     responses:
 *       200:
 *         description: Lấy thống kê thành công
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
 *                     total_encounters:
 *                       type: integer
 *                       example: 15
 *                     total_finalized:
 *                       type: integer
 *                       example: 12
 *                     encounters_by_type:
 *                       type: object
 *                       example: { "OUTPATIENT": 12, "EMERGENCY": 2, "INPATIENT": 1 }
 *                     top_diagnoses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           icd10_code:
 *                             type: string
 *                           diagnosis_name:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     top_drugs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           brand_name:
 *                             type: string
 *                           drug_code:
 *                             type: string
 *                           count:
 *                             type: integer
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
medicalRecordRoutes.get(
    '/by-patient/:patientId/statistics',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_RECORD_VIEW'),
    MedicalRecordController.getStatistics
);

// =====================================================================
// SNAPSHOT & EXPORT
// =====================================================================

/**
 * @swagger
 * /api/medical-records/snapshot/{encounterId}:
 *   get:
 *     summary: Xem snapshot bệnh án đã khóa
 *     description: |
 *       Trả về bản snapshot JSONB đầy đủ đã lưu khi finalize.
 *       Dữ liệu snapshot là bất biến (immutable), đảm bảo tính toàn vẹn.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF (ai có quyền `EMR_RECORD_VIEW`).
 *     tags:
 *       - "4.6 Medical Records"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260316_a60a783f"
 *         description: ID lượt khám
 *     responses:
 *       200:
 *         description: Lấy snapshot thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Chưa finalize — snapshot không tồn tại
 */
medicalRecordRoutes.get(
    '/snapshot/:encounterId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_RECORD_VIEW'),
    MedicalRecordController.getSnapshot
);

/**
 * @swagger
 * /api/medical-records/export/{encounterId}:
 *   get:
 *     summary: Xuất bệnh án JSON (để in/PDF)
 *     description: |
 *       Trả về bệnh án dạng cấu trúc JSON chuẩn hóa, sẵn sàng cho frontend render PDF.
 *       - Nếu đã finalize → trả snapshot (immutable)
 *       - Nếu chưa finalize → tổng hợp real-time
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE (ai có quyền `EMR_RECORD_EXPORT`).
 *     tags:
 *       - "4.6 Medical Records"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260316_a60a783f"
 *         description: ID lượt khám
 *     responses:
 *       200:
 *         description: Xuất bệnh án thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Encounter không tồn tại
 */
medicalRecordRoutes.get(
    '/export/:encounterId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_RECORD_EXPORT'),
    MedicalRecordController.exportRecord
);

// =====================================================================
// BỆNH ÁN THEO ENCOUNTER (PARAM ROUTES — ĐẶT SAU CÙNG)
// =====================================================================

/**
 * @swagger
 * /api/medical-records/{encounterId}:
 *   get:
 *     summary: Bệnh án đầy đủ theo encounter
 *     description: |
 *       Tổng hợp toàn bộ dữ liệu lượt khám thành 1 bệnh án hoàn chỉnh, bao gồm:
 *       - Thông tin encounter (BN, BS, phòng, trạng thái)
 *       - Sinh hiệu & khám lâm sàng
 *       - Chẩn đoán (PRIMARY, SECONDARY, FINAL...)
 *       - Chỉ định CLS + kết quả
 *       - Đơn thuốc + dòng thuốc chi tiết
 *       - Ký số bệnh án (nếu có)
 *       - Snapshot (nếu đã finalize)
 *       - Điểm completeness (% hoàn thành)
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF (ai có quyền `EMR_RECORD_VIEW`).
 *     tags:
 *       - "4.6 Medical Records"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260316_a60a783f"
 *         description: ID lượt khám
 *     responses:
 *       200:
 *         description: Lấy bệnh án đầy đủ thành công
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
 *                     encounter:
 *                       type: object
 *                     clinical_examination:
 *                       type: object
 *                       nullable: true
 *                     diagnoses:
 *                       type: array
 *                       items:
 *                         type: object
 *                     medical_orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                     prescription:
 *                       type: object
 *                       nullable: true
 *                     signature:
 *                       type: object
 *                       nullable: true
 *                     snapshot:
 *                       type: object
 *                       nullable: true
 *                     is_finalized:
 *                       type: boolean
 *                     completeness:
 *                       type: object
 *                       properties:
 *                         score:
 *                           type: integer
 *                           example: 85
 *                         details:
 *                           type: array
 *                           items:
 *                             type: object
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Encounter không tồn tại
 */
medicalRecordRoutes.get(
    '/:encounterId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_RECORD_VIEW'),
    MedicalRecordController.getFullRecord
);

/**
 * @swagger
 * /api/medical-records/{encounterId}/completeness:
 *   get:
 *     summary: Kiểm tra tính đầy đủ bệnh án
 *     description: |
 *       Trả về điểm hoàn thành (%) và danh sách chi tiết từng mục:
 *       - Sinh hiệu & khám LS (25%)
 *       - Chẩn đoán chính (25%)
 *       - Đơn thuốc (20%)
 *       - Kết quả CLS (15%)
 *       - Ghi chú BS (15%)
 *
 *       Điểm ≥ 50% mới được phép finalize bệnh án.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE (ai có quyền `EMR_RECORD_VIEW`).
 *     tags:
 *       - "4.6 Medical Records"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260316_a60a783f"
 *         description: ID lượt khám
 *     responses:
 *       200:
 *         description: Kiểm tra tính đầy đủ thành công
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
 *                     score:
 *                       type: integer
 *                       example: 75
 *                     total_items:
 *                       type: integer
 *                       example: 5
 *                     completed_items:
 *                       type: integer
 *                       example: 3
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           item:
 *                             type: string
 *                             example: "clinical_examination"
 *                           status:
 *                             type: string
 *                             enum: [COMPLETED, MISSING, PARTIAL, NOT_APPLICABLE]
 *                           weight:
 *                             type: integer
 *                             example: 25
 *                           note:
 *                             type: string
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Encounter không tồn tại
 */
medicalRecordRoutes.get(
    '/:encounterId/completeness',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_RECORD_VIEW'),
    MedicalRecordController.getCompleteness
);

/**
 * @swagger
 * /api/medical-records/{encounterId}/finalize:
 *   post:
 *     summary: Hoàn tất & khóa bệnh án
 *     description: |
 *       Khóa bệnh án: tạo snapshot JSONB bất biến, đánh dấu finalized, ghi timeline event.
 *       Sau khi finalize, các module 4.1–4.5 không cho phép sửa encounter này nữa.
 *
 *       **Điều kiện:**
 *       - Encounter phải ở trạng thái **COMPLETED**
 *       - Chưa finalize trước đó
 *       - Completeness score ≥ 50%
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR (ai có quyền `EMR_RECORD_FINALIZE`).
 *     tags:
 *       - "4.6 Medical Records"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260316_a60a783f"
 *         description: ID lượt khám
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 example: "Bệnh án hoàn tất, BN ổn định"
 *                 description: Ghi chú khi hoàn tất (optional)
 *     responses:
 *       200:
 *         description: Hoàn tất bệnh án thành công
 *       400:
 *         description: |
 *           - Encounter chưa ở trạng thái COMPLETED
 *           - Completeness score quá thấp (< 50%)
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Encounter không tồn tại
 *       409:
 *         description: Bệnh án đã được finalize trước đó
 */
medicalRecordRoutes.post(
    '/:encounterId/finalize',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_RECORD_FINALIZE'),
    MedicalRecordController.finalize
);

/**
 * @swagger
 * /api/medical-records/{encounterId}/sign:
 *   post:
 *     summary: Ký số bệnh án
 *     description: |
 *       Ký xác nhận bệnh án đã finalize. Tạo SHA-256 hash từ snapshot data,
 *       ghi vào emr_signatures. Mỗi encounter chỉ ký 1 lần.
 *
 *       **Lưu ý:** Đây là ký logic (hash + certificate serial).
 *       Tích hợp chữ ký số thật (USB Token, VNPT-CA) thuộc phase sau.
 *
 *       **Điều kiện:**
 *       - Bệnh án phải đã **finalize**
 *       - Chưa ký trước đó
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR (ai có quyền `EMR_RECORD_SIGN`).
 *     tags:
 *       - "4.6 Medical Records"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260316_a60a783f"
 *         description: ID lượt khám
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               certificate_serial:
 *                 type: string
 *                 example: "SN-2026-001234"
 *                 description: Số serial chứng chỉ ký số (optional)
 *     responses:
 *       200:
 *         description: Ký số bệnh án thành công
 *       400:
 *         description: Bệnh án chưa finalize
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Encounter/snapshot không tồn tại
 *       409:
 *         description: Bệnh án đã được ký trước đó
 */
medicalRecordRoutes.post(
    '/:encounterId/sign',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_RECORD_SIGN'),
    MedicalRecordController.sign
);
