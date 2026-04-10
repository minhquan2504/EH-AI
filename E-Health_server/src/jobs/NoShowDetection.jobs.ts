import { AppointmentStatusService } from '../services/Appointment Management/appointment-status.service';

/**
 * Cron Job tự động phát hiện No-Show.
 */
export class NoShowDetectionJob {
    private static intervalId: ReturnType<typeof setInterval> | null = null;

    /**
     * Khởi động job phát hiện No-Show tự động
     */
    static startJob() {
        setTimeout(() => {
            this.runDetection();
        }, 30000);

        const INTERVAL_MS = 30 * 60 * 1000;
        this.intervalId = setInterval(() => {
            this.runDetection();
        }, INTERVAL_MS);

        console.log('🔍 [CRON] No-Show Detection Job đã khởi động (mỗi 30 phút).');
    }

    /**
     * Dừng job
     */
    static stopJob() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('🛑 [CRON] No-Show Detection Job đã dừng.');
        }
    }

    /**
     * Thực thi 1 lần quét No-Show
     */
    private static async runDetection() {
        try {
            const result = await AppointmentStatusService.processAutoNoShow();
            if (result.total_marked > 0) {
                console.log(`✅ [CRON] No-Show Detection: Đã đánh dấu ${result.total_marked} lịch khám No-Show.`);
            }
        } catch (error) {
            console.error('❌ [CRON] No-Show Detection Error:', error);
        }
    }
}
