// src/routes/Patient Management/medical-history.routes.ts
import { Router } from 'express';
import { MedicalHistoryController } from '../../controllers/Patient Management/medical-history.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const router = Router();

/**
 * @swagger
 * /api/medical-history:
 *   get:
 *     summary: Lấy danh sách lượt khám
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền ENCOUNTER_VIEW.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở, Bác sĩ, Y tá, Lễ tân.
 *
 *       **Mô tả chi tiết:**
 *       Trả về danh sách các lượt khám bệnh có phân trang.
 *       Hỗ trợ lọc theo bệnh nhân, bác sĩ, loại khám, trạng thái, khoảng thời gian.
 *       Mỗi lượt khám bao gồm thông tin bác sĩ, chuyên khoa, phòng, triệu chứng chính, và chẩn đoán chính.
 *     tags: [2.2 Lịch sử Khám & Điều trị]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patient_id
 *         schema:
 *           type: string
 *         description: ID bệnh nhân (patients_id)
 *         example: "PAT_001"
 *       - in: query
 *         name: doctor_id
 *         schema:
 *           type: string
 *         description: ID bác sĩ (doctors_id)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [OUTPATIENT, INPATIENT, EMERGENCY, TELEMED]
 *         description: Loại lượt khám
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [IN_PROGRESS, WAITING_FOR_RESULTS, COMPLETED, CLOSED]
 *         description: Trạng thái lượt khám
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu lọc
 *         example: "2026-01-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc lọc
 *         example: "2026-12-31"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/', verifyAccessToken, checkSessionStatus, authorizePermissions('EMR_ENCOUNTER_VIEW'), MedicalHistoryController.getEncounters);

/**
 * @swagger
 * /api/medical-history/patient/{patientId}/latest:
 *   get:
 *     summary: Tra cứu lần khám gần nhất của bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_ENCOUNTER_VIEW.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở, Bác sĩ, Y tá, Lễ tân.
 *
 *       Trả về thông tin lượt khám gần nhất theo thời gian, bao gồm tên bác sĩ, chuyên khoa, phòng, triệu chứng, chẩn đoán chính.
 *     tags: [2.2 Lịch sử Khám & Điều trị]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bệnh nhân (patients_id)
 *         example: "PAT_001"
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy bệnh nhân hoặc chưa có lượt khám
 */
router.get('/patient/:patientId/latest', verifyAccessToken, checkSessionStatus, authorizePermissions('EMR_ENCOUNTER_VIEW'), MedicalHistoryController.getLatestEncounter);

/**
 * @swagger
 * /api/medical-history/patient/{patientId}/timeline:
 *   get:
 *     summary: Xem dòng thời gian sức khỏe của bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_ENCOUNTER_VIEW.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở, Bác sĩ, Y tá.
 *
 *       Trả về danh sách sự kiện sức khỏe theo dòng thời gian (mới nhất trước).
 *       Bao gồm: khám bệnh, kết quả XN, đơn thuốc, tiêm chủng, phẫu thuật.
 *       Hỗ trợ lọc theo khoảng thời gian (`from`, `to`).
 *     tags: [2.2 Lịch sử Khám & Điều trị]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bệnh nhân (patients_id)
 *         example: "PAT_001"
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu
 *         example: "2025-01-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc
 *         example: "2026-12-31"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Số lượng sự kiện tối đa
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy bệnh nhân
 */
router.get('/patient/:patientId/timeline', verifyAccessToken, checkSessionStatus, authorizePermissions('EMR_ENCOUNTER_VIEW'), MedicalHistoryController.getTimeline);

/**
 * @swagger
 * /api/medical-history/patient/{patientId}/summary:
 *   get:
 *     summary: Tổng hợp lịch sử khám bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_ENCOUNTER_VIEW.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở, Bác sĩ, Y tá, Lễ tân.
 *
 *       Trả về thông tin tổng hợp:
 *       - Tổng số lần khám
 *       - Ngày khám gần nhất
 *       - Loại khám gần nhất
 *       - Bác sĩ khám gần nhất
 *       - Chẩn đoán chính gần nhất
 *       - Mã đơn thuốc gần nhất
 *     tags: [2.2 Lịch sử Khám & Điều trị]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bệnh nhân (patients_id)
 *         example: "PAT_001"
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy bệnh nhân
 */
router.get('/patient/:patientId/summary', verifyAccessToken, checkSessionStatus, authorizePermissions('EMR_ENCOUNTER_VIEW'), MedicalHistoryController.getPatientSummary);

/**
 * @swagger
 * /api/medical-history/{encounterId}:
 *   get:
 *     summary: Xem chi tiết đầy đủ lượt khám
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_ENCOUNTER_VIEW.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở, Bác sĩ, Y tá, Lễ tân.
 *
 *       **Mô tả chi tiết:**
 *       Trả về toàn bộ thông tin lượt khám, bao gồm:
 *       - Thông tin bác sĩ (tên, học vị, chuyên khoa)
 *       - Phòng khám (tên, mã phòng)
 *       - Sinh hiệu (huyết áp, nhịp tim, nhiệt độ, SpO2, cân nặng, chiều cao, BMI)
 *       - Khám lâm sàng (lý do khám, bệnh sử, khám thực thể)
 *       - Danh sách chẩn đoán ICD-10 (sắp xếp: PRIMARY → FINAL → SECONDARY → PRELIMINARY)
 *       - Đơn thuốc (mã đơn, danh sách thuốc, liều lượng, tần suất, hướng dẫn sử dụng)
 *       - Chỉ định cận lâm sàng (xét nghiệm, CĐHA, kết quả)
 *     tags: [2.2 Lịch sử Khám & Điều trị]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lượt khám (encounters_id)
 *         example: "ENC_260310_abc12345"
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy lượt khám
 */
router.get('/:encounterId', verifyAccessToken, checkSessionStatus, authorizePermissions('EMR_ENCOUNTER_VIEW'), MedicalHistoryController.getEncounterDetail);

export const medicalHistoryRoutes = router;
