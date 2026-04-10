import { Request, Response, NextFunction } from "express";
import { UserSessionRepository } from "../repository/Core/auth_user-session.repository";

export const checkSessionStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authPayload = (req as any).auth;

        if (!authPayload || !authPayload.sessionId) {
            return res.status(401).json({
                success: false,
                code: "AUTH_401",
                message: "Không tìm thấy thông tin phiên làm việc."
            });
        }

        // Kiểm tra xem session có tồn tại không
        const session = await UserSessionRepository.findActiveBySessionId(authPayload.sessionId);

        // check 
        if (!session || session.user_id !== authPayload.user_id) {
            return res.status(401).json({
                success: false,
                code: "AUTH_SESSION_INVALID",
                message: "Phiên đăng nhập đã hết hạn hoặc bị thu hồi."
            });
        }

        await UserSessionRepository.updateLastUsed(authPayload.sessionId);

        next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Lỗi kiểm tra trạng thái phiên làm việc."
        });
    }
};