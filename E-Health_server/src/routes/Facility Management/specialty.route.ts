import { Router } from 'express';
import { SpecialtyController } from '../../controllers/Facility Management/specialty.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const specialtyRouter = Router();

specialtyRouter.use(verifyAccessToken);
specialtyRouter.use(checkSessionStatus);

/**
 * @swagger
 * /api/specialties:
 *   get:
 *     summary: Lấy danh sách chuyên khoa
 *     description: |
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF
 *
 *       Trả về danh sách chuyên khoa với hỗ trợ phân trang và tìm kiếm.
 *       **Yêu cầu:**
 *       - Access Token hợp lệ (Bearer Token)
 *       - Quyền: ADMIN hoặc SYSTEM
 *       - Hỗ trợ tìm kiếm theo mã (code) hoặc tên (name)
 *     operationId: getSpecialties
 *     tags: [1.5.1 Quản lý danh mục chuyên khoa]
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Số trang hiện tại (bắt đầu từ 1)
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *           example: 1
 *       - name: limit
 *         in: query
 *         description: Số lượng bản ghi trên mỗi trang
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *           example: 10
 *       - name: searchKeyword
 *         in: query
 *         description: Từ khóa tìm kiếm (tìm theo code hoặc name)
 *         required: false
 *         schema:
 *           type: string
 *           example: CARDIOLOGY
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
 *                   example: Lấy dữ liệu chuyên khoa thành công.
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       specialties_id:
 *                         type: string
 *                         example: SPC_2603_a1b2c3d4
 *                       code:
 *                         type: string
 *                         example: CARDIOLOGY
 *                       name:
 *                         type: string
 *                         example: Khoa Tim Mạch
 *                       description:
 *                         type: string
 *                         example: Chuyên điều trị các bệnh lý về tim mạch
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *       400:
 *         description: Dữ liệu tìm kiếm không hợp lệ
 *       401:
 *         description: Không được phép - Token không hợp lệ hoặc hết hạn hoặc không được cung cấp
 *       403:
 *         description: Cấm truy cập - Không có quyền ADMIN hoặc SYSTEM
 *       500:
 *         description: Lỗi hệ thống
 *     security:
 *       - bearerAuth: []
 */
specialtyRouter.get('/', authorizePermissions('SPECIALTY_VIEW', 'SPECIALTY_VIEW_ALL'), SpecialtyController.getSpecialties);

/**
 * @swagger
 * /api/specialties/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết một chuyên khoa
 *     description: |
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST, STAFF
 *
 *       Trả về thông tin chi tiết của chuyên khoa theo ID.
 *       **Yêu cầu:**
 *       - Access Token hợp lệ (Bearer Token)
 *       - Quyền: ADMIN hoặc SYSTEM
 *     operationId: getSpecialtyById
 *     tags: [1.5.1 Quản lý danh mục chuyên khoa]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID của chuyên khoa
 *         schema:
 *           type: string
 *           example: SPC_2603_a1b2c3d4
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
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
 *                   example: Lấy dữ liệu chuyên khoa thành công.
 *                 data:
 *                   type: object
 *                   properties:
 *                     specialties_id:
 *                       type: string
 *                       example: SPC_2603_a1b2c3d4
 *                     code:
 *                       type: string
 *                       example: CARDIOLOGY
 *                     name:
 *                       type: string
 *                       example: Khoa Tim Mạch
 *                     description:
 *                       type: string
 *                       example: Chuyên điều trị các bệnh lý về tim mạch
 *       401:
 *         description: Không được phép - Token không hợp lệ hoặc hết hạn hoặc không được cung cấp
 *       403:
 *         description: Cấm truy cập - Không có quyền ADMIN hoặc SYSTEM
 *       404:
 *         description: Không tìm thấy chuyên khoa với ID được chỉ định
 *       500:
 *         description: Lỗi hệ thống
 *     security:
 *       - bearerAuth: []
 */
specialtyRouter.get('/:id', authorizePermissions('SPECIALTY_VIEW'), SpecialtyController.getSpecialtyById);

/**
 * @swagger
 * /api/specialties:
 *   post:
 *     summary: Tạo mới chuyên khoa
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *       Tạo một chuyên khoa mới.
 *       **Yêu cầu:**
 *       - Access Token hợp lệ (Bearer Token)
 *       - Quyền: ADMIN hoặc SYSTEM
 *       - Mã (code) phải là duy nhất
 *       - Tên (name) là bắt buộc
 *     operationId: createSpecialty
 *     tags: [1.5.1 Quản lý danh mục chuyên khoa]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *             properties:
 *               code:
 *                 type: string
 *                 description: Mã chuyên khoa (duy nhất, không khoảng trắng)
 *                 example: PEDIATRICS
 *               name:
 *                 type: string
 *                 description: Tên chuyên khoa
 *                 example: Khoa Nhi
 *               description:
 *                 type: string
 *                 description: Mô tả chi tiết về chuyên khoa
 *                 example: Chuyên khám và điều trị bệnh cho trẻ em
 *     responses:
 *       201:
 *         description: Tạo chuyên khoa thành công
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
 *                   example: Tạo mới chuyên khoa thành công.
 *                 data:
 *                   type: object
 *                   properties:
 *                     specialties_id:
 *                       type: string
 *                       example: SPC_2603_a1b2c3d4
 *                     code:
 *                       type: string
 *                       example: PEDIATRICS
 *                     name:
 *                       type: string
 *                       example: Khoa Nhi
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ (thiếu trường bắt buộc hoặc dữ liệu không đúng định dạng)
 *       401:
 *         description: Không được phép - Token không hợp lệ hoặc hết hạn hoặc không được cung cấp
 *       403:
 *         description: Cấm truy cập - Không có quyền ADMIN hoặc SYSTEM
 *       409:
 *         description: Mã chuyên khoa đã tồn tại trong hệ thống
 *       500:
 *         description: Lỗi hệ thống
 *     security:
 *       - bearerAuth: []
 */
specialtyRouter.post('/', authorizePermissions('SPECIALTY_CREATE'), SpecialtyController.createSpecialty);

/**
 * @swagger
 * /api/specialties/{id}:
 *   put:
 *     summary: Cập nhật thông tin chuyên khoa
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *       Cập nhật thông tin chuyên khoa.
 *       **Yêu cầu:**
 *       - Access Token hợp lệ (Bearer Token)
 *       - Quyền: ADMIN hoặc SYSTEM
 *       - Không thể thay đổi mã (code) nếu chuyên khoa đó đã có bác sĩ trực thuộc
 *       - Mã mới phải là duy nhất (nếu cập nhật)
 *     operationId: updateSpecialty
 *     tags: [1.5.1 Quản lý danh mục chuyên khoa]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID của chuyên khoa cần cập nhật
 *         schema:
 *           type: string
 *           example: SPC_2603_a1b2c3d4
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *             properties:
 *               code:
 *                 type: string
 *                 description: Mã chuyên khoa (không thể đổi nếu có bác sĩ trực thuộc)
 *                 example: PEDIATRICS_V2
 *               name:
 *                 type: string
 *                 description: Tên chuyên khoa
 *                 example: Khoa Nhi Tổng Hợp
 *               description:
 *                 type: string
 *                 description: Mô tả chi tiết về chuyên khoa
 *                 example: Khám và điều trị toàn diện cho trẻ em
 *     responses:
 *       200:
 *         description: Cập nhật chuyên khoa thành công
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
 *                   example: Cập nhật chuyên khoa thành công.
 *                 data:
 *                   type: object
 *                   properties:
 *                     specialties_id:
 *                       type: string
 *                     code:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ hoặc không thể đổi mã vì đã có bác sĩ trực thuộc
 *       401:
 *         description: Không được phép - Token không hợp lệ hoặc hết hạn hoặc không được cung cấp
 *       403:
 *         description: Cấm truy cập - Không có quyền ADMIN hoặc SYSTEM
 *       404:
 *         description: Không tìm thấy chuyên khoa với ID được chỉ định
 *       409:
 *         description: Mã chuyên khoa mới bị trùng với chuyên khoa khác
 *       500:
 *         description: Lỗi hệ thống
 *     security:
 *       - bearerAuth: []
 */
specialtyRouter.put('/:id', authorizePermissions('SPECIALTY_UPDATE'), SpecialtyController.updateSpecialty);

/**
 * @swagger
 * /api/specialties/{id}:
 *   delete:
 *     summary: Xóa chuyên khoa (Xóa mềm)
 *     description: |
 *       **Vai trò được phép:** ADMIN, STAFF
 *
 *       Thực hiện xóa mềm chuyên khoa bằng cách cập nhật cột deleted_at.
 *       **Yêu cầu:**
 *       - Access Token hợp lệ (Bearer Token)
 *       - Quyền: ADMIN hoặc SYSTEM
 *       - Bị chặn nếu chuyên khoa đang có bác sĩ trực thuộc
 *     operationId: deleteSpecialty
 *     tags: [1.5.1 Quản lý danh mục chuyên khoa]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID của chuyên khoa cần xóa
 *         schema:
 *           type: string
 *           example: SPC_2603_a1b2c3d4
 *     responses:
 *       200:
 *         description: Xóa chuyên khoa thành công
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
 *                   example: Xóa chuyên khoa thành công.
 *       400:
 *         description: Không thể xóa do đã có bác sĩ trực thuộc chuyên khoa này
 *       401:
 *         description: Không được phép - Token không hợp lệ hoặc hết hạn hoặc không được cung cấp
 *       403:
 *         description: Cấm truy cập - Không có quyền ADMIN hoặc SYSTEM
 *       404:
 *         description: Không tìm thấy chuyên khoa với ID được chỉ định
 *       500:
 *         description: Lỗi hệ thống
 *     security:
 *       - bearerAuth: []
 */
specialtyRouter.delete('/:id', authorizePermissions('SPECIALTY_DELETE'), SpecialtyController.deleteSpecialty);

export default specialtyRouter;