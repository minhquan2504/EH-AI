import { Request, Response } from "express";
import { SessionService } from "../../services/Core/auth_session.service";
import { SecurityUtil } from "../../utils/auth-security.util";

export class SessionController {
    /**
     * Lấy danh sách session còn hiệu lực của tài khoản
     */
    static async getSessions(req: Request, res: Response) {
        try {
            const { user_id } = (req as any).auth;

            const currentSessionId = (req as any).auth.sessionId;

            const sessions = await SessionService.getActiveSessions(user_id, currentSessionId);

            return res.status(200).json({
                success: true,
                sessions
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Đăng xuất khỏi session hiện tại
     */
    static async logout(req: Request, res: Response) {
        try {
            const { refreshToken } = req.body;

            // Bổ sung validate input
            if (!refreshToken) {
                return res.status(400).json({ success: false, message: "Refresh token is required" });
            }

            const refreshTokenHash = SecurityUtil.hashRefreshToken(refreshToken);
            await SessionService.logout(refreshTokenHash);

            return res.status(200).json({ success: true, message: "Logged out" });
        } catch (error: any) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }

    /**
     * Đăng xuất khỏi một session cụ thể
     */
    static async logoutSession(req: Request, res: Response) {
        try {
            const { user_id } = (req as any).auth;

            // FIX LỖI TẠI ĐÂY: Ép kiểu as string
            const sessionId = req.params.sessionId as string;

            await SessionService.revokeSession(user_id, sessionId);

            return res.status(200).json({
                success: true,
                message: "Session revoked successfully"
            });
        } catch (error: any) {
            return res.status(error.httpCode || 500).json({
                success: false,
                code: error.code,
                message: error.message
            });
        }
    }

    /**
     * đăng xuất tất cả session
     */
    static async logoutAll(req: Request, res: Response) {
        try {
            const { user_id } = (req as any).auth;
            await SessionService.logoutAll(user_id);

            return res.status(200).json({
                success: true,
                message: "All sessions revoked"
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }


}