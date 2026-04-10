// src/routes/Patient Management/patient-contact.routes.ts
import { Router } from 'express';
import { PatientContactController } from '../../controllers/Patient Management/patient-contact.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const router = Router();

/**
 * @swagger
 * /api/patient-relations:
 *   get:
 *     summary: Danh sách người thân bệnh nhân
 *     description: |
 *       **Chức năng:** Trả về danh sách người thân của bệnh nhân có phân trang.
 *       Hỗ trợ lọc theo `patient_id` qua query param để xem người thân của 1 bệnh nhân cụ thể.
 *       Kết quả JOIN thông tin loại quan hệ (relation_type_name, relation_type_code)
 *       và thông tin bệnh nhân (patient_name, patient_code).
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_RELATION_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.4.1 Quản lý Người thân Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patient_id
 *         schema:
 *           type: string
 *         description: Lọc theo ID bệnh nhân (UUID). Nếu không truyền sẽ trả về tất cả.
 *         example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số lượng mỗi trang (tối đa 100)
 *     responses:
 *       200:
 *         description: Danh sách người thân
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
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           patient_contacts_id:
 *                             type: string
 *                             example: "PTC_260312_a1b2c3d4"
 *                           patient_id:
 *                             type: string
 *                             example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                           relation_type_id:
 *                             type: string
 *                             example: "REL_260312_a1b2c3d4"
 *                           contact_name:
 *                             type: string
 *                             example: "Nguyễn Thị Bình"
 *                           phone_number:
 *                             type: string
 *                             example: "0987654321"
 *                           address:
 *                             type: string
 *                             example: "123 Nguyễn Trãi, Quận 5"
 *                           is_emergency_contact:
 *                             type: boolean
 *                             example: true
 *                           relation_type_code:
 *                             type: string
 *                             example: "MOTHER"
 *                           relation_type_name:
 *                             type: string
 *                             example: "Mẹ"
 *                           patient_name:
 *                             type: string
 *                             example: "Nguyễn Văn An"
 *                           patient_code:
 *                             type: string
 *                             example: "BN_260312_abcd1234"
 *                     total:
 *                       type: integer
 *                       example: 5
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *       401:
 *         description: Chưa xác thực (Token không hợp lệ hoặc hết hạn)
 *       403:
 *         description: Không có quyền truy cập
 */
router.get('/', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_RELATION_VIEW'), PatientContactController.getContacts);

/**
 * @swagger
 * /api/patient-relations/{id}:
 *   get:
 *     summary: Chi tiết người thân
 *     description: |
 *       **Chức năng:** Trả về thông tin chi tiết của một người thân theo ID.
 *       Bao gồm thông tin loại quan hệ và thông tin bệnh nhân liên kết.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_RELATION_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.4.1 Quản lý Người thân Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID người thân (patient_contacts_id)
 *         example: "PTC_260312_a1b2c3d4"
 *     responses:
 *       200:
 *         description: Chi tiết người thân
 *       404:
 *         description: Không tìm thấy thông tin người thân
 */
router.get('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_RELATION_VIEW'), PatientContactController.getById);

/**
 * @swagger
 * /api/patient-relations:
 *   post:
 *     summary: Thêm người thân cho bệnh nhân
 *     description: |
 *       **Chức năng:** Thêm một người thân/người giám hộ vào hồ sơ bệnh nhân.
 *       Hệ thống tự động:
 *       - Sinh ID theo format `PTC_YYMMDD_8charUUID`.
 *       - Kiểm tra bệnh nhân (`patient_id`) tồn tại và chưa bị xóa mềm.
 *       - Kiểm tra loại quan hệ (`relation_type_id`) tồn tại và đang hoạt động.
 *       - Hỗ trợ cờ `is_emergency_contact` đánh dấu liên hệ khẩn cấp.
 *
 *       **Các trường bắt buộc:** `patient_id`, `relation_type_id`, `contact_name`, `phone_number`.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_RELATION_MANAGE`.
 *       **Vai trò được phép:** Admin, Staff.
 *     tags: [2.4.1 Quản lý Người thân Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient_id, relation_type_id, contact_name, phone_number]
 *             properties:
 *               patient_id:
 *                 type: string
 *                 description: ID hồ sơ bệnh nhân (UUID từ bảng patients)
 *                 example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *               relation_type_id:
 *                 type: string
 *                 description: ID loại quan hệ (từ bảng relation_types)
 *                 example: "REL_260312_a1b2c3d4"
 *               contact_name:
 *                 type: string
 *                 description: Họ tên người thân
 *                 example: "Nguyễn Thị Bình"
 *               phone_number:
 *                 type: string
 *                 description: Số điện thoại liên lạc
 *                 example: "0987654321"
 *               address:
 *                 type: string
 *                 description: Địa chỉ người thân (tùy chọn)
 *                 example: "456 Lê Lợi, Quận 1, TP.HCM"
 *               is_emergency_contact:
 *                 type: boolean
 *                 description: Đánh dấu là liên hệ khẩn cấp
 *                 example: true
 *     responses:
 *       201:
 *         description: Thêm người thân thành công
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
 *                   example: "Thêm người thân cho bệnh nhân thành công."
 *                 data:
 *                   type: object
 *       400:
 *         description: >
 *           Thiếu trường bắt buộc (PTC_002) |
 *           Loại quan hệ không hợp lệ hoặc đã bị vô hiệu hóa (PTC_004)
 *       404:
 *         description: Không tìm thấy hồ sơ bệnh nhân (PTC_003)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.post('/', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_RELATION_MANAGE'), PatientContactController.create);

/**
 * @swagger
 * /api/patient-relations/{id}:
 *   put:
 *     summary: Cập nhật thông tin người thân
 *     description: |
 *       **Chức năng:** Cập nhật thông tin người thân theo ID.
 *       Chỉ các trường được gửi trong body mới được cập nhật (Partial Update).
 *       Nếu đổi `relation_type_id`, hệ thống sẽ kiểm tra loại quan hệ mới tồn tại và đang active.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_RELATION_MANAGE`.
 *       **Vai trò được phép:** Admin, Staff.
 *     tags: [2.4.1 Quản lý Người thân Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID người thân (patient_contacts_id)
 *         example: "PTC_260312_a1b2c3d4"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               relation_type_id:
 *                 type: string
 *                 description: ID loại quan hệ mới (nếu muốn đổi)
 *                 example: "REL_260312_e5f6g7h8"
 *               contact_name:
 *                 type: string
 *                 example: "Nguyễn Thị Bình (Cập nhật)"
 *               phone_number:
 *                 type: string
 *                 example: "0912345678"
 *               address:
 *                 type: string
 *                 example: "789 Trần Hưng Đạo, Quận 5"
 *               is_emergency_contact:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Loại quan hệ không hợp lệ
 *       404:
 *         description: Không tìm thấy thông tin người thân
 */
router.put('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_RELATION_MANAGE'), PatientContactController.update);

/**
 * @swagger
 * /api/patient-relations/{id}:
 *   delete:
 *     summary: Xóa người thân (soft delete)
 *     description: |
 *       **Chức năng:** Xóa mềm thông tin người thân khỏi hồ sơ bệnh nhân.
 *       Dữ liệu không bị mất, chỉ đánh dấu `deleted_at`.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_RELATION_MANAGE`.
 *       **Vai trò được phép:** Admin, Staff.
 *     tags: [2.4.1 Quản lý Người thân Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID người thân (patient_contacts_id)
 *         example: "PTC_260312_a1b2c3d4"
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy thông tin người thân
 */
router.delete('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_RELATION_MANAGE'), PatientContactController.delete);

// 2.4.3: Liên hệ khẩn cấp

/**
 * @swagger
 * /api/patient-relations/{id}/set-emergency:
 *   patch:
 *     summary: Đặt/hủy liên hệ khẩn cấp cho người thân
 *     description: |
 *       **Chức năng:** Cập nhật cờ `is_emergency_contact` (true/false) cho một người thân cụ thể.
 *       Bệnh nhân có thể có nhiều liên hệ khẩn cấp cùng lúc.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_RELATION_MANAGE`.
 *       **Vai trò được phép:** Admin, Staff.
 *     tags: [2.4.3 Quản lý liên hệ khẩn cấp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID người thân (patient_contacts_id)
 *         example: "PTC_260312_a1b2c3d4"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [is_emergency_contact]
 *             properties:
 *               is_emergency_contact:
 *                 type: boolean
 *                 description: true = đặt làm liên hệ khẩn cấp, false = hủy
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái liên hệ khẩn cấp thành công
 *       400:
 *         description: Thiếu giá trị is_emergency_contact (PTC_005)
 *       404:
 *         description: Không tìm thấy thông tin người thân (PTC_001)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.patch('/:id/set-emergency', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_RELATION_MANAGE'), PatientContactController.setEmergencyContact);

// 2.4.4: Người đại diện pháp lý 

/**
 * @swagger
 * /api/patient-relations/{id}/set-legal-representative:
 *   patch:
 *     summary: Chỉ định/hủy người đại diện pháp lý
 *     description: |
 *       **Chức năng:** Chỉ định hoặc hủy chỉ định một người thân làm người đại diện pháp lý cho bệnh nhân.
 *
 *       **Nghiệp vụ đặc biệt:** Khi set `is_legal_representative = true`, hệ thống tự động
 *       **hủy chỉ định (unset)** tất cả người đại diện pháp lý khác của **cùng bệnh nhân**,
 *       đảm bảo tại mỗi thời điểm chỉ có **MỘT** người đại diện pháp lý duy nhất.
 *
 *       Dùng trong các trường hợp: trẻ em, bệnh nhân mất năng lực hành vi, phẫu thuật cần người ký.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_RELATION_MANAGE`.
 *       **Vai trò được phép:** Admin, Staff.
 *     tags: [2.4.4 Chỉ định người đại diện pháp lý]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID người thân (patient_contacts_id)
 *         example: "PTC_260312_a1b2c3d4"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [is_legal_representative]
 *             properties:
 *               is_legal_representative:
 *                 type: boolean
 *                 description: true = chỉ định đại diện pháp lý, false = hủy chỉ định
 *                 example: true
 *     responses:
 *       200:
 *         description: Chỉ định/hủy chỉ định người đại diện pháp lý thành công
 *       400:
 *         description: Thiếu giá trị is_legal_representative (PTC_006)
 *       404:
 *         description: Không tìm thấy thông tin người thân (PTC_001)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.patch('/:id/set-legal-representative', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_RELATION_MANAGE'), PatientContactController.setLegalRepresentative);

// 2.4.5: Ghi chú quyền quyết định y tế 

/**
 * @swagger
 * /api/patient-relations/{id}/medical-decision-note:
 *   patch:
 *     summary: Cập nhật ghi chú quyền quyết định y tế
 *     description: |
 *       **Chức năng:** Cập nhật trường text `medical_decision_note` cho một người thân cụ thể.
 *       Dùng để lưu trữ thông tin chi tiết về quyền quyết định y tế của người thân,
 *       ví dụ: "Có quyền ký phẫu thuật", "Có quyền quyết định cấp cứu".
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_RELATION_MANAGE`.
 *       **Vai trò được phép:** Admin, Staff.
 *     tags: [2.4.5 Ghi chú quyền quyết định y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID người thân (patient_contacts_id)
 *         example: "PTC_260312_a1b2c3d4"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [medical_decision_note]
 *             properties:
 *               medical_decision_note:
 *                 type: string
 *                 description: Nội dung ghi chú quyền quyết định y tế
 *                 example: "Có quyền ký cam kết phẫu thuật và quyết định cấp cứu thay bệnh nhân."
 *     responses:
 *       200:
 *         description: Cập nhật ghi chú thành công
 *       400:
 *         description: Thiếu nội dung ghi chú (PTC_007)
 *       404:
 *         description: Không tìm thấy thông tin người thân (PTC_001)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.patch('/:id/medical-decision-note', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_RELATION_MANAGE'), PatientContactController.updateMedicalDecisionNote);

/**
 * @swagger
 * /api/patient-relations/{id}/medical-decision-note:
 *   get:
 *     summary: Xem ghi chú quyền quyết định y tế
 *     description: |
 *       **Chức năng:** Lấy ghi chú quyền quyết định y tế của một người thân cụ thể.
 *       Trả về trường `medical_decision_note` (có thể null nếu chưa thiết lập).
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_RELATION_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.4.5 Ghi chú quyền quyết định y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID người thân (patient_contacts_id)
 *         example: "PTC_260312_a1b2c3d4"
 *     responses:
 *       200:
 *         description: Ghi chú quyền quyết định y tế
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
 *                     medical_decision_note:
 *                       type: string
 *                       nullable: true
 *                       example: "Có quyền ký cam kết phẫu thuật và quyết định cấp cứu thay bệnh nhân."
 *       404:
 *         description: Không tìm thấy thông tin người thân (PTC_001)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/:id/medical-decision-note', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_RELATION_VIEW'), PatientContactController.getMedicalDecisionNote);

export const patientContactRoutes = router;

