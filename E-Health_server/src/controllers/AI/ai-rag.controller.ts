import { Request, Response } from 'express';
import { AiRagService } from '../../services/AI/ai-rag.service';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { AppError } from '../../utils/app-error.util';
import { AI_RAG_ERRORS, AI_RAG_SUCCESS } from '../../constants/ai-rag.constant';

export class AiRagController {
    /**
     * @swagger
     * /api/ai/rag/upload:
     *   post:
     *     summary: Tải lên tài liệu PDF để làm dữ liệu cho AI (Knowledge Base)
     *     tags: [AI Consultation]
     *     security:
     *       - bearerAuth: []
     *     consumes:
     *       - multipart/form-data
     *     parameters:
     *       - in: formData
     *         name: file
     *         type: file
     *         required: true
     *         description: File PDF chứa kiến thức (VD bảng giá, thông tin bác sĩ)
     *     responses:
     *       202:
     *         description: Đã tiếp nhận file và bắt đầu xử lý ngầm
     *       400:
     *         description: Lỗi định dạng file
     */
    static async uploadDocument(req: Request, res: Response): Promise<void> {
        if (!req.file) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'BAD_REQUEST', AI_RAG_ERRORS.INVALID_FILE_TYPE);
        }

        const fileBuffer = req.file.buffer;
        const fileName = req.file.originalname;
        
        // Lấy ID của Admin từ token (nếu có gắn Auth Middleware)
        const uploadedBy = (req as any).auth?.user_id || null;

        // Trả về response ngay lập tức (202 Accepted) vì việc xử lý PDF + Call API có thể mất 10-30s
        const documentInfo = await AiRagService.processDocumentFile(fileBuffer, fileName, uploadedBy);

        res.status(202).json({
            success: true,
            message: AI_RAG_SUCCESS.UPLOAD_STARTED,
            data: documentInfo,
        });
    }

    /**
     * @swagger
     * /api/ai/rag/documents:
     *   get:
     *     summary: Lấy danh sách các tài liệu đã đưa vào AI
     *     tags: [AI Consultation]
     *     responses:
     *       200:
     *         description: Danh sách tài liệu
     */
    static async getDocuments(req: Request, res: Response): Promise<void> {
        const documents = await AiRagService.getAllDocuments();
        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Lấy danh sách tài liệu RAG thành công',
            data: documents,
        });
    }

    /**
     * @swagger
     * /api/ai/rag/documents/{id}:
     *   delete:
     *     summary: Xóa một tài liệu khỏi AI Knowledge Base
     *     tags: [AI Consultation]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           example: "DOC_1234abcd"
     *     responses:
     *       200:
     *         description: Đã xóa tài liệu
     */
    static async deleteDocument(req: Request, res: Response): Promise<void> {
        const docId = req.params.id as string;
        const result = await AiRagService.deleteDocument(docId);
        
        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: result,
        });
    }
}
