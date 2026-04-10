import { TeleQualityRepository } from '../../repository/Remote Consultation/tele-quality.repository';
import {
    CreateReviewInput, CreateAlertInput, ResolveAlertInput, QualityReviewFilter,
} from '../../models/Remote Consultation/tele-quality.model';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import {
    TELE_QA_ERRORS, QUALITY_THRESHOLDS, QUALITY_ALERT_TYPE,
    QUALITY_ALERT_SEVERITY, QUALITY_TARGET_TYPE, QUALITY_ALERT_STATUS,
} from '../../constants/remote-consultation.constant';
import { v4 as uuidv4 } from 'uuid';

/**
 * Business Logic Layer cho quản lý chất lượng
 * Reviews, metrics, alerts (auto-generate), reports
 */
export class TeleQualityService {

    // ═══════════════════════════════════════════════════
    // NHÓM 1: ĐÁNH GIÁ
    // ═══════════════════════════════════════════════════

    /**
     * BN gửi đánh giá chi tiết
     * Auto-check: nếu avg doctor rating < ngưỡng → tạo alert
     */
    static async createReview(consultationId: string, userId: string, input: CreateReviewInput): Promise<any> {
        const consultation = await this.getConsultationOrThrow(consultationId);

        // Kiểm tra đã review chưa
        const existing = await TeleQualityRepository.findByConsultation(consultationId);
        if (existing) {
            throw new AppError(HTTP_STATUS.CONFLICT, TELE_QA_ERRORS.REVIEW_EXISTS.code, TELE_QA_ERRORS.REVIEW_EXISTS.message);
        }

        const reviewId = `QR_${uuidv4().substring(0, 12)}`;
        const review = await TeleQualityRepository.createReview({
            review_id: reviewId,
            tele_consultation_id: consultationId,
            patient_id: userId,
            doctor_id: consultation.doctor_id,
            doctor_professionalism: input.doctor_professionalism || null,
            doctor_communication: input.doctor_communication || null,
            doctor_knowledge: input.doctor_knowledge || null,
            doctor_empathy: input.doctor_empathy || null,
            doctor_overall: input.doctor_overall,
            doctor_comment: input.doctor_comment || null,
            ease_of_use: input.ease_of_use || null,
            waiting_time_rating: input.waiting_time_rating || null,
            overall_satisfaction: input.overall_satisfaction,
            would_recommend: input.would_recommend !== undefined ? input.would_recommend : true,
            patient_comment: input.patient_comment || null,
            video_quality: input.video_quality || null,
            audio_quality: input.audio_quality || null,
            connection_stability: input.connection_stability || null,
            tech_issues: input.tech_issues || null,
            is_anonymous: input.is_anonymous || false,
        });

        // Auto-check alert: avg doctor rating 5 reviews gần nhất
        await this.checkAndCreateAlert(consultation.doctor_id);

        return review;
    }

    /** Chi tiết review */
    static async getReview(consultationId: string): Promise<any> {
        const review = await TeleQualityRepository.findByConsultation(consultationId);
        if (!review) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_QA_ERRORS.REVIEW_NOT_FOUND.code, TELE_QA_ERRORS.REVIEW_NOT_FOUND.message);
        }
        return review;
    }

    /** DS reviews */
    static async listReviews(filters: QualityReviewFilter): Promise<any> {
        return await TeleQualityRepository.findAll(filters);
    }

    /** DS reviews theo BS */
    static async getDoctorReviews(doctorId: string, page: number, limit: number): Promise<any> {
        return await TeleQualityRepository.findByDoctor(doctorId, page, limit);
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 2: METRICS
    // ═══════════════════════════════════════════════════

    /** Metrics BS */
    static async getDoctorMetrics(doctorId: string): Promise<any> {
        return await TeleQualityRepository.getDoctorMetrics(doctorId);
    }

    /** Tổng quan hệ thống */
    static async getSystemOverview(): Promise<any> {
        return await TeleQualityRepository.getSystemOverview();
    }

    /** Thống kê kết nối */
    static async getConnectionStats(): Promise<any> {
        return await TeleQualityRepository.getConnectionStats();
    }

    /** Xu hướng */
    static async getTrends(): Promise<any[]> {
        return await TeleQualityRepository.getTrends();
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 3: CẢNH BÁO
    // ═══════════════════════════════════════════════════

    /** DS alerts */
    static async listAlerts(status: string | undefined, page: number, limit: number): Promise<any> {
        return await TeleQualityRepository.findAlerts(status, page, limit);
    }

    /** Tạo alert thủ công */
    static async createAlert(input: CreateAlertInput): Promise<any> {
        const alertId = `QA_${uuidv4().substring(0, 12)}`;
        return await TeleQualityRepository.createAlert({
            alert_id: alertId,
            alert_type: input.alert_type,
            severity: input.severity,
            target_type: input.target_type,
            target_id: input.target_id || null,
            title: input.title,
            description: input.description || null,
            metrics_snapshot: input.metrics_snapshot || null,
        });
    }

    /** Resolve/dismiss alert */
    static async resolveAlert(alertId: string, userId: string, input: ResolveAlertInput): Promise<void> {
        const alert = await TeleQualityRepository.findAlertById(alertId);
        if (!alert) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_QA_ERRORS.ALERT_NOT_FOUND.code, TELE_QA_ERRORS.ALERT_NOT_FOUND.message);
        }
        if (alert.status === QUALITY_ALERT_STATUS.RESOLVED || alert.status === QUALITY_ALERT_STATUS.DISMISSED) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, TELE_QA_ERRORS.ALERT_ALREADY_RESOLVED.code, TELE_QA_ERRORS.ALERT_ALREADY_RESOLVED.message);
        }

        await TeleQualityRepository.resolveAlert(alertId, userId, input.status, input.resolution_notes);
    }

    /** Thống kê alerts */
    static async getAlertStats(): Promise<any> {
        return await TeleQualityRepository.getAlertStats();
    }

    // ═══════════════════════════════════════════════════
    // NHÓM 4: BÁO CÁO
    // ═══════════════════════════════════════════════════

    /** Báo cáo BS: metrics + reviews + alerts */
    static async getDoctorReport(doctorId: string): Promise<any> {
        const metrics = await TeleQualityRepository.getDoctorMetrics(doctorId);
        const reviews = await TeleQualityRepository.findByDoctor(doctorId, 1, 10);
        const alertsR = await TeleQualityRepository.findAlerts(undefined, 1, 100);
        const doctorAlerts = alertsR.data.filter(a => a.target_id === doctorId);
        return { metrics, recent_reviews: reviews.data, total_reviews: reviews.total, alerts: doctorAlerts };
    }

    /** Báo cáo tổng hợp */
    static async getSystemReport(): Promise<any> {
        const overview = await TeleQualityRepository.getSystemOverview();
        const connection = await TeleQualityRepository.getConnectionStats();
        const trends = await TeleQualityRepository.getTrends();
        const alertStats = await TeleQualityRepository.getAlertStats();
        return { overview, connection, trends, alert_stats: alertStats };
    }

    // ═══════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════

    private static async getConsultationOrThrow(consultationId: string): Promise<any> {
        const c = await TeleQualityRepository.getConsultation(consultationId);
        if (!c) throw new AppError(HTTP_STATUS.NOT_FOUND, TELE_QA_ERRORS.CONSULTATION_NOT_FOUND.code, TELE_QA_ERRORS.CONSULTATION_NOT_FOUND.message);
        return c;
    }

    /**
     * Auto-check: tạo alert nếu avg doctor rating dưới ngưỡng
     */
    private static async checkAndCreateAlert(doctorId: string): Promise<void> {
        const avg = await TeleQualityRepository.getRecentDoctorAvg(
            doctorId, QUALITY_THRESHOLDS.MIN_REVIEWS_FOR_ALERT
        );
        if (avg <= 0) return;

        if (avg < QUALITY_THRESHOLDS.LOW_RATING_CRITICAL) {
            const alertId = `QA_AUTO_${uuidv4().substring(0, 8)}`;
            await TeleQualityRepository.createAlert({
                alert_id: alertId,
                alert_type: QUALITY_ALERT_TYPE.LOW_RATING,
                severity: QUALITY_ALERT_SEVERITY.CRITICAL,
                target_type: QUALITY_TARGET_TYPE.DOCTOR,
                target_id: doctorId,
                title: `[CRITICAL] BS có avg rating ${avg}/5 (${QUALITY_THRESHOLDS.MIN_REVIEWS_FOR_ALERT} reviews gần nhất)`,
                description: `Avg doctor_overall < ${QUALITY_THRESHOLDS.LOW_RATING_CRITICAL}. Cần xem xét ngay.`,
                metrics_snapshot: { avg_rating: avg },
            });
        } else if (avg < QUALITY_THRESHOLDS.LOW_RATING_WARNING) {
            const alertId = `QA_AUTO_${uuidv4().substring(0, 8)}`;
            await TeleQualityRepository.createAlert({
                alert_id: alertId,
                alert_type: QUALITY_ALERT_TYPE.LOW_RATING,
                severity: QUALITY_ALERT_SEVERITY.WARNING,
                target_type: QUALITY_TARGET_TYPE.DOCTOR,
                target_id: doctorId,
                title: `[WARNING] BS có avg rating ${avg}/5 (${QUALITY_THRESHOLDS.MIN_REVIEWS_FOR_ALERT} reviews gần nhất)`,
                description: `Avg doctor_overall < ${QUALITY_THRESHOLDS.LOW_RATING_WARNING}. Nên theo dõi.`,
                metrics_snapshot: { avg_rating: avg },
            });
        }
    }
}
