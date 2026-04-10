/**
 * Interfaces cho module Health Timeline (6.2)
 * Dòng thời gian sức khỏe hợp nhất
 */

/** Một sự kiện trên dòng thời gian */
export interface TimelineEvent {
    event_id: string;
    event_type: string;
    event_time: string;
    title: string;
    description: string | null;
    source: 'AUTO' | 'MANUAL';
    /** ID encounter liên quan (null nếu manual event không liên kết) */
    encounter_id: string | null;
    /** ID nguồn gốc (encounters_id, prescription_id, order_id...) */
    source_id: string | null;
    /** Metadata bổ sung theo loại event */
    metadata: Record<string, any> | null;
    /** Người tạo (chỉ có ở manual events) */
    created_by: string | null;
    created_by_name: string | null;
}

/** Kết quả phân trang timeline */
export interface TimelineResult {
    data: TimelineEvent[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

/** Thống kê tổng quan timeline */
export interface TimelineSummary {
    total_events: number;
    total_encounters: number;
    first_event_date: string | null;
    last_event_date: string | null;
    monitoring_months: number;
    events_by_type: Record<string, number>;
}

/** Kết quả theo dõi tiến triển 1 bệnh theo ICD-10 */
export interface TrackConditionResult {
    icd10_code: string;
    condition_name: string | null;
    total_diagnoses: number;
    first_diagnosed: string | null;
    last_diagnosed: string | null;
    related_events: TimelineEvent[];
}

/** Input tạo event thủ công */
export interface CreateTimelineEventInput {
    event_type: string;
    event_time: string;
    title: string;
    description?: string;
    metadata?: Record<string, any>;
}

/** Bộ lọc timeline */
export interface TimelineFilters {
    event_type?: string;
    from_date?: string;
    to_date?: string;
    page: number;
    limit: number;
}
