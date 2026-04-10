import { HealthTimelineRepository } from '../../repository/EHR/health-timeline.repository';
import {
    TimelineEvent,
    TimelineResult,
    TimelineSummary,
    TrackConditionResult,
    CreateTimelineEventInput,
    TimelineFilters,
} from '../../models/EHR/health-timeline.model';
import {
    MANUAL_EVENT_TYPE,
    TIMELINE_ERRORS,
    TIMELINE_CONFIG,
} from '../../constants/health-timeline.constant';

/**
 * Service cho module Health Timeline (6.2)
 * Xử lý logic nghiệp vụ: validate, phân trang, gọi repository
 */
export class HealthTimelineService {

    /** Validate bệnh nhân tồn tại */
    private static async validatePatient(patientId: string): Promise<void> {
        const exists = await HealthTimelineRepository.patientExists(patientId);
        if (!exists) throw new Error(TIMELINE_ERRORS.PATIENT_NOT_FOUND);
    }

    // API 1: DÒNG THỜI GIAN HỢP NHẤT

    /**
     * Lấy timeline hợp nhất với phân trang và filter.
     * Gộp events tự động (11 bảng) + events thủ công (DB).
     */
    static async getTimeline(
        patientId: string,
        page: number = TIMELINE_CONFIG.DEFAULT_PAGE,
        limit: number = TIMELINE_CONFIG.DEFAULT_LIMIT,
        eventType?: string,
        fromDate?: string,
        toDate?: string
    ): Promise<TimelineResult> {
        await this.validatePatient(patientId);

        const safeLimit = Math.min(limit, TIMELINE_CONFIG.MAX_LIMIT);
        const filters: TimelineFilters = {
            event_type: eventType,
            from_date: fromDate,
            to_date: toDate,
            page,
            limit: safeLimit,
        };

        const { data, total } = await HealthTimelineRepository.getUnifiedTimeline(patientId, filters);

        return {
            data,
            total,
            page,
            limit: safeLimit,
            total_pages: Math.ceil(total / safeLimit),
        };
    }

    // API 2: THỐNG KÊ TIMELINE

    /** Thống kê tổng quan: tổng events, phân bổ, thời gian theo dõi */
    static async getTimelineSummary(patientId: string): Promise<TimelineSummary> {
        await this.validatePatient(patientId);
        return HealthTimelineRepository.getTimelineSummary(patientId);
    }

    // API 3: EVENTS THEO ENCOUNTER

    /** Lấy events thuộc 1 encounter cụ thể */
    static async getByEncounter(patientId: string, encounterId: string): Promise<TimelineEvent[]> {
        await this.validatePatient(patientId);

        const belongs = await HealthTimelineRepository.encounterBelongsToPatient(encounterId, patientId);
        if (!belongs) throw new Error(TIMELINE_ERRORS.ENCOUNTER_NOT_FOUND);

        return HealthTimelineRepository.getEventsByEncounter(patientId, encounterId);
    }

    // API 4: THEO DÕI TIẾN TRIỂN BỆNH

    /**
     * Lọc timeline theo 1 mã ICD-10 xuyên suốt thời gian.
     * Hiển thị chẩn đoán + đơn thuốc + CLS + ghi nhận diễn tiến liên quan.
     */
    static async trackCondition(
        patientId: string,
        icd10Code: string,
        fromDate?: string,
        toDate?: string
    ): Promise<TrackConditionResult> {
        await this.validatePatient(patientId);

        if (!icd10Code || icd10Code.trim() === '') {
            throw new Error(TIMELINE_ERRORS.ICD10_REQUIRED);
        }

        return HealthTimelineRepository.trackCondition(patientId, icd10Code.trim(), fromDate, toDate);
    }

    // API 5: THÊM EVENT THỦ CÔNG

    /** Tạo event thủ công trên timeline */
    static async createManualEvent(
        patientId: string,
        userId: string,
        input: CreateTimelineEventInput
    ): Promise<TimelineEvent> {
        await this.validatePatient(patientId);

        if (!input.title || input.title.trim() === '') {
            throw new Error(TIMELINE_ERRORS.TITLE_REQUIRED);
        }
        if (!input.event_time) {
            throw new Error(TIMELINE_ERRORS.EVENT_TIME_REQUIRED);
        }

        const validManualTypes = Object.values(MANUAL_EVENT_TYPE);
        if (!validManualTypes.includes(input.event_type as any)) {
            throw new Error(TIMELINE_ERRORS.INVALID_EVENT_TYPE);
        }

        return HealthTimelineRepository.createManualEvent(patientId, userId, input);
    }

    // API 6: XÓA EVENT THỦ CÔNG

    /** Soft delete event thủ công. Events tự động không thể xóa. */
    static async deleteManualEvent(patientId: string, eventId: string): Promise<void> {
        await this.validatePatient(patientId);

        const event = await HealthTimelineRepository.findManualEventById(eventId);
        if (!event) throw new Error(TIMELINE_ERRORS.EVENT_NOT_FOUND);
        if (event.patient_id !== patientId) throw new Error(TIMELINE_ERRORS.EVENT_NOT_BELONG);

        await HealthTimelineRepository.deleteManualEvent(eventId);
    }
}
