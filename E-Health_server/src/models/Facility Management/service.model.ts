/**
 * Danh mục chuẩn dịch vụ kỹ thuật Y tế (Thông tư BYT)
 */
export interface MasterService {
    services_id: string;
    code: string;
    name: string;
    service_group: string | null;
    service_type: string | null;
    insurance_code: string | null;
    description: string | null;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date | null;
}

export interface CreateServiceInput {
    code: string;
    name: string;
    service_group?: string;
    service_type?: string;
    insurance_code?: string;
    description?: string;
    is_active?: boolean;
}

export interface UpdateServiceInput {
    name?: string;
    service_group?: string;
    service_type?: string;
    insurance_code?: string;
    description?: string;
    is_active?: boolean;
}

export interface PaginatedServices {
    data: MasterService[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
