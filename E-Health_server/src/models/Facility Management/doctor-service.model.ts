/**
 * Liên kết N-N giữa Bác sĩ và Dịch vụ cơ sở (Facility Service)
 */
export interface DoctorService {
    doctor_id: string;
    facility_service_id: string;
    is_primary: boolean;
    assigned_by: string | null;
    created_at?: Date;
    service_code?: string;
    service_name?: string;
    service_group?: string;
    base_price?: string;
    insurance_price?: string | null;
    vip_price?: string | null;
    department_id?: string | null;
    doctor_name?: string;
}

export interface AssignDoctorServicesInput {
    facility_service_ids: string[];
    is_primary?: boolean;
}
