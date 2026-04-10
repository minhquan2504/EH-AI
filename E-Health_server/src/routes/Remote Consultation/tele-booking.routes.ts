import { Router } from 'express';
import { TeleBookingController } from '../../controllers/Remote Consultation/tele-booking.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';

const router = Router();

// ═══════════════════════════════════════════════════
// NHÓM 1: TÌM BS & SLOT KHẢ DỤNG
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/booking/doctors:
 *   get:
 *     summary: Danh sách bác sĩ khả dụng cho đặt lịch từ xa
 *     description: |
 *       Tìm bác sĩ theo chuyên khoa + cơ sở + ngày. Tự động lọc BS đang nghỉ phép, vắng mặt. Sắp xếp theo tải ít nhất.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT, STAFF
 *     tags: [8.2.1 Tìm BS & Slot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: specialty_id
 *         required: true
 *         schema: { type: string, example: 'SP_001' }
 *         description: ID chuyên khoa
 *       - in: query
 *         name: facility_id
 *         required: true
 *         schema: { type: string, example: 'FAC_001' }
 *         description: ID cơ sở y tế
 *       - in: query
 *         name: date
 *         required: true
 *         schema: { type: string, format: date, example: '2026-04-01' }
 *         description: Ngày khám
 *       - in: query
 *         name: type_id
 *         schema: { type: string, example: 'TCT_VIDEO' }
 *         description: ID loại hình (optional)
 *       - in: query
 *         name: shift_id
 *         schema: { type: string, example: 'SH_001' }
 *         description: ID ca khám (optional)
 *     responses:
 *       200:
 *         description: Trả về danh sách bác sĩ khả dụng
 *       400:
 *         description: Thiếu thông tin bắt buộc
 *       401:
 *         description: Token không hợp lệ
 */
router.get('/booking/doctors', verifyAccessToken, TeleBookingController.getAvailableDoctors);

/**
 * @swagger
 * /api/teleconsultation/booking/slots:
 *   get:
 *     summary: Danh sách khung giờ trống
 *     description: |
 *       Lấy các slot còn chỗ theo ngày. Có thể lọc theo BS và ca khám.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT, STAFF
 *     tags: [8.2.1 Tìm BS & Slot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema: { type: string, format: date, example: '2026-04-01' }
 *       - in: query
 *         name: doctor_id
 *         schema: { type: string, example: 'DOC_001' }
 *       - in: query
 *         name: shift_id
 *         schema: { type: string, example: 'SH_001' }
 *     responses:
 *       200:
 *         description: Danh sách slot
 *       400:
 *         description: Thiếu ngày khám
 */
router.get('/booking/slots', verifyAccessToken, TeleBookingController.getAvailableSlots);

/**
 * @swagger
 * /api/teleconsultation/booking/check-doctor:
 *   get:
 *     summary: Kiểm tra chi tiết availability của 1 bác sĩ
 *     description: |
 *       Trả về lịch làm việc, nghỉ phép, vắng mặt, tải hiện tại của BS vào ngày cụ thể.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT, STAFF
 *     tags: [8.2.1 Tìm BS & Slot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: doctor_id
 *         required: true
 *         schema: { type: string, example: 'DOC_001' }
 *       - in: query
 *         name: date
 *         required: true
 *         schema: { type: string, format: date, example: '2026-04-01' }
 *     responses:
 *       200:
 *         description: Chi tiết availability
 *       404:
 *         description: BS không tồn tại
 */
router.get('/booking/check-doctor', verifyAccessToken, TeleBookingController.checkDoctorAvailability);

/**
 * @swagger
 * /api/teleconsultation/booking/my-bookings:
 *   get:
 *     summary: Lịch sử đặt lịch từ xa của bệnh nhân đang đăng nhập
 *     description: |
 *       Tự động xác định patient_id từ access token → trả danh sách phiên đặt lịch.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** PATIENT
 *     tags: [8.2.4 Quản lý & Tra cứu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFT, PENDING_PAYMENT, PAYMENT_COMPLETED, CONFIRMED, CANCELLED, EXPIRED], example: 'CONFIRMED' }
 *       - in: query
 *         name: from_date
 *         schema: { type: string, format: date, example: '2026-01-01' }
 *       - in: query
 *         name: to_date
 *         schema: { type: string, format: date, example: '2026-12-31' }
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 20, default: 20 }
 *     responses:
 *       200:
 *         description: Danh sách phiên của BN
 *       404:
 *         description: Không tìm thấy hồ sơ bệnh nhân
 */
router.get('/booking/my-bookings', verifyAccessToken, TeleBookingController.getMyBookings);

// ═══════════════════════════════════════════════════
// NHÓM 2: ĐẶT LỊCH
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/booking:
 *   post:
 *     summary: Tạo phiên đặt lịch khám từ xa
 *     description: |
 *       Tạo phiên (DRAFT / PENDING_PAYMENT). Tự động lấy cấu hình giá, thời lượng, platform từ Module 8.1.
 *       Nếu base_price > 0 → trạng thái PENDING_PAYMENT + set expires_at (30 phút).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, PATIENT
 *     tags: [8.2.2 Đặt lịch]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient_id, specialty_id, facility_id, type_id, booking_date]
 *             properties:
 *               patient_id: { type: string, example: '1' }
 *               specialty_id: { type: string, example: 'SP_001' }
 *               facility_id: { type: string, example: 'FAC_001' }
 *               type_id: { type: string, example: 'TCT_VIDEO' }
 *               booking_date: { type: string, format: date, example: '2026-04-01' }
 *               doctor_id: { type: string, example: 'DOC_001' }
 *               slot_id: { type: string, example: 'SLOT_001' }
 *               shift_id: { type: string, example: 'SH_001' }
 *               booking_start_time: { type: string, example: '09:00' }
 *               booking_end_time: { type: string, example: '09:30' }
 *               platform: { type: string, example: 'AGORA' }
 *               price_type: { type: string, enum: [BASE, INSURANCE, VIP], example: 'BASE' }
 *               reason_for_visit: { type: string, example: 'Tái khám tim mạch' }
 *               symptoms_notes: { type: string, example: 'Đau ngực khi gắng sức' }
 *               patient_notes: { type: string, example: 'Cần tư vấn kết quả ECG' }
 *     responses:
 *       201:
 *         description: Tạo phiên thành công
 *       400:
 *         description: Thiếu thông tin hoặc dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy cấu hình / BN / BS / CK
 *       409:
 *         description: BN đã có phiên trùng slot
 */
router.post('/booking', verifyAccessToken, TeleBookingController.createBooking);

/**
 * @swagger
 * /api/teleconsultation/booking/{sessionId}:
 *   put:
 *     summary: Cập nhật phiên đặt lịch
 *     description: |
 *       Chỉ cập nhật được phiên ở trạng thái DRAFT hoặc PENDING_PAYMENT.
 *       Có thể đổi BS, ngày, slot, ghi chú, loại giá.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, PATIENT
 *     tags: [8.2.2 Đặt lịch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string, example: 'TBS_abc123def456' }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               doctor_id: { type: string, example: 'DOC_002' }
 *               booking_date: { type: string, format: date, example: '2026-04-02' }
 *               slot_id: { type: string, example: 'SLOT_002' }
 *               shift_id: { type: string, example: 'SH_002' }
 *               reason_for_visit: { type: string, example: 'Đổi lý do khám' }
 *               price_type: { type: string, enum: [BASE, INSURANCE, VIP], example: 'INSURANCE' }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Không thể cập nhật
 *       404:
 *         description: Không tìm thấy phiên
 */
router.put('/booking/:sessionId', verifyAccessToken, TeleBookingController.updateBooking);

/**
 * @swagger
 * /api/teleconsultation/booking/{sessionId}/confirm:
 *   post:
 *     summary: Xác nhận phiên → tạo Appointment + Encounter + TeleConsultation
 *     description: |
 *       Xác nhận phiên đặt lịch. Trong transaction:
 *       1. Tạo bản ghi `appointments` (booking_channel='TELECONSULTATION', is_teleconsultation=true)
 *       2. Tạo `encounters` (type='TELEMED', status='PLANNED')
 *       3. Tạo `tele_consultations` (call_status='SCHEDULED')
 *       4. Ghi audit log
 *
 *       Nếu phiên yêu cầu thanh toán → phải đã thanh toán (payment_status=PAID).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.2.2 Đặt lịch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string, example: 'TBS_abc123def456' }
 *     responses:
 *       200:
 *         description: Xác nhận thành công. Trả về phiên kèm appointment_code
 *       400:
 *         description: Phiên đã xác nhận / hủy / chưa thanh toán
 *       404:
 *         description: Không tìm thấy phiên
 */
router.post('/booking/:sessionId/confirm', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleBookingController.confirmBooking);

/**
 * @swagger
 * /api/teleconsultation/booking/{sessionId}/cancel:
 *   post:
 *     summary: Hủy phiên đặt lịch
 *     description: |
 *       Hủy phiên. Nếu đã xác nhận → cascade hủy appointment + tele_consultation.
 *       Nếu đã thanh toán → đánh dấu REFUNDED.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.2.2 Đặt lịch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string, example: 'TBS_abc123def456' }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancellation_reason: { type: string, example: 'Bệnh nhân hủy do thay đổi kế hoạch' }
 *     responses:
 *       200:
 *         description: Hủy thành công
 *       400:
 *         description: Phiên đã bị hủy
 *       404:
 *         description: Không tìm thấy phiên
 */
router.post('/booking/:sessionId/cancel', verifyAccessToken, TeleBookingController.cancelBooking);

// ═══════════════════════════════════════════════════
// NHÓM 3: THANH TOÁN
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/booking/{sessionId}/payment:
 *   post:
 *     summary: Khởi tạo thanh toán cho phiên đặt lịch
 *     description: |
 *       Tạo invoice PENDING cho phiên. Chỉ áp dụng khi payment_required=true.
 *       Trả về invoice_id, invoice_code, amount để frontend redirect thanh toán.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, PATIENT
 *     tags: [8.2.3 Thanh toán]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string, example: 'TBS_abc123def456' }
 *     responses:
 *       200:
 *         description: Trả về thông tin invoice
 *       400:
 *         description: Phiên không yêu cầu thanh toán hoặc đã thanh toán
 *       404:
 *         description: Không tìm thấy phiên
 */
router.post('/booking/:sessionId/payment', verifyAccessToken, TeleBookingController.initiatePayment);

/**
 * @swagger
 * /api/teleconsultation/booking/{sessionId}/payment-callback:
 *   post:
 *     summary: Callback xác nhận thanh toán thành công
 *     description: |
 *       Cổng thanh toán gọi API này sau khi BN thanh toán xong. Cập nhật payment_status=PAID, status=PAYMENT_COMPLETED.
 *
 *       **Phân quyền:** System / Internal.
 *       **Vai trò được phép:** ADMIN, System
 *     tags: [8.2.3 Thanh toán]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string, example: 'TBS_abc123def456' }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Đã thanh toán rồi
 *       404:
 *         description: Không tìm thấy phiên
 */
router.post('/booking/:sessionId/payment-callback', TeleBookingController.paymentCallback);

// ═══════════════════════════════════════════════════
// NHÓM 4: QUẢN LÝ & TRA CỨU
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/booking:
 *   get:
 *     summary: Danh sách phiên đặt lịch (phân trang, filter)
 *     description: |
 *       Lấy danh sách phiên đặt lịch với đầy đủ bộ lọc. Dùng cho quản trị & bác sĩ.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.2.4 Quản lý & Tra cứu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patient_id
 *         schema: { type: string }
 *       - in: query
 *         name: doctor_id
 *         schema: { type: string }
 *       - in: query
 *         name: specialty_id
 *         schema: { type: string }
 *       - in: query
 *         name: facility_id
 *         schema: { type: string }
 *       - in: query
 *         name: type_id
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFT, PENDING_PAYMENT, PAYMENT_COMPLETED, CONFIRMED, CANCELLED, EXPIRED] }
 *       - in: query
 *         name: payment_status
 *         schema: { type: string, enum: [UNPAID, PAID, REFUNDED] }
 *       - in: query
 *         name: from_date
 *         schema: { type: string, format: date, example: '2026-01-01' }
 *       - in: query
 *         name: to_date
 *         schema: { type: string, format: date, example: '2026-12-31' }
 *       - in: query
 *         name: keyword
 *         schema: { type: string }
 *         description: Tìm theo mã phiên, tên BN, tên BS
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Danh sách phiên với pagination
 */
router.get('/booking', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TeleBookingController.listBookings);

/**
 * @swagger
 * /api/teleconsultation/booking/{sessionId}:
 *   get:
 *     summary: Chi tiết phiên đặt lịch
 *     description: |
 *       Trả về đầy đủ thông tin phiên kèm JOINed data (tên BN, BS, CK, cơ sở, loại hình, slot time, appointment code).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.2.4 Quản lý & Tra cứu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string, example: 'TBS_abc123def456' }
 *     responses:
 *       200:
 *         description: Chi tiết phiên
 *       404:
 *         description: Không tìm thấy phiên
 */
router.get('/booking/:sessionId', verifyAccessToken, TeleBookingController.getBookingDetail);

export { router as teleBookingRoutes };
