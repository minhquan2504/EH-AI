import { Request, Response } from 'express';
import { AiHealthChatService } from '../../services/AI/ai-health-chat.service';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { AI_CHAT_ERRORS, AI_CHAT_SUCCESS } from '../../constants/ai-health-chat.constant';
import { AppError } from '../../utils/app-error.util';

/**
 * Controller cho Module 7.1 — AI Tư Vấn Sức Khỏe Ban Đầu.
 * Chỉ làm nhiệm vụ: trích xuất dữ liệu từ HTTP request → gọi Service → trả HTTP response.
 */
export class AiHealthChatController {

    /**
     * Tạo phiên tư vấn AI mới.
     */
    static async startSession(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id || null;
            const { message } = req.body;

            const result = await AiHealthChatService.startSession(userId, message);

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: AI_CHAT_SUCCESS.SESSION_STARTED,
                data: result,
            });
        } catch (error: any) {
            AiHealthChatController.handleError(res, error);
        }
    }

    /**
     * Gửi tin nhắn tiếp theo (JSON response).
     */
    static async sendMessage(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id || null;
            const sessionId = String(req.params.sessionId);
            const message = String(req.body.message);

            const result = await AiHealthChatService.sendMessage(sessionId, userId, message);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: AI_CHAT_SUCCESS.MESSAGE_SENT,
                data: result,
            });
        } catch (error: any) {
            AiHealthChatController.handleError(res, error);
        }
    }

    /**
     * Gửi tin nhắn với streaming response (SSE).
     */
    static async sendMessageStream(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id || null;
            const sessionId = String(req.params.sessionId);
            const message = String(req.body.message);

            // Service sẽ tự set headers SSE và write stream
            await AiHealthChatService.sendMessageStream(sessionId, userId, message, res);
        } catch (error: any) {
            // Nếu lỗi xảy ra trước khi stream bắt đầu (validation, DB)
            if (!res.headersSent) {
                AiHealthChatController.handleError(res, error);
            }
        }
    }

    /**
     * Kết thúc phiên tư vấn AI.
     */
    static async completeSession(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id || null;
            const sessionId = String(req.params.sessionId);

            const session = await AiHealthChatService.completeSession(sessionId, userId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: AI_CHAT_SUCCESS.SESSION_COMPLETED,
                data: session,
            });
        } catch (error: any) {
            AiHealthChatController.handleError(res, error);
        }
    }

    /**
     * Lấy lịch sử chat của 1 phiên.
     */
    static async getSessionHistory(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id || null;
            const sessionId = String(req.params.sessionId);

            const result = await AiHealthChatService.getSessionHistory(sessionId, userId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: AI_CHAT_SUCCESS.SESSION_HISTORY,
                data: result,
            });
        } catch (error: any) {
            AiHealthChatController.handleError(res, error);
        }
    }

    /**
     * Danh sách phiên tư vấn AI của user (phân trang).
     */
    static async getUserSessions(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            if (!userId) {
                throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED', 'Vui lòng đăng nhập để xem danh sách phiên tư vấn.');
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const rawStatus = req.query.status;
            const status = Array.isArray(rawStatus) ? String(rawStatus[0]) : rawStatus as string | undefined;

            const { sessions, total } = await AiHealthChatService.getUserSessions(userId, page, limit, status);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: AI_CHAT_SUCCESS.SESSION_LIST,
                data: sessions,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error: any) {
            AiHealthChatController.handleError(res, error);
        }
    }

    /**
     * Xử lý lỗi tập trung — phân loại AppError vs lỗi hệ thống.
     */
    private static handleError(res: Response, error: any): void {
        if (error instanceof AppError) {
            res.status(error.httpCode).json({
                success: false,
                code: error.code,
                message: error.message,
            });
        } else {
            console.error('❌ [AI Health Chat Controller] Lỗi không xác định:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: AI_CHAT_ERRORS.AI_SERVICE_ERROR,
            });
        }
    }
}
