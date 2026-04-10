import { Router } from 'express';
import multer from 'multer';
import { SystemFacilityController } from '../../controllers/Core/system-facility.controller';
import { SystemSettingsController } from '../../controllers/Core/system-settings.controller';
import { BusinessRulesController } from '../../controllers/Core/business-rules.controller';
import { SecuritySettingsController } from '../../controllers/Core/security-settings.controller';
import { I18nSettingsController } from '../../controllers/Core/i18n-settings.controller';
import { UiSettingsController } from '../../controllers/Core/ui-settings.controller';
import { SystemParamsController } from '../../controllers/Core/system-params.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { CLOUDINARY_CONFIG } from '../../constants/system.constant';
import { ConfigPermissionsController } from '../../controllers/Core/config-permissions.controller';
import { checkConfigPermission } from '../../middleware/checkConfigPermission.middleware';
import auditLogRoutes from './audit-log.routes';

const systemRoutes = Router();

// Multer dùng memoryStorage để upload buffer thẳng lên Cloudinary (không lưu disk)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: CLOUDINARY_CONFIG.MAX_FILE_SIZE },
});

const requireAdmin = [verifyAccessToken, checkSessionStatus, authorizePermissions('SYSTEM_CONFIG_VIEW', 'SYSTEM_CONFIG_UPDATE')];

// 1.8 QUẢN LÝ NHẬT KÝ HỆ THỐNG (AUDIT LOGS)
systemRoutes.use('/audit-logs', auditLogRoutes);

// 1.4.8 – PHÂN QUYỀN CHỈNH SỬA CẤU HÌNH

/**
 * @swagger
 * /api/system/config-permissions:
 *   get:
 *     summary: Lấy danh sách phân quyền chỉnh sửa cấu hình
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Trả về danh sách mapping chi tiết các vai trò (role) nào được quyền chỉnh sửa nhóm cấu hình (module) nào trong hệ thống.
 *     tags: [1.4.8 Phân quyền chỉnh sửa cấu hình]
 *     security:
 *       - bearerAuth: []
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
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       type: string
 *                   example:
 *                     ADMIN: ["GENERAL", "APPOINTMENT", "SECURITY", "I18N", "UI", "WORKING_HOURS"]
 *                     DOCTOR: ["APPOINTMENT"]
 *                     NURSE: []
 *       401:
 *         description: Chưa xác thực token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Không có quyền truy cập (Yêu cầu quyền ADMIN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
systemRoutes.get('/config-permissions', ...requireAdmin, ConfigPermissionsController.getConfigPermissions);

/**
 * @swagger
 * /api/system/config-permissions:
 *   put:
 *     summary: Cập nhật phân quyền chỉnh sửa cấu hình
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Cập nhật lại quyền chỉnh sửa các module cấu hình cho từng vai trò. Dữ liệu gửi lên sẽ ghi đè (replace) cấu hình cũ.
 *       
 *       **Ràng buộc nghiệp vụ (Business Rules):**
 *       - `role_code` phải tồn tại trong danh sách hợp lệ (VD: `ADMIN`, `DOCTOR`, `NURSE`, `PATIENT`, `CUSTOMER`).
 *       - `module` phải thuộc danh sách module hệ thống (VD: `GENERAL`, `APPOINTMENT`, `SECURITY`, `I18N`, `UI`, `WORKING_HOURS`).
 *       - Riêng vai trò **ADMIN** bắt buộc phải giữ quyền trên module **SECURITY** để tránh mất quyền kiểm soát hệ thống.
 *     tags: [1.4.8 Phân quyền chỉnh sửa cấu hình]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissions
 *             properties:
 *               permissions:
 *                 type: object
 *                 description: Map giữa Role Code và mảng các Module được cấp quyền
 *                 additionalProperties:
 *                   type: array
 *                   items:
 *                     type: string
 *             example:
 *               permissions:
 *                 ADMIN: ["GENERAL", "APPOINTMENT", "SECURITY", "I18N", "UI", "WORKING_HOURS"]
 *                 DOCTOR: ["APPOINTMENT", "WORKING_HOURS"]
 *                 NURSE: []
 *     responses:
 *       200:
 *         description: Cập nhật thành công, trả về cấu hình mới nhất
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
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       type: string
 *       400:
 *         description: |
 *           Dữ liệu đầu vào không hợp lệ hoặc vi phạm quy tắc nghiệp vụ:
 *           - **SYS_CFG_001**: ADMIN phải giữ quyền chỉnh sửa module SECURITY.
 *           - **SYS_CFG_002**: Role code không tồn tại.
 *           - **SYS_CFG_003**: Tên module không hợp lệ.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Chưa xác thực token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Không có quyền thực hiện (Yêu cầu quyền ADMIN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
systemRoutes.put('/config-permissions', ...requireAdmin, ConfigPermissionsController.updateConfigPermissions);

// QUẢN LÝ THAM SỐ HỆ THỐNG THEO MODULE

/**
 * @swagger
 * /api/system/settings/modules:
 *   get:
 *     summary: Lấy danh sách module (dropdown filter)
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Trả về danh sách các module distinct từ bảng system_settings.
 *     tags: [1.4.7 Quản lý tham số hệ thống]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách module
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["APPOINTMENT", "I18N", "SECURITY", "UI"]
 */
systemRoutes.get('/settings/modules', ...requireAdmin, SystemParamsController.getDistinctModules);

/**
 * @swagger
 * /api/system/settings:
 *   get:
 *     summary: Lấy tất cả tham số hệ thống (phân trang)
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *     tags: [1.4.7 Quản lý tham số hệ thống]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *         example: "SECURITY"
 *         description: Lọc theo module
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         example: "password"
 *         description: Tìm kiếm theo key hoặc description
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         example: 20
 *     responses:
 *       200:
 *         description: Danh sách settings phân trang
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       setting_key:
 *                         type: string
 *                         example: "MAX_LOGIN_ATTEMPTS"
 *                       setting_value:
 *                         type: object
 *                         example: {"value": 5}
 *                       module:
 *                         type: string
 *                         example: "SECURITY"
 *                       is_protected:
 *                         type: boolean
 *                         example: true
 *                 total:
 *                   type: integer
 *                   example: 30
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 2
 */
systemRoutes.get('/settings', ...requireAdmin, SystemParamsController.listSettings);

/**
 * @swagger
 * /api/system/settings:
 *   post:
 *     summary: Tạo tham số hệ thống mới
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *     tags: [1.4.7 Quản lý tham số hệ thống]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [setting_key, setting_value]
 *             properties:
 *               setting_key:
 *                 type: string
 *                 example: "MY_CUSTOM_PARAM"
 *               setting_value:
 *                 type: object
 *                 example: {"value": "custom_value"}
 *               module:
 *                 type: string
 *                 example: "GENERAL"
 *               description:
 *                 type: string
 *                 example: "Tham số tuỳ chỉnh"
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       409:
 *         description: SYS_SET_001 – Key đã tồn tại
 */
systemRoutes.post('/settings', ...requireAdmin, checkConfigPermission(), SystemParamsController.createSetting);

/**
 * @swagger
 * /api/system/settings/{key}:
 *   get:
 *     summary: Lấy 1 tham số theo key
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *     tags: [1.4.7 Quản lý tham số hệ thống]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         example: "MAX_LOGIN_ATTEMPTS"
 *     responses:
 *       200:
 *         description: Chi tiết setting
 *       404:
 *         description: SYS_SET_002 – Không tìm thấy
 */
systemRoutes.get('/settings/:key', ...requireAdmin, SystemParamsController.getSettingByKey);

/**
 * @swagger
 * /api/system/settings/{key}:
 *   put:
 *     summary: Cập nhật giá trị tham số
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *     tags: [1.4.7 Quản lý tham số hệ thống]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         example: "MY_CUSTOM_PARAM"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [setting_value]
 *             properties:
 *               setting_value:
 *                 type: object
 *                 example: {"value": "updated_value"}
 *               description:
 *                 type: string
 *                 example: "Giá trị đã được cập nhật"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: SYS_SET_002 – Không tìm thấy
 */
systemRoutes.put('/settings/:key', ...requireAdmin, checkConfigPermission(), SystemParamsController.updateSetting);

/**
 * @swagger
 * /api/system/settings/{key}:
 *   delete:
 *     summary: Xóa tham số (non-protected)
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Chỉ xóa được các setting do người dùng tự tạo. Các setting hệ thống sẽ trả về 403.
 *     tags: [1.4.7 Quản lý tham số hệ thống]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         example: "MY_CUSTOM_PARAM"
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       403:
 *         description: SYS_SET_003 – Setting được bảo vệ, không thể xóa
 *       404:
 *         description: SYS_SET_002 – Không tìm thấy
 */
systemRoutes.delete('/settings/:key', ...requireAdmin, checkConfigPermission(), SystemParamsController.deleteSetting);

// CẤU HÌNH HIỂN Thị GIAO DIỆN CHUNG

/**
 * @swagger
 * /api/system/ui-settings:
 *   get:
 *     summary: Lấy cấu hình giao diện hiện tại
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Trả về toàn bộ các thiết lập hiển thị gồm theme, màu sắc, font, định dạng ngày tháng, múi giờ và format giờ.
 *     tags: [1.4.6 Cấu hình giao diện]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cấu hình giao diện hiện tại
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
 *                     theme:
 *                       type: string
 *                       example: "light"
 *                       description: "light | dark | system"
 *                     primary_color:
 *                       type: string
 *                       example: "#1677FF"
 *                       description: Màu chủ đạo (hex #RRGGBB)
 *                     font_family:
 *                       type: string
 *                       example: "Inter"
 *                     date_format:
 *                       type: string
 *                       example: "DD/MM/YYYY"
 *                     timezone:
 *                       type: string
 *                       example: "Asia/Ho_Chi_Minh"
 *                     time_format:
 *                       type: string
 *                       example: "24h"
 *       401:
 *         description: Chưa xác thực
 */
systemRoutes.get('/ui-settings', ...requireAdmin, UiSettingsController.getUiSettings);

/**
 * @swagger
 * /api/system/ui-settings:
 *   put:
 *     summary: Cập nhật cấu hình giao diện
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Partial update: chỉ cần gửi các field muốn thay đổi.
 *
 *       **Validation rules:**
 *       - `theme`: `light` | `dark` | `system`
 *       - `primary_color`: định dạng hex 6 ký tự (ví dụ: `#2563EB`)
 *       - `font_family`: `Inter` | `Roboto` | `Open Sans` | `Noto Sans`
 *       - `date_format`: `DD/MM/YYYY` | `MM/DD/YYYY` | `YYYY-MM-DD`
 *       - `timezone`: whitelist 20 múi giờ phổ biến
 *       - `time_format`: `12h` | `24h`
 *     tags: [1.4.6 Cấu hình giao diện]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theme:
 *                 type: string
 *                 enum: [light, dark, system]
 *                 example: "dark"
 *               primary_color:
 *                 type: string
 *                 example: "#2563EB"
 *               font_family:
 *                 type: string
 *                 enum: [Inter, Roboto, Open Sans, Noto Sans]
 *                 example: "Roboto"
 *               date_format:
 *                 type: string
 *                 enum: [DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD]
 *                 example: "DD/MM/YYYY"
 *               timezone:
 *                 type: string
 *                 example: "Asia/Ho_Chi_Minh"
 *               time_format:
 *                 type: string
 *                 enum: [12h, 24h]
 *                 example: "24h"
 *           examples:
 *             darkMode:
 *               summary: Đổi sang chế độ tối
 *               value:
 *                 theme: "dark"
 *                 primary_color: "#2563EB"
 *             fullUpdate:
 *               summary: Cập nhật toàn bộ
 *               value:
 *                 theme: "light"
 *                 primary_color: "#1677FF"
 *                 font_family: "Inter"
 *                 date_format: "DD/MM/YYYY"
 *                 timezone: "Asia/Ho_Chi_Minh"
 *                 time_format: "24h"
 *             changeFont:
 *               summary: Chỉ đổi font chữ
 *               value:
 *                 font_family: "Roboto"
 *     responses:
 *       200:
 *         description: Cập nhật thành công, trả về UiSettings đầy đủ
 *       400:
 *         description: |
 *           Dữ liệu không hợp lệ:
 *           - SYS_UI_001: theme không hợp lệ
 *           - SYS_UI_002: primary_color sai định dạng hex
 *           - SYS_UI_003: font_family không hợp lệ
 *           - SYS_UI_004: date_format không hợp lệ
 *           - SYS_UI_005: timezone không hợp lệ
 *           - SYS_UI_006: time_format không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền Admin
 */
systemRoutes.put('/ui-settings', ...requireAdmin, checkConfigPermission('UI'), UiSettingsController.updateUiSettings);

// 1.4.5 – CẤU HÌNH ĐA NGÔN NGỮ

/**
 * @swagger
 * /api/system/i18n/supported:
 *   get:
 *     summary: Lấy danh sách ngôn ngữ có sẵn trong hệ thống
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Trả về 5 ngôn ngữ được hỏ trợ kèm trạng thái `is_active` (có nằm trong supported_languages không).
 *     tags: [1.4.5 Cấu hình đa ngôn ngữ]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách ngôn ngữ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                         example: "vi"
 *                       name:
 *                         type: string
 *                         example: "Tiếng Việt"
 *                       flag:
 *                         type: string
 *                         example: "🇻🇳"
 *                       is_active:
 *                         type: boolean
 *                         example: true
 *       401:
 *         description: Chưa xác thực
 */
systemRoutes.get('/i18n/supported', ...requireAdmin, I18nSettingsController.getSupportedLanguages);

/**
 * @swagger
 * /api/system/i18n:
 *   get:
 *     summary: Lấy cấu hình ngôn ngữ hiện tại
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Trả về ngôn ngữ mặc định và danh sách ngôn ngữ đang kích hoạt.
 *     tags: [1.4.5 Cấu hình đa ngôn ngữ]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cấu hình ngôn ngữ hiện tại
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
 *                     default_language:
 *                       type: string
 *                       example: "vi"
 *                     supported_languages:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["vi", "en"]
 *       401:
 *         description: Chưa xác thực
 */
systemRoutes.get('/i18n', ...requireAdmin, I18nSettingsController.getI18nConfig);

/**
 * @swagger
 * /api/system/i18n:
 *   put:
 *     summary: Cập nhật cấu hình ngôn ngữ
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Cập nhật ngôn ngữ mặc định và/hoặc danh sách ngôn ngữ đang bật.
 *
 *       **Validation rules:**
 *       - `supported_languages` phải là tập con của: `vi`, `en`, `zh`, `ko`, `ja`
 *       - `supported_languages` không được rỗng (tối thiểu 1 ngôn ngữ)
 *       - `default_language` phải nằm trong `supported_languages` sau khi cập nhật
 *     tags: [1.4.5 Cấu hình đa ngôn ngữ]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               default_language:
 *                 type: string
 *                 enum: [vi, en, zh, ko, ja]
 *                 example: "en"
 *               supported_languages:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["vi", "en"]
 *           examples:
 *             addEnglish:
 *               summary: Bật cả tiếng Việt và tiếng Anh
 *               value:
 *                 supported_languages: ["vi", "en"]
 *             switchToEnglish:
 *               summary: Đổi ngôn ngữ mặc định sang tiếng Anh
 *               value:
 *                 default_language: "en"
 *                 supported_languages: ["vi", "en"]
 *             fullI18n:
 *               summary: Bật 3 ngôn ngữ
 *               value:
 *                 default_language: "vi"
 *                 supported_languages: ["vi", "en", "zh"]
 *     responses:
 *       200:
 *         description: Cập nhật thành công, trả về I18nConfig mới
 *       400:
 *         description: |
 *           Dữ liệu không hợp lệ:
 *           - SYS_I18N_001: Mã ngôn ngữ không hợp lệ
 *           - SYS_I18N_002: default_language không trong supported_languages
 *           - SYS_I18N_003: supported_languages rỗng
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền Admin
 */
systemRoutes.put('/i18n', ...requireAdmin, checkConfigPermission('I18N'), I18nSettingsController.updateI18nConfig);

// 1.4.4 – CẤU HÌNH BẢO MẬT CƠ BẢN

/**
 * @swagger
 * /api/system/security-settings:
 *   get:
 *     summary: Lấy cấu hình bảo mật hiện tại
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Trả về toàn bộ cấu hình bảo mật hệ thống dưới dạng structured object.
 *       Nếu chưa được cấu hình, trả về giá trị mặc định an toàn.
 *     tags: [1.4.4 Cấu hình bảo mật]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cấu hình bảo mật hiện tại
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
 *                     max_login_attempts:
 *                       type: integer
 *                       example: 7
 *                       description: Số lần sai mật khẩu tối đa
 *                     lock_duration_minutes:
 *                       type: integer
 *                       example: 30
 *                       description: Thời gian khóa tài khoản (phút)
 *                     require_email_verification:
 *                       type: boolean
 *                       example: true
 *                       description: Bắt buộc xác thực email khi đăng ký
 *                     password_min_length:
 *                       type: integer
 *                       example: 8
 *                       description: Độ dài mật khẩu tối thiểu
 *                     session_duration_days:
 *                       type: integer
 *                       example: 14
 *                       description: Thời hạn phiên đăng nhập (ngày)
 *                     require_2fa_roles:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: []
 *                       description: Danh sách role bắt buộc xác thực 2 bước
 *                     access_token_expiry_minutes:
 *                       type: integer
 *                       example: 15
 *                       description: Thời hạn Access Token (phút)
 *                     refresh_token_expiry_days:
 *                       type: integer
 *                       example: 14
 *                       description: Thời hạn Refresh Token (ngày)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền Admin
 */
systemRoutes.get('/security-settings', ...requireAdmin, SecuritySettingsController.getSecurityConfig);

/**
 * @swagger
 * /api/system/security-settings:
 *   put:
 *     summary: Cập nhật cấu hình bảo mật
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Partial update: chỉ cần gửi các field muốn thay đổi.
 *
 *       **Validation rules:**
 *       - `password_min_length`: 8–32
 *       - `session_duration_days`: 1–365 ngày
 *       - `access_token_expiry_minutes`: 5–1440 phút
 *       - `refresh_token_expiry_days`: 1–365 ngày
 *       - `max_login_attempts`: 3–20
 *       - `lock_duration_minutes`: 5–1440 phút
 *       - `require_2fa_roles`: mảng các role (ví dụ: `["ADMIN", "DOCTOR"]`)
 *     tags: [1.4.4 Cấu hình bảo mật]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               max_login_attempts:
 *                 type: integer
 *                 minimum: 3
 *                 maximum: 20
 *                 example: 5
 *               lock_duration_minutes:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 1440
 *                 example: 15
 *               require_email_verification:
 *                 type: boolean
 *                 example: true
 *               password_min_length:
 *                 type: integer
 *                 minimum: 8
 *                 maximum: 32
 *                 example: 10
 *               session_duration_days:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 365
 *                 example: 30
 *               require_2fa_roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["ADMIN", "DOCTOR"]
 *               access_token_expiry_minutes:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 1440
 *                 example: 30
 *               refresh_token_expiry_days:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 365
 *                 example: 30
 *           examples:
 *             updatePasswordAndToken:
 *               summary: Cập nhật password length và access token
 *               value:
 *                 password_min_length: 10
 *                 access_token_expiry_minutes: 30
 *             enable2FA:
 *               summary: Bật 2FA cho ADMIN và DOCTOR
 *               value:
 *                 require_2fa_roles: ["ADMIN", "DOCTOR"]
 *             tightenSecurity:
 *               summary: Thắt chặt bảo mật (ví dụ)
 *               value:
 *                 max_login_attempts: 5
 *                 lock_duration_minutes: 60
 *                 password_min_length: 12
 *                 require_email_verification: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công, trả về SecurityConfig đầy đủ sau khi lưu
 *       400:
 *         description: |
 *           Dữ liệu không hợp lệ:
 *           - SYS_SEC_001: password_min_length ngoài range 8–32
 *           - SYS_SEC_002: session_duration_days ngoài range 1–365
 *           - SYS_SEC_003: token expiry ngoài range cho phép
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền Admin
 */
systemRoutes.put('/security-settings', ...requireAdmin, checkConfigPermission('SECURITY'), SecuritySettingsController.updateSecurityConfig);

// 1.4.3 – CẤU HÌNH QUY ĐỊNH NGHIỆP VỤ\

/**
 * @swagger
 * /api/system/business-rules:
 *   get:
 *     summary: Lấy tất cả quy định nghiệp vụ
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Trả về danh sách các quy định, nhóm theo module.
 *       Hỗ trợ filter: `?module=APPOINTMENT` hoặc `?module=SECURITY`.
 *     tags: [1.4.3 Cấu hình quy định nghiệp vụ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *           enum: [APPOINTMENT, SECURITY]
 *         required: false
 *         description: Lọc theo nhóm module (bỏ trống để lấy tất cả)
 *         example: APPOINTMENT
 *     responses:
 *       200:
 *         description: Danh sách quy định nghiệp vụ nhóm theo module
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       module:
 *                         type: string
 *                         example: "APPOINTMENT"
 *                       rules:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             setting_key:
 *                               type: string
 *                               example: "CANCEL_APPOINTMENT_BEFORE_HOURS"
 *                             value:
 *                               example: 24
 *                             description:
 *                               type: string
 *                               example: "Bệnh nhân phải hủy lịch trước ít nhất N giờ"
 *                             updated_at:
 *                               type: string
 *                               format: date-time
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền Admin
 */
systemRoutes.get('/business-rules', ...requireAdmin, BusinessRulesController.getAllBusinessRules);

/**
 * @swagger
 * /api/system/business-rules/bulk:
 *   put:
 *     summary: Cập nhật nhiều quy định nghiệp vụ cùng lúc
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Cập nhật hàng loạt quy định trong 1 request. Toàn bộ batch được thực hiện trong 1 transaction –
 *       nếu 1 rule sai validation, toàn bộ rollback.
 *
 *       **Các rule keys hợp lệ:**
 *       - `CANCEL_APPOINTMENT_BEFORE_HOURS` (number, 1–168)
 *       - `MAX_BOOKING_PER_DAY_PER_PATIENT` (number, 1–10)
 *       - `MAX_ADVANCE_BOOKING_DAYS` (number, 1–365)
 *       - `MAX_APPOINTMENTS_PER_DOCTOR_PER_DAY` (number, 1–100)
 *       - `ALLOW_PATIENT_SELF_CANCEL` (boolean)
 *       - `MAX_LOGIN_ATTEMPTS` (number, 3–20)
 *       - `LOCK_ACCOUNT_DURATION_MINUTES` (number, 5–1440)
 *       - `REQUIRE_EMAIL_VERIFICATION` (boolean)
 *     tags: [1.4.3 Cấu hình quy định nghiệp vụ]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rules
 *             properties:
 *               rules:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [key, value]
 *                   properties:
 *                     key:
 *                       type: string
 *                       example: "CANCEL_APPOINTMENT_BEFORE_HOURS"
 *                     value:
 *                       example: 48
 *           examples:
 *             bulkUpdate:
 *               summary: Cập nhật 3 quy định cùng lúc
 *               value:
 *                 rules:
 *                   - { key: "CANCEL_APPOINTMENT_BEFORE_HOURS", value: 48 }
 *                   - { key: "MAX_BOOKING_PER_DAY_PER_PATIENT", value: 2 }
 *                   - { key: "ALLOW_PATIENT_SELF_CANCEL", value: false }
 *     responses:
 *       200:
 *         description: Cập nhật thành công, trả về mảng rule đã cập nhật
 *       400:
 *         description: |
 *           Validation thất bại – toàn bộ batch bị rollback:
 *           - SYS_BR_002: Giá trị sai type/range
 *           - SYS_BR_003: Key không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền Admin
 */
systemRoutes.put('/business-rules/bulk', ...requireAdmin, checkConfigPermission('BUSINESS_RULES'), BusinessRulesController.bulkUpdateBusinessRules);

/**
 * @swagger
 * /api/system/business-rules/{ruleKey}:
 *   get:
 *     summary: Lấy 1 quy định nghiệp vụ theo key
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *     tags: [1.4.3 Cấu hình quy định nghiệp vụ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ruleKey
 *         required: true
 *         schema:
 *           type: string
 *         example: CANCEL_APPOINTMENT_BEFORE_HOURS
 *         description: Key của quy định cần lấy
 *     responses:
 *       200:
 *         description: Thông tin chi tiết quy định
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
 *                     setting_key:
 *                       type: string
 *                       example: "CANCEL_APPOINTMENT_BEFORE_HOURS"
 *                     value:
 *                       example: 24
 *                     module:
 *                       type: string
 *                       example: "APPOINTMENT"
 *                     description:
 *                       type: string
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền Admin
 *       404:
 *         description: Không tìm thấy quy định
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
systemRoutes.get('/business-rules/:ruleKey', ...requireAdmin, BusinessRulesController.getBusinessRuleByKey);

/**
 * @swagger
 * /api/system/business-rules/{ruleKey}:
 *   put:
 *     summary: Cập nhật 1 quy định nghiệp vụ
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Cập nhật giá trị của 1 quy định nghiệp vụ theo key. Validate type và range tự động.
 *
 *       **Ví dụ:** `PUT /api/system/business-rules/CANCEL_APPOINTMENT_BEFORE_HOURS` với `{"value": 48}`
 *     tags: [1.4.3 Cấu hình quy định nghiệp vụ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ruleKey
 *         required: true
 *         schema:
 *           type: string
 *         example: CANCEL_APPOINTMENT_BEFORE_HOURS
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [value]
 *             properties:
 *               value:
 *                 description: Giá trị mới (number hoặc boolean tùy rule)
 *                 example: 48
 *           examples:
 *             numberRule:
 *               summary: Cập nhật giá trị số
 *               value:
 *                 value: 48
 *             booleanRule:
 *               summary: Cập nhật giá trị boolean
 *               value:
 *                 value: false
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: |
 *           Validation thất bại:
 *           - SYS_BR_002: Giá trị ngoài range hoặc sai type
 *           - SYS_BR_003: Key không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền Admin
 *       404:
 *         description: Không tìm thấy quy định
 */
systemRoutes.put('/business-rules/:ruleKey', ...requireAdmin, checkConfigPermission('BUSINESS_RULES'), BusinessRulesController.updateBusinessRule);

// =========================================================================
// 1.4.2 – CẤU HÌNH THỜI GIAN LÀM VIỆC MẶC ĐỊNH
// =========================================================================

/**
 * @swagger
 * /api/system/working-hours:
 *   get:
 *     summary: Lấy cấu hình giờ làm việc 7 ngày trong tuần
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Trả về mảng 7 phần tử tương ứng với 7 ngày (Chủ nhật → Thứ 7).
 *       Nếu DB chưa cấu hình, trả về mảng rỗng `[]`.
 *
 *       **day_of_week:** 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7
 *     tags: [1.4.2 Cấu hình thời gian làm việc]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách cấu hình giờ làm việc
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       day_of_week:
 *                         type: integer
 *                         example: 1
 *                       day_label:
 *                         type: string
 *                         example: "Thứ 2"
 *                       open_time:
 *                         type: string
 *                         example: "08:00"
 *                       close_time:
 *                         type: string
 *                         example: "17:30"
 *                       is_closed:
 *                         type: boolean
 *                         example: false
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Không tìm thấy cơ sở y tế
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
systemRoutes.get('/working-hours', ...requireAdmin, SystemSettingsController.getWorkingHours);

/**
 * @swagger
 * /api/system/working-hours:
 *   put:
 *     summary: Cập nhật cấu hình giờ làm việc
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Cập nhật khung giờ mặc định theo từng ngày. Chỉ cần gửi những ngày cần thay đổi.
 *
 *       **Validation rules:**
 *       - `day_of_week` phải từ 0–6
 *       - Nếu `is_closed = false`, `close_time` phải sau `open_time`
 *       - Định dạng time: `HH:mm` (24 giờ)
 *     tags: [1.4.2 Cấu hình thời gian làm việc]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - days
 *             properties:
 *               days:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - day_of_week
 *                   properties:
 *                     day_of_week:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 6
 *                       example: 1
 *                     open_time:
 *                       type: string
 *                       example: "08:00"
 *                     close_time:
 *                       type: string
 *                       example: "17:30"
 *                     is_closed:
 *                       type: boolean
 *                       example: false
 *           examples:
 *             updateWeekdays:
 *               summary: Cập nhật giờ làm việc Thứ 2–6
 *               value:
 *                 days:
 *                   - { day_of_week: 1, open_time: "08:00", close_time: "17:30", is_closed: false }
 *                   - { day_of_week: 2, open_time: "08:00", close_time: "17:30", is_closed: false }
 *                   - { day_of_week: 3, open_time: "08:00", close_time: "17:30", is_closed: false }
 *                   - { day_of_week: 4, open_time: "08:00", close_time: "17:30", is_closed: false }
 *                   - { day_of_week: 5, open_time: "08:00", close_time: "17:30", is_closed: false }
 *                   - { day_of_week: 6, open_time: "08:00", close_time: "12:00", is_closed: false }
 *                   - { day_of_week: 0, is_closed: true }
 *     responses:
 *       200:
 *         description: Cập nhật thành công, trả về toàn bộ cấu hình giờ sau khi cập nhật
 *       400:
 *         description: Dữ liệu không hợp lệ (sai day_of_week, close_time <= open_time)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Chưa xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Không có quyền Admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
systemRoutes.put('/working-hours', ...requireAdmin, checkConfigPermission('WORKING_HOURS'), SystemSettingsController.updateWorkingHours);

/**
 * @swagger
 * /api/system/working-hours/slot-config:
 *   get:
 *     summary: Lấy cấu hình slot khám bệnh
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Lấy cấu hình thời lượng mỗi slot và số bệnh nhân tối đa mỗi slot.
 *       Nếu chưa cấu hình, trả về giá trị mặc định: `duration_minutes=15`, `max_patients_per_slot=1`.
 *     tags: [1.4.2 Cấu hình thời gian làm việc]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cấu hình slot hiện tại
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
 *                     duration_minutes:
 *                       type: integer
 *                       example: 15
 *                       description: Thời lượng 1 slot khám (phút)
 *                     max_patients_per_slot:
 *                       type: integer
 *                       example: 1
 *                       description: Số bệnh nhân tối đa trong 1 slot
 *       401:
 *         description: Chưa xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
systemRoutes.get('/working-hours/slot-config', ...requireAdmin, SystemSettingsController.getSlotConfig);

/**
 * @swagger
 * /api/system/working-hours/slot-config:
 *   put:
 *     summary: Cập nhật cấu hình slot khám bệnh
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Cập nhật thời lượng 1 slot và/hoặc số bệnh nhân tối đa mỗi slot. Tất cả các trường đều là tùy chọn.
 *
 *       **Validation rules:**
 *       - `duration_minutes`: Bội số của 5, trong khoảng **5–120** phút
 *       - `max_patients_per_slot`: Số nguyên trong khoảng **1–20**
 *     tags: [1.4.2 Cấu hình thời gian làm việc]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               duration_minutes:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 120
 *                 multipleOf: 5
 *                 example: 30
 *                 description: Thời lượng 1 slot (phải là bội số của 5)
 *               max_patients_per_slot:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *                 example: 2
 *                 description: Số bệnh nhân tối đa mỗi slot
 *           examples:
 *             update30min:
 *               summary: Slot 30 phút, tối đa 2 bệnh nhân
 *               value:
 *                 duration_minutes: 30
 *                 max_patients_per_slot: 2
 *             updateDurationOnly:
 *               summary: Chỉ cập nhật duration
 *               value:
 *                 duration_minutes: 15
 *     responses:
 *       200:
 *         description: Cập nhật thành công, trả về config sau khi lưu
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
 *                     duration_minutes:
 *                       type: integer
 *                       example: 30
 *                     max_patients_per_slot:
 *                       type: integer
 *                       example: 2
 *       400:
 *         description: |
 *           Dữ liệu không hợp lệ:
 *           - SYS_WH_003: duration_minutes không hợp lệ
 *           - SYS_WH_004: max_patients_per_slot không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Chưa xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Không có quyền Admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
systemRoutes.put('/working-hours/slot-config', ...requireAdmin, checkConfigPermission('APPOINTMENT'), SystemSettingsController.updateSlotConfig);



// 1.4.1 – CẤU HÌNH THÔNG TIN CƠ SỞ Y TẾ
/**
 * @swagger
 * /api/system/facility-info:
 *   get:
 *     summary: Lấy thông tin cơ sở y tế
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Trả về toàn bộ thông tin của cơ sở y tế chính trong hệ thống (tên, logo, địa chỉ, liên hệ, mã số thuế).
 *     tags: [1.4.1 Cấu hình thông tin cơ sở y tế]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về thông tin cơ sở y tế thành công
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
 *                     facilities_id:
 *                       type: string
 *                       example: "FAC_01"
 *                     code:
 *                       type: string
 *                       example: "EHEALTH_VN"
 *                     name:
 *                       type: string
 *                       example: "Hệ thống Y tế E-Health Việt Nam"
 *                     tax_code:
 *                       type: string
 *                       example: "0101234567"
 *                     email:
 *                       type: string
 *                       example: "contact@ehealth.vn"
 *                     phone:
 *                       type: string
 *                       example: "19001515"
 *                     website:
 *                       type: string
 *                       example: "https://ehealth.vn"
 *                     logo_url:
 *                       type: string
 *                       nullable: true
 *                       example: "https://res.cloudinary.com/demo/image/upload/ehealth/logos/logo.png"
 *                     headquarters_address:
 *                       type: string
 *                       example: "123 Nguyễn Văn Linh, Quận 7, TP.HCM"
 *                     status:
 *                       type: string
 *                       example: "ACTIVE"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Chưa xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Chưa có dữ liệu cơ sở y tế trong hệ thống
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
systemRoutes.get('/facility-info', ...requireAdmin, SystemFacilityController.getFacilityInfo);

/**
 * @swagger
 * /api/system/facility-info:
 *   put:
 *     summary: Cập nhật thông tin cơ sở y tế
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Cập nhật một hoặc nhiều trường thông tin cơ sở y tế. Chỉ Admin mới có quyền thực hiện. Tất cả các trường đều là tùy chọn (partial update).
 *     tags: [1.4.1 Cấu hình thông tin cơ sở y tế]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Hệ thống Y tế E-Health Việt Nam"
 *               tax_code:
 *                 type: string
 *                 example: "0101234567"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "contact@ehealth.vn"
 *               phone:
 *                 type: string
 *                 example: "19001515"
 *               website:
 *                 type: string
 *                 example: "https://ehealth.vn"
 *               headquarters_address:
 *                 type: string
 *                 example: "123 Nguyễn Văn Linh, Quận 7, TP.HCM"
 *     responses:
 *       200:
 *         description: Cập nhật thành công, trả về thông tin sau khi cập nhật
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
 *                   description: Thông tin cơ sở y tế sau khi cập nhật
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Chưa xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Không có quyền (không phải Admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Không tìm thấy cơ sở y tế
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
systemRoutes.put('/facility-info', ...requireAdmin, SystemFacilityController.updateFacilityInfo);

/**
 * @swagger
 * /api/system/facility-info/logo:
 *   post:
 *     summary: Upload logo cơ sở y tế
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *       Upload ảnh logo lên Cloudinary và cập nhật `logo_url` cho cơ sở y tế.
 *
 *       **Yêu cầu file:**
 *       - Định dạng: JPG, PNG, WEBP
 *       - Dung lượng tối đa: 5MB
 *       - Field name: `logo`
 *     tags: [1.4.1 Cấu hình thông tin cơ sở y tế]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - logo
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: File ảnh logo (JPG/PNG/WEBP, tối đa 5MB)
 *     responses:
 *       200:
 *         description: Upload thành công, trả về URL ảnh trên Cloudinary
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
 *                     logo_url:
 *                       type: string
 *                       example: "https://res.cloudinary.com/demo/image/upload/v1234567890/ehealth/logos/facility_logo_FAC_01.png"
 *       400:
 *         description: Thiếu file, sai định dạng, hoặc file quá lớn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Chưa xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Không có quyền (không phải Admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Lỗi upload lên Cloudinary
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
systemRoutes.post(
    '/facility-info/logo',
    ...requireAdmin,
    upload.single('logo'),
    SystemFacilityController.uploadLogo
);

export default systemRoutes;
