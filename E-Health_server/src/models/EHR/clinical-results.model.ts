// Kết quả CLS tổng hợp (join medical_orders + medical_order_results)

export interface ClinicalResultItem {
    medical_orders_id: string;
    encounter_id: string;
    service_code: string;
    service_name: string;
    order_type: string;
    priority: string;
    status: string;
    clinical_indicator: string | null;
    notes: string | null;
    ordered_by: string;
    ordered_at: string;
    orderer_name: string | null;
    doctor_name: string | null;
    encounter_start: string | null;
    // Kết quả (null nếu chưa có)
    result_id: string | null;
    result_summary: string | null;
    result_details: Record<string, any> | null;
    attachment_urls: string[] | null;
    performed_by: string | null;
    performed_at: string | null;
    performer_name: string | null;
}

// Chi tiết đầy đủ 1 kết quả
export interface ClinicalResultDetail extends ClinicalResultItem {
    patient_id: string;
    patient_name: string | null;
}

// Điểm dữ liệu cho biểu đồ xu hướng
export interface TrendDataPoint {
    performed_at: string;
    result_summary: string | null;
    result_details: Record<string, any> | null;
    encounter_id: string;
    ordered_at: string;
}

// Thống kê tổng quan
export interface ClinicalResultsSummary {
    total_orders: number;
    total_with_results: number;
    total_pending: number;
    total_in_progress: number;
    total_completed: number;
    total_cancelled: number;
    by_order_type: { order_type: string; count: number }[];
    latest_order_at: string | null;
    latest_result_at: string | null;
}

// File đính kèm kèm metadata
export interface AttachmentItem {
    medical_orders_id: string;
    service_code: string;
    service_name: string;
    order_type: string;
    attachment_urls: string[];
    performed_at: string | null;
    performer_name: string | null;
}

// Kết quả bất thường
export interface AbnormalResultItem {
    medical_orders_id: string;
    service_code: string;
    service_name: string;
    order_type: string;
    ordered_at: string;
    result_summary: string | null;
    result_details: Record<string, any> | null;
    performed_at: string | null;
    performer_name: string | null;
}

// Filters
export interface ClinicalResultFilters {
    order_type?: string;
    service_code?: string;
    status?: string;
    from_date?: string;
    to_date?: string;
    page: number;
    limit: number;
}
