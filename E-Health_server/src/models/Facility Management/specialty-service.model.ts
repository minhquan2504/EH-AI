/**
 * Liên kết N-N giữa Chuyên khoa và Dịch vụ chuẩn
 */
export interface SpecialtyService {
    specialty_id: string;
    service_id: string;
    created_at?: Date;
    service_code?: string;
    service_name?: string;
    service_group?: string;
    service_type?: string;
    specialty_code?: string;
    specialty_name?: string;
}

export interface AssignSpecialtyServicesInput {
    service_ids: string[];
}
