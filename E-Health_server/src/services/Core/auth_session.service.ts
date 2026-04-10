import { UserSessionRepository } from "../../repository/Core/auth_user-session.repository";
import { AUTH_ERRORS } from "../../constants/auth-error.constant";

export class SessionService {
    /*
     * Lấy danh sách session còn hiệu lực của một tài khoản
     */
    static async getActiveSessions(userId: string, currentSessionId?: string) {
        const sessions = await UserSessionRepository.findActiveByAccount(userId);

        return sessions.map(s => ({
            sessionId: s.user_sessions_id,
            device: s.device_name || 'Unknown Device',
            ip: s.ip_address,
            lastActiveAt: s.last_used_at,
            current: s.user_sessions_id === currentSessionId
        }));
    }

    /*
     * Đăng xuất khỏi một session cụ thể
     */
    static async logout(refreshTokenHash: string) {
        const session = await UserSessionRepository.findActiveSessionByRefreshToken(refreshTokenHash);

        if (!session) throw AUTH_ERRORS.SESSION_NOT_FOUND;

        const success = await UserSessionRepository.logoutCurrentSession(session.user_id, refreshTokenHash);

        if (!success) throw AUTH_ERRORS.SESSION_NOT_FOUND;
    }

    /*
     * Đăng xuất khỏi một session cụ thể theo userId và sessionId
     */
    static async revokeSession(userId: string, sessionId: string) {
        const success = await UserSessionRepository.revokeBySessionId(sessionId, userId);
        if (!success) throw AUTH_ERRORS.SESSION_NOT_FOUND;
    }

    /*
     * Đăng xuất khỏi tất cả session của một tài khoản
     */
    static async logoutAll(userId: string) {
        await UserSessionRepository.revokeAllByAccount(userId);
    }
}