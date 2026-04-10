import cron from "node-cron";
import { UserSessionRepository } from "../repository/Core/auth_user-session.repository";
import { AUTH_CONSTANTS } from "../constants/auth.constant";

export class SessionCleanup {
    static startSessionCleanupJob() {

        this.runCleanup();

        const now = new Date();
        const night = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1,
            0, 0, 0
        );
        const msToMidnight = night.getTime() - now.getTime();

        setTimeout(() => {
            this.runCleanup();

            setInterval(() => {
                this.runCleanup();
            }, 24 * 60 * 60 * 1000);

        }, msToMidnight);
    }

    private static async runCleanup() {
        try {
            const deletedCount = await UserSessionRepository.revokeExpiredSessions(
                AUTH_CONSTANTS.SESSION.IDLE_TIMEOUT_DAYS
            );

            if (deletedCount > 0) {
                console.log(`✅ Cron Job: Đã thu hồi ${deletedCount} session hết hạn.`);
            } else {

            }
        } catch (error) {
            console.error("❌ Cron Job Error:", error);
        }
    }
}