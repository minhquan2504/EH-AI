import { Router } from 'express';
import { TelePrescriptionController } from '../../controllers/Remote Consultation/tele-prescription.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';

const router = Router();

// ═══════════════════════════════════════════════════
// STATIC ROUTES (trước dynamic)
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/prescriptions:
 *   get:
 *     summary: Danh sách đơn thuốc từ xa (phân trang, filter)
 *     description: |
 *       Filter theo status, doctor_id, keyword (search mã đơn, tên BN, chẩn đoán).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.6.4 Tra cứu đơn]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFT, PRESCRIBED, DISPENSED, CANCELLED] }
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
 *         description: DS đơn thuốc
 */
router.get('/prescriptions', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TelePrescriptionController.listPrescriptions);

/**
 * @swagger
 * /api/teleconsultation/prescriptions/drug-restrictions:
 *   get:
 *     summary: DS thuốc bị hạn chế kê từ xa
 *     description: |
 *       Trả về danh mục thuốc gây nghiện, hướng thần, yêu cầu khám trực tiếp.
 *       3 loại: BANNED (cấm), REQUIRES_IN_PERSON (phải khám trực tiếp), QUANTITY_LIMITED (giới hạn SL).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.6.2 Gửi đơn & Kiểm soát]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: DS thuốc hạn chế
 */
router.get('/prescriptions/drug-restrictions', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TelePrescriptionController.getDrugRestrictions);

/**
 * @swagger
 * /api/teleconsultation/prescriptions/patient/{patientId}:
 *   get:
 *     summary: Lịch sử đơn thuốc từ xa của BN
 *     description: |
 *       BN xem đơn của mình, BS/ADMIN xem của bất kỳ BN.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT (chỉ xem mình)
 *     tags: [8.6.4 Tra cứu đơn]
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
 *         description: Lịch sử đơn
 */
router.get('/prescriptions/patient/:patientId', verifyAccessToken, TelePrescriptionController.getPatientPrescriptions);

// ═══════════════════════════════════════════════════
// NHÓM 1: KÊ ĐƠN (dynamic routes)
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/prescriptions/{consultationId}:
 *   post:
 *     summary: Tạo đơn thuốc từ xa (DRAFT)
 *     description: |
 *       Tạo đơn thuốc liên kết phiên tư vấn. Tự động tạo prescriptions header (EMR).
 *       1 phiên = 1 đơn (UNIQUE).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.6.1 Kê đơn từ xa]
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
 *               clinical_diagnosis: { type: string, example: 'Viêm hô hấp trên do virus' }
 *               doctor_notes: { type: string, example: 'BN khám qua teleconsultation, triệu chứng nhẹ' }
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       409:
 *         description: Phiên đã có đơn
 *   get:
 *     summary: Chi tiết đơn thuốc + danh sách thuốc
 *     description: |
 *       Trả về đơn thuốc + JOIN tên BN/BS + DS thuốc chi tiết.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.6.1 Kê đơn từ xa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     responses:
 *       200:
 *         description: Chi tiết đơn
 *       404:
 *         description: Không tìm thấy
 */
router.post('/prescriptions/:consultationId', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TelePrescriptionController.createPrescription);
router.get('/prescriptions/:consultationId', verifyAccessToken, TelePrescriptionController.getDetail);

/**
 * @swagger
 * /api/teleconsultation/prescriptions/{consultationId}/items:
 *   post:
 *     summary: Thêm thuốc vào đơn
 *     description: |
 *       Kiểm tra thuốc tồn tại, kiểm tra restriction (BANNED/REQUIRES_IN_PERSON = cấm, QUANTITY_LIMITED = giới hạn SL).
 *       Chỉ thêm khi đơn ở DRAFT.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.6.1 Kê đơn từ xa]
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
 *             required: [drug_id, quantity, dosage, frequency]
 *             properties:
 *               drug_id: { type: string, example: 'DRUG_001' }
 *               quantity: { type: integer, example: 10 }
 *               dosage: { type: string, example: '500mg' }
 *               frequency: { type: string, example: '3 lần/ngày' }
 *               duration_days: { type: integer, example: 5 }
 *               usage_instruction: { type: string, example: 'Uống sau ăn 30 phút' }
 *     responses:
 *       201:
 *         description: Thêm thành công
 *       403:
 *         description: Thuốc bị hạn chế kê từ xa
 */
router.post('/prescriptions/:consultationId/items', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TelePrescriptionController.addItem);

/**
 * @swagger
 * /api/teleconsultation/prescriptions/{consultationId}/items/{detailId}:
 *   delete:
 *     summary: Xóa thuốc khỏi đơn
 *     description: |
 *       Chỉ xóa khi đơn ở DRAFT.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.6.1 Kê đơn từ xa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *       - in: path
 *         name: detailId
 *         required: true
 *         schema: { type: string, example: 'PD_abc123' }
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/prescriptions/:consultationId/items/:detailId', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TelePrescriptionController.removeItem);

/**
 * @swagger
 * /api/teleconsultation/prescriptions/{consultationId}/prescribe:
 *   put:
 *     summary: Kê đơn (DRAFT → PRESCRIBED)
 *     description: |
 *       Validate: restrictions_checked = true, đơn phải có ít nhất 1 thuốc.
 *       Sau khi PRESCRIBED không sửa thuốc.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.6.1 Kê đơn từ xa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     responses:
 *       200:
 *         description: Kê đơn thành công
 *       400:
 *         description: Chưa kiểm tra restriction / đơn rỗng
 */
router.put('/prescriptions/:consultationId/prescribe', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TelePrescriptionController.prescribe);

// ═══════════════════════════════════════════════════
// NHÓM 2: GỬI ĐƠN & KIỂM SOÁT
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/prescriptions/{consultationId}/send:
 *   put:
 *     summary: Gửi đơn cho bệnh nhân
 *     description: |
 *       Gửi đơn qua PICKUP (lấy tại quầy), DELIVERY (giao hàng), DIGITAL (đơn điện tử).
 *       Bắt buộc: xác nhận danh tính BN + kiểm tra danh mục thuốc hạn chế.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.6.2 Gửi đơn & Kiểm soát]
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
 *             required: [delivery_method, doctor_confirmed_identity, remote_restrictions_checked]
 *             properties:
 *               delivery_method: { type: string, enum: [PICKUP, DELIVERY, DIGITAL], example: 'DIGITAL' }
 *               delivery_address: { type: string, example: '123 Nguyễn Trãi, Q.5, TP.HCM' }
 *               delivery_phone: { type: string, example: '0901234567' }
 *               delivery_notes: { type: string, example: 'Giao hàng giờ hành chính' }
 *               doctor_confirmed_identity: { type: boolean, example: true }
 *               remote_restrictions_checked: { type: boolean, example: true }
 *               legal_disclaimer: { type: string, example: 'Tôi xác nhận đã kiểm tra danh tính BN qua video.' }
 *     responses:
 *       200:
 *         description: Gửi thành công
 *       400:
 *         description: Chưa xác nhận danh tính / restriction
 */
router.put('/prescriptions/:consultationId/send', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TelePrescriptionController.sendToPatient);

/**
 * @swagger
 * /api/teleconsultation/prescriptions/{consultationId}/stock-check:
 *   get:
 *     summary: Kiểm tra tồn kho cho đơn thuốc
 *     description: |
 *       Kiểm tra từng thuốc trong đơn có đủ stock không (pharmacy_inventory, chưa hết hạn).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.6.2 Gửi đơn & Kiểm soát]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     responses:
 *       200:
 *         description: DS kiểm tra tồn kho
 */
router.get('/prescriptions/:consultationId/stock-check', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TelePrescriptionController.checkStock);

// ═══════════════════════════════════════════════════
// NHÓM 3: CHỈ ĐỊNH XN & TÁI KHÁM
// ═══════════════════════════════════════════════════

/**
 * @swagger
 * /api/teleconsultation/prescriptions/{consultationId}/lab-orders:
 *   post:
 *     summary: Chỉ định xét nghiệm từ xa
 *     description: |
 *       BS chỉ định XN/CĐHA từ phiên teleconsultation. Tự động tạo medical_orders (EMR).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.6.3 Chỉ định XN & Tái khám]
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
 *             required: [service_code, service_name]
 *             properties:
 *               service_code: { type: string, example: 'XN_CTM' }
 *               service_name: { type: string, example: 'Công thức máu (CBC)' }
 *               clinical_indicator: { type: string, example: 'Sốt 3 ngày, nghi nhiễm trùng' }
 *               priority: { type: string, enum: [ROUTINE, URGENT], example: 'ROUTINE' }
 *     responses:
 *       201:
 *         description: Tạo chỉ định thành công
 *   get:
 *     summary: DS chỉ định XN của phiên
 *     description: |
 *       Trả về tất cả medical_orders liên kết encounter từ phiên tư vấn.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR, PATIENT
 *     tags: [8.6.3 Chỉ định XN & Tái khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     responses:
 *       200:
 *         description: DS XN
 */
router.post('/prescriptions/:consultationId/lab-orders', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TelePrescriptionController.createLabOrder);
router.get('/prescriptions/:consultationId/lab-orders', verifyAccessToken, TelePrescriptionController.getLabOrders);

/**
 * @swagger
 * /api/teleconsultation/prescriptions/{consultationId}/referral:
 *   put:
 *     summary: Chỉ định tái khám trực tiếp
 *     description: |
 *       BS đánh dấu BN cần đến cơ sở khám trực tiếp.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.6.3 Chỉ định XN & Tái khám]
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
 *             required: [has_referral]
 *             properties:
 *               has_referral: { type: boolean, example: true }
 *               referral_notes: { type: string, example: 'BN cần siêu âm ổ bụng, không thể thực hiện từ xa' }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/prescriptions/:consultationId/referral', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TelePrescriptionController.updateReferral);

/**
 * @swagger
 * /api/teleconsultation/prescriptions/{consultationId}/summary:
 *   get:
 *     summary: Tổng kết đơn thuốc (đơn + thuốc + XN + referral)
 *     description: |
 *       Trả về toàn bộ: đơn + DS thuốc + DS chỉ định XN + referral.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập.
 *       **Vai trò được phép:** ADMIN, DOCTOR
 *     tags: [8.6.4 Tra cứu đơn]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema: { type: string, example: 'TC_abc123def456' }
 *     responses:
 *       200:
 *         description: Tổng kết đơn
 */
router.get('/prescriptions/:consultationId/summary', verifyAccessToken, authorizeRoles('ADMIN', 'DOCTOR'), TelePrescriptionController.getSummary);

export { router as telePrescriptionRoutes };
