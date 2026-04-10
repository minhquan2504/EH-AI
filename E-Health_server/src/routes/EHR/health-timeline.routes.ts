import { Router } from 'express';
import { HealthTimelineController } from '../../controllers/EHR/health-timeline.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';

export const healthTimelineRoutes = Router();

/**
 * @swagger
 * /api/ehr/patients/{patientId}/timeline:
 *   get:
 *     summary: Dòng thời gian sức khỏe hợp nhất
 *     description: |
 *       Trả về **dòng thời gian hợp nhất** tổng hợp sự kiện y tế từ 11 bảng EMR + events thủ công.
 *       Mỗi event bao gồm: event_type, thời điểm, tiêu đề, mô tả, encounter liên kết, metadata.
 *
 *       **15 loại sự kiện:**
 *       - AUTO (11): ENCOUNTER_START, ENCOUNTER_END, VITALS_RECORDED, DIAGNOSIS, LAB_ORDER, LAB_RESULT, PRESCRIPTION, EMR_FINALIZED, EMR_SIGNED, TREATMENT_PLAN, TREATMENT_NOTE
 *       - MANUAL (4): MANUAL_NOTE, EXTERNAL_VISIT, EXTERNAL_LAB, EXTERNAL_PROCEDURE
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF.
 *     tags:
 *       - "6.2 Health Timeline"
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
 *           example: 30
 *       - in: query
 *         name: event_type
 *         schema:
 *           type: string
 *           example: ""
 *         description: "Lọc theo loại sự kiện (DIAGNOSIS, PRESCRIPTION, LAB_ORDER...)"
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
 *         description: Lấy dòng thời gian thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           event_id: { type: string }
 *                           event_type: { type: string, example: "DIAGNOSIS" }
 *                           event_time: { type: string }
 *                           title: { type: string }
 *                           source: { type: string, enum: [AUTO, MANUAL] }
 *                           encounter_id: { type: string, nullable: true }
 *                           metadata: { type: object, nullable: true }
 *                     total: { type: integer }
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total_pages: { type: integer }
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
healthTimelineRoutes.get(
    '/patients/:patientId/timeline',
    verifyAccessToken,
    checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF'),
    HealthTimelineController.getTimeline
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/timeline/summary:
 *   get:
 *     summary: Thống kê tổng quan timeline
 *     description: |
 *       Trả về tóm tắt nhanh dòng thời gian:
 *       - Tổng số events
 *       - Tổng encounters
 *       - Ngày event đầu tiên / cuối cùng
 *       - Số tháng theo dõi
 *       - Phân bổ theo loại event (đếm mỗi loại)
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF.
 *     tags:
 *       - "6.2 Health Timeline"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           example: "PAT_001"
 *     responses:
 *       200:
 *         description: Lấy thống kê timeline thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_events: { type: integer, example: 47 }
 *                     total_encounters: { type: integer, example: 12 }
 *                     first_event_date: { type: string, nullable: true }
 *                     last_event_date: { type: string, nullable: true }
 *                     monitoring_months: { type: integer, example: 18 }
 *                     events_by_type:
 *                       type: object
 *                       example: { "ENCOUNTER_START": 12, "DIAGNOSIS": 8, "PRESCRIPTION": 10 }
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
healthTimelineRoutes.get(
    '/patients/:patientId/timeline/summary',
    verifyAccessToken,
    checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF'),
    HealthTimelineController.getTimelineSummary
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/timeline/by-encounter/{encounterId}:
 *   get:
 *     summary: Events theo encounter
 *     description: |
 *       Lấy tất cả events thuộc 1 encounter cụ thể trên timeline EHR.
 *       Bao gồm: sinh hiệu, chẩn đoán, chỉ định, đơn thuốc, ký số...
 *       Sắp xếp theo thời gian tăng dần (flow khám từ đầu đến cuối).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *     tags:
 *       - "6.2 Health Timeline"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           example: "PAT_001"
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260318_00000001"
 *         description: ID encounter cần xem
 *     responses:
 *       200:
 *         description: Lấy events theo encounter thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Bệnh nhân hoặc encounter không tồn tại
 */
healthTimelineRoutes.get(
    '/patients/:patientId/timeline/by-encounter/:encounterId',
    verifyAccessToken,
    checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'),
    HealthTimelineController.getByEncounter
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/timeline/track-condition:
 *   get:
 *     summary: Theo dõi tiến triển bệnh theo ICD-10
 *     description: |
 *       Lọc timeline theo **1 mã ICD-10** xuyên suốt toàn bộ lịch sử khám.
 *       Hiển thị:
 *       - Tất cả lần chẩn đoán mã ICD-10 này
 *       - Đơn thuốc cùng encounter có chẩn đoán
 *       - Chỉ định CLS cùng encounter
 *       - Ghi nhận diễn tiến điều trị (treatment_progress_notes) có cùng mã
 *
 *       **Dùng cho:** Theo dõi dài hạn bệnh mãn tính (tiểu đường, tăng HA...).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *     tags:
 *       - "6.2 Health Timeline"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           example: "PAT_001"
 *       - in: query
 *         name: icd10_code
 *         required: true
 *         schema:
 *           type: string
 *           example: "E11"
 *         description: "Mã ICD-10 cần theo dõi (VD: E11 = Đái tháo đường type 2)"
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
 *         description: Theo dõi tiến triển bệnh thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     icd10_code: { type: string, example: "E11" }
 *                     condition_name: { type: string, example: "Đái tháo đường type 2" }
 *                     total_diagnoses: { type: integer, example: 5 }
 *                     first_diagnosed: { type: string }
 *                     last_diagnosed: { type: string }
 *                     related_events:
 *                       type: array
 *                       items: { type: object }
 *       400:
 *         description: Thiếu mã ICD-10
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
healthTimelineRoutes.get(
    '/patients/:patientId/timeline/track-condition',
    verifyAccessToken,
    checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'),
    HealthTimelineController.trackCondition
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/timeline/events:
 *   post:
 *     summary: Thêm event thủ công
 *     description: |
 *       Bác sĩ thêm sự kiện y tế xảy ra **ngoài hệ thống** vào timeline.
 *       VD: nhập viện BV khác, xét nghiệm ngoài, thủ thuật tại cơ sở khác.
 *
 *       **Loại event cho phép:** MANUAL_NOTE, EXTERNAL_VISIT, EXTERNAL_LAB, EXTERNAL_PROCEDURE
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR.
 *     tags:
 *       - "6.2 Health Timeline"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           example: "PAT_001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [event_type, event_time, title]
 *             properties:
 *               event_type:
 *                 type: string
 *                 enum: [MANUAL_NOTE, EXTERNAL_VISIT, EXTERNAL_LAB, EXTERNAL_PROCEDURE]
 *                 example: "EXTERNAL_LAB"
 *               event_time:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-03-01T10:00:00+07:00"
 *                 description: Thời điểm sự kiện xảy ra
 *               title:
 *                 type: string
 *                 example: "Xét nghiệm HbA1c tại BV Chợ Rẫy"
 *               description:
 *                 type: string
 *                 example: "Kết quả HbA1c = 7.2%. Kiểm soát đường huyết chưa đạt mục tiêu."
 *               metadata:
 *                 type: object
 *                 example: { "lab_name": "BV Chợ Rẫy", "result_value": "7.2%", "reference_range": "<6.5%" }
 *     responses:
 *       201:
 *         description: Thêm event thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
healthTimelineRoutes.post(
    '/patients/:patientId/timeline/events',
    verifyAccessToken,
    checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR'),
    HealthTimelineController.createManualEvent
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/timeline/events/{eventId}:
 *   delete:
 *     summary: Xóa event thủ công
 *     description: |
 *       Soft delete sự kiện thủ công trên timeline.
 *       **Sự kiện tự động** (source=AUTO) từ EMR **không thể xóa** —
 *       chúng phản ánh dữ liệu thực tế trong hệ thống.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR.
 *     tags:
 *       - "6.2 Health Timeline"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           example: "PAT_001"
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           example: "EHTE_260318_abc12345"
 *     responses:
 *       200:
 *         description: Xóa event thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Event không thuộc bệnh nhân này
 *       404:
 *         description: Event không tồn tại
 */
healthTimelineRoutes.delete(
    '/patients/:patientId/timeline/events/:eventId',
    verifyAccessToken,
    checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR'),
    HealthTimelineController.deleteManualEvent
);
