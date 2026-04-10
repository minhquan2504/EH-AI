import { randomUUID } from "crypto";
import { ClientInfo } from "../models/Core/auth_user-session.model";
import { UserSessionRepository } from "../repository/Core/auth_user-session.repository";
import { SecurityUtil } from "./auth-security.util";

export class AuthSessionUtil {
    /*
     * Tạo hoặc cập nhật user session
     */
    static async upsertSession(
        sessionId: string,
        userId: string,
        refreshTokenHash: string,
        clientInfo: ClientInfo
    ) {
        const expiredAt = SecurityUtil.getRefreshTokenExpiredAt();

        // Nếu có deviceId thì tìm session cũ của device
        if (clientInfo.deviceId) {
            const existingSession = await UserSessionRepository.findByAccountAndDevice(
                userId,
                clientInfo.deviceId
            );

            if (existingSession) {
                await UserSessionRepository.updateSessionBySessionId(
                    existingSession.user_sessions_id,
                    {
                        refreshTokenHash,
                        ipAddress: clientInfo.ip,
                        userAgent: clientInfo.userAgent,
                        deviceName: clientInfo.deviceName,
                        deviceId: clientInfo.deviceId,
                        expiredAt,
                    },
                );
                return;
            }
        }

        // Tạo session mới
        await UserSessionRepository.createSession({
            user_sessions_id: sessionId,
            userId,
            refreshTokenHash,
            deviceId: clientInfo.deviceId,
            deviceName: clientInfo.deviceName,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            expiredAt,
        });

        // Dọn session đã revoked cũ khi không có deviceId (tránh stack vô hạn).
        // Chỉ giữ lại 5 session revoked gần nhất, xóa phần còn lại.
        if (!clientInfo.deviceId) {
            await UserSessionRepository.deleteOldRevokedSessions(userId, 5);
        }
    }

    /*
     * Tạo session ID mới
    */
    static generate(userId: string): string {
        const now = new Date();

        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');

        const datePart = `${yy}${mm}${dd}`;

        return `SES_${datePart}_${userId}_${randomUUID().substring(0, 8)}`;
    }
}
