/**
 * Dịch vụ triển khai tại cơ sở (Map với Master Service)
 */
export interface FacilityService {
    facility_services_id: string;
    facility_id: string;
    service_id: string;
    department_id: string | null;
    base_price: string;
    insurance_price: string | null;
    vip_price: string | null;
    estimated_duration_minutes: number;
    is_active: boolean;
    service_code?: string;
    service_name?: string;
    service_group?: string;
}

export interface CreateFacilityServiceInput {
    facility_id: string;
    service_id: string;
    department_id?: string;
    base_price: number;
    insurance_price?: number;
    vip_price?: number;
    estimated_duration_minutes?: number;
    is_active?: boolean;
}

export interface UpdateFacilityServiceInput {
    department_id?: string;
    base_price?: number;
    insurance_price?: number;
    vip_price?: number;
    estimated_duration_minutes?: number;
    is_active?: boolean;
}

export interface PaginatedFacilityServices {
    data: FacilityService[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
