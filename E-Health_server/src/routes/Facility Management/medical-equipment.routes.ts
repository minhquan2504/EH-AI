import { Router } from 'express';
import { MedicalEquipmentController } from '../../controllers/Facility Management/medical-equipment.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const router = Router();

router.use(verifyAccessToken);
router.use(checkSessionStatus);

/**
 * @swagger
 * tags:
 *   name: 2.10 Quản lý Trang thiết bị Y tế
 *   description: |
 *     Module quản lý vòng đời trang thiết bị y tế: tạo mới, cập nhật, gán phòng,
 *     thay đổi trạng thái, và ghi nhận lịch sử bảo trì / kiểm định.
 *     Chuỗi liên kết: Cơ sở (Facility) → Chi nhánh (Branch) → Phòng (Room) → Thiết bị.
 */

// ==================== EQUIPMENT CRUD ====================

/**
 * @swagger
 * /api/equipments:
 *   get:
 *     summary: Lấy danh sách thiết bị y tế
 *     description: |
 *       Trả về danh sách thiết bị y tế có phân trang, hỗ trợ tìm kiếm theo tên/mã/serial
 *       và lọc theo cơ sở, chi nhánh, phòng, trạng thái.
 *
 *       **Phân quyền:** Yêu cầu quyền `EQUIPMENT_VIEW`
 *
 *       **Vai trò được phép:** ADMIN, MANAGER
 *     tags: [2.10 Quản lý Trang thiết bị Y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: facility_id
 *         schema:
 *           type: string
 *           example: "FAC_01"
 *         description: Lọc theo cơ sở
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *           example: "BR_001"
 *         description: Lọc theo chi nhánh
 *       - in: query
 *         name: room_id
 *         schema:
 *           type: string
 *           example: "MR_001"
 *         description: Lọc theo phòng
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, MAINTENANCE, BROKEN, INACTIVE]
 *           example: "ACTIVE"
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: "siêu âm"
 *         description: Tìm kiếm theo tên, mã tài sản hoặc serial number
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *         description: Số bản ghi mỗi trang (tối đa 100)
 *     responses:
 *       200:
 *         description: Danh sách thiết bị
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
 *                           equipment_id:
 *                             type: string
 *                           code:
 *                             type: string
 *                           name:
 *                             type: string
 *                           status:
 *                             type: string
 *                           branch_name:
 *                             type: string
 *                           room_name:
 *                             type: string
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
router.get('/', authorizePermissions('EQUIPMENT_VIEW'), MedicalEquipmentController.getEquipments);

/**
 * @swagger
 * /api/equipments/{id}:
 *   get:
 *     summary: Lấy chi tiết thiết bị
 *     description: |
 *       Trả về toàn bộ thông tin chi tiết của 1 thiết bị y tế, bao gồm
 *       thông tin chi nhánh và phòng hiện tại.
 *
 *       **Phân quyền:** Yêu cầu quyền `EQUIPMENT_VIEW`
 *
 *       **Vai trò được phép:** ADMIN, MANAGER
 *     tags: [2.10 Quản lý Trang thiết bị Y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "EQ_abc123def456"
 *         description: ID của thiết bị (equipment_id)
 *     responses:
 *       200:
 *         description: Chi tiết thiết bị
 *       404:
 *         description: Không tìm thấy thiết bị (EQ_001)
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
router.get('/:id', authorizePermissions('EQUIPMENT_VIEW'), MedicalEquipmentController.getEquipmentById);

/**
 * @swagger
 * /api/equipments:
 *   post:
 *     summary: Tạo mới thiết bị y tế
 *     description: |
 *       Thêm 1 thiết bị y tế mới vào hệ thống. Tự động sinh mã `EQ_...`.
 *       Yêu cầu `facility_id` và `branch_id` hợp lệ (branch phải thuộc facility).
 *       Nếu truyền `current_room_id`, phòng phải thuộc cùng chi nhánh.
 *
 *       **Phân quyền:** Yêu cầu quyền `EQUIPMENT_CREATE`
 *
 *       **Vai trò được phép:** ADMIN, MANAGER
 *     tags: [2.10 Quản lý Trang thiết bị Y tế]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - facility_id
 *               - branch_id
 *               - code
 *               - name
 *             properties:
 *               facility_id:
 *                 type: string
 *                 example: "FAC_01"
 *                 description: ID cơ sở y tế
 *               branch_id:
 *                 type: string
 *                 example: "BR_001"
 *                 description: ID chi nhánh (phải thuộc facility_id)
 *               code:
 *                 type: string
 *                 example: "SA-4D-01"
 *                 description: Mã quản lý tài sản (unique)
 *               name:
 *                 type: string
 *                 example: "Máy siêu âm 4D"
 *                 description: Tên thiết bị
 *               serial_number:
 *                 type: string
 *                 example: "SN-2024-001234"
 *                 description: Số serial của nhà sản xuất
 *               manufacturer:
 *                 type: string
 *                 example: "GE Healthcare"
 *                 description: Hãng sản xuất
 *               manufacturing_date:
 *                 type: string
 *                 format: date
 *                 example: "2023-06-15"
 *               purchase_date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-10"
 *               warranty_expiration:
 *                 type: string
 *                 format: date
 *                 example: "2027-01-10"
 *               current_room_id:
 *                 type: string
 *                 example: "MR_001"
 *                 description: Gán vào phòng ngay khi tạo (tuỳ chọn, phải cùng branch)
 *     responses:
 *       201:
 *         description: Tạo thiết bị thành công
 *       400:
 *         description: Mã tài sản đã tồn tại (EQ_002) hoặc trạng thái không hợp lệ (EQ_006)
 *       404:
 *         description: Cơ sở (EQ_003), chi nhánh (EQ_004), hoặc phòng (EQ_005) không tìm thấy
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
router.post('/', authorizePermissions('EQUIPMENT_CREATE'), MedicalEquipmentController.createEquipment);

/**
 * @swagger
 * /api/equipments/{id}:
 *   put:
 *     summary: Cập nhật thông tin thiết bị
 *     description: |
 *       Cập nhật các thông tin cơ bản: tên, serial, hãng SX, ngày SX, ngày mua, hạn bảo hành.
 *       **Không dùng API này để đổi phòng** (dùng PUT /api/equipments/{id}/assign-room).
 *       **Không dùng API này để đổi trạng thái** (dùng PUT /api/equipments/{id}/status).
 *
 *       **Phân quyền:** Yêu cầu quyền `EQUIPMENT_UPDATE`
 *
 *       **Vai trò được phép:** ADMIN, MANAGER
 *     tags: [2.10 Quản lý Trang thiết bị Y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "EQ_abc123def456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Máy siêu âm 4D (Phiên bản mới)"
 *               serial_number:
 *                 type: string
 *                 example: "SN-2024-001234-V2"
 *               manufacturer:
 *                 type: string
 *                 example: "GE Healthcare"
 *               manufacturing_date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               purchase_date:
 *                 type: string
 *                 format: date
 *                 example: "2024-03-15"
 *               warranty_expiration:
 *                 type: string
 *                 format: date
 *                 example: "2028-03-15"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy thiết bị (EQ_001)
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
router.put('/:id', authorizePermissions('EQUIPMENT_UPDATE'), MedicalEquipmentController.updateEquipment);

/**
 * @swagger
 * /api/equipments/{id}/status:
 *   put:
 *     summary: Cập nhật trạng thái thiết bị
 *     description: |
 *       Thay đổi trạng thái hoạt động của thiết bị.
 *       Giá trị hợp lệ: `ACTIVE` (Đang hoạt động), `MAINTENANCE` (Đang bảo trì),
 *       `BROKEN` (Hỏng), `INACTIVE` (Ngừng sử dụng).
 *
 *       **Phân quyền:** Yêu cầu quyền `EQUIPMENT_UPDATE`
 *
 *       **Vai trò được phép:** ADMIN, MANAGER
 *     tags: [2.10 Quản lý Trang thiết bị Y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "EQ_abc123def456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, MAINTENANCE, BROKEN, INACTIVE]
 *                 example: "MAINTENANCE"
 *                 description: Trạng thái mới
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *       400:
 *         description: Trạng thái không hợp lệ (EQ_006)
 *       404:
 *         description: Không tìm thấy thiết bị (EQ_001)
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
router.put('/:id/status', authorizePermissions('EQUIPMENT_UPDATE'), MedicalEquipmentController.updateStatus);

/**
 * @swagger
 * /api/equipments/{id}/assign-room:
 *   put:
 *     summary: Gán thiết bị vào phòng hoặc thu hồi về kho
 *     description: |
 *       Gán thiết bị vào 1 phòng chức năng, hoặc truyền `room_id: null` để thu hồi về kho.
 *       **Quy tắc:** Phòng được gán phải thuộc cùng chi nhánh (branch) với thiết bị
 *       để tránh gán nhầm qua chi nhánh khác.
 *
 *       **Phân quyền:** Yêu cầu quyền `EQUIPMENT_UPDATE`
 *
 *       **Vai trò được phép:** ADMIN, MANAGER
 *     tags: [2.10 Quản lý Trang thiết bị Y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "EQ_abc123def456"
 *         description: ID thiết bị
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               room_id:
 *                 type: string
 *                 nullable: true
 *                 example: "MR_001"
 *                 description: ID phòng (null = thu hồi về kho)
 *     responses:
 *       200:
 *         description: Gán phòng / thu hồi thành công
 *       404:
 *         description: Thiết bị (EQ_001) hoặc phòng (EQ_005) không tìm thấy
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
router.put('/:id/assign-room', authorizePermissions('EQUIPMENT_UPDATE'), MedicalEquipmentController.assignRoom);

/**
 * @swagger
 * /api/equipments/{id}:
 *   delete:
 *     summary: Xóa thiết bị y tế (soft delete)
 *     description: |
 *       Đánh dấu thiết bị là đã xóa (soft delete, set deleted_at).
 *       Thiết bị sẽ không hiển thị trong danh sách nhưng dữ liệu vẫn còn trong DB.
 *
 *       **Phân quyền:** Yêu cầu quyền `EQUIPMENT_DELETE`
 *
 *       **Vai trò được phép:** ADMIN
 *     tags: [2.10 Quản lý Trang thiết bị Y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "EQ_abc123def456"
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy thiết bị (EQ_001)
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
router.delete('/:id', authorizePermissions('EQUIPMENT_DELETE'), MedicalEquipmentController.deleteEquipment);

// ==================== MAINTENANCE LOGS ====================

/**
 * @swagger
 * /api/equipments/{id}/maintenance:
 *   get:
 *     summary: Lấy lịch sử bảo trì / kiểm định của thiết bị
 *     description: |
 *       Trả về danh sách lịch sử bảo trì, sửa chữa, kiểm định của 1 thiết bị cụ thể.
 *       Kết quả sắp xếp theo ngày thực hiện giảm dần (mới nhất trước).
 *
 *       **Phân quyền:** Yêu cầu quyền `EQUIPMENT_VIEW`
 *
 *       **Vai trò được phép:** ADMIN, MANAGER
 *     tags: [2.10 Quản lý Trang thiết bị Y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "EQ_abc123def456"
 *         description: ID thiết bị
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
 *         description: Danh sách lịch sử bảo trì
 *       404:
 *         description: Không tìm thấy thiết bị (EQ_001)
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
router.get('/:id/maintenance', authorizePermissions('EQUIPMENT_VIEW'), MedicalEquipmentController.getMaintenanceLogs);

/**
 * @swagger
 * /api/equipments/{id}/maintenance:
 *   post:
 *     summary: Tạo bản ghi bảo trì / kiểm định mới
 *     description: |
 *       Ghi nhận 1 lần bảo trì, sửa chữa hoặc kiểm định cho thiết bị.
 *       Loại bảo trì: `ROUTINE` (Định kỳ), `REPAIR` (Sửa chữa), `INSPECTION` (Kiểm định).
 *
 *       **Tự động hóa:** Nếu tạo log `REPAIR` cho thiết bị đang `BROKEN`,
 *       hệ thống sẽ tự động chuyển trạng thái thiết bị sang `ACTIVE`.
 *
 *       **Phân quyền:** Yêu cầu quyền `EQUIPMENT_UPDATE`
 *
 *       **Vai trò được phép:** ADMIN, MANAGER
 *     tags: [2.10 Quản lý Trang thiết bị Y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "EQ_abc123def456"
 *         description: ID thiết bị
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - maintenance_date
 *               - maintenance_type
 *             properties:
 *               maintenance_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-10"
 *                 description: Ngày thực hiện bảo trì
 *               maintenance_type:
 *                 type: string
 *                 enum: [ROUTINE, REPAIR, INSPECTION]
 *                 example: "ROUTINE"
 *                 description: Loại bảo trì
 *               description:
 *                 type: string
 *                 example: "Bảo trì định kỳ quý 1/2026, thay filter, vệ sinh đầu dò."
 *                 description: Chi tiết công việc đã thực hiện
 *               performed_by:
 *                 type: string
 *                 example: "Công ty TNHH Thiết bị Y tế ABC"
 *                 description: Người hoặc đơn vị thực hiện
 *               cost:
 *                 type: number
 *                 example: 2500000
 *                 description: Chi phí bảo trì (VNĐ)
 *               next_maintenance_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-06-10"
 *                 description: Lịch bảo trì tiếp theo dự kiến
 *     responses:
 *       201:
 *         description: Tạo bản ghi bảo trì thành công
 *       400:
 *         description: Loại bảo trì không hợp lệ (EML_002)
 *       404:
 *         description: Không tìm thấy thiết bị (EQ_001)
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
router.post('/:id/maintenance', authorizePermissions('EQUIPMENT_UPDATE'), MedicalEquipmentController.createMaintenanceLog);

/**
 * @swagger
 * /api/equipments/maintenance/{logId}:
 *   put:
 *     summary: Cập nhật bản ghi bảo trì
 *     description: |
 *       Sửa thông tin của 1 bản ghi bảo trì/kiểm định đã tạo trước đó (nếu nhập sai).
 *
 *       **Phân quyền:** Yêu cầu quyền `EQUIPMENT_UPDATE`
 *
 *       **Vai trò được phép:** ADMIN, MANAGER
 *     tags: [2.10 Quản lý Trang thiết bị Y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *           example: "EML_abc123def456"
 *         description: ID bản ghi bảo trì (log_id)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               maintenance_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-12"
 *               maintenance_type:
 *                 type: string
 *                 enum: [ROUTINE, REPAIR, INSPECTION]
 *                 example: "REPAIR"
 *               description:
 *                 type: string
 *                 example: "Sửa chữa đầu dò bị lỗi."
 *               performed_by:
 *                 type: string
 *                 example: "Kỹ thuật viên Nguyễn Văn A"
 *               cost:
 *                 type: number
 *                 example: 5000000
 *               next_maintenance_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-09-12"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Loại bảo trì không hợp lệ (EML_002)
 *       404:
 *         description: Không tìm thấy bản ghi (EML_001)
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
router.put('/maintenance/:logId', authorizePermissions('EQUIPMENT_UPDATE'), MedicalEquipmentController.updateMaintenanceLog);

/**
 * @swagger
 * /api/equipments/maintenance/{logId}:
 *   delete:
 *     summary: Xóa bản ghi bảo trì
 *     description: |
 *       Xóa vĩnh viễn 1 bản ghi bảo trì/kiểm định (hard delete).
 *
 *       **Phân quyền:** Yêu cầu quyền `EQUIPMENT_DELETE`
 *
 *       **Vai trò được phép:** ADMIN
 *     tags: [2.10 Quản lý Trang thiết bị Y tế]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *           example: "EML_abc123def456"
 *         description: ID bản ghi bảo trì (log_id)
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy bản ghi (EML_001)
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
router.delete('/maintenance/:logId', authorizePermissions('EQUIPMENT_DELETE'), MedicalEquipmentController.deleteMaintenanceLog);

export default router;
