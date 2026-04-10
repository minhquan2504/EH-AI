import { Router } from 'express';
import multer from 'multer';
import { AiRagController } from '../../controllers/AI/ai-rag.controller';
import { AI_RAG_UPLOAD_CONFIG, AI_RAG_ERRORS } from '../../constants/ai-rag.constant';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const router = Router();

// Cấu hình Multer sử dụng Memory (RAM) thay vì lưu ổ đĩa cứng
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: AI_RAG_UPLOAD_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (AI_RAG_UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
            cb(null, true);
        } else {
            cb(new Error(AI_RAG_ERRORS.INVALID_FILE_TYPE));
        }
    }
});

/**
 * @swagger
 * /api/ai/rag/upload:
 *   post:
 *     summary: Tải lên tài liệu PDF vào Knowledge Base của AI
 *     description: |
 *       **Phân quyền:** Yêu cầu token ADMIN.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       Upload một file PDF (bảng giá, lịch bác sĩ, nội quy phòng khám...) để AI có thể tra cứu và trả lời câu hỏi dựa trên tài liệu đó.
 *
 *       **Quy trình xử lý ngầm:** Sau khi nhận file, hệ thống trả về `202 Accepted` ngay lập tức. Quá trình cắt nhỏ (chunking) và nhúng vector (embedding) diễn ra **bất đồng bộ** ở nền, có thể mất 10-60 giây tùy độ dài file.
 *       Kiểm tra trạng thái xử lý qua `GET /api/ai/rag/documents`.
 *     tags: [7.2 AI Knowledge Base (RAG)]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: "File PDF cần đưa vào Knowledge Base. Tối đa 20MB."
 *     responses:
 *       202:
 *         description: Đã tiếp nhận file, đang xử lý ngầm
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
 *                   example: "File đã được tiếp nhận và đang được xử lý trong nền."
 *                 data:
 *                   type: object
 *                   description: Thông tin tài liệu vừa tạo (trạng thái PROCESSING)
 *                   properties:
 *                     document_id:
 *                       type: string
 *                       example: "DOC_a1b2c3d4e5f67890"
 *                     file_name:
 *                       type: string
 *                       example: "bang_gia_phong_kham_2024.pdf"
 *                     file_type:
 *                       type: string
 *                       example: "PDF"
 *                     status:
 *                       type: string
 *                       example: "PROCESSING"
 *       400:
 *         description: Không có file hoặc định dạng file không hợp lệ (chỉ chấp nhận PDF)
 *       401:
 *         description: Chưa xác thực (Missing/Invalid Token)
 *       500:
 *         description: Lỗi server nội bộ
 */
router.post(
    '/upload',
    verifyAccessToken,
    authorizePermissions('API_AI_RAG_UPLOAD'),
    upload.single('file'),
    AiRagController.uploadDocument as any
);

/**
 * @swagger
 * /api/ai/rag/documents:
 *   get:
 *     summary: Lấy danh sách tất cả tài liệu trong Knowledge Base
 *     description: |
 *       **Phân quyền:** Yêu cầu token ADMIN.
 *       **Vai trò được phép:** ADMIN, STAFF.
 *
 *       Trả về toàn bộ danh sách tài liệu đã upload, kèm trạng thái xử lý (`PROCESSING`, `COMPLETED`, `FAILED`), số lượng chunks và thông báo lỗi nếu có.
 *     tags: [7.2 AI Knowledge Base (RAG)]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách tài liệu
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
 *                       document_id:
 *                         type: string
 *                         example: "DOC_a1b2c3d4e5f67890"
 *                       file_name:
 *                         type: string
 *                         example: "bang_gia_phong_kham_2024.pdf"
 *                       file_size_bytes:
 *                         type: number
 *                         example: 204800
 *                       total_chunks:
 *                         type: number
 *                         example: 42
 *                       status:
 *                         type: string
 *                         enum: [PROCESSING, COMPLETED, FAILED]
 *                         example: "COMPLETED"
 *                       error_message:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T08:30:00Z"
 *       401:
 *         description: Chưa xác thực
 */
router.get(
    '/documents',
    verifyAccessToken,
    authorizePermissions('API_AI_RAG_GET_DOCS'),
    AiRagController.getDocuments as any
);

/**
 * @swagger
 * /api/ai/rag/documents/{id}:
 *   delete:
 *     summary: Xóa một tài liệu khỏi Knowledge Base
 *     description: |
 *       **Phân quyền:** Yêu cầu token ADMIN.
 *       **Vai trò được phép:** ADMIN.
 *
 *       Xóa vĩnh viễn một tài liệu và **toàn bộ các vector embedding** liên quan ra khỏi cơ sở dữ liệu. Thao tác này không thể hoàn tác.
 *     tags: [7.2 AI Knowledge Base (RAG)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "DOC_a1b2c3d4e5f67890"
 *         description: ID của tài liệu cần xóa (lấy từ danh sách GET /documents)
 *     responses:
 *       200:
 *         description: Xóa tài liệu thành công
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
 *                   example: "Tài liệu đã được xóa khỏi Knowledge Base."
 *       401:
 *         description: Chưa xác thực
 *       404:
 *         description: Không tìm thấy tài liệu với ID đã cung cấp
 */
router.delete(
    '/documents/:id',
    verifyAccessToken,
    authorizePermissions('API_AI_RAG_DELETE_DOC'),
    AiRagController.deleteDocument as any
);

export default router;
