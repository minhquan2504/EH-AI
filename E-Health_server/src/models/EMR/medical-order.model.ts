/**
 * Interfaces cho module Chỉ định dịch vụ y tế (Medical Orders 4.4)
 */

/** Bản ghi chỉ định CLS */
export interface MedicalOrderRecord {
    medical_orders_id: string;
    encounter_id: string;
    service_code: string;
    service_name: string;
    service_id: string | null;
    order_type: string;
    clinical_indicator: string | null;
    priority: string;
    status: string;
    notes: string | null;
    cancelled_reason: string | null;
    ordered_by: string;
    ordered_at: string;
    updated_at: string;

    orderer_name?: string;
    patient_name?: string;
    patient_id?: string;
    doctor_name?: string;
}

/** Input tạo chỉ định */
export interface CreateOrderInput {
    service_code: string;
    order_type: string;
    clinical_indicator?: string;
    priority?: string;
    notes?: string;
}

/** Input cập nhật chỉ định */
export interface UpdateOrderInput {
    clinical_indicator?: string;
    priority?: string;
    notes?: string;
}

/** Bản ghi kết quả CLS */
export interface OrderResultRecord {
    medical_order_results_id: string;
    order_id: string;
    result_summary: string;
    result_details: Record<string, any> | null;
    attachment_urls: string[] | null;
    performed_by: string;
    performed_at: string;

    performer_name?: string;
}

/** Input ghi kết quả CLS */
export interface CreateOrderResultInput {
    result_summary: string;
    result_details?: Record<string, any>;
    attachment_urls?: string[];
}

/** Input cập nhật kết quả CLS */
export interface UpdateOrderResultInput {
    result_summary?: string;
    result_details?: Record<string, any>;
    attachment_urls?: string[];
}

/** Kết quả tìm kiếm dịch vụ */
export interface ServiceSearchResult {
    services_id: string;
    code: string;
    name: string;
    service_group: string;
    service_type: string;
    description: string | null;
}

/** Tóm tắt chỉ định + kết quả */
export interface OrderSummaryItem {
    medical_orders_id: string;
    service_code: string;
    service_name: string;
    order_type: string;
    priority: string;
    status: string;
    ordered_at: string;
    result_summary: string | null;
    performed_at: string | null;
}
