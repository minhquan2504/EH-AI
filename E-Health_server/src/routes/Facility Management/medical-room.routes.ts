import { Router } from 'express';
import { MedicalRoomController } from '../../controllers/Facility Management/medical-room.controller';
import { RoomServiceController } from '../../controllers/Facility Management/room-service.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizeApi } from '../../middleware/authorizeApi.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const medicalRoomRoutes = Router();

/**
 * @swagger
 * /api/medical-rooms/dropdown:
 *   get:
 *     summary: 1. Lấy danh sách Phòng/Buồng khám (Dropdown)
 *     description: |
 *       **Mục đích:** API lấy danh sách rút gọn các Buồng phòng thuộc 1 Chi nhánh hoặc Khoa để hiển thị Option (vd: Phòng Nội 1, Phòng X-Quang T2).
 *       **Phân quyền:** Yêu cầu đăng nhập (`verifyAccessToken`).
 *       **Vai trò được phép:** Tất cả (Admin, Staff, Doctor, Nurse, Pharmacist)
 *     tags: [2.4 Quản lý Không gian/Phòng khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: "Lọc phòng theo ID Chi nhánh quản lý (Tùy chọn)"
 *         example: "BRN_123"
 *       - in: query
 *         name: department_id
 *         schema:
 *           type: string
 *         description: "Lọc phòng thuộc Khoa/Phòng ban nào đó (Tùy chọn)"
 *         example: "DEPT_123"
 *     responses:
 *       200:
 *         description: Trả về danh sách thả xuống thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - medical_rooms_id: "ROOM_123"
 *                     branch_id: "BRN_123"
 *                     department_id: "DEPT_123"
 *                     code: "P101"
 *                     name: "Phòng Nội 1"
 */
medicalRoomRoutes.get('/dropdown', verifyAccessToken, MedicalRoomController.getDropdownList);

/**
 * @swagger
 * /api/medical-rooms:
 *   get:
 *     summary: 2. Lấy danh sách Phòng (Phân trang)
 *     description: |
 *       **Mục đích:** Tra cứu toàn bộ danh sách thiết lập cơ sở vật chất dạng phòng ban. Có filter theo Branch, Department, Type, Status.
 *       **Phân quyền:** Yêu cầu quyền `ROOM_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Doctor, Nurse, Pharmacist
 *     tags: [2.4 Quản lý Không gian/Phòng khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: "Tìm kiếm từ khóa theo mã code, tên phòng."
 *         example: "Phòng Nội"
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: "Lọc phòng thuộc Chi nhánh cụ thể."
 *       - in: query
 *         name: department_id
 *         schema:
 *           type: string
 *         description: "Lọc phòng thuộc Bộ phận / Khoa."
 *       - in: query
 *         name: room_type
 *         schema:
 *           type: string
 *           enum: [CONSULTATION, LAB, IMAGING, OPERATING]
 *         description: "Lọc theo loại phòng (Khám bệnh, Xét nghiệm, CĐHA, Phẫu thuật, Ngoại trú...)"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, MAINTENANCE, INACTIVE]
 *         description: "Lọc phòng theo trạng thái."
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Pagination thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   items:
 *                     - medical_rooms_id: "ROOM_abc"
 *                       branch_id: "BRN_123"
 *                       department_id: "DEPT_123"
 *                       code: "P101"
 *                       name: "Phòng Nội Trung Tâm"
 *                       room_type: "CONSULTATION"
 *                       capacity: 2
 *                       status: "ACTIVE"
 *                       branch_name: "Chi nhánh Đống Đa"
 *                       department_name: "Khoa Nội Tiêu Hóa"
 *                   pagination:
 *                     page: 1
 *                     limit: 10
 *                     total_records: 5
 *                     total_pages: 1
 *       403:
 *         description: Bị chặn (FORBIDDEN_ACCESS).
 */
medicalRoomRoutes.get('/',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('ROOM_VIEW'),
    MedicalRoomController.getMedicalRooms
);

// ===== ROOM-SERVICE MAPPING (Module 3.4) =====

/**
 * @swagger
 * /api/medical-rooms/{roomId}/services:
 *   post:
 *     summary: Gán dịch vụ cho phòng
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền ROOM_UPDATE.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Gán 1 hoặc nhiều facility_service cho phòng.
 *       - Dùng ON CONFLICT DO NOTHING → gán trùng sẽ bỏ qua.
 *     tags: [3.4 Quản lý phòng khám & tài nguyên]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         example: "ROOM_abc"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - facility_service_ids
 *             properties:
 *               facility_service_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["FS_abc123", "FS_def456"]
 *     responses:
 *       200:
 *         description: Gán dịch vụ cho phòng thành công
 *       404:
 *         description: Phòng hoặc dịch vụ không tồn tại
 */
medicalRoomRoutes.post('/:roomId/services',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('ROOM_UPDATE'),
    RoomServiceController.assignServices
);

/**
 * @swagger
 * /api/medical-rooms/{roomId}/services:
 *   get:
 *     summary: Xem dịch vụ đã gán cho phòng
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền ROOM_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về danh sách dịch vụ đã gán cho phòng, JOIN thông tin service_name, price.
 *     tags: [3.4 Quản lý phòng khám & tài nguyên]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         example: "ROOM_abc"
 *     responses:
 *       200:
 *         description: Lấy danh sách dịch vụ thành công
 *       404:
 *         description: Phòng không tồn tại
 */
medicalRoomRoutes.get('/:roomId/services',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('ROOM_VIEW'),
    RoomServiceController.getServicesByRoom
);

/**
 * @swagger
 * /api/medical-rooms/{roomId}/services/{facilityServiceId}:
 *   delete:
 *     summary: Gỡ 1 dịch vụ khỏi phòng
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền ROOM_UPDATE.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       **Mô tả chi tiết:**
 *       - Xoá mapping giữa phòng và 1 dịch vụ cụ thể.
 *     tags: [3.4 Quản lý phòng khám & tài nguyên]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         example: "ROOM_abc"
 *       - in: path
 *         name: facilityServiceId
 *         required: true
 *         schema:
 *           type: string
 *         example: "FS_abc123"
 *     responses:
 *       200:
 *         description: Gỡ dịch vụ thành công
 *       404:
 *         description: Dịch vụ chưa được gán cho phòng
 */
medicalRoomRoutes.delete('/:roomId/services/:facilityServiceId',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('ROOM_UPDATE'),
    RoomServiceController.removeService
);

/**
 * @swagger
 * /api/medical-rooms/{id}:
 *   get:
 *     summary: 3. Lấy chi tiết 1 Phòng
 *     description: |
 *       **Mục đích:** Xem setup chi tiết của 1 phòng.
 *       **Phân quyền:** Yêu cầu quyền `ROOM_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Doctor, Nurse, Pharmacist
 *     tags: [2.4 Quản lý Không gian/Phòng khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "ROOM_abc"
 *     responses:
 *       200:
 *         description: Xem chi tiết OK.
 *       404:
 *         description: Không thấy room (ROOM_001).
 */
medicalRoomRoutes.get('/:id',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('ROOM_VIEW'),
    MedicalRoomController.getMedicalRoomById
);

/**
 * @swagger
 * /api/medical-rooms:
 *   post:
 *     summary: 4. Tạo mới Phòng
 *     description: |
 *       **Mục đích:** Khởi tạo một buồng phòng, phòng khám bệnh mới. **BẮT BUỘC** gán vào 1 Chi nhánh. Mọi thao tác này đều có Audit Log.
 *       **Phân quyền:** Yêu cầu quyền `ROOM_CREATE`.
 *       **Vai trò được phép:** Admin, Staff
 *     tags: [2.4 Quản lý Không gian/Phòng khám]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - branch_id
 *               - code
 *               - name
 *               - room_type
 *             properties:
 *               branch_id:
 *                 type: string
 *                 example: "BRN_123"
 *                 description: "ID Chi nhánh"
 *               department_id:
 *                 type: string
 *                 example: "DEPT_456"
 *                 description: "(Tùy chọn) ID Khoa phòng trực quản. NẾU CÓ TRUYỀN, hệ thống sẽ check xem Khoa này có nằm chung bên trong Chi nhánh truyền ở trên hay không."
 *               code:
 *                 type: string
 *                 example: "P101"
 *                 description: "Mã phòng (Phải DUY NHẤT trong cùng 1 Chi nhánh)"
 *               name:
 *                 type: string
 *                 example: "Phòng Khám Nội Số 1"
 *                 description: "Tên hiển thị phòng"
 *               room_type:
 *                 type: string
 *                 enum: [CONSULTATION, LAB, IMAGING, OPERATING]
 *                 example: "CONSULTATION"
 *                 description: "Loại hình chuyên môn phòng (Khám, Xét nghiệm, CĐ Hình ảnh...)"
 *               capacity:
 *                 type: integer
 *                 example: 1
 *                 description: "Sức chứa cùng lúc bệnh nhân (Mặc định 1)"
 *     responses:
 *       201:
 *         description: Tạo mới phòng thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Tạo phòng khám/chức năng thành công"
 *                 data:
 *                   medical_room_id: "ROOM_abcd1234"
 *       400:
 *         description: Lỗi đầu vào (trùng mã phòng CODE_EXISTS trong chi nhánh, chi nhánh không tồn tại).
 */
medicalRoomRoutes.post('/',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('ROOM_CREATE'),
    MedicalRoomController.createMedicalRoom
);

/**
 * @swagger
 * /api/medical-rooms/{id}:
 *   put:
 *     summary: 5. Cập nhật thông tin Phòng
 *     description: |
 *       **Mục đích:** Sửa đổi ngoại trừ mã khóa Code và nơi đặt phòng Branch. (Nếu muốn chuyển Chi nhánh, vui lòng tạo mới phòng khác).
 *       Bạn có quyền cập nhập `department_id` của nó sang Khoa khác.
 *       **Phân quyền:** Yêu cầu quyền `ROOM_UPDATE`.
 *       **Vai trò được phép:** Admin, Staff
 *     tags: [2.4 Quản lý Không gian/Phòng khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "ROOM_abc"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               department_id:
 *                 type: string
 *                 example: "DEPT_KHAC"
 *                 description: "Bạn có thể gửi giá trị null hoặc rỗng để gỡ phòng ra khỏi khoa, trở thành phòng tiếp tân chung ở chi nhánh"
 *               name:
 *                 type: string
 *                 example: "Phòng Nội 1 (VIP)"
 *               room_type:
 *                 type: string
 *                 enum: [CONSULTATION, LAB, IMAGING, OPERATING]
 *               capacity:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: OK.
 */
medicalRoomRoutes.put('/:id',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('ROOM_UPDATE'),
    MedicalRoomController.updateMedicalRoom
);

/**
 * @swagger
 * /api/medical-rooms/{id}/status:
 *   patch:
 *     summary: 6. Cập nhật trạng thái Phòng
 *     description: |
 *       **Mục đích:** Chuyển sang MAINTENANCE hoặc INACTIVE dễ dàng.
 *       **Phân quyền:** Yêu cầu quyền `ROOM_UPDATE`.
 *       **Vai trò được phép:** Admin, Staff
 *     tags: [2.4 Quản lý Không gian/Phòng khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "ROOM_abc"
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
 *                 enum: [ACTIVE, MAINTENANCE, INACTIVE]
 *                 example: "MAINTENANCE"
 *     responses:
 *       200:
 *         description: OK.
 */
medicalRoomRoutes.patch('/:id/status',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('ROOM_UPDATE'),
    MedicalRoomController.changeMedicalRoomStatus
);

/**
 * @swagger
 * /api/medical-rooms/{id}:
 *   delete:
 *     summary: 7. Xóa phòng (Soft Delete)
 *     description: |
 *       **Mục đích:** Đóng vĩnh viễn không gian vật lý này. Cập nhật `deleted_at`.
 *       **Phân quyền:** Yêu cầu quyền `ROOM_DELETE`.
 *       **Vai trò được phép:** Admin, Staff
 *     tags: [2.4 Quản lý Không gian/Phòng khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "ROOM_abc"
 *     responses:
 *       200:
 *         description: OK.
 */
medicalRoomRoutes.delete('/:id',
    verifyAccessToken,
    authorizeApi,
    authorizePermissions('ROOM_DELETE'),
    MedicalRoomController.deleteMedicalRoom
);

export default medicalRoomRoutes;
