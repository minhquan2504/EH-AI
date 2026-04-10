import { Router } from 'express';
import { MedInstructionController } from '../../controllers/Medication Management/med-instruction.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

export const medInstructionRoutes = Router();

// ===================== TEMPLATES =====================

/**
 * @swagger
 * /api/medication-instructions/templates:
 *   get:
 *     summary: Danh sách mẫu hướng dẫn sử dụng thuốc
 *     description: |
 *       Lấy danh sách mẫu chuẩn hóa: liều lượng, tần suất, đường dùng, hướng dẫn đặc biệt.
 *       Frontend dùng data này tạo dropdown/autocomplete cho BS khi kê đơn.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST, DOCTOR, NURSE (ai có quyền `MED_INSTRUCTION_VIEW`).
 *     tags:
 *       - "5.10 Medication Instructions"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [DOSAGE, FREQUENCY, ROUTE, INSTRUCTION]
 *           example: ""
 *         description: Filter theo loại template
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: ""
 *         description: Tìm theo label/value
 *     responses:
 *       200:
 *         description: Lấy danh sách mẫu thành công
 *       401:
 *         description: Chưa đăng nhập
 */
medInstructionRoutes.get('/templates', verifyAccessToken, checkSessionStatus, authorizePermissions('MED_INSTRUCTION_VIEW'), MedInstructionController.getTemplates);

/**
 * @swagger
 * /api/medication-instructions/templates:
 *   post:
 *     summary: Tạo mẫu hướng dẫn mới
 *     description: |
 *       Thêm 1 mẫu chuẩn hóa mới (VD: liều "15mg", tần suất "Mỗi 4 giờ").
 *       value phải UNIQUE trong cùng type.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST, DOCTOR (ai có quyền `MED_INSTRUCTION_MANAGE`).
 *     tags:
 *       - "5.10 Medication Instructions"
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, label, value]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [DOSAGE, FREQUENCY, ROUTE, INSTRUCTION]
 *                 example: "DOSAGE"
 *               label:
 *                 type: string
 *                 example: "15mg"
 *               value:
 *                 type: string
 *                 example: "15mg"
 *               sort_order:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       201:
 *         description: Tạo mẫu thành công
 *       400:
 *         description: Thiếu thông tin / loại không hợp lệ
 *       409:
 *         description: Giá trị đã tồn tại
 */
medInstructionRoutes.post('/templates', verifyAccessToken, checkSessionStatus, authorizePermissions('MED_INSTRUCTION_MANAGE'), MedInstructionController.createTemplate);

/**
 * @swagger
 * /api/medication-instructions/templates/{id}:
 *   patch:
 *     summary: Cập nhật mẫu hướng dẫn
 *     description: |
 *       Sửa label, value, sort_order, is_active.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST, DOCTOR (ai có quyền `MED_INSTRUCTION_MANAGE`).
 *     tags:
 *       - "5.10 Medication Instructions"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "MIT_DOS_001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *                 example: "1 viên (cập nhật)"
 *               value:
 *                 type: string
 *               sort_order:
 *                 type: integer
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Mẫu không tồn tại
 */
medInstructionRoutes.patch('/templates/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('MED_INSTRUCTION_MANAGE'), MedInstructionController.updateTemplate);

/**
 * @swagger
 * /api/medication-instructions/templates/{id}:
 *   delete:
 *     summary: Xóa mẫu hướng dẫn (soft delete)
 *     description: |
 *       Đánh dấu is_active = false. Dữ liệu vẫn còn trong DB.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST, DOCTOR (ai có quyền `MED_INSTRUCTION_MANAGE`).
 *     tags:
 *       - "5.10 Medication Instructions"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "MIT_DOS_001"
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Mẫu không tồn tại
 */
medInstructionRoutes.delete('/templates/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('MED_INSTRUCTION_MANAGE'), MedInstructionController.deleteTemplate);

// ===================== DRUG DEFAULTS =====================

/**
 * @swagger
 * /api/medication-instructions/drugs:
 *   get:
 *     summary: Danh sách thuốc có hướng dẫn mặc định
 *     description: |
 *       Liệt kê tất cả thuốc đã được gắn hướng dẫn sử dụng mặc định.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST, DOCTOR, NURSE (ai có quyền `MED_INSTRUCTION_VIEW`).
 *     tags:
 *       - "5.10 Medication Instructions"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: ""
 *         description: Tìm theo drug_code hoặc brand_name
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
medInstructionRoutes.get('/drugs', verifyAccessToken, checkSessionStatus, authorizePermissions('MED_INSTRUCTION_VIEW'), MedInstructionController.getAllDefaults);

/**
 * @swagger
 * /api/medication-instructions/drugs/{drugId}:
 *   get:
 *     summary: Lấy hướng dẫn mặc định của 1 thuốc
 *     description: |
 *       Trả về liều lượng, tần suất, số ngày, đường dùng, hướng dẫn đặc biệt mặc định.
 *       Frontend gọi API này khi BS chọn thuốc → tự điền sẵn vào form kê đơn.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST, DOCTOR, NURSE (ai có quyền `MED_INSTRUCTION_VIEW`).
 *     tags:
 *       - "5.10 Medication Instructions"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: drugId
 *         required: true
 *         schema:
 *           type: string
 *           example: "DRG_001"
 *     responses:
 *       200:
 *         description: Lấy hướng dẫn mặc định thành công
 *       404:
 *         description: Thuốc không tồn tại hoặc chưa có hướng dẫn mặc định
 */
medInstructionRoutes.get('/drugs/:drugId', verifyAccessToken, checkSessionStatus, authorizePermissions('MED_INSTRUCTION_VIEW'), MedInstructionController.getDrugDefault);

/**
 * @swagger
 * /api/medication-instructions/drugs/{drugId}:
 *   put:
 *     summary: Tạo / cập nhật hướng dẫn mặc định cho thuốc
 *     description: |
 *       Upsert: nếu thuốc chưa có → tạo mới, nếu đã có → cập nhật.
 *       Cần ít nhất 1 trường default.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST, DOCTOR (ai có quyền `MED_INSTRUCTION_MANAGE`).
 *     tags:
 *       - "5.10 Medication Instructions"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: drugId
 *         required: true
 *         schema:
 *           type: string
 *           example: "DRG_001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               default_dosage:
 *                 type: string
 *                 example: "1 viên"
 *               default_frequency:
 *                 type: string
 *                 example: "2 lần/ngày"
 *               default_duration_days:
 *                 type: integer
 *                 example: 7
 *               default_route:
 *                 type: string
 *                 example: "ORAL"
 *               default_instruction:
 *                 type: string
 *                 example: "Uống sau ăn"
 *               notes:
 *                 type: string
 *                 example: "Thuốc kháng sinh, uống đủ liệu trình"
 *     responses:
 *       200:
 *         description: Lưu hướng dẫn mặc định thành công
 *       400:
 *         description: Thiếu thông tin
 *       404:
 *         description: Thuốc không tồn tại
 */
medInstructionRoutes.put('/drugs/:drugId', verifyAccessToken, checkSessionStatus, authorizePermissions('MED_INSTRUCTION_MANAGE'), MedInstructionController.upsertDrugDefault);

/**
 * @swagger
 * /api/medication-instructions/drugs/{drugId}:
 *   delete:
 *     summary: Xóa hướng dẫn mặc định của thuốc
 *     description: |
 *       Xóa vĩnh viễn hướng dẫn mặc định (hard delete).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST, DOCTOR (ai có quyền `MED_INSTRUCTION_MANAGE`).
 *     tags:
 *       - "5.10 Medication Instructions"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: drugId
 *         required: true
 *         schema:
 *           type: string
 *           example: "DRG_001"
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Chưa có hướng dẫn mặc định
 */
medInstructionRoutes.delete('/drugs/:drugId', verifyAccessToken, checkSessionStatus, authorizePermissions('MED_INSTRUCTION_MANAGE'), MedInstructionController.deleteDrugDefault);
