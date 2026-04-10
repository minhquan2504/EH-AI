import { Router } from 'express';
import { InsuranceProviderController } from '../../controllers/Patient Management/insurance-provider.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';

const router = Router();

/**
 * @swagger
 * /api/insurance-providers:
 *   get:
 *     summary: Lấy danh sách Đơn vị Bảo hiểm
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền INSURANCE_VIEW.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở, Lễ tân, Bác sĩ.
 *
 *       Trả về danh sách các đơn vị cung cấp bảo hiểm trong hệ thống.
 *       Hỗ trợ tìm kiếm theo tên/mã, lọc theo loại hình và trạng thái hoạt động.
 *     tags: [2.3.1 Quản lý Đơn vị Bảo hiểm]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo mã hoặc tên đơn vị
 *         example: "Bảo Việt"
 *       - in: query
 *         name: insurance_type
 *         schema:
 *           type: string
 *           enum: [STATE, PRIVATE]
 *         description: Lọc theo loại hình (STATE = BHYT, PRIVATE = Tư nhân)
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Lọc theo trạng thái hoạt động
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
 *         description: Số lượng mỗi trang
 *     responses:
 *       200:
 *         description: Trả về danh sách đơn vị bảo hiểm
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
 *                           insurance_providers_id:
 *                             type: string
 *                           provider_code:
 *                             type: string
 *                             example: "BHYT"
 *                           provider_name:
 *                             type: string
 *                             example: "Bảo hiểm Y tế Việt Nam"
 *                           insurance_type:
 *                             type: string
 *                             example: "STATE"
 *                           is_active:
 *                             type: boolean
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/', verifyAccessToken, checkSessionStatus, authorizePermissions('INSURANCE_VIEW'), InsuranceProviderController.getProviders);

/**
 * @swagger
 * /api/insurance-providers/{id}:
 *   get:
 *     summary: Chi tiết một Đơn vị Bảo hiểm
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền INSURANCE_VIEW.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở, Lễ tân, Bác sĩ.
 *
 *       Trả về thông tin chi tiết của đơn vị bảo hiểm bao gồm liên lạc, ghi chú thủ tục.
 *     tags: [2.3.1 Quản lý Đơn vị Bảo hiểm]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đơn vị bảo hiểm
 *         example: "PRV_1709614800000_abc123"
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy đơn vị bảo hiểm
 */
router.get('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('INSURANCE_VIEW'), InsuranceProviderController.getProviderById);

/**
 * @swagger
 * /api/insurance-providers:
 *   post:
 *     summary: Tạo mới Đơn vị Bảo hiểm
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền INSURANCE_CREATE.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở.
 *
 *       Thêm một đơn vị cung cấp bảo hiểm mới vào danh mục hệ thống.
 *       Mã đơn vị (provider_code) phải là duy nhất trên toàn hệ thống.
 *     tags: [2.3.1 Quản lý Đơn vị Bảo hiểm]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider_code
 *               - provider_name
 *               - insurance_type
 *             properties:
 *               provider_code:
 *                 type: string
 *                 description: Mã đơn vị (duy nhất, tự động uppercase)
 *                 example: "PVI"
 *               provider_name:
 *                 type: string
 *                 description: Tên đầy đủ đơn vị bảo hiểm
 *                 example: "Bảo hiểm PVI"
 *               insurance_type:
 *                 type: string
 *                 enum: [STATE, PRIVATE]
 *                 description: Loại hình bảo hiểm
 *                 example: "PRIVATE"
 *               contact_phone:
 *                 type: string
 *                 example: "1900545458"
 *               contact_email:
 *                 type: string
 *                 example: "contact@pvi.com.vn"
 *               address:
 *                 type: string
 *                 example: "Tầng 15, Tòa nhà PVI, Hà Nội"
 *               support_notes:
 *                 type: string
 *                 description: Ghi chú về thủ tục thanh toán bảo hiểm
 *                 example: "Yêu cầu hóa đơn VAT và Giấy ra viện bản gốc"
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Mã đơn vị đã tồn tại hoặc dữ liệu không hợp lệ
 */
router.post('/', verifyAccessToken, checkSessionStatus, authorizePermissions('INSURANCE_CREATE'), InsuranceProviderController.createProvider);

/**
 * @swagger
 * /api/insurance-providers/{id}:
 *   put:
 *     summary: Cập nhật Đơn vị Bảo hiểm
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền INSURANCE_UPDATE.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở.
 *
 *       Cập nhật thông tin liên lạc, tên, trạng thái hoạt động của đơn vị bảo hiểm.
 *       Nếu thay đổi provider_code, hệ thống sẽ kiểm tra trùng lặp trước khi lưu.
 *     tags: [2.3.1 Quản lý Đơn vị Bảo hiểm]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đơn vị bảo hiểm
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               provider_name:
 *                 type: string
 *                 example: "Bảo hiểm PVI (Cập nhật)"
 *               contact_phone:
 *                 type: string
 *                 example: "1900123456"
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Mã đơn vị trùng lặp
 *       404:
 *         description: Không tìm thấy đơn vị bảo hiểm
 */
router.put('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('INSURANCE_UPDATE'), InsuranceProviderController.updateProvider);

/**
 * @swagger
 * /api/insurance-providers/{id}:
 *   delete:
 *     summary: Vô hiệu hóa Đơn vị Bảo hiểm (Soft Disable)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền INSURANCE_DELETE.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở.
 *
 *       Không xóa vật lý để tránh mất dữ liệu thẻ bệnh nhân đã liên kết.
 *       Chỉ chuyển trạng thái is_active = false, đơn vị sẽ không hiển thị
 *       khi tạo thẻ bảo hiểm mới cho bệnh nhân.
 *     tags: [2.3.1 Quản lý Đơn vị Bảo hiểm]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID đơn vị bảo hiểm
 *     responses:
 *       200:
 *         description: Vô hiệu hóa thành công
 *       404:
 *         description: Không tìm thấy đơn vị bảo hiểm
 */
router.delete('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('INSURANCE_DELETE'), InsuranceProviderController.disableProvider);

export default router;
