import { Router } from 'express';
import { EncounterController } from '../../controllers/EMR/encounter.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

export const encounterRoutes = Router();

// 4.1 TIẾP NHẬN & MỞ HỒ SƠ KHÁM BỆNH (Encounter Management)

// ─── Static routes PHẢI đặt TRƯỚC dynamic routes ───

/**
 * @swagger
 * /api/encounters/active:
 *   get:
 *     summary: Danh sách lượt khám đang diễn ra
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_ENCOUNTER_VIEW.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về danh sách encounter đang ở trạng thái `IN_PROGRESS` hoặc `WAITING_FOR_RESULTS`.
 *       - Dùng cho dashboard theo dõi phòng khám đang hoạt động.
 *       - Bao gồm: thông tin bệnh nhân, bác sĩ, phòng khám, mã lịch khám.
 *       - Có thể lọc theo chi nhánh (branch_id).
 *     tags: [4.1 Encounter Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Lọc theo chi nhánh (optional)
 *         example: BR_HCM_001
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
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
 *                   example: Lấy danh sách lượt khám đang diễn ra thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       encounters_id:
 *                         type: string
 *                         example: ENC_abc1234def56
 *                       patient_name:
 *                         type: string
 *                         example: Nguyễn Văn A
 *                       doctor_name:
 *                         type: string
 *                         example: BS. Trần Văn B
 *                       room_name:
 *                         type: string
 *                         example: Phòng Nội 102
 *                       status:
 *                         type: string
 *                         example: IN_PROGRESS
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 */
encounterRoutes.get(
    '/active',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_ENCOUNTER_VIEW'),
    EncounterController.getActive
);

/**
 * @swagger
 * /api/encounters/by-patient/{patientId}:
 *   get:
 *     summary: Danh sách lượt khám của 1 bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_ENCOUNTER_VIEW.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về toàn bộ lượt khám của bệnh nhân, sắp xếp theo thời gian giảm dần.
 *       - Hỗ trợ phân trang (page, limit).
 *       - Bao gồm: thông tin bác sĩ, phòng, loại khám, trạng thái.
 *     tags: [4.1 Encounter Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bệnh nhân
 *         example: "550e8400-e29b-41d4-a716-446655440001"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         example: 20
 *     responses:
 *       200:
 *         description: Lấy danh sách lượt khám thành công
 *       404:
 *         description: Bệnh nhân không tồn tại
 *       401:
 *         description: Chưa đăng nhập
 */
encounterRoutes.get(
    '/by-patient/:patientId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_ENCOUNTER_VIEW'),
    EncounterController.getByPatient
);

/**
 * @swagger
 * /api/encounters/by-appointment/{appointmentId}:
 *   get:
 *     summary: Lấy hồ sơ khám từ lịch khám (appointment_id)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_ENCOUNTER_VIEW.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Tìm encounter dựa trên appointment_id (mối quan hệ 1:1).
 *       - Trả về thông tin đầy đủ encounter nếu tồn tại.
 *       - Trả về 404 nếu lịch khám chưa mở hồ sơ khám.
 *     tags: [4.1 Encounter Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch khám (appointments_id)
 *         example: APT_bcd7f423-337
 *     responses:
 *       200:
 *         description: Lấy hồ sơ khám thành công
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
 *                     encounters_id:
 *                       type: string
 *                       example: ENC_abc1234def56
 *                     appointment_code:
 *                       type: string
 *                       example: APP_20260315_001
 *                     patient_name:
 *                       type: string
 *                       example: Nguyễn Văn A
 *                     encounter_type:
 *                       type: string
 *                       example: FIRST_VISIT
 *                     status:
 *                       type: string
 *                       example: IN_PROGRESS
 *       404:
 *         description: Lượt khám không tồn tại hoặc chưa mở hồ sơ
 *       401:
 *         description: Chưa đăng nhập
 */
encounterRoutes.get(
    '/by-appointment/:appointmentId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_ENCOUNTER_VIEW'),
    EncounterController.getByAppointment
);

/**
 * @swagger
 * /api/encounters/from-appointment/{appointmentId}:
 *   post:
 *     summary: Mở hồ sơ khám từ lịch khám (luồng chính)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_ENCOUNTER_CREATE.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Tạo encounter mới từ lịch khám đã check-in (status = CHECKED_IN).
 *       - Hệ thống tự động:
 *         - Lấy patient_id, doctor_id, room_id từ appointment.
 *         - Xác định loại khám: `FIRST_VISIT` nếu BN chưa khám, `FOLLOW_UP` nếu đã khám trước.
 *         - Tính visit_number (lần khám thứ mấy).
 *         - Chuyển appointment → `IN_PROGRESS`.
 *         - Cập nhật phòng khám → `OCCUPIED`.
 *       - **Constraint:** 1 lịch khám chỉ mở được 1 hồ sơ khám. Gọi lần 2 sẽ lỗi 409.
 *       - Cho phép override doctor_id, room_id nếu cần đổi so với appointment.
 *     tags: [4.1 Encounter Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lịch khám (appointments_id)
 *         example: APT_bcd7f423-337
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               encounter_type:
 *                 type: string
 *                 enum: [FIRST_VISIT, FOLLOW_UP, OUTPATIENT, INPATIENT, EMERGENCY, TELEMED]
 *                 description: Loại khám (bỏ trống = tự động phát hiện)
 *                 example: FIRST_VISIT
 *               notes:
 *                 type: string
 *                 description: Ghi chú cho lượt khám
 *                 example: "Bệnh nhân đến khám lần đầu, có triệu chứng sốt cao 3 ngày"
 *               doctor_id:
 *                 type: string
 *                 description: Override bác sĩ (nếu khác appointment)
 *                 example: DOC_001
 *               room_id:
 *                 type: string
 *                 description: Override phòng khám (nếu khác appointment)
 *                 example: RM_HCM_N102
 *     responses:
 *       201:
 *         description: Mở hồ sơ khám thành công
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
 *                   example: Mở hồ sơ lượt khám từ lịch khám thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     encounters_id:
 *                       type: string
 *                       example: ENC_abc1234def56
 *                     appointment_code:
 *                       type: string
 *                       example: APP_20260315_001
 *                     patient_name:
 *                       type: string
 *                       example: Nguyễn Văn A
 *                     doctor_name:
 *                       type: string
 *                       example: BS. Trần Văn B
 *                     encounter_type:
 *                       type: string
 *                       example: FIRST_VISIT
 *                     visit_number:
 *                       type: number
 *                       example: 1
 *                     status:
 *                       type: string
 *                       example: IN_PROGRESS
 *       400:
 *         description: Lịch khám chưa check-in / thiếu bác sĩ / thiếu phòng
 *       404:
 *         description: Lịch khám không tồn tại
 *       409:
 *         description: Lịch khám đã có hồ sơ khám (1:1 constraint)
 *       401:
 *         description: Chưa đăng nhập
 */
encounterRoutes.post(
    '/from-appointment/:appointmentId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_ENCOUNTER_CREATE'),
    EncounterController.createFromAppointment
);

/**
 * @swagger
 * /api/encounters:
 *   get:
 *     summary: Danh sách tất cả lượt khám (có filter + phân trang)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_ENCOUNTER_VIEW.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về danh sách encounter có hỗ trợ filter đa dạng.
 *       - Bao gồm thông tin join: bệnh nhân, bác sĩ, chuyên khoa, phòng khám, mã lịch khám.
 *       - Sắp xếp theo thời gian bắt đầu giảm dần (mới nhất lên đầu).
 *     tags: [4.1 Encounter Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patient_id
 *         schema:
 *           type: string
 *         description: Lọc theo bệnh nhân
 *       - in: query
 *         name: doctor_id
 *         schema:
 *           type: string
 *         description: Lọc theo bác sĩ
 *       - in: query
 *         name: room_id
 *         schema:
 *           type: string
 *         description: Lọc theo phòng khám
 *       - in: query
 *         name: encounter_type
 *         schema:
 *           type: string
 *           enum: [FIRST_VISIT, FOLLOW_UP, OUTPATIENT, INPATIENT, EMERGENCY, TELEMED]
 *         description: Lọc theo loại khám
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [IN_PROGRESS, WAITING_FOR_RESULTS, COMPLETED, CLOSED]
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Từ ngày (YYYY-MM-DD)
 *         example: "2026-03-01"
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Đến ngày (YYYY-MM-DD)
 *         example: "2026-03-31"
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên BN, mã BN, tên BS
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         example: 20
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *       401:
 *         description: Chưa đăng nhập
 */
encounterRoutes.get(
    '/',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_ENCOUNTER_VIEW'),
    EncounterController.getAll
);

/**
 * @swagger
 * /api/encounters:
 *   post:
 *     summary: Tạo encounter walk-in / cấp cứu (không từ lịch khám)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_ENCOUNTER_CREATE.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Tạo encounter mới cho bệnh nhân vãng lai (walk-in) hoặc cấp cứu.
 *       - Không yêu cầu lịch khám (appointment_id = null).
 *       - Bắt buộc: patient_id, doctor_id, room_id.
 *       - Tự động xác định loại khám (FIRST_VISIT / FOLLOW_UP) nếu không chỉ định.
 *       - Cập nhật phòng khám → OCCUPIED.
 *     tags: [4.1 Encounter Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patient_id
 *               - doctor_id
 *               - room_id
 *             properties:
 *               patient_id:
 *                 type: string
 *                 description: ID bệnh nhân
 *                 example: "550e8400-e29b-41d4-a716-446655440001"
 *               doctor_id:
 *                 type: string
 *                 description: ID bác sĩ
 *                 example: DOC_001
 *               room_id:
 *                 type: string
 *                 description: ID phòng khám
 *                 example: RM_HCM_N102
 *               encounter_type:
 *                 type: string
 *                 enum: [FIRST_VISIT, FOLLOW_UP, OUTPATIENT, INPATIENT, EMERGENCY, TELEMED]
 *                 description: Loại khám (bỏ trống = tự động phát hiện)
 *                 example: EMERGENCY
 *               notes:
 *                 type: string
 *                 description: Ghi chú
 *                 example: "Cấp cứu — bệnh nhân đau ngực dữ dội"
 *     responses:
 *       201:
 *         description: Tạo lượt khám thành công
 *       400:
 *         description: Thiếu thông tin bắt buộc / phòng đang bảo trì
 *       404:
 *         description: Bệnh nhân / bác sĩ / phòng không tồn tại
 *       401:
 *         description: Chưa đăng nhập
 */
encounterRoutes.post(
    '/',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_ENCOUNTER_CREATE'),
    EncounterController.create
);

// ─── Dynamic routes (có :id) đặt SAU ───

/**
 * @swagger
 * /api/encounters/{id}:
 *   get:
 *     summary: Chi tiết lượt khám
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_ENCOUNTER_VIEW.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về thông tin đầy đủ encounter kèm join data.
 *       - Bao gồm: bệnh nhân (tên, mã), bác sĩ (tên, chức danh, chuyên khoa), phòng (tên, mã), lịch khám liên kết.
 *     tags: [4.1 Encounter Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID encounter (encounters_id)
 *         example: ENC_abc1234def56
 *     responses:
 *       200:
 *         description: Lấy chi tiết thành công
 *       404:
 *         description: Lượt khám không tồn tại
 *       401:
 *         description: Chưa đăng nhập
 */
encounterRoutes.get(
    '/:id',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_ENCOUNTER_VIEW'),
    EncounterController.getById
);

/**
 * @swagger
 * /api/encounters/{id}:
 *   patch:
 *     summary: Cập nhật hồ sơ khám (notes, loại khám)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_ENCOUNTER_EDIT.
 *       **Vai trò được phép:** ADMIN, DOCTOR.
 *
 *       **Mô tả chi tiết:**
 *       - Cập nhật encounter_type hoặc ghi chú.
 *       - Chỉ cho phép khi encounter ở trạng thái `IN_PROGRESS` hoặc `WAITING_FOR_RESULTS`.
 *       - Hồ sơ đã `COMPLETED` hoặc `CLOSED` không thể chỉnh sửa.
 *     tags: [4.1 Encounter Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID encounter
 *         example: ENC_abc1234def56
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               encounter_type:
 *                 type: string
 *                 enum: [FIRST_VISIT, FOLLOW_UP, OUTPATIENT, INPATIENT, EMERGENCY, TELEMED]
 *                 example: FOLLOW_UP
 *               notes:
 *                 type: string
 *                 example: "Bệnh nhân tái khám theo hẹn, huyết áp ổn định"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Hồ sơ khám không ở trạng thái cho phép chỉnh sửa
 *       404:
 *         description: Lượt khám không tồn tại
 *       401:
 *         description: Chưa đăng nhập
 */
encounterRoutes.patch(
    '/:id',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_ENCOUNTER_EDIT'),
    EncounterController.update
);

/**
 * @swagger
 * /api/encounters/{id}/assign-doctor:
 *   patch:
 *     summary: Đổi bác sĩ phụ trách giữa chừng
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_ENCOUNTER_EDIT.
 *       **Vai trò được phép:** ADMIN, DOCTOR.
 *
 *       **Mô tả chi tiết:**
 *       - Đổi bác sĩ phụ trách encounter đang diễn ra.
 *       - Trường hợp sử dụng: referral (chuyển chuyên khoa), bác sĩ vắng đột xuất.
 *       - Chỉ cho phép khi encounter ở IN_PROGRESS hoặc WAITING_FOR_RESULTS.
 *       - Validate: bác sĩ mới phải tồn tại và đang hoạt động (is_active = true).
 *     tags: [4.1 Encounter Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID encounter
 *         example: ENC_abc1234def56
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctor_id
 *             properties:
 *               doctor_id:
 *                 type: string
 *                 description: ID bác sĩ mới
 *                 example: DOC_002
 *     responses:
 *       200:
 *         description: Đổi bác sĩ thành công
 *       400:
 *         description: Encounter không ở trạng thái cho phép / bác sĩ không hoạt động
 *       404:
 *         description: Encounter hoặc bác sĩ không tồn tại
 *       401:
 *         description: Chưa đăng nhập
 */
encounterRoutes.patch(
    '/:id/assign-doctor',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_ENCOUNTER_EDIT'),
    EncounterController.assignDoctor
);

/**
 * @swagger
 * /api/encounters/{id}/assign-room:
 *   patch:
 *     summary: Đổi phòng khám giữa chừng
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_ENCOUNTER_EDIT.
 *       **Vai trò được phép:** ADMIN, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Đổi phòng khám cho encounter đang diễn ra.
 *       - Hệ thống tự động:
 *         - Giải phóng phòng cũ → AVAILABLE.
 *         - Cập nhật phòng mới → OCCUPIED.
 *       - Chỉ cho phép khi encounter ở IN_PROGRESS hoặc WAITING_FOR_RESULTS.
 *       - Validate: phòng mới phải tồn tại, không đang MAINTENANCE.
 *     tags: [4.1 Encounter Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID encounter
 *         example: ENC_abc1234def56
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - room_id
 *             properties:
 *               room_id:
 *                 type: string
 *                 description: ID phòng khám mới
 *                 example: RM_HCM_N201
 *     responses:
 *       200:
 *         description: Đổi phòng thành công
 *       400:
 *         description: Encounter không ở trạng thái cho phép / phòng đang bảo trì
 *       404:
 *         description: Encounter hoặc phòng không tồn tại
 *       401:
 *         description: Chưa đăng nhập
 */
encounterRoutes.patch(
    '/:id/assign-room',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_ENCOUNTER_EDIT'),
    EncounterController.assignRoom
);

/**
 * @swagger
 * /api/encounters/{id}/status:
 *   patch:
 *     summary: Chuyển trạng thái encounter
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền EMR_ENCOUNTER_EDIT.
 *       **Vai trò được phép:** ADMIN, DOCTOR.
 *
 *       **Mô tả chi tiết:**
 *       - Chuyển trạng thái encounter theo state machine:
 *         - `IN_PROGRESS` → `WAITING_FOR_RESULTS` (chờ kết quả CLS)
 *         - `IN_PROGRESS` → `COMPLETED` (hoàn tất khám)
 *         - `WAITING_FOR_RESULTS` → `IN_PROGRESS` (quay lại khám khi có kết quả)
 *         - `WAITING_FOR_RESULTS` → `COMPLETED`
 *         - `COMPLETED` → `CLOSED` (ký số, đóng hồ sơ)
 *       - Khi chuyển sang COMPLETED/CLOSED:
 *         - Ghi end_time = thời điểm hiện tại.
 *         - Giải phóng phòng khám → AVAILABLE.
 *         - Nếu có appointment liên kết → cập nhật appointment → COMPLETED.
 *     tags: [4.1 Encounter Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID encounter
 *         example: ENC_abc1234def56
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - new_status
 *             properties:
 *               new_status:
 *                 type: string
 *                 enum: [IN_PROGRESS, WAITING_FOR_RESULTS, COMPLETED, CLOSED]
 *                 description: Trạng thái mới
 *                 example: COMPLETED
 *     responses:
 *       200:
 *         description: Chuyển trạng thái thành công
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
 *                   example: Chuyển trạng thái lượt khám thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     encounters_id:
 *                       type: string
 *                       example: ENC_abc1234def56
 *                     status:
 *                       type: string
 *                       example: COMPLETED
 *                     end_time:
 *                       type: string
 *                       example: "2026-03-15T10:35:00.000Z"
 *       400:
 *         description: Không thể chuyển trạng thái theo luồng này
 *       404:
 *         description: Lượt khám không tồn tại
 *       401:
 *         description: Chưa đăng nhập
 */
encounterRoutes.patch(
    '/:id/status',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_ENCOUNTER_EDIT'),
    EncounterController.changeStatus
);
