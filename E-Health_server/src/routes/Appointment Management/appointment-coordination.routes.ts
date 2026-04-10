// src/routes/Appointment Management/appointment-coordination.routes.ts
import { Router } from 'express';
import { AppointmentCoordinationController } from '../../controllers/Appointment Management/appointment-coordination.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const appointmentCoordinationRoutes = Router();

// =====================================================================
// 3.9  ĐIỀU PHỐI & TỐI ƯU LỊCH KHÁM
// =====================================================================

/**
 * @swagger
 * /api/appointment-coordination/doctor-load:
 *   get:
 *     summary: Phân tích tải bác sĩ theo ngày
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_COORDINATION.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Liệt kê tất cả BS đang làm việc trong ngày, kèm: số slot, số BN đã đặt, % tải.
 *       - Trạng thái tải: LIGHT (<1%), NORMAL (1-49%), HEAVY (50-79%), OVERLOADED (≥80%).
 *       - Sắp xếp theo tải tăng dần (BS ít tải → nhiều tải).
 *       - Có thể lọc theo chi nhánh hoặc chuyên khoa.
 *     tags: [3.9 Điều phối & tối ưu lịch khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày cần phân tích (YYYY-MM-DD)
 *         example: "2026-03-20"
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Lọc theo chi nhánh (optional)
 *         example: BR_HCM_001
 *       - in: query
 *         name: specialty_id
 *         schema:
 *           type: string
 *         description: Lọc theo chuyên khoa (optional)
 *     responses:
 *       200:
 *         description: Lấy thông tin tải BS thành công
 *       400:
 *         description: Thiếu ngày
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 */
appointmentCoordinationRoutes.get(
    '/doctor-load',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_COORDINATION'),
    AppointmentCoordinationController.getDoctorLoad
);

/**
 * @swagger
 * /api/appointment-coordination/suggest-slots:
 *   get:
 *     summary: Gợi ý khung giờ tối ưu cho bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_COORDINATION.
 *       **Vai trò được phép:** ADMIN, STAFF, PATIENT, CUSTOMER.
 *
 *       **Mô tả chi tiết:**
 *       - Tính điểm cho mỗi slot trống dựa trên: slot trống (+10), ít người (+5), BS ít tải (+3).
 *       - Nếu priority=URGENT: ưu tiên slot sớm. Nếu EMERGENCY: slot đầu tiên +20 điểm.
 *       - Trả top 10 slot kèm BS gợi ý (BS ít tải nhất trong ca).
 *       - Có thể lọc theo BS cụ thể hoặc chuyên khoa.
 *     tags: [3.9 Điều phối & tối ưu lịch khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-03-20"
 *       - in: query
 *         name: doctor_id
 *         schema:
 *           type: string
 *         description: Lọc theo BS cụ thể (optional)
 *       - in: query
 *         name: specialty_id
 *         schema:
 *           type: string
 *         description: Lọc theo chuyên khoa (optional)
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [NORMAL, URGENT, EMERGENCY]
 *         description: Mức ưu tiên để tính điểm phù hợp (optional)
 *         example: NORMAL
 *     responses:
 *       200:
 *         description: Gợi ý slot thành công
 *       400:
 *         description: Thiếu ngày
 *       401:
 *         description: Chưa đăng nhập
 */
appointmentCoordinationRoutes.get(
    '/suggest-slots',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_COORDINATION'),
    AppointmentCoordinationController.suggestSlots
);

/**
 * @swagger
 * /api/appointment-coordination/balance-overview:
 *   get:
 *     summary: Dashboard cân bằng tải BS theo ngày
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_COORDINATION.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Tổng hợp tải tất cả BS: trung bình, min, max, độ lệch chuẩn.
 *       - Phát hiện BS quá tải (>avg+1SD, ≥70%) và BS ít tải (<avg-1SD, <30%).
 *       - Điểm cân bằng (0-100): 100 = hoàn toàn cân.
 *       - Gợi ý hành động khi mất cân bằng.
 *     tags: [3.9 Điều phối & tối ưu lịch khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-03-20"
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         example: BR_HCM_001
 *     responses:
 *       200:
 *         description: Lấy dashboard cân bằng thành công
 *       400:
 *         description: Thiếu ngày
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 */
appointmentCoordinationRoutes.get(
    '/balance-overview',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_COORDINATION'),
    AppointmentCoordinationController.getBalanceOverview
);

/**
 * @swagger
 * /api/appointment-coordination/auto-assign:
 *   post:
 *     summary: Tự động phân bổ BS cho lịch khám chưa gán
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_COORDINATION.
 *       **Vai trò được phép:** ADMIN.
 *
 *       **Mô tả chi tiết:**
 *       - Tìm tất cả lịch khám trong ngày chưa được gán BS (doctor_id IS NULL).
 *       - Ưu tiên lịch EMERGENCY → URGENT → NORMAL.
 *       - Phân bổ round-robin theo BS ít tải nhất (least-load balancing).
 *       - Kiểm tra conflict trước khi gán.
 *       - Ghi log AUTO_ASSIGN cho mỗi assignment.
 *     tags: [3.9 Điều phối & tối ưu lịch khám]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Ngày cần phân bổ
 *                 example: "2026-03-20"
 *               specialty_id:
 *                 type: string
 *                 description: Chỉ phân bổ cho chuyên khoa cụ thể (optional)
 *               branch_id:
 *                 type: string
 *                 description: Chỉ phân bổ tại chi nhánh cụ thể (optional)
 *     responses:
 *       200:
 *         description: Auto-assign hoàn tất
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     assigned_count:
 *                       type: number
 *                       example: 8
 *                     failed_count:
 *                       type: number
 *                       example: 2
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Thiếu ngày
 *       404:
 *         description: Không có lịch nào chưa gán BS
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 */
appointmentCoordinationRoutes.post(
    '/auto-assign',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_COORDINATION'),
    AppointmentCoordinationController.autoAssign
);

/**
 * @swagger
 * /api/appointment-coordination/ai-dataset:
 *   get:
 *     summary: Xuất dữ liệu lịch sử cho AI/ML optimization
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_COORDINATION.
 *       **Vai trò được phép:** ADMIN.
 *
 *       **Mô tả chi tiết:**
 *       - Truy vấn appointments kèm: slot time, doctor specialty, wait time, no-show rate.
 *       - Aggregate: phân bố theo giờ, số cancel/no-show/completed mỗi giờ.
 *       - Dùng cho ML pipeline phân tích pattern đặt lịch.
 *     tags: [3.9 Điều phối & tối ưu lịch khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-01-01"
 *       - in: query
 *         name: to_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-03-31"
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xuất dữ liệu thành công
 *       400:
 *         description: Thiếu hoặc sai khoảng thời gian
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 */
appointmentCoordinationRoutes.get(
    '/ai-dataset',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_COORDINATION'),
    AppointmentCoordinationController.getAIDataset
);

/**
 * @swagger
 * /api/appointment-coordination/{appointmentId}/priority:
 *   patch:
 *     summary: Đặt mức ưu tiên cho lịch khám
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_COORDINATION.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR.
 *
 *       **Mô tả chi tiết:**
 *       - Cập nhật mức ưu tiên: NORMAL (mặc định), URGENT (khẩn), EMERGENCY (cấp cứu).
 *       - Ghi log vào appointment_coordination_logs.
 *       - Ảnh hưởng đến thứ tự gợi ý slot và auto-assign.
 *     tags: [3.9 Điều phối & tối ưu lịch khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *         example: APT_bcd7f423-337
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - priority
 *             properties:
 *               priority:
 *                 type: string
 *                 enum: [NORMAL, URGENT, EMERGENCY]
 *                 example: URGENT
 *               reason:
 *                 type: string
 *                 description: Lý do thay đổi ưu tiên (optional)
 *                 example: "Bệnh nhân có triệu chứng nặng"
 *     responses:
 *       200:
 *         description: Cập nhật ưu tiên thành công
 *       400:
 *         description: Mức ưu tiên không hợp lệ
 *       404:
 *         description: Lịch khám không tồn tại
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 */
appointmentCoordinationRoutes.patch(
    '/:appointmentId/priority',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_COORDINATION'),
    AppointmentCoordinationController.setPriority
);

/**
 * @swagger
 * /api/appointment-coordination/{appointmentId}/reassign-doctor:
 *   patch:
 *     summary: Điều phối thủ công - chuyển BN sang BS khác
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_COORDINATION.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Chỉ cho phép với lịch khám ở trạng thái PENDING hoặc CONFIRMED.
 *       - Validate: BS mới tồn tại, có lịch làm việc vào ngày/ca đó, không bị trùng slot.
 *       - Ghi log REASSIGN_DOCTOR vào appointment_coordination_logs.
 *       - Gửi notification cho bệnh nhân về thay đổi BS.
 *     tags: [3.9 Điều phối & tối ưu lịch khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *         example: APT_bcd7f423-337
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - new_doctor_id
 *             properties:
 *               new_doctor_id:
 *                 type: string
 *                 description: ID bác sĩ mới
 *                 example: "DOC_abc123"
 *               reason:
 *                 type: string
 *                 description: Lý do chuyển BS
 *                 example: "BS cũ bận, chuyển sang BS ít tải hơn"
 *     responses:
 *       200:
 *         description: Chuyển BS thành công
 *       400:
 *         description: Trạng thái không cho phép hoặc BS trùng/conflict
 *       404:
 *         description: Lịch khám hoặc BS không tồn tại
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 */
appointmentCoordinationRoutes.patch(
    '/:appointmentId/reassign-doctor',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('APPOINTMENT_COORDINATION'),
    AppointmentCoordinationController.reassignDoctor
);

export default appointmentCoordinationRoutes;
