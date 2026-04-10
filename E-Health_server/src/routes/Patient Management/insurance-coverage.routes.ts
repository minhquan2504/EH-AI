import { Router } from 'express';
import { InsuranceCoverageController } from '../../controllers/Patient Management/insurance-coverage.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const router = Router();

/**
 * @swagger
 * /api/insurance-coverage:
 *   get:
 *     summary: Lấy danh sách tỷ lệ chi trả bảo hiểm
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền INSURANCE_COVERAGE_VIEW.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *
 *       Trả về danh sách cấu hình tỷ lệ chi trả bảo hiểm có phân trang.
 *       Hỗ trợ lọc theo đơn vị bảo hiểm (provider_id).
 *       Mỗi bản ghi bao gồm tên đơn vị bảo hiểm (JOIN từ insurance_providers).
 *     tags: [2.3.4 Tỷ lệ Chi trả Bảo hiểm]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: provider_id
 *         schema:
 *           type: string
 *         description: Lọc theo đơn vị bảo hiểm
 *         example: "PRV_260311_a1b2c3"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/', verifyAccessToken, checkSessionStatus, authorizePermissions('INSURANCE_COVERAGE_VIEW'), InsuranceCoverageController.getCoverages);

/**
 * @swagger
 * /api/insurance-coverage:
 *   post:
 *     summary: Tạo tỷ lệ chi trả bảo hiểm
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền INSURANCE_COVERAGE_CREATE.
 *       **Vai trò được phép:** Admin, Staff.
 *
 *       Tạo cấu hình tỷ lệ chi trả mới gắn với đơn vị bảo hiểm.
 *       Tên gói phải là duy nhất trong cùng 1 đơn vị bảo hiểm.
 *       Tỷ lệ chi trả phải nằm trong khoảng 0 - 100.
 *     tags: [2.3.4 Tỷ lệ Chi trả Bảo hiểm]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - coverage_name
 *               - provider_id
 *               - coverage_percent
 *             properties:
 *               coverage_name:
 *                 type: string
 *                 description: Tên gói chi trả (VD "BHYT cơ bản", "VIP Gold")
 *                 example: "BHYT cơ bản"
 *               provider_id:
 *                 type: string
 *                 description: ID đơn vị bảo hiểm (FK insurance_providers)
 *                 example: "PRV_260311_a1b2c3"
 *               coverage_percent:
 *                 type: number
 *                 description: Tỷ lệ chi trả (0-100)
 *                 example: 80
 *               description:
 *                 type: string
 *                 description: Ghi chú
 *                 example: "Áp dụng cho BHYT nhà nước, mức hưởng 80%"
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thiếu thông tin bắt buộc / Trùng tên / Tỷ lệ không hợp lệ
 *       404:
 *         description: Không tìm thấy đơn vị bảo hiểm
 */
router.post('/', verifyAccessToken, checkSessionStatus, authorizePermissions('INSURANCE_COVERAGE_CREATE'), InsuranceCoverageController.createCoverage);

/**
 * @swagger
 * /api/insurance-coverage/{id}:
 *   put:
 *     summary: Cập nhật tỷ lệ chi trả bảo hiểm
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền INSURANCE_COVERAGE_UPDATE.
 *       **Vai trò được phép:** Admin, Staff.
 *
 *       Cập nhật thông tin gói tỷ lệ chi trả. Hỗ trợ sửa tên, provider, tỷ lệ %, trạng thái.
 *     tags: [2.3.4 Tỷ lệ Chi trả Bảo hiểm]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tỷ lệ chi trả
 *         example: "COV_260311_a1b2c3"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coverage_name:
 *                 type: string
 *                 example: "BHYT nâng cao"
 *               coverage_percent:
 *                 type: number
 *                 example: 90
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Trùng tên / Tỷ lệ không hợp lệ
 *       404:
 *         description: Không tìm thấy tỷ lệ chi trả
 */
router.put('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('INSURANCE_COVERAGE_UPDATE'), InsuranceCoverageController.updateCoverage);

/**
 * @swagger
 * /api/insurance-coverage/{id}:
 *   delete:
 *     summary: Xóa tỷ lệ chi trả bảo hiểm
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền INSURANCE_COVERAGE_DELETE.
 *       **Vai trò được phép:** Admin.
 *
 *       Xóa vĩnh viễn cấu hình tỷ lệ chi trả.
 *     tags: [2.3.4 Tỷ lệ Chi trả Bảo hiểm]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tỷ lệ chi trả cần xóa
 *         example: "COV_260311_a1b2c3"
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy tỷ lệ chi trả
 */
router.delete('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('INSURANCE_COVERAGE_DELETE'), InsuranceCoverageController.deleteCoverage);

export default router;
